import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format, subMonths, addMonths, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

interface Props { crecheId: string }
const fmtBRL = (v: number) => `R$ ${Number(v || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

export function PrevisaoCard({ crecheId }: Props) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{ mes: string; real: number | null; previsto: number | null }[]>([]);
  const [media3m, setMedia3m] = useState(0);
  const [futuroPrevisto, setFuturoPrevisto] = useState(0);

  useEffect(() => {
    (async () => {
      if (!crecheId) return;
      setLoading(true);
      const start = subMonths(new Date(), 5);
      const futureEnd = addMonths(new Date(), 3);

      const { data: invs } = await supabase
        .from("financial_invoices")
        .select("amount, status, paid_at, due_date")
        .eq("creche_id", crecheId)
        .gte("due_date", format(startOfMonth(start), "yyyy-MM-dd"))
        .lte("due_date", format(endOfMonth(futureEnd), "yyyy-MM-dd"));

      const list = invs || [];
      const months: { key: string; label: string; real: number | null; previsto: number | null }[] = [];
      for (let i = -5; i <= 3; i++) {
        const d = addMonths(new Date(), i);
        months.push({
          key: format(d, "yyyy-MM"),
          label: format(d, "MMM/yy", { locale: ptBR }),
          real: i <= 0 ? 0 : null,
          previsto: i > 0 ? 0 : null,
        });
      }

      list.forEach((inv: any) => {
        const realKey = inv.paid_at ? inv.paid_at.slice(0, 7) : null;
        const dueKey = inv.due_date?.slice(0, 7);
        const isReceived = ["RECEBIDO", "RECEIVED", "CONFIRMED", "MARCADO_RECEBIDO"].includes(inv.status);

        if (isReceived && realKey) {
          const m = months.find(x => x.key === realKey);
          if (m && m.real !== null) m.real += Number(inv.amount || 0);
        } else if (dueKey) {
          const m = months.find(x => x.key === dueKey);
          if (m && m.previsto !== null) m.previsto += Number(inv.amount || 0);
        }
      });

      // Média móvel 3M sobre realizados
      const realPast = months.filter(m => m.real !== null && m.real! > 0).slice(-3);
      const media = realPast.length ? realPast.reduce((s, m) => s + (m.real || 0), 0) / realPast.length : 0;
      setMedia3m(media);

      // Onde não há cobrança futura, projeta com a média
      months.forEach(m => {
        if (m.previsto !== null && m.previsto === 0) m.previsto = media;
      });

      const futuroSoma = months.filter(m => m.previsto !== null && m.real === null).reduce((s, m) => s + (m.previsto || 0), 0);
      setFuturoPrevisto(futuroSoma);
      setData(months.map(m => ({ mes: m.label, real: m.real, previsto: m.previsto })));
      setLoading(false);
    })();
  }, [crecheId]);

  if (loading) return <Skeleton className="h-72 w-full rounded-2xl" />;

  return (
    <Card className="rounded-2xl border">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" /> Previsão financeira
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Média 3M: <b className="text-foreground">{fmtBRL(media3m)}</b> • Próximos 3 meses: <b className="text-emerald-700">{fmtBRL(futuroPrevisto)}</b>
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="gReal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.45} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="gPrev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis />
              <Tooltip formatter={(v: any) => fmtBRL(Number(v))} />
              <Area type="monotone" dataKey="real" name="Realizado" stroke="hsl(var(--primary))" fill="url(#gReal)" strokeWidth={2} />
              <Area type="monotone" dataKey="previsto" name="Previsto" stroke="#10b981" fill="url(#gPrev)" strokeWidth={2} strokeDasharray="4 4" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <p className="text-[11px] text-muted-foreground mt-2 flex items-center gap-1">
          <TrendingUp className="w-3 h-3" /> Projeção baseada em cobranças futuras + média móvel dos últimos 3 meses pagos.
        </p>
      </CardContent>
    </Card>
  );
}
