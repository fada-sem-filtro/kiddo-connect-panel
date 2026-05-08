import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Receipt, Plus, RefreshCw, Copy, X, Loader2, QrCode } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Props { crecheId: string | null; criancas: any[]; }

const STATUS_COLOR: Record<string, string> = {
  EM_PROCESSAMENTO: "bg-yellow-500/10 text-yellow-700",
  A_RECEBER: "bg-blue-500/10 text-blue-700",
  RECEBIDO: "bg-green-500/10 text-green-700",
  MARCADO_RECEBIDO: "bg-green-500/10 text-green-700",
  ATRASADO: "bg-red-500/10 text-red-700",
  CANCELADO: "bg-gray-500/10 text-gray-700",
  EXPIRADO: "bg-gray-500/10 text-gray-700",
};

const fmtBRL = (v: number) => `R$ ${Number(v).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

export function CobrancasInterTab({ crecheId, criancas }: Props) {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [pixModal, setPixModal] = useState<any>(null);
  const [confirmCancel, setConfirmCancel] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");

  const load = async () => {
    if (!crecheId) return;
    setLoading(true);
    const { data } = await supabase.from("financial_invoices" as any)
      .select("*").eq("creche_id", crecheId).eq("provider", "inter")
      .order("due_date", { ascending: false }).limit(300);
    setInvoices((data as any[]) || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, [crecheId]);

  const sync = async () => {
    if (!crecheId) return;
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke("inter-sync-invoices", { body: { creche_id: crecheId } });
      if (error) throw error;
      const r = data as any;
      toast({ title: "Sincronização concluída", description: `${r.scanned} verificadas · ${r.updated} atualizadas · ${r.paid} pagas` });
      await load();
    } catch (e: any) {
      toast({ title: "Falha na sincronização", description: e.message, variant: "destructive" });
    } finally { setSyncing(false); }
  };

  const cancel = async (id: string) => {
    if (!crecheId) return;
    try {
      const { error } = await supabase.functions.invoke("inter-cancel-invoice", { body: { creche_id: crecheId, invoice_id: id, motivo: "ACERTOS" } });
      if (error) throw error;
      toast({ title: "Cobrança cancelada" });
      await load();
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    } finally { setConfirmCancel(null); }
  };

  const filtered = useMemo(() => filter === "all" ? invoices : invoices.filter(i => i.status === filter), [invoices, filter]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <div className="flex gap-2 items-center">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-44 rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="A_RECEBER">A receber</SelectItem>
              <SelectItem value="RECEBIDO">Recebido</SelectItem>
              <SelectItem value="ATRASADO">Atrasado</SelectItem>
              <SelectItem value="CANCELADO">Cancelado</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={sync} disabled={syncing}>
            {syncing ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-1" />}
            Sincronizar
          </Button>
        </div>
        <Button onClick={() => setShowNew(true)}><Plus className="w-4 h-4 mr-1" /> Nova cobrança</Button>
      </div>

      {loading ? <div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div> : filtered.length === 0 ? (
        <Card className="rounded-2xl"><CardContent className="py-10 text-center text-muted-foreground">
          <Receipt className="w-10 h-10 mx-auto mb-2 opacity-40" />
          Nenhuma cobrança Inter ainda.
        </CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 gap-2">
          {filtered.map(inv => {
            const aluno = criancas.find(c => c.id === inv.crianca_id);
            return (
              <Card key={inv.id} className="rounded-2xl">
                <CardContent className="p-3 flex items-center justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <div className="font-medium">{aluno?.nome || inv.description || "Cobrança"}</div>
                    <div className="text-xs text-muted-foreground">
                      Venc {format(new Date(inv.due_date + "T00:00:00"), "dd/MM/yyyy", { locale: ptBR })} · {inv.nosso_numero || inv.external_id?.slice(0, 12)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={STATUS_COLOR[inv.status] || "bg-muted"}>{inv.status}</Badge>
                    <span className="font-semibold">{fmtBRL(inv.amount)}</span>
                    {inv.pix_copy_paste && (
                      <Button size="sm" variant="outline" onClick={() => setPixModal(inv)}>
                        <QrCode className="w-4 h-4 mr-1" /> PIX
                      </Button>
                    )}
                    {inv.boleto_linha_digitavel && (
                      <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(inv.boleto_linha_digitavel); toast({ title: "Linha digitável copiada" }); }}>
                        <Copy className="w-4 h-4 mr-1" /> Boleto
                      </Button>
                    )}
                    {!["RECEBIDO", "MARCADO_RECEBIDO", "CANCELADO"].includes(inv.status) && (
                      <Button size="sm" variant="ghost" onClick={() => setConfirmCancel(inv.id)}>
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <NovaCobrancaInterModal
        open={showNew} onClose={() => setShowNew(false)}
        crecheId={crecheId} criancas={criancas} onCreated={load}
      />

      <Dialog open={!!pixModal} onOpenChange={() => setPixModal(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>PIX Copia e Cola</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">Compartilhe este código com o responsável.</p>
            <Input readOnly value={pixModal?.pix_copy_paste || ""} className="font-mono text-xs" />
            <Button onClick={() => { navigator.clipboard.writeText(pixModal?.pix_copy_paste); toast({ title: "Copiado" }); }}>
              <Copy className="w-4 h-4 mr-1" /> Copiar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirmCancel} onOpenChange={() => setConfirmCancel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar cobrança?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction onClick={() => confirmCancel && cancel(confirmCancel)} className="bg-destructive text-destructive-foreground">Cancelar cobrança</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function NovaCobrancaInterModal({ open, onClose, crecheId, criancas, onCreated }: any) {
  const [criancaId, setCriancaId] = useState("");
  const [value, setValue] = useState("");
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 7); return d.toISOString().slice(0, 10);
  });
  const [description, setDescription] = useState("");
  const [payerNome, setPayerNome] = useState("");
  const [payerCpf, setPayerCpf] = useState("");
  const [payerEmail, setPayerEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!criancaId) { setPayerNome(""); setPayerCpf(""); setPayerEmail(""); return; }
    (async () => {
      const { data } = await supabase.from("crianca_responsaveis")
        .select("responsavel_user_id, profiles:responsavel_user_id(nome, email, cpf)")
        .eq("crianca_id", criancaId).limit(1).maybeSingle();
      const p: any = (data as any)?.profiles;
      if (p) { setPayerNome(p.nome || ""); setPayerEmail(p.email || ""); setPayerCpf(p.cpf || ""); }
    })();
  }, [criancaId]);

  const submit = async () => {
    if (!crecheId) return;
    if (!value || !dueDate || !payerNome || !payerCpf) {
      toast({ title: "Preencha valor, vencimento, nome e CPF/CNPJ do pagador", variant: "destructive" }); return;
    }
    if (Number(value) < 2.5) { toast({ title: "Valor mínimo R$ 2,50", variant: "destructive" }); return; }
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("inter-create-invoice", {
        body: {
          creche_id: crecheId, crianca_id: criancaId || null,
          value: Number(value), due_date: dueDate, description,
          payer: { nome: payerNome, cpf_cnpj: payerCpf, email: payerEmail },
          payment_type: "BOLPIX",
        },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      toast({ title: "Cobrança criada com sucesso" });
      onCreated(); onClose();
      setValue(""); setDescription(""); setCriancaId("");
    } catch (e: any) {
      toast({ title: "Falha ao criar cobrança", description: e.message, variant: "destructive" });
    } finally { setSubmitting(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Nova cobrança Banco Inter</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Aluno (opcional)</Label>
            <Select value={criancaId} onValueChange={setCriancaId}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {criancas.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label>Valor *</Label><Input type="number" step="0.01" min="2.5" value={value} onChange={e => setValue(e.target.value)} /></div>
            <div><Label>Vencimento *</Label><Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} /></div>
          </div>
          <div><Label>Descrição</Label><Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Mensalidade Maio/2026" maxLength={78} /></div>
          <div className="border-t pt-2">
            <p className="text-xs font-medium mb-2">Dados do pagador</p>
            <div className="space-y-2">
              <div><Label>Nome *</Label><Input value={payerNome} onChange={e => setPayerNome(e.target.value)} /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><Label>CPF/CNPJ *</Label><Input value={payerCpf} onChange={e => setPayerCpf(e.target.value)} placeholder="Apenas números" /></div>
                <div><Label>Email</Label><Input type="email" value={payerEmail} onChange={e => setPayerEmail(e.target.value)} /></div>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={submit} disabled={submitting}>
            {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Criar cobrança
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
