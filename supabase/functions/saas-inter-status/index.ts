import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders, json, getAuthUser, serviceClient } from "../_shared/asaas.ts";
import { ensureAdmin, getSaasInterAccount, getSaasInterToken, clearSaasInterTokenCache } from "../_shared/saas-inter.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const auth = await getAuthUser(req);
    if (!auth) return json({ error: "Unauthorized" }, 401);
    if (!(await ensureAdmin(auth.userId))) return json({ error: "Forbidden" }, 403);

    const svc = serviceClient();
    const { data: row } = await svc.from("saas_financial_account").select("*").limit(1).maybeSingle();
    if (!row) return json({ connected: false });

    if (!row.connected || !row.encrypted_client_secret) {
      return json({ connected: false, environment: row.environment, last_error: row.last_error });
    }

    try {
      clearSaasInterTokenCache();
      const account = await getSaasInterAccount();
      if (!account) throw new Error("Conta não configurada");
      await getSaasInterToken(account);
      await svc.from("saas_financial_account")
        .update({ last_validation: new Date().toISOString(), last_error: null, connected: true })
        .eq("id", row.id);
      return json({ connected: true, environment: row.environment, last_validation: new Date().toISOString(), webhook_secret: row.webhook_secret });
    } catch (e) {
      const msg = (e as Error).message;
      await svc.from("saas_financial_account")
        .update({ last_error: msg, last_validation: new Date().toISOString() })
        .eq("id", row.id);
      return json({ connected: false, environment: row.environment, last_error: msg });
    }
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
