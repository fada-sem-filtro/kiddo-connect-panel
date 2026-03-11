import { useState, useEffect, useCallback } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Pencil, Trash2, CalendarDays, Users } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { EventoFuturoModal } from '@/components/modals/EventoFuturoModal';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface EventoFuturoDb {
  id: string;
  nome: string;
  descricao: string | null;
  data_inicio: string;
  data_fim: string | null;
  turma_id: string | null;
  created_at: string;
  turma_nome?: string;
}

export default function CalendarioAdminPage() {
  const [eventos, setEventos] = useState<EventoFuturoDb[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvento, setEditingEvento] = useState<EventoFuturoDb | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchEventos = useCallback(async () => {
    const { data } = await supabase
      .from('eventos_futuros')
      .select('*, turmas(nome)')
      .order('data_inicio', { ascending: true });

    const mapped = (data || []).map((e: any) => ({
      ...e,
      turma_nome: e.turmas?.nome || null,
    }));
    setEventos(mapped as EventoFuturoDb[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchEventos(); }, [fetchEventos]);

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from('eventos_futuros').delete().eq('id', deleteId);
    if (error) { toast.error('Erro ao excluir evento'); return; }
    toast.success('Evento excluído!');
    setDeleteId(null);
    fetchEventos();
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingEvento(null);
  };

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto space-y-6">
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
          <Button onClick={() => setIsModalOpen(true)} className="kawaii-btn rounded-2xl">
            <Plus className="w-4 h-4 mr-2" />
            Novo Evento
          </Button>
        </div>

        {loading ? (
          <p className="text-center text-muted-foreground py-8">Carregando...</p>
        ) : eventos.length === 0 ? (
          <Card className="kawaii-card">
            <CardContent className="py-12 text-center">
              <span className="text-5xl block mb-4">📆</span>
              <p className="text-muted-foreground">Nenhum evento programado</p>
              <Button variant="outline" className="mt-4 rounded-2xl" onClick={() => setIsModalOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Adicionar primeiro evento
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {eventos.map(evento => (
              <Card key={evento.id} className="kawaii-card overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex items-start gap-4 p-4">
                    <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-kawaii-blue/40 to-kawaii-purple/30 flex-shrink-0">
                      <CalendarDays className="w-6 h-6 text-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-foreground">{evento.nome}</h3>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(evento.data_inicio + 'T12:00:00'), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                        {evento.data_fim && (
                          <> até {format(new Date(evento.data_fim + 'T12:00:00'), "dd 'de' MMMM", { locale: ptBR })}</>
                        )}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-secondary text-secondary-foreground">
                          <Users className="w-3 h-3" />
                          {evento.turma_nome || 'Todas as turmas'}
                        </span>
                      </div>
                      {evento.descricao && (
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{evento.descricao}</p>
                      )}
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <Button variant="ghost" size="icon" className="rounded-xl hover:bg-primary/10"
                        onClick={() => { setEditingEvento(evento); setIsModalOpen(true); }}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="rounded-xl hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => setDeleteId(evento.id)}>
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
        onSaved={fetchEventos}
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
            <AlertDialogAction onClick={handleDelete} className="rounded-2xl bg-destructive hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
