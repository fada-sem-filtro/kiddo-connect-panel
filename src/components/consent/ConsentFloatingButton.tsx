import { ShieldCheck } from "lucide-react";
import { useConsent } from "@/lib/consent/ConsentContext";

export function ConsentFloatingButton() {
  const { openPreferences, hasDecided } = useConsent();
  if (!hasDecided) return null; // banner ainda visível

  return (
    <button
      type="button"
      onClick={openPreferences}
      title="Preferências de Privacidade"
      aria-label="Preferências de Privacidade"
      className="fixed bottom-3 left-3 z-40 inline-flex items-center justify-center w-8 h-8 rounded-full bg-background/80 backdrop-blur border border-border shadow-sm hover:bg-muted hover:scale-105 transition-all opacity-60 hover:opacity-100"
    >
      <ShieldCheck className="w-3.5 h-3.5 text-primary" />
    </button>
  );
}
