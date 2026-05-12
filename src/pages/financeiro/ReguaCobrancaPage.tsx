import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell, Save, History, Loader2, Mail, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";

const STAGES = [
  { offset: -7, label: "7 dias antes do vencimento", default_titulo: "Sua mensalidade vence em 7 dias", default_body: "Olá {responsavel}! 🌸 A mensalidade de {aluno} ({valor}) vence em {vencimento}. PIX: {pix}" },
  { offset: -3, label: "3 dias antes do vencimento", default_titulo: "Mensalidade vence em 3 dias", default_body: "Olá {responsavel}, lembrete: a mensalidade de {aluno} ({valor}) vence em {vencimento}." },
  { offset: 0,  label: "No dia do vencimento", default_titulo: "Mensalidade vence hoje", default_body: "Olá {responsavel}, a mensalidade de {aluno} vence hoje ({valor}). PIX: {pix}" },
  { offset: 1,  label: "1 dia após vencimento", default_titulo: "Mensalidade vencida", default_body: "Olá {responsavel}, identificamos atraso na mensalidade de {aluno} ({valor})." },
  { offset: 5,  label: "5 dias após vencimento", default_titulo: "Mensalidade em atraso", default_body: "Olá {responsavel}, a mensalidade de {aluno} está vencida há 5 dias. Por favor regularize." },
  { offset: 15, label: "15 dias após vencimento", default_titulo: "Mensalidade em atraso", default_body: "Olá {responsavel}, há mais de 15 dias de atraso na mensalidade de {aluno}." },
  { offset: 30, label: "30 dias após vencimento", default_titulo: "Mensalidade em atraso há 30 dias", default_body: "Olá {responsavel}, sua mensalidade está em atraso há 30 dias. Entre em contato com a escola." },
];

const CHANNELS = [
  { key: "notificacao", label: "Notificação no app", icon: Bell },
  { key: "email", label: "Email", icon: Mail },
  { key: "whatsapp", label: "WhatsApp (manual)", icon: MessageCircle },
];

export default function ReguaCobrancaPage() {
  const { profile, role } = useAuth();
  const [crecheId, setCrecheId] = useState<string | null>(null);
  const [rules, setRules] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      if (!profile?.user_id) return;
      const { data: cm } = await supabase.from("creche_membros").select("creche_id").eq("user_id", profile.user_id).maybeSingle();
      if (cm?.creche_id) setCrecheId(cm.creche_id);
    })();
  }, [profile?.user_id]);

  const load = async () => {
    if (!crecheId) return;
    setLoading(true);
    const [r, l] = await Promise.all([
      supabase.from("financial_collection_rules" as any).select("*").eq("creche_id", crecheId),
      supabase.from("financial_collection_logs" as any).select("*").eq("creche_id", crecheId).order("sent_at", { ascending: false }).limit(50),
    ]);
    // Garante que toda etapa apareça
    const existing = (r.data as any[]) || [];
    const filled = STAGES.flatMap(stage =>
      CHANNELS.map(ch => {
        const found = existing.find((e: any) => e.stage_offset_days === stage.offset && e.channel === ch.key);
        return found || {
          id: null, creche_id: crecheId, stage_offset_days: stage.offset, channel: ch.key,
          titulo: stage.default_titulo, template: stage.default_body, ativo: ch.key === "notificacao",
        };
      })
    );
    setRules(filled);
    setLogs((l.data as any[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [crecheId]);

  const updateLocal = (offset: number, channel: string, patch: any) => {
    setRules(prev => prev.map(r => r.stage_offset_days === offset && r.channel === channel ? { ...r, ...patch } : r));
  };

  const saveAll = async () => {
    if (!crecheId) return;
    setSaving(true);
    try {
      // Upsert por stage+channel
      const payload = rules.map(r => ({
        creche_id: crecheId,
        stage_offset_days: r.stage_offset_days,
        channel: r.channel,
        titulo: r.titulo,
        template: r.template,
        ativo: r.ativo,
      }));
      const { error } = await supabase.from("financial_collection_rules" as any)
        .upsert(payload, { onConflict: "creche_id,stage_offset_days,channel" });
      if (error) throw error;
      toast({ title: "Régua salva com sucesso" });
      load();
    } catch (e: any) {
      toast({ title: "Erro ao salvar", description: e.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  return (
    <MainLayout>
      <div className="space-y-4 p-4 md:p-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-primary/10 p-2.5"><Bell className="w-6 h-6 text-primary" /></div>
            <div>
              <h1 className="text-2xl font-bold">Régua de Cobrança</h1>
              <p className="text-sm text-muted-foreground">Automação de lembretes antes e após o vencimento</p>
            </div>
          </div>
          <Button onClick={saveAll} disabled={saving || loading} className="rounded-xl gap-1.5">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Salvar régua
          </Button>
        </div>

        <Card className="rounded-2xl border bg-muted/30">
          <CardContent className="p-3 text-xs text-muted-foreground">
            <b>Placeholders disponíveis:</b> {"{responsavel}"}, {"{aluno}"}, {"{vencimento}"}, {"{valor}"}, {"{pix}"}, {"{linha_digitavel}"}, {"{escola}"}.
            A régua dispara automaticamente uma vez ao dia. WhatsApp é envio manual com link pré-pronto.
          </CardContent>
        </Card>

        <Tabs defaultValue="config">
          <TabsList className="rounded-xl">
            <TabsTrigger value="config" className="rounded-lg">Configuração</TabsTrigger>
            <TabsTrigger value="logs" className="rounded-lg gap-1.5"><History className="w-4 h-4" />Histórico</TabsTrigger>
          </TabsList>

          <TabsContent value="config" className="space-y-3 mt-3">
            {loading ? <Skeleton className="h-64 rounded-2xl" /> : STAGES.map(stage => {
              const stageRules = rules.filter(r => r.stage_offset_days === stage.offset);
              const ativas = stageRules.filter(r => r.ativo).length;
              return (
                <Card key={stage.offset} className="rounded-2xl border">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center justify-between">
                      <span>{stage.label}</span>
                      <Badge variant={ativas > 0 ? "default" : "secondary"} className="rounded-lg">
                        {ativas}/{CHANNELS.length} canal(is) ativo(s)
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {CHANNELS.map(ch => {
                      const rule = stageRules.find(r => r.channel === ch.key);
                      if (!rule) return null;
                      const Icon = ch.icon;
                      return (
                        <div key={ch.key} className="p-3 rounded-xl border bg-background space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 text-sm font-medium">
                              <Icon className="w-4 h-4 text-primary" /> {ch.label}
                            </div>
                            <Switch
                              checked={!!rule.ativo}
                              onCheckedChange={v => updateLocal(stage.offset, ch.key, { ativo: v })}
                            />
                          </div>
                          {rule.ativo && (
                            <>
                              <div>
                                <Label className="text-xs">Título</Label>
                                <Input value={rule.titulo} onChange={e => updateLocal(stage.offset, ch.key, { titulo: e.target.value })} />
                              </div>
                              <div>
                                <Label className="text-xs">Mensagem</Label>
                                <Textarea rows={2} value={rule.template} onChange={e => updateLocal(stage.offset, ch.key, { template: e.target.value })} />
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>

          <TabsContent value="logs" className="mt-3">
            <Card className="rounded-2xl border">
              <CardContent className="p-0 max-h-[60vh] overflow-y-auto">
                {logs.length === 0 ? (
                  <p className="p-6 text-center text-sm text-muted-foreground">Nenhum envio registrado ainda.</p>
                ) : logs.map(l => (
                  <div key={l.id} className="flex items-center justify-between p-3 border-b text-sm">
                    <div>
                      <p className="font-medium">{l.channel}</p>
                      <p className="text-xs text-muted-foreground">{l.recipient || "—"}</p>
                    </div>
                    <div className="text-right">
                      <Badge className={l.status === "sent" || l.status === "opened" ? "bg-emerald-500/10 text-emerald-700" : "bg-rose-500/10 text-rose-700"}>
                        {l.status}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">{format(new Date(l.sent_at), "dd/MM/yyyy HH:mm")}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
