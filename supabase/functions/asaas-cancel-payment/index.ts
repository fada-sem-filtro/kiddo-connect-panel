import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders, json, getAuthUser, ensureFinanceAdmin, asaasFetch, getCrecheAsaas, serviceClient } from "../_shared/asaas.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const auth = await getAuthUser(req);
    if (!auth) return json({ error: "Unauthorized" }, 401);
    const { creche_id, invoice_id } = await req.json();
    if (!creche_id || !invoice_id) return json({ error: "Parâmetros inválidos" }, 400);
    if (!(await ensureFinanceAdmin(auth.userId, creche_id))) return json({ error: "Forbidden" }, 403);

    const cred = await getCrecheAsaas(creche_id);
    if (!cred) return json({ error: "Integração Asaas não conectada" }, 400);
    const svc = serviceClient();

    const { data: inv } = await svc.from("invoices").select("*").eq("id", invoice_id).eq("creche_id", creche_id).maybeSingle();
    if (!inv) return json({ error: "Cobrança não encontrada" }, 404);

    const res = await asaasFetch(cred.apiKey, cred.env, `/payments/${inv.asaas_payment_id}`, { method: "DELETE" });
    if (!res.ok) return json({ error: "Falha ao cancelar no Asaas", details: res.data }, 400);

    await svc.from("invoices").update({ status: "DELETED" }).eq("id", invoice_id);
    return json({ ok: true });
  } catch (e) {
    console.error("asaas-cancel-payment", e);
    return json({ error: (e as Error).message }, 500);
  }
});
