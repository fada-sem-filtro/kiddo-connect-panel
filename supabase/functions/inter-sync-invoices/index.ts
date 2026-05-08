import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders, json, getAuthUser, ensureFinanceAdmin, serviceClient } from "../_shared/asaas.ts";
import { getCrecheInter, interFetch } from "../_shared/inter.ts";

// Sincroniza status de todas cobranças pendentes/em processamento de uma escola.
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const auth = await getAuthUser(req);
    if (!auth) return json({ error: "Unauthorized" }, 401);
    const { creche_id } = await req.json();
    if (!creche_id) return json({ error: "Parâmetros inválidos" }, 400);
    if (!(await ensureFinanceAdmin(auth.userId, creche_id))) return json({ error: "Forbidden" }, 403);

    const account = await getCrecheInter(creche_id);
    if (!account) return json({ error: "Inter desconectado" }, 400);

    const svc = serviceClient();
    const { data: invoices } = await svc.from("financial_invoices")
      .select("id, external_id, status, amount, paid_at, cancelled_at")
      .eq("creche_id", creche_id).eq("provider", "inter")
      .in("status", ["EM_PROCESSAMENTO", "A_RECEBER", "ATRASADO", "PENDING"])
      .limit(100);

    let updated = 0, paid = 0;
    for (const inv of invoices || []) {
      if (!inv.external_id) continue;
      try {
        const detalhe = await interFetch(account, `/cobranca/v3/cobrancas/${inv.external_id}`, { method: "GET" });
        if (!detalhe.ok) continue;
        const det = detalhe.data;
        const cobranca = det.cobranca || {};
        const newStatus = cobranca.situacao;
        if (newStatus && newStatus !== inv.status) {
          const upd: any = { status: newStatus, raw_payload: det };
          if (["RECEBIDO", "MARCADO_RECEBIDO"].includes(newStatus) && !inv.paid_at) {
            upd.paid_at = cobranca.dataSituacao || new Date().toISOString();
            paid++;
            await svc.from("financial_transactions").insert({
              creche_id, invoice_id: inv.id, transaction_type: "PAYMENT",
              amount: cobranca.valorTotalRecebido || inv.amount,
              status: "RECEIVED", paid_at: upd.paid_at, raw_payload: det,
            });
          }
          if (newStatus === "CANCELADO" && !inv.cancelled_at) upd.cancelled_at = new Date().toISOString();
          await svc.from("financial_invoices").update(upd).eq("id", inv.id);
          updated++;
        }
      } catch (e) {
        console.error("sync error", inv.id, e);
      }
    }
    return json({ ok: true, scanned: invoices?.length || 0, updated, paid });
  } catch (e) {
    console.error("inter-sync-invoices", e);
    return json({ error: (e as Error).message }, 500);
  }
});
