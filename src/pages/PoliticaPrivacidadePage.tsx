import { SiteHeader } from "@/components/landing/SiteHeader";
import { PublicFooterMeta } from "@/components/consent/PublicFooterMeta";
import { Link } from "react-router-dom";

export default function PoliticaPrivacidadePage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteHeader />
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-10">
        <h1 className="text-3xl font-bold text-foreground mb-2">Política de Privacidade</h1>
        <p className="text-sm text-muted-foreground mb-8">
          Última atualização: maio de 2026
        </p>

        <section className="prose prose-sm max-w-none text-foreground/90 space-y-4">
          <p>
            A <strong>Agenda Fleur</strong> respeita a sua privacidade e está
            comprometida com a proteção dos seus dados pessoais, em conformidade
            com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018 — LGPD).
          </p>

          <h2 className="text-xl font-semibold mt-6">1. Dados coletados</h2>
          <p>
            Coletamos apenas os dados necessários para a prestação do serviço:
            nome, e-mail, dados de autenticação, informações da escola e dados
            pedagógicos relacionados ao uso do sistema.
          </p>

          <h2 className="text-xl font-semibold mt-6">2. Finalidade do tratamento</h2>
          <p>Os dados são utilizados para:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>autenticar e identificar usuários;</li>
            <li>permitir comunicação entre escola, responsáveis e alunos;</li>
            <li>gerar relatórios pedagógicos e administrativos;</li>
            <li>melhorar a segurança, estabilidade e qualidade do serviço.</li>
          </ul>

          <h2 className="text-xl font-semibold mt-6">3. Compartilhamento</h2>
          <p>
            Não comercializamos dados pessoais. Compartilhamos informações apenas
            com provedores de infraestrutura essenciais (hospedagem, e-mail
            transacional) e mediante obrigação legal.
          </p>

          <h2 className="text-xl font-semibold mt-6">4. Direitos do titular</h2>
          <p>
            Você pode, a qualquer momento, solicitar acesso, correção, exclusão,
            portabilidade ou revogação de consentimento dos seus dados, por meio
            do e-mail{" "}
            <a className="text-primary underline" href="mailto:contato@agendafleur.app">
              contato@agendafleur.app
            </a>
            .
          </p>

          <h2 className="text-xl font-semibold mt-6">5. Cookies</h2>
          <p>
            Utilizamos cookies para garantir o funcionamento do sistema,
            personalizar sua experiência e analisar o uso da plataforma. Consulte
            nossa{" "}
            <Link to="/politica-cookies" className="text-primary underline">
              Política de Cookies
            </Link>{" "}
            para detalhes.
          </p>

          <h2 className="text-xl font-semibold mt-6">6. Segurança</h2>
          <p>
            Adotamos medidas técnicas e organizacionais para proteger seus dados,
            incluindo criptografia em trânsito, controle de acesso, isolamento
            por instituição e auditoria contínua.
          </p>

          <h2 className="text-xl font-semibold mt-6">7. Retenção</h2>
          <p>
            Mantemos seus dados pelo tempo necessário ao cumprimento das
            finalidades, contratos e obrigações legais.
          </p>

          <h2 className="text-xl font-semibold mt-6">8. Encarregado (DPO)</h2>
          <p>
            Para questões relacionadas a proteção de dados, entre em contato pelo
            e-mail{" "}
            <a className="text-primary underline" href="mailto:contato@agendafleur.app">
              contato@agendafleur.app
            </a>
            .
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
