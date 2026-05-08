import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders, json, getAuthUser, ensureFinanceAdmin, serviceClient } from "../_shared/asaas.ts";
import { deleteCertFromStorage } from "../_shared/inter.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const auth = await getAuthUser(req);
    if (!auth) return json({ error: "Unauthorized" }, 401);
    const { creche_id } = await req.json();
    if (!creche_id) return json({ error: "Parâmetros inválidos" }, 400);
    if (!(await ensureFinanceAdmin(auth.userId, creche_id))) return json({ error: "Forbidden" }, 403);

    await deleteCertFromStorage(creche_id);

    const svc = serviceClient();
    await svc.from("financial_accounts").update({
      encrypted_client_secret: null, client_secret_iv: null, client_secret_tag: null,
      certificate_path: null, private_key_path: null, connected: false,
    }).eq("creche_id", creche_id).eq("provider", "inter");

    return json({ ok: true });
  } catch (e) {
    console.error("inter-disconnect", e);
    return json({ error: (e as Error).message }, 500);
  }
});
