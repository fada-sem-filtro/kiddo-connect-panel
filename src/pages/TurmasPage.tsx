import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Users, GraduationCap, Link2 } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { TurmaModal } from '@/components/modals/TurmaModal';
import { TurmaEducadoresModal } from '@/components/modals/TurmaEducadoresModal';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface TurmaRow {
  id: string;
  nome: string;
  descricao: string | null;
  creche_id: string;
  creches?: { nome: string } | null;
  criancas_count?: number;
  educadores_count?: number;
}

export default function TurmasPage() {
  const { role, userCreche } = useAuth();
  const [turmas, setTurmas] = useState<TurmaRow[]>([]);
  const [creches, setCreches] = useState<{ id: string; nome: string }[]>([]);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<TurmaRow | null>(null);
  const [eduModalTurma, setEduModalTurma] = useState<TurmaRow | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchTurmas = async () => {
    setLoading(true);
    let query = supabase
      .from('turmas')
      .select('*, creches(nome)')
      .order('nome');

    // Directors only see their creche turmas (RLS handles this too)
    if (role !== 'admin' && userCreche) {
      query = query.eq('creche_id', userCreche.id);
    }

    const { data } = await query;

    if (data) {
      // Get counts
      const turmaIds = data.map(t => t.id);
      
      const [{ data: criancasCounts }, { data: educadoresCounts }] = await Promise.all([
        supabase.from('criancas').select('turma_id').in('turma_id', turmaIds),
        supabase.from('turma_educadores').select('turma_id').in('turma_id', turmaIds),
      ]);

      const turmasWithCounts = data.map(t => ({
        ...t,
        criancas_count: criancasCounts?.filter(c => c.turma_id === t.id).length || 0,
        educadores_count: educadoresCounts?.filter(e => e.turma_id === t.id).length || 0,
      }));

      setTurmas(turmasWithCounts);
    }
    setLoading(false);
  };

  const fetchCreches = async () => {
    const { data } = await supabase.from('creches').select('id, nome').order('nome');
    if (data) setCreches(data);
  };

  useEffect(() => {
    fetchTurmas();
    fetchCreches();
  }, []);

  const filtered = turmas.filter(t =>
    t.nome.toLowerCase().includes(search.toLowerCase())
  );

  const handleEdit = (turma: TurmaRow) => {
    setSelected(turma);
    setIsModalOpen(true);
  };

  const handleDelete = (turma: TurmaRow) => {
    setSelected(turma);
    setIsDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!selected) return;
    const { error } = await supabase.from('turmas').delete().eq('id', selected.id);
    if (error) {
      toast.error('Erro ao excluir turma');
    } else {
      toast.success('Turma excluída!');
      fetchTurmas();
    }
    setIsDeleteOpen(false);
    setSelected(null);
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
              <GraduationCap className="w-6 h-6 text-primary" />
              Turmas
            </h1>
            <p className="text-muted-foreground">Gerencie as turmas da creche</p>
          </div>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nova Turma
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar turma..."
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
                <TableHead>Descrição</TableHead>
                {role === 'admin' && <TableHead>Creche</TableHead>}
                <TableHead>Crianças</TableHead>
                <TableHead>Educadores</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={role === 'admin' ? 6 : 5} className="text-center py-8 text-muted-foreground">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={role === 'admin' ? 6 : 5} className="text-center py-8 text-muted-foreground">
                    Nenhuma turma encontrada
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((turma) => (
                  <TableRow key={turma.id}>
                    <TableCell className="font-medium">{turma.nome}</TableCell>
                    <TableCell className="text-muted-foreground">{turma.descricao || '—'}</TableCell>
                    {role === 'admin' && (
                      <TableCell>
                        <Badge variant="outline">{(turma.creches as any)?.nome || '—'}</Badge>
                      </TableCell>
                    )}
                    <TableCell>
                      <Badge variant="secondary" className="gap-1">
                        <Users className="w-3 h-3" />
                        {turma.criancas_count}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="gap-1">
                        <GraduationCap className="w-3 h-3" />
                        {turma.educadores_count}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" title="Educadores" onClick={() => setEduModalTurma(turma)}>
                          <Link2 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(turma)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDelete(turma)}
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
      </div>

      <TurmaModal
        open={isModalOpen}
        onOpenChange={handleModalClose}
        editData={selected}
        creches={creches}
        defaultCrecheId={userCreche?.id}
        onSaved={fetchTurmas}
      />

      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a turma "{selected?.nome}"? Todas as crianças vinculadas serão desvinculadas.
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
    </MainLayout>
  );
}
