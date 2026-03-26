import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Plus, Pencil, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useAdminSchoolSelector, AdminSchoolSelector } from '@/components/admin/AdminSchoolSelector';
import { FAIXA_ETARIA_OPTIONS } from '@/types';

interface Turma { id: string; nome: string; faixa_etaria: string | null; }
interface Crianca { id: string; nome: string; turma_id: string; }
interface Materia { id: string; nome: string; }
interface Boletim {
  id: string; crianca_id: string; turma_id: string; materia_id: string;
  educador_user_id: string; periodo_letivo: string; avaliacao: number | null;
  observacoes: string | null; data_registro: string;
}

const FAIXAS_FUNDAMENTAL = FAIXA_ETARIA_OPTIONS.filter(f => f.includes('Ano'));

import { getPeriodos, PERIODOS_MAP } from '@/lib/periodos';

export default function BoletimPage() {
  const { user, role } = useAuth();
  const { effectiveCrecheId, selectedCrecheId, setSelectedCrecheId, creches, isAdmin, selectedCreche } = useAdminSchoolSelector();
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [criancas, setCriancas] = useState<Crianca[]>([]);
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [boletins, setBoletins] = useState<Boletim[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTurma, setSelectedTurma] = useState('');
  const [selectedCrianca, setSelectedCrianca] = useState('');
  const [selectedPeriodo, setSelectedPeriodo] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Boletim | null>(null);
  const [formMateria, setFormMateria] = useState('');
  const [formAvaliacao, setFormAvaliacao] = useState('');
  const [formObservacoes, setFormObservacoes] = useState('');
  const [formPeriodo, setFormPeriodo] = useState('');

  const isReadOnly = role === 'responsavel';

  // Get periods from school config
  const [tipoPeriodo, setTipoPeriodo] = useState('bimestral');
  useEffect(() => {
    if (!effectiveCrecheId) return;
    if (isAdmin && selectedCreche) {
      setTipoPeriodo((selectedCreche as any).tipo_periodo || 'bimestral');
    } else {
      supabase.from('creches').select('tipo_periodo').eq('id', effectiveCrecheId).single()
        .then(({ data }) => setTipoPeriodo((data as any)?.tipo_periodo || 'bimestral'));
    }
  }, [effectiveCrecheId, isAdmin, selectedCreche]);

  const PERIODOS = PERIODOS_MAP[tipoPeriodo] || PERIODOS_MAP.bimestral;

  const fetchData = async () => {
    if (!effectiveCrecheId && role !== 'responsavel') { setLoading(false); return; }

    let turmasQuery = supabase.from('turmas').select('id, nome, faixa_etaria');
    if (effectiveCrecheId) turmasQuery = turmasQuery.eq('creche_id', effectiveCrecheId);

    if (role === 'educador' && user) {
      const { data: assignments } = await supabase.from('turma_educadores').select('turma_id').eq('educador_user_id', user.id);
      const ids = assignments?.map(a => a.turma_id) || [];
      if (ids.length > 0) turmasQuery = turmasQuery.in('id', ids);
      else { setLoading(false); return; }
    }

    const { data: turmasData } = await turmasQuery;
    const turmasElegiveis = (turmasData || []).filter(
      (t: any) => t.faixa_etaria && FAIXAS_FUNDAMENTAL.includes(t.faixa_etaria)
    ) as Turma[];
    setTurmas(turmasElegiveis);

    if (effectiveCrecheId) {
      const { data: materiasData } = await supabase.from('materias').select('id, nome').eq('creche_id', effectiveCrecheId).eq('ativo', true).order('nome');
      setMaterias((materiasData as Materia[]) || []);
    }
    setLoading(false);
  };

  const fetchCriancas = async () => {
    if (!selectedTurma) { setCriancas([]); return; }
    const { data } = await supabase.from('criancas').select('id, nome, turma_id').eq('turma_id', selectedTurma).eq('ativo', true).order('nome');
    setCriancas((data as Crianca[]) || []);
  };

  const fetchBoletins = async () => {
    if (!selectedCrianca) { setBoletins([]); return; }
    let query = supabase.from('boletins').select('*').eq('crianca_id', selectedCrianca);
    if (selectedPeriodo && selectedPeriodo !== 'all') query = query.eq('periodo_letivo', selectedPeriodo);
    const { data } = await query.order('periodo_letivo');
    setBoletins((data as Boletim[]) || []);
  };

  useEffect(() => { setSelectedTurma(''); setSelectedCrianca(''); fetchData(); }, [effectiveCrecheId, user, role]);
  useEffect(() => { fetchCriancas(); }, [selectedTurma]);
  useEffect(() => { fetchBoletins(); }, [selectedCrianca, selectedPeriodo]);

  const getMateriaName = (id: string) => materias.find(m => m.id === id)?.nome || '—';

  const handleSave = async () => {
    if (!formMateria || !selectedCrianca || !selectedTurma || !user) return;
    const avaliacao = formAvaliacao ? parseFloat(formAvaliacao) : null;
    if (editing) {
      const { error } = await supabase.from('boletins').update({ avaliacao, observacoes: formObservacoes || null, materia_id: formMateria, periodo_letivo: formPeriodo }).eq('id', editing.id);
      if (error) toast.error('Erro ao atualizar boletim'); else toast.success('Boletim atualizado');
    } else {
      const { error } = await supabase.from('boletins').insert({ crianca_id: selectedCrianca, turma_id: selectedTurma, materia_id: formMateria, educador_user_id: user.id, periodo_letivo: formPeriodo, avaliacao, observacoes: formObservacoes || null });
      if (error) toast.error('Erro ao criar boletim'); else toast.success('Boletim registrado');
    }
    setModalOpen(false); resetForm(); fetchBoletins();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('boletins').delete().eq('id', id);
    if (error) toast.error('Erro ao excluir'); else { toast.success('Registro excluído'); fetchBoletins(); }
  };

  const openEdit = (b: Boletim) => { setEditing(b); setFormMateria(b.materia_id); setFormAvaliacao(b.avaliacao?.toString() || ''); setFormObservacoes(b.observacoes || ''); setFormPeriodo(b.periodo_letivo); setModalOpen(true); };
  const openNew = () => { resetForm(); setFormPeriodo(PERIODOS[0] || ''); setModalOpen(true); };
  const resetForm = () => { setEditing(null); setFormMateria(''); setFormAvaliacao(''); setFormObservacoes(''); setFormPeriodo(PERIODOS[0] || ''); };

  if (loading && !isAdmin) {
    return <MainLayout><div className="flex items-center justify-center py-20"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div></MainLayout>;
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-primary" /> Boletim Escolar
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{isReadOnly ? 'Visualize as notas do seu filho(a)' : 'Registre e acompanhe as notas dos alunos'}</p>
        </div>

        {isAdmin && <AdminSchoolSelector selectedCrecheId={selectedCrecheId} setSelectedCrecheId={setSelectedCrecheId} creches={creches} />}

        {!effectiveCrecheId ? (
          <Card className="border-2 border-dashed border-muted-foreground/30 rounded-3xl">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BookOpen className="w-16 h-16 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">Selecione uma escola para visualizar boletins</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card className="rounded-2xl border-2 border-border">
              <CardContent className="p-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Turma</Label>
                    <Select value={selectedTurma} onValueChange={(v) => { setSelectedTurma(v); setSelectedCrianca(''); }}>
                      <SelectTrigger className="rounded-xl mt-1"><SelectValue placeholder="Selecione a turma" /></SelectTrigger>
                      <SelectContent>{turmas.map(t => <SelectItem key={t.id} value={t.id}>{t.nome} {t.faixa_etaria ? `(${t.faixa_etaria})` : ''}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Aluno</Label>
                    <Select value={selectedCrianca} onValueChange={setSelectedCrianca} disabled={!selectedTurma}>
                      <SelectTrigger className="rounded-xl mt-1"><SelectValue placeholder="Selecione o aluno" /></SelectTrigger>
                      <SelectContent>{criancas.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Período</Label>
                    <Select value={selectedPeriodo} onValueChange={setSelectedPeriodo}>
                      <SelectTrigger className="rounded-xl mt-1"><SelectValue placeholder="Todos os períodos" /></SelectTrigger>
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
              <>
                {!isReadOnly && (
                  <div className="flex justify-end">
                    <Button className="rounded-2xl" onClick={openNew}><Plus className="w-4 h-4 mr-2" /> Adicionar Nota</Button>
                  </div>
                )}
                {boletins.length === 0 ? (
                  <Card className="border-2 border-dashed border-muted-foreground/30 rounded-3xl">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <BookOpen className="w-16 h-16 text-muted-foreground/50 mb-4" />
                      <p className="text-muted-foreground">Nenhuma nota registrada</p>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="rounded-2xl border-2 border-border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Matéria</TableHead><TableHead>Período</TableHead><TableHead className="text-center">Nota</TableHead><TableHead>Observações</TableHead>
                          {!isReadOnly && <TableHead className="w-20">Ações</TableHead>}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {boletins.map((b) => (
                          <TableRow key={b.id}>
                            <TableCell className="font-medium">{getMateriaName(b.materia_id)}</TableCell>
                            <TableCell><Badge variant="outline" className="rounded-xl">{b.periodo_letivo}</Badge></TableCell>
                            <TableCell className="text-center">
                              <span className={`font-bold text-lg ${(b.avaliacao ?? 0) >= 7 ? 'text-emerald-600' : (b.avaliacao ?? 0) >= 5 ? 'text-yellow-500' : 'text-destructive'}`}>
                                {b.avaliacao !== null ? b.avaliacao.toFixed(1) : '—'}
                              </span>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{b.observacoes || '—'}</TableCell>
                            {!isReadOnly && (
                              <TableCell>
                                <div className="flex gap-1">
                                  <Button variant="ghost" size="icon" className="rounded-xl h-8 w-8" onClick={() => openEdit(b)}><Pencil className="w-3.5 h-3.5" /></Button>
                                  <Button variant="ghost" size="icon" className="rounded-xl h-8 w-8 text-destructive" onClick={() => handleDelete(b.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                                </div>
                              </TableCell>
                            )}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Card>
                )}
              </>
            ) : (
              <Card className="border-2 border-dashed border-muted-foreground/30 rounded-3xl">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <BookOpen className="w-16 h-16 text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">Selecione uma turma e um aluno para visualizar o boletim</p>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader><DialogTitle>{editing ? 'Editar Nota' : 'Adicionar Nota'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Matéria</Label>
              <Select value={formMateria} onValueChange={setFormMateria}>
                <SelectTrigger className="rounded-xl mt-1"><SelectValue placeholder="Selecione a matéria" /></SelectTrigger>
                <SelectContent>{materias.map(m => <SelectItem key={m.id} value={m.id}>{m.nome}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Período Letivo</Label>
              <Select value={formPeriodo} onValueChange={setFormPeriodo}>
                <SelectTrigger className="rounded-xl mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{PERIODOS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Nota (0 a 10)</Label>
              <Input type="number" min="0" max="10" step="0.1" value={formAvaliacao} onChange={(e) => setFormAvaliacao(e.target.value)} placeholder="Ex: 8.5" className="rounded-xl mt-1" />
            </div>
            <div>
              <Label>Observações</Label>
              <Textarea value={formObservacoes} onChange={(e) => setFormObservacoes(e.target.value)} placeholder="Observações sobre o desempenho" className="rounded-xl mt-1" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button className="rounded-xl" onClick={handleSave} disabled={!formMateria}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
