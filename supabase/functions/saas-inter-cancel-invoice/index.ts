import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders, json, getAuthUser, serviceClient } from "../_shared/asaas.ts";
import { ensureAdmin, getSaasInterAccount, saasInterFetch } from "../_shared/saas-inter.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const auth = await getAuthUser(req);
    if (!auth) return json({ error: "Unauthorized" }, 401);
    if (!(await ensureAdmin(auth.userId))) return json({ error: "Forbidden" }, 403);
    const { invoice_id, motivo } = await req.json();
    const svc = serviceClient();
    const { data: inv } = await svc.from("saas_invoices").select("*").eq("id", invoice_id).maybeSingle();
    if (!inv?.external_id) return json({ error: "Sem external_id" }, 400);
    const account = await getSaasInterAccount();
    if (!account) return json({ error: "Inter desconectado" }, 400);
    const r = await saasInterFetch(account, `/cobranca/v3/cobrancas/${inv.external_id}/cancelar`, {
      method: "POST",
      body: JSON.stringify({ motivoCancelamento: motivo || "Cancelado pelo administrador" }),
    });
    if (!r.ok) return json({ error: "Falha ao cancelar", details: r.data }, 400);
    await svc.from("saas_invoices").update({
      status: "CANCELADO", cancelled_at: new Date().toISOString(),
    }).eq("id", inv.id);
    return json({ ok: true });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
