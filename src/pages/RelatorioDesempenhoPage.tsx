import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { FileText, Save, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useAdminSchoolSelector, AdminSchoolSelector } from '@/components/admin/AdminSchoolSelector';

interface Modelo { id: string; nome: string; descricao: string | null; }
interface Secao { id: string; titulo: string; descricao: string | null; ordem: number; }
interface Campo { id: string; secao_id: string; titulo: string; tipo: string; opcoes: any; ordem: number; obrigatorio: boolean; }
interface Turma { id: string; nome: string; }
interface Crianca { id: string; nome: string; turma_id: string; }
interface RelatorioAluno { id: string; status: string; }

const PERIODOS = ['1º Bimestre', '2º Bimestre', '3º Bimestre', '4º Bimestre', '1º Semestre', '2º Semestre', 'Anual'];
const ESCALA_OPTIONS = ['Em desenvolvimento', 'Desenvolvido', 'Avançado', 'Não avaliado'];

export default function RelatorioDesempenhoPage() {
  const { user, role } = useAuth();
  const { effectiveCrecheId, selectedCrecheId, setSelectedCrecheId, creches, isAdmin } = useAdminSchoolSelector();
  const [modelos, setModelos] = useState<Modelo[]>([]);
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [criancas, setCriancas] = useState<Crianca[]>([]);
  const [secoes, setSecoes] = useState<Secao[]>([]);
  const [campos, setCampos] = useState<Campo[]>([]);
  const [respostas, setRespostas] = useState<Record<string, string>>({});
  const [relatorioAluno, setRelatorioAluno] = useState<RelatorioAluno | null>(null);

  const [selectedModelo, setSelectedModelo] = useState('');
  const [selectedTurma, setSelectedTurma] = useState('');
  const [selectedCrianca, setSelectedCrianca] = useState('');
  const [selectedPeriodo, setSelectedPeriodo] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const canEdit = role === 'admin' || role === 'educador' || role === 'diretor';

  useEffect(() => {
    if (!effectiveCrecheId) { setLoading(false); return; }
    const fetch = async () => {
      const [modelosRes, turmasRes] = await Promise.all([
        supabase.from('relatorio_modelos').select('id, nome, descricao').eq('creche_id', effectiveCrecheId).eq('ativo', true),
        supabase.from('turmas').select('id, nome').eq('creche_id', effectiveCrecheId).order('nome'),
      ]);
      setModelos((modelosRes.data as Modelo[]) || []);
      setTurmas((turmasRes.data as Turma[]) || []);
      setLoading(false);
    };
    fetch();
  }, [userCreche]);

  useEffect(() => {
    if (!selectedTurma) { setCriancas([]); return; }
    supabase.from('criancas').select('id, nome, turma_id').eq('turma_id', selectedTurma).eq('ativo', true).order('nome')
      .then(({ data }) => setCriancas((data as Crianca[]) || []));
  }, [selectedTurma]);

  // Load model structure
  useEffect(() => {
    if (!selectedModelo) { setSecoes([]); setCampos([]); return; }
    const load = async () => {
      const { data: secoesData } = await supabase.from('relatorio_secoes').select('*').eq('modelo_id', selectedModelo).order('ordem');
      const secoesList = (secoesData as Secao[]) || [];
      setSecoes(secoesList);
      if (secoesList.length > 0) {
        const { data: camposData } = await supabase.from('relatorio_campos').select('*').in('secao_id', secoesList.map(s => s.id)).order('ordem');
        setCampos((camposData as Campo[]) || []);
      }
    };
    load();
  }, [selectedModelo]);

  // Load existing report
  useEffect(() => {
    if (!selectedModelo || !selectedCrianca || !selectedPeriodo) { setRelatorioAluno(null); setRespostas({}); return; }
    const load = async () => {
      const { data: existing } = await supabase.from('relatorio_alunos').select('id, status')
        .eq('modelo_id', selectedModelo).eq('crianca_id', selectedCrianca).eq('periodo_letivo', selectedPeriodo).maybeSingle();
      if (existing) {
        setRelatorioAluno(existing as RelatorioAluno);
        const { data: resps } = await supabase.from('relatorio_respostas').select('campo_id, valor').eq('relatorio_aluno_id', (existing as any).id);
        const map: Record<string, string> = {};
        (resps || []).forEach((r: any) => { map[r.campo_id] = r.valor || ''; });
        setRespostas(map);
      } else {
        setRelatorioAluno(null);
        setRespostas({});
      }
    };
    load();
  }, [selectedModelo, selectedCrianca, selectedPeriodo]);

  const totalCampos = campos.length;
  const preenchidos = Object.values(respostas).filter(v => v.trim()).length;
  const progresso = totalCampos > 0 ? Math.round((preenchidos / totalCampos) * 100) : 0;

  const handleSave = async (finalizar = false) => {
    if (!user || !selectedModelo || !selectedCrianca || !selectedPeriodo || !selectedTurma) return;
    setSaving(true);
    try {
      let relId = relatorioAluno?.id;
      if (!relId) {
        const { data, error } = await supabase.from('relatorio_alunos').insert({
          modelo_id: selectedModelo, crianca_id: selectedCrianca, turma_id: selectedTurma,
          educador_user_id: user.id, periodo_letivo: selectedPeriodo, status: finalizar ? 'finalizado' : 'rascunho',
        }).select('id').single();
        if (error) throw error;
        relId = (data as any).id;
      } else {
        await supabase.from('relatorio_alunos').update({ status: finalizar ? 'finalizado' : 'rascunho' } as any).eq('id', relId);
        await supabase.from('relatorio_respostas').delete().eq('relatorio_aluno_id', relId);
      }

      const rows = Object.entries(respostas).filter(([, v]) => v.trim()).map(([campo_id, valor]) => ({
        relatorio_aluno_id: relId!, campo_id, valor,
      }));
      if (rows.length > 0) {
        const { error } = await supabase.from('relatorio_respostas').insert(rows);
        if (error) throw error;
      }

      toast.success(finalizar ? 'Relatório finalizado!' : 'Rascunho salvo');
      setRelatorioAluno({ id: relId!, status: finalizar ? 'finalizado' : 'rascunho' });
    } catch (e: any) {
      toast.error('Erro ao salvar: ' + e.message);
    }
    setSaving(false);
  };

  const renderCampo = (campo: Campo) => {
    const value = respostas[campo.id] || '';
    const onChange = (v: string) => setRespostas(prev => ({ ...prev, [campo.id]: v }));
    const isFinalized = relatorioAluno?.status === 'finalizado' && !canEdit;

    switch (campo.tipo) {
      case 'texto_longo':
        return <Textarea value={value} onChange={e => onChange(e.target.value)} placeholder="Digite aqui..." className="rounded-xl mt-1 min-h-[100px]" disabled={isFinalized} />;
      case 'texto_curto':
        return <Input value={value} onChange={e => onChange(e.target.value)} placeholder="Digite aqui..." className="rounded-xl mt-1" disabled={isFinalized} />;
      case 'selecao_simples':
        const opcoes = Array.isArray(campo.opcoes) ? campo.opcoes : [];
        return (
          <Select value={value} onValueChange={onChange} disabled={isFinalized}>
            <SelectTrigger className="rounded-xl mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent>{opcoes.map((o: string) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
          </Select>
        );
      case 'escala':
        return (
          <div className="flex flex-wrap gap-2 mt-1">
            {ESCALA_OPTIONS.map(opt => (
              <Button key={opt} variant={value === opt ? 'default' : 'outline'} size="sm" className="rounded-xl" onClick={() => onChange(opt)} disabled={isFinalized}>
                {opt}
              </Button>
            ))}
          </div>
        );
      default:
        return <Input value={value} onChange={e => onChange(e.target.value)} className="rounded-xl mt-1" />;
    }
  };

  if (loading) {
    return <MainLayout><div className="flex items-center justify-center py-20"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div></MainLayout>;
  }

  const allSelected = selectedModelo && selectedTurma && selectedCrianca && selectedPeriodo;

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <FileText className="w-6 h-6 text-primary" />
            Relatório de Desempenho
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Preencha o relatório pedagógico qualitativo do aluno</p>
        </div>

        {/* Filters */}
        <Card className="rounded-2xl border-2 border-border">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">Modelo</Label>
                <Select value={selectedModelo} onValueChange={setSelectedModelo}>
                  <SelectTrigger className="rounded-xl mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{modelos.map(m => <SelectItem key={m.id} value={m.id}>{m.nome}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Turma</Label>
                <Select value={selectedTurma} onValueChange={setSelectedTurma}>
                  <SelectTrigger className="rounded-xl mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{turmas.map(t => <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>)}</SelectContent>
                </Select>
              </div>
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
                  <SelectTrigger className="rounded-xl mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{PERIODOS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {allSelected && secoes.length > 0 ? (
          <>
            {/* Progress */}
            <Card className="rounded-2xl border-2 border-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-foreground">Progresso do preenchimento</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">{preenchidos}/{totalCampos}</span>
                    {relatorioAluno && <Badge variant={relatorioAluno.status === 'finalizado' ? 'default' : 'secondary'} className="rounded-xl">{relatorioAluno.status === 'finalizado' ? 'Finalizado' : 'Rascunho'}</Badge>}
                  </div>
                </div>
                <Progress value={progresso} className="h-2" />
              </CardContent>
            </Card>

            {/* Sections */}
            {secoes.map(secao => {
              const secaoCampos = campos.filter(c => c.secao_id === secao.id);
              return (
                <Card key={secao.id} className="rounded-2xl border-2 border-border">
                  <CardContent className="p-5">
                    <h3 className="font-bold text-foreground text-lg mb-1">{secao.titulo}</h3>
                    {secao.descricao && <p className="text-sm text-muted-foreground mb-4">{secao.descricao}</p>}
                    <div className="space-y-5">
                      {secaoCampos.map(campo => (
                        <div key={campo.id}>
                          <Label className="text-sm font-medium">
                            {campo.titulo}
                            {campo.obrigatorio && <span className="text-destructive ml-1">*</span>}
                          </Label>
                          {renderCampo(campo)}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {/* Actions */}
            {canEdit && (
              <div className="flex justify-end gap-3">
                <Button variant="outline" className="rounded-2xl" onClick={() => handleSave(false)} disabled={saving}>
                  <Save className="w-4 h-4 mr-2" /> Salvar Rascunho
                </Button>
                <Button className="rounded-2xl" onClick={() => handleSave(true)} disabled={saving}>
                  <CheckCircle className="w-4 h-4 mr-2" /> Finalizar
                </Button>
              </div>
            )}
          </>
        ) : allSelected ? (
          <Card className="border-2 border-dashed border-muted-foreground/30 rounded-3xl">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="w-16 h-16 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">Este modelo ainda não possui seções configuradas</p>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-2 border-dashed border-muted-foreground/30 rounded-3xl">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="w-16 h-16 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">Selecione modelo, turma, aluno e período para preencher</p>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
