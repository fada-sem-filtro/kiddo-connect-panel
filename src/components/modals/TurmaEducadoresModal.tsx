import { useState, useEffect } from 'react';
import { Search, UserPlus, X, GraduationCap } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface LinkedEducador {
  id: string;
  educador_user_id: string;
  nome: string;
  email: string;
}

interface EducadorOption {
  user_id: string;
  nome: string;
  email: string;
}

interface TurmaEducadoresModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  turmaId: string | null;
  turmaNome: string;
  onChanged: () => void;
}

export function TurmaEducadoresModal({
  open, onOpenChange, turmaId, turmaNome, onChanged,
}: TurmaEducadoresModalProps) {
  const [linked, setLinked] = useState<LinkedEducador[]>([]);
  const [availableEducadores, setAvailableEducadores] = useState<EducadorOption[]>([]);
  const [search, setSearch] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchLinked = async () => {
    if (!turmaId) return;
    const { data } = await supabase
      .from('turma_educadores')
      .select('id, educador_user_id')
      .eq('turma_id', turmaId);

    if (data && data.length > 0) {
      const userIds = data.map(d => d.educador_user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, nome, email')
        .in('user_id', userIds);

      const linkedList: LinkedEducador[] = data.map(d => {
        const profile = profiles?.find(p => p.user_id === d.educador_user_id);
        return {
          id: d.id,
          educador_user_id: d.educador_user_id,
          nome: profile?.nome || 'Desconhecido',
          email: profile?.email || '',
        };
      });
      setLinked(linkedList);
    } else {
      setLinked([]);
    }
  };

  const fetchAvailableEducadores = async () => {
    const { data: roles } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'educador');

    if (roles && roles.length > 0) {
      const userIds = roles.map(r => r.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, nome, email')
        .in('user_id', userIds)
        .order('nome');

      if (profiles) setAvailableEducadores(profiles);
    }
  };

  useEffect(() => {
    if (open && turmaId) {
      fetchLinked();
      fetchAvailableEducadores();
      setSelectedUserId('');
      setSearch('');
    }
  }, [open, turmaId]);

  const unlinked = availableEducadores.filter(
    e => !linked.some(l => l.educador_user_id === e.user_id) &&
      (e.nome.toLowerCase().includes(search.toLowerCase()) ||
       e.email.toLowerCase().includes(search.toLowerCase()))
  );

  const handleLink = async () => {
    if (!turmaId || !selectedUserId) {
      toast.error('Selecione um educador');
      return;
    }

    setLoading(true);
    const { error } = await supabase.from('turma_educadores').insert({
      turma_id: turmaId,
      educador_user_id: selectedUserId,
    });
    setLoading(false);

    if (error) {
      toast.error('Erro ao vincular educador');
      return;
    }

    toast.success('Educador vinculado!');
    setSelectedUserId('');
    fetchLinked();
    onChanged();
  };

  const handleUnlink = async (linkId: string) => {
    const { error } = await supabase.from('turma_educadores').delete().eq('id', linkId);
    if (error) {
      toast.error('Erro ao desvincular');
      return;
    }
    toast.success('Educador desvinculado');
    fetchLinked();
    onChanged();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-primary" />
            Educadores de {turmaNome}
          </DialogTitle>
        </DialogHeader>

        {/* Currently linked */}
        <div className="space-y-3">
          <Label className="text-muted-foreground text-xs uppercase tracking-wider">Vinculados</Label>
          {linked.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">Nenhum educador vinculado</p>
          ) : (
            <div className="space-y-2">
              {linked.map((edu) => (
                <div key={edu.id} className="flex items-center justify-between bg-muted/50 rounded-xl px-4 py-2">
                  <div>
                    <p className="text-sm font-medium">{edu.nome}</p>
                    <p className="text-xs text-muted-foreground">{edu.email}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive h-8 w-8"
                    onClick={() => handleUnlink(edu.id)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add new link */}
        <div className="space-y-3 border-t border-border pt-4">
          <Label className="text-muted-foreground text-xs uppercase tracking-wider">Vincular novo</Label>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar educador..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={selectedUserId} onValueChange={setSelectedUserId}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o educador" />
            </SelectTrigger>
            <SelectContent>
              {unlinked.length === 0 ? (
                <div className="px-3 py-2 text-sm text-muted-foreground">Nenhum educador disponível</div>
              ) : (
                unlinked.map((e) => (
                  <SelectItem key={e.user_id} value={e.user_id}>
                    {e.nome} ({e.email})
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>

          <Button onClick={handleLink} disabled={!selectedUserId || loading} className="w-full">
            <UserPlus className="w-4 h-4 mr-2" />
            {loading ? 'Vinculando...' : 'Vincular'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
