import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Eye, Building2, Users } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { CrecheModal } from '@/components/modals/CrecheModal';
import { CrecheMembrosModal } from '@/components/modals/CrecheMembrosModal';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Creche {
  id: string;
  nome: string;
  endereco: string | null;
  telefone: string | null;
  email: string | null;
  logo_url?: string | null;
  created_at: string;
  membros_count?: number;
}

export default function CrechesPage() {
  const [search, setSearch] = useState('');
  const [creches, setCreches] = useState<Creche[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMembrosModalOpen, setIsMembrosModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCreche, setSelectedCreche] = useState<Creche | null>(null);

  const fetchCreches = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('creches')
      .select('*')
      .order('nome');

    if (error) {
      toast.error('Erro ao carregar escolas');
      console.error(error);
    } else {
      const crechesWithCounts = await Promise.all(
        (data || []).map(async (creche) => {
          const { count } = await supabase
            .from('creche_membros')
            .select('*', { count: 'exact', head: true })
            .eq('creche_id', creche.id);
          return { ...creche, membros_count: count || 0 };
        })
      );
      setCreches(crechesWithCounts);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCreches();
  }, []);

  const filteredCreches = creches.filter(c =>
    c.nome.toLowerCase().includes(search.toLowerCase())
  );

  const handleEdit = (creche: Creche) => {
    setSelectedCreche(creche);
    setIsModalOpen(true);
  };

  const handleMembros = (creche: Creche) => {
    setSelectedCreche(creche);
    setIsMembrosModalOpen(true);
  };

  const handleDelete = (creche: Creche) => {
    setSelectedCreche(creche);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (selectedCreche) {
      const { error } = await supabase.from('creches').delete().eq('id', selectedCreche.id);
      if (error) {
        toast.error('Erro ao excluir escola');
      } else {
        toast.success('Escola excluída com sucesso!');
        fetchCreches();
      }
    }
    setIsDeleteDialogOpen(false);
    setSelectedCreche(null);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedCreche(null);
  };

  const handleModalSave = () => {
    handleModalClose();
    fetchCreches();
  };

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Building2 className="w-6 h-6 text-primary" />
              Escolas
            </h1>
            <p className="text-muted-foreground">Gerencie as unidades cadastradas</p>
          </div>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nova Escola
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar escola..."
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
                <TableHead>Endereço</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Membros</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : filteredCreches.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Nenhuma escola encontrada
                  </TableCell>
                </TableRow>
              ) : (
                filteredCreches.map((creche) => (
                  <TableRow key={creche.id} className="animate-fade-in">
                    <TableCell className="font-medium">{creche.nome}</TableCell>
                    <TableCell>{creche.endereco || '—'}</TableCell>
                    <TableCell>{creche.telefone || '—'}</TableCell>
                    <TableCell>{creche.email || '—'}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{creche.membros_count} membros</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" title="Membros" onClick={() => handleMembros(creche)}>
                          <Users className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" title="Editar" onClick={() => handleEdit(creche)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost" size="icon"
                          className="text-destructive hover:text-destructive"
                          title="Excluir"
                          onClick={() => handleDelete(creche)}
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

      <CrecheModal
        open={isModalOpen}
        onOpenChange={handleModalClose}
        onSave={handleModalSave}
        editData={selectedCreche}
      />

      <CrecheMembrosModal
        open={isMembrosModalOpen}
        onOpenChange={setIsMembrosModalOpen}
        creche={selectedCreche}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover a escola "{selectedCreche?.nome}"? Todos os membros vinculados serão desvinculados. Esta ação não pode ser desfeita.
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