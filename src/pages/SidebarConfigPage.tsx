import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { AdminSchoolSelector, useAdminSchoolSelector } from '@/components/admin/AdminSchoolSelector';
import { useAdminSidebarConfig } from '@/hooks/useSidebarConfig';
import { SidebarConfig, SidebarSectionConfig, SidebarItemConfig, AVAILABLE_ITEMS_BY_ROLE, getDefaultConfig } from '@/lib/sidebar-defaults';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GripVertical, Plus, Trash2, Save, RotateCcw, Edit2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
  useDroppable,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const PERFIS = [
  { value: 'admin', label: 'Administrador' },
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
            Configure as seções e itens do menu para cada perfil por escola. Arraste os itens entre seções.
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

// Unique ID for items: "sectionId::itemKey"
function itemId(sectionId: string, key: string) {
  return `${sectionId}::${key}`;
}

function parseItemId(id: string) {
  const [sectionId, key] = id.split('::');
  return { sectionId, key };
}

// Sortable item component
function SortableItem({
  item,
  sectionId,
  onToggleVisibility,
  onUpdateLabel,
  onRemove,
}: {
  item: SidebarItemConfig;
  sectionId: string;
  onToggleVisibility: () => void;
  onUpdateLabel: (label: string) => void;
  onRemove: () => void;
}) {
  const id = itemId(sectionId, item.key);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-xl border border-border/50 bg-muted/20",
        !item.visible && "opacity-50",
        isDragging && "opacity-30 border-primary"
      )}
    >
      <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing touch-none flex-shrink-0">
        <GripVertical className="w-3.5 h-3.5 text-muted-foreground" />
      </button>
      <Input
        value={item.label}
        onChange={e => onUpdateLabel(e.target.value)}
        className="h-7 text-sm rounded-lg border-none bg-transparent p-0 flex-1 min-w-0"
      />
      <div className="flex items-center gap-1 flex-shrink-0">
        <Switch checked={item.visible} onCheckedChange={onToggleVisibility} className="scale-75" />
        <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:bg-destructive/10" onClick={onRemove}>
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
}

// Droppable section wrapper
function DroppableSection({
  section,
  sectionIdx,
  children,
  editingSectionId,
  setEditingSectionId,
  onUpdateLabel,
  onRemove,
  availableItems,
  onAddItem,
}: {
  section: SidebarSectionConfig;
  sectionIdx: number;
  children: React.ReactNode;
  editingSectionId: string | null;
  setEditingSectionId: (id: string | null) => void;
  onUpdateLabel: (label: string) => void;
  onRemove: () => void;
  availableItems: { key: string; defaultLabel: string }[];
  onAddItem: (key: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `section-drop-${section.id}` });

  return (
    <Card className={cn("rounded-2xl border-2 transition-colors", isOver ? "border-primary bg-primary/5" : "border-border")}>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 flex-1">
            {editingSectionId === section.id ? (
              <Input
                value={section.label}
                onChange={e => onUpdateLabel(e.target.value)}
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
          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10" onClick={onRemove}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-1 pb-4" ref={setNodeRef}>
        {children}

        {section.items.length === 0 && (
          <div className="text-xs text-muted-foreground text-center py-3 border border-dashed border-border/50 rounded-xl">
            Arraste itens para cá
          </div>
        )}

        {availableItems.length > 0 && (
          <div className="pt-2">
            <select
              className="text-xs border border-border rounded-lg px-2 py-1.5 bg-background text-foreground"
              value=""
              onChange={e => { if (e.target.value) onAddItem(e.target.value); }}
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
  );
}

function SidebarConfigEditor({ crecheId, perfil }: { crecheId: string; perfil: string }) {
  const { config, setConfig, loading, saving, saveConfig } = useAdminSidebarConfig(crecheId, perfil);
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

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

  // All sortable IDs across all sections
  const allItemIds = config.flatMap(s => s.items.map(i => itemId(s.id, i.key)));

  const findSectionAndIndex = (id: string) => {
    const { sectionId, key } = parseItemId(id);
    const sIdx = config.findIndex(s => s.id === sectionId);
    if (sIdx === -1) return null;
    const iIdx = config[sIdx].items.findIndex(i => i.key === key);
    return iIdx === -1 ? null : { sIdx, iIdx };
  };

  const findContainerForId = (id: string): string | null => {
    // Check if it's a section drop zone
    if (typeof id === 'string' && id.startsWith('section-drop-')) {
      return id.replace('section-drop-', '');
    }
    // Check if it's an item
    const { sectionId } = parseItemId(id);
    if (config.find(s => s.id === sectionId)) return sectionId;
    return null;
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeIdStr = active.id as string;
    const overIdStr = over.id as string;

    const activeInfo = findSectionAndIndex(activeIdStr);
    if (!activeInfo) return;

    // Determine destination section
    let destSectionId: string | null = null;

    if (overIdStr.startsWith('section-drop-')) {
      destSectionId = overIdStr.replace('section-drop-', '');
    } else {
      const overInfo = findSectionAndIndex(overIdStr);
      if (overInfo) {
        destSectionId = config[overInfo.sIdx].id;
      }
    }

    if (!destSectionId) return;

    const sourceSectionId = config[activeInfo.sIdx].id;
    if (sourceSectionId === destSectionId) return;

    // Move item between sections
    const newConfig = [...config];
    const sourceSIdx = newConfig.findIndex(s => s.id === sourceSectionId);
    const destSIdx = newConfig.findIndex(s => s.id === destSectionId);
    if (sourceSIdx === -1 || destSIdx === -1) return;

    const [movedItem] = newConfig[sourceSIdx].items.splice(activeInfo.iIdx, 1);
    newConfig[sourceSIdx] = { ...newConfig[sourceSIdx], items: [...newConfig[sourceSIdx].items] };

    // Find insertion index
    let insertIdx = newConfig[destSIdx].items.length;
    if (!overIdStr.startsWith('section-drop-')) {
      const overInfo = findSectionAndIndex(overIdStr);
      if (overInfo && overInfo.sIdx === destSIdx) {
        insertIdx = overInfo.iIdx;
      }
    }

    const destItems = [...newConfig[destSIdx].items];
    destItems.splice(insertIdx, 0, movedItem);
    destItems.forEach((it, i) => it.ordem = i);
    newConfig[destSIdx] = { ...newConfig[destSIdx], items: destItems };

    newConfig[sourceSIdx].items.forEach((it, i) => it.ordem = i);

    setConfig(newConfig);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || active.id === over.id) return;

    const activeIdStr = active.id as string;
    const overIdStr = over.id as string;

    // Same section reorder
    const activeInfo = findSectionAndIndex(activeIdStr);
    const overInfo = findSectionAndIndex(overIdStr);

    if (activeInfo && overInfo && activeInfo.sIdx === overInfo.sIdx) {
      const newConfig = [...config];
      const items = arrayMove(newConfig[activeInfo.sIdx].items, activeInfo.iIdx, overInfo.iIdx);
      items.forEach((it, i) => it.ordem = i);
      newConfig[activeInfo.sIdx] = { ...newConfig[activeInfo.sIdx], items };
      setConfig(newConfig);
    }
  };

  // Find the active item for overlay
  const activeItem = activeId ? (() => {
    const info = findSectionAndIndex(activeId);
    if (!info) return null;
    return config[info.sIdx].items[info.iIdx];
  })() : null;

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

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        {config.map((section, sIdx) => {
          const sectionItemIds = section.items.map(i => itemId(section.id, i.key));

          return (
            <DroppableSection
              key={section.id}
              section={section}
              sectionIdx={sIdx}
              editingSectionId={editingSectionId}
              setEditingSectionId={setEditingSectionId}
              onUpdateLabel={label => updateSectionLabel(sIdx, label)}
              onRemove={() => removeSection(sIdx)}
              availableItems={availableItems}
              onAddItem={key => addItemToSection(sIdx, key)}
            >
              <SortableContext items={sectionItemIds} strategy={verticalListSortingStrategy}>
                {section.items.map((item, iIdx) => (
                  <SortableItem
                    key={itemId(section.id, item.key)}
                    item={item}
                    sectionId={section.id}
                    onToggleVisibility={() => toggleItemVisibility(sIdx, iIdx)}
                    onUpdateLabel={label => updateItemLabel(sIdx, iIdx, label)}
                    onRemove={() => removeItem(sIdx, iIdx)}
                  />
                ))}
              </SortableContext>
            </DroppableSection>
          );
        })}

        <DragOverlay>
          {activeItem ? (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl border-2 border-primary bg-card shadow-lg">
              <GripVertical className="w-3.5 h-3.5 text-primary" />
              <span className="text-sm font-medium">{activeItem.label}</span>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <Button variant="outline" onClick={addSection} className="w-full rounded-2xl gap-2 border-dashed">
        <Plus className="w-4 h-4" /> Adicionar Seção
      </Button>
    </div>
  );
}
