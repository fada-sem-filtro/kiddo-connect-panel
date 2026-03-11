import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Eye, GraduationCap } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';

interface EducadorDb {
  user_id: string;
  nome: string;
  email: string;
  telefone: string | null;
  turmas: { id: string; nome: string }[];
}

export default function EducadoresPage() {
  const [search, setSearch] = useState('');
  const [educadores, setEducadores] = useState<EducadorDb[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEducadores = useCallback(async () => {
    setLoading(true);
    // Get all users with educador role
    const { data: roles } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'educador');

    if (!roles || roles.length === 0) {
      setEducadores([]);
      setLoading(false);
      return;
    }

    const userIds = roles.map(r => r.user_id);

    // Get profiles
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, nome, email, telefone')
      .in('user_id', userIds);

    // Get turma assignments
    const { data: assignments } = await supabase
      .from('turma_educadores')
      .select('educador_user_id, turma_id, turmas(id, nome)')
      .in('educador_user_id', userIds);

    const educadorList: EducadorDb[] = (profiles || []).map(p => ({
      user_id: p.user_id,
      nome: p.nome,
      email: p.email,
      telefone: p.telefone,
      turmas: (assignments || [])
        .filter(a => a.educador_user_id === p.user_id)
        .map(a => {
          const t = a.turmas as any;
          return { id: t?.id || a.turma_id, nome: t?.nome || 'Turma' };
        }),
    }));

    setEducadores(educadorList);
    setLoading(false);
  }, []);

  useEffect(() => { fetchEducadores(); }, [fetchEducadores]);

  const filtered = educadores.filter(e =>
    e.nome.toLowerCase().includes(search.toLowerCase()) ||
    e.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <GraduationCap className="w-6 h-6 text-primary" />
              Educadores
            </h1>
            <p className="text-muted-foreground">Equipe de educadores cadastrados no sistema</p>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar educador..."
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
                <TableHead>Turmas</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    Nenhum educador encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((educador) => (
                  <TableRow key={educador.user_id} className="animate-fade-in">
                    <TableCell className="font-medium">{educador.nome}</TableCell>
                    <TableCell>{educador.email}</TableCell>
                    <TableCell>{educador.telefone || '—'}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {educador.turmas.length === 0 ? (
                          <Badge variant="outline">Sem turma</Badge>
                        ) : (
                          educador.turmas.map(t => (
                            <Badge key={t.id} variant="secondary">{t.nome}</Badge>
                          ))
                        )}
                      </div>
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
