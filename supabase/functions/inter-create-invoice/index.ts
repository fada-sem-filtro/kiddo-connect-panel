import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders, json, getAuthUser, ensureFinanceAdmin, serviceClient } from "../_shared/asaas.ts";
import { getCrecheInter, interFetch } from "../_shared/inter.ts";

// Cria cobrança Boleto/PIX no Banco Inter.
// payment_type: BOLETO | PIX | BOLPIX (boleto + pix)
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const auth = await getAuthUser(req);
    if (!auth) return json({ error: "Unauthorized" }, 401);
    const body = await req.json();
    const { creche_id, crianca_id, value, due_date, description, payer, payment_type } = body;

    if (!creche_id || !value || !due_date || !payer?.cpf_cnpj || !payer?.nome) {
      return json({ error: "Parâmetros obrigatórios ausentes" }, 400);
    }
    if (Number(value) < 2.5) return json({ error: "Valor mínimo R$ 2,50" }, 400);
    if (!(await ensureFinanceAdmin(auth.userId, creche_id))) return json({ error: "Forbidden" }, 403);

    const account = await getCrecheInter(creche_id);
    if (!account) return json({ error: "Banco Inter não está conectado para esta escola" }, 400);

    const seuNumero = `AF${Date.now().toString().slice(-10)}`;
    const interBody: any = {
      seuNumero,
      valorNominal: Number(value),
      dataVencimento: due_date,
      numDiasAgenda: 60,
      pagador: {
        cpfCnpj: String(payer.cpf_cnpj).replace(/\D/g, ""),
        tipoPessoa: String(payer.cpf_cnpj).replace(/\D/g, "").length > 11 ? "JURIDICA" : "FISICA",
        nome: payer.nome,
        email: payer.email || undefined,
        ddd: payer.ddd || undefined,
        telefone: payer.telefone || undefined,
        cep: (payer.cep || "00000000").replace(/\D/g, ""),
        endereco: payer.endereco || "Não informado",
        numero: payer.numero || "S/N",
        bairro: payer.bairro || "Centro",
        cidade: payer.cidade || "São Paulo",
        uf: payer.uf || "SP",
      },
      mensagem: description ? { linha1: description.slice(0, 78) } : undefined,
    };

    const cob = await interFetch(account, "/cobranca/v3/cobrancas", {
      method: "POST", body: JSON.stringify(interBody),
    });
    if (!cob.ok) return json({ error: "Falha ao criar cobrança no Inter", status: cob.status, details: cob.data ?? cob.text }, cob.status || 500);

    const codigoSolicitacao = cob.data.codigoSolicitacao;

    // Buscar detalhes (PIX, boleto)
    const detalhe = await interFetch(account, `/cobranca/v3/cobrancas/${codigoSolicitacao}`, { method: "GET" });
    const det = detalhe.ok ? detalhe.data : {};

    const pix = det.pix || {};
    const boleto = det.boleto || {};

    const svc = serviceClient();
    const { data: invoice, error: insErr } = await svc.from("financial_invoices").insert({
      creche_id, crianca_id: crianca_id || null,
      provider: "inter",
      external_id: codigoSolicitacao,
      nosso_numero: boleto.nossoNumero || null,
      amount: Number(value),
      due_date,
      status: det.cobranca?.situacao || "EM_PROCESSAMENTO",
      payment_method: payment_type || "BOLPIX",
      pix_qrcode: pix.pixCopiaECola ? null : null,
      pix_copy_paste: pix.pixCopiaECola || null,
      boleto_pdf_url: null,
      boleto_linha_digitavel: boleto.codigoBarras || null,
      description: description || null,
      raw_payload: det,
      created_by: auth.userId,
    }).select("*").single();
    if (insErr) throw insErr;

    return json({ ok: true, invoice, codigo_solicitacao: codigoSolicitacao });
  } catch (e) {
    console.error("inter-create-invoice", e);
    return json({ error: (e as Error).message }, 500);
  }
});
