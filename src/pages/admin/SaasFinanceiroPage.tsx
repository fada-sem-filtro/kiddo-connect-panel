import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, RefreshCw, CheckCircle2, XCircle, Wallet, DollarSign, AlertTriangle, TrendingUp } from "lucide-react";

export default function SaasFinanceiroPage() {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState<any[]>([]);
  const [subs, setSubs] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [creches, setCreches] = useState<any[]>([]);
  const [form, setForm] = useState({ client_id: "", client_secret: "", certificate: "", private_key: "", environment: "production", conta_corrente: "" });

  const loadAll = async () => {
    const [s, p, sb, inv, cr] = await Promise.all([
      supabase.functions.invoke("saas-inter-status"),
      supabase.from("saas_plans").select("*").order("ordem"),
      supabase.from("saas_subscriptions").select("*, saas_plans(name, code)"),
      supabase.from("saas_invoices").select("*").order("created_at", { ascending: false }).limit(200),
      supabase.from("creches").select("id, nome"),
    ]);
    setStatus(s.data);
    setPlans(p.data || []);
    setSubs(sb.data || []);
    setInvoices(inv.data || []);
    setCreches(cr.data || []);
  };

  useEffect(() => { loadAll(); }, []);

  const crecheNome = (id: string) => creches.find(c => c.id === id)?.nome || id.slice(0, 8);

  const connect = async () => {
    setLoading(true);
    const { error } = await supabase.functions.invoke("saas-inter-connect", { body: form });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Conectado");
    loadAll();
  };

  const testConnection = async () => {
    setLoading(true);
    const { data } = await supabase.functions.invoke("saas-inter-status");
    setLoading(false);
    setStatus(data);
    if (data?.connected) toast.success("Conexão OK"); else toast.error(data?.last_error || "Falha");
  };

  const disconnect = async () => {
    if (!confirm("Desconectar Banco Inter SaaS?")) return;
    await supabase.functions.invoke("saas-inter-disconnect");
    toast.success("Desconectado");
    loadAll();
  };

  const syncNow = async () => {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("saas-inter-sync-invoices");
    setLoading(false);
    if (error) toast.error(error.message); else toast.success(`Sync: ${data?.updated || 0} atualizadas`);
    loadAll();
  };

  const generateNow = async () => {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("saas-generate-monthly-invoices");
    setLoading(false);
    if (error) toast.error(error.message); else toast.success(`Geradas: ${data?.created || 0}, Emitidas: ${data?.emitted || 0}`);
    loadAll();
  };

  const createInvoice = async (id: string) => {
    const { error } = await supabase.functions.invoke("saas-inter-create-invoice", { body: { invoice_id: id } });
    if (error) toast.error(error.message); else { toast.success("Cobrança emitida"); loadAll(); }
  };

  const cancelInvoice = async (id: string) => {
    if (!confirm("Cancelar esta cobrança?")) return;
    const { error } = await supabase.functions.invoke("saas-inter-cancel-invoice", { body: { invoice_id: id } });
    if (error) toast.error(error.message); else { toast.success("Cancelada"); loadAll(); }
  };

  // Métricas dashboard
  const mrr = subs.filter(s => s.status === "active").reduce((acc, s) => acc + Number(s.monthly_amount || 0), 0);
  const recebido = invoices.filter(i => i.paid_at).reduce((acc, i) => acc + Number(i.amount || 0), 0);
  const aberto = invoices.filter(i => ["A_RECEBER","PENDING","ATRASADO"].includes(i.status)).reduce((acc,i)=>acc+Number(i.amount||0),0);
  const vencidas = invoices.filter(i => i.status === "ATRASADO").length;
  const inadimplentes = subs.filter(s => s.status === "past_due").length;

  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const statusBadge = (s: string) => {
    const map: Record<string, string> = {
      RECEBIDO: "bg-green-500", MARCADO_RECEBIDO: "bg-green-500",
      A_RECEBER: "bg-blue-500", PENDING: "bg-blue-500", EM_PROCESSAMENTO: "bg-blue-400",
      ATRASADO: "bg-orange-500", CANCELADO: "bg-gray-400",
    };
    return <Badge className={map[s] || "bg-gray-400"}>{s}</Badge>;
  };

  return (
    <div className="container py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2"><Wallet className="h-7 w-7 text-primary" /> Financeiro SaaS</h1>
          <p className="text-muted-foreground text-sm">Cobrança das escolas pela Agenda Fleur via Banco Inter PJ</p>
        </div>
        <div className="flex items-center gap-2">
          {status?.connected
            ? <Badge className="bg-green-500"><CheckCircle2 className="h-3 w-3 mr-1" />Inter conectado</Badge>
            : <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Desconectado</Badge>}
          <Button size="sm" variant="outline" onClick={syncNow} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} Sincronizar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card><CardHeader className="pb-2"><CardTitle className="text-xs flex items-center gap-1 text-muted-foreground"><TrendingUp className="h-3 w-3" />MRR</CardTitle></CardHeader><CardContent className="pt-0"><div className="text-xl font-bold">{fmt(mrr)}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-xs flex items-center gap-1 text-muted-foreground"><DollarSign className="h-3 w-3" />Recebido</CardTitle></CardHeader><CardContent className="pt-0"><div className="text-xl font-bold text-green-600">{fmt(recebido)}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Em aberto</CardTitle></CardHeader><CardContent className="pt-0"><div className="text-xl font-bold text-blue-600">{fmt(aberto)}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-xs flex items-center gap-1 text-muted-foreground"><AlertTriangle className="h-3 w-3" />Vencidas</CardTitle></CardHeader><CardContent className="pt-0"><div className="text-xl font-bold text-orange-600">{vencidas}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Inadimplentes</CardTitle></CardHeader><CardContent className="pt-0"><div className="text-xl font-bold text-red-600">{inadimplentes}</div></CardContent></Card>
      </div>

      <Tabs defaultValue="subscriptions">
        <TabsList>
          <TabsTrigger value="subscriptions">Mensalidades</TabsTrigger>
          <TabsTrigger value="invoices">Cobranças</TabsTrigger>
          <TabsTrigger value="plans">Planos</TabsTrigger>
          <TabsTrigger value="inter">Banco Inter PJ</TabsTrigger>
        </TabsList>

        <TabsContent value="subscriptions" className="space-y-3">
          <div className="flex justify-end">
            <Button onClick={generateNow} disabled={loading}>Gerar mensalidades do mês</Button>
          </div>
          <Card><CardContent className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>Escola</TableHead><TableHead>Plano</TableHead><TableHead>Valor</TableHead><TableHead>Vencimento</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
              <TableBody>
                {subs.length === 0 ? <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Nenhuma assinatura. Crie via SQL ou backend.</TableCell></TableRow> :
                  subs.map(s => (
                    <TableRow key={s.id}>
                      <TableCell>{crecheNome(s.creche_id)}</TableCell>
                      <TableCell>{s.saas_plans?.name}</TableCell>
                      <TableCell>{fmt(Number(s.monthly_amount))}</TableCell>
                      <TableCell>Dia {s.due_day}</TableCell>
                      <TableCell>{statusBadge(s.status)}</TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="invoices">
          <Card><CardContent className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>Número</TableHead><TableHead>Escola</TableHead><TableHead>Valor</TableHead><TableHead>Vencimento</TableHead><TableHead>Status</TableHead><TableHead>Ações</TableHead></TableRow></TableHeader>
              <TableBody>
                {invoices.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nenhuma cobrança</TableCell></TableRow> :
                  invoices.map(i => (
                    <TableRow key={i.id}>
                      <TableCell className="font-mono text-xs">{i.invoice_number || "-"}</TableCell>
                      <TableCell>{crecheNome(i.creche_id)}</TableCell>
                      <TableCell>{fmt(Number(i.amount))}</TableCell>
                      <TableCell>{i.due_date}</TableCell>
                      <TableCell>{statusBadge(i.status)}</TableCell>
                      <TableCell className="space-x-1">
                        {!i.external_id && <Button size="sm" variant="outline" onClick={() => createInvoice(i.id)}>Emitir</Button>}
                        {i.external_id && i.status !== "CANCELADO" && i.status !== "RECEBIDO" && (
                          <Button size="sm" variant="ghost" onClick={() => cancelInvoice(i.id)}>Cancelar</Button>
                        )}
                        {i.boleto_pdf_url && <a href={i.boleto_pdf_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary underline">Boleto</a>}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="plans">
          <Card><CardContent className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>Código</TableHead><TableHead>Nome</TableHead><TableHead>Valor mensal</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
              <TableBody>
                {plans.map(p => (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono">{p.code}</TableCell>
                    <TableCell>{p.name}</TableCell>
                    <TableCell>{fmt(Number(p.monthly_price))}</TableCell>
                    <TableCell>{p.active ? <Badge className="bg-green-500">Ativo</Badge> : <Badge variant="outline">Inativo</Badge>}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="inter" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Configuração Banco Inter PJ (Agenda Fleur)</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {status?.last_error && (
                <div className="p-3 rounded bg-destructive/10 text-destructive text-sm">{status.last_error}</div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Client ID</Label><Input value={form.client_id} onChange={e => setForm({...form, client_id: e.target.value})} /></div>
                <div><Label>Client Secret</Label><Input type="password" value={form.client_secret} onChange={e => setForm({...form, client_secret: e.target.value})} /></div>
                <div><Label>Conta corrente (opcional)</Label><Input value={form.conta_corrente} onChange={e => setForm({...form, conta_corrente: e.target.value})} /></div>
                <div>
                  <Label>Ambiente</Label>
                  <Select value={form.environment} onValueChange={v => setForm({...form, environment: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="production">Produção</SelectItem><SelectItem value="sandbox">Sandbox</SelectItem></SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label>Certificado (.crt)</Label><Textarea rows={4} placeholder="-----BEGIN CERTIFICATE-----..." value={form.certificate} onChange={e => setForm({...form, certificate: e.target.value})} /></div>
              <div><Label>Chave privada (.key)</Label><Textarea rows={4} placeholder="-----BEGIN PRIVATE KEY-----..." value={form.private_key} onChange={e => setForm({...form, private_key: e.target.value})} /></div>
              <div className="flex gap-2">
                <Button onClick={connect} disabled={loading}>Salvar e conectar</Button>
                <Button variant="outline" onClick={testConnection} disabled={loading}>Testar conexão</Button>
                {status?.connected && <Button variant="ghost" onClick={disconnect}>Desconectar</Button>}
              </div>
              {status?.webhook_secret && (
                <div className="text-xs text-muted-foreground p-3 bg-muted rounded">
                  <strong>URL do webhook:</strong> https://takzcbagxjydlkzenprr.supabase.co/functions/v1/saas-inter-webhook?secret={status.webhook_secret}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
