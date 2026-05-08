import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders, json, getAuthUser, serviceClient } from "../_shared/asaas.ts";
import { ensureAdmin, getSaasInterAccount, saasInterFetch } from "../_shared/saas-inter.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const auth = await getAuthUser(req);
    if (!auth) return json({ error: "Unauthorized" }, 401);
    if (!(await ensureAdmin(auth.userId))) return json({ error: "Forbidden" }, 403);
    const { invoice_id } = await req.json();
    const svc = serviceClient();
    const { data: inv } = await svc.from("saas_invoices").select("*").eq("id", invoice_id).maybeSingle();
    if (!inv?.external_id) return json({ error: "Cobrança sem external_id" }, 400);
    const account = await getSaasInterAccount();
    if (!account) return json({ error: "Inter desconectado" }, 400);
    const r = await saasInterFetch(account, `/cobranca/v3/cobrancas/${inv.external_id}`, { method: "GET" });
    if (!r.ok) return json({ error: "Falha consulta", details: r.data }, 400);
    const c = r.data?.cobranca || {};
    const upd: any = { status: c.situacao || inv.status, raw_payload: r.data };
    if (["RECEBIDO", "MARCADO_RECEBIDO"].includes(c.situacao) && !inv.paid_at) {
      upd.paid_at = c.dataSituacao || new Date().toISOString();
      await svc.from("saas_transactions").insert({
        invoice_id: inv.id, transaction_type: "PAYMENT",
        amount: inv.amount, status: "CONFIRMED", paid_at: upd.paid_at, raw_payload: r.data,
      });
    }
    await svc.from("saas_invoices").update(upd).eq("id", inv.id);
    return json({ ok: true, status: c.situacao, data: r.data });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
