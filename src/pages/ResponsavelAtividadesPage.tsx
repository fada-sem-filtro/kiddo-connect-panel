import { useEffect, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BookOpen, Eye, Trophy, MessageSquare } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';

export default function ResponsavelAtividadesPage() {
  const { user } = useAuth();
  const [criancas, setCriancas] = useState<any[]>([]);
  const [selectedCrianca, setSelectedCrianca] = useState<string>('');
  const [atividades, setAtividades] = useState<any[]>([]);
  const [entregas, setEntregas] = useState<Map<string, any>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data: links } = await supabase
        .from('crianca_responsaveis')
        .select('crianca_id, criancas(id, nome, turma_id, turmas(nome))')
        .eq('responsavel_user_id', user.id);

      const cs = (links || []).map((l: any) => l.criancas).filter(Boolean);
      setCriancas(cs);
      if (cs.length > 0) {
        setSelectedCrianca(cs[0].id);
      }
      setLoading(false);
    };
    fetch();
  }, [user]);

  useEffect(() => {
    if (!selectedCrianca) return;
    const fetch = async () => {
      const crianca = criancas.find(c => c.id === selectedCrianca);
      if (!crianca) return;

      const { data: atvs } = await supabase
        .from('atividades_pedagogicas')
        .select('*, turmas(nome)')
        .eq('turma_id', crianca.turma_id)
        .order('data_entrega', { ascending: false });

      setAtividades(atvs || []);

      const { data: ents } = await supabase
        .from('atividade_entregas')
        .select('*')
        .eq('aluno_crianca_id', selectedCrianca);

      const entMap = new Map();
      (ents || []).forEach((e: any) => entMap.set(e.atividade_id, e));
      setEntregas(entMap);
    };
    fetch();
  }, [selectedCrianca, criancas]);

  const statusBadge = (atvId: string) => {
    const e = entregas.get(atvId);
    if (!e) return <Badge className="bg-yellow-100 text-yellow-800">Pendente</Badge>;
    if (e.status === 'entregue') return <Badge className="bg-blue-100 text-blue-800">Entregue</Badge>;
    if (e.status === 'avaliada') return <Badge className="bg-green-100 text-green-800">Avaliada</Badge>;
    return <Badge className="bg-red-100 text-red-800">Revisão</Badge>;
  };

  if (loading) {
    return <MainLayout><div className="flex items-center justify-center py-20"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div></MainLayout>;
  }

  return (
    <MainLayout>
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-primary" />
          Atividades do Aluno
        </h1>

        {criancas.length > 1 && (
          <Select value={selectedCrianca} onValueChange={setSelectedCrianca}>
            <SelectTrigger className="w-60 rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent>
              {criancas.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
            </SelectContent>
          </Select>
        )}

        {atividades.length === 0 ? (
          <Card className="rounded-2xl"><CardContent className="py-8 text-center text-muted-foreground">Nenhuma atividade encontrada</CardContent></Card>
        ) : (
          <div className="space-y-3">
            {atividades.map(atv => {
              const entrega = entregas.get(atv.id);
              return (
                <Card key={atv.id} className="rounded-2xl">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-foreground truncate">{atv.titulo}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {atv.tipo === 'avaliacao' ? '📝 Avaliação' : '📚 Atividade'} • {format(new Date(atv.data_entrega), 'dd/MM/yyyy')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {entrega?.nota != null && <span className="text-lg font-bold text-primary">{entrega.nota}</span>}
                        {statusBadge(atv.id)}
                      </div>
                    </div>
                    {entrega?.feedback_educador && (
                      <div className="mt-3 p-3 bg-muted/50 rounded-xl">
                        <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1 mb-1">
                          <MessageSquare className="w-3 h-3" /> Feedback
                        </p>
                        <p className="text-sm text-foreground">{entrega.feedback_educador}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
