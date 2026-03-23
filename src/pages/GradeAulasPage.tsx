import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { CalendarClock, Plus, Trash2, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { FAIXA_ETARIA_OPTIONS } from '@/types';

interface Turma { id: string; nome: string; faixa_etaria: string | null; }
interface Materia { id: string; nome: string; }
interface Educador { user_id: string; nome: string; }
interface GradeAula {
  id: string;
  turma_id: string;
  materia_id: string;
  educador_user_id: string;
  dia_semana: number;
  horario_inicio: string;
  horario_fim: string;
}

const DIAS_SEMANA = [
  { value: 1, label: 'Segunda-feira' },
  { value: 2, label: 'Terça-feira' },
  { value: 3, label: 'Quarta-feira' },
  { value: 4, label: 'Quinta-feira' },
  { value: 5, label: 'Sexta-feira' },
];

const FAIXAS_FUNDAMENTAL = FAIXA_ETARIA_OPTIONS.filter(f => f.includes('Ano'));

export default function GradeAulasPage() {
  const { userCreche, role } = useAuth();
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [educadores, setEducadores] = useState<Educador[]>([]);
  const [grade, setGrade] = useState<GradeAula[]>([]);
  const [selectedTurma, setSelectedTurma] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [formDia, setFormDia] = useState<number>(1);
  const [formMateria, setFormMateria] = useState('');
  const [formEducador, setFormEducador] = useState('');
  const [formInicio, setFormInicio] = useState('08:00');
  const [formFim, setFormFim] = useState('09:00');

  const canEdit = role === 'admin' || role === 'diretor';

  useEffect(() => {
    if (!userCreche) return;
    const fetch = async () => {
      const [turmasRes, materiasRes] = await Promise.all([
        supabase.from('turmas').select('id, nome, faixa_etaria').eq('creche_id', userCreche.id).order('nome'),
        supabase.from('materias').select('id, nome').eq('creche_id', userCreche.id).eq('ativo', true).order('nome'),
      ]);

      const turmasElegiveis = (turmasRes.data || []).filter(
        (t: any) => t.faixa_etaria && FAIXAS_FUNDAMENTAL.includes(t.faixa_etaria)
      ) as Turma[];
      setTurmas(turmasElegiveis);
      setMaterias((materiasRes.data as Materia[]) || []);

      // Get educadores from creche
      const { data: membros } = await supabase
        .from('creche_membros')
        .select('user_id')
        .eq('creche_id', userCreche.id);
      
      if (membros && membros.length > 0) {
        const userIds = membros.map(m => m.user_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, nome')
          .in('user_id', userIds);
        
        // Filter to educadores only
        const { data: roles } = await supabase
          .from('user_roles')
          .select('user_id, role')
          .in('user_id', userIds)
          .in('role', ['educador', 'diretor']);
        
        const educadorIds = new Set((roles || []).map(r => r.user_id));
        setEducadores(
          (profiles || [])
            .filter(p => educadorIds.has(p.user_id))
            .map(p => ({ user_id: p.user_id, nome: p.nome }))
        );
      }

      setLoading(false);
    };
    fetch();
  }, [userCreche]);

  const fetchGrade = async () => {
    if (!selectedTurma) { setGrade([]); return; }
    const { data } = await supabase
      .from('grade_aulas')
      .select('*')
      .eq('turma_id', selectedTurma)
      .order('dia_semana')
      .order('horario_inicio');
    setGrade((data as GradeAula[]) || []);
  };

  useEffect(() => { fetchGrade(); }, [selectedTurma]);

  const handleSave = async () => {
    if (!formMateria || !formEducador || !selectedTurma) return;
    const { error } = await supabase.from('grade_aulas').insert({
      turma_id: selectedTurma,
      materia_id: formMateria,
      educador_user_id: formEducador,
      dia_semana: formDia,
      horario_inicio: formInicio,
      horario_fim: formFim,
    });
    if (error) toast.error('Erro ao adicionar aula');
    else { toast.success('Aula adicionada'); setModalOpen(false); fetchGrade(); }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('grade_aulas').delete().eq('id', id);
    if (error) toast.error('Erro ao remover');
    else { toast.success('Aula removida'); fetchGrade(); }
  };

  const getMateriaName = (id: string) => materias.find(m => m.id === id)?.nome || '—';
  const getEducadorName = (id: string) => educadores.find(e => e.user_id === id)?.nome || '—';
  const getDiaLabel = (dia: number) => DIAS_SEMANA.find(d => d.value === dia)?.label || '';

  const gradeByDia = DIAS_SEMANA.map(dia => ({
    ...dia,
    aulas: grade.filter(g => g.dia_semana === dia.value),
  }));

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
            Grade de Aulas
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Calendário semanal de aulas por turma</p>
        </div>

        {/* Turma selector */}
        <Card className="rounded-2xl border-2 border-border">
          <CardContent className="p-4">
            <div className="max-w-sm">
              <Label className="text-xs text-muted-foreground">Turma</Label>
              <Select value={selectedTurma} onValueChange={setSelectedTurma}>
                <SelectTrigger className="rounded-xl mt-1"><SelectValue placeholder="Selecione a turma" /></SelectTrigger>
                <SelectContent>
                  {turmas.map(t => (
                    <SelectItem key={t.id} value={t.id}>{t.nome} {t.faixa_etaria ? `(${t.faixa_etaria})` : ''}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {selectedTurma ? (
          <>
            {canEdit && (
              <div className="flex justify-end">
                <Button className="rounded-2xl" onClick={() => setModalOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" /> Adicionar Aula
                </Button>
              </div>
            )}

            {grade.length === 0 ? (
              <Card className="border-2 border-dashed border-muted-foreground/30 rounded-3xl">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <CalendarClock className="w-16 h-16 text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">Nenhuma aula cadastrada para esta turma</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {gradeByDia.filter(d => d.aulas.length > 0).map((dia) => (
                  <Card key={dia.value} className="rounded-2xl border-2 border-border">
                    <CardContent className="p-4">
                      <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
                        <Badge variant="outline" className="rounded-xl text-sm">{dia.label}</Badge>
                      </h3>
                      <div className="space-y-2">
                        {dia.aulas.map((aula) => (
                          <div key={aula.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/50 border border-border">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-1 text-sm font-mono text-primary">
                                <Clock className="w-4 h-4" />
                                {aula.horario_inicio.slice(0, 5)} — {aula.horario_fim.slice(0, 5)}
                              </div>
                              <div>
                                <p className="font-semibold text-foreground">{getMateriaName(aula.materia_id)}</p>
                                <p className="text-xs text-muted-foreground">Prof. {getEducadorName(aula.educador_user_id)}</p>
                              </div>
                            </div>
                            {canEdit && (
                              <Button variant="ghost" size="icon" className="rounded-xl h-8 w-8 text-destructive" onClick={() => handleDelete(aula.id)}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        ) : (
          <Card className="border-2 border-dashed border-muted-foreground/30 rounded-3xl">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <CalendarClock className="w-16 h-16 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">Selecione uma turma para visualizar a grade</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Add modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Adicionar Aula</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Dia da Semana</Label>
              <Select value={formDia.toString()} onValueChange={(v) => setFormDia(parseInt(v))}>
                <SelectTrigger className="rounded-xl mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DIAS_SEMANA.map(d => (
                    <SelectItem key={d.value} value={d.value.toString()}>{d.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Matéria</Label>
              <Select value={formMateria} onValueChange={setFormMateria}>
                <SelectTrigger className="rounded-xl mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {materias.map(m => (
                    <SelectItem key={m.id} value={m.id}>{m.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Professor(a)</Label>
              <Select value={formEducador} onValueChange={setFormEducador}>
                <SelectTrigger className="rounded-xl mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {educadores.map(e => (
                    <SelectItem key={e.user_id} value={e.user_id}>{e.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Horário Início</Label>
                <Input type="time" value={formInicio} onChange={(e) => setFormInicio(e.target.value)} className="rounded-xl mt-1" />
              </div>
              <div>
                <Label>Horário Fim</Label>
                <Input type="time" value={formFim} onChange={(e) => setFormFim(e.target.value)} className="rounded-xl mt-1" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button className="rounded-xl" onClick={handleSave} disabled={!formMateria || !formEducador}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
