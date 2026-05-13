import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, Clock, AlertCircle, Search, Download, LayoutGrid, List, Copy, FileText } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { downloadCSV, fmtBRL } from "@/lib/financial-export";

interface Props { crecheId: string; criancas: any[] }

const STATUS_META: Record<string, { label: string; cls: string; group: "paid" | "pending" | "overdue" | "other" }> = {
  RECEBIDO: { label: "Pago", cls: "bg-emerald-500/10 text-emerald-700", group: "paid" },
  RECEIVED: { label: "Pago", cls: "bg-emerald-500/10 text-emerald-700", group: "paid" },
  CONFIRMED: { label: "Confirmado", cls: "bg-emerald-500/10 text-emerald-700", group: "paid" },
  MARCADO_RECEBIDO: { label: "Pago manual", cls: "bg-emerald-500/10 text-emerald-700", group: "paid" },
  PENDING: { label: "A vencer", cls: "bg-blue-500/10 text-blue-700", group: "pending" },
  A_RECEBER: { label: "A vencer", cls: "bg-blue-500/10 text-blue-700", group: "pending" },
  EM_PROCESSAMENTO: { label: "Processando", cls: "bg-amber-500/10 text-amber-700", group: "pending" },
  ATRASADO: { label: "Vencido", cls: "bg-rose-500/10 text-rose-700", group: "overdue" },
  OVERDUE: { label: "Vencido", cls: "bg-rose-500/10 text-rose-700", group: "overdue" },
  CANCELADO: { label: "Cancelado", cls: "bg-muted text-muted-foreground", group: "other" },
  EXPIRADO: { label: "Expirado", cls: "bg-muted text-muted-foreground", group: "other" },
};

export function CobrancasUnificadasTab({ crecheId, criancas }: Props) {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"cards" | "tabela">("cards");
  const [status, setStatus] = useState("all");
  const [provider, setProvider] = useState("all");
  const [search, setSearch] = useState("");
  const [periodo, setPeriodo] = useState("90");

  const load = async () => {
    if (!crecheId) return;
    setLoading(true);
    const days = parseInt(periodo, 10);
    const since = new Date(); since.setDate(since.getDate() - days);
    const { data } = await supabase
      .from("financial_invoices")
      .select("*")
      .eq("creche_id", crecheId)
      .gte("due_date", format(since, "yyyy-MM-dd"))
      .order("due_date", { ascending: false })
      .limit(500);
    setInvoices(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [crecheId, periodo]);

  const today = format(new Date(), "yyyy-MM-dd");
  const filtered = useMemo(() => {
    return invoices
      .map(i => ({
        ...i,
        eff: !i.paid_at && i.due_date < today && !["CANCELADO", "EXPIRADO", "RECEBIDO", "RECEIVED"].includes(i.status) ? "ATRASADO" : i.status,
      }))
      .filter(i => {
        if (provider !== "all" && i.provider !== provider) return false;
        if (status !== "all") {
          const meta = STATUS_META[i.eff];
          if (!meta || meta.group !== status) return false;
        }
        if (search) {
          const child = criancas.find(c => c.id === i.crianca_id);
          const hay = `${child?.nome || ""} ${i.description || ""} ${i.nosso_numero || ""}`.toLowerCase();
          if (!hay.includes(search.toLowerCase())) return false;
        }
        return true;
      });
  }, [invoices, provider, status, search, criancas, today]);

  const totals = useMemo(() => {
    let pago = 0, pendente = 0, vencido = 0;
    filtered.forEach(i => {
      const g = STATUS_META[i.eff]?.group;
      if (g === "paid") pago += Number(i.amount || 0);
      else if (g === "pending") pendente += Number(i.amount || 0);
      else if (g === "overdue") vencido += Number(i.amount || 0);
    });
    return { pago, pendente, vencido };
  }, [filtered]);

  const exportCSV = () => {
    const rows = filtered.map(i => {
      const child = criancas.find(c => c.id === i.crianca_id);
      return {
        aluno: child?.nome || "",
        descricao: i.description || "",
        valor: Number(i.amount || 0).toFixed(2).replace(".", ","),
        vencimento: i.due_date,
        pago_em: i.paid_at ? format(new Date(i.paid_at), "dd/MM/yyyy") : "",
        status: STATUS_META[i.eff]?.label || i.eff,
        provider: i.provider,
        metodo: i.payment_method || "",
        nosso_numero: i.nosso_numero || "",
      };
    });
    downloadCSV(rows, [
      { key: "aluno", label: "Aluno" },
      { key: "descricao", label: "Descrição" },
      { key: "valor", label: "Valor (R$)" },
      { key: "vencimento", label: "Vencimento" },
      { key: "pago_em", label: "Pago em" },
      { key: "status", label: "Status" },
      { key: "provider", label: "Provider" },
      { key: "metodo", label: "Método" },
      { key: "nosso_numero", label: "Nosso número" },
    ], `cobrancas_${today}.csv`);
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        <MiniSummary label="Pago" value={fmtBRL(totals.pago)} icon={<CheckCircle2 className="w-4 h-4" />} tone="text-emerald-700 bg-emerald-500/10" />
        <MiniSummary label="A vencer" value={fmtBRL(totals.pendente)} icon={<Clock className="w-4 h-4" />} tone="text-blue-700 bg-blue-500/10" />
        <MiniSummary label="Vencido" value={fmtBRL(totals.vencido)} icon={<AlertCircle className="w-4 h-4" />} tone="text-rose-700 bg-rose-500/10" />
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="w-4 h-4 absolute left-2 top-2.5 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar aluno, descrição, nosso número..." className="pl-8 rounded-xl" />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-32 rounded-xl"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos status</SelectItem>
            <SelectItem value="paid">Pagos</SelectItem>
            <SelectItem value="pending">A vencer</SelectItem>
            <SelectItem value="overdue">Vencidos</SelectItem>
          </SelectContent>
        </Select>
        <Select value={provider} onValueChange={setProvider}>
          <SelectTrigger className="w-28 rounded-xl"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Provedor</SelectItem>
            <SelectItem value="inter">Inter</SelectItem>
            <SelectItem value="asaas">Asaas</SelectItem>
          </SelectContent>
        </Select>
        <Select value={periodo} onValueChange={setPeriodo}>
          <SelectTrigger className="w-28 rounded-xl"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="30">30 dias</SelectItem>
            <SelectItem value="60">60 dias</SelectItem>
            <SelectItem value="90">90 dias</SelectItem>
            <SelectItem value="180">180 dias</SelectItem>
            <SelectItem value="365">12 meses</SelectItem>
          </SelectContent>
        </Select>
        <Tabs value={view} onValueChange={v => setView(v as any)}>
          <TabsList className="h-9">
            <TabsTrigger value="cards"><LayoutGrid className="w-4 h-4" /></TabsTrigger>
            <TabsTrigger value="tabela"><List className="w-4 h-4" /></TabsTrigger>
          </TabsList>
        </Tabs>
        <Button variant="outline" size="sm" className="rounded-xl" onClick={exportCSV}>
          <Download className="w-4 h-4 mr-1" /> CSV
        </Button>
      </div>

      {loading ? <Skeleton className="h-40 w-full rounded-2xl" /> : filtered.length === 0 ? (
        <Card className="rounded-2xl"><CardContent className="py-10 text-center text-muted-foreground">
          <FileText className="w-10 h-10 mx-auto mb-2 opacity-40" /> Nenhuma cobrança no filtro atual.
        </CardContent></Card>
      ) : view === "cards" ? (
        <div className="grid grid-cols-1 gap-2">
          {filtered.map(inv => {
            const child = criancas.find(c => c.id === inv.crianca_id);
            const meta = STATUS_META[inv.eff] || { label: inv.eff, cls: "bg-muted", group: "other" as const };
            return (
              <Card key={inv.id} className="rounded-2xl border hover:shadow-sm transition-shadow">
                <CardContent className="p-3 flex items-center justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{child?.nome || inv.description || "Cobrança"}</div>
                    <div className="text-xs text-muted-foreground">
                      {inv.description ? `${inv.description} • ` : ""}Venc {format(new Date(inv.due_date + "T00:00:00"), "dd/MM/yyyy", { locale: ptBR })}
                      {inv.paid_at && ` • Pago ${format(new Date(inv.paid_at), "dd/MM/yyyy")}`}
                      {" • "}<span className="uppercase">{inv.provider}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={`${meta.cls} rounded-lg`}>{meta.label}</Badge>
                    <span className="font-semibold tabular-nums">{fmtBRL(Number(inv.amount))}</span>
                    {inv.pix_copy_paste && (
                      <Button size="sm" variant="outline" className="rounded-lg"
                        onClick={() => { navigator.clipboard.writeText(inv.pix_copy_paste); toast({ title: "PIX copiado" }); }}>
                        <Copy className="w-3.5 h-3.5" />
                      </Button>
                    )}
                    {inv.boleto_pdf_url && (
                      <Button size="sm" variant="outline" className="rounded-lg" asChild>
                        <a href={inv.boleto_pdf_url} target="_blank" rel="noreferrer"><FileText className="w-3.5 h-3.5" /></a>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="rounded-2xl">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Aluno</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(inv => {
                  const child = criancas.find(c => c.id === inv.crianca_id);
                  const meta = STATUS_META[inv.eff] || { label: inv.eff, cls: "bg-muted", group: "other" as const };
                  return (
                    <TableRow key={inv.id}>
                      <TableCell className="font-medium">{child?.nome || "—"}</TableCell>
                      <TableCell className="text-muted-foreground">{inv.description || "—"}</TableCell>
                      <TableCell>{format(new Date(inv.due_date + "T00:00:00"), "dd/MM/yyyy")}</TableCell>
                      <TableCell><Badge className={`${meta.cls} rounded-lg`}>{meta.label}</Badge></TableCell>
                      <TableCell className="uppercase text-xs">{inv.provider}</TableCell>
                      <TableCell className="text-right font-semibold tabular-nums">{fmtBRL(Number(inv.amount))}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function MiniSummary({ label, value, icon, tone }: { label: string; value: string; icon: React.ReactNode; tone: string }) {
  return (
    <Card className="rounded-2xl border">
      <CardContent className="p-3">
        <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium ${tone}`}>{icon}{label}</div>
        <div className="text-base md:text-lg font-bold mt-1 tabular-nums truncate">{value}</div>
      </CardContent>
    </Card>
  );
}
