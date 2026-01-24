import { useState } from 'react';
import { Plus, Search, Edit, Trash2, Eye, GraduationCap } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { EducadorModal } from '@/components/modals/EducadorModal';
import { EducadorViewModal } from '@/components/modals/EducadorViewModal';
import { useData } from '@/contexts/DataContext';
import { Educador } from '@/types';
import { toast } from 'sonner';

export default function EducadoresPage() {
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedEducador, setSelectedEducador] = useState<Educador | null>(null);
  
  const { educadores, turmas, deleteEducador } = useData();

  const filteredEducadores = educadores.filter(educador => 
    educador.nome.toLowerCase().includes(search.toLowerCase())
  );

  const getTurmaName = (turmaId: string) => {
    return turmas.find(t => t.id === turmaId)?.nome || 'Sem turma';
  };

  const handleEdit = (educador: Educador) => {
    setSelectedEducador(educador);
    setIsModalOpen(true);
  };

  const handleView = (educador: Educador) => {
    setSelectedEducador(educador);
    setIsViewModalOpen(true);
  };

  const handleDelete = (educador: Educador) => {
    setSelectedEducador(educador);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedEducador) {
      deleteEducador(selectedEducador.id);
      toast.success('Educador removido com sucesso!');
    }
    setIsDeleteDialogOpen(false);
    setSelectedEducador(null);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedEducador(null);
  };

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <GraduationCap className="w-6 h-6 text-primary" />
              Educadores
            </h1>
            <p className="text-muted-foreground">Gerencie a equipe de educadores</p>
          </div>
          
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Educador
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar educador..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Table */}
        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Turma</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEducadores.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Nenhum educador encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filteredEducadores.map((educador) => (
                  <TableRow key={educador.id} className="animate-fade-in">
                    <TableCell className="font-medium">{educador.nome}</TableCell>
                    <TableCell>{educador.email}</TableCell>
                    <TableCell>{educador.telefone}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{getTurmaName(educador.turmaId)}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleView(educador)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(educador)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDelete(educador)}
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

      <EducadorModal 
        open={isModalOpen} 
        onOpenChange={handleModalClose}
        editData={selectedEducador}
      />

      <EducadorViewModal
        open={isViewModalOpen}
        onOpenChange={setIsViewModalOpen}
        educador={selectedEducador}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover {selectedEducador?.nome}? Esta ação não pode ser desfeita.
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
