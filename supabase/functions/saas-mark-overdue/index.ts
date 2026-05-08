import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { corsHeaders, json } from "../_shared/asaas.ts";

// Job diário: marca invoices vencidas e atualiza assinaturas como past_due.
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const svc = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const today = new Date().toISOString().slice(0, 10);

    const { data: overdue } = await svc.from("saas_invoices")
      .update({ status: "ATRASADO" })
      .lt("due_date", today)
      .in("status", ["A_RECEBER", "PENDING", "EM_PROCESSAMENTO"])
      .select("id, subscription_id");

    const subIds = [...new Set((overdue || []).map(i => i.subscription_id).filter(Boolean))];
    if (subIds.length) {
      await svc.from("saas_subscriptions").update({ status: "past_due" }).in("id", subIds);
    }
    return json({ ok: true, marked_overdue: overdue?.length || 0 });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
