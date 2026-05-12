import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wallet, Copy, Download, Receipt, AlertCircle, CheckCircle2, Clock, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { downloadReceiptPdf } from "@/lib/financial-receipt-pdf";

const fmtBRL = (v: number) => `R$ ${Number(v || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

const STATUS_META: Record<string, { label: string; icon: any; classes: string }> = {
  RECEBIDO:        { label: "Pago",      icon: CheckCircle2, classes: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30" },
  MARCADO_RECEBIDO:{ label: "Pago",      icon: CheckCircle2, classes: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30" },
  RECEIVED:        { label: "Pago",      icon: CheckCircle2, classes: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30" },
  CONFIRMED:       { label: "Confirmado",icon: CheckCircle2, classes: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30" },
  A_RECEBER:       { label: "A vencer",  icon: Clock,        classes: "bg-blue-500/10 text-blue-700 border-blue-500/30" },
  PENDING:         { label: "A vencer",  icon: Clock,        classes: "bg-blue-500/10 text-blue-700 border-blue-500/30" },
  EM_PROCESSAMENTO:{ label: "Processando", icon: Clock,      classes: "bg-amber-500/10 text-amber-700 border-amber-500/30" },
  ATRASADO:        { label: "Vencido",   icon: AlertCircle,  classes: "bg-rose-500/10 text-rose-700 border-rose-500/30" },
  OVERDUE:         { label: "Vencido",   icon: AlertCircle,  classes: "bg-rose-500/10 text-rose-700 border-rose-500/30" },
  CANCELADO:       { label: "Cancelado", icon: AlertCircle,  classes: "bg-muted text-muted-foreground border-border" },
};

const isPaid = (s: string) => ["RECEBIDO", "MARCADO_RECEBIDO", "RECEIVED", "CONFIRMED"].includes(s);
const isOpen = (s: string) => ["A_RECEBER", "PENDING", "EM_PROCESSAMENTO", "ATRASADO", "OVERDUE"].includes(s);

export default function ResponsavelFinanceiroPage() {
  const { profile, userCreche } = useAuth();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<any[]>([]);
  const [criancas, setCriancas] = useState<Record<string, string>>({});

  useEffect(() => {
    (async () => {
      if (!profile?.user_id) return;
      setLoading(true);
      // Crianças vinculadas
      const { data: vinc } = await supabase
        .from("crianca_responsaveis")
        .select("crianca_id, criancas(id, nome)")
        .eq("responsavel_user_id", profile.user_id);
      const ids = (vinc || []).map((v: any) => v.crianca_id);
      const nomeMap: Record<string, string> = {};
      (vinc || []).forEach((v: any) => { if (v.criancas) nomeMap[v.crianca_id] = v.criancas.nome; });
      setCriancas(nomeMap);

      if (ids.length === 0) { setItems([]); setLoading(false); return; }

      // Cobranças (financial_invoices = Inter; invoices = Asaas)
      const [fi, inv] = await Promise.all([
        supabase.from("financial_invoices").select("*").in("crianca_id", ids).order("due_date", { ascending: false }),
        supabase.from("invoices").select("*").in("crianca_id", ids).order("due_date", { ascending: false }),
      ]);
      const today = new Date().toISOString().slice(0, 10);
      const fiList = (fi.data || []).map((i: any) => ({
        ...i, source: "inter",
        eff: isPaid(i.status) ? i.status : (i.status === "A_RECEBER" && i.due_date < today ? "ATRASADO" : i.status),
        valor: Number(i.amount || 0),
        boleto: i.boleto_pdf_url || null,
        pix: i.pix_copy_paste || null,
        linha: i.boleto_linha_digitavel || null,
      }));
      const asList = (inv.data || []).map((i: any) => ({
        ...i, source: "asaas",
        eff: isPaid(i.status) ? i.status : (i.status === "PENDING" && i.due_date < today ? "OVERDUE" : i.status),
        valor: Number(i.value || 0),
        boleto: i.bank_slip_url || null,
        pix: i.pix_copy_paste || null,
        linha: null,
        paid_at: null,
      }));
      const merged = [...fiList, ...asList].sort((a, b) => (b.due_date > a.due_date ? 1 : -1));
      setItems(merged);
      setLoading(false);
    })();
  }, [profile?.user_id]);

  const abertas = items.filter(i => isOpen(i.eff));
  const pagas = items.filter(i => isPaid(i.eff));
  const totalAberto = abertas.reduce((s, i) => s + i.valor, 0);

  const copyPix = async (txt: string) => {
    await navigator.clipboard.writeText(txt);
    toast({ title: "PIX copiado!", description: "Cole no app do banco para pagar." });
  };
  const copyLinha = async (txt: string) => {
    await navigator.clipboard.writeText(txt);
    toast({ title: "Linha digitável copiada!" });
  };

  const baixarRecibo = async (i: any) => {
    try {
      await downloadReceiptPdf({
        numero: (i.external_id || i.id).toString().slice(0, 12).toUpperCase(),
        pagador: { nome: profile?.nome || "Responsável" },
        beneficiario: { nome: userCreche?.nome || "Escola", logoUrl: userCreche?.logo_url || null },
        descricao: i.description || "Mensalidade",
        valor: i.valor,
        pagoEm: i.paid_at || i.updated_at || new Date(),
        metodo: i.payment_method || (i.source === "inter" ? "PIX/Boleto" : "Asaas"),
        referencia: criancas[i.crianca_id] ? `Aluno: ${criancas[i.crianca_id]}` : undefined,
      });
    } catch (e: any) {
      toast({ title: "Erro ao gerar recibo", description: e.message, variant: "destructive" });
    }
  };

  return (
    <MainLayout>
      <div className="space-y-4 p-4 md:p-6 max-w-5xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-primary/10 p-2.5"><Wallet className="w-6 h-6 text-primary" /></div>
          <div>
            <h1 className="text-2xl font-bold">Financeiro</h1>
            <p className="text-sm text-muted-foreground">Mensalidades, PIX, boletos e recibos</p>
          </div>
        </div>

        {/* Resumo destaque */}
        <Card className="rounded-2xl border bg-gradient-to-br from-primary/15 to-primary/5">
          <CardContent className="p-5 flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide font-semibold text-primary/80">Em aberto</p>
              <p className="text-3xl font-bold text-foreground tabular-nums mt-1">{fmtBRL(totalAberto)}</p>
              <p className="text-xs text-muted-foreground mt-1">{abertas.length} cobrança(s) pendente(s)</p>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-wide font-semibold text-muted-foreground">Já pagas</p>
              <p className="text-lg font-semibold tabular-nums">{pagas.length}</p>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="abertas">
          <TabsList className="rounded-xl">
            <TabsTrigger value="abertas" className="rounded-lg">Em aberto ({abertas.length})</TabsTrigger>
            <TabsTrigger value="pagas" className="rounded-lg">Pagas ({pagas.length})</TabsTrigger>
            <TabsTrigger value="todas" className="rounded-lg">Todas</TabsTrigger>
          </TabsList>

          {(["abertas", "pagas", "todas"] as const).map(tab => (
            <TabsContent key={tab} value={tab} className="space-y-2 mt-3">
              {loading ? (
                <>
                  <Skeleton className="h-24 rounded-2xl" />
                  <Skeleton className="h-24 rounded-2xl" />
                </>
              ) : (
                <>
                  {(tab === "abertas" ? abertas : tab === "pagas" ? pagas : items).length === 0 ? (
                    <Card className="rounded-2xl border-dashed">
                      <CardContent className="py-10 text-center text-muted-foreground">
                        <Receipt className="w-10 h-10 mx-auto mb-2 opacity-40" />
                        Nenhuma cobrança {tab === "abertas" ? "em aberto" : tab === "pagas" ? "paga ainda" : "registrada"}.
                      </CardContent>
                    </Card>
                  ) : (
                    (tab === "abertas" ? abertas : tab === "pagas" ? pagas : items).map(i => {
                      const meta = STATUS_META[i.eff] || STATUS_META.PENDING;
                      const Icon = meta.icon;
                      const paid = isPaid(i.eff);
                      return (
                        <Card key={`${i.source}-${i.id}`} className="rounded-2xl border hover:shadow-md transition-shadow">
                          <CardContent className="p-4 space-y-3">
                            <div className="flex items-start justify-between gap-3 flex-wrap">
                              <div className="min-w-0">
                                <p className="font-semibold truncate">{i.description || "Mensalidade"}</p>
                                <p className="text-xs text-muted-foreground">
                                  {criancas[i.crianca_id] || "—"} • Vence {format(new Date(i.due_date + "T00:00:00"), "dd/MM/yyyy", { locale: ptBR })}
                                </p>
                              </div>
                              <div className="text-right shrink-0">
                                <p className="text-xl font-bold tabular-nums">{fmtBRL(i.valor)}</p>
                                <Badge className={`mt-1 rounded-lg border ${meta.classes}`}>
                                  <Icon className="w-3 h-3 mr-1" />{meta.label}
                                </Badge>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {!paid && i.pix && (
                                <Button size="sm" onClick={() => copyPix(i.pix)} className="rounded-lg gap-1.5">
                                  <Copy className="w-4 h-4" /> Copiar PIX
                                </Button>
                              )}
                              {!paid && i.linha && (
                                <Button size="sm" variant="outline" onClick={() => copyLinha(i.linha)} className="rounded-lg gap-1.5">
                                  <Copy className="w-4 h-4" /> Linha digitável
                                </Button>
                              )}
                              {!paid && i.boleto && (
                                <Button size="sm" variant="outline" asChild className="rounded-lg gap-1.5">
                                  <a href={i.boleto} target="_blank" rel="noreferrer"><Download className="w-4 h-4" /> Boleto</a>
                                </Button>
                              )}
                              {paid && (
                                <Button size="sm" variant="outline" onClick={() => baixarRecibo(i)} className="rounded-lg gap-1.5">
                                  <FileText className="w-4 h-4" /> Recibo
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })
                  )}
                </>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </MainLayout>
  );
}
