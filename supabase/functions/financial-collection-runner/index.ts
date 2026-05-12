// Régua automática de cobrança — roda 1x/dia.
// Varre cobranças em aberto, calcula offset vs due_date e dispara
// notificações internas (notificacoes) conforme regras ativas.
// Não altera nenhuma cobrança no Asaas/Inter.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function render(template: string, p: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, k) => p[k] ?? "");
}

const fmtBRL = (v: number) => `R$ ${Number(v || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
const isOpen = (s: string) => ["A_RECEBER", "PENDING", "EM_PROCESSAMENTO", "ATRASADO", "OVERDUE"].includes(s);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(url, key);

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const todayStr = today.toISOString().slice(0, 10);

    // 1) Coleta todas as regras ativas (notificacao + email — whatsapp é manual)
    const { data: rules } = await sb.from("financial_collection_rules")
      .select("*").eq("ativo", true).in("channel", ["notificacao", "email"]);

    if (!rules || rules.length === 0) {
      return new Response(JSON.stringify({ ok: true, processed: 0, msg: "nenhuma regra ativa" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let totalSent = 0;

    for (const rule of rules) {
      // Calcula due_date alvo
      const target = new Date(today);
      target.setUTCDate(target.getUTCDate() - rule.stage_offset_days);
      const targetDate = target.toISOString().slice(0, 10);

      // Cobranças dessa escola com due_date == targetDate e ainda em aberto
      const { data: invoices } = await sb.from("financial_invoices")
        .select("id, creche_id, crianca_id, amount, due_date, status, pix_copy_paste, boleto_linha_digitavel, description")
        .eq("creche_id", rule.creche_id).eq("due_date", targetDate);

      for (const inv of (invoices || [])) {
        if (!isOpen(inv.status)) continue;

        // Já enviado essa regra para essa cobrança? (idempotência)
        const { data: existing } = await sb.from("financial_collection_logs")
          .select("id").eq("invoice_id", inv.id).eq("rule_id", rule.id).limit(1);
        if (existing && existing.length) continue;

        // Resolve aluno + responsáveis
        const { data: crianca } = await sb.from("criancas").select("id, nome").eq("id", inv.crianca_id).maybeSingle();
        const { data: vinc } = await sb.from("crianca_responsaveis")
          .select("responsavel_user_id, profiles:responsavel_user_id(nome, email)")
          .eq("crianca_id", inv.crianca_id);
        const { data: escola } = await sb.from("creches").select("nome").eq("id", inv.creche_id).maybeSingle();

        const placeholders = (resp: any) => ({
          responsavel: resp?.profiles?.nome || "Responsável",
          aluno: crianca?.nome || "Aluno",
          vencimento: new Date(inv.due_date + "T00:00:00").toLocaleDateString("pt-BR"),
          valor: fmtBRL(inv.amount),
          pix: inv.pix_copy_paste || "",
          linha_digitavel: inv.boleto_linha_digitavel || "",
          escola: escola?.nome || "Escola",
        });

        for (const r of (vinc || [])) {
          const p = placeholders(r);
          const titulo = render(rule.titulo, p);
          const body = render(rule.template, p);

          if (rule.channel === "notificacao") {
            await sb.from("notificacoes").insert({
              user_id: r.responsavel_user_id,
              titulo: "💰 " + titulo,
              mensagem: body,
              tipo: "evento",
              crianca_id: inv.crianca_id,
            });
            await sb.from("financial_collection_logs").insert({
              creche_id: inv.creche_id, invoice_id: inv.id, rule_id: rule.id,
              channel: "notificacao", status: "sent", recipient: r.responsavel_user_id,
              payload: { titulo, body },
            });
            totalSent++;
          } else if (rule.channel === "email" && (r as any).profiles?.email) {
            // Enfileira via pgmq (consumido pelo process-email-queue)
            try {
              await sb.rpc("enqueue_email", {
                queue_name: "email_queue",
                payload: {
                  to: (r as any).profiles.email,
                  subject: titulo,
                  html: `<p>${body.replace(/\n/g, "<br/>")}</p>`,
                  from: "Agenda Fleur <contato@agendafleur.app>",
                } as any,
              });
              await sb.from("financial_collection_logs").insert({
                creche_id: inv.creche_id, invoice_id: inv.id, rule_id: rule.id,
                channel: "email", status: "queued", recipient: (r as any).profiles.email,
                payload: { titulo },
              });
              totalSent++;
            } catch (e) {
              await sb.from("financial_collection_logs").insert({
                creche_id: inv.creche_id, invoice_id: inv.id, rule_id: rule.id,
                channel: "email", status: "error", recipient: (r as any).profiles.email,
                error: (e as Error).message,
              });
            }
          }
        }
      }
    }

    return new Response(JSON.stringify({ ok: true, sent: totalSent }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("financial-collection-runner", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
