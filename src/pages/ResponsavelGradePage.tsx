import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { CalendarClock, Clock, BookOpen } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const DIAS_SEMANA = [
  { value: 1, label: 'Segunda-feira' },
  { value: 2, label: 'Terça-feira' },
  { value: 3, label: 'Quarta-feira' },
  { value: 4, label: 'Quinta-feira' },
  { value: 5, label: 'Sexta-feira' },
];

interface GradeItem {
  id: string;
  dia_semana: number;
  horario_inicio: string;
  horario_fim: string;
  materia_nome: string;
  educador_nome: string;
}

export default function ResponsavelGradePage() {
  const { user } = useAuth();
  const [criancas, setCriancas] = useState<{ id: string; nome: string; turma_id: string; turma_nome: string }[]>([]);
  const [selectedCrianca, setSelectedCrianca] = useState('');
  const [grade, setGrade] = useState<GradeItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch children linked to this responsável
  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data: links } = await supabase
        .from('crianca_responsaveis')
        .select('crianca_id')
        .eq('responsavel_user_id', user.id);
      if (!links?.length) { setLoading(false); return; }

      const ids = links.map(l => l.crianca_id);
      const { data: kids } = await supabase
        .from('criancas')
        .select('id, nome, turma_id, turmas(nome)')
        .in('id', ids)
        .eq('ativo', true);

      const mapped = (kids || []).map((k: any) => ({
        id: k.id,
        nome: k.nome,
        turma_id: k.turma_id,
        turma_nome: k.turmas?.nome || '',
      }));
      setCriancas(mapped);
      if (mapped.length === 1) setSelectedCrianca(mapped[0].id);
      setLoading(false);
    };
    fetch();
  }, [user]);

  // Fetch grade for selected child's turma
  useEffect(() => {
    const crianca = criancas.find(c => c.id === selectedCrianca);
    if (!crianca) { setGrade([]); return; }

    const fetch = async () => {
      const { data } = await supabase
        .from('grade_aulas')
        .select('id, dia_semana, horario_inicio, horario_fim, materia_id, educador_user_id')
        .eq('turma_id', crianca.turma_id)
        .order('dia_semana')
        .order('horario_inicio');

      if (!data?.length) { setGrade([]); return; }

      // Fetch materia names
      const materiaIds = [...new Set(data.map(d => d.materia_id))];
      const { data: materias } = await supabase.from('materias').select('id, nome').in('id', materiaIds);
      const materiaMap = new Map((materias || []).map(m => [m.id, m.nome]));

      // Fetch educador names
      const educadorIds = [...new Set(data.map(d => d.educador_user_id))];
      const { data: profiles } = await supabase.from('profiles').select('user_id, nome').in('user_id', educadorIds);
      const educadorMap = new Map((profiles || []).map(p => [p.user_id, p.nome]));

      setGrade(data.map(d => ({
        id: d.id,
        dia_semana: d.dia_semana,
        horario_inicio: d.horario_inicio,
        horario_fim: d.horario_fim,
        materia_nome: materiaMap.get(d.materia_id) || 'Matéria',
        educador_nome: educadorMap.get(d.educador_user_id) || 'Professor',
      })));
    };
    fetch();
  }, [selectedCrianca, criancas]);

  const gradeByDay = DIAS_SEMANA.map(dia => ({
    ...dia,
    aulas: grade.filter(g => g.dia_semana === dia.value),
  })).filter(d => d.aulas.length > 0);

  if (loading) {
    return <MainLayout><div className="flex items-center justify-center py-20"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div></MainLayout>;
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <CalendarClock className="w-6 h-6 text-primary" />
            Grade de Aulas
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Horários e matérias semanais</p>
        </div>

        {criancas.length > 1 && (
          <Card className="rounded-2xl border-2 border-border">
            <CardContent className="p-4">
              <div className="max-w-sm">
                <Label className="text-xs text-muted-foreground">Selecione o aluno</Label>
                <Select value={selectedCrianca} onValueChange={setSelectedCrianca}>
                  <SelectTrigger className="rounded-xl mt-1"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    {criancas.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.nome} — {c.turma_nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        )}

        {criancas.length === 1 && (
          <p className="text-sm text-muted-foreground">
            Aluno: <span className="font-semibold text-foreground">{criancas[0].nome}</span> — {criancas[0].turma_nome}
          </p>
        )}

        {!selectedCrianca ? (
          <Card className="border-2 border-dashed border-muted-foreground/30 rounded-3xl">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <CalendarClock className="w-16 h-16 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">Selecione um aluno para ver a grade de aulas</p>
            </CardContent>
          </Card>
        ) : gradeByDay.length === 0 ? (
          <Card className="border-2 border-dashed border-muted-foreground/30 rounded-3xl">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BookOpen className="w-16 h-16 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">Nenhuma aula cadastrada para esta turma</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {gradeByDay.map(dia => (
              <Card key={dia.value} className="rounded-2xl border-2 border-border">
                <CardContent className="p-4">
                  <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
                    <Badge variant="secondary" className="rounded-xl">{dia.label}</Badge>
                  </h3>
                  <div className="space-y-2">
                    {dia.aulas.map(aula => (
                      <div key={aula.id} className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl">
                        <Clock className="w-4 h-4 text-primary shrink-0" />
                        <span className="text-sm font-mono text-muted-foreground w-28 shrink-0">
                          {aula.horario_inicio.slice(0, 5)} — {aula.horario_fim.slice(0, 5)}
                        </span>
                        <span className="font-semibold text-foreground">{aula.materia_nome}</span>
                        <span className="text-sm text-muted-foreground ml-auto">Prof. {aula.educador_nome}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
