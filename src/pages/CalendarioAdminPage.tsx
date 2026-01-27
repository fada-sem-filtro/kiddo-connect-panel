import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Plus, 
  Pencil, 
  Trash2, 
  CalendarDays,
  Users
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { EventoFuturoModal } from '@/components/modals/EventoFuturoModal';
import { EventoFuturo } from '@/types';
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

export default function CalendarioAdminPage() {
  const { eventosFuturos, deleteEventoFuturo, turmas } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvento, setEditingEvento] = useState<EventoFuturo | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleEdit = (evento: EventoFuturo) => {
    setEditingEvento(evento);
    setIsModalOpen(true);
  };

  const handleDelete = () => {
    if (deleteId) {
      deleteEventoFuturo(deleteId);
      setDeleteId(null);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingEvento(null);
  };

  const getTurmaName = (turmaId?: string) => {
    if (!turmaId) return 'Todas as turmas';
    const turma = turmas.find(t => t.id === turmaId);
    return turma?.nome || 'Turma não encontrada';
  };

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-kawaii-blue/30 to-kawaii-purple/20 shadow-md">
              <CalendarDays className="w-6 h-6 text-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Calendário Escolar 📅</h1>
              <p className="text-muted-foreground">Gerencie eventos futuros e programações</p>
            </div>
          </div>
          
          <Button 
            onClick={() => setIsModalOpen(true)}
            className="kawaii-btn rounded-2xl"
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Evento
          </Button>
        </div>

        {/* Eventos List */}
        {eventosFuturos.length === 0 ? (
          <Card className="kawaii-card">
            <CardContent className="py-12 text-center">
              <span className="text-5xl block mb-4">📆</span>
              <p className="text-muted-foreground">Nenhum evento programado</p>
              <Button 
                variant="outline" 
                className="mt-4 rounded-2xl"
                onClick={() => setIsModalOpen(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Adicionar primeiro evento
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {eventosFuturos
              .sort((a, b) => new Date(a.dataInicio).getTime() - new Date(b.dataInicio).getTime())
              .map(evento => (
                <Card key={evento.id} className="kawaii-card overflow-hidden">
                  <CardContent className="p-0">
                    <div className="flex items-start gap-4 p-4">
                      <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-kawaii-blue/40 to-kawaii-purple/30 flex-shrink-0">
                        <CalendarDays className="w-6 h-6 text-foreground" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-foreground">{evento.nome}</h3>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(evento.dataInicio), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                          {evento.dataFim && (
                            <> até {format(new Date(evento.dataFim), "dd 'de' MMMM", { locale: ptBR })}</>
                          )}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-secondary text-secondary-foreground">
                            <Users className="w-3 h-3" />
                            {getTurmaName(evento.turmaId)}
                          </span>
                        </div>
                        {evento.descricao && (
                          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{evento.descricao}</p>
                        )}
                      </div>
                      
                      <div className="flex gap-2 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="rounded-xl hover:bg-primary/10"
                          onClick={() => handleEdit(evento)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="rounded-xl hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => setDeleteId(evento.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        )}
      </div>

      <EventoFuturoModal
        open={isModalOpen}
        onOpenChange={handleCloseModal}
        evento={editingEvento}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir evento? 🗑️</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O evento será removido permanentemente do calendário.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-2xl">Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="rounded-2xl bg-destructive hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
