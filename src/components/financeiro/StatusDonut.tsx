import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";

interface Slice { name: string; value: number; color: string }
const fmtBRL = (v: number) => `R$ ${Number(v || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

export function StatusDonut({ data, title = "Distribuição por status" }: { data: Slice[]; title?: string }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <Card className="rounded-2xl border">
      <CardHeader><CardTitle className="text-base">{title}</CardTitle></CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90} paddingAngle={2}>
                {data.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Pie>
              <Tooltip formatter={(v: any) => fmtBRL(Number(v))} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <p className="text-center text-xs text-muted-foreground -mt-2">Total: <b className="text-foreground">{fmtBRL(total)}</b></p>
      </CardContent>
    </Card>
  );
}
