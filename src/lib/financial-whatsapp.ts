// Helpers para envio manual de mensagens financeiras via wa.me
// Não envia automaticamente — abre WhatsApp Web/app com mensagem pré-preenchida.

export interface WhatsAppPlaceholders {
  responsavel?: string;
  aluno?: string;
  vencimento?: string;
  valor?: string;
  pix?: string;
  linha_digitavel?: string;
  escola?: string;
}

export function renderTemplate(template: string, p: WhatsAppPlaceholders): string {
  return template
    .replace(/\{responsavel\}/g, p.responsavel || "")
    .replace(/\{aluno\}/g, p.aluno || "")
    .replace(/\{vencimento\}/g, p.vencimento || "")
    .replace(/\{valor\}/g, p.valor || "")
    .replace(/\{pix\}/g, p.pix || "")
    .replace(/\{linha_digitavel\}/g, p.linha_digitavel || "")
    .replace(/\{escola\}/g, p.escola || "");
}

export function buildWhatsAppLink(phone: string | undefined, message: string): string {
  const onlyDigits = (phone || "").replace(/\D/g, "");
  // BR default DDI 55 if missing
  const withDdi = onlyDigits.length > 0 && !onlyDigits.startsWith("55") && onlyDigits.length <= 11
    ? "55" + onlyDigits
    : onlyDigits;
  const text = encodeURIComponent(message);
  return withDdi ? `https://wa.me/${withDdi}?text=${text}` : `https://wa.me/?text=${text}`;
}

export const DEFAULT_TEMPLATES = {
  lembrete: "Olá {responsavel}! 🌸 Lembrete da mensalidade de {aluno} no valor de {valor} com vencimento em {vencimento}. PIX: {pix}",
  cobranca: "Olá {responsavel}, identificamos que a mensalidade de {aluno} ({valor}) venceu em {vencimento}. Pode regularizar via PIX: {pix}. Obrigado!",
  recibo: "Olá {responsavel}! Recebemos o pagamento de {valor} referente a {aluno}. Obrigado! 💙 — {escola}",
  segunda_via: "Olá {responsavel}, segue 2ª via da mensalidade de {aluno} ({valor}, vence {vencimento}). PIX: {pix}",
};
