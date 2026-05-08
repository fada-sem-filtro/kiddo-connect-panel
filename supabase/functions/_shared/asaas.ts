// Shared helpers for Asaas integration
// AES-256-GCM encryption + multi-tenant fetch wrapper.

import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, asaas-access-token",
};

export const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

// ---------- Crypto (AES-256-GCM) ----------

function getKeyMaterial(): Uint8Array {
  const raw = Deno.env.get("ENCRYPTION_KEY");
  if (!raw) throw new Error("ENCRYPTION_KEY not configured");
  // Accept base64 or hex; fallback to UTF-8 of 32 chars.
  try {
    const bin = atob(raw);
    if (bin.length === 32) return Uint8Array.from(bin, (c) => c.charCodeAt(0));
  } catch (_) { /* not base64 */ }
  if (/^[0-9a-fA-F]{64}$/.test(raw)) {
    const arr = new Uint8Array(32);
    for (let i = 0; i < 32; i++) arr[i] = parseInt(raw.substr(i * 2, 2), 16);
    return arr;
  }
  // SHA-256 the input as last resort
  const enc = new TextEncoder().encode(raw);
  const buf = new Uint8Array(32);
  buf.set(enc.slice(0, 32));
  return buf;
}

async function getCryptoKey(): Promise<CryptoKey> {
  const km = getKeyMaterial();
  return await crypto.subtle.importKey("raw", km, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}

const b64 = {
  enc: (u: Uint8Array) => btoa(String.fromCharCode(...u)),
  dec: (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0)),
};

export async function encryptApiKey(plain: string): Promise<{ ciphertext: string; iv: string; tag: string }> {
  const key = await getCryptoKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(plain)),
  );
  // Web Crypto appends auth tag; split last 16 bytes as tag for clarity.
  const body = ct.slice(0, ct.length - 16);
  const tag = ct.slice(ct.length - 16);
  return { ciphertext: b64.enc(body), iv: b64.enc(iv), tag: b64.enc(tag) };
}

export async function decryptApiKey(payload: { ciphertext: string; iv: string; tag: string }): Promise<string> {
  const key = await getCryptoKey();
  const body = b64.dec(payload.ciphertext);
  const tag = b64.dec(payload.tag);
  const iv = b64.dec(payload.iv);
  const full = new Uint8Array(body.length + tag.length);
  full.set(body, 0);
  full.set(tag, body.length);
  const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, full);
  return new TextDecoder().decode(pt);
}

// ---------- Supabase service client ----------

export function serviceClient(): SupabaseClient {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}

// ---------- Auth helper ----------

export async function getAuthUser(req: Request): Promise<{ userId: string; client: SupabaseClient } | null> {
  const auth = req.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  const client = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: auth } } },
  );
  const token = auth.replace("Bearer ", "");
  const { data, error } = await client.auth.getClaims(token);
  if (error || !data?.claims?.sub) return null;
  return { userId: data.claims.sub as string, client };
}

// Verify the user is admin or diretor/secretaria of the given creche.
export async function ensureFinanceAdmin(userId: string, crecheId: string): Promise<boolean> {
  const svc = serviceClient();
  const { data, error } = await svc.rpc("is_financeiro_admin", { _user_id: userId, _creche_id: crecheId });
  if (error) return false;
  return !!data;
}

// ---------- Asaas fetch ----------

export function asaasBaseUrl(env: string): string {
  return env === "sandbox" ? "https://api-sandbox.asaas.com/v3" : "https://api.asaas.com/v3";
}

export async function asaasFetch(
  apiKey: string,
  env: string,
  path: string,
  init: RequestInit = {},
): Promise<{ ok: boolean; status: number; data: any }> {
  const url = asaasBaseUrl(env) + path;
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "AgendaFleur/1.0",
      access_token: apiKey,
      ...(init.headers || {}),
    },
  });
  let data: any = null;
  try { data = await res.json(); } catch (_) { /* empty */ }
  return { ok: res.ok, status: res.status, data };
}

// Loads + decrypts API key for a creche.
export async function getCrecheAsaas(crecheId: string): Promise<{ apiKey: string; env: string; webhookToken: string } | null> {
  const svc = serviceClient();
  const { data, error } = await svc
    .from("financial_settings")
    .select("asaas_api_key_encrypted, asaas_api_key_iv, asaas_api_key_tag, asaas_environment, asaas_connected, asaas_webhook_token")
    .eq("creche_id", crecheId)
    .maybeSingle();
  if (error || !data || !data.asaas_connected || !data.asaas_api_key_encrypted) return null;
  const apiKey = await decryptApiKey({
    ciphertext: data.asaas_api_key_encrypted,
    iv: data.asaas_api_key_iv!,
    tag: data.asaas_api_key_tag!,
  });
  return { apiKey, env: data.asaas_environment, webhookToken: data.asaas_webhook_token };
}
