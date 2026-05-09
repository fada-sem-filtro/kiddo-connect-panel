import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Building2, CheckCircle2, Loader2, Unplug, Copy, RefreshCw, ShieldAlert, ShieldCheck } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Props { crecheId: string | null; }

export function BancoInterTab({ crecheId }: Props) {
  const [account, setAccount] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [validating, setValidating] = useState(false);
  const [showDisconnect, setShowDisconnect] = useState(false);

  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [contaCorrente, setContaCorrente] = useState("");
  const [certText, setCertText] = useState("");
  const [keyText, setKeyText] = useState("");
  const [webhookCertText, setWebhookCertText] = useState("");
  const [environment, setEnvironment] = useState<"sandbox" | "production">("production");

  const baseUrl = environment === "sandbox"
    ? "https://cdpj-sandbox.partners.uatinter.co"
    : "https://cdpj.partners.bancointer.com.br";

  const load = async () => {
    if (!crecheId) return;
    setLoading(true);
    const { data } = await supabase
      .from("vw_financial_accounts_safe" as any)
      .select("*").eq("creche_id", crecheId).eq("provider", "inter").maybeSingle();
    setAccount(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, [crecheId]);

  const handleFile = (file: File | undefined, setter: (v: string) => void) => {
    if (!file) return;
    if (file.size > 100_000) { toast({ title: "Arquivo muito grande", description: "Máx 100KB", variant: "destructive" }); return; }
    const reader = new FileReader();
    reader.onload = () => setter(String(reader.result || ""));
    reader.readAsText(file);
  };

  const connect = async () => {
    if (!crecheId) return;
    if (!clientId || !clientSecret || !certText || !keyText) {
      toast({ title: "Preencha todos os campos obrigatórios", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("inter-connect", {
        body: {
          creche_id: crecheId,
          client_id: clientId.trim(),
          client_secret: clientSecret.trim(),
          conta_corrente: contaCorrente.trim() || null,
          certificate: certText,
          private_key: keyText,
          webhook_certificate: webhookCertText || null,
          environment,
        },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      toast({ title: "Banco Inter conectado!", description: `Ambiente: ${environment === "sandbox" ? "Sandbox (homologação)" : "Produção"}` });
      setClientSecret(""); setCertText(""); setKeyText(""); setWebhookCertText("");
      await load();
    } catch (e: any) {
      toast({ title: "Falha ao conectar", description: e.message, variant: "destructive" });
    } finally { setSubmitting(false); }
  };

  const validate = async () => {
    if (!crecheId) return;
    setValidating(true);
    try {
      const { data, error } = await supabase.functions.invoke("inter-status", { body: { creche_id: crecheId } });
      if (error) throw error;
      if ((data as any)?.connected) toast({ title: "Conexão validada com sucesso" });
      else toast({ title: "Falha na validação", description: (data as any)?.error || "—", variant: "destructive" });
      await load();
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    } finally { setValidating(false); }
  };

  const disconnect = async () => {
    if (!crecheId) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.functions.invoke("inter-disconnect", { body: { creche_id: crecheId } });
      if (error) throw error;
      toast({ title: "Inter desconectado" });
      await load();
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    } finally { setSubmitting(false); setShowDisconnect(false); }
  };

  const projectId = (import.meta as any).env.VITE_SUPABASE_PROJECT_ID;
  const webhookUrl = account?.webhook_secret
    ? `https://${projectId}.supabase.co/functions/v1/inter-webhook?token=${account.webhook_secret}`
    : "";

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-orange-500" /> Banco Inter PJ
            {account?.connected && <Badge className="bg-green-500/10 text-green-700">Conectado</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <ShieldAlert className="h-4 w-4" />
            <AlertTitle>O dinheiro vai direto para sua conta</AlertTitle>
            <AlertDescription>
              A Agenda Fleur não recebe, intermedia ou custodia pagamentos. Toda movimentação ocorre
              exclusivamente entre o responsável e a conta Banco Inter da escola.
            </AlertDescription>
          </Alert>

          {account?.connected ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div>
                  <Label className="text-xs text-muted-foreground">Client ID</Label>
                  <div className="font-mono">{account.client_id?.slice(0, 8)}…{account.client_id?.slice(-4)}</div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Conta corrente</Label>
                  <div className="font-mono">{account.conta_corrente || "—"}</div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Última validação</Label>
                  <div>{account.last_validation ? format(new Date(account.last_validation), "dd/MM/yyyy HH:mm", { locale: ptBR }) : "—"}</div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Certificado</Label>
                  <div>{account.has_certificate ? "✓ Configurado" : "—"}</div>
                </div>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">Webhook URL (já registrado no Inter)</Label>
                <div className="flex gap-2 mt-1">
                  <Input readOnly value={webhookUrl} className="font-mono text-xs" />
                  <Button size="icon" variant="outline" onClick={() => { navigator.clipboard.writeText(webhookUrl); toast({ title: "URL copiada" }); }}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {account.last_error && (
                <Alert variant="destructive">
                  <AlertTitle>Último erro</AlertTitle>
                  <AlertDescription className="text-xs">{account.last_error}</AlertDescription>
                </Alert>
              )}

              <div className="flex gap-2 flex-wrap">
                <Button variant="outline" onClick={validate} disabled={validating}>
                  {validating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                  Validar conexão
                </Button>
                <Button variant="destructive" onClick={() => setShowDisconnect(true)}>
                  <Unplug className="w-4 h-4 mr-2" /> Desconectar
                </Button>
              </div>
            </>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Crie uma aplicação em <a className="text-primary underline" target="_blank" rel="noreferrer" href="https://developers.inter.co/docs/introducao/como-criar-uma-aplicacao">developers.inter.co</a>,
                gere o certificado mTLS e cole/envie os arquivos abaixo.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label>Client ID *</Label>
                  <Input value={clientId} onChange={e => setClientId(e.target.value)} placeholder="UUID" />
                </div>
                <div>
                  <Label>Client Secret *</Label>
                  <Input type="password" value={clientSecret} onChange={e => setClientSecret(e.target.value)} placeholder="••••" />
                </div>
                <div className="md:col-span-2">
                  <Label>Conta corrente (opcional)</Label>
                  <Input value={contaCorrente} onChange={e => setContaCorrente(e.target.value)} placeholder="0000000000" />
                </div>
                <div>
                  <Label>Certificado (.crt) *</Label>
                  <Input type="file" accept=".crt,.pem,.cer" onChange={e => handleFile(e.target.files?.[0], setCertText)} />
                  {certText && <p className="text-xs text-green-600 mt-1">✓ Certificado carregado ({certText.length} bytes)</p>}
                </div>
                <div>
                  <Label>Chave privada (.key) *</Label>
                  <Input type="file" accept=".key,.pem" onChange={e => handleFile(e.target.files?.[0], setKeyText)} />
                  {keyText && <p className="text-xs text-green-600 mt-1">✓ Chave carregada ({keyText.length} bytes)</p>}
                </div>
              </div>
              <details className="text-xs">
                <summary className="cursor-pointer text-muted-foreground">Ou cole o conteúdo manualmente</summary>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                  <Textarea rows={5} placeholder="-----BEGIN CERTIFICATE-----..." value={certText} onChange={e => setCertText(e.target.value)} className="font-mono text-xs" />
                  <Textarea rows={5} placeholder="-----BEGIN PRIVATE KEY-----..." value={keyText} onChange={e => setKeyText(e.target.value)} className="font-mono text-xs" />
                </div>
              </details>
              <Button onClick={connect} disabled={submitting}>
                {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                Conectar Banco Inter
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={showDisconnect} onOpenChange={setShowDisconnect}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desconectar Banco Inter?</AlertDialogTitle>
            <AlertDialogDescription>
              Os certificados serão removidos e novas cobranças não poderão ser emitidas. Cobranças existentes permanecerão registradas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={disconnect} className="bg-destructive text-destructive-foreground">Desconectar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
