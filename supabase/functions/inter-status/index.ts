import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders, json, getAuthUser, ensureFinanceAdmin, serviceClient } from "../_shared/asaas.ts";
import { getCrecheInter, getInterToken } from "../_shared/inter.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const auth = await getAuthUser(req);
    if (!auth) return json({ error: "Unauthorized" }, 401);
    const { creche_id } = await req.json();
    if (!creche_id) return json({ error: "Parâmetros inválidos" }, 400);
    if (!(await ensureFinanceAdmin(auth.userId, creche_id))) return json({ error: "Forbidden" }, 403);

    const account = await getCrecheInter(creche_id);
    if (!account) return json({ ok: false, connected: false });

    try {
      await getInterToken(account);
      const svc = serviceClient();
      await svc.from("financial_accounts").update({
        last_validation: new Date().toISOString(), last_error: null,
      }).eq("creche_id", creche_id).eq("provider", "inter");
      return json({ ok: true, connected: true });
    } catch (e) {
      const svc = serviceClient();
      await svc.from("financial_accounts").update({
        last_error: (e as Error).message,
      }).eq("creche_id", creche_id).eq("provider", "inter");
      return json({ ok: false, connected: false, error: (e as Error).message });
    }
  } catch (e) {
    console.error("inter-status", e);
    return json({ error: (e as Error).message }, 500);
  }
});
