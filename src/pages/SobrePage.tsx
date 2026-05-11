import { useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { SiteHeader } from "@/components/landing/SiteHeader";
import { motion, useInView } from "framer-motion";
import { ArrowRight, Star, Mail, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SYSTEM_FEATURES } from "@/lib/system-features";
import { PublicFooterMeta } from "@/components/consent/PublicFooterMeta";

/* ── Animated section wrapper ── */
function AnimSection({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

const funcionalidades = SYSTEM_FEATURES;

const publicoAlvo = [
  "Creches",
  "Escolas de educação infantil",
  "Escolas de ensino fundamental",
  "Instituições educacionais que utilizam agenda escolar",
  "Escolas que desejam substituir a agenda de papel por um sistema digital",
];

export default function SobrePage() {
  useEffect(() => {
    document.title = "Agenda Fleur | Sobre a agenda escolar digital";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute(
        "content",
        "Conheça a história da Agenda Fleur, a agenda escolar digital criada para facilitar a comunicação entre escolas, creches e responsáveis.",
      );
    }
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader showSobre={false} />

      {/* HERO / H1 */}
      <section className="py-16 md:py-24 px-4 bg-gradient-to-br from-primary/10 via-primary/5 to-accent/10">
        <AnimSection className="max-w-4xl mx-auto text-center space-y-6">
          <h1 className="text-3xl md:text-5xl font-extrabold leading-tight text-foreground">
            Agenda Fleur: Aproximando Escolas e Famílias através da Comunicação Digital
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Tecnologia simples, acessível e eficiente para transformar a comunicação escolar.
          </p>
        </AnimSection>
      </section>

      {/* COMO SURGIU */}
      <section className="py-16 md:py-20 px-4 bg-muted/40">
        <AnimSection className="max-w-3xl mx-auto space-y-6">
          <h2 className="text-2xl md:text-4xl font-bold text-foreground">Como surgiu a Agenda Fleur</h2>
          <article className="prose prose-lg max-w-none text-foreground/90 space-y-4">
            <p>A ideia da Agenda Fleur surgiu a partir de uma necessidade real do dia a dia.</p>
            <p>
              A creche do meu filho utilizava uma agenda de papel para registrar informações sobre a rotina das
              crianças. Todos os dias os educadores precisavam escrever manualmente o que aconteceu durante o período
              escolar, como alimentação, sono, trocas de fralda e atividades realizadas.
            </p>
            <p>Apesar de funcionar, esse modelo apresenta diversas limitações.</p>
            <p>
              A agenda pode ser perdida, as informações não chegam em tempo real aos responsáveis e não existe um
              histórico digital organizado ao longo do tempo.
            </p>
            <p>
              Além disso, agendas de papel não permitem o envio de fotos, registros pedagógicos detalhados ou
              comunicação instantânea entre escola e família.
            </p>
            <p>
              Diante dessa realidade, surgiu a ideia de criar um <strong>sistema de agenda escolar</strong> digital
              simples, acessível e eficiente que pudesse substituir a agenda de papel e melhorar a comunicação entre
              escolas e responsáveis.
            </p>
            <p className="font-semibold text-primary">Assim nasceu a Agenda Fleur.</p>
          </article>
        </AnimSection>
      </section>

      {/* MISSÃO, VISÃO E VALORES */}
      <section className="py-16 md:py-20 px-4 bg-muted/40">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <AnimSection className="bg-card rounded-3xl border border-border p-8 shadow-sm space-y-4">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">Nossa missão</h2>
            <p className="text-foreground/90 leading-relaxed">
              Ajudar instituições de ensino a oferecerem uma experiência mais organizada, próxima e eficiente no dia a
              dia escolar, fortalecendo vínculos, aproximando responsáveis da rotina das crianças e tornando a
              comunicação mais leve, prática e segura para todos.
            </p>
          </AnimSection>
          <AnimSection className="bg-card rounded-3xl border border-border p-8 shadow-sm space-y-4">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">Nossa visão</h2>
            <p className="text-foreground/90 leading-relaxed">
              Ser referência em comunicação escolar digital, conectando escolas e famílias de forma mais humana, moderna
              e eficiente. Queremos transformar a rotina da educação infantil através da tecnologia, ajudando
              instituições de ensino a criarem relações mais próximas, organizadas e participativas com as famílias.
            </p>
          </AnimSection>
          <AnimSection className="bg-card rounded-3xl border border-border p-8 shadow-sm space-y-4">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">Nossos valores</h2>
            <p className="text-foreground/90 leading-relaxed">
              Valorizamos a confiança, o cuidado com cada detalhe da infância, a praticidade na rotina escolar e o uso
              da tecnologia para aproximar pessoas, gerar tranquilidade para os responsáveis e apoiar o trabalho das
              instituições de ensino.
            </p>
          </AnimSection>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 md:py-28 px-4 bg-gradient-to-br from-primary/10 via-primary/5 to-accent/10">
        <AnimSection className="max-w-3xl mx-auto text-center space-y-6">
          <h2 className="text-2xl md:text-4xl font-bold text-foreground">
            Transforme a rotina escolar da sua instituição
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Se sua escola ainda utiliza agenda de papel ou deseja melhorar a comunicação com as famílias, conheça a
            Agenda Fleur e descubra como a tecnologia pode transformar a rotina escolar.
          </p>
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
            <Link to="/conheca">
              <Button size="lg" className="text-lg px-10 py-6">
                Conhecer o sistema <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </motion.div>
        </AnimSection>
      </section>

      {/* CONTATO */}
      <section className="py-12 px-4 bg-card border-t border-border">
        <div className="max-w-4xl mx-auto text-center space-y-3">
          <h3 className="text-lg font-bold text-foreground">Contato Comercial</h3>
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Mail className="w-4 h-4" />
            <span>contato@agendafleur.app</span>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="py-6 px-4 border-t border-border">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">Copyright © 2026 - Desenvolvido por Fleur Tech Solutions.</p>
          <div className="flex items-center gap-4 text-xs">
            <Link to="/sobre" className="text-muted-foreground hover:text-primary transition-colors">
              Sobre
            </Link>
            <Link to="/conheca" className="text-muted-foreground hover:text-primary transition-colors">
              Conheça o sistema
            </Link>
            <Link to="/changelog" className="text-muted-foreground hover:text-primary transition-colors">
              Novidades
            </Link>
            <button
              onClick={() => {
                window.location.href = "/?orcamento=1";
              }}
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              Solicitar orçamento
            </button>
            <a
              href="mailto:contato@agendafleur.app"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              Contato
            </a>
            <Link to="/login" className="text-muted-foreground hover:text-primary transition-colors">
              Entrar
            </Link>
          </div>
        </div>
        <div className="max-w-4xl mx-auto">
          <PublicFooterMeta />
        </div>
      </footer>
    </div>
  );
}
