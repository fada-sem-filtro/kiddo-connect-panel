import { format } from 'date-fns';
import { User, Phone, Mail, Calendar, BookOpen, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useData } from '@/contexts/DataContext';
import { Crianca } from '@/types';

interface CriancaViewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  crianca: Crianca | null;
}

export function CriancaViewModal({ open, onOpenChange, crianca }: CriancaViewModalProps) {
  const { turmas } = useData();

  if (!crianca) return null;

  const turma = turmas.find(t => t.id === crianca.turmaId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            {crianca.nome}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Info básica */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Nascimento:</span>
              <span className="font-medium">
                {format(new Date(crianca.dataNascimento), 'dd/MM/yyyy')}
              </span>
            </div>
            
            <div className="flex items-center gap-2 text-sm">
              <BookOpen className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Turma:</span>
              <Badge variant="secondary">{turma?.nome || 'Sem turma'}</Badge>
            </div>
          </div>

          {/* Observações */}
          {crianca.observacoes && (
            <div className="p-3 rounded-xl bg-warning/10 border border-warning/20">
              <div className="flex items-center gap-2 mb-1">
                <AlertCircle className="w-4 h-4 text-warning" />
                <span className="text-sm font-medium">Observações</span>
              </div>
              <p className="text-sm text-muted-foreground">{crianca.observacoes}</p>
            </div>
          )}

          <Separator />

          {/* Responsáveis */}
          <div>
            <h3 className="font-semibold mb-3">Responsáveis</h3>
            <div className="space-y-3">
              {crianca.responsaveis.map((resp) => (
                <div 
                  key={resp.id} 
                  className="p-4 rounded-xl border border-border bg-muted/30"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{resp.nome}</span>
                    <Badge variant="outline">{resp.parentesco}</Badge>
                  </div>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Phone className="w-3 h-3" />
                      {resp.telefone}
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-3 h-3" />
                      {resp.email}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
