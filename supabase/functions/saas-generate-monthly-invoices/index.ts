import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { corsHeaders, json } from "../_shared/asaas.ts";
import { getSaasInterAccount, saasInterFetch } from "../_shared/saas-inter.ts";

// Job diário: gera mensalidades vencendo nos próximos N dias e emite cobrança no Inter.
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const svc = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const account = await getSaasInterAccount();

    const today = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
    const yyyy = today.getFullYear(), mm = today.getMonth();

    const { data: subs } = await svc.from("saas_subscriptions")
      .select("id, creche_id, plan_id, monthly_amount, due_day, status")
      .in("status", ["active", "past_due"])
      .limit(500);

    let created = 0, emitted = 0;
    for (const s of subs || []) {
      // Calcula vencimento do mês corrente
      const dueDate = new Date(yyyy, mm, Math.min(s.due_day || 10, 28));
      const dueStr = `${dueDate.getFullYear()}-${String(dueDate.getMonth()+1).padStart(2,"0")}-${String(dueDate.getDate()).padStart(2,"0")}`;

      // Já existe invoice deste mês?
      const monthStart = `${yyyy}-${String(mm+1).padStart(2,"0")}-01`;
      const { data: existing } = await svc.from("saas_invoices")
        .select("id, external_id").eq("subscription_id", s.id)
        .gte("due_date", monthStart).limit(1).maybeSingle();
      if (existing) continue;

      const seuNumero = `SAAS${yyyy}${String(mm+1).padStart(2,"0")}${s.id.slice(0,6).toUpperCase()}`;
      const { data: inv } = await svc.from("saas_invoices").insert({
        subscription_id: s.id, creche_id: s.creche_id,
        invoice_number: seuNumero, amount: s.monthly_amount,
        due_date: dueStr, status: "PENDING",
        description: `Mensalidade Agenda Fleur ${String(mm+1).padStart(2,"0")}/${yyyy}`,
      }).select("id").single();
      if (inv) created++;

      // Tenta emitir no Inter se conectado
      if (inv && account) {
        try {
          const { data: creche } = await svc.from("creches").select("nome, email").eq("id", s.creche_id).maybeSingle();
          const cobranca = {
            seuNumero,
            valorNominal: Number(s.monthly_amount),
            dataVencimento: dueStr,
            numDiasAgenda: 30,
            pagador: {
              cpfCnpj: "00000000000000",
              tipoPessoa: "JURIDICA",
              nome: creche?.nome || "Escola",
              endereco: "Endereço não informado",
              cidade: "São Paulo", uf: "SP", cep: "00000000",
              email: creche?.email || undefined,
            },
            mensagem: { linha1: `Mensalidade Agenda Fleur ${String(mm+1).padStart(2,"0")}/${yyyy}` },
          };
          const r = await saasInterFetch(account, "/cobranca/v3/cobrancas", {
            method: "POST", body: JSON.stringify(cobranca),
          });
          if (r.ok) {
            const codigoSolicitacao = r.data?.codigoSolicitacao;
            await svc.from("saas_invoices").update({
              external_id: codigoSolicitacao, status: "A_RECEBER", raw_payload: r.data,
            }).eq("id", inv.id);
            emitted++;
          }
        } catch (e) { console.error("emit error", inv.id, e); }
      }
    }
    return json({ ok: true, subscriptions: subs?.length || 0, created, emitted });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
