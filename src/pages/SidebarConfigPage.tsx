import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { AdminSchoolSelector, useAdminSchoolSelector } from '@/components/admin/AdminSchoolSelector';
import { useAdminSidebarConfig } from '@/hooks/useSidebarConfig';
import { SidebarConfig, SidebarSectionConfig, SidebarItemConfig, AVAILABLE_ITEMS_BY_ROLE, getDefaultConfig } from '@/lib/sidebar-defaults';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GripVertical, Plus, Trash2, Save, RotateCcw, ChevronUp, ChevronDown, Edit2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const PERFIS = [
  { value: 'diretor', label: 'Diretor' },
  { value: 'educador', label: 'Educador' },
  { value: 'responsavel', label: 'Responsável' },
];

export default function SidebarConfigPage() {
  const { effectiveCrecheId, selectedCrecheId, setSelectedCrecheId, creches, isAdmin } = useAdminSchoolSelector();
  const [selectedPerfil, setSelectedPerfil] = useState('diretor');

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Personalizar Menu Lateral</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configure as seções e itens do menu para cada perfil por escola
          </p>
        </div>

        {isAdmin && (
          <AdminSchoolSelector
            selectedCrecheId={selectedCrecheId}
            setSelectedCrecheId={setSelectedCrecheId}
            creches={creches}
          />
        )}

        {effectiveCrecheId ? (
          <Tabs value={selectedPerfil} onValueChange={setSelectedPerfil}>
            <TabsList className="grid w-full grid-cols-3 max-w-md">
              {PERFIS.map(p => (
                <TabsTrigger key={p.value} value={p.value}>{p.label}</TabsTrigger>
              ))}
            </TabsList>
            {PERFIS.map(p => (
              <TabsContent key={p.value} value={p.value}>
                <SidebarConfigEditor crecheId={effectiveCrecheId} perfil={p.value} />
              </TabsContent>
            ))}
          </Tabs>
        ) : (
          <Card className="rounded-2xl">
            <CardContent className="p-8 text-center text-muted-foreground">
              Selecione uma escola para configurar o menu lateral
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}

function SidebarConfigEditor({ crecheId, perfil }: { crecheId: string; perfil: string }) {
  const { config, setConfig, loading, saving, saveConfig } = useAdminSidebarConfig(crecheId, perfil);
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);

  if (loading) return <div className="text-center py-8 text-muted-foreground">Carregando...</div>;

  const handleSave = async () => {
    const ok = await saveConfig();
    if (ok) toast.success('Menu salvo com sucesso!');
    else toast.error('Erro ao salvar');
  };

  const handleReset = () => {
    setConfig(getDefaultConfig(perfil));
    toast.info('Menu restaurado para o padrão');
  };

  const moveSection = (idx: number, dir: -1 | 1) => {
    const newConfig = [...config];
    const target = idx + dir;
    if (target < 0 || target >= newConfig.length) return;
    [newConfig[idx], newConfig[target]] = [newConfig[target], newConfig[idx]];
    newConfig.forEach((s, i) => s.ordem = i);
    setConfig(newConfig);
  };

  const addSection = () => {
    const newSection: SidebarSectionConfig = {
      id: `secao_${Date.now()}`,
      label: 'Nova Seção',
      ordem: config.length,
      items: [],
    };
    setConfig([...config, newSection]);
  };

  const removeSection = (idx: number) => {
    const newConfig = config.filter((_, i) => i !== idx);
    newConfig.forEach((s, i) => s.ordem = i);
    setConfig(newConfig);
  };

  const updateSectionLabel = (idx: number, label: string) => {
    const newConfig = [...config];
    newConfig[idx] = { ...newConfig[idx], label };
    setConfig(newConfig);
  };

  const moveItem = (sectionIdx: number, itemIdx: number, dir: -1 | 1) => {
    const newConfig = [...config];
    const items = [...newConfig[sectionIdx].items];
    const target = itemIdx + dir;
    if (target < 0 || target >= items.length) return;
    [items[itemIdx], items[target]] = [items[target], items[itemIdx]];
    items.forEach((it, i) => it.ordem = i);
    newConfig[sectionIdx] = { ...newConfig[sectionIdx], items };
    setConfig(newConfig);
  };

  const toggleItemVisibility = (sectionIdx: number, itemIdx: number) => {
    const newConfig = [...config];
    const items = [...newConfig[sectionIdx].items];
    items[itemIdx] = { ...items[itemIdx], visible: !items[itemIdx].visible };
    newConfig[sectionIdx] = { ...newConfig[sectionIdx], items };
    setConfig(newConfig);
  };

  const updateItemLabel = (sectionIdx: number, itemIdx: number, label: string) => {
    const newConfig = [...config];
    const items = [...newConfig[sectionIdx].items];
    items[itemIdx] = { ...items[itemIdx], label };
    newConfig[sectionIdx] = { ...newConfig[sectionIdx], items };
    setConfig(newConfig);
  };

  const removeItem = (sectionIdx: number, itemIdx: number) => {
    const newConfig = [...config];
    const items = newConfig[sectionIdx].items.filter((_, i) => i !== itemIdx);
    items.forEach((it, i) => it.ordem = i);
    newConfig[sectionIdx] = { ...newConfig[sectionIdx], items };
    setConfig(newConfig);
  };

  // Get items not yet used in any section
  const usedKeys = new Set(config.flatMap(s => s.items.map(i => i.key)));
  const availableItems = (AVAILABLE_ITEMS_BY_ROLE[perfil] || []).filter(i => !usedKeys.has(i.key));

  const addItemToSection = (sectionIdx: number, key: string) => {
    const available = AVAILABLE_ITEMS_BY_ROLE[perfil]?.find(i => i.key === key);
    if (!available) return;
    const newConfig = [...config];
    const items = [...newConfig[sectionIdx].items, {
      key,
      label: available.defaultLabel,
      ordem: newConfig[sectionIdx].items.length,
      visible: true,
    }];
    newConfig[sectionIdx] = { ...newConfig[sectionIdx], items };
    setConfig(newConfig);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 justify-end flex-wrap">
        <Button variant="outline" size="sm" onClick={handleReset} className="rounded-xl gap-2">
          <RotateCcw className="w-4 h-4" /> Restaurar Padrão
        </Button>
        <Button size="sm" onClick={handleSave} disabled={saving} className="rounded-xl gap-2">
          <Save className="w-4 h-4" /> {saving ? 'Salvando...' : 'Salvar'}
        </Button>
      </div>

      {config.map((section, sIdx) => (
        <Card key={section.id} className="rounded-2xl border-2 border-border">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <GripVertical className="w-4 h-4 text-muted-foreground" />
              <div className="flex items-center gap-2 flex-1">
                {editingSectionId === section.id ? (
                  <Input
                    value={section.label}
                    onChange={e => updateSectionLabel(sIdx, e.target.value)}
                    onBlur={() => setEditingSectionId(null)}
                    onKeyDown={e => e.key === 'Enter' && setEditingSectionId(null)}
                    className="h-8 text-sm font-semibold rounded-xl max-w-xs"
                    autoFocus
                  />
                ) : (
                  <CardTitle
                    className="text-sm font-semibold cursor-pointer hover:text-primary flex items-center gap-1"
                    onClick={() => setEditingSectionId(section.id)}
                  >
                    {section.label} <Edit2 className="w-3 h-3 opacity-50" />
                  </CardTitle>
                )}
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveSection(sIdx, -1)} disabled={sIdx === 0}>
                  <ChevronUp className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveSection(sIdx, 1)} disabled={sIdx === config.length - 1}>
                  <ChevronDown className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10" onClick={() => removeSection(sIdx)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-1 pb-4">
            {section.items.map((item, iIdx) => (
              <div
                key={item.key}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-xl border border-border/50 bg-muted/20",
                  !item.visible && "opacity-50"
                )}
              >
                <GripVertical className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                <Input
                  value={item.label}
                  onChange={e => updateItemLabel(sIdx, iIdx, e.target.value)}
                  className="h-7 text-sm rounded-lg border-none bg-transparent p-0 flex-1 min-w-0"
                />
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Switch
                    checked={item.visible}
                    onCheckedChange={() => toggleItemVisibility(sIdx, iIdx)}
                    className="scale-75"
                  />
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => moveItem(sIdx, iIdx, -1)} disabled={iIdx === 0}>
                    <ChevronUp className="w-3 h-3" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => moveItem(sIdx, iIdx, 1)} disabled={iIdx === section.items.length - 1}>
                    <ChevronDown className="w-3 h-3" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:bg-destructive/10" onClick={() => removeItem(sIdx, iIdx)}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}

            {availableItems.length > 0 && (
              <div className="pt-2">
                <select
                  className="text-xs border border-border rounded-lg px-2 py-1.5 bg-background text-foreground"
                  value=""
                  onChange={e => { if (e.target.value) addItemToSection(sIdx, e.target.value); }}
                >
                  <option value="">+ Adicionar item...</option>
                  {availableItems.map(ai => (
                    <option key={ai.key} value={ai.key}>{ai.defaultLabel}</option>
                  ))}
                </select>
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      <Button variant="outline" onClick={addSection} className="w-full rounded-2xl gap-2 border-dashed">
        <Plus className="w-4 h-4" /> Adicionar Seção
      </Button>
    </div>
  );
}
