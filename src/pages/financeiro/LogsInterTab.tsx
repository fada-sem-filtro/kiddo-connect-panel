import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RefreshCw, Repeat, AlertTriangle, CheckCircle2, Eye, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Props { crecheId: string | null }

export function LogsInterTab({ crecheId }: Props) {
  const [logs, setLogs] = useState<any[]>([]);
  const [account, setAccount] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<"all" | "ok" | "error" | "pending">("all");
  const [reprocessing, setReprocessing] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [viewing, setViewing] = useState<any>(null);

  const load = async () => {
    if (!crecheId) return;
    setLoading(true);
    const [l, a] = await Promise.all([
      supabase.from("financial_webhook_logs")
        .select("*").eq("creche_id", crecheId).eq("provider", "inter")
        .order("received_at", { ascending: false }).limit(200),
      supabase.from("financial_accounts")
        .select("connected, last_validation, last_error, account_name")
        .eq("creche_id", crecheId).eq("provider", "inter").maybeSingle(),
    ]);
    setLogs(l.data || []);
    setAccount(a.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, [crecheId]);

  const reprocess = async (id: string) => {
    setReprocessing(id);
    const { data, error } = await supabase.functions.invoke("inter-reprocess-webhook", { body: { log_id: id } });
    setReprocessing(null);
    if (error || data?.error) {
      toast({ title: "Falha ao reprocessar", description: data?.error || error?.message, variant: "destructive" });
      return;
    }
    toast({ title: "Evento reprocessado", description: "O webhook foi reprocessado com sucesso." });
    load();
  };

  const syncNow = async () => {
    if (!crecheId) return;
    setSyncing(true);
    const { data, error } = await supabase.functions.invoke("inter-sync-invoices", { body: { creche_id: crecheId } });
    setSyncing(false);
    if (error || data?.error) {
      toast({ title: "Falha na sincronização", description: data?.error || error?.message, variant: "destructive" });
      return;
    }
    toast({ title: "Sincronização concluída", description: `${data?.updated || 0} cobranças atualizadas.` });
    load();
  };

  const filtered = logs.filter(l => {
    if (filter === "all") return true;
    if (filter === "ok") return l.processed && !l.error;
    if (filter === "error") return !!l.error;
    if (filter === "pending") return !l.processed && !l.error;
    return true;
  });

  const stats = {
    total: logs.length,
    ok: logs.filter(l => l.processed && !l.error).length,
    error: logs.filter(l => !!l.error).length,
    pending: logs.filter(l => !l.processed && !l.error).length,
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2"><AlertTriangle className="w-5 h-5" /> Status de sincronização</CardTitle>
          </div>
          <Button onClick={syncNow} disabled={syncing || !account?.connected} variant="outline" size="sm">
            {syncing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
            Sincronizar agora
          </Button>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Conta:</span>
            <span className="font-medium">{account?.account_name || "—"}</span>
            {account?.connected
              ? <Badge className="bg-green-500/10 text-green-700">Conectada</Badge>
              : <Badge className="bg-red-500/10 text-red-700">Desconectada</Badge>}
          </div>
          <div><span className="text-muted-foreground">Última validação:</span> {account?.last_validation ? format(new Date(account.last_validation), "dd/MM/yyyy HH:mm", { locale: ptBR }) : "—"}</div>
          {account?.last_error && (
            <div className="rounded-md bg-red-500/10 text-red-700 p-3 text-xs font-mono whitespace-pre-wrap break-all">{account.last_error}</div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap">
          <CardTitle>Logs de webhook ({stats.total})</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1"><CheckCircle2 className="w-3 h-3 text-green-600" />{stats.ok} OK</Badge>
            <Badge variant="outline" className="gap-1"><AlertTriangle className="w-3 h-3 text-red-600" />{stats.error} erros</Badge>
            <Badge variant="outline">{stats.pending} pendentes</Badge>
            <Select value={filter} onValueChange={(v: any) => setFilter(v)}>
              <SelectTrigger className="w-[160px] h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="ok">Processados</SelectItem>
                <SelectItem value="error">Com erro</SelectItem>
                <SelectItem value="pending">Pendentes</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={load} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground py-8">Nenhum log encontrado.</div>
          ) : (
            <div className="space-y-2">
              {filtered.map(l => (
                <div key={l.id} className="border rounded-lg p-3 flex items-start justify-between gap-3 hover:bg-muted/30">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className={l.error ? "bg-red-500/10 text-red-700" : l.processed ? "bg-green-500/10 text-green-700" : "bg-yellow-500/10 text-yellow-700"}>
                        {l.error ? "Erro" : l.processed ? "OK" : "Pendente"}
                      </Badge>
                      <span className="font-medium text-sm">{l.event || "—"}</span>
                      {l.external_id && <span className="text-xs text-muted-foreground font-mono">{l.external_id}</span>}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {format(new Date(l.received_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
                    </div>
                    {l.error && <div className="text-xs text-red-600 mt-1 font-mono break-all">{l.error}</div>}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="sm" onClick={() => setViewing(l)}><Eye className="w-4 h-4" /></Button>
                    <Button variant="outline" size="sm" onClick={() => reprocess(l.id)} disabled={reprocessing === l.id}>
                      {reprocessing === l.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Repeat className="w-4 h-4 mr-1" />}
                      Reprocessar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Payload do webhook</DialogTitle></DialogHeader>
          <pre className="text-xs bg-muted p-3 rounded-md overflow-auto max-h-[60vh]">{JSON.stringify(viewing?.payload, null, 2)}</pre>
        </DialogContent>
      </Dialog>
    </div>
  );
}
