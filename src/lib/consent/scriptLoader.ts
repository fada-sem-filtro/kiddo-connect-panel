import type { ConsentChoices } from "./types";

const loaded = new Set<string>();

export function loadScript(id: string, src: string, attrs: Record<string, string> = {}) {
  if (typeof document === "undefined") return;
  if (loaded.has(id) || document.getElementById(id)) { loaded.add(id); return; }
  const s = document.createElement("script");
  s.id = id;
  s.src = src;
  s.async = true;
  Object.entries(attrs).forEach(([k, v]) => s.setAttribute(k, v));
  document.head.appendChild(s);
  loaded.add(id);
}

/**
 * Aplica scripts de tracking de acordo com o consentimento.
 * Chamado automaticamente pelo ConsentContext sempre que houver mudança.
 *
 * Para ativar uma integração no futuro, basta descomentar e ajustar o ID.
 */
export function applyConsent(choices: ConsentChoices) {
  if (choices.analytics) {
    // loadScript("ga4", "https://www.googletagmanager.com/gtag/js?id=G-XXXX");
    // loadScript("clarity", "https://www.clarity.ms/tag/XXXX");
  }
  if (choices.marketing) {
    // loadScript("meta-pixel", "https://connect.facebook.net/en_US/fbevents.js");
  }
  if (choices.personalization) {
    // loadScript("hotjar", "https://static.hotjar.com/c/hotjar-XXXX.js");
  }
}
