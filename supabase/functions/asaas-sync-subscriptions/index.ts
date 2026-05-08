// Sync subscriptions from Asaas into local table for a given creche.
import { corsHeaders, json, getAuthUser, ensureFinanceAdmin, getCrecheAsaas, asaasFetch, serviceClient } from "../_shared/asaas.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const auth = await getAuthUser(req);
    if (!auth) return json({ error: "Unauthorized" }, 401);
    const { creche_id } = await req.json();
    if (!creche_id) return json({ error: "creche_id required" }, 400);
    if (!(await ensureFinanceAdmin(auth.userId, creche_id))) return json({ error: "Forbidden" }, 403);

    const cred = await getCrecheAsaas(creche_id);
    if (!cred) return json({ error: "Asaas não conectado" }, 400);

    const svc = serviceClient();
    let offset = 0;
    const limit = 100;
    let total = 0;
    let upserted = 0;
    while (true) {
      const { ok, data } = await asaasFetch(cred.apiKey, cred.env, `/subscriptions?limit=${limit}&offset=${offset}`);
      if (!ok) return json({ error: data?.errors?.[0]?.description || "Falha ao consultar Asaas" }, 502);
      const items: any[] = data?.data || [];
      total = data?.totalCount ?? total;
      for (const s of items) {
        // Find local crianca by asaas customer id
        const { data: cust } = await svc
          .from("financial_customers")
          .select("crianca_id")
          .eq("creche_id", creche_id)
          .eq("asaas_customer_id", s.customer)
          .maybeSingle();
        const payload: any = {
          creche_id,
          asaas_subscription_id: s.id,
          crianca_id: cust?.crianca_id || null,
          value: s.value,
          cycle: s.cycle,
          billing_type: s.billingType,
          description: s.description || null,
          next_due_date: s.nextDueDate,
          status: s.status === "ACTIVE" ? "ACTIVE" : (s.deleted ? "INACTIVE" : s.status),
          updated_at: new Date().toISOString(),
        };
        const { error: upErr } = await svc
          .from("subscriptions")
          .upsert(payload, { onConflict: "asaas_subscription_id" });
        if (!upErr) upserted++;
      }
      if (items.length < limit) break;
      offset += limit;
      if (offset > 5000) break;
    }
    return json({ success: true, total, upserted });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
