import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import logoFleur from "@/assets/logo-fleur-2.webp";

interface SiteHeaderProps {
  onOrcamentoClick?: () => void;
  showSobre?: boolean;
  showConheca?: boolean;
}

export function SiteHeader({ onOrcamentoClick, showSobre = true, showConheca = true }: SiteHeaderProps) {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-md border-b border-border">
      <div className="max-w-6xl mx-auto flex items-center px-3 sm:px-4 py-2.5 sm:py-3">
        {/* Left: Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <img src={logoFleur} alt="Agenda Fleur" className="h-7 sm:h-8 w-auto rounded-xl" loading="lazy" />
          <span className="font-bold text-foreground text-sm sm:text-base">Agenda Fleur</span>
        </Link>

        {/* Center: Entrar button */}
        <div className="flex-1 flex justify-center">
          <Link to={user ? "/agenda" : "/login"}>
            <Button size="sm" className="text-sm sm:text-base px-5 sm:px-6 font-semibold">
              {user ? "Acessar Sistema" : "Entrar"}
            </Button>
          </Link>
        </div>

        {/* Right: Other nav buttons (hidden when logged in) */}
        {!user && (
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {showSobre && (
              <Link to="/sobre">
                <Button variant="ghost" size="sm" className="text-xs sm:text-sm px-2 sm:px-3">
                  Sobre
                </Button>
              </Link>
            )}
            {showConheca && (
              <Link to="/conheca">
                <Button variant="ghost" size="sm" className="text-xs sm:text-sm px-2 sm:px-3">
                  <span className="hidden sm:inline">Conheça</span>
                  <span className="sm:hidden">Sistema</span>
                </Button>
              </Link>
            )}
            {onOrcamentoClick && (
              <Button
                variant="outline"
                size="sm"
                className="text-xs sm:text-sm px-2 sm:px-3 whitespace-nowrap"
                onClick={onOrcamentoClick}
              >
                <span className="hidden sm:inline">Solicitar Orçamento</span>
                <span className="sm:hidden">Solicitar Orçamento</span>
              </Button>
            )}
          </div>
        )}

        {/* Spacer to balance layout when logged in */}
        {user && <div className="shrink-0 w-[100px] hidden xs:block" />}
      </div>
    </header>
  );
}
