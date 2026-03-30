import { useState, useEffect } from 'react';
import { Plus, Search, Users, Shield, GraduationCap, UserCheck, UserCog, Edit, KeyRound, AlertTriangle, Filter, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { usePedagogicalSettings } from '@/hooks/usePedagogicalSettings';
import { useAdminSchoolSelector, AdminSchoolSelector } from '@/components/admin/AdminSchoolSelector';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UserWithRole {
  user_id: string;
  nome: string;
  email: string;
  telefone: string | null;
  role: 'admin' | 'educador' | 'responsavel' | 'diretor' | 'secretaria' | 'aluno';
  created_at: string;
  ativo: boolean;
}

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador',
  diretor: 'Diretor(a)',
  educador: 'Educador',
  responsavel: 'Responsável',
  secretaria: 'Secretaria',
  aluno: 'Aluno',
};

const ROLE_ICONS: Record<string, React.ReactNode> = {
  admin: <Shield className="w-3 h-3" />,
  diretor: <Shield className="w-3 h-3" />,
  educador: <GraduationCap className="w-3 h-3" />,
  responsavel: <UserCheck className="w-3 h-3" />,
  secretaria: <UserCog className="w-3 h-3" />,
  aluno: <Users className="w-3 h-3" />,
};

export default function UsuariosPage() {
  const { role, userCreche } = useAuth();
  const { effectiveCrecheId, selectedCrecheId, setSelectedCrecheId, creches, isAdmin } = useAdminSchoolSelector();
  const isDiretor = role === 'diretor';
  const isSecretaria = role === 'secretaria';
  const { settings: pedSettings } = usePedagogicalSettings();
  const secretariaEnabled = !!(pedSettings as any)?.modulo_secretaria_ativo;
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editingUser, setEditingUser] = useState<UserWithRole | null>(null);
  const [resetTarget, setResetTarget] = useState<UserWithRole | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UserWithRole | null>(null);
  const [isResetting, setIsResetting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [form, setForm] = useState({
    nome: '', email: '', password: '', telefone: '', role: '' as string,
  });

  const fetchUsers = async () => {
    const crecheId = (isDiretor || isSecretaria) ? userCreche?.id : effectiveCrecheId;

    if (crecheId) {
      // Get members from creche_membros
      const { data: membros } = await supabase
        .from('creche_membros')
        .select('user_id')
        .eq('creche_id', crecheId);

      const memberUserIds = (membros || []).map(m => m.user_id);

      // Also get aluno user_ids from criancas in the school's turmas
      const { data: turmas } = await supabase
        .from('turmas')
        .select('id')
        .eq('creche_id', crecheId);

      let alunoUserIds: string[] = [];
      if (turmas && turmas.length > 0) {
        const turmaIds = turmas.map(t => t.id);
        const { data: criancas } = await supabase
          .from('criancas')
          .select('user_id')
          .in('turma_id', turmaIds)
          .not('user_id', 'is', null);

        alunoUserIds = (criancas || [])
          .map(c => c.user_id)
          .filter((id): id is string => !!id);
      }

      // Combine unique user IDs
      const allUserIds = [...new Set([...memberUserIds, ...alunoUserIds])];

      if (allUserIds.length === 0) {
        setUsers([]);
        return;
      }

      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .in('user_id', allUserIds);

      const { data: roles } = await supabase
        .from('user_roles')
        .select('*')
        .in('user_id', allUserIds);

      if (profiles && roles) {
        const usersWithRoles: UserWithRole[] = profiles
          .map((p) => {
            const userRole = roles.find((r) => r.user_id === p.user_id);
            return {
              user_id: p.user_id,
              nome: p.nome,
              email: p.email,
              telefone: p.telefone,
              role: (userRole?.role || 'responsavel') as UserWithRole['role'],
              created_at: p.created_at,
              ativo: (p as any).ativo ?? true,
            };
          })
          .filter(u => (isDiretor || isSecretaria) ? u.role !== 'admin' : true);
        setUsers(usersWithRoles);
      }
    } else if (isAdmin) {
      // Admin without school selected: show all
      const { data: profiles } = await supabase.from('profiles').select('*');
      const { data: roles } = await supabase.from('user_roles').select('*');

      if (profiles && roles) {
        const usersWithRoles: UserWithRole[] = profiles.map((p) => {
          const userRole = roles.find((r) => r.user_id === p.user_id);
          return {
            user_id: p.user_id,
            nome: p.nome,
            email: p.email,
            telefone: p.telefone,
            role: (userRole?.role || 'responsavel') as UserWithRole['role'],
            created_at: p.created_at,
            ativo: (p as any).ativo ?? true,
          };
        });
        setUsers(usersWithRoles);
      }
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [effectiveCrecheId]);

  const filteredUsers = users.filter((u) => {
    const matchesSearch = u.nome.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const openCreate = () => {
    setEditingUser(null);
    setForm({ nome: '', email: '', password: '', telefone: '', role: '' });
    setIsModalOpen(true);
  };

  const openEdit = (user: UserWithRole) => {
    setEditingUser(user);
    setForm({
      nome: user.nome,
      email: user.email,
      password: '',
      telefone: user.telefone || '',
      role: user.role,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingUser) {
      await handleUpdateUser();
    } else {
      await handleCreateUser();
    }
  };

  const handleCreateUser = async () => {
    if (!form.nome || !form.email || !form.role) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    setIsLoading(true);
    const { data, error } = await supabase.functions.invoke('create-user', {
      body: {
        email: form.email,
        nome: form.nome,
        telefone: form.telefone || null,
        role: form.role,
        creche_id: (isDiretor || isSecretaria) && userCreche ? userCreche.id : undefined,
      },
    });
    setIsLoading(false);

    if (error || data?.error) {
      toast.error(data?.error || 'Erro ao criar usuário');
      return;
    }

    toast.success(`${form.nome} cadastrado como ${ROLE_LABELS[form.role]}! 🌸`);
    setIsModalOpen(false);
    fetchUsers();
  };

  const handleUpdateUser = async () => {
    if (!editingUser || !form.nome || !form.role) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }

    setIsLoading(true);

    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        nome: form.nome,
        telefone: form.telefone || null,
      })
      .eq('user_id', editingUser.user_id);

    if (profileError) {
      toast.error('Erro ao atualizar perfil');
      setIsLoading(false);
      return;
    }

    if (form.role !== editingUser.role) {
      const { error: roleError } = await supabase
        .from('user_roles')
        .update({ role: form.role as UserWithRole['role'] })
        .eq('user_id', editingUser.user_id);

      if (roleError) {
        toast.error('Erro ao atualizar papel');
        setIsLoading(false);
        return;
      }
    }

    setIsLoading(false);
    toast.success('Usuário atualizado!');
    setIsModalOpen(false);
    fetchUsers();
  };

  const handleResetPassword = async () => {
    if (!resetTarget) return;
    setIsResetting(true);

    const { data, error } = await supabase.functions.invoke('reset-user-password', {
      body: { user_id: resetTarget.user_id },
    });

    setIsResetting(false);

    if (error || data?.error) {
      toast.error(data?.error || 'Erro ao resetar senha');
      return;
    }

    toast.success(`Senha de ${resetTarget.nome} resetada! No próximo login será solicitada uma nova senha.`);
    setResetTarget(null);
  };

  const handleDeleteUser = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);

    const { data, error } = await supabase.functions.invoke('delete-user', {
      body: { user_id: deleteTarget.user_id },
    });

    setIsDeleting(false);

    if (error || data?.error) {
      toast.error(data?.error || 'Erro ao excluir usuário');
      return;
    }

    toast.success(`${deleteTarget.nome} foi removido do sistema.`);
    setDeleteTarget(null);
    fetchUsers();
  };

  const handleToggleAtivo = async (user: UserWithRole) => {
    const newAtivo = !user.ativo;

    const { data, error } = await supabase
      .from('profiles')
      .update({ ativo: newAtivo } as any)
      .eq('user_id', user.user_id)
      .select('user_id, ativo')
      .single();

    if (error || !data) {
      toast.error('Não foi possível alterar o status deste usuário.');
      return;
    }

    toast.success(`${user.nome} foi ${newAtivo ? 'habilitado' : 'desabilitado'}.`);
    setUsers(prev => prev.map(u => u.user_id === user.user_id ? { ...u, ativo: newAtivo } : u));
  };

  const canToggleUser = (user: UserWithRole) => {
    if (isDiretor && ['educador', 'responsavel', 'secretaria'].includes(user.role)) return true;
    return false;
  };

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Users className="w-6 h-6 text-primary" />
              Usuários
            </h1>
            <p className="text-muted-foreground">Gerencie os acessos ao sistema</p>
          </div>
          <Button onClick={openCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Usuário
          </Button>
        </div>

        {isAdmin && (
          <AdminSchoolSelector
            selectedCrecheId={selectedCrecheId}
            setSelectedCrecheId={setSelectedCrecheId}
            creches={creches}
          />
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Todos os tipos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              {!isDiretor && <SelectItem value="admin">Administrador</SelectItem>}
              {!isDiretor && <SelectItem value="diretor">Diretor(a)</SelectItem>}
              <SelectItem value="educador">Educador</SelectItem>
              <SelectItem value="responsavel">Responsável</SelectItem>
              {secretariaEnabled && <SelectItem value="secretaria">Secretaria</SelectItem>}
              <SelectItem value="aluno">Aluno</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Papel</TableHead>
                {(isAdmin || isDiretor) && <TableHead>Status</TableHead>}
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={(isAdmin || isDiretor) ? 6 : 5} className="text-center py-8 text-muted-foreground">
                    Nenhum usuário encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.user_id} className={!user.ativo ? 'opacity-50' : ''}>
                    <TableCell className="font-medium">{user.nome}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.telefone || '—'}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="gap-1">
                        {ROLE_ICONS[user.role]}
                        {ROLE_LABELS[user.role]}
                      </Badge>
                    </TableCell>
                    {(isAdmin || isDiretor) && (
                      <TableCell>
                        {canToggleUser(user) ? (
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={user.ativo}
                              onCheckedChange={() => handleToggleAtivo(user)}
                            />
                            <span className="text-xs text-muted-foreground">
                              {user.ativo ? 'Ativo' : 'Inativo'}
                            </span>
                          </div>
                        ) : (
                          <Badge variant={user.ativo ? 'default' : 'outline'} className="text-xs">
                            {user.ativo ? 'Ativo' : 'Inativo'}
                          </Badge>
                        )}
                      </TableCell>
                    )}
                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(user)} title="Editar">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setResetTarget(user)} title="Resetar senha">
                        <KeyRound className="w-4 h-4" />
                      </Button>
                      {isAdmin && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeleteTarget(user)}
                          title="Excluir usuário"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="rounded-3xl">
          <DialogHeader>
            <DialogTitle>{editingUser ? 'Editar Usuário' : 'Novo Usuário'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Nome completo" required />
            </div>
            {!editingUser && (
              <>
                <div className="space-y-2">
                  <Label>Email *</Label>
                  <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@exemplo.com" required />
                </div>
                <div className="p-3 rounded-xl bg-muted/50 border border-border">
                  <p className="text-xs text-muted-foreground">
                    🔑 A senha padrão de primeiro acesso é <strong>fleur@2026</strong>. O usuário será solicitado a alterá-la no primeiro login.
                  </p>
                </div>
              </>
            )}
            {editingUser && (
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={form.email} disabled className="opacity-60" />
              </div>
            )}
            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} placeholder="(00) 00000-0000" />
            </div>
            <div className="space-y-2">
              <Label>Papel *</Label>
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o papel" />
                </SelectTrigger>
                <SelectContent>
                  {!isDiretor && <SelectItem value="admin">Administrador</SelectItem>}
                  {!isDiretor && <SelectItem value="diretor">Diretor(a)</SelectItem>}
                  <SelectItem value="educador">Educador</SelectItem>
                  <SelectItem value="responsavel">Responsável</SelectItem>
                  {secretariaEnabled && <SelectItem value="secretaria">Secretaria</SelectItem>}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Salvando...' : editingUser ? 'Salvar' : 'Cadastrar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!resetTarget} onOpenChange={(open) => !open && setResetTarget(null)}>
        <DialogContent className="rounded-3xl max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Resetar Senha
            </DialogTitle>
            <DialogDescription>
              A senha de <strong>{resetTarget?.nome}</strong> será redefinida para a senha padrão <strong>fleur@2026</strong>. No próximo login, será solicitada uma nova senha.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setResetTarget(null)} disabled={isResetting}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleResetPassword} disabled={isResetting}>
              {isResetting ? 'Resetando...' : 'Confirmar Reset'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Usuário</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir <strong>{deleteTarget?.nome}</strong> permanentemente? Todos os dados associados serão removidos. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
