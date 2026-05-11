import { Cookie, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useConsent } from "@/lib/consent/ConsentContext";
import { Link } from "react-router-dom";

export function ConsentBanner() {
  const { hasDecided, acceptAll, rejectOptional, openPreferences } = useConsent();

  if (hasDecided) return null;

  return (
    <div
      role="dialog"
      aria-label="Consentimento de cookies"
      className="fixed inset-x-0 bottom-0 z-[60] p-3 sm:p-4 pointer-events-none"
    >
      <div className="pointer-events-auto max-w-4xl mx-auto rounded-2xl border border-border bg-background/95 backdrop-blur-md shadow-lg p-4 sm:p-5">
        <div className="flex flex-col md:flex-row gap-4 md:items-center">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="hidden sm:flex shrink-0 w-10 h-10 rounded-xl bg-primary/10 items-center justify-center">
              <Cookie className="w-5 h-5 text-primary" aria-hidden />
            </div>
            <div className="text-sm text-foreground/90 leading-relaxed">
              Utilizamos cookies para melhorar sua experiência, personalizar conteúdo e
              analisar o tráfego. Você pode aceitar todos ou gerenciar suas preferências.{" "}
              <Link to="/politica-cookies" className="underline text-primary">
                Política de Cookies
              </Link>{" "}
              ·{" "}
              <Link to="/politica-privacidade" className="underline text-primary">
                Privacidade
              </Link>
              .
            </div>
          </div>
          <div className="flex flex-wrap gap-2 md:flex-nowrap md:shrink-0">
            <Button variant="ghost" size="sm" onClick={openPreferences}>
              <Settings2 className="w-4 h-4 mr-1.5" /> Personalizar
            </Button>
            <Button variant="outline" size="sm" onClick={rejectOptional}>
              Recusar opcionais
            </Button>
            <Button size="sm" onClick={acceptAll}>Aceitar todos</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
