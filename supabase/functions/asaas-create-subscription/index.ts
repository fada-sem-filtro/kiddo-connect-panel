import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders, json, getAuthUser, ensureFinanceAdmin, asaasFetch, getCrecheAsaas, serviceClient } from "../_shared/asaas.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const auth = await getAuthUser(req);
    if (!auth) return json({ error: "Unauthorized" }, 401);
    const body = await req.json();
    const { creche_id, crianca_id, customer, value, next_due_date, cycle, billing_type, description } = body || {};
    if (!creche_id || !value || !next_due_date || !cycle || !billing_type) return json({ error: "Parâmetros inválidos" }, 400);
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

    const sRes = await asaasFetch(cred.apiKey, cred.env, "/subscriptions", {
      method: "POST",
      body: JSON.stringify({
        customer: customerRow.asaas_customer_id,
        billingType: billing_type,
        value: Number(value),
        nextDueDate: next_due_date,
        cycle,
        description,
      }),
    });
    if (!sRes.ok) return json({ error: "Falha ao criar recorrência", details: sRes.data }, 400);

    const sub = await svc.from("subscriptions").insert({
      creche_id, customer_id: customerRow.id, crianca_id: crianca_id || null,
      asaas_subscription_id: sRes.data.id, value: sRes.data.value, cycle: sRes.data.cycle,
      next_due_date: sRes.data.nextDueDate, description: sRes.data.description, status: sRes.data.status || "ACTIVE",
    }).select().single();

    return json({ ok: true, subscription: sub.data });
  } catch (e) {
    console.error("asaas-create-subscription", e);
    return json({ error: (e as Error).message }, 500);
  }
});
