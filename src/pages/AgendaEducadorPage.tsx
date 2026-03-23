import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarClock, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface GradeAula {
  id: string;
  turma_id: string;
  materia_id: string;
  dia_semana: number;
  horario_inicio: string;
  horario_fim: string;
  turma_nome?: string;
  materia_nome?: string;
}

const DIAS_SEMANA = [
  { value: 1, label: 'Segunda-feira' },
  { value: 2, label: 'Terça-feira' },
  { value: 3, label: 'Quarta-feira' },
  { value: 4, label: 'Quinta-feira' },
  { value: 5, label: 'Sexta-feira' },
];

export default function AgendaEducadorPage() {
  const { user } = useAuth();
  const [grade, setGrade] = useState<GradeAula[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data } = await supabase
        .from('grade_aulas')
        .select('*, turmas(nome), materias(nome)')
        .eq('educador_user_id', user.id)
        .order('dia_semana')
        .order('horario_inicio');

      const mapped = (data || []).map((g: any) => ({
        ...g,
        turma_nome: g.turmas?.nome || '—',
        materia_nome: g.materias?.nome || '—',
      }));
      setGrade(mapped);
      setLoading(false);
    };
    fetch();
  }, [user]);

  const gradeByDia = DIAS_SEMANA.map(dia => ({
    ...dia,
    aulas: grade.filter(g => g.dia_semana === dia.value),
  }));

  const today = new Date().getDay(); // 0=Sun, 1=Mon...

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
            <CalendarClock className="w-6 h-6 text-primary" />
            Minha Agenda
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Sua grade semanal de aulas</p>
        </div>

        {grade.length === 0 ? (
          <Card className="border-2 border-dashed border-muted-foreground/30 rounded-3xl">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <CalendarClock className="w-16 h-16 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">Nenhuma aula atribuída a você</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {gradeByDia.filter(d => d.aulas.length > 0).map((dia) => (
              <Card
                key={dia.value}
                className={`rounded-2xl border-2 ${dia.value === today ? 'border-primary bg-primary/5' : 'border-border'}`}
              >
                <CardContent className="p-4">
                  <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
                    <Badge variant={dia.value === today ? 'default' : 'outline'} className="rounded-xl text-sm">
                      {dia.label}
                    </Badge>
                    {dia.value === today && <span className="text-xs text-primary font-semibold">Hoje</span>}
                  </h3>
                  <div className="space-y-2">
                    {dia.aulas.map((aula) => (
                      <div key={aula.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border border-border">
                        <div className="flex items-center gap-1 text-sm font-mono text-primary min-w-[120px]">
                          <Clock className="w-4 h-4" />
                          {aula.horario_inicio.slice(0, 5)} — {aula.horario_fim.slice(0, 5)}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{aula.materia_nome}</p>
                          <p className="text-xs text-muted-foreground">Turma: {aula.turma_nome}</p>
                        </div>
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
