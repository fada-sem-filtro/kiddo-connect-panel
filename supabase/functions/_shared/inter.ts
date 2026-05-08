// Banco Inter PJ integration helpers.
// OAuth2 Client Credentials + mTLS (cert.crt + key.key in Supabase Storage).

import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { decryptApiKey, encryptApiKey, serviceClient } from "./asaas.ts";

export const INTER_BASE_URL_PROD = "https://cdpj.partners.bancointer.com.br";
export const INTER_BASE_URL_SANDBOX = "https://cdpj-sandbox.partners.uatinter.co";
export const INTER_BASE_URL = INTER_BASE_URL_PROD; // default fallback
export const INTER_CERT_BUCKET = "inter-certificates";

export function interBaseUrl(env?: string | null): string {
  return env === "sandbox" ? INTER_BASE_URL_SANDBOX : INTER_BASE_URL_PROD;
}

export const INTER_SCOPES = [
  "boleto-cobranca.read",
  "boleto-cobranca.write",
  "webhook-cobranca.read",
  "webhook-cobranca.write",
  "pix.cob.read",
  "pix.cob.write",
].join(" ");

// In-memory token cache keyed by creche_id (per-isolate)
const tokenCache = new Map<string, { token: string; expiresAt: number }>();

export interface InterAccount {
  id: string;
  creche_id: string;
  client_id: string;
  client_secret: string; // decrypted
  cert: string; // PEM
  key: string; // PEM
  conta_corrente?: string | null;
  webhook_secret: string;
  environment?: string | null;
}

// ---------- Storage helpers ----------

export async function saveCertToStorage(
  crecheId: string,
  certPem: string,
  keyPem: string,
): Promise<{ certPath: string; keyPath: string }> {
  const svc = serviceClient();
  const certPath = `${crecheId}/cert.crt`;
  const keyPath = `${crecheId}/key.key`;

  const certUp = await svc.storage.from(INTER_CERT_BUCKET).upload(
    certPath,
    new Blob([certPem], { type: "application/x-pem-file" }),
    { upsert: true, contentType: "application/x-pem-file" },
  );
  if (certUp.error) throw new Error("Falha ao salvar certificado: " + certUp.error.message);

  const keyUp = await svc.storage.from(INTER_CERT_BUCKET).upload(
    keyPath,
    new Blob([keyPem], { type: "application/x-pem-file" }),
    { upsert: true, contentType: "application/x-pem-file" },
  );
  if (keyUp.error) throw new Error("Falha ao salvar chave privada: " + keyUp.error.message);

  return { certPath, keyPath };
}

export async function loadCertFromStorage(
  certPath: string,
  keyPath: string,
): Promise<{ cert: string; key: string }> {
  const svc = serviceClient();
  const certRes = await svc.storage.from(INTER_CERT_BUCKET).download(certPath);
  if (certRes.error || !certRes.data) throw new Error("Certificado não encontrado");
  const keyRes = await svc.storage.from(INTER_CERT_BUCKET).download(keyPath);
  if (keyRes.error || !keyRes.data) throw new Error("Chave privada não encontrada");
  return {
    cert: await certRes.data.text(),
    key: await keyRes.data.text(),
  };
}

export async function deleteCertFromStorage(crecheId: string): Promise<void> {
  const svc = serviceClient();
  await svc.storage.from(INTER_CERT_BUCKET).remove([
    `${crecheId}/cert.crt`,
    `${crecheId}/key.key`,
  ]);
}

// ---------- Account loading ----------

export async function getCrecheInter(crecheId: string): Promise<InterAccount | null> {
  const svc = serviceClient();
  const { data, error } = await svc
    .from("financial_accounts")
    .select("*")
    .eq("creche_id", crecheId)
    .eq("provider", "inter")
    .maybeSingle();
  if (error || !data || !data.connected) return null;
  if (!data.encrypted_client_secret || !data.certificate_path || !data.private_key_path) return null;

  const clientSecret = await decryptApiKey({
    ciphertext: data.encrypted_client_secret,
    iv: data.client_secret_iv,
    tag: data.client_secret_tag,
  });
  const { cert, key } = await loadCertFromStorage(data.certificate_path, data.private_key_path);

  return {
    id: data.id,
    creche_id: data.creche_id,
    client_id: data.client_id,
    client_secret: clientSecret,
    cert,
    key,
    conta_corrente: data.conta_corrente,
    webhook_secret: data.webhook_secret,
    environment: data.environment,
  };
}

// ---------- mTLS HTTP client ----------

// Deno.createHttpClient is unstable but enabled in Supabase edge runtime.
// deno-lint-ignore no-explicit-any
function createMtlsClient(cert: string, key: string): any {
  // @ts-ignore unstable API
  return (Deno as any).createHttpClient({ cert, key });
}

// ---------- OAuth2 token ----------

export async function getInterToken(account: InterAccount): Promise<string> {
  const cached = tokenCache.get(account.creche_id);
  if (cached && cached.expiresAt > Date.now() + 60_000) return cached.token;

  const client = createMtlsClient(account.cert, account.key);
  const body = new URLSearchParams({
    client_id: account.client_id,
    client_secret: account.client_secret,
    scope: INTER_SCOPES,
    grant_type: "client_credentials",
  });

  // @ts-ignore client option is supported in Deno fetch
  const res = await fetch(`${interBaseUrl(account.environment)}/oauth/v2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
    client,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Falha OAuth Inter (${res.status}): ${text}`);
  }
  const json = await res.json();
  const token = json.access_token as string;
  const expiresIn = (json.expires_in as number) ?? 3600;
  tokenCache.set(account.creche_id, { token, expiresAt: Date.now() + expiresIn * 1000 });
  return token;
}

// ---------- Authenticated fetch ----------

export async function interFetch(
  account: InterAccount,
  path: string,
  init: RequestInit = {},
): Promise<{ ok: boolean; status: number; data: any; text: string }> {
  const token = await getInterToken(account);
  const client = createMtlsClient(account.cert, account.key);
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string> | undefined ?? {}),
  };
  if (account.conta_corrente) headers["x-conta-corrente"] = account.conta_corrente;

  // @ts-ignore client option
  const res = await fetch(`${interBaseUrl(account.environment)}${path}`, { ...init, headers, client });
  const text = await res.text();
  let data: any = null;
  try { data = text ? JSON.parse(text) : null; } catch { /* keep raw */ }
  return { ok: res.ok, status: res.status, data, text };
}

// ---------- Encryption re-export ----------

export { encryptApiKey as encryptInterSecret, decryptApiKey as decryptInterSecret };

// ---------- Helpers ----------

export function pemSanitize(input: string): string {
  // Normalize line endings; trim trailing whitespace
  return input.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim() + "\n";
}

export function looksLikeCertificate(pem: string): boolean {
  return pem.includes("-----BEGIN CERTIFICATE-----") && pem.includes("-----END CERTIFICATE-----");
}

export function looksLikePrivateKey(pem: string): boolean {
  return /-----BEGIN (?:RSA |EC |ENCRYPTED )?PRIVATE KEY-----/.test(pem)
    && /-----END (?:RSA |EC |ENCRYPTED )?PRIVATE KEY-----/.test(pem);
}
