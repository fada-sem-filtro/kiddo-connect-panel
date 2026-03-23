import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useAdminSchoolSelector, AdminSchoolSelector } from '@/components/admin/AdminSchoolSelector';
import { usePermissoesPerfil, MODULOS, PERFIS } from '@/hooks/usePermissoesPerfil';

export default function PermissoesPerfilPage() {
  const { effectiveCrecheId, selectedCrecheId, setSelectedCrecheId, creches, isAdmin } = useAdminSchoolSelector();
  const { permissoes, loading, getPermissao, upsertPermissao, initializeDefaults } = usePermissoesPerfil(effectiveCrecheId);
  const [activePerfil, setActivePerfil] = useState('diretor');
  const [initializing, setInitializing] = useState(false);

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

  const currentModulos = MODULOS.filter(m => {
    // Filter which modules are relevant per profile
    if (activePerfil === 'responsavel') {
      return ['recados', 'eventos', 'calendario', 'boletim', 'relatorio_desempenho', 'grade_aulas'].includes(m.key);
    }
    if (activePerfil === 'educador') {
      return ['painel_educador', 'minha_turma', 'recados', 'presencas', 'eventos', 'boletim', 'grade_aulas', 'relatorio_desempenho', 'agenda_educador'].includes(m.key);
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
            <div className="flex items-center gap-3">
              <Button variant="outline" className="rounded-xl" onClick={handleInitDefaults} disabled={initializing}>
                <RefreshCw className={`w-4 h-4 mr-2 ${initializing ? 'animate-spin' : ''}`} />
                Inicializar Padrões
              </Button>
              <span className="text-xs text-muted-foreground">Cria permissões padrão para perfis que ainda não possuem configuração</span>
            </div>

            <Tabs value={activePerfil} onValueChange={setActivePerfil}>
              <TabsList className="rounded-xl">
                {PERFIS.map(p => (
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
