import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders, json, getAuthUser, serviceClient } from "../_shared/asaas.ts";
import { ensureAdmin, getSaasInterAccount, saasInterFetch } from "../_shared/saas-inter.ts";

// Cria cobrança Inter para uma saas_invoice existente.
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const auth = await getAuthUser(req);
    if (!auth) return json({ error: "Unauthorized" }, 401);
    if (!(await ensureAdmin(auth.userId))) return json({ error: "Forbidden" }, 403);

    const { invoice_id } = await req.json();
    if (!invoice_id) return json({ error: "invoice_id obrigatório" }, 400);

    const svc = serviceClient();
    const { data: inv } = await svc.from("saas_invoices").select("*").eq("id", invoice_id).maybeSingle();
    if (!inv) return json({ error: "Cobrança não encontrada" }, 404);
    if (inv.external_id) return json({ error: "Cobrança já emitida" }, 400);

    const { data: creche } = await svc.from("creches").select("nome, email, telefone").eq("id", inv.creche_id).maybeSingle();
    if (!creche) return json({ error: "Escola não encontrada" }, 404);

    const account = await getSaasInterAccount();
    if (!account) return json({ error: "Banco Inter PJ SaaS não conectado" }, 400);

    // Garantir due_date >= hoje
    const today = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
    const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}-${String(today.getDate()).padStart(2,"0")}`;
    const dueDate = inv.due_date < todayStr ? todayStr : inv.due_date;

    const seuNumero = inv.invoice_number || `SAAS${Date.now()}`;
    const cobranca = {
      seuNumero,
      valorNominal: Number(inv.amount),
      dataVencimento: dueDate,
      numDiasAgenda: 30,
      pagador: {
        cpfCnpj: "00000000000000", // placeholder; idealmente CNPJ da escola
        tipoPessoa: "JURIDICA",
        nome: creche.nome || "Escola",
        endereco: "Endereço não informado",
        cidade: "São Paulo",
        uf: "SP",
        cep: "00000000",
        email: creche.email || undefined,
      },
      mensagem: { linha1: inv.description || "Mensalidade Agenda Fleur" },
    };

    const r = await saasInterFetch(account, "/cobranca/v3/cobrancas", {
      method: "POST",
      body: JSON.stringify(cobranca),
    });
    if (!r.ok) return json({ error: "Falha ao criar cobrança", details: r.data || r.text }, 400);

    const codigoSolicitacao = r.data?.codigoSolicitacao;
    let pixQr: string | null = null, pixCopy: string | null = null, boletoUrl: string | null = null, linhaDig: string | null = null;
    if (codigoSolicitacao) {
      const det = await saasInterFetch(account, `/cobranca/v3/cobrancas/${codigoSolicitacao}`, { method: "GET" });
      if (det.ok) {
        pixQr = det.data?.pix?.pixCopiaECola ? null : (det.data?.pix?.pixQrCode || null);
        pixCopy = det.data?.pix?.pixCopiaECola || null;
        boletoUrl = det.data?.boleto?.urlBoleto || det.data?.boleto?.linkColeto || null;
        linhaDig = det.data?.boleto?.linhaDigitavel || null;
      }
    }

    await svc.from("saas_invoices").update({
      external_id: codigoSolicitacao,
      invoice_number: seuNumero,
      status: "A_RECEBER",
      due_date: dueDate,
      pix_qrcode: pixQr,
      pix_copy_paste: pixCopy,
      boleto_pdf_url: boletoUrl,
      linha_digitavel: linhaDig,
      raw_payload: r.data,
    }).eq("id", invoice_id);

    return json({ ok: true, external_id: codigoSolicitacao });
  } catch (e) {
    console.error("saas-inter-create-invoice", e);
    return json({ error: (e as Error).message }, 500);
  }
});
