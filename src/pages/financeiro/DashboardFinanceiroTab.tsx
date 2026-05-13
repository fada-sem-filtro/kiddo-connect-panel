import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Wallet, TrendingUp, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { PremiumKpiCard } from "@/components/financeiro/PremiumKpiCard";
import { StatusDonut } from "@/components/financeiro/StatusDonut";
import { PrevisaoCard } from "@/components/financeiro/PrevisaoCard";

interface Props { crecheId: string }
const fmtBRL = (v: number) => `R$ ${Number(v || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

const PAID_STATUSES = ["RECEBIDO", "RECEIVED", "CONFIRMED", "MARCADO_RECEBIDO"];
const PENDING_STATUSES = ["PENDING", "EM_PROCESSAMENTO", "A_RECEBER"];
const OVERDUE_STATUSES = ["ATRASADO", "OVERDUE"];

export function DashboardFinanceiroTab({ crecheId }: Props) {
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<any[]>([]);

  useEffect(() => {
    if (!crecheId) return;
    setLoading(true);
    (async () => {
      const { data } = await supabase
        .from("financial_invoices")
        .select("amount, status, paid_at, due_date, created_at")
        .eq("creche_id", crecheId)
        .gte("due_date", format(subMonths(new Date(), 6), "yyyy-MM-dd"))
        .limit(2000);
      setInvoices(data || []);
      setLoading(false);
    })();

    // Realtime
    const ch = supabase
      .channel(`financial-${crecheId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "financial_invoices", filter: `creche_id=eq.${crecheId}` }, async () => {
        const { data } = await supabase
          .from("financial_invoices")
          .select("amount, status, paid_at, due_date, created_at")
          .eq("creche_id", crecheId)
          .gte("due_date", format(subMonths(new Date(), 6), "yyyy-MM-dd"))
          .limit(2000);
        setInvoices(data || []);
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [crecheId]);

  const { kpi, chart, donut } = useMemo(() => {
    const today = format(new Date(), "yyyy-MM-dd");
    const start = format(startOfMonth(new Date()), "yyyy-MM-dd");
    const end = format(endOfMonth(new Date()), "yyyy-MM-dd");

    let recebidoMes = 0, recebidoHoje = 0, pendente = 0, vencido = 0;
    let totalEmitidoMes = 0, totalPago = 0, qtdMes = 0;

    invoices.forEach((i: any) => {
      const isPaid = PAID_STATUSES.includes(i.status) || !!i.paid_at;
      const inMes = i.due_date >= start && i.due_date <= end;
      if (inMes) { totalEmitidoMes += Number(i.amount || 0); qtdMes += 1; }

      if (i.paid_at) {
        const paidDay = i.paid_at.slice(0, 10);
        if (paidDay >= start && paidDay <= end) recebidoMes += Number(i.amount || 0);
        if (paidDay === today) recebidoHoje += Number(i.amount || 0);
        totalPago += Number(i.amount || 0);
      }
      if (!isPaid) {
        if (PENDING_STATUSES.includes(i.status) && i.due_date >= today) pendente += Number(i.amount || 0);
        else if (OVERDUE_STATUSES.includes(i.status) || (i.due_date < today && !["CANCELADO", "EXPIRADO"].includes(i.status))) {
          vencido += Number(i.amount || 0);
        }
      }
    });

    const taxa = totalEmitidoMes > 0 ? (recebidoMes / totalEmitidoMes) * 100 : 0;
    const ticket = qtdMes > 0 ? totalEmitidoMes / qtdMes : 0;

    // Chart 6M
    const months: Record<string, number> = {};
    for (let i = 5; i >= 0; i--) months[format(subMonths(new Date(), i), "yyyy-MM")] = 0;
    invoices.forEach((i: any) => {
      if (!i.paid_at) return;
      const k = i.paid_at.slice(0, 7);
      if (k in months) months[k] += Number(i.amount || 0);
    });
    const chart = Object.entries(months).map(([k, v]) => ({
      mes: format(new Date(k + "-01"), "MMM/yy", { locale: ptBR }),
      valor: v,
    }));

    const donut = [
      { name: "Recebido", value: recebidoMes, color: "#10b981" },
      { name: "A vencer", value: pendente, color: "#3b82f6" },
      { name: "Vencido", value: vencido, color: "#f43f5e" },
    ];

    return {
      kpi: { recebidoMes, recebidoHoje, pendente, vencido, taxa, ticket },
      chart, donut,
    };
  }, [invoices]);

  if (loading) return <Skeleton className="h-72 w-full rounded-2xl" />;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <PremiumKpiCard tone="success" title="Recebido (mês)" value={fmtBRL(kpi.recebidoMes)} icon={<CheckCircle2 className="w-5 h-5" />} hint={`${kpi.taxa.toFixed(1)}% do emitido`} />
        <PremiumKpiCard tone="primary" title="Recebido hoje" value={fmtBRL(kpi.recebidoHoje)} icon={<TrendingUp className="w-5 h-5" />} />
        <PremiumKpiCard tone="warning" title="A vencer" value={fmtBRL(kpi.pendente)} icon={<Clock className="w-5 h-5" />} />
        <PremiumKpiCard tone="danger" title="Vencido" value={fmtBRL(kpi.vencido)} icon={<AlertTriangle className="w-5 h-5" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <Card className="rounded-2xl border lg:col-span-2">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Wallet className="w-4 h-4 text-primary" /> Recebimentos — últimos 6 meses</CardTitle></CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chart}>
                  <defs>
                    <linearGradient id="gBar" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.95} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.55} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis />
                  <Tooltip formatter={(v: any) => fmtBRL(Number(v))} />
                  <Bar dataKey="valor" fill="url(#gBar)" radius={[10, 10, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">Ticket médio do mês: <b className="text-foreground">{fmtBRL(kpi.ticket)}</b></p>
          </CardContent>
        </Card>
        <StatusDonut data={donut} title="Status do mês" />
      </div>

      <PrevisaoCard crecheId={crecheId} />
    </div>
  );
}
