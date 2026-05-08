// Banco Inter PJ helpers - DEDICADO para o financeiro SaaS da Agenda Fleur.
// Usa singleton de credenciais em saas_financial_account.
import { decryptApiKey, encryptApiKey, serviceClient } from "./asaas.ts";

export const INTER_BASE_URL = "https://cdpj.partners.bancointer.com.br";
export const SAAS_INTER_CERT_BUCKET = "saas-inter-certificates";

export const INTER_SCOPES = [
  "boleto-cobranca.read",
  "boleto-cobranca.write",
  "webhook-cobranca.read",
  "webhook-cobranca.write",
  "pix.cob.read",
  "pix.cob.write",
  "cob.read",
  "cob.write",
].join(" ");

let cachedToken: { token: string; expiresAt: number } | null = null;

export interface SaasInterAccount {
  id: string;
  client_id: string;
  client_secret: string;
  cert: string;
  key: string;
  conta_corrente?: string | null;
  webhook_secret: string;
  environment: string;
}

export async function saveSaasCertToStorage(certPem: string, keyPem: string) {
  const svc = serviceClient();
  const certPath = `agenda-fleur/cert.crt`;
  const keyPath = `agenda-fleur/key.key`;
  const c = await svc.storage.from(SAAS_INTER_CERT_BUCKET).upload(
    certPath, new Blob([certPem], { type: "application/x-pem-file" }),
    { upsert: true, contentType: "application/x-pem-file" });
  if (c.error) throw new Error("Falha ao salvar certificado: " + c.error.message);
  const k = await svc.storage.from(SAAS_INTER_CERT_BUCKET).upload(
    keyPath, new Blob([keyPem], { type: "application/x-pem-file" }),
    { upsert: true, contentType: "application/x-pem-file" });
  if (k.error) throw new Error("Falha ao salvar chave privada: " + k.error.message);
  return { certPath, keyPath };
}

export async function loadSaasCertFromStorage(certPath: string, keyPath: string) {
  const svc = serviceClient();
  const c = await svc.storage.from(SAAS_INTER_CERT_BUCKET).download(certPath);
  if (c.error || !c.data) throw new Error("Certificado SaaS não encontrado");
  const k = await svc.storage.from(SAAS_INTER_CERT_BUCKET).download(keyPath);
  if (k.error || !k.data) throw new Error("Chave privada SaaS não encontrada");
  return { cert: await c.data.text(), key: await k.data.text() };
}

export async function deleteSaasCertFromStorage() {
  const svc = serviceClient();
  await svc.storage.from(SAAS_INTER_CERT_BUCKET).remove([
    "agenda-fleur/cert.crt",
    "agenda-fleur/key.key",
  ]);
}

export async function getSaasInterAccount(): Promise<SaasInterAccount | null> {
  const svc = serviceClient();
  const { data } = await svc.from("saas_financial_account").select("*").limit(1).maybeSingle();
  if (!data || !data.connected) return null;
  if (!data.encrypted_client_secret || !data.certificate_path || !data.private_key_path) return null;
  const clientSecret = await decryptApiKey({
    ciphertext: data.encrypted_client_secret,
    iv: data.client_secret_iv,
    tag: data.client_secret_tag,
  });
  const { cert, key } = await loadSaasCertFromStorage(data.certificate_path, data.private_key_path);
  return {
    id: data.id,
    client_id: data.client_id,
    client_secret: clientSecret,
    cert, key,
    conta_corrente: data.conta_corrente,
    webhook_secret: data.webhook_secret,
    environment: data.environment,
  };
}

// deno-lint-ignore no-explicit-any
function createMtlsClient(cert: string, key: string): any {
  // @ts-ignore unstable
  return (Deno as any).createHttpClient({ cert, key });
}

export async function getSaasInterToken(account: SaasInterAccount): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.token;
  const client = createMtlsClient(account.cert, account.key);
  const body = new URLSearchParams({
    client_id: account.client_id,
    client_secret: account.client_secret,
    scope: INTER_SCOPES,
    grant_type: "client_credentials",
  });
  // @ts-ignore client option
  const res = await fetch(`${INTER_BASE_URL}/oauth/v2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
    client,
  });
  if (!res.ok) throw new Error(`OAuth Inter SaaS (${res.status}): ${await res.text()}`);
  const j = await res.json();
  cachedToken = { token: j.access_token, expiresAt: Date.now() + ((j.expires_in ?? 3600) * 1000) };
  return j.access_token;
}

export function clearSaasInterTokenCache() { cachedToken = null; }

export async function saasInterFetch(
  account: SaasInterAccount, path: string, init: RequestInit = {},
): Promise<{ ok: boolean; status: number; data: any; text: string }> {
  const token = await getSaasInterToken(account);
  const client = createMtlsClient(account.cert, account.key);
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string> | undefined ?? {}),
  };
  if (account.conta_corrente) headers["x-conta-corrente"] = account.conta_corrente;
  // @ts-ignore client option
  const res = await fetch(`${INTER_BASE_URL}${path}`, { ...init, headers, client });
  const text = await res.text();
  let data: any = null;
  try { data = text ? JSON.parse(text) : null; } catch { /* keep raw */ }
  return { ok: res.ok, status: res.status, data, text };
}

export { encryptApiKey };

export function pemSanitize(s: string) {
  return s.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim() + "\n";
}
export function looksLikeCertificate(p: string) {
  return p.includes("-----BEGIN CERTIFICATE-----") && p.includes("-----END CERTIFICATE-----");
}
export function looksLikePrivateKey(p: string) {
  return /-----BEGIN (?:RSA |EC |ENCRYPTED )?PRIVATE KEY-----/.test(p)
    && /-----END (?:RSA |EC |ENCRYPTED )?PRIVATE KEY-----/.test(p);
}

// Admin guard
export async function ensureAdmin(userId: string): Promise<boolean> {
  const svc = serviceClient();
  const { data } = await svc.rpc("has_role", { _user_id: userId, _role: "admin" });
  return !!data;
}
