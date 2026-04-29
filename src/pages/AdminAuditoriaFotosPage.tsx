import { useEffect, useState } from 'react';
import { ShieldCheck, Eye, Upload, Pencil, Trash2, RefreshCw, Filter } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

type Action = 'view' | 'upload' | 'update' | 'delete';

interface AuditRow {
  id: string;
  user_id: string | null;
  user_email: string | null;
  user_role: string | null;
  crianca_id: string;
  authorized_pickup_id: string | null;
  action: Action;
  foto_path: string | null;
  created_at: string;
}

interface Enriched extends AuditRow {
  crianca_nome?: string;
  pickup_nome?: string;
}

const ACTION_META: Record<Action, { label: string; color: string; icon: typeof Eye }> = {
  view: { label: 'Visualizou', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: Eye },
  upload: { label: 'Enviou', color: 'bg-green-100 text-green-800 border-green-200', icon: Upload },
  update: { label: 'Alterou', color: 'bg-amber-100 text-amber-800 border-amber-200', icon: Pencil },
  delete: { label: 'Removeu', color: 'bg-red-100 text-red-800 border-red-200', icon: Trash2 },
};

export default function AdminAuditoriaFotosPage() {
  const [rows, setRows] = useState<Enriched[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  const fetchAudit = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('pickup_photo_audit')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500);

    if (error) {
      toast.error('Erro ao carregar auditoria');
      setLoading(false);
      return;
    }

    const list = (data || []) as AuditRow[];

    const criancaIds = Array.from(new Set(list.map(r => r.crianca_id).filter(Boolean)));
    const pickupIds = Array.from(new Set(list.map(r => r.authorized_pickup_id).filter((v): v is string => !!v)));

    const [criancasRes, pickupsRes] = await Promise.all([
      criancaIds.length
        ? supabase.from('criancas').select('id, nome').in('id', criancaIds)
        : Promise.resolve({ data: [] as { id: string; nome: string }[] }),
      pickupIds.length
        ? supabase.from('authorized_pickups').select('id, nome').in('id', pickupIds)
        : Promise.resolve({ data: [] as { id: string; nome: string }[] }),
    ]);

    const cMap = new Map((criancasRes.data || []).map(c => [c.id, c.nome]));
    const pMap = new Map((pickupsRes.data || []).map(p => [p.id, p.nome]));

    setRows(
      list.map(r => ({
        ...r,
        crianca_nome: cMap.get(r.crianca_id),
        pickup_nome: r.authorized_pickup_id ? pMap.get(r.authorized_pickup_id) : undefined,
      }))
    );
    setLoading(false);
  };

  useEffect(() => {
    fetchAudit();
  }, []);

  const filtered = rows.filter(r => {
    if (actionFilter !== 'all' && r.action !== actionFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const hay = [
        r.user_email, r.user_role, r.crianca_nome, r.pickup_nome,
        r.foto_path, r.user_id, r.crianca_id,
      ].join(' ').toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  return (
    <MainLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-primary" />
              Auditoria — Fotos de Autorizados
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Registros de visualização, envio, alteração e remoção das fotos das pessoas autorizadas a retirar alunos.
            </p>
          </div>
          <Button variant="outline" onClick={fetchAudit} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>

        <Card>
          <CardContent className="p-4 flex flex-wrap gap-3 items-center">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Ação" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as ações</SelectItem>
                  <SelectItem value="view">Visualizações</SelectItem>
                  <SelectItem value="upload">Envios</SelectItem>
                  <SelectItem value="update">Alterações</SelectItem>
                  <SelectItem value="delete">Remoções</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Input
              placeholder="Buscar por usuário, aluno, autorizado, ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-md"
            />
            <span className="text-sm text-muted-foreground ml-auto">
              {filtered.length} registro(s)
            </span>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[170px]">Quando</TableHead>
                  <TableHead className="w-[130px]">Ação</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Aluno</TableHead>
                  <TableHead>Pessoa autorizada</TableHead>
                  <TableHead>Arquivo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                      Carregando...
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                      Nenhum registro encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((r) => {
                    const meta = ACTION_META[r.action];
                    const Icon = meta.icon;
                    return (
                      <TableRow key={r.id}>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {format(new Date(r.created_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`gap-1 ${meta.color}`}>
                            <Icon className="w-3 h-3" />
                            {meta.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm font-medium">{r.user_email || '—'}</div>
                          <div className="text-xs text-muted-foreground">
                            {r.user_role || 'sem perfil'} · <span className="font-mono">{r.user_id?.slice(0, 8) || '—'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{r.crianca_nome || '—'}</div>
                          <div className="text-xs font-mono text-muted-foreground">{r.crianca_id.slice(0, 8)}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{r.pickup_nome || '—'}</div>
                          {r.authorized_pickup_id && (
                            <div className="text-xs font-mono text-muted-foreground">
                              {r.authorized_pickup_id.slice(0, 8)}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-xs font-mono text-muted-foreground break-all max-w-[260px]">
                          {r.foto_path || '—'}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
