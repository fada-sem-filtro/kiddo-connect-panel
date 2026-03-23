import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Users, Link2 } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { CriancaDbModal } from '@/components/modals/CriancaDbModal';
import { CriancaResponsaveisModal } from '@/components/modals/CriancaResponsaveisModal';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useAdminSchoolSelector, AdminSchoolSelector } from '@/components/admin/AdminSchoolSelector';

interface CriancaRow {
  id: string;
  nome: string;
  data_nascimento: string;
  turma_id: string;
  observacoes: string | null;
  turma_nome?: string;
  ativo: boolean;
  responsaveis?: { nome: string; parentesco: string }[];
}

export default function CriancasDbPage() {
  const { role, userCreche } = useAuth();
  const { effectiveCrecheId, selectedCrecheId, setSelectedCrecheId, creches, isAdmin } = useAdminSchoolSelector();
  const isDiretor = role === 'diretor';
  const [criancas, setCriancas] = useState<CriancaRow[]>([]);
  const [turmas, setTurmas] = useState<{ id: string; nome: string; creche_id: string }[]>([]);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<CriancaRow | null>(null);
  const [respModalCrianca, setRespModalCrianca] = useState<CriancaRow | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCriancas = async () => {
    setLoading(true);

    // Get turmas for the effective school
    let turmaQuery = supabase.from('turmas').select('id, nome, creche_id').order('nome');
    if (effectiveCrecheId) {
      turmaQuery = turmaQuery.eq('creche_id', effectiveCrecheId);
    }
    const { data: turmaData } = await turmaQuery;
    setTurmas(turmaData || []);

    const turmaIds = (turmaData || []).map(t => t.id);
    if (turmaIds.length === 0) {
      setCriancas([]);
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from('criancas')
      .select('*, turmas(nome)')
      .in('turma_id', turmaIds)
      .order('nome');

    if (data) {
      const criancaIds = data.map(c => c.id);
      const { data: resps } = await supabase
        .from('crianca_responsaveis')
        .select('crianca_id, parentesco, responsavel_user_id, profiles:responsavel_user_id(nome)')
        .in('crianca_id', criancaIds.length > 0 ? criancaIds : ['__none__']);

      const criancasWithData = data.map(c => ({
        ...c,
        turma_nome: (c.turmas as any)?.nome || 'Sem turma',
        ativo: (c as any).ativo ?? true,
        responsaveis: resps
          ?.filter(r => r.crianca_id === c.id)
          .map(r => ({
            nome: (r.profiles as any)?.nome || 'Desconhecido',
            parentesco: r.parentesco,
          })) || [],
      }));

      setCriancas(criancasWithData);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isAdmin && !effectiveCrecheId) {
      setCriancas([]);
      setTurmas([]);
      setLoading(false);
      return;
    }
    fetchCriancas();
  }, [effectiveCrecheId]);

  const filtered = criancas.filter(c =>
    c.nome.toLowerCase().includes(search.toLowerCase())
  );

  const handleEdit = (crianca: CriancaRow) => {
    setSelected(crianca);
    setIsModalOpen(true);
  };

  const handleDelete = (crianca: CriancaRow) => {
    setSelected(crianca);
    setIsDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!selected) return;
    const { error } = await supabase.from('criancas').delete().eq('id', selected.id);
    if (error) {
      toast.error('Erro ao excluir aluno');
    } else {
      toast.success('Aluno removido!');
      fetchCriancas();
    }
    setIsDeleteOpen(false);
    setSelected(null);
  };

  const handleToggleAtivo = async (crianca: CriancaRow) => {
    const newAtivo = !crianca.ativo;
    const { error } = await supabase
      .from('criancas')
      .update({ ativo: newAtivo } as any)
      .eq('id', crianca.id);

    if (error) {
      toast.error('Erro ao alterar status do aluno');
      return;
    }

    toast.success(`${crianca.nome} foi ${newAtivo ? 'habilitado' : 'desabilitado'}.`);
    setCriancas(prev => prev.map(c => c.id === crianca.id ? { ...c, ativo: newAtivo } : c));
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelected(null);
  };

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Users className="w-6 h-6 text-primary" />
              Alunos
            </h1>
            <p className="text-muted-foreground">Gerencie o cadastro dos alunos</p>
          </div>
          {effectiveCrecheId && (
            <Button onClick={() => setIsModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Aluno
            </Button>
          )}
        </div>

        {isAdmin && (
          <AdminSchoolSelector
            selectedCrecheId={selectedCrecheId}
            setSelectedCrecheId={setSelectedCrecheId}
            creches={creches}
          />
        )}

        {!effectiveCrecheId && isAdmin ? (
          <div className="text-center py-12 text-muted-foreground">
            <Users className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p>Selecione uma escola para visualizar os alunos</p>
          </div>
        ) : (
          <>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar aluno..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Data de Nascimento</TableHead>
                    <TableHead>Turma</TableHead>
                    <TableHead>Responsáveis</TableHead>
                    {(isDiretor || isAdmin) && <TableHead>Status</TableHead>}
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={(isDiretor || isAdmin) ? 6 : 5} className="text-center py-8 text-muted-foreground">
                        Carregando...
                      </TableCell>
                    </TableRow>
                  ) : filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={(isDiretor || isAdmin) ? 6 : 5} className="text-center py-8 text-muted-foreground">
                        Nenhum aluno encontrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((crianca) => (
                      <TableRow key={crianca.id} className={!crianca.ativo ? 'opacity-50' : ''}>
                        <TableCell className="font-medium">{crianca.nome}</TableCell>
                        <TableCell>
                          {format(new Date(crianca.data_nascimento + 'T00:00:00'), 'dd/MM/yyyy')}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{crianca.turma_nome}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {crianca.responsaveis?.slice(0, 2).map((resp, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {resp.nome} ({resp.parentesco})
                              </Badge>
                            ))}
                            {(crianca.responsaveis?.length || 0) > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{(crianca.responsaveis?.length || 0) - 2}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        {(isDiretor || isAdmin) && (
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={crianca.ativo}
                                onCheckedChange={() => handleToggleAtivo(crianca)}
                              />
                              <span className="text-xs text-muted-foreground">
                                {crianca.ativo ? 'Ativo' : 'Inativo'}
                              </span>
                            </div>
                          </TableCell>
                        )}
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" title="Responsáveis" onClick={() => setRespModalCrianca(crianca)}>
                              <Link2 className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(crianca)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleDelete(crianca)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </div>

      <CriancaDbModal
        open={isModalOpen}
        onOpenChange={handleModalClose}
        editData={selected}
        turmas={turmas}
        onSaved={fetchCriancas}
      />

      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover {selected?.nome}? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <CriancaResponsaveisModal
        open={!!respModalCrianca}
        onOpenChange={(open) => !open && setRespModalCrianca(null)}
        criancaId={respModalCrianca?.id || null}
        criancaNome={respModalCrianca?.nome || ''}
        onChanged={fetchCriancas}
      />
    </MainLayout>
  );
}
