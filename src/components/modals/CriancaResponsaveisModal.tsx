import { useState, useEffect } from 'react';
import { Search, UserPlus, X, Link2 } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface LinkedResp {
  id: string;
  responsavel_user_id: string;
  parentesco: string;
  nome: string;
  email: string;
}

interface ResponsavelOption {
  user_id: string;
  nome: string;
  email: string;
}

interface CriancaResponsaveisModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  criancaId: string | null;
  criancaNome: string;
  onChanged: () => void;
}

export function CriancaResponsaveisModal({
  open, onOpenChange, criancaId, criancaNome, onChanged,
}: CriancaResponsaveisModalProps) {
  const [linked, setLinked] = useState<LinkedResp[]>([]);
  const [availableResps, setAvailableResps] = useState<ResponsavelOption[]>([]);
  const [search, setSearch] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [parentesco, setParentesco] = useState('Mãe');
  const [loading, setLoading] = useState(false);

  const fetchLinked = async () => {
    if (!criancaId) return;
    const { data } = await supabase
      .from('crianca_responsaveis')
      .select('id, responsavel_user_id, parentesco')
      .eq('crianca_id', criancaId);

    if (data && data.length > 0) {
      const userIds = data.map(d => d.responsavel_user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, nome, email')
        .in('user_id', userIds);

      const linkedList: LinkedResp[] = data.map(d => {
        const profile = profiles?.find(p => p.user_id === d.responsavel_user_id);
        return {
          id: d.id,
          responsavel_user_id: d.responsavel_user_id,
          parentesco: d.parentesco,
          nome: profile?.nome || 'Desconhecido',
          email: profile?.email || '',
        };
      });
      setLinked(linkedList);
    } else {
      setLinked([]);
    }
  };

  const fetchAvailableResps = async () => {
    // Get all users with role responsavel
    const { data: roles } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'responsavel');

    if (roles && roles.length > 0) {
      const userIds = roles.map(r => r.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, nome, email')
        .in('user_id', userIds)
        .order('nome');

      if (profiles) setAvailableResps(profiles);
    }
  };

  useEffect(() => {
    if (open && criancaId) {
      fetchLinked();
      fetchAvailableResps();
      setSelectedUserId('');
      setParentesco('Mãe');
      setSearch('');
    }
  }, [open, criancaId]);

  const unlinkedResps = availableResps.filter(
    r => !linked.some(l => l.responsavel_user_id === r.user_id) &&
      (r.nome.toLowerCase().includes(search.toLowerCase()) ||
       r.email.toLowerCase().includes(search.toLowerCase()))
  );

  const handleLink = async () => {
    if (!criancaId || !selectedUserId) {
      toast.error('Selecione um responsável');
      return;
    }

    setLoading(true);
    const { error } = await supabase.from('crianca_responsaveis').insert({
      crianca_id: criancaId,
      responsavel_user_id: selectedUserId,
      parentesco,
    });
    setLoading(false);

    if (error) {
      toast.error('Erro ao vincular responsável');
      return;
    }

    toast.success('Responsável vinculado!');
    setSelectedUserId('');
    fetchLinked();
    onChanged();
  };

  const handleUnlink = async (linkId: string) => {
    const { error } = await supabase.from('crianca_responsaveis').delete().eq('id', linkId);
    if (error) {
      toast.error('Erro ao desvincular');
      return;
    }
    toast.success('Responsável desvinculado');
    fetchLinked();
    onChanged();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="w-5 h-5 text-primary" />
            Responsáveis de {criancaNome}
          </DialogTitle>
        </DialogHeader>

        {/* Currently linked */}
        <div className="space-y-3">
          <Label className="text-muted-foreground text-xs uppercase tracking-wider">Vinculados</Label>
          {linked.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">Nenhum responsável vinculado</p>
          ) : (
            <div className="space-y-2">
              {linked.map((resp) => (
                <div key={resp.id} className="flex items-center justify-between bg-muted/50 rounded-xl px-4 py-2">
                  <div>
                    <p className="text-sm font-medium">{resp.nome}</p>
                    <p className="text-xs text-muted-foreground">{resp.email} · {resp.parentesco}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive h-8 w-8"
                    onClick={() => handleUnlink(resp.id)}
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
              placeholder="Buscar responsável..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={selectedUserId} onValueChange={setSelectedUserId}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o responsável" />
            </SelectTrigger>
            <SelectContent>
              {unlinkedResps.length === 0 ? (
                <div className="px-3 py-2 text-sm text-muted-foreground">Nenhum responsável disponível</div>
              ) : (
                unlinkedResps.map((r) => (
                  <SelectItem key={r.user_id} value={r.user_id}>
                    {r.nome} ({r.email})
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>

          <div className="flex gap-2">
            <Select value={parentesco} onValueChange={setParentesco}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Mãe">Mãe</SelectItem>
                <SelectItem value="Pai">Pai</SelectItem>
                <SelectItem value="Avó">Avó</SelectItem>
                <SelectItem value="Avô">Avô</SelectItem>
                <SelectItem value="Tio(a)">Tio(a)</SelectItem>
                <SelectItem value="Responsável">Responsável</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={handleLink} disabled={!selectedUserId || loading} className="flex-1">
              <UserPlus className="w-4 h-4 mr-2" />
              {loading ? 'Vinculando...' : 'Vincular'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
