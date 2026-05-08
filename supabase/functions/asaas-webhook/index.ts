import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders, json, serviceClient } from "../_shared/asaas.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("token") || req.headers.get("asaas-access-token");
    if (!token) return json({ error: "missing token" }, 401);

    const svc = serviceClient();
    const { data: settings } = await svc.from("financial_settings").select("creche_id").eq("asaas_webhook_token", token).maybeSingle();
    if (!settings) return json({ error: "invalid token" }, 401);

    const payload = await req.json();
    const event = payload?.event as string;
    const payment = payload?.payment;
    const paymentId = payment?.id || null;

    // Idempotent log
    const { error: logErr } = await svc.from("asaas_webhook_logs").insert({
      creche_id: settings.creche_id, event, asaas_payment_id: paymentId, payload, processed: false,
    });
    if (logErr && !logErr.message.includes("duplicate")) console.error("log", logErr);
    if (logErr?.message?.includes("duplicate")) return json({ ok: true, duplicate: true });

    if (payment && paymentId) {
      // Upsert invoice
      const update: any = {
        status: payment.status,
        payment_method: payment.billingType || "UNDEFINED",
        value: payment.value,
        net_value: payment.netValue,
        due_date: payment.dueDate,
        invoice_url: payment.invoiceUrl,
        bank_slip_url: payment.bankSlipUrl,
      };
      await svc.from("invoices").update(update).eq("creche_id", settings.creche_id).eq("asaas_payment_id", paymentId);

      if (["PAYMENT_RECEIVED", "PAYMENT_CONFIRMED"].includes(event)) {
        const { data: inv } = await svc.from("invoices").select("id").eq("creche_id", settings.creche_id).eq("asaas_payment_id", paymentId).maybeSingle();
        if (inv) {
          await svc.from("payments").insert({
            creche_id: settings.creche_id, invoice_id: inv.id,
            paid_at: payment.paymentDate || payment.confirmedDate || new Date().toISOString(),
            value: payment.value, net_value: payment.netValue,
            payment_method: payment.billingType, status: event === "PAYMENT_CONFIRMED" ? "CONFIRMED" : "RECEIVED",
            transaction_id: payment.transactionReceiptUrl || null,
          });
        }
      }
    }

    await svc.from("asaas_webhook_logs").update({ processed: true }).eq("event", event).eq("asaas_payment_id", paymentId);
    return json({ ok: true });
  } catch (e) {
    console.error("webhook", e);
    return json({ error: (e as Error).message }, 500);
  }
});
