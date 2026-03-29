import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AlertCircle, LogOut } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface PickupPerson {
  id: string;
  nome: string;
  tipo: 'responsável' | 'autorizado';
  foto_url?: string | null;
}

interface PickupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  crianca: { id: string; nome: string; turma_nome: string; foto_url?: string | null } | null;
  onConfirm: (person: PickupPerson) => void;
  loading?: boolean;
}

export function PickupModal({ open, onOpenChange, crianca, onConfirm, loading }: PickupModalProps) {
  const [pessoas, setPessoas] = useState<PickupPerson[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    if (!open || !crianca) {
      setSelectedId('');
      setPessoas([]);
      return;
    }
    fetchPessoas();
  }, [open, crianca?.id]);

  const fetchPessoas = async () => {
    if (!crianca) return;
    setFetching(true);

    // Fetch responsáveis
    const { data: responsaveis } = await supabase
      .from('crianca_responsaveis')
      .select('responsavel_user_id, parentesco')
      .eq('crianca_id', crianca.id);

    let respPessoas: PickupPerson[] = [];
    if (responsaveis && responsaveis.length > 0) {
      const userIds = responsaveis.map(r => r.responsavel_user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, nome, avatar_url')
        .in('user_id', userIds);

      respPessoas = (profiles || []).map(p => ({
        id: `resp_${p.user_id}`,
        nome: p.nome,
        tipo: 'responsável' as const,
        foto_url: p.avatar_url,
      }));
    }

    // Fetch autorizados
    const { data: autorizados } = await supabase
      .from('authorized_pickups')
      .select('id, nome, foto_url')
      .eq('crianca_id', crianca.id);

    const autPessoas: PickupPerson[] = (autorizados || []).map(a => ({
      id: `aut_${a.id}`,
      nome: a.nome,
      tipo: 'autorizado' as const,
      foto_url: a.foto_url,
    }));

    setPessoas([...respPessoas, ...autPessoas]);
    setFetching(false);
  };

  const selectedPerson = pessoas.find(p => p.id === selectedId);

  const getInitials = (nome: string) =>
    nome.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  const noPeople = !fetching && pessoas.length === 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <LogOut className="w-5 h-5 text-primary" />
            Quem buscou a criança?
          </DialogTitle>
        </DialogHeader>

        {crianca && (
          <div className="space-y-4">
            {/* Child info */}
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
              <Avatar className="w-12 h-12 border-2 border-primary/20">
                {crianca.foto_url ? (
                  <AvatarImage src={crianca.foto_url} alt={crianca.nome} />
                ) : null}
                <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20 text-primary font-bold">
                  {getInitials(crianca.nome)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-bold text-foreground">{crianca.nome}</p>
                <p className="text-xs text-muted-foreground">{crianca.turma_nome}</p>
              </div>
            </div>

            {noPeople ? (
              <div className="flex items-start gap-3 p-4 bg-destructive/10 rounded-xl border border-destructive/20">
                <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-destructive">Nenhum responsável ou autorizado cadastrado.</p>
                  <p className="text-xs text-muted-foreground mt-1">Cadastre na ficha do aluno para registrar a saída.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Quem buscou</label>
                <Select value={selectedId} onValueChange={setSelectedId} disabled={fetching}>
                  <SelectTrigger className="rounded-xl h-12">
                    <SelectValue placeholder={fetching ? 'Carregando...' : 'Selecione quem buscou'} />
                  </SelectTrigger>
                  <SelectContent>
                    {pessoas.map(p => (
                      <SelectItem key={p.id} value={p.id} className="py-3">
                        {p.nome} — ({p.tipo === 'responsável' ? 'Responsável' : 'Autorizado'})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" className="rounded-xl" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          {!noPeople && (
            <Button
              className="rounded-xl"
              disabled={!selectedId || loading}
              onClick={() => selectedPerson && onConfirm(selectedPerson)}
            >
              {loading ? 'Registrando...' : 'Confirmar saída'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
