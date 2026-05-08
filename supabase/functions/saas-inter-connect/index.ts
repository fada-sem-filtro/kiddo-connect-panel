import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders, json, getAuthUser, encryptApiKey, serviceClient } from "../_shared/asaas.ts";
import { ensureAdmin, saveSaasCertToStorage, pemSanitize, looksLikeCertificate, looksLikePrivateKey, clearSaasInterTokenCache } from "../_shared/saas-inter.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const auth = await getAuthUser(req);
    if (!auth) return json({ error: "Unauthorized" }, 401);
    if (!(await ensureAdmin(auth.userId))) return json({ error: "Forbidden" }, 403);

    const body = await req.json();
    const { client_id, client_secret, certificate, private_key, environment, conta_corrente } = body || {};
    if (!client_id || !client_secret || !certificate || !private_key) {
      return json({ error: "Parâmetros inválidos" }, 400);
    }

    const cert = pemSanitize(String(certificate));
    const key = pemSanitize(String(private_key));
    if (!looksLikeCertificate(cert)) return json({ error: "Certificado .crt inválido" }, 400);
    if (!looksLikePrivateKey(key)) return json({ error: "Chave .key inválida" }, 400);

    const { certPath, keyPath } = await saveSaasCertToStorage(cert, key);
    const enc = await encryptApiKey(String(client_secret));

    const svc = serviceClient();
    const { data: existing } = await svc.from("saas_financial_account").select("id").limit(1).maybeSingle();
    const payload: any = {
      provider: "inter",
      client_id,
      encrypted_client_secret: enc.ciphertext,
      client_secret_iv: enc.iv,
      client_secret_tag: enc.tag,
      certificate_path: certPath,
      private_key_path: keyPath,
      environment: environment === "sandbox" ? "sandbox" : "production",
      conta_corrente: conta_corrente || null,
      connected: true,
      last_validation: new Date().toISOString(),
      last_error: null,
    };
    if (existing?.id) {
      await svc.from("saas_financial_account").update(payload).eq("id", existing.id);
    } else {
      await svc.from("saas_financial_account").insert(payload);
    }
    clearSaasInterTokenCache();
    return json({ ok: true });
  } catch (e) {
    console.error("saas-inter-connect", e);
    return json({ error: (e as Error).message }, 500);
  }
});
