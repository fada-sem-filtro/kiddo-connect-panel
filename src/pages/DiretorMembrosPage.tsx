import { useState, useEffect } from "react";
import { Search, Users, GraduationCap, UserCheck } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface MemberInfo {
  user_id: string;
  nome: string;
  email: string;
  telefone: string | null;
  role: string;
  creche_nome?: string;
}

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrador",
  diretor: "Diretor(a)",
  educador: "Educador(a)",
  responsavel: "Responsável",
};

const ROLE_ICONS: Record<string, React.ReactNode> = {
  diretor: <GraduationCap className="w-3 h-3" />,
  educador: <GraduationCap className="w-3 h-3" />,
  responsavel: <UserCheck className="w-3 h-3" />,
};

export default function DiretorMembrosPage() {
  const { userCreche, role } = useAuth();
  const isAdmin = role === "admin";
  const [members, setMembers] = useState<MemberInfo[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin && !userCreche) return;

    const fetchMembers = async () => {
      setLoading(true);

      let membrosQuery = supabase.from("creche_membros").select("user_id, creches(nome)");

      if (!isAdmin && userCreche) {
        membrosQuery = membrosQuery.eq("creche_id", userCreche.id);
      }

      const { data: membros } = await membrosQuery;

      if (!membros || membros.length === 0) {
        setMembers([]);
        setLoading(false);
        return;
      }

      const userIds = [...new Set(membros.map((m) => m.user_id))];

      const [{ data: profiles }, { data: roles }] = await Promise.all([
        supabase.from("profiles").select("user_id, nome, email, telefone").in("user_id", userIds),
        supabase.from("user_roles").select("user_id, role").in("user_id", userIds),
      ]);

      if (profiles) {
        const userCrecheMap = new Map<string, string[]>();
        membros.forEach((m: any) => {
          const crecheName = m.creches?.nome || "Sem escola";
          const existing = userCrecheMap.get(m.user_id) || [];
          if (!existing.includes(crecheName)) existing.push(crecheName);
          userCrecheMap.set(m.user_id, existing);
        });

        const memberList: MemberInfo[] = profiles
          .map((p) => {
            const userRole = roles?.find((r) => r.user_id === p.user_id);
            return {
              user_id: p.user_id,
              nome: p.nome,
              email: p.email,
              telefone: p.telefone,
              role: userRole?.role || "responsavel",
              creche_nome: userCrecheMap.get(p.user_id)?.join(", "),
            };
          })
          // Show only educadores and diretores (and admin for admin view)
          .filter((m) => {
            if (isAdmin) return m.role === "admin" || m.role === "diretor" || m.role === "educador";
            return m.role === "diretor" || m.role === "educador";
          });

        setMembers(memberList);
      }

      setLoading(false);
    };

    fetchMembers();
  }, [userCreche, isAdmin]);

  const filteredMembers = members.filter(
    (m) => m.nome.toLowerCase().includes(search.toLowerCase()) || m.email.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" />
            {isAdmin ? "Corpo Docente — Todas as Escolas" : "Corpo Docente da Escola"}
          </h1>
          <p className="text-muted-foreground">
            {isAdmin
              ? "Educadores e diretores vinculados às escolas do sistema"
              : `Educadores e diretores vinculados à ${userCreche?.nome || "sua escola"}`}
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
                {isAdmin && <TableHead>Escola</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 5 : 4} className="text-center py-8 text-muted-foreground">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : filteredMembers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 5 : 4} className="text-center py-8 text-muted-foreground">
                    Nenhum membro encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filteredMembers.map((member) => (
                  <TableRow key={member.user_id}>
                    <TableCell className="font-medium">{member.nome}</TableCell>
                    <TableCell>{member.email}</TableCell>
                    <TableCell>{member.telefone || "—"}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="gap-1">
                        {ROLE_ICONS[member.role]}
                        {ROLE_LABELS[member.role] || member.role}
                      </Badge>
                    </TableCell>
                    {isAdmin && (
                      <TableCell>
                        <Badge variant="outline">{member.creche_nome}</Badge>
                      </TableCell>
                    )}
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
