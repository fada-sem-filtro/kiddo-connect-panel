import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

export default function AdminFinanceiroGlobalPage() {
  const [escolas, setEscolas] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const [c, s, l] = await Promise.all([
        supabase.from("creches").select("id, nome"),
        supabase.from("financial_settings").select("creche_id, asaas_environment, asaas_connected, asaas_account_name, asaas_last_validation, asaas_api_key_last4"),
        supabase.from("asaas_webhook_logs").select("*").order("received_at", { ascending: false }).limit(100),
      ]);
      const map = new Map((s.data || []).map((x: any) => [x.creche_id, x]));
      setEscolas((c.data || []).map((e: any) => ({ ...e, settings: map.get(e.id) })));
      setLogs(l.data || []);
    })();
  }, []);

  return (
    <MainLayout>
      <div className="space-y-4 p-4 md:p-6">
        <h1 className="text-2xl md:text-3xl font-bold">Financeiro — Painel Global</h1>
        <p className="text-sm text-muted-foreground">Visão administrativa das integrações Asaas. A Agenda Fleur não acessa valores das escolas.</p>

        <Card className="rounded-2xl border-2"><CardHeader><CardTitle>Escolas conectadas</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {escolas.map(e => (
              <div key={e.id} className="flex items-center justify-between p-3 bg-muted/40 rounded-xl">
                <div>
                  <p className="font-medium">{e.nome}</p>
                  <p className="text-xs text-muted-foreground">
                    {e.settings?.asaas_connected ? `${e.settings.asaas_account_name || "—"} • ••••${e.settings.asaas_api_key_last4} • ${e.settings.asaas_environment}` : "Não conectada"}
                  </p>
                </div>
                <Badge className={e.settings?.asaas_connected ? "bg-green-500/10 text-green-700" : "bg-yellow-500/10 text-yellow-700"}>
                  {e.settings?.asaas_connected ? "Conectada" : "Desconectada"}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-2"><CardHeader><CardTitle>Logs de webhook (últimos 100)</CardTitle></CardHeader>
          <CardContent className="space-y-1 max-h-[60vh] overflow-y-auto">
            {logs.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum evento.</p> :
              logs.map(l => (
                <div key={l.id} className="text-xs p-2 bg-muted/30 rounded flex justify-between">
                  <span><b>{l.event}</b> • {l.asaas_payment_id || "—"}</span>
                  <span className={l.processed ? "text-green-700" : "text-red-700"}>
                    {l.processed ? "ok" : "erro"} • {format(new Date(l.received_at), "dd/MM HH:mm")}
                  </span>
                </div>
              ))}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
