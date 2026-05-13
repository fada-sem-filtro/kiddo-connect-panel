import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { Download, FileText, Search } from "lucide-react";
import { format } from "date-fns";
import { downloadCSV, downloadFinancialPdf, fmtBRL } from "@/lib/financial-export";

interface Props { crecheId: string; criancas: any[] }

export function ExtratoUnificadoTab({ crecheId, criancas }: Props) {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [escolaNome, setEscolaNome] = useState("");
  const [from, setFrom] = useState(() => { const d = new Date(); d.setDate(1); return format(d, "yyyy-MM-dd"); });
  const [to, setTo] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [search, setSearch] = useState("");
  const [provider, setProvider] = useState("all");

  useEffect(() => {
    if (!crecheId) return;
    (async () => {
      const { data } = await supabase.from("creches").select("nome").eq("id", crecheId).maybeSingle();
      setEscolaNome(data?.nome || "");
    })();
  }, [crecheId]);

  useEffect(() => {
    if (!crecheId) return;
    setLoading(true);
    (async () => {
      const { data } = await supabase
        .from("financial_invoices")
        .select("*")
        .eq("creche_id", crecheId)
        .not("paid_at", "is", null)
        .gte("paid_at", from + "T00:00:00")
        .lte("paid_at", to + "T23:59:59")
        .order("paid_at", { ascending: false })
        .limit(2000);
      setRows(data || []);
      setLoading(false);
    })();
  }, [crecheId, from, to]);

  const filtered = useMemo(() => rows.filter(r => {
    if (provider !== "all" && r.provider !== provider) return false;
    if (search) {
      const child = criancas.find(c => c.id === r.crianca_id);
      const hay = `${child?.nome || ""} ${r.description || ""}`.toLowerCase();
      if (!hay.includes(search.toLowerCase())) return false;
    }
    return true;
  }), [rows, provider, search, criancas]);

  const total = filtered.reduce((s, r) => s + Number(r.amount || 0), 0);

  const exportCSV = () => {
    const data = filtered.map(r => {
      const c = criancas.find(x => x.id === r.crianca_id);
      return {
        data: r.paid_at ? format(new Date(r.paid_at), "dd/MM/yyyy") : "",
        aluno: c?.nome || "",
        descricao: r.description || "",
        provider: r.provider,
        metodo: r.payment_method || "",
        valor: Number(r.amount || 0).toFixed(2).replace(".", ","),
      };
    });
    downloadCSV(data, [
      { key: "data", label: "Data" },
      { key: "aluno", label: "Aluno" },
      { key: "descricao", label: "Descrição" },
      { key: "provider", label: "Provider" },
      { key: "metodo", label: "Método" },
      { key: "valor", label: "Valor (R$)" },
    ], `extrato_${from}_${to}.csv`);
  };

  const exportPDF = () => {
    const body = filtered.map(r => {
      const c = criancas.find(x => x.id === r.crianca_id);
      return [
        r.paid_at ? format(new Date(r.paid_at), "dd/MM/yyyy") : "",
        c?.nome || "—",
        r.description || "—",
        (r.provider || "").toUpperCase(),
        r.payment_method || "—",
        fmtBRL(Number(r.amount || 0)),
      ];
    });
    downloadFinancialPdf({
      titulo: "Extrato Financeiro",
      escola: escolaNome,
      periodo: `${format(new Date(from), "dd/MM/yyyy")} – ${format(new Date(to), "dd/MM/yyyy")}`,
      resumo: [
        { label: "Lançamentos", value: String(filtered.length) },
        { label: "Total recebido", value: fmtBRL(total) },
      ],
      columns: ["Data", "Aluno", "Descrição", "Provider", "Método", "Valor"],
      rows: body,
      filename: `extrato_${from}_${to}.pdf`,
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 items-end">
        <div>
          <label className="text-xs text-muted-foreground">De</label>
          <Input type="date" value={from} onChange={e => setFrom(e.target.value)} className="rounded-xl" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Até</label>
          <Input type="date" value={to} onChange={e => setTo(e.target.value)} className="rounded-xl" />
        </div>
        <div className="relative flex-1 min-w-[180px]">
          <Search className="w-4 h-4 absolute left-2 top-2.5 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar aluno ou descrição" className="pl-8 rounded-xl" />
        </div>
        <Select value={provider} onValueChange={setProvider}>
          <SelectTrigger className="w-32 rounded-xl"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Provedor</SelectItem>
            <SelectItem value="inter">Inter</SelectItem>
            <SelectItem value="asaas">Asaas</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" className="rounded-xl" onClick={exportCSV}>
          <Download className="w-4 h-4 mr-1" /> CSV
        </Button>
        <Button size="sm" className="rounded-xl" onClick={exportPDF}>
          <FileText className="w-4 h-4 mr-1" /> PDF
        </Button>
      </div>

      <Card className="rounded-2xl">
        <CardContent className="p-3 flex items-center justify-between bg-muted/30 rounded-2xl">
          <span className="text-sm text-muted-foreground">{filtered.length} lançamento(s)</span>
          <span className="text-lg font-bold tabular-nums">{fmtBRL(total)}</span>
        </CardContent>
      </Card>

      {loading ? <Skeleton className="h-40 w-full rounded-2xl" /> : (
        <Card className="rounded-2xl">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Aluno</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Sem lançamentos no período.</TableCell></TableRow>
                ) : filtered.map(r => {
                  const c = criancas.find(x => x.id === r.crianca_id);
                  return (
                    <TableRow key={r.id}>
                      <TableCell>{r.paid_at ? format(new Date(r.paid_at), "dd/MM/yyyy") : "—"}</TableCell>
                      <TableCell className="font-medium">{c?.nome || "—"}</TableCell>
                      <TableCell className="text-muted-foreground">{r.description || "—"}</TableCell>
                      <TableCell className="uppercase text-xs">{r.provider}</TableCell>
                      <TableCell className="text-xs">{r.payment_method || "—"}</TableCell>
                      <TableCell className="text-right font-semibold tabular-nums">{fmtBRL(Number(r.amount))}</TableCell>
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
