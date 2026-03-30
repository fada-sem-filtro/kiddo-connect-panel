import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, RefreshCw, Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAdminSchoolSelector, AdminSchoolSelector } from '@/components/admin/AdminSchoolSelector';
import { usePermissoesPerfil, MODULOS, PERFIS } from '@/hooks/usePermissoesPerfil';

export default function PermissoesPerfilPage() {
  const { effectiveCrecheId, selectedCrecheId, setSelectedCrecheId, creches, isAdmin } = useAdminSchoolSelector();
  const { role } = useAuth();
  const isDiretor = role === 'diretor';
  const { permissoes, loading, getPermissao, upsertPermissao, initializeDefaults, refetch } = usePermissoesPerfil(effectiveCrecheId);
  const visiblePerfis = isDiretor ? PERFIS.filter(p => p.key === 'secretaria') : PERFIS;
  const [activePerfil, setActivePerfil] = useState(isDiretor ? 'secretaria' : 'diretor');
  const [initializing, setInitializing] = useState(false);
  const [settingDefault, setSettingDefault] = useState(false);
  const TEMPLATE_CRECHE_ID = '00000000-0000-0000-0000-000000000001';

  const handleToggle = async (modulo: string, field: 'pode_visualizar' | 'pode_criar' | 'pode_editar' | 'pode_excluir', value: boolean) => {
    const updates: Record<string, boolean> = { [field]: value };
    // If disabling visualizar, disable all actions
    if (field === 'pode_visualizar' && !value) {
      updates.pode_criar = false;
      updates.pode_editar = false;
      updates.pode_excluir = false;
    }
    await upsertPermissao(activePerfil, modulo, updates);
    toast.success('Permissão atualizada');
  };

  const handleInitDefaults = async () => {
    setInitializing(true);
    await initializeDefaults();
    setInitializing(false);
    toast.success('Permissões padrão inicializadas');
  };

  const handleSetAsDefault = async () => {
    if (!effectiveCrecheId) return;
    setSettingDefault(true);
    // Delete existing template permissions
    await supabase.from('permissoes_perfil').delete().eq('creche_id', TEMPLATE_CRECHE_ID);
    // Copy current school's permissions as template
    const templatePerms = permissoes.map(p => ({
      creche_id: TEMPLATE_CRECHE_ID,
      perfil: p.perfil,
      modulo: p.modulo,
      pode_visualizar: p.pode_visualizar,
      pode_criar: p.pode_criar,
      pode_editar: p.pode_editar,
      pode_excluir: p.pode_excluir,
    }));
    if (templatePerms.length > 0) {
      await supabase.from('permissoes_perfil').insert(templatePerms);
    }
    setSettingDefault(false);
    toast.success('Padrão definido! Novas escolas usarão estas permissões ao inicializar.');
  };

  const handleLoadFromDefault = async () => {
    if (!effectiveCrecheId) return;
    setSettingDefault(true);
    const { data: templatePerms } = await supabase
      .from('permissoes_perfil')
      .select('*')
      .eq('creche_id', TEMPLATE_CRECHE_ID);
    if (!templatePerms || templatePerms.length === 0) {
      toast.info('Nenhum padrão personalizado encontrado.');
      setSettingDefault(false);
      return;
    }
    // Delete current school's permissions and insert from template
    await supabase.from('permissoes_perfil').delete().eq('creche_id', effectiveCrecheId);
    const newPerms = templatePerms.map(p => ({
      creche_id: effectiveCrecheId,
      perfil: p.perfil,
      modulo: p.modulo,
      pode_visualizar: p.pode_visualizar,
      pode_criar: p.pode_criar,
      pode_editar: p.pode_editar,
      pode_excluir: p.pode_excluir,
    }));
    await supabase.from('permissoes_perfil').insert(newPerms);
    await refetch();
    setSettingDefault(false);
    toast.success('Permissões carregadas do padrão');
  };

  const currentModulos = MODULOS.filter(m => {
    if (activePerfil === 'aluno') {
      return ['dashboard', 'atividades', 'notas', 'grade_aulas', 'calendario'].includes(m.key);
    }
    if (activePerfil === 'responsavel') {
      return ['recados', 'eventos', 'calendario', 'boletim', 'relatorio_desempenho', 'grade_aulas', 'atividades_aluno'].includes(m.key);
    }
    if (activePerfil === 'educador') {
      return ['painel_educador', 'minha_turma', 'recados', 'presencas', 'eventos', 'boletim', 'grade_aulas', 'relatorio_desempenho', 'agenda_educador', 'atividades_pedagogicas'].includes(m.key);
    }
    if (activePerfil === 'secretaria') {
      return ['dashboard', 'recados', 'turmas', 'alunos', 'usuarios', 'calendario', 'relatorios', 'feriados', 'presencas', 'eventos', 'boletim', 'grade_aulas', 'materias', 'atividades_pedagogicas', 'membros'].includes(m.key);
    }
    // diretor sees all
    return true;
  });

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Shield className="w-6 h-6 text-primary" />
              Permissões por Perfil
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Configure o que cada perfil pode visualizar e fazer por escola</p>
          </div>
        </div>

        {isAdmin && <AdminSchoolSelector selectedCrecheId={selectedCrecheId} setSelectedCrecheId={setSelectedCrecheId} creches={creches} />}

        {!effectiveCrecheId ? (
          <Card className="border-2 border-dashed border-muted-foreground/30 rounded-3xl">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Shield className="w-16 h-16 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">Selecione uma escola para configurar permissões</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
              <Button variant="outline" className="rounded-xl" onClick={handleLoadFromDefault} disabled={settingDefault}>
                <Star className={`w-4 h-4 mr-2`} />
                Carregar Padrão
              </Button>
              <Button variant="outline" className="rounded-xl border-primary text-primary hover:bg-primary/10" onClick={handleSetAsDefault} disabled={settingDefault}>
                <Star className={`w-4 h-4 mr-2`} />
                Definir Padrão
              </Button>
              <Button variant="outline" className="rounded-xl" onClick={handleInitDefaults} disabled={initializing}>
                <RefreshCw className={`w-4 h-4 mr-2 ${initializing ? 'animate-spin' : ''}`} />
                Inicializar Padrões
              </Button>
              <span className="text-xs text-muted-foreground">Cria permissões padrão para perfis que ainda não possuem configuração</span>
            </div>

            <Tabs value={activePerfil} onValueChange={setActivePerfil}>
              <TabsList className="rounded-xl">
                {visiblePerfis.map(p => (
                  <TabsTrigger key={p.key} value={p.key} className="rounded-lg">
                    {p.label}
                  </TabsTrigger>
                ))}
              </TabsList>

              {PERFIS.map(perfil => (
                <TabsContent key={perfil.key} value={perfil.key} className="mt-4">
                  <Card className="rounded-2xl border-2 border-border">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        Módulos do {perfil.label}
                        <Badge variant="secondary" className="rounded-xl text-xs">
                          {currentModulos.filter(m => getPermissao(perfil.key, m.key)?.pode_visualizar).length}/{currentModulos.length} ativos
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-border">
                              <th className="text-left py-3 px-2 font-semibold text-muted-foreground">Módulo</th>
                              <th className="text-center py-3 px-2 font-semibold text-muted-foreground">Visualizar</th>
                              <th className="text-center py-3 px-2 font-semibold text-muted-foreground">Criar</th>
                              <th className="text-center py-3 px-2 font-semibold text-muted-foreground">Editar</th>
                              <th className="text-center py-3 px-2 font-semibold text-muted-foreground">Excluir</th>
                            </tr>
                          </thead>
                          <tbody>
                            {currentModulos.map(modulo => {
                              const perm = getPermissao(perfil.key, modulo.key);
                              const vis = perm?.pode_visualizar ?? false;
                              return (
                                <tr key={modulo.key} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                                  <td className="py-3 px-2">
                                    <span className="flex items-center gap-2 font-medium">
                                      <span>{modulo.icon}</span>
                                      {modulo.label}
                                    </span>
                                  </td>
                                  <td className="text-center py-3 px-2">
                                    <Switch
                                      checked={vis}
                                      onCheckedChange={(v) => handleToggle(modulo.key, 'pode_visualizar', v)}
                                    />
                                  </td>
                                  <td className="text-center py-3 px-2">
                                    <Switch
                                      checked={perm?.pode_criar ?? false}
                                      disabled={!vis}
                                      onCheckedChange={(v) => handleToggle(modulo.key, 'pode_criar', v)}
                                    />
                                  </td>
                                  <td className="text-center py-3 px-2">
                                    <Switch
                                      checked={perm?.pode_editar ?? false}
                                      disabled={!vis}
                                      onCheckedChange={(v) => handleToggle(modulo.key, 'pode_editar', v)}
                                    />
                                  </td>
                                  <td className="text-center py-3 px-2">
                                    <Switch
                                      checked={perm?.pode_excluir ?? false}
                                      disabled={!vis}
                                      onCheckedChange={(v) => handleToggle(modulo.key, 'pode_excluir', v)}
                                    />
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              ))}
            </Tabs>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
