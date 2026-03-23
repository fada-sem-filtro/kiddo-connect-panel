import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { usePedagogicalSettings } from '@/hooks/usePedagogicalSettings';

interface Crianca { id: string; nome: string; turma_id: string; }
interface Boletim { id: string; materia_id: string; periodo_letivo: string; avaliacao: number | null; observacoes: string | null; }
interface Materia { id: string; nome: string; }
interface RelatorioAluno { id: string; periodo_letivo: string; status: string; modelo_nome?: string; }
interface Secao { id: string; titulo: string; ordem: number; }
interface Campo { id: string; secao_id: string; titulo: string; tipo: string; ordem: number; }
interface Resposta { campo_id: string; valor: string; }

const PERIODOS = ['1º Bimestre', '2º Bimestre', '3º Bimestre', '4º Bimestre'];

export default function ResponsavelDesempenhoPage() {
  const { user } = useAuth();
  const { settings } = usePedagogicalSettings();
  const [criancas, setCriancas] = useState<Crianca[]>([]);
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [boletins, setBoletins] = useState<Boletim[]>([]);
  const [relatorios, setRelatorios] = useState<RelatorioAluno[]>([]);
  const [selectedCrianca, setSelectedCrianca] = useState('');
  const [selectedPeriodo, setSelectedPeriodo] = useState('');
  const [selectedRelatorio, setSelectedRelatorio] = useState<RelatorioAluno | null>(null);
  const [secoes, setSecoes] = useState<Secao[]>([]);
  const [campos, setCampos] = useState<Campo[]>([]);
  const [respostas, setRespostas] = useState<Resposta[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCriancas = async () => {
      if (!user) return;
      const { data: links } = await supabase
        .from('crianca_responsaveis')
        .select('crianca_id, criancas(id, nome, turma_id)')
        .eq('responsavel_user_id', user.id);
      
      const list = links?.map((l: any) => l.criancas).filter(Boolean) as Crianca[] || [];
      setCriancas(list);

      if (list.length > 0) {
        const turmaId = list[0].turma_id;
        const { data: turmaData } = await supabase.from('turmas').select('creche_id').eq('id', turmaId).single();
        if (turmaData) {
          const { data: materiasData } = await supabase
            .from('materias').select('id, nome').eq('creche_id', (turmaData as any).creche_id).eq('ativo', true).order('nome');
          setMaterias((materiasData as Materia[]) || []);
        }
      }
      setLoading(false);
    };
    fetchCriancas();
  }, [user]);

  useEffect(() => {
    const fetchBoletins = async () => {
      if (!selectedCrianca) { setBoletins([]); return; }
      let query = supabase.from('boletins').select('id, materia_id, periodo_letivo, avaliacao, observacoes').eq('crianca_id', selectedCrianca);
      if (selectedPeriodo && selectedPeriodo !== 'all') query = query.eq('periodo_letivo', selectedPeriodo);
      const { data } = await query.order('periodo_letivo');
      setBoletins((data as Boletim[]) || []);
    };
    fetchBoletins();
  }, [selectedCrianca, selectedPeriodo]);

  // Fetch qualitative reports
  useEffect(() => {
    if (!selectedCrianca) { setRelatorios([]); return; }
    const fetch = async () => {
      const { data } = await supabase.from('relatorio_alunos')
        .select('id, periodo_letivo, status, relatorio_modelos(nome)')
        .eq('crianca_id', selectedCrianca).eq('status', 'finalizado').order('created_at', { ascending: false });
      setRelatorios((data || []).map((r: any) => ({ ...r, modelo_nome: r.relatorio_modelos?.nome })));
    };
    fetch();
  }, [selectedCrianca]);

  const viewRelatorio = async (rel: RelatorioAluno) => {
    setSelectedRelatorio(rel);
    // Get model structure via relatorio_alunos -> modelo_id
    const { data: raData } = await supabase.from('relatorio_alunos').select('modelo_id').eq('id', rel.id).single();
    if (!raData) return;
    const modeloId = (raData as any).modelo_id;
    const { data: secoesData } = await supabase.from('relatorio_secoes').select('*').eq('modelo_id', modeloId).order('ordem');
    const secoesList = (secoesData as Secao[]) || [];
    setSecoes(secoesList);
    if (secoesList.length > 0) {
      const { data: camposData } = await supabase.from('relatorio_campos').select('*').in('secao_id', secoesList.map(s => s.id)).order('ordem');
      setCampos((camposData as Campo[]) || []);
    }
    const { data: respsData } = await supabase.from('relatorio_respostas').select('campo_id, valor').eq('relatorio_aluno_id', rel.id);
    setRespostas((respsData as Resposta[]) || []);
  };

  const getMateriaName = (id: string) => materias.find(m => m.id === id)?.nome || '—';

  if (loading) {
    return <MainLayout><div className="flex items-center justify-center py-20"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div></MainLayout>;
  }

  const showBoletim = settings?.boletim_ativo;
  const showRelatorio = settings?.relatorio_desempenho_ativo;

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-primary" />
            Desempenho do Aluno
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Acompanhe as notas e relatórios do seu filho(a)</p>
        </div>

        <Card className="rounded-2xl border-2 border-border">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">Aluno(a)</Label>
                <Select value={selectedCrianca} onValueChange={setSelectedCrianca}>
                  <SelectTrigger className="rounded-xl mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{criancas.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Período</Label>
                <Select value={selectedPeriodo} onValueChange={setSelectedPeriodo}>
                  <SelectTrigger className="rounded-xl mt-1"><SelectValue placeholder="Todos" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {PERIODOS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {selectedCrianca ? (
          <Tabs defaultValue={showBoletim ? 'boletim' : 'relatorio'}>
            <TabsList className="rounded-xl">
              {showBoletim && <TabsTrigger value="boletim" className="rounded-xl">Boletim</TabsTrigger>}
              {showRelatorio && <TabsTrigger value="relatorio" className="rounded-xl">Relatórios Pedagógicos</TabsTrigger>}
            </TabsList>

            {showBoletim && (
              <TabsContent value="boletim">
                {boletins.length > 0 ? (
                  <Card className="rounded-2xl border-2 border-border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Matéria</TableHead>
                          <TableHead>Período</TableHead>
                          <TableHead className="text-center">Nota</TableHead>
                          <TableHead>Observações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {boletins.map(b => (
                          <TableRow key={b.id}>
                            <TableCell className="font-medium">{getMateriaName(b.materia_id)}</TableCell>
                            <TableCell><Badge variant="outline" className="rounded-xl">{b.periodo_letivo}</Badge></TableCell>
                            <TableCell className="text-center">
                              <span className={`font-bold text-lg ${(b.avaliacao ?? 0) >= 7 ? 'text-emerald-600' : (b.avaliacao ?? 0) >= 5 ? 'text-yellow-500' : 'text-destructive'}`}>
                                {b.avaliacao !== null ? b.avaliacao.toFixed(1) : '—'}
                              </span>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">{b.observacoes || '—'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Card>
                ) : (
                  <Card className="border-2 border-dashed border-muted-foreground/30 rounded-3xl">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <BookOpen className="w-16 h-16 text-muted-foreground/50 mb-4" />
                      <p className="text-muted-foreground">Nenhuma nota registrada</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            )}

            {showRelatorio && (
              <TabsContent value="relatorio">
                {selectedRelatorio ? (
                  <div className="space-y-4">
                    <Button variant="outline" className="rounded-xl" onClick={() => setSelectedRelatorio(null)}>← Voltar</Button>
                    <h2 className="text-lg font-bold text-foreground">{selectedRelatorio.modelo_nome} — {selectedRelatorio.periodo_letivo}</h2>
                    {secoes.map(secao => {
                      const secaoCampos = campos.filter(c => c.secao_id === secao.id);
                      return (
                        <Card key={secao.id} className="rounded-2xl border-2 border-border">
                          <CardContent className="p-5">
                            <h3 className="font-bold text-foreground text-lg mb-3">{secao.titulo}</h3>
                            <div className="space-y-4">
                              {secaoCampos.map(campo => {
                                const resp = respostas.find(r => r.campo_id === campo.id);
                                return (
                                  <div key={campo.id}>
                                    <Label className="text-sm font-medium text-muted-foreground">{campo.titulo}</Label>
                                    <p className="mt-1 text-foreground whitespace-pre-wrap">{resp?.valor || '—'}</p>
                                  </div>
                                );
                              })}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                ) : relatorios.length > 0 ? (
                  <div className="space-y-3">
                    {relatorios.map(r => (
                      <Card key={r.id} className="rounded-2xl border-2 border-border hover:border-primary/50 transition-colors cursor-pointer" onClick={() => viewRelatorio(r)}>
                        <CardContent className="p-4 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <FileText className="w-5 h-5 text-primary" />
                            <div>
                              <p className="font-semibold text-foreground">{r.modelo_nome}</p>
                              <p className="text-sm text-muted-foreground">{r.periodo_letivo}</p>
                            </div>
                          </div>
                          <Badge className="rounded-xl">Finalizado</Badge>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card className="border-2 border-dashed border-muted-foreground/30 rounded-3xl">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <FileText className="w-16 h-16 text-muted-foreground/50 mb-4" />
                      <p className="text-muted-foreground">Nenhum relatório pedagógico disponível</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            )}
          </Tabs>
        ) : (
          <Card className="border-2 border-dashed border-muted-foreground/30 rounded-3xl">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BookOpen className="w-16 h-16 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">Selecione um aluno para visualizar</p>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
