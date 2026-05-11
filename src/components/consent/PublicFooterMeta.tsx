import { Link } from "react-router-dom";
import { useConsent } from "@/lib/consent/ConsentContext";
import { APP_VERSION } from "@/lib/app-version";

/**
 * Linha extra para footers públicos: links institucionais LGPD + versão.
 * Inserir abaixo dos links existentes em cada footer.
 */
export function PublicFooterMeta() {
  const { openPreferences } = useConsent();
  return (
    <div className="mt-3 pt-3 border-t border-border/60 flex flex-wrap items-center justify-center sm:justify-between gap-x-4 gap-y-2 text-[11px] text-muted-foreground">
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        <Link to="/politica-privacidade" className="hover:text-primary transition-colors">
          Política de Privacidade
        </Link>
        <Link to="/politica-cookies" className="hover:text-primary transition-colors">
          Política de Cookies
        </Link>
        <button onClick={openPreferences} className="hover:text-primary transition-colors">
          Preferências de Privacidade
        </button>
      </div>
      <span aria-label="Versão do sistema">v{APP_VERSION}</span>
    </div>
  );
}
