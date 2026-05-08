import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders, json, getAuthUser, ensureFinanceAdmin, asaasFetch, getCrecheAsaas, serviceClient } from "../_shared/asaas.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const auth = await getAuthUser(req);
    if (!auth) return json({ error: "Unauthorized" }, 401);
    const body = await req.json();
    const { creche_id, crianca_id, customer, value, due_date, billing_type, description } = body || {};
    if (!creche_id || !value || !due_date || !billing_type) return json({ error: "Parâmetros inválidos" }, 400);
    // Garantir que dueDate não seja anterior a hoje (timezone America/Sao_Paulo)
    const todayBR = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
    const todayStr = `${todayBR.getFullYear()}-${String(todayBR.getMonth() + 1).padStart(2, "0")}-${String(todayBR.getDate()).padStart(2, "0")}`;
    let dueDateFinal = String(due_date);
    if (dueDateFinal < todayStr) dueDateFinal = todayStr;
    if (!(await ensureFinanceAdmin(auth.userId, creche_id))) return json({ error: "Forbidden" }, 403);

    const cred = await getCrecheAsaas(creche_id);
    if (!cred) return json({ error: "Integração Asaas não conectada" }, 400);
    const svc = serviceClient();

    // Find or create customer
    let customerRow: any = null;
    if (customer?.id) {
      const { data } = await svc.from("financial_customers").select("*").eq("id", customer.id).maybeSingle();
      customerRow = data;
    }
    if (!customerRow) {
      // Create on Asaas
      const cRes = await asaasFetch(cred.apiKey, cred.env, "/customers", {
        method: "POST",
        body: JSON.stringify({ name: customer?.name, email: customer?.email, mobilePhone: customer?.phone, cpfCnpj: customer?.cpf_cnpj }),
      });
      if (!cRes.ok) return json({ error: "Falha ao criar cliente Asaas", details: cRes.data }, 400);
      const ins = await svc.from("financial_customers").insert({
        creche_id, crianca_id: crianca_id || null,
        asaas_customer_id: cRes.data.id, name: customer?.name, email: customer?.email, phone: customer?.phone, cpf_cnpj: customer?.cpf_cnpj,
      }).select().single();
      customerRow = ins.data;
    }

    // Create payment
    const pRes = await asaasFetch(cred.apiKey, cred.env, "/payments", {
      method: "POST",
      body: JSON.stringify({
        customer: customerRow.asaas_customer_id,
        billingType: billing_type,
        value: Number(value),
        dueDate: dueDateFinal,
        description,
      }),
    });
    if (!pRes.ok) return json({ error: "Falha ao criar cobrança", details: pRes.data }, 400);
    const p = pRes.data;

    // Fetch PIX QR if applicable
    let pix: any = {};
    if (billing_type === "PIX") {
      const qr = await asaasFetch(cred.apiKey, cred.env, `/payments/${p.id}/pixQrCode`);
      if (qr.ok) pix = { pix_qrcode: qr.data?.encodedImage || null, pix_copy_paste: qr.data?.payload || null, pix_expires_at: qr.data?.expirationDate || null };
    }

    const inv = await svc.from("invoices").insert({
      creche_id, crianca_id: crianca_id || null, customer_id: customerRow.id,
      asaas_payment_id: p.id, description: p.description, value: p.value, due_date: p.dueDate,
      payment_method: p.billingType || billing_type, status: p.status,
      invoice_url: p.invoiceUrl, bank_slip_url: p.bankSlipUrl,
      ...pix,
    }).select().single();

    return json({ ok: true, invoice: inv.data });
  } catch (e) {
    console.error("asaas-create-payment", e);
    return json({ error: (e as Error).message }, 500);
  }
});
