import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Wallet, TrendingUp, AlertTriangle, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Props { crecheId: string }
const fmtBRL = (v: number) => `R$ ${Number(v || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

export function DashboardFinanceiroTab({ crecheId }: Props) {
  const [loading, setLoading] = useState(true);
  const [kpi, setKpi] = useState({ recebidoMes: 0, pendente: 0, vencido: 0, recebidoHoje: 0 });
  const [chart, setChart] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const today = format(new Date(), "yyyy-MM-dd");
      const start = format(startOfMonth(new Date()), "yyyy-MM-dd");
      const end = format(endOfMonth(new Date()), "yyyy-MM-dd");

      const { data: invoices } = await supabase
        .from("financial_invoices")
        .select("amount, status, paid_at, due_date, created_at")
        .eq("creche_id", crecheId)
        .gte("created_at", format(subMonths(new Date(), 6), "yyyy-MM-dd"));

      const list = invoices || [];
      const recebidoMes = list
        .filter((i: any) => i.paid_at && i.paid_at >= start && i.paid_at <= end + "T23:59:59")
        .reduce((s, i: any) => s + Number(i.amount || 0), 0);
      const recebidoHoje = list
        .filter((i: any) => i.paid_at && i.paid_at.startsWith(today))
        .reduce((s, i: any) => s + Number(i.amount || 0), 0);
      const pendente = list
        .filter((i: any) => ["PENDING", "EM_PROCESSAMENTO", "A_RECEBER"].includes(i.status))
        .reduce((s, i: any) => s + Number(i.amount || 0), 0);
      const vencido = list
        .filter((i: any) => ["ATRASADO", "OVERDUE"].includes(i.status) || (!i.paid_at && i.due_date < today && i.status !== "CANCELADO"))
        .reduce((s, i: any) => s + Number(i.amount || 0), 0);

      const months: Record<string, number> = {};
      for (let i = 5; i >= 0; i--) {
        const d = subMonths(new Date(), i);
        months[format(d, "yyyy-MM")] = 0;
      }
      list.forEach((i: any) => {
        if (!i.paid_at) return;
        const k = i.paid_at.slice(0, 7);
        if (k in months) months[k] += Number(i.amount || 0);
      });
      const chartData = Object.entries(months).map(([k, v]) => ({
        mes: format(new Date(k + "-01"), "MMM/yy", { locale: ptBR }),
        valor: v,
      }));

      setKpi({ recebidoMes, pendente, vencido, recebidoHoje });
      setChart(chartData);
      setLoading(false);
    })();
  }, [crecheId]);

  if (loading) return <Skeleton className="h-64 w-full rounded-2xl" />;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard icon={<CheckCircle2 className="w-4 h-4 text-green-600" />} title="Recebido (mês)" value={fmtBRL(kpi.recebidoMes)} />
        <KpiCard icon={<TrendingUp className="w-4 h-4 text-blue-600" />} title="Recebido hoje" value={fmtBRL(kpi.recebidoHoje)} />
        <KpiCard icon={<Wallet className="w-4 h-4 text-yellow-600" />} title="Pendente" value={fmtBRL(kpi.pendente)} />
        <KpiCard icon={<AlertTriangle className="w-4 h-4 text-red-600" />} title="Vencido" value={fmtBRL(kpi.vencido)} />
      </div>

      <Card className="rounded-2xl border">
        <CardHeader><CardTitle className="text-base">Recebimentos — últimos 6 meses</CardTitle></CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chart}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip formatter={(v: any) => fmtBRL(Number(v))} />
                <Bar dataKey="valor" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function KpiCard({ icon, title, value }: { icon: React.ReactNode; title: string; value: string }) {
  return (
    <Card className="rounded-2xl border">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">{icon}{title}</div>
        <div className="text-lg font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}
