import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders, json, getAuthUser, ensureFinanceAdmin, serviceClient } from "../_shared/asaas.ts";
import { getCrecheInter, interFetch } from "../_shared/inter.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const auth = await getAuthUser(req);
    if (!auth) return json({ error: "Unauthorized" }, 401);
    const { creche_id, invoice_id } = await req.json();
    if (!creche_id || !invoice_id) return json({ error: "Parâmetros inválidos" }, 400);
    if (!(await ensureFinanceAdmin(auth.userId, creche_id))) return json({ error: "Forbidden" }, 403);

    const svc = serviceClient();
    const { data: inv, error } = await svc.from("financial_invoices")
      .select("*").eq("id", invoice_id).eq("creche_id", creche_id).single();
    if (error || !inv) return json({ error: "Cobrança não encontrada" }, 404);
    if (!inv.external_id) return json({ error: "Sem external_id" }, 400);

    const account = await getCrecheInter(creche_id);
    if (!account) return json({ error: "Inter desconectado" }, 400);

    const detalhe = await interFetch(account, `/cobranca/v3/cobrancas/${inv.external_id}`, { method: "GET" });
    if (!detalhe.ok) return json({ error: "Falha ao buscar no Inter", details: detalhe.data ?? detalhe.text }, 500);

    const det = detalhe.data;
    const pix = det.pix || {};
    const boleto = det.boleto || {};
    const cobranca = det.cobranca || {};

    const updates: any = {
      status: cobranca.situacao || inv.status,
      pix_copy_paste: pix.pixCopiaECola || inv.pix_copy_paste,
      boleto_linha_digitavel: boleto.codigoBarras || inv.boleto_linha_digitavel,
      raw_payload: det,
    };
    if (["RECEBIDO", "MARCADO_RECEBIDO"].includes(cobranca.situacao) && !inv.paid_at) {
      updates.paid_at = cobranca.dataSituacao || new Date().toISOString();
      await svc.from("financial_transactions").insert({
        creche_id, invoice_id: inv.id, transaction_type: "PAYMENT",
        amount: cobranca.valorTotalRecebido || inv.amount,
        status: "RECEIVED", paid_at: updates.paid_at, raw_payload: det,
      });
    }
    if (cobranca.situacao === "CANCELADO" && !inv.cancelled_at) {
      updates.cancelled_at = cobranca.dataSituacao || new Date().toISOString();
    }
    await svc.from("financial_invoices").update(updates).eq("id", inv.id);
    return json({ ok: true, status: updates.status });
  } catch (e) {
    console.error("inter-get-invoice", e);
    return json({ error: (e as Error).message }, 500);
  }
});
