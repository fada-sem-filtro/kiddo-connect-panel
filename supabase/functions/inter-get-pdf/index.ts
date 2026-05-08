import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders, json, getAuthUser, ensureFinanceAdmin, serviceClient } from "../_shared/asaas.ts";
import { getProviderForCreche } from "../_shared/providers/factory.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const auth = await getAuthUser(req);
    if (!auth) return json({ error: "Unauthorized" }, 401);
    const { creche_id, external_id } = await req.json();
    if (!creche_id || !external_id) return json({ error: "missing params" }, 400);
    if (!(await ensureFinanceAdmin(auth.userId, creche_id))) return json({ error: "Forbidden" }, 403);

    const provider = await getProviderForCreche(creche_id);
    if (!provider || !provider.getPdf) return json({ error: "Provider sem suporte a PDF" }, 400);
    const bytes = await provider.getPdf(external_id);
    if (!bytes) return json({ error: "PDF não disponível" }, 404);

    // Persist into storage and return path
    const svc = serviceClient();
    const path = `${creche_id}/${external_id}.pdf`;
    const up = await svc.storage.from("inter-certificates").upload(path, bytes, { upsert: true, contentType: "application/pdf" });
    if (up.error) return json({ error: up.error.message }, 500);
    await svc.from("financial_invoices").update({ boleto_pdf_path: path }).eq("creche_id", creche_id).eq("external_id", external_id);
    const signed = await svc.storage.from("inter-certificates").createSignedUrl(path, 3600);
    return json({ ok: true, path, url: signed.data?.signedUrl ?? null });
  } catch (e) {
    console.error("inter-get-pdf", e);
    return json({ error: (e as Error).message }, 500);
  }
});
