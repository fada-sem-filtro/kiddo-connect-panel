import { useState, useEffect, useCallback } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Pencil, Trash2, PartyPopper, Calendar, RotateCw } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FeriadoModal } from '@/components/modals/FeriadoModal';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface FeriadoDb {
  id: string;
  nome: string;
  data: string;
  recorrente: boolean;
  created_at: string;
}

export default function FeriadosPage() {
  const [feriados, setFeriados] = useState<FeriadoDb[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFeriado, setEditingFeriado] = useState<FeriadoDb | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchFeriados = useCallback(async () => {
    const { data } = await supabase
      .from('feriados')
      .select('*')
      .order('data', { ascending: true });
    setFeriados((data || []) as unknown as FeriadoDb[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchFeriados(); }, [fetchFeriados]);

  const handleEdit = (feriado: FeriadoDb) => {
    setEditingFeriado(feriado);
    setIsModalOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from('feriados').delete().eq('id', deleteId);
    if (error) { toast.error('Erro ao excluir feriado'); return; }
    toast.success('Feriado excluído!');
    setDeleteId(null);
    fetchFeriados();
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingFeriado(null);
  };

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-kawaii-yellow/30 to-kawaii-pink/20 shadow-md">
              <PartyPopper className="w-6 h-6 text-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Feriados 🎉</h1>
              <p className="text-muted-foreground">Gerencie os feriados do calendário escolar</p>
            </div>
          </div>
          <Button onClick={() => setIsModalOpen(true)} className="kawaii-btn rounded-2xl">
            <Plus className="w-4 h-4 mr-2" />
            Novo Feriado
          </Button>
        </div>

        {loading ? (
          <p className="text-center text-muted-foreground py-8">Carregando...</p>
        ) : feriados.length === 0 ? (
          <Card className="kawaii-card">
            <CardContent className="py-12 text-center">
              <span className="text-5xl block mb-4">🎊</span>
              <p className="text-muted-foreground">Nenhum feriado cadastrado</p>
              <Button variant="outline" className="mt-4 rounded-2xl" onClick={() => setIsModalOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Adicionar primeiro feriado
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {feriados.map(feriado => (
              <Card key={feriado.id} className="kawaii-card overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex items-center gap-4 p-4">
                    <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-kawaii-yellow/40 to-kawaii-pink/30">
                      <Calendar className="w-6 h-6 text-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-foreground truncate">{feriado.nome}</h3>
                        {feriado.recorrente && (
                          <span className="flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary">
                            <RotateCw className="w-3 h-3" />
                            Anual
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(feriado.data + 'T12:00:00'), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" className="rounded-xl hover:bg-primary/10" onClick={() => handleEdit(feriado)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="rounded-xl hover:bg-destructive/10 hover:text-destructive" onClick={() => setDeleteId(feriado.id)}>
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

      <FeriadoModal
        open={isModalOpen}
        onOpenChange={handleCloseModal}
        feriado={editingFeriado}
        onSaved={fetchFeriados}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir feriado? 🗑️</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O feriado será removido permanentemente.
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
