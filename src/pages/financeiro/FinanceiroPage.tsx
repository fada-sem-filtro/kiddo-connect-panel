import { useEffect, useMemo, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Receipt, Plug, Wallet, AlertTriangle, BarChart3, Send, RefreshCw, Copy, CheckCircle2, Loader2, Bell, X, Download, Repeat, Unplug, Pencil, Building2 } from "lucide-react";
import { BancoInterTab } from "./BancoInterTab";
import { CobrancasInterTab } from "./CobrancasInterTab";
import { LogsInterTab } from "./LogsInterTab";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useFinancialProvider } from "@/hooks/useFinancialProvider";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  PENDING: { label: "Pendente", color: "bg-yellow-500/10 text-yellow-700" },
  RECEIVED: { label: "Recebido", color: "bg-green-500/10 text-green-700" },
  CONFIRMED: { label: "Confirmado", color: "bg-green-500/10 text-green-700" },
  OVERDUE: { label: "Vencido", color: "bg-red-500/10 text-red-700" },
  REFUNDED: { label: "Estornado", color: "bg-gray-500/10 text-gray-700" },
  RECEIVED_IN_CASH: { label: "Em dinheiro", color: "bg-blue-500/10 text-blue-700" },
};

const fmtBRL = (v: number) => `R$ ${Number(v).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

export default function FinanceiroPage() {
  const { profile, role } = useAuth();
  const isAdmin = role === "admin";
  const [crecheId, setCrecheId] = useState<string | null>(null);
  const { provider, environment } = useFinancialProvider(crecheId);
  const [settings, setSettings] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [criancas, setCriancas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("dashboard");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [showNewModal, setShowNewModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      if (!profile?.user_id) return;
      const { data: cm } = await supabase.from("creche_membros").select("creche_id").eq("user_id", profile.user_id).maybeSingle();
      if (cm?.creche_id) setCrecheId(cm.creche_id);
    })();
  }, [profile?.user_id]);

  const load = async () => {
    if (!crecheId) return;
    setLoading(true);
    const [s, i, p, c] = await Promise.all([
      supabase.from("financial_settings").select("id, asaas_api_key_last4, asaas_environment, asaas_connected, asaas_account_name, asaas_account_email, asaas_last_validation").eq("creche_id", crecheId).maybeSingle(),
      supabase.from("invoices").select("*").eq("creche_id", crecheId).order("due_date", { ascending: false }).limit(500),
      supabase.from("payments").select("*").eq("creche_id", crecheId).order("paid_at", { ascending: false }).limit(200),
      supabase.from("criancas").select("id, nome, turma_id").order("nome"),
    ]);
    setSettings(s.data);
    setInvoices(i.data || []);
    setPayments(p.data || []);
    setCriancas(c.data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [crecheId]);

  const today = new Date().toISOString().slice(0, 10);
  const adj = invoices.map(inv => ({ ...inv, eff: inv.status === "PENDING" && inv.due_date < today ? "OVERDUE" : inv.status }));
  const totalRecebido = adj.filter(i => ["RECEIVED", "CONFIRMED"].includes(i.eff)).reduce((s, i) => s + Number(i.value), 0);
  const totalPendente = adj.filter(i => i.eff === "PENDING").reduce((s, i) => s + Number(i.value), 0);
  const totalVencido = adj.filter(i => i.eff === "OVERDUE").reduce((s, i) => s + Number(i.value), 0);
  const taxa = adj.length ? (adj.filter(i => i.eff === "OVERDUE").length / adj.length) * 100 : 0;
  const filtered = adj.filter(i => filterStatus === "all" ? true : i.eff === filterStatus);

  const [confirmCancel, setConfirmCancel] = useState<string | null>(null);
  const [acting, setActing] = useState<string | null>(null);
  const [showSubModal, setShowSubModal] = useState(false);

  const copyPix = async (txt: string) => {
    await navigator.clipboard.writeText(txt);
    toast({ title: "Pix copiado!", description: "Cole no app do banco para pagar." });
  };

  const resendNotif = async (invoiceId: string) => {
    setActing(invoiceId);
    const { data, error } = await supabase.functions.invoke("asaas-resend-notification", { body: { creche_id: crecheId, invoice_id: invoiceId } });
    setActing(null);
    if (error || data?.error) { toast({ title: "Erro", description: data?.error || error?.message, variant: "destructive" }); return; }
    toast({ title: "Notificação reenviada!", description: "O cliente foi notificado por email/SMS." });
  };

  const cancelInvoice = async (invoiceId: string) => {
    setActing(invoiceId);
    const { data, error } = await supabase.functions.invoke("asaas-cancel-payment", { body: { creche_id: crecheId, invoice_id: invoiceId } });
    setActing(null);
    setConfirmCancel(null);
    if (error || data?.error) { toast({ title: "Erro", description: data?.error || error?.message, variant: "destructive" }); return; }
    toast({ title: "Cobrança cancelada" });
    load();
  };

  const exportCSV = (rows: any[], filename: string) => {
    const header = ["Aluno", "Descrição", "Valor", "Vencimento", "Status", "Método"];
    const lines = rows.map(r => {
      const child = criancas.find(c => c.id === r.crianca_id);
      return [child?.nome || "", r.description || "", r.value, r.due_date, r.eff || r.status, r.payment_method].map(v => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",");
    });
    const csv = [header.join(","), ...lines].join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <MainLayout>
      <div className="space-y-4 p-4 md:p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2"><Wallet className="w-7 h-7 text-primary" />Financeiro</h1>
            <p className="text-sm text-muted-foreground">
              {provider === "inter" ? "Mensalidades, cobranças e PIX via Banco Inter PJ"
                : provider === "asaas" ? "Mensalidades, cobranças e PIX via Asaas"
                : "Provider financeiro ainda não definido pelo administrador"}
            </p>
          </div>
          {provider === "inter" ? (
            <Badge className="bg-orange-500/10 text-orange-700 rounded-lg"><CheckCircle2 className="w-3.5 h-3.5 mr-1" />Banco Inter PJ {environment ? `(${environment})` : ""}</Badge>
          ) : provider === "asaas" ? (
            settings?.asaas_connected ? (
              <Badge className="bg-green-500/10 text-green-700 rounded-lg"><CheckCircle2 className="w-3.5 h-3.5 mr-1" />Asaas conectado ({settings.asaas_environment})</Badge>
            ) : (
              <Badge className="bg-yellow-500/10 text-yellow-700 rounded-lg"><AlertTriangle className="w-3.5 h-3.5 mr-1" />Asaas não configurado</Badge>
            )
          ) : (
            <Badge className="bg-muted text-muted-foreground rounded-lg"><AlertTriangle className="w-3.5 h-3.5 mr-1" />Sem provider</Badge>
          )}
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="flex flex-wrap gap-1 h-auto bg-muted/50 p-1 rounded-2xl">
            <TabsTrigger value="dashboard" className="rounded-xl"><BarChart3 className="w-4 h-4 mr-1.5" />Dashboard</TabsTrigger>
            {provider === "asaas" && <>
              <TabsTrigger value="cobrancas" className="rounded-xl"><Receipt className="w-4 h-4 mr-1.5" />Cobranças</TabsTrigger>
              <TabsTrigger value="recorrencias" className="rounded-xl"><Repeat className="w-4 h-4 mr-1.5" />Recorrências</TabsTrigger>
              <TabsTrigger value="inadimplencia" className="rounded-xl"><AlertTriangle className="w-4 h-4 mr-1.5" />Inadimplência</TabsTrigger>
              {isAdmin && <TabsTrigger value="integracao" className="rounded-xl"><Plug className="w-4 h-4 mr-1.5" />Integração Asaas</TabsTrigger>}
            </>}
            {provider === "inter" && <>
              <TabsTrigger value="inter-cobrancas" className="rounded-xl"><Receipt className="w-4 h-4 mr-1.5" />Cobranças</TabsTrigger>
              <TabsTrigger value="inadimplencia" className="rounded-xl"><AlertTriangle className="w-4 h-4 mr-1.5" />Inadimplência</TabsTrigger>
              {isAdmin && <TabsTrigger value="inter" className="rounded-xl"><Building2 className="w-4 h-4 mr-1.5" />Integração Inter</TabsTrigger>}
              <TabsTrigger value="inter-logs" className="rounded-xl"><AlertTriangle className="w-4 h-4 mr-1.5" />Logs</TabsTrigger>
            </>}
          </TabsList>

          {/* DASHBOARD */}
          <TabsContent value="dashboard" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <KpiCard title="Recebido" value={fmtBRL(totalRecebido)} color="text-green-700" />
              <KpiCard title="Pendente" value={fmtBRL(totalPendente)} color="text-yellow-700" />
              <KpiCard title="Vencido" value={fmtBRL(totalVencido)} color="text-red-700" />
              <KpiCard title="Taxa inadimplência" value={`${taxa.toFixed(1)}%`} color="text-foreground" />
            </div>
            <Card className="rounded-2xl border-2"><CardHeader><CardTitle className="text-base">Pagamentos recentes</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {payments.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum pagamento registrado.</p> :
                  payments.slice(0, 10).map(p => (
                    <div key={p.id} className="flex justify-between p-2 bg-muted/40 rounded-lg text-sm">
                      <span>{format(new Date(p.paid_at), "dd/MM/yyyy", { locale: ptBR })} • {p.payment_method}</span>
                      <span className="font-bold text-green-700">{fmtBRL(p.value)}</span>
                    </div>
                  ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* COBRANÇAS */}
          <TabsContent value="cobrancas" className="space-y-3 mt-4">
            <div className="flex flex-wrap gap-2 items-center">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-48 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="PENDING">Pendentes</SelectItem>
                  <SelectItem value="OVERDUE">Vencidos</SelectItem>
                  <SelectItem value="RECEIVED">Recebidos</SelectItem>
                  <SelectItem value="CONFIRMED">Confirmados</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={() => exportCSV(filtered, `cobrancas_${today}.csv`)} className="rounded-xl">
                <Download className="w-4 h-4 mr-1.5" />Exportar CSV
              </Button>
              <Button onClick={() => setShowNewModal(true)} disabled={!settings?.asaas_connected} className="rounded-xl ml-auto">
                <Send className="w-4 h-4 mr-1.5" />Nova cobrança
              </Button>
            </div>
            {loading ? <p className="text-sm text-muted-foreground">Carregando…</p> :
              filtered.length === 0 ? <p className="text-sm text-muted-foreground">Nenhuma cobrança.</p> :
              <div className="space-y-2">
                {filtered.map(inv => {
                  const child = criancas.find(c => c.id === inv.crianca_id);
                  const stat = STATUS_LABEL[inv.eff] || { label: inv.eff, color: "bg-gray-500/10 text-gray-700" };
                  const isFinal = ["RECEIVED", "CONFIRMED", "REFUNDED", "DELETED"].includes(inv.status);
                  return (
                    <Card key={inv.id} className="rounded-xl border">
                      <CardContent className="p-3 flex flex-col md:flex-row md:items-center justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{inv.description || "Cobrança"}</p>
                          <p className="text-xs text-muted-foreground">{child?.nome || "—"} • Vence {format(new Date(inv.due_date), "dd/MM/yyyy")}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={`${stat.color} rounded-lg`}>{stat.label}</Badge>
                          <span className="font-bold">{fmtBRL(inv.value)}</span>
                        </div>
                        <div className="flex gap-1 flex-wrap">
                          {inv.invoice_url && <Button size="sm" variant="outline" className="rounded-lg" asChild><a href={inv.invoice_url} target="_blank">Ver</a></Button>}
                          {inv.pix_copy_paste && <Button size="sm" variant="outline" className="rounded-lg" onClick={() => copyPix(inv.pix_copy_paste)} title="Copiar Pix"><Copy className="w-3.5 h-3.5" /></Button>}
                          {!isFinal && (
                            <>
                              <Button size="sm" variant="outline" className="rounded-lg" onClick={() => resendNotif(inv.id)} disabled={acting === inv.id} title="Reenviar notificação">
                                {acting === inv.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Bell className="w-3.5 h-3.5" />}
                              </Button>
                              <Button size="sm" variant="outline" className="rounded-lg text-red-600 hover:text-red-700" onClick={() => setConfirmCancel(inv.id)} title="Cancelar cobrança">
                                <X className="w-3.5 h-3.5" />
                              </Button>
                            </>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>}
          </TabsContent>

          {/* RECORRÊNCIAS */}
          <TabsContent value="recorrencias" className="space-y-3 mt-4">
            <SubscriptionsList
              crecheId={crecheId}
              criancas={criancas}
              connected={!!settings?.asaas_connected}
              onNew={() => setShowSubModal(true)}
            />
          </TabsContent>

          {/* INADIMPLÊNCIA */}
          <TabsContent value="inadimplencia" className="space-y-2 mt-4">
            {adj.filter(i => i.eff === "OVERDUE").length === 0 ? <p className="text-sm text-muted-foreground">Sem inadimplência. 🎉</p> :
              adj.filter(i => i.eff === "OVERDUE").map(inv => {
                const child = criancas.find(c => c.id === inv.crianca_id);
                return (
                  <Card key={inv.id} className="rounded-xl border-2 border-red-500/30">
                    <CardContent className="p-3 flex justify-between">
                      <div>
                        <p className="font-medium">{child?.nome || "—"}</p>
                        <p className="text-xs text-muted-foreground">{inv.description} • Venceu em {format(new Date(inv.due_date), "dd/MM/yyyy")}</p>
                      </div>
                      <span className="font-bold text-red-700">{fmtBRL(inv.value)}</span>
                    </CardContent>
                  </Card>
                );
              })}
          </TabsContent>

          {/* INTEGRAÇÃO */}
          <TabsContent value="integracao" className="mt-4">
            <IntegracaoAsaas crecheId={crecheId} settings={settings} onChange={load} />
          </TabsContent>

          {/* BANCO INTER */}
          <TabsContent value="inter" className="mt-4">
            <BancoInterTab crecheId={crecheId} />
          </TabsContent>
          <TabsContent value="inter-cobrancas" className="mt-4">
            <CobrancasInterTab crecheId={crecheId} criancas={criancas} />
          </TabsContent>
          <TabsContent value="inter-logs" className="mt-4">
            <LogsInterTab crecheId={crecheId} />
          </TabsContent>
        </Tabs>
      </div>

      {showNewModal && crecheId && (
        <NovaCobrancaModal
          open={showNewModal}
          onClose={() => setShowNewModal(false)}
          crecheId={crecheId}
          criancas={criancas}
          onCreated={() => { setShowNewModal(false); load(); }}
        />
      )}
      {showSubModal && crecheId && (
        <NovaRecorrenciaModal
          open={showSubModal}
          onClose={() => setShowSubModal(false)}
          crecheId={crecheId}
          criancas={criancas}
          onCreated={() => { setShowSubModal(false); load(); }}
        />
      )}
      <AlertDialog open={!!confirmCancel} onOpenChange={(o) => !o && setConfirmCancel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar cobrança?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação irá cancelar a cobrança no Asaas. O cliente será notificado. Não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction onClick={() => confirmCancel && cancelInvoice(confirmCancel)} className="bg-red-600 hover:bg-red-700">Cancelar cobrança</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}

function SubscriptionsList({ crecheId, criancas, refreshKey, connected, onNew }: { crecheId: string | null; criancas: any[]; refreshKey?: number; connected?: boolean; onNew?: () => void }) {
  const [subs, setSubs] = useState<any[]>([]);
  const [reloadTick, setReloadTick] = useState(0);
  const [editing, setEditing] = useState<any>(null);
  const [confirmCancel, setConfirmCancel] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<{ at: string; upserted: number; deactivated: number; skipped?: number } | null>(null);

  const syncStorageKey = crecheId ? `asaas:lastSync:${crecheId}` : null;

  const reload = async () => {
    if (!crecheId) return;
    const { data } = await supabase.from("subscriptions").select("*").eq("creche_id", crecheId).order("next_due_date");
    setSubs(data || []);
  };
  useEffect(() => { reload(); }, [crecheId, reloadTick, refreshKey]);

  useEffect(() => {
    if (!syncStorageKey) { setLastSync(null); return; }
    try {
      const raw = localStorage.getItem(syncStorageKey);
      setLastSync(raw ? JSON.parse(raw) : null);
    } catch { setLastSync(null); }
  }, [syncStorageKey]);

  const syncWithAsaas = async () => {
    if (!crecheId) return;
    setSyncing(true);
    const { data, error } = await supabase.functions.invoke("asaas-sync-subscriptions", { body: { creche_id: crecheId } });
    setSyncing(false);
    if (error || data?.error) {
      toast({ title: "Erro ao sincronizar", description: data?.error || error?.message, variant: "destructive" });
      return;
    }
    const result = {
      at: new Date().toISOString(),
      upserted: data?.upserted ?? 0,
      deactivated: data?.deactivated ?? 0,
      skipped: data?.skipped ?? 0,
    };
    setLastSync(result);
    if (syncStorageKey) {
      try { localStorage.setItem(syncStorageKey, JSON.stringify(result)); } catch { /* ignore */ }
    }
    toast({ title: "Sincronizado com Asaas", description: `${result.upserted} atualizadas, ${result.deactivated} desativadas.` });
    setReloadTick(t => t + 1);
  };

  const cancelSub = async () => {
    if (!confirmCancel) return;
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("asaas-update-subscription", {
      body: { creche_id: crecheId, subscription_id: confirmCancel.id, action: "cancel" },
    });
    setBusy(false);
    setConfirmCancel(null);
    if (error || data?.error) { toast({ title: "Erro", description: data?.error || error?.message, variant: "destructive" }); return; }
    toast({ title: "Recorrência cancelada" });
    setReloadTick(t => t + 1);
  };

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <div className="text-xs text-muted-foreground">
          {lastSync ? (
            <span>
              Última sincronização: <b className="text-foreground">{format(new Date(lastSync.at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</b>
              {" • "}
              <span className="text-blue-600">{lastSync.upserted} atualizada{lastSync.upserted === 1 ? "" : "s"}</span>
              {" • "}
              <span className="text-gray-600">{lastSync.deactivated} desativada{lastSync.deactivated === 1 ? "" : "s"}</span>
              {lastSync.skipped ? <> {" • "}<span className="text-amber-600">{lastSync.skipped} ignorada{lastSync.skipped === 1 ? "" : "s"}</span></> : null}
            </span>
          ) : (
            <span>Nunca sincronizado com o Asaas.</span>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={syncWithAsaas}
            disabled={!connected || syncing || !crecheId}
            className="rounded-xl"
            title="Sincronizar com Asaas"
          >
            {syncing ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-1.5" />}
            Atualizar
          </Button>
          {onNew && (
            <Button onClick={onNew} disabled={!connected} className="rounded-xl">
              <Repeat className="w-4 h-4 mr-1.5" />Nova recorrência
            </Button>
          )}
        </div>
      </div>

      {!subs.length ? (
        <p className="text-sm text-muted-foreground">Nenhuma recorrência cadastrada.</p>
      ) : (
        <div className="space-y-2">
          {subs.map(s => {
            const child = criancas.find(c => c.id === s.crianca_id);
            const inactive = s.status === "INACTIVE" || s.status === "CANCELED";
            return (
              <Card key={s.id} className={`rounded-xl border ${inactive ? "opacity-60" : ""}`}>
                <CardContent className="p-3 flex flex-col md:flex-row md:items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{s.description || "Recorrência"}</p>
                    <p className="text-xs text-muted-foreground">{child?.nome || "—"} • {s.cycle} • próx. {format(new Date(s.next_due_date), "dd/MM/yyyy")}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={`rounded-lg ${inactive ? "bg-gray-500/10 text-gray-700" : "bg-blue-500/10 text-blue-700"}`}>{s.status}</Badge>
                    <span className="font-bold">{fmtBRL(s.value)}</span>
                  </div>
                  <div className="flex gap-1">
                    {!inactive && (
                      <>
                        <Button size="sm" variant="outline" className="rounded-lg" onClick={() => setEditing(s)} title="Editar">
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="sm" variant="outline" className="rounded-lg text-red-600 hover:text-red-700" onClick={() => setConfirmCancel(s)} title="Cancelar recorrência">
                          <X className="w-3.5 h-3.5" />
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}


      {editing && (
        <EditarRecorrenciaModal
          open={!!editing}
          onClose={() => setEditing(null)}
          crecheId={crecheId}
          subscription={editing}
          onSaved={() => { setEditing(null); setReloadTick(t => t + 1); }}
        />
      )}

      <AlertDialog open={!!confirmCancel} onOpenChange={(o) => !o && setConfirmCancel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar recorrência?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação irá cancelar a recorrência <b>{confirmCancel?.description || ""}</b> no Asaas. Novas cobranças deixarão de ser geradas. Cobranças já emitidas não são afetadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Voltar</AlertDialogCancel>
            <AlertDialogAction onClick={cancelSub} disabled={busy} className="bg-red-600 hover:bg-red-700">
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "Cancelar recorrência"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function EditarRecorrenciaModal({ open, onClose, crecheId, subscription, onSaved }: any) {
  const [value, setValue] = useState(String(subscription.value ?? ""));
  const [nextDue, setNextDue] = useState(subscription.next_due_date || "");
  const [cycle, setCycle] = useState(subscription.cycle || "MONTHLY");
  const [description, setDescription] = useState(subscription.description || "");
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("asaas-update-subscription", {
      body: {
        creche_id: crecheId, subscription_id: subscription.id, action: "update",
        value: Number(value), next_due_date: nextDue, cycle, description,
      },
    });
    setBusy(false);
    if (error || data?.error) { toast({ title: "Erro", description: data?.error || error?.message, variant: "destructive" }); return; }
    toast({ title: "Recorrência atualizada!" });
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Editar recorrência</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div><Label>Valor (R$)</Label><Input type="number" value={value} onChange={e => setValue(e.target.value)} /></div>
            <div><Label>Próximo vencimento</Label><Input type="date" value={nextDue} onChange={e => setNextDue(e.target.value)} /></div>
          </div>
          <div><Label>Frequência</Label>
            <Select value={cycle} onValueChange={setCycle}>
              <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="MONTHLY">Mensal</SelectItem>
                <SelectItem value="QUARTERLY">Trimestral</SelectItem>
                <SelectItem value="YEARLY">Anual</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label>Descrição</Label><Input value={description} onChange={e => setDescription(e.target.value)} /></div>
          <p className="text-xs text-muted-foreground">A forma de pagamento não pode ser alterada após a criação. Para mudar, cancele e crie uma nova recorrência.</p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={busy}>Fechar</Button>
          <Button onClick={save} disabled={busy || !value || !nextDue}>{busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "Salvar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


function NovaRecorrenciaModal({ open, onClose, crecheId, criancas, onCreated }: any) {
  const [criancaId, setCriancaId] = useState("");
  const [name, setName] = useState(""); const [email, setEmail] = useState("");
  const [phone, setPhone] = useState(""); const [cpf, setCpf] = useState("");
  const [value, setValue] = useState(""); const [nextDue, setNextDue] = useState("");
  const [cycle, setCycle] = useState("MONTHLY"); const [billingType, setBillingType] = useState("PIX");
  const [description, setDescription] = useState(""); const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("asaas-create-subscription", {
      body: {
        creche_id: crecheId, crianca_id: criancaId || null,
        customer: { name, email, phone, cpf_cnpj: cpf },
        value: Number(value), next_due_date: nextDue, cycle, billing_type: billingType, description,
      },
    });
    setBusy(false);
    if (error || data?.error) { toast({ title: "Erro", description: data?.error || error?.message, variant: "destructive" }); return; }
    toast({ title: "Recorrência criada!", description: "As cobranças serão geradas automaticamente." });
    onCreated();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Nova recorrência</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Aluno (opcional)</Label>
            <Select value={criancaId} onValueChange={setCriancaId}>
              <SelectTrigger className="rounded-xl"><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>{criancas.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label>Nome do responsável</Label><Input value={name} onChange={e => setName(e.target.value)} /></div>
            <div><Label>CPF/CNPJ</Label><Input value={cpf} onChange={e => setCpf(e.target.value)} /></div>
            <div><Label>Email</Label><Input value={email} onChange={e => setEmail(e.target.value)} /></div>
            <div><Label>Telefone</Label><Input value={phone} onChange={e => setPhone(e.target.value)} /></div>
            <div><Label>Valor (R$)</Label><Input type="number" value={value} onChange={e => setValue(e.target.value)} /></div>
            <div><Label>Próximo vencimento</Label><Input type="date" value={nextDue} onChange={e => setNextDue(e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label>Frequência</Label>
              <Select value={cycle} onValueChange={setCycle}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="MONTHLY">Mensal</SelectItem>
                  <SelectItem value="QUARTERLY">Trimestral</SelectItem>
                  <SelectItem value="YEARLY">Anual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Forma de pagamento</Label>
              <Select value={billingType} onValueChange={setBillingType}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="PIX">PIX</SelectItem>
                  <SelectItem value="BOLETO">Boleto</SelectItem>
                  <SelectItem value="UNDEFINED">Cliente escolhe</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div><Label>Descrição</Label><Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Mensalidade escolar 2026" /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Fechar</Button>
          <Button onClick={submit} disabled={busy || !name || !cpf || !value || !nextDue}>{busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "Criar recorrência"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function KpiCard({ title, value, color }: { title: string; value: string; color: string }) {
  return (
    <Card className="rounded-2xl border-2"><CardContent className="p-4">
      <p className="text-xs text-muted-foreground">{title}</p>
      <p className={`text-xl font-bold mt-1 ${color}`}>{value}</p>
    </CardContent></Card>
  );
}

function IntegracaoAsaas({ crecheId, settings, onChange }: { crecheId: string | null; settings: any; onChange: () => void }) {
  const [apiKey, setApiKey] = useState("");
  const [env, setEnv] = useState<"production" | "sandbox">("production");
  const [busy, setBusy] = useState(false);

  const connect = async () => {
    if (!crecheId || !apiKey) return;
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("asaas-connect", { body: { creche_id: crecheId, api_key: apiKey, environment: env } });
    setBusy(false);
    if (error || data?.error) { toast({ title: "Erro", description: data?.error || error?.message, variant: "destructive" }); return; }
    toast({ title: "Conectado!", description: `Conta: ${data.account_name || "ok"}` });
    setApiKey("");
    onChange();
  };

  return (
    <Card className="rounded-2xl border-2 max-w-2xl">
      <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Plug className="w-5 h-5 text-primary" />Integração Asaas</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        {settings?.asaas_connected ? (
          <div className="space-y-2 p-3 bg-green-500/5 border border-green-500/30 rounded-xl">
            <p className="text-sm"><b>Conta:</b> {settings.asaas_account_name || "—"}</p>
            <p className="text-sm"><b>Email:</b> {settings.asaas_account_email || "—"}</p>
            <p className="text-sm"><b>Ambiente:</b> {settings.asaas_environment}</p>
            <p className="text-sm"><b>Chave:</b> ••••{settings.asaas_api_key_last4}</p>
            <p className="text-xs text-muted-foreground">Última validação: {settings.asaas_last_validation ? format(new Date(settings.asaas_last_validation), "dd/MM/yyyy HH:mm") : "—"}</p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Conecte a conta Asaas da sua escola. Os pagamentos vão diretamente para sua conta bancária — a Agenda Fleur não intermedia valores.</p>
        )}
        <div className="space-y-2">
          <Label>Ambiente</Label>
          <Select value={env} onValueChange={(v) => setEnv(v as any)}>
            <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="production">Produção</SelectItem>
              <SelectItem value="sandbox">Sandbox (testes)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>API Key Asaas</Label>
          <Input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="$aact_..." className="rounded-xl" />
          <p className="text-xs text-muted-foreground">Encontre sua chave em: Asaas → Integrações → Chave de API. A chave é criptografada (AES-256-GCM) antes de salvar e nunca exposta no frontend.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={connect} disabled={busy || !apiKey} className="rounded-xl">
            {busy ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
            {settings?.asaas_connected ? "Reconectar" : "Conectar e validar"}
          </Button>
          {settings?.asaas_connected && (
            <Button variant="outline" disabled={busy} onClick={async () => {
              setBusy(true);
              const { data, error } = await supabase.functions.invoke("asaas-disconnect", { body: { creche_id: crecheId } });
              setBusy(false);
              if (error || data?.error) { toast({ title: "Erro", description: data?.error || error?.message, variant: "destructive" }); return; }
              toast({ title: "Desconectado", description: "A integração foi removida." });
              onChange();
            }} className="rounded-xl text-red-600 hover:text-red-700">
              <Unplug className="w-4 h-4 mr-2" />Desconectar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function NovaCobrancaModal({ open, onClose, crecheId, criancas, onCreated }: any) {
  const [criancaId, setCriancaId] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [cpf, setCpf] = useState("");
  const [value, setValue] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [billingType, setBillingType] = useState("PIX");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("asaas-create-payment", {
      body: {
        creche_id: crecheId, crianca_id: criancaId || null,
        customer: { name, email, phone, cpf_cnpj: cpf },
        value: Number(value), due_date: dueDate, billing_type: billingType, description,
      },
    });
    setBusy(false);
    if (error || data?.error) { toast({ title: "Erro", description: data?.error || error?.message, variant: "destructive" }); return; }
    toast({ title: "Cobrança criada!" });
    onCreated();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Nova cobrança</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Aluno (opcional)</Label>
            <Select value={criancaId} onValueChange={setCriancaId}>
              <SelectTrigger className="rounded-xl"><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>{criancas.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label>Nome do responsável</Label><Input value={name} onChange={e => setName(e.target.value)} /></div>
            <div><Label>CPF/CNPJ</Label><Input value={cpf} onChange={e => setCpf(e.target.value)} /></div>
            <div><Label>Email</Label><Input value={email} onChange={e => setEmail(e.target.value)} /></div>
            <div><Label>Telefone</Label><Input value={phone} onChange={e => setPhone(e.target.value)} /></div>
            <div><Label>Valor (R$)</Label><Input type="number" value={value} onChange={e => setValue(e.target.value)} /></div>
            <div><Label>Vencimento</Label><Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} /></div>
          </div>
          <div><Label>Forma de pagamento</Label>
            <Select value={billingType} onValueChange={setBillingType}>
              <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="PIX">PIX</SelectItem>
                <SelectItem value="BOLETO">Boleto</SelectItem>
                <SelectItem value="CREDIT_CARD">Cartão de crédito</SelectItem>
                <SelectItem value="UNDEFINED">Cliente escolhe</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label>Descrição</Label><Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Mensalidade outubro" /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={submit} disabled={busy || !name || !cpf || !value || !dueDate}>{busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "Criar cobrança"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
