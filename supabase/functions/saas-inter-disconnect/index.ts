import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders, json, getAuthUser, serviceClient } from "../_shared/asaas.ts";
import { ensureAdmin, deleteSaasCertFromStorage, clearSaasInterTokenCache } from "../_shared/saas-inter.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const auth = await getAuthUser(req);
    if (!auth) return json({ error: "Unauthorized" }, 401);
    if (!(await ensureAdmin(auth.userId))) return json({ error: "Forbidden" }, 403);
    await deleteSaasCertFromStorage();
    const svc = serviceClient();
    await svc.from("saas_financial_account").update({
      connected: false, client_id: null, encrypted_client_secret: null,
      client_secret_iv: null, client_secret_tag: null,
      certificate_path: null, private_key_path: null, last_error: null,
    }).neq("id", "00000000-0000-0000-0000-000000000000");
    clearSaasInterTokenCache();
    return json({ ok: true });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
