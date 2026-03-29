import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { EventDbModal } from '@/components/modals/EventDbModal';
import { usePresencas } from '@/hooks/usePresencas';
import { PickupModal } from '@/components/modals/PickupModal';
import { Users, Plus, LogIn, LogOut, Clock, CheckCircle2, XCircle, UserCheck } from 'lucide-react';
import { EVENT_TYPE_LABELS, EVENT_TYPE_ICONS, EventType, isTurmaFundamental } from '@/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface TurmaInfo { id: string; nome: string; faixa_etaria: string | null; }
interface CriancaInfo { id: string; nome: string; data_nascimento: string; turma_id: string; observacoes: string | null; }
interface EventoInfo { id: string; tipo: string; crianca_id: string; }
interface ResponsavelInfo { crianca_id: string; nome: string; telefone: string | null; }

export default function EducadorDashboardPage() {
  const { user, profile } = useAuth();
  const [turmas, setTurmas] = useState<TurmaInfo[]>([]);
  const [criancas, setCriancas] = useState<CriancaInfo[]>([]);
  const [eventosHoje, setEventosHoje] = useState<EventoInfo[]>([]);
  const [responsaveis, setResponsaveis] = useState<ResponsavelInfo[]>([]);
  const [selectedTurmaId, setSelectedTurmaId] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [eventMode, setEventMode] = useState<'individual' | 'turma'>('individual');
  const [selectedCriancaId, setSelectedCriancaId] = useState<string | undefined>();
  const [selectedTurmaForEvent, setSelectedTurmaForEvent] = useState<string | undefined>();
  const [pickupCrianca, setPickupCrianca] = useState<{ id: string; nome: string; turma_nome: string } | null>(null);
  const [pickupLoading, setPickupLoading] = useState(false);
  const today = new Date();
  const { presencas, marcarPresenca, registrarSaida, getPresenca } = usePresencas(today);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);

    const { data: assignments } = await supabase
      .from('turma_educadores')
      .select('turma_id, turmas(id, nome, faixa_etaria)')
      .eq('educador_user_id', user.id);

    const turmasList: TurmaInfo[] = assignments?.map((a: any) => ({
      id: a.turmas.id,
      nome: a.turmas.nome,
      faixa_etaria: a.turmas.faixa_etaria,
    })) || [];
    setTurmas(turmasList);

    if (turmasList.length === 0) {
      setCriancas([]);
      setEventosHoje([]);
      setLoading(false);
      return;
    }

    const turmaIds = turmasList.map(t => t.id);
    const { data: criancasData } = await supabase
      .from('criancas')
      .select('id, nome, data_nascimento, turma_id, observacoes')
      .in('turma_id', turmaIds)
      .order('nome');
    setCriancas(criancasData || []);

    const hoje = new Date();
    const start = new Date(hoje); start.setHours(0, 0, 0, 0);
    const end = new Date(hoje); end.setHours(23, 59, 59, 999);

    const criancaIds = (criancasData || []).map(c => c.id);
    if (criancaIds.length > 0) {
      const { data: eventosData } = await supabase
        .from('eventos')
        .select('id, tipo, crianca_id')
        .in('crianca_id', criancaIds)
        .gte('data_inicio', start.toISOString())
        .lte('data_inicio', end.toISOString());
      setEventosHoje(eventosData || []);

      // Fetch responsáveis vinculados
      const { data: vinculos } = await supabase
        .from('crianca_responsaveis')
        .select('crianca_id, responsavel_user_id')
        .in('crianca_id', criancaIds);

      if (vinculos && vinculos.length > 0) {
        const userIds = [...new Set(vinculos.map(v => v.responsavel_user_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, nome, telefone')
          .in('user_id', userIds);

        const profileMap = new Map((profiles || []).map(p => [p.user_id, { nome: p.nome, telefone: p.telefone }]));
        setResponsaveis(vinculos.map(v => ({
          crianca_id: v.crianca_id,
          nome: profileMap.get(v.responsavel_user_id)?.nome || 'Responsável',
          telefone: profileMap.get(v.responsavel_user_id)?.telefone || null,
        })));
      } else {
        setResponsaveis([]);
      }
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [user]);

  const criancasFiltradas = selectedTurmaId === 'all'
    ? criancas
    : criancas.filter(c => c.turma_id === selectedTurmaId);

  const handleMarcarPresenca = async (criancaId: string) => {
    const { error } = await marcarPresenca(criancaId);
    if (error) toast.error('Erro ao marcar presença');
    else toast.success('Presença registrada! ✅');
  };

  const handleRegistrarSaida = (criancaId: string) => {
    const crianca = criancas.find(c => c.id === criancaId);
    if (!crianca) return;
    setPickupCrianca({
      id: crianca.id,
      nome: crianca.nome,
      turma_nome: getTurmaNome(crianca.turma_id),
    });
  };

  const handlePickupConfirm = async (person: { id: string; nome: string; tipo: 'responsável' | 'autorizado' }) => {
    if (!pickupCrianca || !profile) return;
    setPickupLoading(true);
    const realId = person.id.replace(/^(resp_|aut_)/, '');
    const { error } = await registrarSaida(pickupCrianca.id, {
      pickup_person_id: realId,
      pickup_person_name: person.nome,
      pickup_person_type: person.tipo,
      pickup_registered_by: profile.nome,
    });
    setPickupLoading(false);
    if (error) toast.error('Erro ao registrar saída');
    else toast.success(`Saída registrada! Buscado por: ${person.nome} 👋`);
    setPickupCrianca(null);
  };

  const handleAddEvento = (criancaId: string) => {
    setSelectedCriancaId(criancaId);
    setEventMode('individual');
    setEventModalOpen(true);
  };

  const getInitials = (nome: string) =>
    nome.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  const getTurmaNome = (turmaId: string) =>
    turmas.find(t => t.id === turmaId)?.nome || '';

  const isCriancaFundamental = (criancaId: string) => {
    const crianca = criancas.find(c => c.id === criancaId);
    if (!crianca) return false;
    const turma = turmas.find(t => t.id === crianca.turma_id);
    return isTurmaFundamental(turma?.faixa_etaria);
  };

  const getEventosCount = (criancaId: string) =>
    eventosHoje.filter(e => e.crianca_id === criancaId).length;

  const getResponsaveis = (criancaId: string) =>
    responsaveis.filter(r => r.crianca_id === criancaId);

  // Summary counts
  const totalAlunos = criancasFiltradas.length;
  const presentes = criancasFiltradas.filter(c => getPresenca(c.id)?.status === 'presente').length;
  const sairam = criancasFiltradas.filter(c => getPresenca(c.id)?.status === 'saiu').length;
  const ausentes = totalAlunos - presentes - sairam;

  const getStatusBadge = (criancaId: string) => {
    const p = getPresenca(criancaId);
    if (!p || p.status === 'ausente') {
      return <Badge variant="outline" className="rounded-xl bg-muted text-muted-foreground border-border"><XCircle className="w-3 h-3 mr-1" /> Ausente</Badge>;
    }
    if (p.status === 'presente') {
      return <Badge className="rounded-xl bg-[hsl(var(--success))] text-[hsl(var(--success-foreground))]"><CheckCircle2 className="w-3 h-3 mr-1" /> Presente</Badge>;
    }
    return <Badge variant="secondary" className="rounded-xl"><LogOut className="w-3 h-3 mr-1" /> Saiu</Badge>;
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Painel do Educador</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {format(today, "EEEE, dd 'de' MMMM", { locale: ptBR })} • {profile?.nome}
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-2 sm:gap-4">
          <Card className="rounded-xl sm:rounded-2xl border-2 border-border">
            <CardContent className="p-2 sm:p-4 text-center">
              <Users className="w-4 h-4 sm:w-6 sm:h-6 mx-auto text-primary mb-1" />
              <p className="text-lg sm:text-2xl font-bold text-foreground">{totalAlunos}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Total</p>
            </CardContent>
          </Card>
          <Card className="rounded-xl sm:rounded-2xl border-2 border-[hsl(var(--success))]/30">
            <CardContent className="p-2 sm:p-4 text-center">
              <CheckCircle2 className="w-4 h-4 sm:w-6 sm:h-6 mx-auto text-[hsl(var(--success))] mb-1" />
              <p className="text-lg sm:text-2xl font-bold text-foreground">{presentes}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Presentes</p>
            </CardContent>
          </Card>
          <Card className="rounded-xl sm:rounded-2xl border-2 border-border">
            <CardContent className="p-2 sm:p-4 text-center">
              <XCircle className="w-4 h-4 sm:w-6 sm:h-6 mx-auto text-muted-foreground mb-1" />
              <p className="text-lg sm:text-2xl font-bold text-foreground">{ausentes}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Ausentes</p>
            </CardContent>
          </Card>
          <Card className="rounded-xl sm:rounded-2xl border-2 border-secondary">
            <CardContent className="p-2 sm:p-4 text-center">
              <LogOut className="w-4 h-4 sm:w-6 sm:h-6 mx-auto text-secondary-foreground mb-1" />
              <p className="text-lg sm:text-2xl font-bold text-foreground">{sairam}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Saíram</p>
            </CardContent>
          </Card>
        </div>

        {/* Turma filter */}
        {turmas.length > 1 && (
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <Button variant={selectedTurmaId === 'all' ? 'default' : 'outline'} size="sm" className="rounded-2xl text-xs sm:text-sm" onClick={() => setSelectedTurmaId('all')}>
              Todas ({criancas.length})
            </Button>
            {turmas.map(turma => (
              <Button key={turma.id} variant={selectedTurmaId === turma.id ? 'default' : 'outline'} size="sm" className="rounded-2xl text-xs sm:text-sm" onClick={() => setSelectedTurmaId(turma.id)}>
                {turma.nome} ({criancas.filter(c => c.turma_id === turma.id).length})
              </Button>
            ))}
          </div>
        )}

        {/* Student List */}
        {turmas.length === 0 ? (
          <Card className="border-2 border-dashed border-muted-foreground/30 rounded-3xl">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="w-16 h-16 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">Você ainda não foi vinculado(a) a nenhuma turma</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {criancasFiltradas.map((crianca) => {
              const p = getPresenca(crianca.id);
              const status = p?.status || 'ausente';

              return (
                <Card key={crianca.id} className="rounded-2xl border-2 border-border hover:border-primary/30 transition-all">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-start sm:items-center gap-3 sm:gap-4 flex-col sm:flex-row">
                      {/* Top row: Avatar + Info */}
                      <div className="flex items-center gap-3 w-full sm:w-auto sm:flex-1 min-w-0">
                        <Avatar className="w-10 h-10 sm:w-12 sm:h-12 border-2 border-primary/20 shrink-0">
                          <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20 text-primary font-bold text-sm">
                            {getInitials(crianca.nome)}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-bold text-foreground truncate text-sm sm:text-base">{crianca.nome}</h3>
                            {getStatusBadge(crianca.id)}
                          </div>
                          <div className="flex items-center gap-2 sm:gap-3 text-[11px] sm:text-xs text-muted-foreground mt-1 flex-wrap">
                            <span>{getTurmaNome(crianca.turma_id)}</span>
                            {p?.hora_chegada && (
                              <span className="flex items-center gap-1">
                                <LogIn className="w-3 h-3" />
                                {format(new Date(p.hora_chegada), 'HH:mm')}
                              </span>
                            )}
                            {p?.hora_saida && (
                              <span className="flex items-center gap-1">
                                <LogOut className="w-3 h-3" />
                                {format(new Date(p.hora_saida), 'HH:mm')}
                              </span>
                            )}
                            {p?.pickup_person_name && (
                              <span className="flex items-center gap-1 text-primary font-medium">
                                👤 {p.pickup_person_name}
                              </span>
                            )}
                            {getEventosCount(crianca.id) > 0 && (
                              <span>📋 {getEventosCount(crianca.id)}</span>
                            )}
                          </div>
                          {getResponsaveis(crianca.id).length > 0 && (
                            <div className="text-[10px] sm:text-xs text-muted-foreground mt-1 truncate">
                              👨‍👩‍👧 {getResponsaveis(crianca.id).map(r => 
                                r.telefone ? `${r.nome} (${r.telefone})` : r.nome
                              ).join(' • ')}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 w-full sm:w-auto shrink-0">
                        {status === 'ausente' && !isCriancaFundamental(crianca.id) && (
                          <Button
                            className="rounded-2xl bg-[hsl(var(--success))] hover:bg-[hsl(var(--success))]/90 text-[hsl(var(--success-foreground))] font-bold h-10 sm:h-12 flex-1 sm:flex-none sm:min-w-[120px]"
                            onClick={() => handleMarcarPresenca(crianca.id)}
                          >
                            <UserCheck className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
                            Presente
                          </Button>
                        )}
                        {status === 'presente' && !isCriancaFundamental(crianca.id) && (
                          <>
                            <Button
                              variant="outline"
                              className="rounded-2xl font-bold h-10 sm:h-12 flex-1 sm:flex-none sm:min-w-[100px]"
                              onClick={() => handleRegistrarSaida(crianca.id)}
                            >
                              <LogOut className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
                              Saída
                            </Button>
                            <Button
                              className="rounded-2xl font-bold h-10 sm:h-12 flex-1 sm:flex-none"
                              onClick={() => handleAddEvento(crianca.id)}
                            >
                              <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
                              Evento
                            </Button>
                          </>
                        )}
                        {status === 'saiu' && !isCriancaFundamental(crianca.id) && (
                          <Button
                            variant="ghost"
                            className="rounded-2xl font-bold h-10 sm:h-12 flex-1 sm:flex-none"
                            onClick={() => handleAddEvento(crianca.id)}
                          >
                            <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
                            Evento
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <EventDbModal
        open={eventModalOpen}
        onOpenChange={setEventModalOpen}
        mode={eventMode}
        preSelectedCriancaId={selectedCriancaId}
        preSelectedTurmaId={selectedTurmaForEvent}
        criancas={criancasFiltradas.map(c => ({ id: c.id, nome: c.nome }))}
        turmas={turmas}
        onSaved={fetchData}
      />

      <PickupModal
        open={!!pickupCrianca}
        onOpenChange={(open) => !open && setPickupCrianca(null)}
        crianca={pickupCrianca}
        onConfirm={handlePickupConfirm}
        loading={pickupLoading}
      />
    </MainLayout>
  );
}
