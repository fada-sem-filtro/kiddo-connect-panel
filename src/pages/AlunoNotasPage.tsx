import { useEffect, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, BookOpen, MessageSquare } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';

export default function AlunoNotasPage() {
  const { user } = useAuth();
  const [notas, setNotas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data: c } = await supabase.from('criancas').select('id').eq('user_id', user.id).maybeSingle();
      if (!c) { setLoading(false); return; }

      const { data } = await supabase
        .from('atividade_entregas')
        .select('*, atividades_pedagogicas(titulo, tipo, data_entrega, turmas(nome))')
        .eq('aluno_crianca_id', c.id)
        .eq('status', 'avaliada')
        .order('updated_at', { ascending: false });

      setNotas(data || []);
      setLoading(false);
    };
    fetch();
  }, [user]);

  if (loading) {
    return <MainLayout><div className="flex items-center justify-center py-20"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div></MainLayout>;
  }

  return (
    <MainLayout>
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Trophy className="w-6 h-6 text-primary" />
          Minhas Notas
        </h1>

        {notas.length === 0 ? (
          <Card className="rounded-2xl"><CardContent className="py-8 text-center text-muted-foreground">Nenhuma nota disponível ainda.</CardContent></Card>
        ) : (
          <div className="space-y-3">
            {notas.map((n: any) => (
              <Card key={n.id} className="rounded-2xl">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        {n.atividades_pedagogicas?.tipo === 'avaliacao' ? (
                          <BookOpen className="w-4 h-4 text-primary shrink-0" />
                        ) : (
                          <BookOpen className="w-4 h-4 text-blue-500 shrink-0" />
                        )}
                        <p className="font-semibold text-foreground truncate">{n.atividades_pedagogicas?.titulo}</p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(n.atividades_pedagogicas?.data_entrega), 'dd/MM/yyyy')}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-2xl font-bold text-primary">{n.nota ?? '-'}</p>
                    </div>
                  </div>
                  {n.feedback_educador && (
                    <div className="mt-3 p-3 bg-muted/50 rounded-xl">
                      <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1 mb-1">
                        <MessageSquare className="w-3 h-3" /> Feedback
                      </p>
                      <p className="text-sm text-foreground">{n.feedback_educador}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
