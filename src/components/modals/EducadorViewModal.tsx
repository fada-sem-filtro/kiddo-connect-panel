import { Phone, Mail, BookOpen, Users } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useData } from '@/contexts/DataContext';
import { Educador } from '@/types';

interface EducadorViewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  educador: Educador | null;
}

export function EducadorViewModal({ open, onOpenChange, educador }: EducadorViewModalProps) {
  const { turmas, getCriancasByTurma } = useData();

  if (!educador) return null;

  const turma = turmas.find(t => t.id === educador.turmaId);
  const criancasDaTurma = getCriancasByTurma(educador.turmaId);

  const initials = educador.nome.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Avatar className="w-12 h-12">
              <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-bold">{educador.nome}</p>
              <Badge variant="secondary">{turma?.nome || 'Sem turma'}</Badge>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Contato */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <span>{educador.email}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Phone className="w-4 h-4 text-muted-foreground" />
              <span>{educador.telefone}</span>
            </div>
          </div>

          <Separator />

          {/* Crianças da turma */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              Crianças da Turma ({criancasDaTurma.length})
            </h3>
            
            {criancasDaTurma.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma criança nesta turma</p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {criancasDaTurma.map((crianca) => (
                  <div 
                    key={crianca.id} 
                    className="p-3 rounded-xl border border-border bg-muted/30 text-sm"
                  >
                    <p className="font-medium">{crianca.nome}</p>
                    <p className="text-xs text-muted-foreground">
                      {crianca.responsaveis[0]?.nome}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
