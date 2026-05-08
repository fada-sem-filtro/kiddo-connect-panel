import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders, json, serviceClient } from "../_shared/asaas.ts";

// Banco Inter envia: { codigoSolicitacao, situacao, dataHora, valorTotalRecebido, ... }
// Public endpoint, sem JWT. Validação por token na URL.
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("token");
    if (!token) return json({ error: "missing token" }, 401);

    const svc = serviceClient();
    const { data: account } = await svc.from("financial_accounts")
      .select("creche_id").eq("provider", "inter").eq("webhook_secret", token).maybeSingle();
    if (!account) return json({ error: "invalid token" }, 401);

    const payload = await req.json();
    // Pode vir como array (lote) ou objeto único
    const events = Array.isArray(payload) ? payload : [payload];

    for (const ev of events) {
      const externalId = ev.codigoSolicitacao || ev.codigo_solicitacao;
      const situacao = ev.situacao || "RECEBIDO";

      // Idempotência via unique index
      const { error: logErr } = await svc.from("financial_webhook_logs").insert({
        creche_id: account.creche_id, provider: "inter",
        event: situacao, external_id: externalId, payload: ev, processed: false,
      });
      if (logErr?.message?.includes("duplicate")) continue;

      if (!externalId) continue;

      const { data: inv } = await svc.from("financial_invoices")
        .select("id, paid_at, cancelled_at, amount")
        .eq("creche_id", account.creche_id).eq("provider", "inter")
        .eq("external_id", externalId).maybeSingle();

      if (inv) {
        const upd: any = { status: situacao, raw_payload: ev };
        if (["RECEBIDO", "MARCADO_RECEBIDO"].includes(situacao) && !inv.paid_at) {
          upd.paid_at = ev.dataHora || ev.dataPagamento || new Date().toISOString();
          await svc.from("financial_transactions").insert({
            creche_id: account.creche_id, invoice_id: inv.id, transaction_type: "PAYMENT",
            amount: ev.valorTotalRecebido || inv.amount, status: "RECEIVED",
            paid_at: upd.paid_at, raw_payload: ev,
          });
        }
        if (situacao === "CANCELADO" && !inv.cancelled_at) upd.cancelled_at = new Date().toISOString();
        await svc.from("financial_invoices").update(upd).eq("id", inv.id);
      }

      await svc.from("financial_webhook_logs").update({ processed: true })
        .eq("provider", "inter").eq("event", situacao).eq("external_id", externalId);
    }

    return json({ ok: true });
  } catch (e) {
    console.error("inter-webhook", e);
    return json({ error: (e as Error).message }, 500);
  }
});
