import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders, json, getAuthUser, ensureFinanceAdmin, asaasFetch, getCrecheAsaas, serviceClient } from "../_shared/asaas.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const auth = await getAuthUser(req);
    if (!auth) return json({ error: "Unauthorized" }, 401);
    const { creche_id } = await req.json();
    if (!creche_id) return json({ error: "Parâmetros inválidos" }, 400);
    if (!(await ensureFinanceAdmin(auth.userId, creche_id))) return json({ error: "Forbidden" }, 403);

    const cred = await getCrecheAsaas(creche_id);
    const svc = serviceClient();
    const { data: settings } = await svc.from("financial_settings").select("asaas_webhook_id").eq("creche_id", creche_id).maybeSingle();

    if (cred && settings?.asaas_webhook_id) {
      try { await asaasFetch(cred.apiKey, cred.env, `/webhooks/${settings.asaas_webhook_id}`, { method: "DELETE" }); } catch (_) { /* ignore */ }
    }

    await svc.from("financial_settings").update({
      asaas_api_key_encrypted: null, asaas_api_key_iv: null, asaas_api_key_tag: null,
      asaas_api_key_last4: null, asaas_connected: false, asaas_webhook_id: null,
    }).eq("creche_id", creche_id);

    return json({ ok: true });
  } catch (e) {
    console.error("asaas-disconnect", e);
    return json({ error: (e as Error).message }, 500);
  }
});
