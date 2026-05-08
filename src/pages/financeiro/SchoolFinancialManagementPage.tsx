import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  ArrowLeft, Building2, Wallet, Plug, Receipt, ScrollText, ShieldAlert,
  CheckCircle2, AlertTriangle, Loader2, RefreshCw,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { BancoInterTab } from "./BancoInterTab";
import { CobrancasInterTab } from "./CobrancasInterTab";
import { LogsInterTab } from "./LogsInterTab";

type Provider = "asaas" | "inter" | null;

export default function SchoolFinancialManagementPage() {
  const { crecheId = "" } = useParams<{ crecheId: string }>();
  const [loading, setLoading] = useState(true);
  const [creche, setCreche] = useState<any>(null);
  const [asaas, setAsaas] = useState<any>(null);
  const [inter, setInter] = useState<any>(null);
  const [criancas, setCriancas] = useState<any[]>([]);
  const [validating, setValidating] = useState(false);

  const load = async () => {
    if (!crecheId) return;
    setLoading(true);
    const [c, s, i, k] = await Promise.all([
      supabase.from("creches").select("id, nome, endereco, telefone, email, logo_url").eq("id", crecheId).maybeSingle(),
      supabase.from("financial_settings").select("asaas_api_key_last4, asaas_environment, asaas_connected, asaas_account_name, asaas_account_email, asaas_last_validation").eq("creche_id", crecheId).maybeSingle(),
      supabase.from("vw_financial_accounts_safe" as any).select("*").eq("creche_id", crecheId).eq("provider", "inter").maybeSingle(),
      supabase.from("criancas").select("id, nome, turma_id, turmas!inner(creche_id)").eq("turmas.creche_id", crecheId).order("nome"),
    ]);
    setCreche(c.data);
    setAsaas(s.data);
    setInter(i.data);
    setCriancas(k.data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [crecheId]);

  const provider: Provider = inter?.connected ? "inter" : asaas?.asaas_connected ? "asaas" : null;
  const env = provider === "inter" ? (inter?.environment || "production") : provider === "asaas" ? asaas?.asaas_environment : null;
  const lastSync = provider === "inter" ? inter?.last_validation : provider === "asaas" ? asaas?.asaas_last_validation : null;

  const validateInter = async () => {
    setValidating(true);
    try {
      const { data, error } = await supabase.functions.invoke("inter-status", { body: { creche_id: crecheId } });
      if (error) throw error;
      if ((data as any)?.connected) toast({ title: "Conexão Inter validada" });
      else toast({ title: "Falha na validação", description: (data as any)?.error || "—", variant: "destructive" });
      await load();
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    } finally { setValidating(false); }
  };

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto space-y-6 p-4 md:p-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Button asChild variant="ghost" size="sm" className="rounded-lg -ml-2">
            <Link to="/admin/creches"><ArrowLeft className="w-4 h-4 mr-1" /> Escolas</Link>
          </Button>
          <span>/</span>
          <span>Financeiro</span>
        </div>

        {loading ? (
          <Skeleton className="h-32 w-full rounded-2xl" />
        ) : (
          <Card className="rounded-2xl border-2 bg-gradient-to-br from-primary/5 to-transparent">
            <CardContent className="p-5 flex flex-col md:flex-row md:items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center overflow-hidden shrink-0">
                {creche?.logo_url ? (
                  <img src={creche.logo_url} alt={creche?.nome} className="w-full h-full object-cover" />
                ) : (
                  <Building2 className="w-8 h-8 text-primary" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl md:text-2xl font-bold truncate">{creche?.nome || "Escola"}</h1>
                <p className="text-sm text-muted-foreground truncate">{creche?.endereco || "—"}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <ProviderBadge provider={provider} />
                {env && <Badge variant="outline" className="rounded-lg capitalize">{env}</Badge>}
                {lastSync && (
                  <Badge variant="outline" className="rounded-lg">
                    <RefreshCw className="w-3 h-3 mr-1" />
                    {format(new Date(lastSync), "dd/MM HH:mm", { locale: ptBR })}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <Alert className="rounded-2xl">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>A Agenda Fleur não recebe pagamentos</AlertTitle>
          <AlertDescription>
            Toda movimentação financeira ocorre diretamente entre o responsável e a conta bancária da escola.
            A plataforma atua apenas como gestão, automação e integração bancária.
          </AlertDescription>
        </Alert>

        <Tabs defaultValue="resumo">
          <TabsList className="flex flex-wrap gap-1 h-auto bg-muted/50 p-1 rounded-2xl">
            <TabsTrigger value="resumo" className="rounded-xl"><Wallet className="w-4 h-4 mr-1.5" />Resumo</TabsTrigger>
            <TabsTrigger value="provider" className="rounded-xl"><Plug className="w-4 h-4 mr-1.5" />Provider</TabsTrigger>
            <TabsTrigger value="cobrancas" className="rounded-xl"><Receipt className="w-4 h-4 mr-1.5" />Cobranças</TabsTrigger>
            <TabsTrigger value="logs" className="rounded-xl"><ScrollText className="w-4 h-4 mr-1.5" />Logs</TabsTrigger>
          </TabsList>

          <TabsContent value="resumo" className="mt-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <SummaryCard title="Provider ativo" value={provider ? (provider === "inter" ? "Banco Inter PJ" : "Asaas") : "Nenhum"} icon={<Plug className="w-4 h-4" />} />
              <SummaryCard title="Ambiente" value={env || "—"} icon={<ShieldAlert className="w-4 h-4" />} />
              <SummaryCard title="Última sincronização" value={lastSync ? format(new Date(lastSync), "dd/MM/yyyy HH:mm", { locale: ptBR }) : "—"} icon={<RefreshCw className="w-4 h-4" />} />
            </div>
          </TabsContent>

          <TabsContent value="provider" className="mt-4 space-y-4">
            <AsaasProviderCard data={asaas} />
            <BancoInterTab crecheId={crecheId} />
            {provider === "inter" && (
              <Button variant="outline" onClick={validateInter} disabled={validating} className="rounded-xl">
                {validating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                Testar conexão Inter
              </Button>
            )}
          </TabsContent>

          <TabsContent value="cobrancas" className="mt-4">
            <CobrancasInterTab crecheId={crecheId} criancas={criancas} />
          </TabsContent>

          <TabsContent value="logs" className="mt-4">
            <LogsInterTab crecheId={crecheId} />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}

function ProviderBadge({ provider }: { provider: Provider }) {
  if (provider === "inter") return <Badge className="bg-orange-500/10 text-orange-700 rounded-lg"><CheckCircle2 className="w-3.5 h-3.5 mr-1" />Banco Inter conectado</Badge>;
  if (provider === "asaas") return <Badge className="bg-green-500/10 text-green-700 rounded-lg"><CheckCircle2 className="w-3.5 h-3.5 mr-1" />Asaas conectado</Badge>;
  return <Badge className="bg-yellow-500/10 text-yellow-700 rounded-lg"><AlertTriangle className="w-3.5 h-3.5 mr-1" />Não configurado</Badge>;
}

function SummaryCard({ title, value, icon }: { title: string; value: string; icon: React.ReactNode }) {
  return (
    <Card className="rounded-2xl border">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">{icon}{title}</div>
        <div className="text-lg font-semibold capitalize">{value}</div>
      </CardContent>
    </Card>
  );
}

function AsaasProviderCard({ data }: { data: any }) {
  const connected = !!data?.asaas_connected;
  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Wallet className="w-5 h-5 text-green-600" /> Asaas
          {connected
            ? <Badge className="bg-green-500/10 text-green-700 rounded-lg">Conectado</Badge>
            : <Badge className="bg-muted text-muted-foreground rounded-lg">Não configurado</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
        <Field label="API Key" value={data?.asaas_api_key_last4 ? `••••${data.asaas_api_key_last4}` : "—"} mono />
        <Field label="Ambiente" value={data?.asaas_environment || "—"} />
        <Field label="Conta" value={data?.asaas_account_name || "—"} />
        <Field label="Última validação" value={data?.asaas_last_validation ? format(new Date(data.asaas_last_validation), "dd/MM/yyyy HH:mm", { locale: ptBR }) : "—"} />
      </CardContent>
    </Card>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={mono ? "font-mono" : ""}>{value}</div>
    </div>
  );
}
