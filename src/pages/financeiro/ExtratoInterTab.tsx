import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Wallet, RefreshCw, Loader2, ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { format, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Props { crecheId: string }

const fmtBRL = (v: number) => `R$ ${Number(v).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

export function ExtratoInterTab({ crecheId }: Props) {
  const [balance, setBalance] = useState<any>(null);
  const [entries, setEntries] = useState<any[]>([]);
  const [loadingBal, setLoadingBal] = useState(false);
  const [loadingExt, setLoadingExt] = useState(false);
  const [from, setFrom] = useState(format(subDays(new Date(), 30), "yyyy-MM-dd"));
  const [to, setTo] = useState(format(new Date(), "yyyy-MM-dd"));

  const loadBalance = async () => {
    setLoadingBal(true);
    try {
      const { data, error } = await supabase.functions.invoke("inter-balance", { body: { creche_id: crecheId } });
      if (error) throw error;
      setBalance((data as any)?.balance);
    } catch (e: any) {
      toast({ title: "Erro ao buscar saldo", description: e.message, variant: "destructive" });
    } finally { setLoadingBal(false); }
  };

  const loadStatement = async () => {
    setLoadingExt(true);
    try {
      const { data, error } = await supabase.functions.invoke("inter-statement", { body: { creche_id: crecheId, from, to } });
      if (error) throw error;
      setEntries((data as any)?.entries || []);
    } catch (e: any) {
      toast({ title: "Erro ao buscar extrato", description: e.message, variant: "destructive" });
    } finally { setLoadingExt(false); }
  };

  useEffect(() => { loadBalance(); }, [crecheId]);

  return (
    <div className="space-y-4">
      <Card className="rounded-2xl border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Wallet className="w-5 h-5 text-primary" /> Saldo da conta Banco Inter PJ
            <Button size="sm" variant="ghost" className="ml-auto rounded-lg" onClick={loadBalance} disabled={loadingBal}>
              {loadingBal ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingBal ? <Skeleton className="h-12 w-48" /> : balance ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <BalCard label="Disponível" value={balance.available} highlight />
              <BalCard label="Bloqueado" value={balance.blocked || 0} />
              <BalCard label="Total" value={balance.total || 0} />
            </div>
          ) : <p className="text-sm text-muted-foreground">Saldo não disponível.</p>}
        </CardContent>
      </Card>

      <Card className="rounded-2xl border">
        <CardHeader>
          <CardTitle className="text-base">Extrato</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2 items-end">
            <div>
              <Label className="text-xs">De</Label>
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="rounded-xl" />
            </div>
            <div>
              <Label className="text-xs">Até</Label>
              <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="rounded-xl" />
            </div>
            <Button onClick={loadStatement} disabled={loadingExt} className="rounded-xl">
              {loadingExt ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
              Consultar
            </Button>
          </div>

          {entries.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Nenhuma movimentação no período.</p>
          ) : (
            <div className="divide-y rounded-xl border">
              {entries.map((e, i) => (
                <div key={i} className="flex items-center gap-3 p-3">
                  {e.type === "C"
                    ? <ArrowDownCircle className="w-5 h-5 text-green-600 shrink-0" />
                    : <ArrowUpCircle className="w-5 h-5 text-red-600 shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{e.description}</div>
                    <div className="text-xs text-muted-foreground">{format(new Date(e.date), "dd/MM/yyyy", { locale: ptBR })}</div>
                  </div>
                  <Badge className={e.type === "C" ? "bg-green-500/10 text-green-700" : "bg-red-500/10 text-red-700"}>
                    {e.type === "C" ? "+" : "-"} {fmtBRL(e.amount)}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function BalCard({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <Card className={`rounded-2xl border ${highlight ? "bg-primary/5 border-primary/30" : ""}`}>
      <CardContent className="p-4">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-xl font-bold">{fmtBRL(value)}</div>
      </CardContent>
    </Card>
  );
}
