import jsPDF from "jspdf";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ReceiptData {
  numero: string;
  pagador: { nome: string; documento?: string };
  beneficiario: { nome: string; documento?: string; logoUrl?: string | null };
  descricao: string;
  valor: number;
  pagoEm: string | Date;
  metodo?: string;
  referencia?: string;
}

const fmtBRL = (v: number) => `R$ ${Number(v).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

async function loadImg(url: string): Promise<string | null> {
  try {
    const r = await fetch(url);
    const b = await r.blob();
    return await new Promise((res) => {
      const fr = new FileReader();
      fr.onloadend = () => res(fr.result as string);
      fr.onerror = () => res(null);
      fr.readAsDataURL(b);
    });
  } catch { return null; }
}

export async function generateReceiptPdf(data: ReceiptData): Promise<jsPDF> {
  const doc = new jsPDF({ format: "a4", unit: "mm" });
  const W = doc.internal.pageSize.getWidth();
  let y = 18;

  // Logo
  if (data.beneficiario.logoUrl) {
    const img = await loadImg(data.beneficiario.logoUrl);
    if (img) {
      try { doc.addImage(img, "PNG", 15, 12, 22, 22); } catch {}
    }
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(43, 196, 232);
  doc.text("RECIBO DE PAGAMENTO", W - 15, y, { align: "right" });
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.setFont("helvetica", "normal");
  doc.text(`Nº ${data.numero}`, W - 15, y + 6, { align: "right" });

  y = 42;
  doc.setDrawColor(220);
  doc.line(15, y, W - 15, y);
  y += 8;

  // Valor destaque
  doc.setFillColor(43, 196, 232, 0.08 as any);
  doc.roundedRect(15, y, W - 30, 22, 3, 3, "F");
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text("VALOR PAGO", 20, y + 7);
  doc.setFontSize(22);
  doc.setTextColor(20);
  doc.setFont("helvetica", "bold");
  doc.text(fmtBRL(data.valor), 20, y + 16);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100);
  const pagoEm = typeof data.pagoEm === "string" ? new Date(data.pagoEm) : data.pagoEm;
  doc.text(`Pago em ${format(pagoEm, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`, W - 20, y + 16, { align: "right" });

  y += 32;

  // Pagador / Beneficiário
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text("PAGADOR", 15, y);
  doc.text("BENEFICIÁRIO", W / 2 + 5, y);
  y += 5;
  doc.setTextColor(20);
  doc.setFont("helvetica", "bold");
  doc.text(data.pagador.nome, 15, y);
  doc.text(data.beneficiario.nome, W / 2 + 5, y);
  if (data.pagador.documento || data.beneficiario.documento) {
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    if (data.pagador.documento) doc.text(`CPF/CNPJ: ${data.pagador.documento}`, 15, y);
    if (data.beneficiario.documento) doc.text(`CNPJ: ${data.beneficiario.documento}`, W / 2 + 5, y);
  }

  y += 12;
  doc.setDrawColor(230);
  doc.line(15, y, W - 15, y);
  y += 8;

  // Descrição
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text("DESCRIÇÃO", 15, y);
  y += 6;
  doc.setTextColor(20);
  doc.setFontSize(11);
  const desc = doc.splitTextToSize(data.descricao, W - 30);
  doc.text(desc, 15, y);
  y += desc.length * 6 + 6;

  if (data.metodo) {
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(`Forma de pagamento: ${data.metodo}`, 15, y);
    y += 5;
  }
  if (data.referencia) {
    doc.text(`Referência: ${data.referencia}`, 15, y);
    y += 5;
  }

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text("Documento gerado eletronicamente pela Agenda Fleur.", W / 2, 285, { align: "center" });
  doc.text(`Emitido em ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR })}`, W / 2, 290, { align: "center" });

  return doc;
}

export async function downloadReceiptPdf(data: ReceiptData) {
  const doc = await generateReceiptPdf(data);
  doc.save(`recibo_${data.numero}.pdf`);
}
