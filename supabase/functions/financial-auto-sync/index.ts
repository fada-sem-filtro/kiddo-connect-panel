import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { corsHeaders, json, getCrecheAsaas, asaasFetch } from "../_shared/asaas.ts";
import { getCrecheInter, interFetch } from "../_shared/inter.ts";

// Auto-sync executado por pg_cron. Não requer autenticação de usuário.
// Percorre todas as escolas com provider configurado e atualiza status de cobranças pendentes.
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const svc = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: creches } = await svc
      .from("creches")
      .select("id, financial_provider")
      .in("financial_provider", ["asaas", "inter"]);

    const results: any[] = [];

    for (const c of creches || []) {
      const creche_id = c.id;
      try {
        if (c.financial_provider === "inter") {
          const account = await getCrecheInter(creche_id);
          if (!account) { results.push({ creche_id, provider: "inter", skipped: "no-account" }); continue; }
          const { data: invoices } = await svc.from("financial_invoices")
            .select("id, external_id, status, paid_at")
            .eq("creche_id", creche_id).eq("provider", "inter")
            .in("status", ["EM_PROCESSAMENTO", "A_RECEBER", "ATRASADO", "PENDING"])
            .limit(200);
          let updated = 0, paid = 0;
          for (const inv of invoices || []) {
            if (!inv.external_id) continue;
            const det = await interFetch(account, `/cobranca/v3/cobrancas/${inv.external_id}`, { method: "GET" });
            if (!det.ok) continue;
            const cobranca = det.data?.cobranca || {};
            const newStatus = cobranca.situacao;
            if (newStatus && newStatus !== inv.status) {
              const upd: any = { status: newStatus, raw_payload: det.data };
              if (["RECEBIDO", "MARCADO_RECEBIDO"].includes(newStatus) && !inv.paid_at) {
                upd.paid_at = cobranca.dataSituacao || new Date().toISOString();
                paid++;
              }
              await svc.from("financial_invoices").update(upd).eq("id", inv.id);
              updated++;
            }
          }
          results.push({ creche_id, provider: "inter", updated, paid });
        } else if (c.financial_provider === "asaas") {
          const cred = await getCrecheAsaas(creche_id);
          if (!cred) { results.push({ creche_id, provider: "asaas", skipped: "no-creds" }); continue; }
          const { data: invoices } = await svc.from("invoices")
            .select("id, asaas_payment_id, status")
            .eq("creche_id", creche_id)
            .in("status", ["PENDING", "OVERDUE", "AWAITING_RISK_ANALYSIS"])
            .limit(200);
          let updated = 0;
          for (const inv of invoices || []) {
            if (!inv.asaas_payment_id) continue;
            const r = await asaasFetch(cred.apiKey, cred.env, `/payments/${inv.asaas_payment_id}`);
            if (!r.ok) continue;
            const p = r.data;
            if (p.status && p.status !== inv.status) {
              await svc.from("invoices").update({ status: p.status }).eq("id", inv.id);
              updated++;
            }
          }
          results.push({ creche_id, provider: "asaas", updated });
        }
      } catch (e) {
        results.push({ creche_id, error: (e as Error).message });
      }
    }

    return json({ ok: true, ran_at: new Date().toISOString(), results });
  } catch (e) {
    console.error("financial-auto-sync", e);
    return json({ error: (e as Error).message }, 500);
  }
});
