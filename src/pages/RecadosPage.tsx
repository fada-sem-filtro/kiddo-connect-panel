import { useState } from 'react';
import { Plus, MessageSquare, Users, Send } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { RecadoThread } from '@/components/recados/RecadoThread';
import { RecadoModal } from '@/components/modals/RecadoModal';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useData } from '@/contexts/DataContext';

export default function RecadosPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [filterTurma, setFilterTurma] = useState<string>('all');
  
  const { recados, turmas, criancas } = useData();

  const filteredRecados = recados.filter(recado => {
    if (filterTurma === 'all') return !recado.parentId;
    if (recado.turmaId === filterTurma) return !recado.parentId;
    if (recado.criancaId) {
      const crianca = criancas.find(c => c.id === recado.criancaId);
      return crianca?.turmaId === filterTurma && !recado.parentId;
    }
    return false;
  });

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <MessageSquare className="w-6 h-6 text-primary" />
              Recados
            </h1>
            <p className="text-muted-foreground">Comunicação com os responsáveis</p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Select value={filterTurma} onValueChange={setFilterTurma}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Todas as turmas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as turmas</SelectItem>
                {turmas.map(turma => (
                  <SelectItem key={turma.id} value={turma.id}>
                    {turma.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button onClick={() => setIsModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Recado
            </Button>
            
            <Button variant="outline" onClick={() => setIsBulkModalOpen(true)}>
              <Users className="w-4 h-4 mr-2" />
              Recado p/ Turma
            </Button>
          </div>
        </div>

        {/* Recados List */}
        <div className="space-y-4">
          {filteredRecados.length === 0 ? (
            <div className="bg-card rounded-2xl border border-border p-8 text-center">
              <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">Nenhum recado encontrado</p>
            </div>
          ) : (
            filteredRecados.map(recado => (
              <RecadoThread key={recado.id} recado={recado} />
            ))
          )}
        </div>
      </div>

      <RecadoModal 
        open={isModalOpen} 
        onOpenChange={setIsModalOpen}
        mode="individual"
      />
      
      <RecadoModal 
        open={isBulkModalOpen} 
        onOpenChange={setIsBulkModalOpen}
        mode="turma"
      />
    </MainLayout>
  );
}
