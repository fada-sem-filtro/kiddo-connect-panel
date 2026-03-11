import { useState, useEffect } from 'react';
import { Search, Users, GraduationCap, UserCheck } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface MemberInfo {
  user_id: string;
  nome: string;
  email: string;
  telefone: string | null;
  role: string;
}

const ROLE_LABELS: Record<string, string> = {
  diretor: 'Diretor(a)',
  educador: 'Educador(a)',
  responsavel: 'Responsável',
};

const ROLE_ICONS: Record<string, React.ReactNode> = {
  educador: <GraduationCap className="w-3 h-3" />,
  responsavel: <UserCheck className="w-3 h-3" />,
};

export default function DiretorMembrosPage() {
  const { userCreche } = useAuth();
  const [members, setMembers] = useState<MemberInfo[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userCreche) return;

    const fetchMembers = async () => {
      setLoading(true);

      // Get all members of this creche
      const { data: membros } = await supabase
        .from('creche_membros')
        .select('user_id, is_diretor')
        .eq('creche_id', userCreche.id);

      if (!membros || membros.length === 0) {
        setMembers([]);
        setLoading(false);
        return;
      }

      const userIds = membros.map((m) => m.user_id);

      // Fetch profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, nome, email, telefone')
        .in('user_id', userIds);

      // Fetch roles
      const { data: roles } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('user_id', userIds);

      if (profiles) {
        const memberList: MemberInfo[] = profiles
          .map((p) => {
            const userRole = roles?.find((r) => r.user_id === p.user_id);
            const membro = membros.find((m) => m.user_id === p.user_id);
            return {
              user_id: p.user_id,
              nome: p.nome,
              email: p.email,
              telefone: p.telefone,
              role: userRole?.role || 'responsavel',
              is_diretor: membro?.is_diretor || false,
            };
          })
          // Filter out admins
          .filter((m) => m.role !== 'admin');

        setMembers(memberList);
      }

      setLoading(false);
    };

    fetchMembers();
  }, [userCreche]);

  const filteredMembers = members.filter(
    (m) =>
      m.nome.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" />
            Membros da Creche
          </h1>
          <p className="text-muted-foreground">
            Educadores e responsáveis vinculados à {userCreche?.nome || 'sua creche'}
          </p>
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
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : filteredMembers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    Nenhum membro encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filteredMembers.map((member) => (
                  <TableRow key={member.user_id}>
                    <TableCell className="font-medium">
                      {member.nome}
                      {member.is_diretor && (
                        <Badge variant="outline" className="ml-2 text-xs">
                          Diretor(a)
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{member.email}</TableCell>
                    <TableCell>{member.telefone || '—'}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="gap-1">
                        {ROLE_ICONS[member.role]}
                        {ROLE_LABELS[member.role] || member.role}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </MainLayout>
  );
}
