import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders, json, getAuthUser, ensureFinanceAdmin, encryptApiKey, asaasFetch, serviceClient } from "../_shared/asaas.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const auth = await getAuthUser(req);
    if (!auth) return json({ error: "Unauthorized" }, 401);
    const body = await req.json();
    const { creche_id, api_key, environment } = body || {};
    if (!creche_id || !api_key || !["production", "sandbox"].includes(environment)) {
      return json({ error: "Parâmetros inválidos" }, 400);
    }
    if (!(await ensureFinanceAdmin(auth.userId, creche_id))) return json({ error: "Forbidden" }, 403);

    // Validate against Asaas
    const v = await asaasFetch(api_key, environment, "/myAccount");
    if (!v.ok) return json({ error: "Chave inválida ou Asaas indisponível", details: v.data }, 400);

    const accountName = v.data?.name || v.data?.companyName || null;
    const accountEmail = v.data?.email || null;

    const enc = await encryptApiKey(api_key);
    const last4 = api_key.slice(-4);

    const svc = serviceClient();
    // Upsert settings
    const { data: existing } = await svc.from("financial_settings").select("id, asaas_webhook_token, asaas_webhook_id").eq("creche_id", creche_id).maybeSingle();
    const webhookToken = existing?.asaas_webhook_token || crypto.randomUUID();
    const webhookUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/asaas-webhook?token=${webhookToken}`;

    // Register webhook on Asaas (best-effort; ignore failure)
    let webhookId = existing?.asaas_webhook_id || null;
    try {
      const wh = await asaasFetch(api_key, environment, "/webhooks", {
        method: "POST",
        body: JSON.stringify({
          name: "Agenda Fleur",
          url: webhookUrl,
          email: accountEmail || "contato@agendafleur.app",
          enabled: true,
          interrupted: false,
          authToken: webhookToken,
          sendType: "SEQUENTIALLY",
          events: ["PAYMENT_CREATED", "PAYMENT_UPDATED", "PAYMENT_RECEIVED", "PAYMENT_CONFIRMED", "PAYMENT_OVERDUE", "PAYMENT_DELETED", "PAYMENT_REFUNDED"],
        }),
      });
      if (wh.ok && wh.data?.id) webhookId = wh.data.id;
    } catch (_) { /* ignore */ }

    const payload = {
      creche_id,
      asaas_api_key_encrypted: enc.ciphertext,
      asaas_api_key_iv: enc.iv,
      asaas_api_key_tag: enc.tag,
      asaas_api_key_last4: last4,
      asaas_environment: environment,
      asaas_connected: true,
      asaas_account_name: accountName,
      asaas_account_email: accountEmail,
      asaas_last_validation: new Date().toISOString(),
      asaas_webhook_token: webhookToken,
      asaas_webhook_id: webhookId,
    };
    if (existing) {
      await svc.from("financial_settings").update(payload).eq("id", existing.id);
    } else {
      await svc.from("financial_settings").insert(payload);
    }

    return json({ ok: true, account_name: accountName, last4 });
  } catch (e) {
    console.error("asaas-connect", e);
    return json({ error: (e as Error).message }, 500);
  }
});
