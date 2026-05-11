import { ShieldCheck } from "lucide-react";
import { useConsent } from "@/lib/consent/ConsentContext";

export function ConsentFloatingButton() {
  const { openPreferences, hasDecided } = useConsent();
  if (!hasDecided) return null; // banner já está visível

  return (
    <button
      type="button"
      onClick={openPreferences}
      title="Preferências de Privacidade"
      className="fixed bottom-5 left-5 z-40 inline-flex items-center gap-2 px-3 py-2 rounded-full text-xs font-medium bg-background/90 backdrop-blur border border-border shadow-md hover:bg-muted transition-colors"
    >
      <ShieldCheck className="w-4 h-4 text-primary" />
      <span className="hidden sm:inline">Preferências de Privacidade</span>
    </button>
  );
}
