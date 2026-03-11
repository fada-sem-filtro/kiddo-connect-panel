import { useState, useEffect } from 'react';
import { Plus, Search, Users, Shield, GraduationCap, UserCheck, Edit, KeyRound, AlertTriangle } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
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
  role: 'admin' | 'educador' | 'responsavel';
  created_at: string;
}

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador',
  educador: 'Educador',
  responsavel: 'Responsável',
};

const ROLE_ICONS: Record<string, React.ReactNode> = {
  admin: <Shield className="w-3 h-3" />,
  educador: <GraduationCap className="w-3 h-3" />,
  responsavel: <UserCheck className="w-3 h-3" />,
};

export default function UsuariosPage() {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editingUser, setEditingUser] = useState<UserWithRole | null>(null);
  const [resetTarget, setResetTarget] = useState<UserWithRole | null>(null);
  const [isResetting, setIsResetting] = useState(false);
  const [form, setForm] = useState({
    nome: '', email: '', password: '', telefone: '', role: '' as string,
  });

  const fetchUsers = async () => {
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
        };
      });
      setUsers(usersWithRoles);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter((u) =>
    u.nome.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

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

    // Update profile
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

    // Update role if changed
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

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Papel</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Nenhum usuário encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.user_id}>
                    <TableCell className="font-medium">{user.nome}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.telefone || '—'}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="gap-1">
                        {ROLE_ICONS[user.role]}
                        {ROLE_LABELS[user.role]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(user)} title="Editar">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setResetTarget(user)} title="Resetar senha">
                        <KeyRound className="w-4 h-4" />
                      </Button>
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
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="educador">Educador</SelectItem>
                  <SelectItem value="responsavel">Responsável</SelectItem>
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
    </MainLayout>
  );
}
