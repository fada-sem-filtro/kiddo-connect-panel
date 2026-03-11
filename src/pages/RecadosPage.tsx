import { useState, useEffect, useCallback } from 'react';
import { Plus, MessageSquare, Users } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { RecadoThread } from '@/components/recados/RecadoThread';
import { RecadoModal } from '@/components/modals/RecadoModal';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface RecadoDb {
  id: string;
  titulo: string;
  conteudo: string;
  crianca_id: string | null;
  turma_id: string | null;
  remetente_user_id: string;
  parent_id: string | null;
  lido: boolean;
  created_at: string;
  updated_at: string;
  remetente_nome?: string;
  crianca_nome?: string;
  turma_nome?: string;
  respostas?: RecadoDb[];
}

export default function RecadosPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [filterTurma, setFilterTurma] = useState<string>('all');
  const [recados, setRecados] = useState<RecadoDb[]>([]);
  const [turmas, setTurmas] = useState<{ id: string; nome: string }[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecados = useCallback(async () => {
    // Fetch all recados (parents + children)
    const { data } = await supabase
      .from('recados')
      .select('*')
      .order('created_at', { ascending: false });

    const allRecados = (data || []) as unknown as RecadoDb[];

    // Get unique user ids, crianca ids, turma ids for enrichment
    const userIds = [...new Set(allRecados.map(r => r.remetente_user_id))];
    const criancaIds = [...new Set(allRecados.filter(r => r.crianca_id).map(r => r.crianca_id!))];
    const turmaIds = [...new Set(allRecados.filter(r => r.turma_id).map(r => r.turma_id!))];

    const [profilesRes, criancasRes, turmasRes] = await Promise.all([
      userIds.length > 0 ? supabase.from('profiles').select('user_id, nome').in('user_id', userIds) : { data: [] },
      criancaIds.length > 0 ? supabase.from('criancas').select('id, nome').in('id', criancaIds) : { data: [] },
      supabase.from('turmas').select('id, nome').order('nome'),
    ]);

    const profileMap = Object.fromEntries((profilesRes.data || []).map(p => [p.user_id, p.nome]));
    const criancaMap = Object.fromEntries((criancasRes.data || []).map(c => [c.id, c.nome]));
    const turmaMap = Object.fromEntries((turmasRes.data || []).map(t => [t.id, t.nome]));
    setTurmas(turmasRes.data || []);

    // Enrich and build tree
    const enriched = allRecados.map(r => ({
      ...r,
      remetente_nome: profileMap[r.remetente_user_id] || 'Usuário',
      crianca_nome: r.crianca_id ? criancaMap[r.crianca_id] : undefined,
      turma_nome: r.turma_id ? turmaMap[r.turma_id] : undefined,
    }));

    // Build parent-child tree
    const parents = enriched.filter(r => !r.parent_id);
    const children = enriched.filter(r => r.parent_id);
    parents.forEach(p => {
      p.respostas = children.filter(c => c.parent_id === p.id).sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
    });

    setRecados(parents);
    setLoading(false);
  }, []);

  useEffect(() => { fetchRecados(); }, [fetchRecados]);

  const filteredRecados = recados.filter(r => {
    if (filterTurma === 'all') return true;
    return r.turma_id === filterTurma;
  });

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <MessageSquare className="w-6 h-6 text-primary" />
              Recados
            </h1>
            <p className="text-muted-foreground">Comunicação com os responsáveis</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Select value={filterTurma} onValueChange={setFilterTurma}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Todas as turmas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as turmas</SelectItem>
                {turmas.map(t => (
                  <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={() => setIsModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Recado
            </Button>
            <Button variant="outline" onClick={() => setIsBulkModalOpen(true)}>
              <Users className="w-4 h-4 mr-2" />
              Recado p/ Turma
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          {loading ? (
            <p className="text-center text-muted-foreground py-8">Carregando...</p>
          ) : filteredRecados.length === 0 ? (
            <div className="bg-card rounded-2xl border border-border p-8 text-center">
              <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">Nenhum recado encontrado</p>
            </div>
          ) : (
            filteredRecados.map(recado => (
              <RecadoThread key={recado.id} recado={recado} onChanged={fetchRecados} />
            ))
          )}
        </div>
      </div>

      <RecadoModal open={isModalOpen} onOpenChange={setIsModalOpen} mode="individual" onSaved={fetchRecados} />
      <RecadoModal open={isBulkModalOpen} onOpenChange={setIsBulkModalOpen} mode="turma" onSaved={fetchRecados} />
    </MainLayout>
  );
}
