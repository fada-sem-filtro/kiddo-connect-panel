import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { BookOpen } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Crianca { id: string; nome: string; turma_id: string; }
interface Boletim { id: string; materia_id: string; periodo_letivo: string; avaliacao: number | null; observacoes: string | null; }
interface Materia { id: string; nome: string; }

const PERIODOS = ['1º Bimestre', '2º Bimestre', '3º Bimestre', '4º Bimestre'];

export default function ResponsavelDesempenhoPage() {
  const { user } = useAuth();
  const [criancas, setCriancas] = useState<Crianca[]>([]);
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [boletins, setBoletins] = useState<Boletim[]>([]);
  const [selectedCrianca, setSelectedCrianca] = useState('');
  const [selectedPeriodo, setSelectedPeriodo] = useState('');
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

      // Fetch materias from the school
      if (list.length > 0) {
        const turmaId = list[0].turma_id;
        const { data: turmaData } = await supabase.from('turmas').select('creche_id').eq('id', turmaId).single();
        if (turmaData) {
          const { data: materiasData } = await supabase
            .from('materias')
            .select('id, nome')
            .eq('creche_id', (turmaData as any).creche_id)
            .eq('ativo', true)
            .order('nome');
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
      if (selectedPeriodo) query = query.eq('periodo_letivo', selectedPeriodo);
      const { data } = await query.order('periodo_letivo');
      setBoletins((data as Boletim[]) || []);
    };
    fetchBoletins();
  }, [selectedCrianca, selectedPeriodo]);

  const getMateriaName = (id: string) => materias.find(m => m.id === id)?.nome || '—';

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-primary" />
            Desempenho do Aluno
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Acompanhe as notas e o boletim do seu filho(a)</p>
        </div>

        <Card className="rounded-2xl border-2 border-border">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">Aluno(a)</Label>
                <Select value={selectedCrianca} onValueChange={setSelectedCrianca}>
                  <SelectTrigger className="rounded-xl mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {criancas.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Período</Label>
                <Select value={selectedPeriodo} onValueChange={setSelectedPeriodo}>
                  <SelectTrigger className="rounded-xl mt-1"><SelectValue placeholder="Todos" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {PERIODOS.map(p => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {selectedCrianca && boletins.length > 0 ? (
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
                {boletins.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell className="font-medium">{getMateriaName(b.materia_id)}</TableCell>
                    <TableCell><Badge variant="outline" className="rounded-xl">{b.periodo_letivo}</Badge></TableCell>
                    <TableCell className="text-center">
                      <span className={`font-bold text-lg ${(b.avaliacao ?? 0) >= 7 ? 'text-[hsl(var(--success))]' : (b.avaliacao ?? 0) >= 5 ? 'text-yellow-500' : 'text-destructive'}`}>
                        {b.avaliacao !== null ? b.avaliacao.toFixed(1) : '—'}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{b.observacoes || '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        ) : selectedCrianca ? (
          <Card className="border-2 border-dashed border-muted-foreground/30 rounded-3xl">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BookOpen className="w-16 h-16 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">Nenhuma nota registrada para este período</p>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-2 border-dashed border-muted-foreground/30 rounded-3xl">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BookOpen className="w-16 h-16 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">Selecione um aluno para visualizar o boletim</p>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
