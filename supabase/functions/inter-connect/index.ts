import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders, json, getAuthUser, ensureFinanceAdmin, serviceClient } from "../_shared/asaas.ts";
import {
  encryptInterSecret, saveCertToStorage, deleteCertFromStorage,
  pemSanitize, looksLikeCertificate, looksLikePrivateKey,
  INTER_BASE_URL, INTER_SCOPES,
} from "../_shared/inter.ts";

const PROJECT_ID = Deno.env.get("SUPABASE_URL")!.match(/https:\/\/([^.]+)\./)?.[1];
const WEBHOOK_BASE = `https://${PROJECT_ID}.supabase.co/functions/v1/inter-webhook`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const auth = await getAuthUser(req);
    if (!auth) return json({ error: "Unauthorized" }, 401);

    const body = await req.json();
    const { creche_id, client_id, client_secret, certificate, private_key, conta_corrente, environment } = body;

    if (!creche_id || !client_id || !client_secret || !certificate || !private_key) {
      return json({ error: "Parâmetros obrigatórios ausentes" }, 400);
    }
    if (!(await ensureFinanceAdmin(auth.userId, creche_id))) return json({ error: "Forbidden" }, 403);

    const cert = pemSanitize(certificate);
    const key = pemSanitize(private_key);
    if (!looksLikeCertificate(cert)) return json({ error: "Certificado inválido (esperado .crt no formato PEM)" }, 400);
    if (!looksLikePrivateKey(key)) return json({ error: "Chave privada inválida (esperado .key no formato PEM)" }, 400);
    if (cert.length > 100_000 || key.length > 100_000) return json({ error: "Arquivo muito grande (máx 100KB)" }, 400);

    // Save certs to storage first (needed for mTLS test call)
    const { certPath, keyPath } = await saveCertToStorage(creche_id, cert, key);

    // Test OAuth via direct call (without saving to DB yet)
    // @ts-ignore unstable
    const httpClient = (Deno as any).createHttpClient({ cert, key });
    const tokenBody = new URLSearchParams({
      client_id, client_secret, scope: INTER_SCOPES, grant_type: "client_credentials",
    });
    let tokenRes: Response;
    try {
      // @ts-ignore client option
      tokenRes = await fetch(`${INTER_BASE_URL}/oauth/v2/token`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: tokenBody.toString(),
        client: httpClient,
      });
    } catch (e) {
      await deleteCertFromStorage(creche_id);
      const msg = (e as Error).message || "";
      const isUnknownCa = /UnknownCA|unknown ca|bad certificate|certificate required/i.test(msg);
      return json({
        error: isUnknownCa
          ? "Certificado rejeitado pelo Banco Inter (UnknownCA). O Inter não reconhece este certificado como válido."
          : "Falha de conexão mTLS com Banco Inter",
        hint: isUnknownCa
          ? "Baixe o certificado correto em: Internet Banking PJ → Aplicações → [sua app] → Certificado Digital. Use exatamente os arquivos 'Inter API_Cert.crt' e 'Inter API_Key.key' fornecidos pelo Inter (não gere um certificado próprio nem envie o .csr)."
          : undefined,
        details: msg,
      }, 400);
    }

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      await deleteCertFromStorage(creche_id);
      return json({ error: "Credenciais Inter inválidas", details: errText, status: tokenRes.status }, 400);
    }
    await tokenRes.json();

    // Encrypt secret and persist
    const enc = await encryptInterSecret(client_secret);
    const svc = serviceClient();

    const { data: existing } = await svc
      .from("financial_accounts").select("id, webhook_secret")
      .eq("creche_id", creche_id).eq("provider", "inter").maybeSingle();

    const payload = {
      creche_id,
      provider: "inter",
      client_id,
      encrypted_client_secret: enc.ciphertext,
      client_secret_iv: enc.iv,
      client_secret_tag: enc.tag,
      certificate_path: certPath,
      private_key_path: keyPath,
      conta_corrente: conta_corrente || null,
      environment: environment || "production",
      connected: true,
      last_validation: new Date().toISOString(),
      last_error: null,
      account_name: "Banco Inter PJ",
    };

    let accountId: string;
    let webhookSecret: string;
    if (existing) {
      const { data, error } = await svc.from("financial_accounts")
        .update(payload).eq("id", existing.id).select("id, webhook_secret").single();
      if (error) throw error;
      accountId = data.id; webhookSecret = data.webhook_secret;
    } else {
      const { data, error } = await svc.from("financial_accounts")
        .insert(payload).select("id, webhook_secret").single();
      if (error) throw error;
      accountId = data.id; webhookSecret = data.webhook_secret;
    }

    return json({
      ok: true,
      account_id: accountId,
      webhook_url: `${WEBHOOK_BASE}?token=${webhookSecret}`,
    });
  } catch (e) {
    console.error("inter-connect", e);
    return json({ error: (e as Error).message }, 500);
  }
});
