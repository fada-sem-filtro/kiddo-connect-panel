import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, Clock, ArrowRight, Wallet, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format, addDays } from "date-fns";

const PAID = ["RECEBIDO", "RECEIVED", "CONFIRMED", "MARCADO_RECEBIDO"];
const CLOSED = ["CANCELADO", "EXPIRADO", "CANCELLED"];
const fmtBRL = (v: number) => `R$ ${Number(v || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

interface InvoiceRow {
  id: string;
  amount: number;
  status: string;
  due_date: string;
  paid_at: string | null;
  crianca_id: string | null;
}

interface Props {
  /** Override automatic role detection */
  variant?: "school" | "responsavel";
  /** Used only on school variant; if omitted, uses userCreche.id */
  crecheId?: string;
}

/**
 * Painel de alertas financeiros: cobranças vencidas e a vencer (próximos 7 dias).
 * - Diretor/Secretaria/Admin: alertas da escola.
 * - Responsável: alertas das cobranças dos próprios alunos.
 */
export function FinancialAlertsCard({ variant, crecheId }: Props) {
  const { user, role, userCreche } = useAuth();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<InvoiceRow[]>([]);

  const resolvedVariant: "school" | "responsavel" | null = useMemo(() => {
    if (variant) return variant;
    if (role === "responsavel") return "responsavel";
    if (role === "diretor" || role === "secretaria" || role === "admin") return "school";
    return null;
  }, [variant, role]);

  const schoolId = crecheId || userCreche?.id || null;

  useEffect(() => {
    if (!resolvedVariant) { setLoading(false); return; }
    setLoading(true);

    const today = format(new Date(), "yyyy-MM-dd");
    const horizon = format(addDays(new Date(), 30), "yyyy-MM-dd"); // janela generosa

    (async () => {
      try {
        if (resolvedVariant === "school") {
          if (!schoolId) { setRows([]); return; }
          const { data } = await supabase
            .from("financial_invoices")
            .select("id, amount, status, due_date, paid_at, crianca_id")
            .eq("creche_id", schoolId)
            .lte("due_date", horizon)
            .order("due_date", { ascending: true })
            .limit(500);
          setRows((data || []) as InvoiceRow[]);
        } else {
          if (!user?.id) { setRows([]); return; }
          const { data: vinc } = await supabase
            .from("crianca_responsaveis")
            .select("crianca_id")
            .eq("responsavel_user_id", user.id);
          const ids = (vinc || []).map((v: any) => v.crianca_id).filter(Boolean);
          if (!ids.length) { setRows([]); return; }
          const { data } = await supabase
            .from("financial_invoices")
            .select("id, amount, status, due_date, paid_at, crianca_id")
            .in("crianca_id", ids)
            .lte("due_date", horizon)
            .order("due_date", { ascending: true })
            .limit(200);
          setRows((data || []) as InvoiceRow[]);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [resolvedVariant, schoolId, user?.id]);

  const { vencidos, proximos } = useMemo(() => {
    const today = format(new Date(), "yyyy-MM-dd");
    const d7 = format(addDays(new Date(), 7), "yyyy-MM-dd");
    const vencidos: InvoiceRow[] = [];
    const proximos: InvoiceRow[] = [];
    rows.forEach((r) => {
      const isPaid = PAID.includes(r.status) || !!r.paid_at;
      if (isPaid) return;
      if (CLOSED.includes(r.status)) return;
      if (r.due_date < today) vencidos.push(r);
      else if (r.due_date <= d7) proximos.push(r);
    });
    return { vencidos, proximos };
  }, [rows]);

  if (!resolvedVariant) return null;
  if (loading) return <Skeleton className="h-28 w-full rounded-2xl" />;

  const total = vencidos.length + proximos.length;
  if (total === 0) {
    return (
      <Card className="rounded-2xl border border-emerald-200 bg-emerald-50/60 dark:bg-emerald-900/10">
        <CardContent className="p-4 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-700">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">
              {resolvedVariant === "responsavel" ? "Tudo em dia 🎉" : "Sem cobranças críticas"}
            </p>
            <p className="text-xs text-emerald-800/80 dark:text-emerald-200/80">
              {resolvedVariant === "responsavel"
                ? "Você não possui cobranças vencidas nem a vencer nos próximos 7 dias."
                : "Nenhuma cobrança vencida ou a vencer nos próximos 7 dias."}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const sumVenc = vencidos.reduce((s, r) => s + Number(r.amount || 0), 0);
  const sumProx = proximos.reduce((s, r) => s + Number(r.amount || 0), 0);
  const ctaHref = resolvedVariant === "responsavel" ? "/responsavel/financeiro" : "/financeiro";

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {/* Vencidas */}
      <Card className={`rounded-2xl border ${vencidos.length ? "border-rose-300 bg-gradient-to-br from-rose-50 to-rose-100/60 dark:from-rose-900/15 dark:to-rose-900/5" : "border-border bg-card"}`}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-xl ${vencidos.length ? "bg-rose-500/15 text-rose-700" : "bg-muted text-muted-foreground"}`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold">Cobranças vencidas</p>
                {vencidos.length > 0 && (
                  <Badge variant="destructive" className="rounded-full">{vencidos.length}</Badge>
                )}
              </div>
              <p className="text-2xl font-bold mt-1 leading-tight">{fmtBRL(sumVenc)}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {resolvedVariant === "responsavel"
                  ? "Regularize para evitar bloqueios e juros."
                  : "Acione a régua de cobrança e contate os responsáveis."}
              </p>
            </div>
          </div>
          <div className="mt-3 flex justify-end">
            <Button asChild size="sm" variant={vencidos.length ? "destructive" : "outline"}>
              <Link to={ctaHref}>
                {resolvedVariant === "responsavel" ? "Resolver agora" : "Ver vencidas"}
                <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Próximas 7 dias */}
      <Card className={`rounded-2xl border ${proximos.length ? "border-amber-300 bg-gradient-to-br from-amber-50 to-amber-100/60 dark:from-amber-900/15 dark:to-amber-900/5" : "border-border bg-card"}`}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-xl ${proximos.length ? "bg-amber-500/15 text-amber-700" : "bg-muted text-muted-foreground"}`}>
              <Clock className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold">A vencer (7 dias)</p>
                {proximos.length > 0 && (
                  <Badge className="rounded-full bg-amber-500 hover:bg-amber-500 text-white">{proximos.length}</Badge>
                )}
              </div>
              <p className="text-2xl font-bold mt-1 leading-tight">{fmtBRL(sumProx)}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {resolvedVariant === "responsavel"
                  ? "Pague com PIX para evitar atrasos."
                  : "Antecipe lembretes para reduzir inadimplência."}
              </p>
            </div>
          </div>
          <div className="mt-3 flex justify-end">
            <Button asChild size="sm" variant="outline">
              <Link to={ctaHref}>
                <Wallet className="w-4 h-4 mr-1" />
                {resolvedVariant === "responsavel" ? "Ver cobranças" : "Ver próximas"}
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
