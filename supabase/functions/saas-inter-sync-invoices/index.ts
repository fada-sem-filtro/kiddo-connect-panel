import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { corsHeaders, json } from "../_shared/asaas.ts";
import { getSaasInterAccount, saasInterFetch } from "../_shared/saas-inter.ts";

// Sincroniza todas saas_invoices abertas. Sem auth: chamado pelo cron OU por admin via fetch.
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const svc = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const account = await getSaasInterAccount();
    if (!account) return json({ error: "Inter SaaS desconectado" }, 400);

    const { data: invoices } = await svc.from("saas_invoices")
      .select("id, external_id, status, paid_at, amount")
      .in("status", ["A_RECEBER", "EM_PROCESSAMENTO", "ATRASADO", "PENDING"])
      .not("external_id", "is", null)
      .limit(300);

    let updated = 0, paid = 0;
    for (const inv of invoices || []) {
      try {
        const r = await saasInterFetch(account, `/cobranca/v3/cobrancas/${inv.external_id}`, { method: "GET" });
        if (!r.ok) continue;
        const c = r.data?.cobranca || {};
        const newStatus = c.situacao;
        if (newStatus && newStatus !== inv.status) {
          const upd: any = { status: newStatus, raw_payload: r.data };
          if (["RECEBIDO", "MARCADO_RECEBIDO"].includes(newStatus) && !inv.paid_at) {
            upd.paid_at = c.dataSituacao || new Date().toISOString();
            paid++;
            await svc.from("saas_transactions").insert({
              invoice_id: inv.id, transaction_type: "PAYMENT",
              amount: inv.amount, status: "CONFIRMED",
              paid_at: upd.paid_at, raw_payload: r.data,
            });
          }
          await svc.from("saas_invoices").update(upd).eq("id", inv.id);
          updated++;
        }
      } catch (e) {
        console.error("sync error", inv.id, e);
      }
    }
    return json({ ok: true, scanned: invoices?.length || 0, updated, paid });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
