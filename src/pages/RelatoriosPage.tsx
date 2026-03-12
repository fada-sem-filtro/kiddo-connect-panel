import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, Filter } from 'lucide-react';
import { format, differenceInMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { exportPresencaPDF, PresencaReportRow } from '@/lib/pdf-export';

interface PresencaReport {
  id: string;
  crianca_id: string;
  crianca_nome: string;
  turma_nome: string;
  data: string;
  status: string;
  hora_chegada: string | null;
  hora_saida: string | null;
}

export default function RelatoriosPage() {
  const { userCreche } = useAuth();
  const [dataInicio, setDataInicio] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [dataFim, setDataFim] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [turmaId, setTurmaId] = useState('all');
  const [alunoId, setAlunoId] = useState('all');
  const [turmas, setTurmas] = useState<{ id: string; nome: string }[]>([]);
  const [criancas, setCriancas] = useState<{ id: string; nome: string; turma_id: string }[]>([]);
  const [relatorio, setRelatorio] = useState<PresencaReport[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userCreche) return;
    const fetch = async () => {
      const { data: t } = await supabase.from('turmas').select('id, nome').eq('creche_id', userCreche.id);
      setTurmas(t || []);
      const turmaIds = (t || []).map(x => x.id);
      if (turmaIds.length > 0) {
        const { data: c } = await supabase.from('criancas').select('id, nome, turma_id').in('turma_id', turmaIds).order('nome');
        setCriancas(c || []);
      }
    };
    fetch();
  }, [userCreche]);

  const gerarRelatorio = async () => {
    setLoading(true);
    let query = supabase.from('presencas').select('*').gte('data', dataInicio).lte('data', dataFim);

    const criancaIds = turmaId !== 'all'
      ? criancas.filter(c => c.turma_id === turmaId).map(c => c.id)
      : criancas.map(c => c.id);

    if (alunoId !== 'all') {
      query = query.eq('crianca_id', alunoId);
    } else if (criancaIds.length > 0) {
      query = query.in('crianca_id', criancaIds);
    }

    const { data } = await query.order('data', { ascending: false });

    const report: PresencaReport[] = (data || []).map(p => {
      const crianca = criancas.find(c => c.id === p.crianca_id);
      const turma = turmas.find(t => t.id === crianca?.turma_id);
      return {
        id: p.id,
        crianca_id: p.crianca_id,
        crianca_nome: crianca?.nome || 'Desconhecido',
        turma_nome: turma?.nome || '',
        data: p.data,
        status: p.status,
        hora_chegada: p.hora_chegada,
        hora_saida: p.hora_saida,
      };
    });

    setRelatorio(report);
    setLoading(false);
  };

  const formatTempo = (chegada: string | null, saida: string | null) => {
    if (!chegada || !saida) return '—';
    const mins = differenceInMinutes(new Date(saida), new Date(chegada));
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m}min`;
  };

  const getStatusLabel = (status: string) => {
    if (status === 'presente') return <Badge className="rounded-lg bg-[hsl(var(--success))] text-[hsl(var(--success-foreground))]">Presente</Badge>;
    if (status === 'saiu') return <Badge variant="secondary" className="rounded-lg">Saiu</Badge>;
    return <Badge variant="outline" className="rounded-lg">Ausente</Badge>;
  };

  const exportarCSV = () => {
    if (relatorio.length === 0) return;
    let csv = `Relatório de Presença\n`;
    csv += `Escola: ${userCreche?.nome || ''}\n`;
    if (userCreche?.endereco) csv += `Endereço: ${userCreche.endereco}\n`;
    if (userCreche?.telefone) csv += `Telefone: ${userCreche.telefone}\n`;
    if (userCreche?.email) csv += `Email: ${userCreche.email}\n`;
    csv += `Período: ${format(new Date(dataInicio + 'T00:00:00'), 'dd/MM/yyyy')} a ${format(new Date(dataFim + 'T00:00:00'), 'dd/MM/yyyy')}\n\n`;
    csv += 'Nome,Turma,Data,Status,Chegada,Saída,Tempo Total\n';
    const rows = relatorio.map(r => {
      const chegada = r.hora_chegada ? format(new Date(r.hora_chegada), 'HH:mm') : '';
      const saida = r.hora_saida ? format(new Date(r.hora_saida), 'HH:mm') : '';
      return `"${r.crianca_nome}","${r.turma_nome}","${format(new Date(r.data + 'T00:00:00'), 'dd/MM/yyyy')}","${r.status}","${chegada}","${saida}","${formatTempo(r.hora_chegada, r.hora_saida)}"`;
    }).join('\n');
    
    const blob = new Blob([csv + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-presenca-${dataInicio}-${dataFim}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Relatório exportado!');
  };

  const exportarPDF = async () => {
    if (relatorio.length === 0) return;
    const rows: PresencaReportRow[] = relatorio.map(r => ({
      crianca_nome: r.crianca_nome,
      turma_nome: r.turma_nome,
      data: r.data,
      status: r.status,
      hora_chegada: r.hora_chegada,
      hora_saida: r.hora_saida,
      tempo: formatTempo(r.hora_chegada, r.hora_saida),
    }));
    await exportPresencaPDF(rows, {
      title: 'Relatório de Presença',
      crecheNome: userCreche?.nome || 'Escola',
      logoUrl: userCreche?.logo_url,
      crecheEndereco: userCreche?.endereco,
      crecheTelefone: userCreche?.telefone,
      crecheEmail: userCreche?.email,
      periodo: `${format(new Date(dataInicio + 'T00:00:00'), 'dd/MM/yyyy')} a ${format(new Date(dataFim + 'T00:00:00'), 'dd/MM/yyyy')}`,
    });
    toast.success('PDF exportado!');
  };

  const criancasFiltradas = turmaId !== 'all' ? criancas.filter(c => c.turma_id === turmaId) : criancas;

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Relatórios de Presença</h1>
          <p className="text-sm text-muted-foreground">Gere relatórios detalhados de presença</p>
        </div>

        {/* Filters */}
        <Card className="rounded-2xl border-2 border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="w-5 h-5 text-primary" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Data Início</label>
                <Input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} className="rounded-xl" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Data Fim</label>
                <Input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} className="rounded-xl" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Turma</label>
                <Select value={turmaId} onValueChange={v => { setTurmaId(v); setAlunoId('all'); }}>
                  <SelectTrigger className="rounded-xl"><SelectValue placeholder="Todas" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as turmas</SelectItem>
                    {turmas.map(t => <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Aluno</label>
                <Select value={alunoId} onValueChange={setAlunoId}>
                  <SelectTrigger className="rounded-xl"><SelectValue placeholder="Todos" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os alunos</SelectItem>
                    {criancasFiltradas.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button onClick={gerarRelatorio} className="rounded-xl w-full" disabled={loading}>
                  <FileText className="w-4 h-4 mr-2" />
                  {loading ? 'Gerando...' : 'Gerar'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {relatorio.length > 0 && (
          <Card className="rounded-2xl border-2 border-border">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Resultado ({relatorio.length} registros)</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="rounded-xl" onClick={exportarPDF}>
                  <FileText className="w-4 h-4 mr-2" />
                  Exportar PDF
                </Button>
                <Button variant="outline" size="sm" className="rounded-xl" onClick={exportarCSV}>
                  <Download className="w-4 h-4 mr-2" />
                  Exportar CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-3 text-muted-foreground font-medium">Aluno</th>
                      <th className="text-left py-2 px-3 text-muted-foreground font-medium">Turma</th>
                      <th className="text-left py-2 px-3 text-muted-foreground font-medium">Data</th>
                      <th className="text-left py-2 px-3 text-muted-foreground font-medium">Status</th>
                      <th className="text-left py-2 px-3 text-muted-foreground font-medium">Chegada</th>
                      <th className="text-left py-2 px-3 text-muted-foreground font-medium">Saída</th>
                      <th className="text-left py-2 px-3 text-muted-foreground font-medium">Tempo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {relatorio.map(r => (
                      <tr key={r.id} className="border-b border-border/50 hover:bg-muted/30">
                        <td className="py-2 px-3 font-medium text-foreground">{r.crianca_nome}</td>
                        <td className="py-2 px-3 text-muted-foreground">{r.turma_nome}</td>
                        <td className="py-2 px-3 text-muted-foreground">{format(new Date(r.data + 'T00:00:00'), 'dd/MM/yyyy')}</td>
                        <td className="py-2 px-3">{getStatusLabel(r.status)}</td>
                        <td className="py-2 px-3 text-muted-foreground">{r.hora_chegada ? format(new Date(r.hora_chegada), 'HH:mm') : '—'}</td>
                        <td className="py-2 px-3 text-muted-foreground">{r.hora_saida ? format(new Date(r.hora_saida), 'HH:mm') : '—'}</td>
                        <td className="py-2 px-3 text-muted-foreground">{formatTempo(r.hora_chegada, r.hora_saida)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
