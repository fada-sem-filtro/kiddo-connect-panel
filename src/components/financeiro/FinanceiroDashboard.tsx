import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Receipt, TrendingUp, TrendingDown, DollarSign, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts';

interface BoletoRow {
  valor: number;
  status: string;
  vencimento: string;
  data_pagamento: string | null;
  turma_id: string;
  crianca_id: string;
  created_at: string;
}

interface Props {
  crecheId: string;
  turmas: { id: string; nome: string }[];
  prefix?: string;
}

const STATUS_COLORS: Record<string, string> = {
  pago: 'hsl(var(--success))',
  pendente: 'hsl(var(--warning, 45 93% 47%))',
  vencido: 'hsl(var(--destructive))',
  cancelado: 'hsl(var(--muted-foreground))',
};

export default function FinanceiroDashboard({ crecheId, turmas, prefix = '/diretor' }: Props) {
  const navigate = useNavigate();
  const [boletos, setBoletos] = useState<BoletoRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!crecheId) return;
    const fetchBoletos = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('boletos')
        .select('valor, status, vencimento, data_pagamento, turma_id, crianca_id, created_at')
        .eq('creche_id', crecheId);
      setBoletos((data as BoletoRow[]) || []);
      setLoading(false);
    };
    fetchBoletos();
  }, [crecheId]);

  const todayStr = new Date().toISOString().split('T')[0];

  // Adjust status for overdue
  const adjustedBoletos = boletos.map(b => ({
    ...b,
    effectiveStatus: b.status === 'pendente' && b.vencimento < todayStr ? 'vencido' : b.status,
  }));

  // Summary stats
  const totalBoletos = adjustedBoletos.length;
  const pagos = adjustedBoletos.filter(b => b.effectiveStatus === 'pago');
  const pendentes = adjustedBoletos.filter(b => b.effectiveStatus === 'pendente');
  const vencidos = adjustedBoletos.filter(b => b.effectiveStatus === 'vencido');
  const cancelados = adjustedBoletos.filter(b => b.effectiveStatus === 'cancelado');

  const receitaRecebida = pagos.reduce((s, b) => s + Number(b.valor), 0);
  const receitaPendente = pendentes.reduce((s, b) => s + Number(b.valor), 0);
  const inadimplencia = vencidos.reduce((s, b) => s + Number(b.valor), 0);
  const taxaInadimplencia = totalBoletos > 0 ? ((vencidos.length / (totalBoletos - cancelados.length || 1)) * 100) : 0;

  // Pie chart data
  const pieData = [
    { name: 'Pagos', value: pagos.length, color: STATUS_COLORS.pago },
    { name: 'Pendentes', value: pendentes.length, color: STATUS_COLORS.pendente },
    { name: 'Vencidos', value: vencidos.length, color: STATUS_COLORS.vencido },
    { name: 'Cancelados', value: cancelados.length, color: STATUS_COLORS.cancelado },
  ].filter(d => d.value > 0);

  // Bar chart: receita por mês (últimos 6 meses)
  const monthlyData = [];
  for (let i = 5; i >= 0; i--) {
    const month = subMonths(new Date(), i);
    const start = startOfMonth(month);
    const end = endOfMonth(month);
    const startStr = format(start, 'yyyy-MM-dd');
    const endStr = format(end, 'yyyy-MM-dd');

    const monthPagos = adjustedBoletos.filter(b =>
      b.effectiveStatus === 'pago' && b.data_pagamento && b.data_pagamento >= startStr && b.data_pagamento <= endStr
    );
    const monthVencidos = adjustedBoletos.filter(b =>
      b.effectiveStatus === 'vencido' && b.vencimento >= startStr && b.vencimento <= endStr
    );

    monthlyData.push({
      mes: format(month, 'MMM', { locale: ptBR }),
      recebido: monthPagos.reduce((s, b) => s + Number(b.valor), 0),
      inadimplente: monthVencidos.reduce((s, b) => s + Number(b.valor), 0),
    });
  }

  // Inadimplência por turma
  const turmaInadimplencia = turmas.map(t => {
    const turmaVencidos = vencidos.filter(b => b.turma_id === t.id);
    const turmaTotal = adjustedBoletos.filter(b => b.turma_id === t.id && b.effectiveStatus !== 'cancelado');
    return {
      nome: t.nome,
      vencidos: turmaVencidos.length,
      total: turmaTotal.length,
      valor: turmaVencidos.reduce((s, b) => s + Number(b.valor), 0),
      taxa: turmaTotal.length > 0 ? (turmaVencidos.length / turmaTotal.length) * 100 : 0,
    };
  }).filter(t => t.total > 0).sort((a, b) => b.taxa - a.taxa);

  if (loading) {
    return (
      <Card className="rounded-2xl border-2 border-border">
        <CardContent className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (totalBoletos === 0) {
    return (
      <Card className="rounded-2xl border-2 border-dashed border-muted-foreground/30">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Receipt className="w-12 h-12 text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground">Nenhum boleto registrado</p>
          <Button size="sm" variant="outline" className="mt-3 rounded-xl" onClick={() => navigate(`${prefix}/boletos`)}>
            Criar boletos
          </Button>
        </CardContent>
      </Card>
    );
  }

  const formatCurrency = (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <Receipt className="w-5 h-5 text-primary" />
          Dashboard Financeiro
        </h2>
        <Button size="sm" variant="outline" className="rounded-xl" onClick={() => navigate(`${prefix}/boletos`)}>
          Gerenciar boletos
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="rounded-2xl border-2 border-[hsl(var(--success))]/30 bg-gradient-to-br from-[hsl(var(--success))]/5 to-[hsl(var(--success))]/10">
          <CardContent className="p-4 text-center">
            <DollarSign className="w-6 h-6 mx-auto text-[hsl(var(--success))] mb-1" />
            <p className="text-lg font-bold text-foreground">{formatCurrency(receitaRecebida)}</p>
            <p className="text-xs text-muted-foreground">Recebido</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardContent className="p-4 text-center">
            <TrendingUp className="w-6 h-6 mx-auto text-primary mb-1" />
            <p className="text-lg font-bold text-foreground">{formatCurrency(receitaPendente)}</p>
            <p className="text-xs text-muted-foreground">Pendente</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-2 border-destructive/30 bg-gradient-to-br from-destructive/5 to-destructive/10">
          <CardContent className="p-4 text-center">
            <TrendingDown className="w-6 h-6 mx-auto text-destructive mb-1" />
            <p className="text-lg font-bold text-foreground">{formatCurrency(inadimplencia)}</p>
            <p className="text-xs text-muted-foreground">Inadimplente</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-2 border-border">
          <CardContent className="p-4 text-center">
            <AlertCircle className="w-6 h-6 mx-auto text-muted-foreground mb-1" />
            <p className="text-lg font-bold text-foreground">{taxaInadimplencia.toFixed(1)}%</p>
            <p className="text-xs text-muted-foreground">Taxa inadimplência</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Pie Chart - Status */}
        <Card className="rounded-2xl border-2 border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Distribuição por Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [value, 'Boletos']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap justify-center gap-3 mt-2">
              {pieData.map(d => (
                <div key={d.name} className="flex items-center gap-1.5 text-xs">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                  <span className="text-muted-foreground">{d.name} ({d.value})</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Bar Chart - Receita mensal */}
        <Card className="rounded-2xl border-2 border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Receita vs Inadimplência (6 meses)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} barGap={2}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="mes" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="recebido" name="Recebido" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="inadimplente" name="Inadimplente" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Inadimplência por turma */}
      {turmaInadimplencia.length > 0 && (
        <Card className="rounded-2xl border-2 border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Inadimplência por Turma</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {turmaInadimplencia.map(t => (
              <div key={t.nome} className="flex items-center justify-between p-3 bg-muted/50 rounded-xl">
                <div>
                  <p className="font-medium text-sm text-foreground">{t.nome}</p>
                  <p className="text-xs text-muted-foreground">{t.vencidos} vencido(s) de {t.total}</p>
                </div>
                <div className="text-right">
                  <Badge variant={t.taxa > 30 ? 'destructive' : t.taxa > 10 ? 'outline' : 'secondary'} className="rounded-lg">
                    {t.taxa.toFixed(0)}%
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-0.5">{formatCurrency(t.valor)}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
