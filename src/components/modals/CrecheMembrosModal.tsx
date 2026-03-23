import { useState, useEffect } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Membro {
  id: string;
  user_id: string;
  profile?: { nome: string; email: string };
  role?: string;
}

interface CrecheMembrosModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  creche: { id: string; nome: string } | null;
}

export function CrecheMembrosModal({ open, onOpenChange, creche }: CrecheMembrosModalProps) {
  const [membros, setMembros] = useState<Membro[]>([]);
  const [availableUsers, setAvailableUsers] = useState<
    { user_id: string; nome: string; email: string; role: string }[]
  >([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchMembros = async () => {
    if (!creche) return;
    setLoading(true);

    const { data, error } = await supabase.from("creche_membros").select("id, user_id").eq("creche_id", creche.id);

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    // Fetch profiles for each member
    const membrosWithProfiles = await Promise.all(
      (data || []).map(async (m) => {
        const { data: profile } = await supabase
          .from("profiles")
          .select("nome, email")
          .eq("user_id", m.user_id)
          .single();
        const { data: roleData } = await supabase.rpc("get_user_role", { _user_id: m.user_id });
        return { ...m, profile: profile || undefined, role: roleData || undefined };
      }),
    );

    setMembros(membrosWithProfiles);
    setLoading(false);
  };

  const fetchAvailableUsers = async () => {
    if (!creche) return;

    const { data: allProfiles } = await supabase.from("profiles").select("user_id, nome, email");
    const { data: existingMembros } = await supabase
      .from("creche_membros")
      .select("user_id")
      .eq("creche_id", creche.id);

    const existingIds = new Set((existingMembros || []).map((m) => m.user_id));
    const available = (allProfiles || []).filter((p) => !existingIds.has(p.user_id));

    // Get roles
    const usersWithRoles = await Promise.all(
      available.map(async (u) => {
        const { data: roleData } = await supabase.rpc("get_user_role", { _user_id: u.user_id });
        return { ...u, role: roleData || "sem papel" };
      }),
    );

    setAvailableUsers(usersWithRoles);
  };

  useEffect(() => {
    if (open && creche) {
      fetchMembros();
      fetchAvailableUsers();
    }
  }, [open, creche]);

  const handleAdd = async () => {
    if (!selectedUserId || !creche) return;

    const { error } = await supabase.from("creche_membros").insert({
      creche_id: creche.id,
      user_id: selectedUserId,
    });

    if (error) {
      toast.error("Erro ao adicionar usuário");
      console.error(error);
    } else {
      toast.success("Usuário adicionado!");
      setSelectedUserId("");
      fetchMembros();
      fetchAvailableUsers();
    }
  };

  const handleRemove = async (membroId: string) => {
    const { error } = await supabase.from("creche_membros").delete().eq("id", membroId);
    if (error) {
      toast.error("Erro ao remover membro");
    } else {
      toast.success("Usuário removido");
      fetchMembros();
      fetchAvailableUsers();
    }
  };

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case "admin":
        return <Badge className="bg-destructive/10 text-destructive">Admin</Badge>;
      case "diretor":
        return (
          <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">Diretor(a)</Badge>
        );
      case "educador":
        return <Badge className="bg-primary/10 text-primary">Educador</Badge>;
      case "responsavel":
        return <Badge className="bg-secondary text-secondary-foreground">Responsável</Badge>;
      default:
        return <Badge variant="outline">Sem papel</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Membros — {creche?.nome}</DialogTitle>
        </DialogHeader>

        {/* Add member */}
        <div className="space-y-3 p-4 bg-muted/30 rounded-xl border border-border">
          <p className="text-sm font-semibold text-foreground">Adicionar membro</p>
          <div className="flex gap-2">
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Selecione um usuário" />
              </SelectTrigger>
              <SelectContent>
                {availableUsers.map((u) => (
                  <SelectItem key={u.user_id} value={u.user_id}>
                    {u.nome} ({u.role})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleAdd} disabled={!selectedUserId} size="icon">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Members list */}
        <div className="space-y-2">
          {loading ? (
            <p className="text-sm text-muted-foreground text-center py-4">Carregando...</p>
          ) : membros.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhum membro vinculado</p>
          ) : (
            membros.map((m) => (
              <div key={m.id} className="flex items-center justify-between p-3 rounded-xl border border-border bg-card">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{m.profile?.nome || "Usuário"}</p>
                  <p className="text-xs text-muted-foreground truncate">{m.profile?.email}</p>
                  <div className="flex gap-1 mt-1">{getRoleBadge(m.role)}</div>
                </div>
                <div className="flex items-center gap-2 ml-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleRemove(m.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
