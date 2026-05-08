import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders, json, getAuthUser, ensureFinanceAdmin, serviceClient } from "../_shared/asaas.ts";
import { getProviderForCreche } from "../_shared/providers/factory.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const auth = await getAuthUser(req);
    if (!auth) return json({ error: "Unauthorized" }, 401);
    const { creche_id, external_id, new_due_date } = await req.json();
    if (!creche_id || !external_id || !new_due_date) return json({ error: "missing params" }, 400);
    if (!(await ensureFinanceAdmin(auth.userId, creche_id))) return json({ error: "Forbidden" }, 403);

    const provider = await getProviderForCreche(creche_id);
    if (!provider || !provider.updateDueDate) return json({ error: "Provider sem suporte" }, 400);
    const ok = await provider.updateDueDate(external_id, new_due_date);
    if (!ok) return json({ error: "Falha ao atualizar vencimento" }, 502);

    const svc = serviceClient();
    await svc.from("financial_invoices").update({ due_date: new_due_date }).eq("creche_id", creche_id).eq("external_id", external_id);
    return json({ ok: true });
  } catch (e) {
    console.error("inter-update-due-date", e);
    return json({ error: (e as Error).message }, 500);
  }
});
