import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders, json, getAuthUser, ensureFinanceAdmin, serviceClient } from "../_shared/asaas.ts";
import { getProviderForCreche } from "../_shared/providers/factory.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const auth = await getAuthUser(req);
    if (!auth) return json({ error: "Unauthorized" }, 401);
    const { creche_id } = await req.json();
    if (!creche_id) return json({ error: "missing creche_id" }, 400);
    if (!(await ensureFinanceAdmin(auth.userId, creche_id))) return json({ error: "Forbidden" }, 403);

    const provider = await getProviderForCreche(creche_id);
    if (!provider || !provider.registerWebhook) return json({ error: "Provider sem suporte a webhook" }, 400);

    const svc = serviceClient();
    const { data: account } = await svc.from("financial_accounts")
      .select("webhook_secret").eq("creche_id", creche_id).eq("provider", "inter").maybeSingle();
    if (!account) return json({ error: "Conta não encontrada" }, 404);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const webhookUrl = `${supabaseUrl}/functions/v1/inter-webhook?token=${account.webhook_secret}`;
    const ok = await provider.registerWebhook(webhookUrl);
    if (!ok) return json({ error: "Falha ao registrar webhook no Inter" }, 502);

    await svc.from("financial_accounts").update({ webhook_registered_at: new Date().toISOString() })
      .eq("creche_id", creche_id).eq("provider", "inter");
    return json({ ok: true, webhook_url: webhookUrl });
  } catch (e) {
    console.error("inter-register-webhook", e);
    return json({ error: (e as Error).message }, 500);
  }
});
