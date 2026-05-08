import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders, json, serviceClient, getAuthUser, ensureFinanceAdmin } from "../_shared/asaas.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const auth = await getAuthUser(req);
    if (!auth) return json({ error: "unauthorized" }, 401);

    const { log_id } = await req.json();
    if (!log_id) return json({ error: "missing log_id" }, 400);

    const svc = serviceClient();
    const { data: log, error: logErr } = await svc.from("financial_webhook_logs")
      .select("*").eq("id", log_id).maybeSingle();
    if (logErr || !log) return json({ error: "log not found" }, 404);
    if (log.provider !== "inter") return json({ error: "only inter logs can be reprocessed here" }, 400);
    if (log.creche_id && !(await ensureFinanceAdmin(auth.userId, log.creche_id))) {
      return json({ error: "forbidden" }, 403);
    }

    const ev = log.payload || {};
    const externalId = ev.codigoSolicitacao || ev.codigo_solicitacao || log.external_id;
    const situacao = ev.situacao || log.event || "RECEBIDO";

    if (!externalId) {
      await svc.from("financial_webhook_logs").update({ error: "no external_id in payload" }).eq("id", log_id);
      return json({ error: "no external_id in payload" }, 400);
    }

    const { data: inv } = await svc.from("financial_invoices")
      .select("id, paid_at, cancelled_at, amount")
      .eq("creche_id", log.creche_id).eq("provider", "inter")
      .eq("external_id", externalId).maybeSingle();

    if (!inv) {
      await svc.from("financial_webhook_logs").update({ error: "invoice not found", processed: false }).eq("id", log_id);
      return json({ error: "invoice not found for external_id" }, 404);
    }

    const upd: any = { status: situacao, raw_payload: ev };
    if (["RECEBIDO", "MARCADO_RECEBIDO"].includes(situacao) && !inv.paid_at) {
      upd.paid_at = ev.dataHora || ev.dataPagamento || new Date().toISOString();
      await svc.from("financial_transactions").insert({
        creche_id: log.creche_id, invoice_id: inv.id, transaction_type: "PAYMENT",
        amount: ev.valorTotalRecebido || inv.amount, status: "RECEIVED",
        paid_at: upd.paid_at, raw_payload: ev,
      });
    }
    if (situacao === "CANCELADO" && !inv.cancelled_at) upd.cancelled_at = new Date().toISOString();
    await svc.from("financial_invoices").update(upd).eq("id", inv.id);

    await svc.from("financial_webhook_logs").update({ processed: true, error: null }).eq("id", log_id);

    return json({ ok: true });
  } catch (e) {
    console.error("inter-reprocess-webhook", e);
    return json({ error: (e as Error).message }, 500);
  }
});
