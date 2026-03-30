import { useEffect, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { BookOpen, Clock, CheckCircle, Upload, Image, Send, ArrowLeft, Camera } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function AlunoAtividadesPage() {
  const { user } = useAuth();
  const [crianca, setCrianca] = useState<any>(null);
  const [atividades, setAtividades] = useState<any[]>([]);
  const [entregas, setEntregas] = useState<Map<string, any>>(new Map());
  const [loading, setLoading] = useState(true);
  const [selectedAtividade, setSelectedAtividade] = useState<any>(null);
  const [questoes, setQuestoes] = useState<any[]>([]);
  const [respostas, setRespostas] = useState<Record<string, any>>({});
  const [submitting, setSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'detail' | 'result'>('list');
  const [filter, setFilter] = useState<string>('todas');

  useEffect(() => {
    if (!user) return;
    fetchData();
  }, [user]);

  const fetchData = async () => {
    const { data: c } = await supabase.from('criancas').select('*').eq('user_id', user!.id).maybeSingle();
    if (!c) { setLoading(false); return; }
    setCrianca(c);

    const { data: atvs } = await supabase
      .from('atividades_pedagogicas')
      .select('*, turmas(nome)')
      .eq('turma_id', c.turma_id)
      .order('data_entrega', { ascending: false });

    setAtividades(atvs || []);

    const { data: ents } = await supabase
      .from('atividade_entregas')
      .select('*')
      .eq('aluno_crianca_id', c.id);

    const entMap = new Map();
    (ents || []).forEach((e: any) => entMap.set(e.atividade_id, e));
    setEntregas(entMap);
    setLoading(false);
  };

  const openAtividade = async (atv: any) => {
    setSelectedAtividade(atv);
    const entrega = entregas.get(atv.id);

    const { data: qs } = await supabase
      .from('atividade_questoes')
      .select('*')
      .eq('atividade_id', atv.id)
      .order('ordem');

    const questoesWithOpcoes = await Promise.all(
      (qs || []).map(async (q: any) => {
        if (q.tipo === 'multipla_escolha') {
          const { data: ops } = await supabase
            .from('atividade_opcoes')
            .select('*')
            .eq('questao_id', q.id)
            .order('ordem');
          return { ...q, opcoes: ops || [] };
        }
        return { ...q, opcoes: [] };
      })
    );
    setQuestoes(questoesWithOpcoes);

    // Load existing responses if entrega exists
    if (entrega) {
      const { data: resps } = await supabase
        .from('atividade_respostas')
        .select('*')
        .eq('entrega_id', entrega.id);

      const resMap: Record<string, any> = {};
      (resps || []).forEach((r: any) => {
        resMap[r.questao_id] = r;
      });
      setRespostas(resMap);

      if (entrega.status === 'avaliada' || entrega.status === 'entregue') {
        setViewMode('result');
      } else {
        setViewMode('detail');
      }
    } else {
      setRespostas({});
      setViewMode('detail');
    }
  };

  const handleRespostaChange = (questaoId: string, field: string, value: any) => {
    setRespostas(prev => ({
      ...prev,
      [questaoId]: { ...prev[questaoId], [field]: value },
    }));
  };

  const handleUploadFoto = async (questaoId: string, file: File) => {
    const ext = file.name.split('.').pop();
    const path = `respostas/${crianca.id}/${questaoId}_${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('atividades-arquivos').upload(path, file);
    if (error) { toast.error('Erro ao enviar foto'); return; }
    const { data: urlData } = supabase.storage.from('atividades-arquivos').getPublicUrl(path);
    handleRespostaChange(questaoId, 'foto_url', urlData.publicUrl);
    toast.success('Foto enviada!');
  };

  const handleSubmit = async () => {
    if (!selectedAtividade || !crianca) return;
    setSubmitting(true);

    try {
      // Create or get entrega
      let entregaId: string;
      const existing = entregas.get(selectedAtividade.id);

      if (existing) {
        entregaId = existing.id;
        await supabase.from('atividade_entregas').update({ status: 'entregue' }).eq('id', entregaId);
      } else {
        const { data: newEntrega, error } = await supabase
          .from('atividade_entregas')
          .insert({ atividade_id: selectedAtividade.id, aluno_crianca_id: crianca.id, status: 'entregue' })
          .select()
          .single();
        if (error) throw error;
        entregaId = newEntrega.id;
      }

      // Delete old responses and insert new ones
      await supabase.from('atividade_respostas').delete().eq('entrega_id', entregaId);

      const respostasToInsert = questoes.map(q => ({
        entrega_id: entregaId,
        questao_id: q.id,
        resposta_texto: respostas[q.id]?.resposta_texto || null,
        opcao_selecionada_id: respostas[q.id]?.opcao_selecionada_id || null,
        foto_url: respostas[q.id]?.foto_url || null,
      }));

      await supabase.from('atividade_respostas').insert(respostasToInsert);

      toast.success('Atividade enviada com sucesso!');
      setViewMode('list');
      setSelectedAtividade(null);
      fetchData();
    } catch (err: any) {
      toast.error('Erro ao enviar: ' + err.message);
    }
    setSubmitting(false);
  };

  const filteredAtividades = atividades.filter(a => {
    if (filter === 'todas') return true;
    const entrega = entregas.get(a.id);
    if (filter === 'pendente') return !entrega;
    if (filter === 'entregue') return entrega?.status === 'entregue';
    if (filter === 'avaliada') return entrega?.status === 'avaliada';
    return true;
  });

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

  // Detail / Response view
  if (viewMode !== 'list' && selectedAtividade) {
    const entrega = entregas.get(selectedAtividade.id);
    const isReadOnly = viewMode === 'result';

    return (
      <MainLayout>
        <div className="space-y-4 max-w-2xl">
          <Button variant="ghost" onClick={() => { setViewMode('list'); setSelectedAtividade(null); }} className="gap-2">
            <ArrowLeft className="w-4 h-4" /> Voltar
          </Button>

          <div>
            <h1 className="text-xl font-bold text-foreground">{selectedAtividade.titulo}</h1>
            <p className="text-sm text-muted-foreground mt-1">{selectedAtividade.descricao}</p>
            {selectedAtividade.instrucoes && (
              <p className="text-sm text-muted-foreground mt-2 italic">📋 {selectedAtividade.instrucoes}</p>
            )}
            <p className="text-xs text-muted-foreground mt-2">
              Entrega até: {format(new Date(selectedAtividade.data_entrega), 'dd/MM/yyyy')}
            </p>
          </div>

          {isReadOnly && entrega && (
            <Card className="rounded-2xl border-primary/30">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-foreground">Resultado</p>
                    {entrega.nota != null && <p className="text-2xl font-bold text-primary">{entrega.nota}</p>}
                  </div>
                  {statusBadge(selectedAtividade.id)}
                </div>
                {entrega.feedback_educador && (
                  <div className="mt-3 p-3 bg-muted rounded-xl">
                    <p className="text-xs font-semibold text-muted-foreground mb-1">Feedback do Educador</p>
                    <p className="text-sm text-foreground">{entrega.feedback_educador}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <div className="space-y-4">
            {questoes.map((q, idx) => (
              <Card key={q.id} className="rounded-2xl">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start gap-2">
                    <span className="text-sm font-bold text-primary">{idx + 1}.</span>
                    <div className="flex-1">
                      <p className="font-semibold text-foreground">{q.titulo}</p>
                      {q.descricao && <p className="text-sm text-muted-foreground">{q.descricao}</p>}
                    </div>
                    {q.pontuacao > 0 && (
                      <Badge variant="outline" className="text-xs">{q.pontuacao} pts</Badge>
                    )}
                  </div>

                  {q.imagem_url && (
                    <img src={q.imagem_url} alt="Questão" className="rounded-xl max-h-48 object-contain" />
                  )}

                  {q.tipo === 'texto' && (
                    <Textarea
                      placeholder="Sua resposta..."
                      value={respostas[q.id]?.resposta_texto || ''}
                      onChange={e => handleRespostaChange(q.id, 'resposta_texto', e.target.value)}
                      disabled={isReadOnly}
                      className="rounded-xl"
                    />
                  )}

                  {q.tipo === 'multipla_escolha' && (
                    <RadioGroup
                      value={respostas[q.id]?.opcao_selecionada_id || ''}
                      onValueChange={v => handleRespostaChange(q.id, 'opcao_selecionada_id', v)}
                      disabled={isReadOnly}
                    >
                      {q.opcoes?.map((op: any) => {
                        const isSelected = respostas[q.id]?.opcao_selecionada_id === op.id;
                        const showCorrect = isReadOnly && entrega?.status === 'avaliada';
                        return (
                          <div key={op.id} className={`flex items-center gap-3 p-3 rounded-xl border ${showCorrect && op.is_correta ? 'border-green-500 bg-green-50' : showCorrect && isSelected && !op.is_correta ? 'border-red-500 bg-red-50' : 'border-border'}`}>
                            <RadioGroupItem value={op.id} id={op.id} />
                            <Label htmlFor={op.id} className="cursor-pointer flex-1">{op.texto}</Label>
                            {showCorrect && op.is_correta && <CheckCircle className="w-4 h-4 text-green-500" />}
                          </div>
                        );
                      })}
                    </RadioGroup>
                  )}

                  {q.tipo === 'upload_foto' && (
                    <div className="space-y-2">
                      {respostas[q.id]?.foto_url && (
                        <img src={respostas[q.id].foto_url} alt="Resposta" className="rounded-xl max-h-48 object-contain border" />
                      )}
                      {!isReadOnly && (
                        <div>
                          <Label htmlFor={`foto-${q.id}`} className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-xl hover:bg-primary/20 transition text-sm font-semibold">
                            <Camera className="w-4 h-4" />
                            {respostas[q.id]?.foto_url ? 'Trocar foto' : 'Enviar foto'}
                          </Label>
                          <input
                            id={`foto-${q.id}`}
                            type="file"
                            accept="image/jpeg,image/png,image/heic"
                            className="hidden"
                            onChange={e => { if (e.target.files?.[0]) handleUploadFoto(q.id, e.target.files[0]); }}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {!isReadOnly && questoes.length > 0 && (
            <Button onClick={handleSubmit} disabled={submitting} className="w-full rounded-2xl gap-2" size="lg">
              <Send className="w-4 h-4" />
              {submitting ? 'Enviando...' : 'Enviar Atividade'}
            </Button>
          )}
        </div>
      </MainLayout>
    );
  }

  // List view
  return (
    <MainLayout>
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-primary" />
          Minhas Atividades
        </h1>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {['todas', 'pendente', 'entregue', 'avaliada'].map(f => (
            <Button key={f} variant={filter === f ? 'default' : 'outline'} size="sm" className="rounded-full capitalize" onClick={() => setFilter(f)}>
              {f === 'todas' ? 'Todas' : f === 'pendente' ? 'Pendentes' : f === 'entregue' ? 'Entregues' : 'Avaliadas'}
            </Button>
          ))}
        </div>

        {filteredAtividades.length === 0 ? (
          <Card className="rounded-2xl"><CardContent className="py-8 text-center text-muted-foreground">Nenhuma atividade encontrada</CardContent></Card>
        ) : (
          <div className="space-y-3">
            {filteredAtividades.map(atv => (
              <Card key={atv.id} className="rounded-2xl cursor-pointer hover:shadow-md transition" onClick={() => openAtividade(atv)}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-foreground truncate">{atv.titulo}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {atv.tipo === 'avaliacao' ? '📝 Avaliação' : '📚 Atividade'} • Entrega: {format(new Date(atv.data_entrega), 'dd/MM/yyyy')}
                      </p>
                    </div>
                    {statusBadge(atv.id)}
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
