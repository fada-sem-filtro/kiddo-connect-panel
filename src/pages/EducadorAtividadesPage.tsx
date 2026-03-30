import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { BookOpen, Plus, Pencil, Trash2, Eye, CheckCircle, Image, Upload, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface QuestaoForm {
  id?: string;
  titulo: string;
  descricao: string;
  tipo: string;
  imagem_url: string;
  pontuacao: number;
  opcoes: { id?: string; texto: string; is_correta: boolean }[];
}

export default function EducadorAtividadesPage() {
  const { user } = useAuth();
  const [turmas, setTurmas] = useState<any[]>([]);
  const [atividades, setAtividades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTurma, setFilterTurma] = useState<string>('todas');
  const [filterTipo, setFilterTipo] = useState<string>('todos');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [turmaId, setTurmaId] = useState('');
  const [dataEntrega, setDataEntrega] = useState('');
  const [tipo, setTipo] = useState('atividade');
  const [instrucoes, setInstrucoes] = useState('');
  const [questoes, setQuestoes] = useState<QuestaoForm[]>([]);
  const [saving, setSaving] = useState(false);

  // Correção state
  const [showCorrecao, setShowCorrecao] = useState(false);
  const [correcaoAtividade, setCorrecaoAtividade] = useState<any>(null);
  const [entregas, setEntregas] = useState<any[]>([]);
  const [selectedEntrega, setSelectedEntrega] = useState<any>(null);
  const [respostasEntrega, setRespostasEntrega] = useState<any[]>([]);
  const [questoesAtv, setQuestoesAtv] = useState<any[]>([]);
  const [notaInput, setNotaInput] = useState('');
  const [feedbackInput, setFeedbackInput] = useState('');

  useEffect(() => {
    if (!user) return;
    fetchData();
  }, [user]);

  const fetchData = async () => {
    const { data: te } = await supabase
      .from('turma_educadores')
      .select('turma_id, turmas(id, nome)')
      .eq('educador_user_id', user!.id);

    const t = (te || []).map((r: any) => r.turmas).filter(Boolean);
    setTurmas(t);

    const turmaIds = t.map((tt: any) => tt.id);
    if (turmaIds.length === 0) { setLoading(false); return; }

    const { data: atvs } = await supabase
      .from('atividades_pedagogicas')
      .select('*, turmas(nome)')
      .in('turma_id', turmaIds)
      .order('data_entrega', { ascending: false });

    setAtividades(atvs || []);
    setLoading(false);
  };

  const resetForm = () => {
    setTitulo('');
    setDescricao('');
    setTurmaId('');
    setDataEntrega('');
    setTipo('atividade');
    setInstrucoes('');
    setQuestoes([]);
    setEditingId(null);
  };

  const openCreate = () => { resetForm(); setShowForm(true); };

  const openEdit = async (atv: any) => {
    setEditingId(atv.id);
    setTitulo(atv.titulo);
    setDescricao(atv.descricao || '');
    setTurmaId(atv.turma_id);
    setDataEntrega(atv.data_entrega);
    setTipo(atv.tipo);
    setInstrucoes(atv.instrucoes || '');

    const { data: qs } = await supabase.from('atividade_questoes').select('*').eq('atividade_id', atv.id).order('ordem');
    const questoesLoaded = await Promise.all(
      (qs || []).map(async (q: any) => {
        const { data: ops } = await supabase.from('atividade_opcoes').select('*').eq('questao_id', q.id).order('ordem');
        return {
          id: q.id,
          titulo: q.titulo,
          descricao: q.descricao || '',
          tipo: q.tipo,
          imagem_url: q.imagem_url || '',
          pontuacao: q.pontuacao || 0,
          opcoes: (ops || []).map((o: any) => ({ id: o.id, texto: o.texto, is_correta: o.is_correta })),
        };
      })
    );
    setQuestoes(questoesLoaded);
    setShowForm(true);
  };

  const addQuestao = () => {
    setQuestoes([...questoes, { titulo: '', descricao: '', tipo: 'texto', imagem_url: '', pontuacao: 0, opcoes: [] }]);
  };

  const updateQuestao = (idx: number, field: string, value: any) => {
    const updated = [...questoes];
    (updated[idx] as any)[field] = value;
    if (field === 'tipo' && value === 'multipla_escolha' && updated[idx].opcoes.length === 0) {
      updated[idx].opcoes = [{ texto: '', is_correta: false }, { texto: '', is_correta: false }];
    }
    setQuestoes(updated);
  };

  const addOpcao = (qIdx: number) => {
    const updated = [...questoes];
    updated[qIdx].opcoes.push({ texto: '', is_correta: false });
    setQuestoes(updated);
  };

  const updateOpcao = (qIdx: number, oIdx: number, field: string, value: any) => {
    const updated = [...questoes];
    if (field === 'is_correta' && value === true) {
      updated[qIdx].opcoes.forEach((o, i) => { o.is_correta = i === oIdx; });
    } else {
      (updated[qIdx].opcoes[oIdx] as any)[field] = value;
    }
    setQuestoes(updated);
  };

  const removeOpcao = (qIdx: number, oIdx: number) => {
    const updated = [...questoes];
    updated[qIdx].opcoes.splice(oIdx, 1);
    setQuestoes(updated);
  };

  const removeQuestao = (idx: number) => {
    setQuestoes(questoes.filter((_, i) => i !== idx));
  };

  const handleUploadImagem = async (qIdx: number, file: File) => {
    const ext = file.name.split('.').pop();
    const path = `questoes/${Date.now()}_${qIdx}.${ext}`;
    const { error } = await supabase.storage.from('atividades-arquivos').upload(path, file);
    if (error) { toast.error('Erro ao enviar imagem'); return; }
    const { data } = supabase.storage.from('atividades-arquivos').getPublicUrl(path);
    updateQuestao(qIdx, 'imagem_url', data.publicUrl);
  };

  const handleSave = async () => {
    if (!titulo || !turmaId || !dataEntrega) { toast.error('Preencha os campos obrigatórios'); return; }
    setSaving(true);

    try {
      let atividadeId: string;

      if (editingId) {
        await supabase.from('atividades_pedagogicas').update({
          titulo, descricao, turma_id: turmaId, data_entrega: dataEntrega, tipo, instrucoes,
        }).eq('id', editingId);
        atividadeId = editingId;

        // Delete old questoes (cascade deletes opcoes)
        await supabase.from('atividade_questoes').delete().eq('atividade_id', editingId);
      } else {
        const { data, error } = await supabase.from('atividades_pedagogicas').insert({
          titulo, descricao, turma_id: turmaId, educador_user_id: user!.id, data_entrega: dataEntrega, tipo, instrucoes,
        }).select().single();
        if (error) throw error;
        atividadeId = data.id;
      }

      // Insert questoes
      for (let i = 0; i < questoes.length; i++) {
        const q = questoes[i];
        const { data: questaoData, error: qError } = await supabase.from('atividade_questoes').insert({
          atividade_id: atividadeId, titulo: q.titulo, descricao: q.descricao || null, tipo: q.tipo,
          imagem_url: q.imagem_url || null, ordem: i, pontuacao: q.pontuacao,
        }).select().single();
        if (qError) throw qError;

        if (q.tipo === 'multipla_escolha' && q.opcoes.length > 0) {
          const opcoes = q.opcoes.map((o, oIdx) => ({
            questao_id: questaoData.id, texto: o.texto, is_correta: o.is_correta, ordem: oIdx,
          }));
          await supabase.from('atividade_opcoes').insert(opcoes);
        }
      }

      toast.success(editingId ? 'Atividade atualizada!' : 'Atividade criada!');
      setShowForm(false);
      resetForm();
      fetchData();
    } catch (err: any) {
      toast.error('Erro: ' + err.message);
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    const { data: entregasExistentes } = await supabase.from('atividade_entregas').select('id').eq('atividade_id', id).limit(1);
    // Deletion is handled via cascade
    const { error } = await supabase.from('atividades_pedagogicas').delete().eq('id', id);
    if (error) { toast.error('Erro ao excluir'); return; }
    toast.success('Atividade excluída');
    fetchData();
  };

  const openCorrecao = async (atv: any) => {
    setCorrecaoAtividade(atv);

    const { data: ents } = await supabase
      .from('atividade_entregas')
      .select('*, criancas(nome)')
      .eq('atividade_id', atv.id)
      .order('created_at');

    setEntregas(ents || []);

    const { data: qs } = await supabase.from('atividade_questoes').select('*').eq('atividade_id', atv.id).order('ordem');
    const qsWithOps = await Promise.all(
      (qs || []).map(async (q: any) => {
        if (q.tipo === 'multipla_escolha') {
          const { data: ops } = await supabase.from('atividade_opcoes').select('*').eq('questao_id', q.id).order('ordem');
          return { ...q, opcoes: ops || [] };
        }
        return { ...q, opcoes: [] };
      })
    );
    setQuestoesAtv(qsWithOps);
    setSelectedEntrega(null);
    setShowCorrecao(true);
  };

  const viewEntrega = async (entrega: any) => {
    setSelectedEntrega(entrega);
    setNotaInput(entrega.nota?.toString() || '');
    setFeedbackInput(entrega.feedback_educador || '');

    const { data: resps } = await supabase.from('atividade_respostas').select('*').eq('entrega_id', entrega.id);
    setRespostasEntrega(resps || []);
  };

  const saveCorrecao = async () => {
    if (!selectedEntrega) return;
    const { error } = await supabase.from('atividade_entregas').update({
      nota: notaInput ? parseFloat(notaInput) : null,
      feedback_educador: feedbackInput || null,
      status: 'avaliada',
    }).eq('id', selectedEntrega.id);

    if (error) { toast.error('Erro ao salvar correção'); return; }
    toast.success('Correção salva!');

    // Refresh entregas
    const { data: ents } = await supabase
      .from('atividade_entregas')
      .select('*, criancas(nome)')
      .eq('atividade_id', correcaoAtividade.id)
      .order('created_at');
    setEntregas(ents || []);
    setSelectedEntrega(null);
  };

  const filteredAtividades = atividades.filter(a => {
    if (filterTurma !== 'todas' && a.turma_id !== filterTurma) return false;
    if (filterTipo !== 'todos' && a.tipo !== filterTipo) return false;
    return true;
  });

  if (loading) {
    return <MainLayout><div className="flex items-center justify-center py-20"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div></MainLayout>;
  }

  return (
    <MainLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-primary" />
            Atividades Pedagógicas
          </h1>
          <Button onClick={openCreate} className="rounded-2xl gap-2">
            <Plus className="w-4 h-4" /> Nova Atividade
          </Button>
        </div>

        <div className="flex gap-2 flex-wrap">
          <Select value={filterTurma} onValueChange={setFilterTurma}>
            <SelectTrigger className="w-40 rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas as turmas</SelectItem>
              {turmas.map(t => <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterTipo} onValueChange={setFilterTipo}>
            <SelectTrigger className="w-36 rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="atividade">Atividades</SelectItem>
              <SelectItem value="avaliacao">Avaliações</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {filteredAtividades.length === 0 ? (
          <Card className="rounded-2xl"><CardContent className="py-8 text-center text-muted-foreground">Nenhuma atividade encontrada</CardContent></Card>
        ) : (
          <div className="space-y-3">
            {filteredAtividades.map(atv => (
              <Card key={atv.id} className="rounded-2xl">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-foreground truncate">{atv.titulo}</p>
                        <Badge variant="outline" className="text-xs capitalize shrink-0">{atv.tipo}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {(atv as any).turmas?.nome} • Entrega: {format(new Date(atv.data_entrega), 'dd/MM/yyyy')}
                      </p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button size="sm" variant="outline" className="rounded-xl h-8 w-8 p-0" onClick={() => openCorrecao(atv)} title="Correções">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline" className="rounded-xl h-8 w-8 p-0" onClick={() => openEdit(atv)} title="Editar">
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="outline" className="rounded-xl h-8 w-8 p-0 text-destructive" title="Excluir">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir atividade?</AlertDialogTitle>
                            <AlertDialogDescription>Todas as entregas e respostas dos alunos serão removidas permanentemente.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(atv.id)}>Excluir</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={(v) => { if (!v) { setShowForm(false); resetForm(); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar Atividade' : 'Nova Atividade'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label>Título *</Label>
                <Input value={titulo} onChange={e => setTitulo(e.target.value)} className="rounded-xl" />
              </div>
              <div>
                <Label>Tipo *</Label>
                <Select value={tipo} onValueChange={setTipo}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="atividade">Atividade</SelectItem>
                    <SelectItem value="avaliacao">Avaliação</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Turma *</Label>
                <Select value={turmaId} onValueChange={setTurmaId}>
                  <SelectTrigger className="rounded-xl"><SelectValue placeholder="Selecionar" /></SelectTrigger>
                  <SelectContent>
                    {turmas.map(t => <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Data de Entrega *</Label>
                <Input type="date" value={dataEntrega} onChange={e => setDataEntrega(e.target.value)} className="rounded-xl" />
              </div>
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea value={descricao} onChange={e => setDescricao(e.target.value)} className="rounded-xl" />
            </div>
            <div>
              <Label>Instruções adicionais</Label>
              <Textarea value={instrucoes} onChange={e => setInstrucoes(e.target.value)} className="rounded-xl" rows={2} />
            </div>

            {/* Questões */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-bold">Questões</Label>
                <Button type="button" variant="outline" size="sm" onClick={addQuestao} className="rounded-xl gap-1">
                  <Plus className="w-3 h-3" /> Adicionar
                </Button>
              </div>

              {questoes.map((q, qIdx) => (
                <Card key={qIdx} className="rounded-xl border-2">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-primary">Questão {qIdx + 1}</span>
                      <Button type="button" variant="ghost" size="sm" className="text-destructive h-7 w-7 p-0" onClick={() => removeQuestao(qIdx)}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    <Input placeholder="Título da questão" value={q.titulo} onChange={e => updateQuestao(qIdx, 'titulo', e.target.value)} className="rounded-xl" />
                    <Textarea placeholder="Descrição (opcional)" value={q.descricao} onChange={e => updateQuestao(qIdx, 'descricao', e.target.value)} className="rounded-xl" rows={2} />
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">Tipo</Label>
                        <Select value={q.tipo} onValueChange={v => updateQuestao(qIdx, 'tipo', v)}>
                          <SelectTrigger className="rounded-xl h-9"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="texto">Texto</SelectItem>
                            <SelectItem value="multipla_escolha">Múltipla Escolha</SelectItem>
                            <SelectItem value="upload_foto">Upload de Foto</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">Pontuação</Label>
                        <Input type="number" value={q.pontuacao} onChange={e => updateQuestao(qIdx, 'pontuacao', parseFloat(e.target.value) || 0)} className="rounded-xl h-9" />
                      </div>
                    </div>

                    {/* Image upload */}
                    <div>
                      {q.imagem_url && <img src={q.imagem_url} alt="" className="rounded-lg max-h-32 object-contain mb-2" />}
                      <Label htmlFor={`img-${qIdx}`} className="cursor-pointer inline-flex items-center gap-1 text-xs text-primary hover:underline">
                        <Image className="w-3 h-3" /> {q.imagem_url ? 'Trocar imagem' : 'Adicionar imagem'}
                      </Label>
                      <input id={`img-${qIdx}`} type="file" accept="image/*" className="hidden" onChange={e => { if (e.target.files?.[0]) handleUploadImagem(qIdx, e.target.files[0]); }} />
                    </div>

                    {/* Multiple choice options */}
                    {q.tipo === 'multipla_escolha' && (
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold">Opções</Label>
                        {q.opcoes.map((op, oIdx) => (
                          <div key={oIdx} className="flex items-center gap-2">
                            <input
                              type="radio"
                              name={`correta-${qIdx}`}
                              checked={op.is_correta}
                              onChange={() => updateOpcao(qIdx, oIdx, 'is_correta', true)}
                              title="Marcar como correta"
                            />
                            <Input
                              placeholder={`Opção ${oIdx + 1}`}
                              value={op.texto}
                              onChange={e => updateOpcao(qIdx, oIdx, 'texto', e.target.value)}
                              className="rounded-xl h-8 flex-1"
                            />
                            {op.is_correta && <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />}
                            <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => removeOpcao(qIdx, oIdx)}>
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                        <Button type="button" variant="ghost" size="sm" onClick={() => addOpcao(qIdx)} className="text-xs gap-1">
                          <Plus className="w-3 h-3" /> Opção
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowForm(false); resetForm(); }}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Correção Dialog */}
      <Dialog open={showCorrecao} onOpenChange={setShowCorrecao}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Correção — {correcaoAtividade?.titulo}</DialogTitle>
            <DialogDescription>Visualize e avalie as entregas dos alunos</DialogDescription>
          </DialogHeader>

          {!selectedEntrega ? (
            <div className="space-y-2">
              {entregas.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">Nenhuma entrega ainda.</p>
              ) : (
                entregas.map(e => (
                  <div key={e.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-xl cursor-pointer hover:bg-muted transition" onClick={() => viewEntrega(e)}>
                    <div>
                      <p className="font-semibold text-sm">{(e as any).criancas?.nome}</p>
                      <p className="text-xs text-muted-foreground">{format(new Date(e.created_at), 'dd/MM/yyyy HH:mm')}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {e.nota != null && <span className="font-bold text-primary">{e.nota}</span>}
                      <Badge className={e.status === 'avaliada' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}>
                        {e.status === 'avaliada' ? 'Avaliada' : 'Entregue'}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <Button variant="ghost" size="sm" onClick={() => setSelectedEntrega(null)} className="gap-1">← Voltar</Button>
              <p className="font-semibold">{(selectedEntrega as any).criancas?.nome}</p>

              {questoesAtv.map((q: any, idx: number) => {
                const resp = respostasEntrega.find((r: any) => r.questao_id === q.id);
                return (
                  <Card key={q.id} className="rounded-xl">
                    <CardContent className="p-3 space-y-2">
                      <p className="text-sm font-semibold">{idx + 1}. {q.titulo}</p>
                      {q.tipo === 'texto' && (
                        <div className="p-2 bg-muted rounded-lg text-sm">{resp?.resposta_texto || <span className="text-muted-foreground italic">Sem resposta</span>}</div>
                      )}
                      {q.tipo === 'multipla_escolha' && (
                        <div className="space-y-1">
                          {q.opcoes.map((op: any) => {
                            const selected = resp?.opcao_selecionada_id === op.id;
                            return (
                              <div key={op.id} className={`p-2 rounded-lg text-sm border ${selected && op.is_correta ? 'border-green-500 bg-green-50' : selected && !op.is_correta ? 'border-red-500 bg-red-50' : op.is_correta ? 'border-green-300 bg-green-50/50' : 'border-border'}`}>
                                {op.texto} {selected && '✓'} {op.is_correta && '★'}
                              </div>
                            );
                          })}
                        </div>
                      )}
                      {q.tipo === 'upload_foto' && resp?.foto_url && (
                        <img src={resp.foto_url} alt="Resposta" className="rounded-lg max-h-48 object-contain" />
                      )}
                    </CardContent>
                  </Card>
                );
              })}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Nota</Label>
                  <Input type="number" value={notaInput} onChange={e => setNotaInput(e.target.value)} className="rounded-xl" />
                </div>
              </div>
              <div>
                <Label>Feedback</Label>
                <Textarea value={feedbackInput} onChange={e => setFeedbackInput(e.target.value)} className="rounded-xl" />
              </div>
              <Button onClick={saveCorrecao} className="w-full rounded-xl">Salvar Correção</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
