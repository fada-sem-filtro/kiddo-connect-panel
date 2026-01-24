import { useState } from 'react';
import { Plus, Search, Edit, Trash2, Eye, Users } from 'lucide-react';
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
import { CriancaModal } from '@/components/modals/CriancaModal';
import { CriancaViewModal } from '@/components/modals/CriancaViewModal';
import { useData } from '@/contexts/DataContext';
import { Crianca } from '@/types';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function CriancasPage() {
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCrianca, setSelectedCrianca] = useState<Crianca | null>(null);
  
  const { criancas, turmas, deleteCrianca } = useData();

  const filteredCriancas = criancas.filter(crianca => 
    crianca.nome.toLowerCase().includes(search.toLowerCase())
  );

  const getTurmaName = (turmaId: string) => {
    return turmas.find(t => t.id === turmaId)?.nome || 'Sem turma';
  };

  const handleEdit = (crianca: Crianca) => {
    setSelectedCrianca(crianca);
    setIsModalOpen(true);
  };

  const handleView = (crianca: Crianca) => {
    setSelectedCrianca(crianca);
    setIsViewModalOpen(true);
  };

  const handleDelete = (crianca: Crianca) => {
    setSelectedCrianca(crianca);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedCrianca) {
      deleteCrianca(selectedCrianca.id);
      toast.success('Criança removida com sucesso!');
    }
    setIsDeleteDialogOpen(false);
    setSelectedCrianca(null);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedCrianca(null);
  };

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Users className="w-6 h-6 text-primary" />
              Crianças
            </h1>
            <p className="text-muted-foreground">Gerencie o cadastro das crianças</p>
          </div>
          
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nova Criança
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar criança..."
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
                <TableHead>Data de Nascimento</TableHead>
                <TableHead>Turma</TableHead>
                <TableHead>Responsáveis</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCriancas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Nenhuma criança encontrada
                  </TableCell>
                </TableRow>
              ) : (
                filteredCriancas.map((crianca) => (
                  <TableRow key={crianca.id} className="animate-fade-in">
                    <TableCell className="font-medium">{crianca.nome}</TableCell>
                    <TableCell>
                      {format(new Date(crianca.dataNascimento), 'dd/MM/yyyy')}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{getTurmaName(crianca.turmaId)}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {crianca.responsaveis.slice(0, 2).map((resp) => (
                          <Badge key={resp.id} variant="outline" className="text-xs">
                            {resp.nome}
                          </Badge>
                        ))}
                        {crianca.responsaveis.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{crianca.responsaveis.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleView(crianca)}>
                          <Eye className="w-4 h-4" />
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
      </div>

      <CriancaModal 
        open={isModalOpen} 
        onOpenChange={handleModalClose}
        editData={selectedCrianca}
      />

      <CriancaViewModal
        open={isViewModalOpen}
        onOpenChange={setIsViewModalOpen}
        crianca={selectedCrianca}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover {selectedCrianca?.nome}? Esta ação não pode ser desfeita.
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
