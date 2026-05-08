import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders, json, getAuthUser, ensureFinanceAdmin, asaasFetch, getCrecheAsaas, serviceClient } from "../_shared/asaas.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const auth = await getAuthUser(req);
    if (!auth) return json({ error: "Unauthorized" }, 401);
    const { creche_id, subscription_id, action, value, next_due_date, cycle, billing_type, description } = await req.json();
    if (!creche_id || !subscription_id || !action) return json({ error: "Parâmetros inválidos" }, 400);
    if (!(await ensureFinanceAdmin(auth.userId, creche_id))) return json({ error: "Forbidden" }, 403);

    const cred = await getCrecheAsaas(creche_id);
    if (!cred) return json({ error: "Integração Asaas não conectada" }, 400);
    const svc = serviceClient();
    const { data: sub } = await svc.from("subscriptions").select("asaas_subscription_id").eq("id", subscription_id).eq("creche_id", creche_id).maybeSingle();
    if (!sub) return json({ error: "Recorrência não encontrada" }, 404);

    if (action === "cancel") {
      const res = await asaasFetch(cred.apiKey, cred.env, `/subscriptions/${sub.asaas_subscription_id}`, { method: "DELETE" });
      if (!res.ok) return json({ error: "Falha ao cancelar no Asaas", details: res.data }, 400);
      await svc.from("subscriptions").update({ status: "INACTIVE" }).eq("id", subscription_id);
      return json({ ok: true });
    }

    if (action === "update") {
      const payload: any = {};
      if (value !== undefined) payload.value = Number(value);
      if (next_due_date) payload.nextDueDate = next_due_date;
      if (cycle) payload.cycle = cycle;
      if (billing_type) payload.billingType = billing_type;
      if (description !== undefined) payload.description = description;
      const res = await asaasFetch(cred.apiKey, cred.env, `/subscriptions/${sub.asaas_subscription_id}`, {
        method: "PUT", body: JSON.stringify(payload),
      });
      if (!res.ok) return json({ error: "Falha ao atualizar recorrência", details: res.data }, 400);
      if (billing_type === "PIX" && res.data.billingType && res.data.billingType !== "PIX") {
        return json({
          error: "Sua conta Asaas não tem PIX habilitado. Cadastre uma chave Pix no Asaas ou escolha Boleto/Cliente escolhe.",
        }, 400);
      }
      await svc.from("subscriptions").update({
        value: res.data.value, next_due_date: res.data.nextDueDate, cycle: res.data.cycle,
        description: res.data.description, billing_type: res.data.billingType || billing_type,
      }).eq("id", subscription_id);
      return json({ ok: true, subscription: res.data });
    }

    return json({ error: "Ação inválida" }, 400);
  } catch (e) {
    console.error("asaas-update-subscription", e);
    return json({ error: (e as Error).message }, 500);
  }
});
