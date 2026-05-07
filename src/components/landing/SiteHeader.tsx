import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Menu, X } from "lucide-react";
import logoFleur from "@/assets/logo-fleur-2.webp";

interface SiteHeaderProps {
  onOrcamentoClick?: () => void;
  /** @deprecated kept for backward compatibility — links are always shown now */
  showSobre?: boolean;
  /** @deprecated kept for backward compatibility — links are always shown now */
  showConheca?: boolean;
}

const PUBLIC_LINKS = [
  { to: "/", label: "Início" },
  { to: "/sobre", label: "Sobre" },
  { to: "/conheca", label: "Conheça" },
  { to: "/blog", label: "Blog" },
];

export function SiteHeader({ onOrcamentoClick }: SiteHeaderProps) {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (to: string) =>
    to === "/" ? pathname === "/" : pathname === to || pathname.startsWith(to + "/");

  return (
    <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-md border-b border-border">
      <div className="max-w-6xl mx-auto flex items-center gap-3 px-3 sm:px-4 py-2.5 sm:py-3">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <img src={logoFleur} alt="Agenda Fleur" className="h-7 sm:h-8 w-auto rounded-xl" loading="lazy" />
          <span className="font-bold text-foreground text-sm sm:text-base">Agenda Fleur</span>
        </Link>

        {/* Desktop nav */}
        <nav aria-label="Navegação principal" className="hidden md:flex items-center gap-1 ml-4">
          {PUBLIC_LINKS.map((link) => (
            <Link key={link.to} to={link.to}>
              <Button
                variant="ghost"
                size="sm"
                className={`text-sm px-3 ${
                  isActive(link.to) ? "text-primary font-semibold" : "text-foreground"
                }`}
              >
                {link.label}
              </Button>
            </Link>
          ))}
        </nav>

        <div className="flex-1" />

        {/* Right actions */}
        <div className="hidden md:flex items-center gap-2 shrink-0">
          {onOrcamentoClick && !user && (
            <Button
              variant="outline"
              size="sm"
              className="text-sm whitespace-nowrap"
              onClick={onOrcamentoClick}
            >
              Solicitar Orçamento
            </Button>
          )}
          <Link to={user ? "/agenda" : "/login"}>
            <Button size="sm" className="text-sm px-5 font-semibold">
              {user ? "Acessar Sistema" : "Entrar"}
            </Button>
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          type="button"
          aria-label="Abrir menu"
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((v) => !v)}
          className="md:hidden inline-flex items-center justify-center w-9 h-9 rounded-md hover:bg-muted text-foreground"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <nav
          aria-label="Navegação principal mobile"
          className="md:hidden border-t border-border bg-background"
        >
          <div className="max-w-6xl mx-auto px-3 py-2 flex flex-col">
            {PUBLIC_LINKS.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                className={`px-3 py-2.5 rounded-md text-sm ${
                  isActive(link.to)
                    ? "text-primary font-semibold bg-primary/5"
                    : "text-foreground hover:bg-muted"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <div className="flex flex-col gap-2 mt-2 pt-2 border-t border-border">
              {onOrcamentoClick && !user && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    setMobileOpen(false);
                    onOrcamentoClick();
                  }}
                >
                  Solicitar Orçamento
                </Button>
              )}
              <Link to={user ? "/agenda" : "/login"} onClick={() => setMobileOpen(false)}>
                <Button size="sm" className="w-full font-semibold">
                  {user ? "Acessar Sistema" : "Entrar"}
                </Button>
              </Link>
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}
