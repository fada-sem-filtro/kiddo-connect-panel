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
    let skipped = 0;
    const seen = new Set<string>();

    while (true) {
      const { ok, data } = await asaasFetch(cred.apiKey, cred.env, `/subscriptions?limit=${limit}&offset=${offset}`);
      if (!ok) return json({ error: data?.errors?.[0]?.description || "Falha ao consultar Asaas" }, 502);
      const items: any[] = data?.data || [];
      total = data?.totalCount ?? total;
      for (const s of items) {
        seen.add(s.id);
        const { data: cust } = await svc
          .from("financial_customers")
          .select("id, crianca_id")
          .eq("creche_id", creche_id)
          .eq("asaas_customer_id", s.customer)
          .maybeSingle();
        if (!cust) { skipped++; continue; }

        const status = s.deleted ? "INACTIVE" : (s.status || "ACTIVE");
        const payload: any = {
          creche_id,
          customer_id: cust.id,
          crianca_id: cust.crianca_id,
          asaas_subscription_id: s.id,
          value: s.value,
          cycle: s.cycle,
          billing_type: s.billingType || "UNDEFINED",
          description: s.description || null,
          next_due_date: s.nextDueDate,
          status,
          updated_at: new Date().toISOString(),
        };
        const { data: existing } = await svc
          .from("subscriptions")
          .select("id")
          .eq("creche_id", creche_id)
          .eq("asaas_subscription_id", s.id)
          .maybeSingle();
        if (existing) {
          await svc.from("subscriptions").update(payload).eq("id", existing.id);
        } else {
          await svc.from("subscriptions").insert(payload);
        }
        upserted++;
      }
      if (items.length < limit) break;
      offset += limit;
      if (offset > 5000) break;
    }

    // Mark locally-active subs that no longer exist in Asaas as INACTIVE
    const { data: locals } = await svc
      .from("subscriptions")
      .select("id, asaas_subscription_id")
      .eq("creche_id", creche_id)
      .eq("status", "ACTIVE");
    let deactivated = 0;
    for (const l of locals || []) {
      if (!seen.has(l.asaas_subscription_id)) {
        await svc.from("subscriptions").update({ status: "INACTIVE", updated_at: new Date().toISOString() }).eq("id", l.id);
        deactivated++;
      }
    }

    return json({ success: true, total, upserted, skipped, deactivated });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
