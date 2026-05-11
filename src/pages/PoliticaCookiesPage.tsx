import { SiteHeader } from "@/components/landing/SiteHeader";
import { PublicFooterMeta } from "@/components/consent/PublicFooterMeta";
import { Button } from "@/components/ui/button";
import { useConsent } from "@/lib/consent/ConsentContext";

export default function PoliticaCookiesPage() {
  const { openPreferences } = useConsent();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteHeader />
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-10">
        <h1 className="text-3xl font-bold text-foreground mb-2">Política de Cookies</h1>
        <p className="text-sm text-muted-foreground mb-8">
          Última atualização: maio de 2026
        </p>

        <section className="prose prose-sm max-w-none text-foreground/90 space-y-4">
          <p>
            Este site utiliza cookies e tecnologias semelhantes para garantir o
            funcionamento, melhorar a experiência de uso e mensurar o desempenho
            da plataforma.
          </p>

          <h2 className="text-xl font-semibold mt-6">Categorias de cookies</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>Necessários:</strong> indispensáveis para o funcionamento
              do sistema, autenticação e segurança. Não podem ser desativados.
            </li>
            <li>
              <strong>Funcionais:</strong> guardam preferências (tema, idioma,
              filtros) para uma experiência mais personalizada.
            </li>
            <li>
              <strong>Analytics:</strong> coletam dados agregados e anônimos
              sobre o uso do site (ex.: Google Analytics, Microsoft Clarity).
            </li>
            <li>
              <strong>Marketing:</strong> utilizados para mensurar campanhas e
              exibir conteúdo relevante (ex.: Meta Pixel, Google Ads).
            </li>
            <li>
              <strong>Personalização:</strong> adaptam conteúdos e recomendações
              ao seu perfil de navegação (ex.: Hotjar).
            </li>
          </ul>

          <h2 className="text-xl font-semibold mt-6">Como gerenciar</h2>
          <p>
            Você pode aceitar, recusar ou personalizar suas preferências a
            qualquer momento. As escolhas são armazenadas localmente em seu
            navegador e podem ser revogadas quando desejar.
          </p>

          <Button onClick={openPreferences}>Gerenciar preferências</Button>

          <h2 className="text-xl font-semibold mt-6">Validade</h2>
          <p>
            Suas preferências de cookies têm validade de 12 meses. Após esse
            período, solicitaremos um novo consentimento.
          </p>
        </section>
      </main>

      <footer className="py-6 px-4 border-t border-border">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs text-muted-foreground text-center">
            Copyright © 2026 - Desenvolvido por Fleur Tech Solutions.
          </p>
          <PublicFooterMeta />
        </div>
      </footer>
    </div>
  );
}
