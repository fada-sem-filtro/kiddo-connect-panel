import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders, json, getAuthUser, ensureFinanceAdmin } from "../_shared/asaas.ts";
import { getProviderForCreche } from "../_shared/providers/factory.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const auth = await getAuthUser(req);
    if (!auth) return json({ error: "Unauthorized" }, 401);
    const { creche_id, from, to } = await req.json();
    if (!creche_id || !from || !to) return json({ error: "missing params" }, 400);
    if (!(await ensureFinanceAdmin(auth.userId, creche_id))) return json({ error: "Forbidden" }, 403);

    const provider = await getProviderForCreche(creche_id);
    if (!provider || !provider.getStatement) return json({ error: "Provider sem suporte a extrato" }, 400);
    const entries = await provider.getStatement(from, to);
    return json({ ok: true, entries });
  } catch (e) {
    console.error("inter-statement", e);
    return json({ error: (e as Error).message }, 500);
  }
});
