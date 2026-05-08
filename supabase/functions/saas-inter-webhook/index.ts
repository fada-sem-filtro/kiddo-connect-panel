import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { corsHeaders, json } from "../_shared/asaas.ts";

// Webhook do Banco Inter para cobrancas SaaS.
// URL contém o webhook_secret: /saas-inter-webhook?secret=UUID
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const url = new URL(req.url);
    const secret = url.searchParams.get("secret");
    const svc = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: account } = await svc.from("saas_financial_account")
      .select("webhook_secret").limit(1).maybeSingle();
    if (!account || account.webhook_secret !== secret) {
      return json({ error: "Forbidden" }, 403);
    }

    const payload = await req.json();
    // Inter pode enviar array ou objeto único
    const events = Array.isArray(payload) ? payload : [payload];

    for (const ev of events) {
      const externalId = ev.codigoSolicitacao || ev.codigoSolicitacaoCobranca || ev.cobranca?.codigoSolicitacao || null;
      const situacao = ev.situacao || ev.cobranca?.situacao || "EVENTO";
      const { data: log } = await svc.from("saas_webhook_logs").insert({
        event: situacao, external_id: externalId, payload: ev, processed: false,
      }).select("id").single();

      try {
        if (!externalId) throw new Error("Sem external_id");
        const { data: inv } = await svc.from("saas_invoices")
          .select("*").eq("external_id", externalId).maybeSingle();
        if (!inv) throw new Error("Cobrança não encontrada");
        const upd: any = { status: situacao, raw_payload: ev };
        if (["RECEBIDO", "MARCADO_RECEBIDO"].includes(situacao) && !inv.paid_at) {
          upd.paid_at = ev.dataHora || ev.cobranca?.dataSituacao || new Date().toISOString();
          await svc.from("saas_transactions").insert({
            invoice_id: inv.id, transaction_type: "PAYMENT",
            amount: inv.amount, status: "CONFIRMED",
            paid_at: upd.paid_at, raw_payload: ev,
          });
          // Reativa assinatura se estava past_due
          if (inv.subscription_id) {
            await svc.from("saas_subscriptions").update({ status: "active" })
              .eq("id", inv.subscription_id).eq("status", "past_due");
          }
        }
        await svc.from("saas_invoices").update(upd).eq("id", inv.id);
        if (log?.id) await svc.from("saas_webhook_logs").update({ processed: true }).eq("id", log.id);
      } catch (e) {
        if (log?.id) await svc.from("saas_webhook_logs").update({ error: (e as Error).message }).eq("id", log.id);
      }
    }
    return json({ ok: true });
  } catch (e) {
    console.error("saas-inter-webhook", e);
    return json({ error: (e as Error).message }, 500);
  }
});
