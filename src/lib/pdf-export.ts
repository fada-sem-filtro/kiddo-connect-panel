import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PdfHeaderOptions {
  title: string;
  subtitle?: string;
  crecheNome: string;
  logoUrl?: string | null;
  crecheEndereco?: string | null;
  crecheTelefone?: string | null;
  crecheEmail?: string | null;
  periodo?: string;
}

async function loadImageAsBase64(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

async function addHeader(doc: jsPDF, options: PdfHeaderOptions): Promise<number> {
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 15;

  // Logo
  if (options.logoUrl) {
    const imgData = await loadImageAsBase64(options.logoUrl);
    if (imgData) {
      try {
        doc.addImage(imgData, 'PNG', 14, y, 25, 25);
      } catch {
        // ignore image errors
      }
    }
  }

  // Title area
  const textX = options.logoUrl ? 45 : 14;
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(43, 196, 232); // #2BC4E8
  doc.text(options.crecheNome, textX, y + 8);

  // Creche details line
  const detailParts: string[] = [];
  if (options.crecheEndereco) detailParts.push(options.crecheEndereco);
  if (options.crecheTelefone) detailParts.push(options.crecheTelefone);
  if (options.crecheEmail) detailParts.push(options.crecheEmail);

  if (detailParts.length > 0) {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(130, 130, 130);
    doc.text(detailParts.join('  |  '), textX, y + 14);
  }

  doc.setFontSize(14);
  doc.setTextColor(60, 60, 60);
  doc.text(options.title, textX, y + (detailParts.length > 0 ? 22 : 18));

  if (options.subtitle) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(120, 120, 120);
    doc.text(options.subtitle, textX, y + (detailParts.length > 0 ? 29 : 25));
    y += (detailParts.length > 0 ? 34 : 30);
  } else {
    y += (detailParts.length > 0 ? 28 : 24);
  }

  if (options.periodo) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(120, 120, 120);
    doc.text(`Período: ${options.periodo}`, 14, y + 8);
    y += 12;
  }

  // Divider line
  y += 4;
  doc.setDrawColor(43, 196, 232);
  doc.setLineWidth(0.8);
  doc.line(14, y, pageWidth - 14, y);
  y += 8;

  return y;
}

function addFooter(doc: jsPDF) {
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const pageHeight = doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.getWidth();
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(150, 150, 150);
    doc.text(`Gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`, 14, pageHeight - 10);
    doc.text(`Página ${i} de ${pageCount}`, pageWidth - 14, pageHeight - 10, { align: 'right' });
    doc.text('Agenda Fleur', pageWidth / 2, pageHeight - 10, { align: 'center' });
  }
}

// ---- Relatório de Presença (lista geral) ----

export interface PresencaReportRow {
  crianca_nome: string;
  turma_nome: string;
  data: string;
  status: string;
  hora_chegada: string | null;
  hora_saida: string | null;
  tempo: string;
}

export async function exportPresencaPDF(
  rows: PresencaReportRow[],
  options: PdfHeaderOptions
) {
  const doc = new jsPDF('landscape', 'mm', 'a4');
  const startY = await addHeader(doc, options);

  // Summary
  const total = rows.length;
  const presentes = rows.filter(r => r.status === 'presente' || r.status === 'saiu').length;
  const ausentes = rows.filter(r => r.status === 'ausente').length;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(60, 60, 60);
  doc.text(`Total: ${total} registros  |  Presentes: ${presentes}  |  Ausentes: ${ausentes}`, 14, startY);

  autoTable(doc, {
    startY: startY + 6,
    head: [['Aluno', 'Turma', 'Data', 'Status', 'Chegada', 'Saída', 'Tempo']],
    body: rows.map(r => [
      r.crianca_nome,
      r.turma_nome,
      format(new Date(r.data + 'T00:00:00'), 'dd/MM/yyyy'),
      r.status === 'presente' ? 'Presente' : r.status === 'saiu' ? 'Saiu' : 'Ausente',
      r.hora_chegada ? format(new Date(r.hora_chegada), 'HH:mm') : '—',
      r.hora_saida ? format(new Date(r.hora_saida), 'HH:mm') : '—',
      r.tempo,
    ]),
    styles: { fontSize: 9, cellPadding: 3, font: 'helvetica' },
    headStyles: { fillColor: [43, 196, 232], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 250, 252] },
    margin: { left: 14, right: 14 },
  });

  addFooter(doc);
  doc.save(`relatorio-presenca-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
}

// ---- Relatório Individual do Aluno ----

export interface AlunoReportData {
  alunoNome: string;
  turmaNome: string;
  dataNascimento: string;
  taxaPresenca: number;
  diasPresente: number;
  diasAusente: number;
  totalDias: number;
  totalEventos: number;
  responsaveis?: { nome: string; parentesco: string; telefone?: string | null; email?: string | null }[];
  presencas: {
    data: string;
    status: string;
    hora_chegada: string | null;
    hora_saida: string | null;
    tempo: string;
  }[];
  eventos: {
    data: string;
    tipo: string;
    tipoLabel: string;
    observacao: string | null;
  }[];
}

export async function exportAlunoRelatorioPDF(
  data: AlunoReportData,
  options: PdfHeaderOptions
) {
  const doc = new jsPDF('portrait', 'mm', 'a4');
  let startY = await addHeader(doc, {
    ...options,
    subtitle: `${data.alunoNome} — ${data.turmaNome}`,
  });

  // Info card
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  doc.text(`Data de Nascimento: ${format(new Date(data.dataNascimento + 'T00:00:00'), 'dd/MM/yyyy')}`, 14, startY);
  startY += 6;

  // Summary boxes
  const boxW = 55;
  const boxH = 18;
  const boxes = [
    { label: 'Taxa de Presença', value: `${data.taxaPresenca}%`, color: [43, 196, 232] as [number, number, number] },
    { label: 'Dias Presente', value: `${data.diasPresente} de ${data.totalDias}`, color: [76, 175, 80] as [number, number, number] },
    { label: 'Eventos', value: `${data.totalEventos}`, color: [255, 152, 0] as [number, number, number] },
  ];

  boxes.forEach((box, i) => {
    const x = 14 + i * (boxW + 8);
    doc.setFillColor(...box.color);
    doc.roundedRect(x, startY, boxW, boxH, 3, 3, 'F');
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(box.value, x + boxW / 2, startY + 8, { align: 'center' });
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(box.label, x + boxW / 2, startY + 14, { align: 'center' });
  });

  startY += boxH + 10;

  // Presença table
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(60, 60, 60);
  doc.text('Histórico de Presença', 14, startY);
  startY += 4;

  autoTable(doc, {
    startY,
    head: [['Data', 'Status', 'Chegada', 'Saída', 'Tempo']],
    body: data.presencas.map(p => [
      format(new Date(p.data + 'T00:00:00'), "EEE, dd/MM", { locale: ptBR }),
      p.status === 'presente' ? 'Presente' : p.status === 'saiu' ? 'Saiu' : 'Ausente',
      p.hora_chegada ? format(new Date(p.hora_chegada), 'HH:mm') : '—',
      p.hora_saida ? format(new Date(p.hora_saida), 'HH:mm') : '—',
      p.tempo,
    ]),
    styles: { fontSize: 9, cellPadding: 3, font: 'helvetica' },
    headStyles: { fillColor: [43, 196, 232], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 250, 252] },
    margin: { left: 14, right: 14 },
  });

  // Events table
  const finalY = (doc as any).lastAutoTable?.finalY || startY + 20;
  let evStartY = finalY + 10;

  if (evStartY > doc.internal.pageSize.getHeight() - 40) {
    doc.addPage();
    evStartY = 20;
  }

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(60, 60, 60);
  doc.text('Eventos Registrados', 14, evStartY);
  evStartY += 4;

  if (data.eventos.length > 0) {
    autoTable(doc, {
      startY: evStartY,
      head: [['Data', 'Tipo', 'Observação']],
      body: data.eventos.map(e => [
        e.data,
        e.tipoLabel,
        e.observacao || '—',
      ]),
      styles: { fontSize: 9, cellPadding: 3, font: 'helvetica' },
      headStyles: { fillColor: [255, 152, 0], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [255, 249, 240] },
      margin: { left: 14, right: 14 },
      columnStyles: { 2: { cellWidth: 80 } },
    });
  } else {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(150, 150, 150);
    doc.text('Nenhum evento registrado no período.', 14, evStartY + 6);
  }

  addFooter(doc);
  doc.save(`relatorio-${data.alunoNome.replace(/\s+/g, '-').toLowerCase()}-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
}
