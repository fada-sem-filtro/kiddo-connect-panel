// Utilitários de exportação financeira (CSV + PDF)
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const fmtBRL = (v: number) => `R$ ${Number(v || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

export interface ExportRow {
  [key: string]: string | number | null | undefined;
}

export function downloadCSV(rows: ExportRow[], headers: { key: string; label: string }[], filename: string) {
  const head = headers.map(h => h.label).join(",");
  const body = rows.map(r =>
    headers.map(h => {
      const v = r[h.key];
      return `"${String(v ?? "").replace(/"/g, '""')}"`;
    }).join(","),
  );
  const csv = [head, ...body].join("\n");
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export interface FinancialPdfReport {
  titulo: string;
  subtitulo?: string;
  escola?: string;
  periodo?: string;
  resumo?: { label: string; value: string }[];
  rows: (string | number)[][];
  columns: string[];
  filename?: string;
}

export function downloadFinancialPdf(report: FinancialPdfReport) {
  const doc = new jsPDF({ format: "a4", unit: "mm", orientation: "landscape" });
  const W = doc.internal.pageSize.getWidth();

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(43, 196, 232);
  doc.text(report.titulo, 14, 16);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(80);
  if (report.subtitulo) doc.text(report.subtitulo, 14, 22);
  if (report.escola) doc.text(report.escola, W - 14, 16, { align: "right" });
  if (report.periodo) doc.text(report.periodo, W - 14, 22, { align: "right" });

  let y = 30;

  if (report.resumo && report.resumo.length) {
    doc.setFillColor(245, 250, 253);
    doc.roundedRect(14, y, W - 28, 16, 2, 2, "F");
    const colW = (W - 28) / report.resumo.length;
    report.resumo.forEach((r, i) => {
      const x = 14 + colW * i + 4;
      doc.setFontSize(8); doc.setTextColor(120);
      doc.text(r.label.toUpperCase(), x, y + 6);
      doc.setFontSize(11); doc.setTextColor(20); doc.setFont("helvetica", "bold");
      doc.text(r.value, x, y + 12);
      doc.setFont("helvetica", "normal");
    });
    y += 22;
  }

  autoTable(doc, {
    startY: y,
    head: [report.columns],
    body: report.rows,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [43, 196, 232], textColor: 255 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 14, right: 14 },
  });

  doc.setFontSize(8); doc.setTextColor(150);
  const pageH = doc.internal.pageSize.getHeight();
  doc.text(
    `Gerado em ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR })} • Agenda Fleur`,
    W / 2, pageH - 8, { align: "center" },
  );

  doc.save(report.filename || `relatorio_${format(new Date(), "yyyyMMdd_HHmm")}.pdf`);
}
