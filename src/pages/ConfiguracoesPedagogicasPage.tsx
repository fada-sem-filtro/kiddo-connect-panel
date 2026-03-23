import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Settings, BookOpen, FileText, Library, CalendarClock } from 'lucide-react';
import { usePedagogicalSettings } from '@/hooks/usePedagogicalSettings';
import { toast } from 'sonner';

export default function ConfiguracoesPedagogicasPage() {
  const { settings, loading, updateSettings } = usePedagogicalSettings();

  const handleToggle = async (field: string, value: boolean) => {
    const { error } = await updateSettings({ [field]: value } as any);
    if (error) toast.error('Erro ao salvar configuração');
    else toast.success('Configuração atualizada');
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

  const features = [
    { key: 'boletim_ativo', label: 'Boletim Escolar', desc: 'Registro de notas por matéria e período letivo', icon: BookOpen },
    { key: 'relatorio_desempenho_ativo', label: 'Relatório de Desempenho', desc: 'Relatórios pedagógicos qualitativos dos alunos', icon: FileText },
    { key: 'gestao_materias_ativo', label: 'Gestão de Matérias', desc: 'Cadastro e gerenciamento de disciplinas da escola', icon: Library },
    { key: 'grade_aulas_ativo', label: 'Grade de Aulas', desc: 'Calendário semanal de aulas por turma', icon: CalendarClock },
  ];

  return (
    <MainLayout>
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Settings className="w-6 h-6 text-primary" />
            Configurações Pedagógicas
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Ative ou desative as funcionalidades pedagógicas da sua escola
          </p>
        </div>

        <div className="space-y-4">
          {features.map((feat) => (
            <Card key={feat.key} className="rounded-2xl border-2 border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <feat.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <Label className="text-base font-semibold text-foreground">{feat.label}</Label>
                      <p className="text-sm text-muted-foreground">{feat.desc}</p>
                    </div>
                  </div>
                  <Switch
                    checked={(settings as any)?.[feat.key] ?? false}
                    onCheckedChange={(v) => handleToggle(feat.key, v)}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </MainLayout>
  );
}
