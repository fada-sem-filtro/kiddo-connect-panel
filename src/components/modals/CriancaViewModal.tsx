import { useState } from 'react';
import { format } from 'date-fns';
import { User, Phone, Mail, Calendar, BookOpen, AlertCircle, Shield } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { AuthorizedPickupsModal } from './AuthorizedPickupsModal';

interface CriancaViewData {
  id: string;
  nome: string;
  data_nascimento: string;
  turma_nome: string;
  observacoes: string | null;
  responsaveis: { id: string; nome: string; telefone: string; email: string; parentesco: string }[];
}

interface CriancaViewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  crianca: CriancaViewData | null;
}

export function CriancaViewModal({ open, onOpenChange, crianca }: CriancaViewModalProps) {
  const [pickupsOpen, setPickupsOpen] = useState(false);

  if (!crianca) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              {crianca.nome}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Nascimento:</span>
                <span className="font-medium">
                  {format(new Date(crianca.data_nascimento + 'T00:00:00'), 'dd/MM/yyyy')}
                </span>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <BookOpen className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Turma:</span>
                <Badge variant="secondary">{crianca.turma_nome}</Badge>
              </div>
            </div>

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
                        {resp.telefone || 'Não informado'}
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="w-3 h-3" />
                        {resp.email}
                      </div>
                    </div>
                  </div>
                ))}
                {crianca.responsaveis.length === 0 && (
                  <p className="text-sm text-muted-foreground">Nenhum responsável vinculado</p>
                )}
              </div>
            </div>

            <Separator />

            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <Shield className="w-4 h-4 text-primary" />
                  Pessoas autorizadas para retirada
                </h3>
                <Button variant="outline" size="sm" onClick={() => setPickupsOpen(true)}>
                  Gerenciar
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Clique em "Gerenciar" para cadastrar, editar ou remover pessoas autorizadas a retirar a criança.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AuthorizedPickupsModal
        open={pickupsOpen}
        onOpenChange={setPickupsOpen}
        criancaId={crianca.id}
        criancaNome={crianca.nome}
      />
    </>
  );
}
