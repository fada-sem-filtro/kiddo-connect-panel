import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders, json, getAuthUser, ensureFinanceAdmin, serviceClient } from "../_shared/asaas.ts";
import { getCrecheInter, interFetch } from "../_shared/inter.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const auth = await getAuthUser(req);
    if (!auth) return json({ error: "Unauthorized" }, 401);
    const { creche_id, invoice_id, motivo } = await req.json();
    if (!creche_id || !invoice_id) return json({ error: "Parâmetros inválidos" }, 400);
    if (!(await ensureFinanceAdmin(auth.userId, creche_id))) return json({ error: "Forbidden" }, 403);

    const svc = serviceClient();
    const { data: inv } = await svc.from("financial_invoices")
      .select("external_id").eq("id", invoice_id).eq("creche_id", creche_id).single();
    if (!inv?.external_id) return json({ error: "Cobrança não encontrada" }, 404);

    const account = await getCrecheInter(creche_id);
    if (!account) return json({ error: "Inter desconectado" }, 400);

    const cancel = await interFetch(account, `/cobranca/v3/cobrancas/${inv.external_id}/cancelar`, {
      method: "POST", body: JSON.stringify({ motivoCancelamento: motivo || "ACERTOS" }),
    });
    if (!cancel.ok) return json({ error: "Falha ao cancelar", details: cancel.data ?? cancel.text }, cancel.status || 500);

    await svc.from("financial_invoices").update({
      status: "CANCELADO", cancelled_at: new Date().toISOString(),
    }).eq("id", invoice_id);
    return json({ ok: true });
  } catch (e) {
    console.error("inter-cancel-invoice", e);
    return json({ error: (e as Error).message }, 500);
  }
});
