import { useEffect, useMemo, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { FileText, Download, BarChart3, TrendingUp, AlertTriangle, CheckCircle2 } from "lucide-react";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { downloadFinancialPdf, downloadCSV, fmtBRL } from "@/lib/financial-export";
import { PremiumKpiCard } from "@/components/financeiro/PremiumKpiCard";
import { StatusDonut } from "@/components/financeiro/StatusDonut";

const monthOptions = () => {
  const opts: { value: string; label: string }[] = [];
  for (let i = 0; i < 12; i++) {
    const d = subMonths(new Date(), i);
    opts.push({ value: format(d, "yyyy-MM"), label: format(d, "MMMM 'de' yyyy", { locale: ptBR }) });
  }
  return opts;
};

export default function RelatoriosFinanceirosPage() {
  const { profile } = useAuth();
  const [crecheId, setCrecheId] = useState<string | null>(null);
  const [escolaNome, setEscolaNome] = useState("");
  const [mes, setMes] = useState(format(new Date(), "yyyy-MM"));
  const [invoices, setInvoices] = useState<any[]>([]);
  const [criancas, setCriancas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!profile?.user_id) return;
      const { data: cm } = await supabase.from("creche_membros").select("creche_id").eq("user_id", profile.user_id).maybeSingle();
      if (cm?.creche_id) {
        setCrecheId(cm.creche_id);
        const { data: cr } = await supabase.from("creches").select("nome").eq("id", cm.creche_id).maybeSingle();
        setEscolaNome(cr?.nome || "");
      }
    })();
  }, [profile?.user_id]);

  useEffect(() => {
    if (!crecheId) return;
    (async () => {
      setLoading(true);
      const inicio = format(startOfMonth(new Date(mes + "-01")), "yyyy-MM-dd");
      const fim = format(endOfMonth(new Date(mes + "-01")), "yyyy-MM-dd");
      const [i, c] = await Promise.all([
        supabase.from("financial_invoices").select("*").eq("creche_id", crecheId)
          .or(`due_date.gte.${inicio},paid_at.gte.${inicio}T00:00:00`)
          .lte("due_date", fim).limit(2000),
        supabase.from("criancas").select("id, nome").order("nome"),
      ]);
      setInvoices(i.data || []);
      setCriancas(c.data || []);
      setLoading(false);
    })();
  }, [crecheId, mes]);

  const stats = useMemo(() => {
    const inicio = format(startOfMonth(new Date(mes + "-01")), "yyyy-MM-dd");
    const fim = format(endOfMonth(new Date(mes + "-01")), "yyyy-MM-dd");
    let recebido = 0, pendente = 0, vencido = 0, totalEmitido = 0;
    const today = format(new Date(), "yyyy-MM-dd");
    invoices.forEach(i => {
      const inMonthDue = i.due_date >= inicio && i.due_date <= fim;
      const paidInMonth = i.paid_at && i.paid_at.slice(0, 10) >= inicio && i.paid_at.slice(0, 10) <= fim;
      if (inMonthDue) totalEmitido += Number(i.amount || 0);
      if (paidInMonth) recebido += Number(i.amount || 0);
      else if (inMonthDue && !i.paid_at) {
        if (i.due_date < today) vencido += Number(i.amount || 0);
        else pendente += Number(i.amount || 0);
      }
    });
    const taxa = totalEmitido > 0 ? (recebido / totalEmitido) * 100 : 0;
    return { recebido, pendente, vencido, totalEmitido, taxa };
  }, [invoices, mes]);

  const donutData = [
    { name: "Recebido", value: stats.recebido, color: "#10b981" },
    { name: "A vencer", value: stats.pendente, color: "#3b82f6" },
    { name: "Vencido", value: stats.vencido, color: "#f43f5e" },
  ];

  const exportPDF = () => {
    const inicio = format(startOfMonth(new Date(mes + "-01")), "yyyy-MM-dd");
    const fim = format(endOfMonth(new Date(mes + "-01")), "yyyy-MM-dd");
    const rows = invoices
      .filter(i => (i.due_date >= inicio && i.due_date <= fim) || (i.paid_at && i.paid_at.slice(0, 10) >= inicio && i.paid_at.slice(0, 10) <= fim))
      .map(i => {
        const c = criancas.find(x => x.id === i.crianca_id);
        return [
          c?.nome || "—",
          i.description || "—",
          format(new Date(i.due_date + "T00:00:00"), "dd/MM/yyyy"),
          i.paid_at ? format(new Date(i.paid_at), "dd/MM/yyyy") : "—",
          (i.provider || "").toUpperCase(),
          i.status,
          fmtBRL(Number(i.amount || 0)),
        ];
      });
    downloadFinancialPdf({
      titulo: "Relatório Financeiro Mensal",
      escola: escolaNome,
      periodo: format(new Date(mes + "-01"), "MMMM 'de' yyyy", { locale: ptBR }),
      resumo: [
        { label: "Total emitido", value: fmtBRL(stats.totalEmitido) },
        { label: "Recebido", value: fmtBRL(stats.recebido) },
        { label: "A vencer", value: fmtBRL(stats.pendente) },
        { label: "Vencido", value: fmtBRL(stats.vencido) },
        { label: "Taxa de recebimento", value: `${stats.taxa.toFixed(1)}%` },
      ],
      columns: ["Aluno", "Descrição", "Vencimento", "Pago em", "Provider", "Status", "Valor"],
      rows,
      filename: `relatorio_${mes}.pdf`,
    });
  };

  const exportCSV = () => {
    const inicio = format(startOfMonth(new Date(mes + "-01")), "yyyy-MM-dd");
    const fim = format(endOfMonth(new Date(mes + "-01")), "yyyy-MM-dd");
    const data = invoices
      .filter(i => (i.due_date >= inicio && i.due_date <= fim) || (i.paid_at && i.paid_at.slice(0, 10) >= inicio && i.paid_at.slice(0, 10) <= fim))
      .map(i => {
        const c = criancas.find(x => x.id === i.crianca_id);
        return {
          aluno: c?.nome || "",
          descricao: i.description || "",
          vencimento: i.due_date,
          pago_em: i.paid_at ? format(new Date(i.paid_at), "dd/MM/yyyy") : "",
          provider: i.provider,
          status: i.status,
          valor: Number(i.amount || 0).toFixed(2).replace(".", ","),
        };
      });
    downloadCSV(data, [
      { key: "aluno", label: "Aluno" },
      { key: "descricao", label: "Descrição" },
      { key: "vencimento", label: "Vencimento" },
      { key: "pago_em", label: "Pago em" },
      { key: "provider", label: "Provider" },
      { key: "status", label: "Status" },
      { key: "valor", label: "Valor (R$)" },
    ], `relatorio_${mes}.csv`);
  };

  return (
    <MainLayout>
      <div className="space-y-4 p-4 md:p-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2"><BarChart3 className="w-7 h-7 text-primary" />Relatórios financeiros</h1>
            <p className="text-sm text-muted-foreground">Snapshot mensal com export em PDF e CSV.</p>
          </div>
          <div className="flex gap-2 items-center">
            <Select value={mes} onValueChange={setMes}>
              <SelectTrigger className="w-56 rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>{monthOptions().map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
            </Select>
            <Button variant="outline" className="rounded-xl" onClick={exportCSV}><Download className="w-4 h-4 mr-1" /> CSV</Button>
            <Button className="rounded-xl" onClick={exportPDF}><FileText className="w-4 h-4 mr-1" /> PDF</Button>
          </div>
        </div>

        {loading ? <Skeleton className="h-72 w-full rounded-2xl" /> : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <PremiumKpiCard tone="success" title="Recebido" value={fmtBRL(stats.recebido)} icon={<CheckCircle2 className="w-5 h-5" />} hint={`${stats.taxa.toFixed(1)}% do emitido`} />
              <PremiumKpiCard tone="primary" title="Total emitido" value={fmtBRL(stats.totalEmitido)} icon={<BarChart3 className="w-5 h-5" />} />
              <PremiumKpiCard tone="warning" title="A vencer" value={fmtBRL(stats.pendente)} icon={<TrendingUp className="w-5 h-5" />} />
              <PremiumKpiCard tone="danger" title="Vencido" value={fmtBRL(stats.vencido)} icon={<AlertTriangle className="w-5 h-5" />} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <StatusDonut data={donutData} title="Distribuição do mês" />
              <Card className="rounded-2xl border">
                <CardHeader><CardTitle className="text-base">Como ler este relatório</CardTitle></CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-2">
                  <p><b className="text-foreground">Recebido:</b> valores efetivamente pagos no mês selecionado.</p>
                  <p><b className="text-foreground">A vencer:</b> cobranças do mês ainda dentro do prazo.</p>
                  <p><b className="text-foreground">Vencido:</b> cobranças do mês em atraso até hoje.</p>
                  <p><b className="text-foreground">Taxa de recebimento:</b> recebido ÷ total emitido no mês.</p>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
}
