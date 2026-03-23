import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { FileText, Plus, Trash2, GripVertical, Edit, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useAdminSchoolSelector, AdminSchoolSelector } from '@/components/admin/AdminSchoolSelector';

interface Modelo { id: string; nome: string; descricao: string | null; ativo: boolean; creche_id: string; }
interface Secao { id: string; modelo_id: string; titulo: string; descricao: string | null; ordem: number; }
interface Campo { id: string; secao_id: string; titulo: string; tipo: string; opcoes: any; ordem: number; obrigatorio: boolean; }

const TIPOS_CAMPO = [
  { value: 'texto_longo', label: 'Texto Longo' },
  { value: 'texto_curto', label: 'Texto Curto' },
  { value: 'selecao_simples', label: 'Seleção Simples' },
  { value: 'escala', label: 'Escala de Desenvolvimento' },
];

const ESCALA_OPTIONS = ['Em desenvolvimento', 'Desenvolvido', 'Avançado', 'Não avaliado'];

export default function RelatorioModeloPage() {
  const { userCreche, role } = useAuth();
  const [modelos, setModelos] = useState<Modelo[]>([]);
  const [selectedModelo, setSelectedModelo] = useState<Modelo | null>(null);
  const [secoes, setSecoes] = useState<Secao[]>([]);
  const [campos, setCampos] = useState<Campo[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [modeloModal, setModeloModal] = useState(false);
  const [secaoModal, setSecaoModal] = useState(false);
  const [campoModal, setCampoModal] = useState(false);
  const [editingSecao, setEditingSecao] = useState<Secao | null>(null);

  // Form states
  const [formModeloNome, setFormModeloNome] = useState('');
  const [formModeloDesc, setFormModeloDesc] = useState('');
  const [formSecaoTitulo, setFormSecaoTitulo] = useState('');
  const [formSecaoDesc, setFormSecaoDesc] = useState('');
  const [formCampoTitulo, setFormCampoTitulo] = useState('');
  const [formCampoTipo, setFormCampoTipo] = useState('texto_longo');
  const [formCampoOpcoes, setFormCampoOpcoes] = useState('');
  const [formCampoObrigatorio, setFormCampoObrigatorio] = useState(false);
  const [targetSecaoId, setTargetSecaoId] = useState('');

  const crecheId = userCreche?.id;

  const fetchModelos = async () => {
    if (!crecheId) return;
    const { data } = await supabase.from('relatorio_modelos').select('*').eq('creche_id', crecheId).order('created_at', { ascending: false });
    setModelos((data as any[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchModelos(); }, [crecheId]);

  const fetchModeloDetails = async (modelo: Modelo) => {
    setSelectedModelo(modelo);
    const { data: secoesData } = await supabase.from('relatorio_secoes').select('*').eq('modelo_id', modelo.id).order('ordem');
    const secoesList = (secoesData as Secao[]) || [];
    setSecoes(secoesList);

    if (secoesList.length > 0) {
      const secaoIds = secoesList.map(s => s.id);
      const { data: camposData } = await supabase.from('relatorio_campos').select('*').in('secao_id', secaoIds).order('ordem');
      setCampos((camposData as Campo[]) || []);
    } else {
      setCampos([]);
    }
  };

  const handleCreateModelo = async () => {
    if (!formModeloNome || !crecheId) return;
    const { error } = await supabase.from('relatorio_modelos').insert({ nome: formModeloNome, descricao: formModeloDesc || null, creche_id: crecheId });
    if (error) toast.error('Erro ao criar modelo');
    else { toast.success('Modelo criado'); setModeloModal(false); setFormModeloNome(''); setFormModeloDesc(''); fetchModelos(); }
  };

  const handleDeleteModelo = async (id: string) => {
    const { error } = await supabase.from('relatorio_modelos').delete().eq('id', id);
    if (error) toast.error('Erro ao excluir');
    else { toast.success('Modelo excluído'); if (selectedModelo?.id === id) { setSelectedModelo(null); setSecoes([]); setCampos([]); } fetchModelos(); }
  };

  const handleCreateSecao = async () => {
    if (!formSecaoTitulo || !selectedModelo) return;
    const ordem = secoes.length;
    const { error } = await supabase.from('relatorio_secoes').insert({ modelo_id: selectedModelo.id, titulo: formSecaoTitulo, descricao: formSecaoDesc || null, ordem });
    if (error) toast.error('Erro ao criar seção');
    else { toast.success('Seção criada'); setSecaoModal(false); setFormSecaoTitulo(''); setFormSecaoDesc(''); fetchModeloDetails(selectedModelo); }
  };

  const handleDeleteSecao = async (id: string) => {
    const { error } = await supabase.from('relatorio_secoes').delete().eq('id', id);
    if (error) toast.error('Erro ao excluir');
    else { toast.success('Seção excluída'); if (selectedModelo) fetchModeloDetails(selectedModelo); }
  };

  const handleMoveSecao = async (secao: Secao, direction: 'up' | 'down') => {
    const idx = secoes.findIndex(s => s.id === secao.id);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= secoes.length) return;
    await Promise.all([
      supabase.from('relatorio_secoes').update({ ordem: secoes[swapIdx].ordem } as any).eq('id', secao.id),
      supabase.from('relatorio_secoes').update({ ordem: secao.ordem } as any).eq('id', secoes[swapIdx].id),
    ]);
    if (selectedModelo) fetchModeloDetails(selectedModelo);
  };

  const handleCreateCampo = async () => {
    if (!formCampoTitulo || !targetSecaoId) return;
    const camposDaSecao = campos.filter(c => c.secao_id === targetSecaoId);
    let opcoes = null;
    if ((formCampoTipo === 'selecao_simples' || formCampoTipo === 'escala') && formCampoOpcoes) {
      opcoes = formCampoOpcoes.split(',').map(o => o.trim()).filter(Boolean);
    }
    const { error } = await supabase.from('relatorio_campos').insert({
      secao_id: targetSecaoId, titulo: formCampoTitulo, tipo: formCampoTipo, opcoes, ordem: camposDaSecao.length, obrigatorio: formCampoObrigatorio,
    });
    if (error) toast.error('Erro ao criar campo');
    else { toast.success('Campo criado'); setCampoModal(false); setFormCampoTitulo(''); setFormCampoTipo('texto_longo'); setFormCampoOpcoes(''); setFormCampoObrigatorio(false); if (selectedModelo) fetchModeloDetails(selectedModelo); }
  };

  const handleDeleteCampo = async (id: string) => {
    const { error } = await supabase.from('relatorio_campos').delete().eq('id', id);
    if (error) toast.error('Erro ao excluir');
    else { toast.success('Campo excluído'); if (selectedModelo) fetchModeloDetails(selectedModelo); }
  };

  if (loading) {
    return <MainLayout><div className="flex items-center justify-center py-20"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div></MainLayout>;
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <FileText className="w-6 h-6 text-primary" />
            Modelo de Relatório Pedagógico
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Crie e personalize os modelos de relatório da escola</p>
        </div>

        {!selectedModelo ? (
          <>
            <div className="flex justify-end">
              <Button className="rounded-2xl" onClick={() => setModeloModal(true)}>
                <Plus className="w-4 h-4 mr-2" /> Novo Modelo
              </Button>
            </div>

            {modelos.length === 0 ? (
              <Card className="border-2 border-dashed border-muted-foreground/30 rounded-3xl">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FileText className="w-16 h-16 text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">Nenhum modelo criado</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {modelos.map(m => (
                  <Card key={m.id} className="rounded-2xl border-2 border-border hover:border-primary/50 transition-colors cursor-pointer" onClick={() => fetchModeloDetails(m)}>
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-bold text-foreground">{m.nome}</h3>
                          {m.descricao && <p className="text-sm text-muted-foreground mt-1">{m.descricao}</p>}
                          <Badge variant={m.ativo ? 'default' : 'secondary'} className="rounded-xl mt-2">
                            {m.ativo ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </div>
                        <Button variant="ghost" size="icon" className="text-destructive rounded-xl" onClick={(e) => { e.stopPropagation(); handleDeleteModelo(m.id); }}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            <div className="flex items-center gap-3">
              <Button variant="outline" className="rounded-xl" onClick={() => { setSelectedModelo(null); setSecoes([]); setCampos([]); }}>← Voltar</Button>
              <h2 className="text-lg font-bold text-foreground">{selectedModelo.nome}</h2>
            </div>

            <div className="flex justify-end">
              <Button className="rounded-2xl" onClick={() => setSecaoModal(true)}>
                <Plus className="w-4 h-4 mr-2" /> Nova Seção
              </Button>
            </div>

            {secoes.length === 0 ? (
              <Card className="border-2 border-dashed border-muted-foreground/30 rounded-3xl">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FileText className="w-16 h-16 text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">Nenhuma seção criada. Adicione seções ao modelo.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {secoes.map((secao, idx) => {
                  const secaoCampos = campos.filter(c => c.secao_id === secao.id);
                  return (
                    <Card key={secao.id} className="rounded-2xl border-2 border-border">
                      <CardContent className="p-5">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <GripVertical className="w-4 h-4 text-muted-foreground" />
                            <h3 className="font-bold text-foreground">{secao.titulo}</h3>
                            {secao.descricao && <span className="text-xs text-muted-foreground">— {secao.descricao}</span>}
                          </div>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" className="rounded-xl h-8 w-8" disabled={idx === 0} onClick={() => handleMoveSecao(secao, 'up')}>
                              <ChevronUp className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="rounded-xl h-8 w-8" disabled={idx === secoes.length - 1} onClick={() => handleMoveSecao(secao, 'down')}>
                              <ChevronDown className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="rounded-xl h-8 w-8 text-primary" onClick={() => { setTargetSecaoId(secao.id); setCampoModal(true); }}>
                              <Plus className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="rounded-xl h-8 w-8 text-destructive" onClick={() => handleDeleteSecao(secao.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        {secaoCampos.length > 0 ? (
                          <div className="space-y-2 ml-6">
                            {secaoCampos.map(campo => (
                              <div key={campo.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/50 border border-border">
                                <div>
                                  <p className="font-medium text-foreground text-sm">{campo.titulo}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="outline" className="rounded-lg text-xs">{TIPOS_CAMPO.find(t => t.value === campo.tipo)?.label || campo.tipo}</Badge>
                                    {campo.obrigatorio && <Badge className="rounded-lg text-xs bg-destructive/10 text-destructive border-destructive/20">Obrigatório</Badge>}
                                  </div>
                                </div>
                                <Button variant="ghost" size="icon" className="rounded-xl h-7 w-7 text-destructive" onClick={() => handleDeleteCampo(campo.id)}>
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground ml-6">Nenhum campo. Clique em + para adicionar.</p>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* Modelo Modal */}
      <Dialog open={modeloModal} onOpenChange={setModeloModal}>
        <DialogContent className="rounded-2xl">
          <DialogHeader><DialogTitle>Novo Modelo de Relatório</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Nome</Label><Input value={formModeloNome} onChange={e => setFormModeloNome(e.target.value)} placeholder="Ex: Relatório Semestral" className="rounded-xl mt-1" /></div>
            <div><Label>Descrição</Label><Textarea value={formModeloDesc} onChange={e => setFormModeloDesc(e.target.value)} placeholder="Descrição opcional" className="rounded-xl mt-1" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setModeloModal(false)}>Cancelar</Button>
            <Button className="rounded-xl" onClick={handleCreateModelo} disabled={!formModeloNome}>Criar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Seção Modal */}
      <Dialog open={secaoModal} onOpenChange={setSecaoModal}>
        <DialogContent className="rounded-2xl">
          <DialogHeader><DialogTitle>Nova Seção</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Título</Label><Input value={formSecaoTitulo} onChange={e => setFormSecaoTitulo(e.target.value)} placeholder="Ex: Desenvolvimento Cognitivo" className="rounded-xl mt-1" /></div>
            <div><Label>Descrição</Label><Textarea value={formSecaoDesc} onChange={e => setFormSecaoDesc(e.target.value)} placeholder="Descrição opcional" className="rounded-xl mt-1" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setSecaoModal(false)}>Cancelar</Button>
            <Button className="rounded-xl" onClick={handleCreateSecao} disabled={!formSecaoTitulo}>Criar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Campo Modal */}
      <Dialog open={campoModal} onOpenChange={setCampoModal}>
        <DialogContent className="rounded-2xl">
          <DialogHeader><DialogTitle>Novo Campo</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Título do Campo</Label><Input value={formCampoTitulo} onChange={e => setFormCampoTitulo(e.target.value)} placeholder="Ex: Observações sobre leitura" className="rounded-xl mt-1" /></div>
            <div>
              <Label>Tipo de Campo</Label>
              <Select value={formCampoTipo} onValueChange={(v) => {
                setFormCampoTipo(v);
                if (v === 'escala' && !formCampoOpcoes) setFormCampoOpcoes(ESCALA_OPTIONS.join(', '));
                if (v !== 'escala' && v !== 'selecao_simples') setFormCampoOpcoes('');
              }}>
                <SelectTrigger className="rounded-xl mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIPOS_CAMPO.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {formCampoTipo === 'selecao_simples' && (
              <div><Label>Opções (separadas por vírgula)</Label><Input value={formCampoOpcoes} onChange={e => setFormCampoOpcoes(e.target.value)} placeholder="Opção 1, Opção 2, Opção 3" className="rounded-xl mt-1" /></div>
            )}
            {formCampoTipo === 'escala' && (
              <div><Label>Opções da escala (separadas por vírgula)</Label><Input value={formCampoOpcoes} onChange={e => setFormCampoOpcoes(e.target.value)} placeholder="Em desenvolvimento, Desenvolvido, Avançado, Não avaliado" className="rounded-xl mt-1" /></div>
            )}
            <div className="flex items-center gap-3">
              <Switch checked={formCampoObrigatorio} onCheckedChange={setFormCampoObrigatorio} />
              <Label>Campo obrigatório</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setCampoModal(false)}>Cancelar</Button>
            <Button className="rounded-xl" onClick={handleCreateCampo} disabled={!formCampoTitulo}>Criar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
