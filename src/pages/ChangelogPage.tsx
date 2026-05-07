import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, RefreshCw, Sparkles, Shield, Bug, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type EntryType = "feature" | "improvement" | "fix" | "security";

interface ChangelogEntry {
  version: string;
  date: string;
  title: string;
  highlights: { type: EntryType; text: string }[];
}

const TYPE_META: Record<EntryType, { label: string; icon: typeof Sparkles; className: string }> = {
  feature: { label: "Novo", icon: Sparkles, className: "bg-primary/10 text-primary border-primary/20" },
  improvement: { label: "Melhoria", icon: Zap, className: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  fix: { label: "Correção", icon: Bug, className: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
  security: { label: "Segurança", icon: Shield, className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
};

const CHANGELOG: ChangelogEntry[] = [
  {
    version: "2.6.3",
    date: "Maio 2026",
    title: "Blog com SEO avançado, site público unificado e suporte aprimorado",
    highlights: [
      {
        type: "feature",
        text: "Novo Blog público em /blog com listagem, categorias, tags e páginas de artigo otimizadas para SEO.",
      },
      {
        type: "feature",
        text: "CMS administrativo do Blog com editor rico (TipTap), upload de imagens, slug automático, palavras-chave e preview do snippet do Google.",
      },
      {
        type: "feature",
        text: "Sitemap.xml dinâmico e robots.txt atualizados, com JSON-LD (Article/Blog), Open Graph e meta tags otimizadas.",
      },
      {
        type: "improvement",
        text: "Cabeçalho público unificado em todas as páginas (Início, Sobre, Conheça, Blog), com menu mobile e destaque da rota ativa.",
      },
      {
        type: "improvement",
        text: "Catálogo único de funcionalidades reaproveitado nas páginas Sobre e Conheça para sempre refletir o sistema atual.",
      },
      { type: "fix", text: "Mensagens de suporte agora aparecem corretamente nos Recados de quem abriu o chamado." },
      {
        type: "fix",
        text: "Editor do Blog passou a sincronizar o conteúdo carregado, evitando salvar artigos em branco ao editar.",
      },
      {
        type: "security",
        text: "Bucket de imagens do Blog com listagem restrita a administradores; URLs públicas continuam funcionando para leitura.",
      },
    ],
  },
  {
    version: "2.6.2",
    date: "Maio 2026",
    title: "Permissões granulares na interface e blindagem de segurança",
    highlights: [
      { type: "fix", text: "Botões de criar, editar e excluir respeitam as permissões do perfil." },
      {
        type: "improvement",
        text: "Permissões aplicadas em Alunos, Turmas, Corpo Docente, Usuários, Recados, Eventos, Calendário, Feriados, Matérias, Grade de Aulas, Boletim, Atividades Pedagógicas e Relatórios.",
      },
      { type: "security", text: "Uploads de anexos restritos à pasta do próprio usuário no bucket de recados." },
      { type: "security", text: "Realtime com escopo por identidade, escola, turma e aluno." },
      { type: "security", text: "Função de envio de orçamentos endurecida com validação adicional contra abuso." },
    ],
  },
  {
    version: "2.6",
    date: "Abril 2026",
    title: "Auditoria dos dados, política LGPD e segurança reforçada",
    highlights: [
      {
        type: "feature",
        text: "Auditoria registrando visualização, envio, alteração e remoção das informações no sistema.",
      },
      { type: "security", text: "Implementação de bucket privado." },
      { type: "security", text: "RLS reforçado em eventos futuros: cada escola só vê os próprios eventos." },
      { type: "security", text: "Implementação de política LGPD." },
      { type: "improvement", text: "Educadores agora abrem direto no painel do educador ao acessar o sistema." },
    ],
  },
  {
    version: "2.5",
    date: "Abril 2026",
    title: "Painel pedagógico e atividades",
    highlights: [
      { type: "feature", text: "Módulo de atividades com média geral calculada automaticamente." },
      { type: "feature", text: "Boletim restrito ao 1º ano do Fundamental (alunos 6+)." },
      { type: "improvement", text: "Segmentação automática entre rotina e parte acadêmica conforme idade/série." },
    ],
  },
  {
    version: "2.4",
    date: "Março 2026",
    title: "Customização de menu e papel de secretaria",
    highlights: [
      { type: "feature", text: "Sidebar configurável por escola e perfil, com arrastar e soltar." },
      { type: "feature", text: "Novo perfil 'Secretaria', habilitado por escola pelo diretor." },
      { type: "improvement", text: "Seletor de escola global para o admin facilitando a navegação multi-tenant." },
    ],
  },
  {
    version: "2.3",
    date: "Março 2026",
    title: "Financeiro e comunicações em massa",
    highlights: [
      { type: "feature", text: "Dashboard financeiro com geração de boletos individuais e em lote." },
      { type: "feature", text: "Envio de eventos e recados em massa para turmas inteiras." },
      { type: "improvement", text: "Notificações em tempo real para responsáveis e educadores." },
    ],
  },
  {
    version: "2.2",
    date: "Fevereiro 2026",
    title: "Calendário escolar interativo",
    highlights: [
      { type: "feature", text: "Visão anual e mensal interativa do calendário escolar." },
      { type: "feature", text: "Cadastro de feriados e eventos futuros por escola." },
      { type: "improvement", text: "Linha do tempo da agenda agrupada por Manhã, Tarde e Noite." },
    ],
  },
  {
    version: "2.1",
    date: "Janeiro 2026",
    title: "Autorizações de retirada e medicamentos",
    highlights: [
      { type: "feature", text: "Cadastro de pessoas autorizadas a retirar o aluno, com foto e telefone." },
      { type: "feature", text: "Lembrete automático 5 minutos antes do horário do medicamento." },
      { type: "improvement", text: "Registro de presenças com Presente/Ausente/Saiu e timestamps automáticos." },
    ],
  },
  {
    version: "2.0",
    date: "Dezembro 2025",
    title: "Multi-tenancy e novos perfis",
    highlights: [
      { type: "feature", text: "Suporte a múltiplas escolas com isolamento total de dados (RLS)." },
      { type: "feature", text: "Perfis Diretor, Educador, Responsável e Aluno com painéis dedicados." },
      { type: "feature", text: "Sistema de recados bidirecional com suporte a imagens até 10 MB." },
    ],
  },
];

export default function ChangelogPage() {
  useEffect(() => {
    document.title = "Changelog | Agenda Fleur — Histórico de atualizações";
    const meta = document.querySelector('meta[name="description"]');
    const desc = "Histórico completo de atualizações, melhorias e correções da Agenda Fleur.";
    if (meta) {
      meta.setAttribute("content", desc);
    } else {
      const m = document.createElement("meta");
      m.name = "description";
      m.content = desc;
      document.head.appendChild(m);
    }
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Link>
          <Link to="/" className="font-bold text-primary">
            Agenda Fleur
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="px-4 py-12 md:py-16 text-center">
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
            <RefreshCw className="w-3.5 h-3.5" />
            Changelog público
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold">Novidades do sistema</h1>
          <p className="text-muted-foreground">
            Acompanhe todas as atualizações, melhorias, correções e novidades de segurança da Agenda Fleur.
          </p>
        </div>
      </section>

      {/* Timeline */}
      <section className="px-4 pb-20">
        <div className="max-w-3xl mx-auto space-y-8">
          {CHANGELOG.map((entry) => (
            <article
              key={entry.version}
              className="rounded-2xl border border-border bg-card shadow-sm p-6 md:p-8 space-y-4"
            >
              <header className="flex flex-wrap items-baseline justify-between gap-2">
                <div className="flex items-baseline gap-3">
                  <h2 className="text-xl md:text-2xl font-bold text-foreground">v{entry.version}</h2>
                  <span className="text-sm text-muted-foreground">{entry.date}</span>
                </div>
                <span className="text-sm font-medium text-primary">{entry.title}</span>
              </header>

              <ul className="space-y-3">
                {entry.highlights.map((h, idx) => {
                  const meta = TYPE_META[h.type];
                  const Icon = meta.icon;
                  return (
                    <li key={idx} className="flex items-start gap-3">
                      <Badge variant="outline" className={`${meta.className} shrink-0 gap-1 mt-0.5`}>
                        <Icon className="w-3 h-3" />
                        {meta.label}
                      </Badge>
                      <p className="text-sm text-foreground/90 leading-relaxed">{h.text}</p>
                    </li>
                  );
                })}
              </ul>
            </article>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <p>Copyright © 2026 - Desenvolvido por Raissa.</p>
          <div className="flex items-center gap-4">
            <Link to="/" className="hover:text-primary transition-colors">
              Início
            </Link>
            <Link to="/sobre" className="hover:text-primary transition-colors">
              Sobre
            </Link>
            <Link to="/login" className="hover:text-primary transition-colors">
              Entrar
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
