import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders, json, getAuthUser, ensureFinanceAdmin, serviceClient } from "../_shared/asaas.ts";
import { getProviderForCreche } from "../_shared/providers/factory.ts";

// Façade unificada: cria cobrança usando o provider configurado da escola.
// Substitui chamadas diretas a `inter-create-invoice` / `asaas-create-payment` no frontend.
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const auth = await getAuthUser(req);
    if (!auth) return json({ error: "Unauthorized" }, 401);
    const body = await req.json();
    const { creche_id, crianca_id, value, due_date, description, payer, payment_type, fees } = body;
    if (!creche_id || !value || !due_date || !payer?.cpf_cnpj || !payer?.nome) {
      return json({ error: "Parâmetros obrigatórios ausentes" }, 400);
    }
    if (!(await ensureFinanceAdmin(auth.userId, creche_id))) return json({ error: "Forbidden" }, 403);

    const provider = await getProviderForCreche(creche_id);
    if (!provider) return json({ error: "Nenhum provider financeiro configurado para esta escola" }, 400);

    const result = await provider.createCharge({
      crecheId: creche_id, criancaId: crianca_id, amount: Number(value),
      dueDate: due_date, description, payer, type: payment_type, fees,
    });

    const svc = serviceClient();
    const { data: invoice, error: insErr } = await svc.from("financial_invoices").insert({
      creche_id, crianca_id: crianca_id || null,
      provider: provider.name,
      external_id: result.externalId,
      amount: Number(value),
      due_date,
      status: result.status,
      payment_method: payment_type || "BOLPIX",
      pix_copy_paste: result.pixCopyPaste,
      pix_qrcode_image: result.pixQrcodeImage,
      pix_txid: result.pixTxid,
      boleto_linha_digitavel: result.boletoLinhaDigitavel,
      description: description || null,
      raw_payload: result.raw,
      created_by: auth.userId,
    }).select("*").single();
    if (insErr) throw insErr;

    return json({ ok: true, invoice, charge: result });
  } catch (e) {
    console.error("finance-create-charge", e);
    return json({ error: (e as Error).message }, 500);
  }
});
