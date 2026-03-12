import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { FileText, Download, User, Calendar, Clock, CheckCircle2 } from 'lucide-react';
import { format, differenceInMinutes, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { EVENT_TYPE_LABELS, EVENT_TYPE_ICONS, EventType } from '@/types';
import { toast } from 'sonner';
import { exportAlunoRelatorioPDF } from '@/lib/pdf-export';

interface PresencaRow {
  data: string;
  status: string;
  hora_chegada: string | null;
  hora_saida: string | null;
}

interface EventoRow {
  id: string;
  tipo: string;
  observacao: string | null;
  data_inicio: string;
}

export default function RelatorioAlunoPage() {
  const { userCreche } = useAuth();
  const [turmas, setTurmas] = useState<{ id: string; nome: string }[]>([]);
  const [criancas, setCriancas] = useState<{ id: string; nome: string; turma_id: string; data_nascimento: string }[]>([]);
  const [alunoId, setAlunoId] = useState('');
  const [periodo, setPeriodo] = useState('semana');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [presencas, setPresencas] = useState<PresencaRow[]>([]);
  const [eventos, setEventos] = useState<EventoRow[]>([]);
  const [responsaveis, setResponsaveis] = useState<{ nome: string; parentesco: string; telefone?: string | null; email?: string | null }[]>([]);
  const [loading, setLoading] = useState(false);
  const [gerado, setGerado] = useState(false);

  useEffect(() => {
    if (!userCreche) return;
    const fetch = async () => {
      const { data: t } = await supabase.from('turmas').select('id, nome').eq('creche_id', userCreche.id);
      setTurmas(t || []);
      const turmaIds = (t || []).map(x => x.id);
      if (turmaIds.length > 0) {
        const { data: c } = await supabase.from('criancas').select('id, nome, turma_id, data_nascimento').in('turma_id', turmaIds).order('nome');
        setCriancas(c || []);
      }
    };
    fetch();
  }, [userCreche]);

  useEffect(() => {
    const now = new Date();
    if (periodo === 'semana') {
      setDataInicio(format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd'));
      setDataFim(format(endOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd'));
    } else if (periodo === 'mes') {
      setDataInicio(format(startOfMonth(now), 'yyyy-MM-dd'));
      setDataFim(format(endOfMonth(now), 'yyyy-MM-dd'));
    } else if (periodo === 'mes-anterior') {
      const prev = subMonths(now, 1);
      setDataInicio(format(startOfMonth(prev), 'yyyy-MM-dd'));
      setDataFim(format(endOfMonth(prev), 'yyyy-MM-dd'));
    }
  }, [periodo]);

  const gerarRelatorio = async () => {
    if (!alunoId) { toast.error('Selecione um aluno'); return; }
    setLoading(true);

    const { data: pData } = await supabase
      .from('presencas')
      .select('data, status, hora_chegada, hora_saida')
      .eq('crianca_id', alunoId)
      .gte('data', dataInicio)
      .lte('data', dataFim)
      .order('data', { ascending: false });
    setPresencas(pData || []);

    const startDt = new Date(dataInicio + 'T00:00:00').toISOString();
    const endDt = new Date(dataFim + 'T23:59:59').toISOString();
    const { data: eData } = await supabase
      .from('eventos')
      .select('id, tipo, observacao, data_inicio')
      .eq('crianca_id', alunoId)
      .gte('data_inicio', startDt)
      .lte('data_inicio', endDt)
      .order('data_inicio', { ascending: false });
    setEventos(eData || []);

    // Fetch responsáveis
    const { data: respData } = await supabase
      .from('crianca_responsaveis')
      .select('parentesco, responsavel_user_id, profiles:responsavel_user_id(nome, telefone, email)')
      .eq('crianca_id', alunoId);
    
    setResponsaveis((respData || []).map(r => ({
      nome: (r.profiles as any)?.nome || 'Desconhecido',
      parentesco: r.parentesco,
      telefone: (r.profiles as any)?.telefone,
      email: (r.profiles as any)?.email,
    })));

    setGerado(true);
    setLoading(false);
  };

  const aluno = criancas.find(c => c.id === alunoId);
  const turmaNome = turmas.find(t => t.id === aluno?.turma_id)?.nome || '';
  const diasPresente = presencas.filter(p => p.status === 'presente' || p.status === 'saiu').length;
  const diasAusente = presencas.filter(p => p.status === 'ausente').length;
  const totalDias = presencas.length;
  const taxaPresenca = totalDias > 0 ? Math.round((diasPresente / totalDias) * 100) : 0;

  const formatTempo = (chegada: string | null, saida: string | null) => {
    if (!chegada || !saida) return '—';
    const mins = differenceInMinutes(new Date(saida), new Date(chegada));
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m}min`;
  };

  const getInitials = (nome: string) =>
    nome.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  const exportarCSV = () => {
    if (!aluno) return;
    let csv = `Relatório Individual - ${aluno.nome}\n`;
    csv += `Escola: ${userCreche?.nome || ''}\n`;
    if (userCreche?.endereco) csv += `Endereço: ${userCreche.endereco}\n`;
    if (userCreche?.telefone) csv += `Telefone: ${userCreche.telefone}\n`;
    if (userCreche?.email) csv += `Email: ${userCreche.email}\n`;
    csv += `\nAluno: ${aluno.nome}\n`;
    csv += `Turma: ${turmaNome}\n`;
    csv += `Data de Nascimento: ${format(new Date(aluno.data_nascimento + 'T00:00:00'), 'dd/MM/yyyy')}\n`;
    if (responsaveis.length > 0) {
      csv += `Responsáveis: ${responsaveis.map(r => `${r.nome} (${r.parentesco})${r.telefone ? ' - Tel: ' + r.telefone : ''}${r.email ? ' - ' + r.email : ''}`).join('; ')}\n`;
    }
    csv += `Período: ${format(new Date(dataInicio + 'T00:00:00'), 'dd/MM/yyyy')} a ${format(new Date(dataFim + 'T00:00:00'), 'dd/MM/yyyy')}\n`;
    csv += `Taxa de Presença: ${taxaPresenca}% (${diasPresente} de ${totalDias} dias)\n\n`;
    csv += 'Data,Status,Chegada,Saída,Tempo\n';
    presencas.forEach(p => {
      csv += `${format(new Date(p.data + 'T00:00:00'), 'dd/MM/yyyy')},${p.status},${p.hora_chegada ? format(new Date(p.hora_chegada), 'HH:mm') : ''},${p.hora_saida ? format(new Date(p.hora_saida), 'HH:mm') : ''},${formatTempo(p.hora_chegada, p.hora_saida)}\n`;
    });
    csv += '\nEventos\nData,Tipo,Observação\n';
    eventos.forEach(e => {
      csv += `${format(new Date(e.data_inicio), 'dd/MM/yyyy HH:mm')},${EVENT_TYPE_LABELS[e.tipo as EventType] || e.tipo},"${e.observacao || ''}"\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-${aluno.nome.replace(/\s+/g, '-').toLowerCase()}-${dataInicio}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Relatório exportado!');
  };

  const exportarPDF = async () => {
    if (!aluno) return;
    await exportAlunoRelatorioPDF({
      alunoNome: aluno.nome,
      turmaNome,
      dataNascimento: aluno.data_nascimento,
      taxaPresenca,
      diasPresente,
      diasAusente,
      totalDias,
      totalEventos: eventos.length,
      responsaveis,
      presencas: presencas.map(p => ({
        data: p.data,
        status: p.status,
        hora_chegada: p.hora_chegada,
        hora_saida: p.hora_saida,
        tempo: formatTempo(p.hora_chegada, p.hora_saida),
      })),
      eventos: eventos.map(e => ({
        data: format(new Date(e.data_inicio), 'dd/MM HH:mm'),
        tipo: e.tipo,
        tipoLabel: EVENT_TYPE_LABELS[e.tipo as EventType] || e.tipo,
        observacao: e.observacao,
      })),
    }, {
      title: 'Relatório Individual',
      crecheNome: userCreche?.nome || 'Escola',
      logoUrl: userCreche?.logo_url,
      crecheEndereco: userCreche?.endereco,
      crecheTelefone: userCreche?.telefone,
      crecheEmail: userCreche?.email,
      periodo: `${format(new Date(dataInicio + 'T00:00:00'), 'dd/MM/yyyy')} a ${format(new Date(dataFim + 'T00:00:00'), 'dd/MM/yyyy')}`,
    });
    toast.success('PDF exportado!');
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Relatório Individual</h1>
          <p className="text-sm text-muted-foreground">Relatório detalhado por aluno</p>
        </div>

        {/* Filters */}
        <Card className="rounded-2xl border-2 border-border">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Aluno</label>
                <Select value={alunoId} onValueChange={setAlunoId}>
                  <SelectTrigger className="rounded-xl"><SelectValue placeholder="Selecione o aluno" /></SelectTrigger>
                  <SelectContent>
                    {criancas.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Período</label>
                <Select value={periodo} onValueChange={setPeriodo}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="semana">Esta semana</SelectItem>
                    <SelectItem value="mes">Este mês</SelectItem>
                    <SelectItem value="mes-anterior">Mês anterior</SelectItem>
                    <SelectItem value="custom">Personalizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {periodo === 'custom' && (
                <>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">De</label>
                    <Input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} className="rounded-xl" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">Até</label>
                    <Input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} className="rounded-xl" />
                  </div>
                </>
              )}
              <div className="flex items-end">
                <Button onClick={gerarRelatorio} className="rounded-xl w-full" disabled={loading}>
                  <FileText className="w-4 h-4 mr-2" />
                  {loading ? 'Gerando...' : 'Gerar Relatório'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {gerado && aluno && (
          <>
            {/* Student info + Summary */}
            <div className="grid md:grid-cols-3 gap-4">
              <Card className="rounded-2xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
                <CardContent className="p-6 flex items-center gap-4">
                  <Avatar className="w-16 h-16 border-2 border-primary/30">
                    <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20 text-primary font-bold text-xl">
                      {getInitials(aluno.nome)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">{aluno.nome}</h2>
                    <p className="text-sm text-muted-foreground">{turmaNome}</p>
                    <p className="text-xs text-muted-foreground">Nasc: {format(new Date(aluno.data_nascimento + 'T00:00:00'), 'dd/MM/yyyy')}</p>
                    {responsaveis.length > 0 && (
                      <div className="mt-1">
                        {responsaveis.map((r, i) => (
                          <p key={i} className="text-xs text-muted-foreground">
                            {r.nome} ({r.parentesco}){r.telefone ? ` • ${r.telefone}` : ''}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
              <Card className="rounded-2xl border-2 border-[hsl(var(--success))]/30">
                <CardContent className="p-6 text-center">
                  <CheckCircle2 className="w-8 h-8 mx-auto text-[hsl(var(--success))] mb-2" />
                  <p className="text-3xl font-bold text-foreground">{taxaPresenca}%</p>
                  <p className="text-sm text-muted-foreground">Taxa de Presença</p>
                  <p className="text-xs text-muted-foreground">{diasPresente} de {totalDias} dias</p>
                </CardContent>
              </Card>
              <Card className="rounded-2xl border-2 border-border">
                <CardContent className="p-6 text-center">
                  <Calendar className="w-8 h-8 mx-auto text-primary mb-2" />
                  <p className="text-3xl font-bold text-foreground">{eventos.length}</p>
                  <p className="text-sm text-muted-foreground">Eventos Registrados</p>
                </CardContent>
              </Card>
            </div>

            {/* Presence table */}
            <Card className="rounded-2xl border-2 border-border">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Histórico de Presença</CardTitle>
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
                        <th className="text-left py-2 px-3 text-muted-foreground font-medium">Data</th>
                        <th className="text-left py-2 px-3 text-muted-foreground font-medium">Status</th>
                        <th className="text-left py-2 px-3 text-muted-foreground font-medium">Chegada</th>
                        <th className="text-left py-2 px-3 text-muted-foreground font-medium">Saída</th>
                        <th className="text-left py-2 px-3 text-muted-foreground font-medium">Tempo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {presencas.map((p, i) => (
                        <tr key={i} className="border-b border-border/50 hover:bg-muted/30">
                          <td className="py-2 px-3 font-medium text-foreground">{format(new Date(p.data + 'T00:00:00'), "EEE, dd/MM", { locale: ptBR })}</td>
                          <td className="py-2 px-3">
                            {(p.status === 'presente' || p.status === 'saiu') ? (
                              <Badge className="rounded-lg bg-[hsl(var(--success))] text-[hsl(var(--success-foreground))]">{p.status === 'saiu' ? 'Saiu' : 'Presente'}</Badge>
                            ) : (
                              <Badge variant="outline" className="rounded-lg">Ausente</Badge>
                            )}
                          </td>
                          <td className="py-2 px-3 text-muted-foreground">{p.hora_chegada ? format(new Date(p.hora_chegada), 'HH:mm') : '—'}</td>
                          <td className="py-2 px-3 text-muted-foreground">{p.hora_saida ? format(new Date(p.hora_saida), 'HH:mm') : '—'}</td>
                          <td className="py-2 px-3 text-muted-foreground">{formatTempo(p.hora_chegada, p.hora_saida)}</td>
                        </tr>
                      ))}
                      {presencas.length === 0 && (
                        <tr><td colSpan={5} className="py-4 text-center text-muted-foreground">Nenhum registro no período</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Events */}
            <Card className="rounded-2xl border-2 border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Eventos Registrados</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {eventos.map(e => (
                  <div key={e.id} className="flex items-start gap-3 p-3 bg-muted/50 rounded-xl">
                    <span className="text-lg">{EVENT_TYPE_ICONS[e.tipo as EventType] || '📋'}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">{EVENT_TYPE_LABELS[e.tipo as EventType] || e.tipo}</span>
                        <span className="text-xs text-muted-foreground">{format(new Date(e.data_inicio), "dd/MM HH:mm")}</span>
                      </div>
                      {e.observacao && <p className="text-sm text-muted-foreground">{e.observacao}</p>}
                    </div>
                  </div>
                ))}
                {eventos.length === 0 && <p className="text-sm text-muted-foreground">Nenhum evento no período</p>}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </MainLayout>
  );
}
