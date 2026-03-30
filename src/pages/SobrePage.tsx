import { useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import {
  ArrowRight,
  Heart,
  BookOpen,
  Users,
  Shield,
  Camera,
  Bell,
  Calendar,
  ClipboardList,
  GraduationCap,
  BarChart3,
  MessageSquare,
  Star,
  School,
  Baby,
  Briefcase,
  FileText,
  Settings,
  Mail,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import logoFleur from "@/assets/logo-fleur-2.webp";

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

const funcionalidades = [
  { icon: ClipboardList, text: "Registro de alimentação, sono e higiene" },
  { icon: BookOpen, text: "Atividades pedagógicas e avaliações online" },
  { icon: Camera, text: "Envio de fotos das atividades" },
  { icon: MessageSquare, text: "Recados e comunicação escola-família" },
  { icon: Bell, text: "Notificações em tempo real" },
  { icon: Calendar, text: "Calendário escolar e eventos" },
  { icon: BarChart3, text: "Boletins e relatórios de desempenho" },
  { icon: GraduationCap, text: "Grade de aulas e matérias" },
  { icon: Users, text: "Gestão de turmas, alunos e educadores" },
  { icon: Shield, text: "Controle de presenças e retiradas autorizadas" },
  { icon: Briefcase, text: "Módulo Secretaria com permissões configuráveis" },
  { icon: Settings, text: "Permissões por perfil definidas pelo diretor" },
  { icon: FileText, text: "Modelos de relatório personalizáveis" },
  { icon: Heart, text: "Suporte integrado direto no sistema" },
];

const publicoAlvo = [
  "Creches",
  "Escolas de educação infantil",
  "Escolas de ensino fundamental",
  "Instituições educacionais que utilizam agenda escolar",
  "Escolas que desejam substituir a agenda de papel por um sistema digital",
];

export default function SobrePage() {
  useEffect(() => {
    document.title = "a Agenda Fleur | Sobre a agenda escolar digital";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute(
        "content",
        "Conheça a história da Agenda Fleur, a agenda escolar digital criada para facilitar a comunicação entre escolas, creches e responsáveis."
      );
    }
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* NAV */}
      <nav className="sticky top-0 z-50 bg-card/90 backdrop-blur border-b border-border">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <img src={logoFleur} alt="Agenda Fleur" className="h-7 sm:h-9 w-auto" loading="lazy" />
            <span className="font-bold text-base sm:text-lg text-foreground hidden sm:block">Agenda Fleur</span>
          </Link>
          <div className="flex items-center gap-1 sm:gap-3">
            <Link to="/conheca">
              <Button variant="ghost" size="sm" className="text-xs sm:text-sm px-2 sm:px-3">Conheça</Button>
            </Link>
            <Link to="/login">
              <Button size="sm" className="text-xs sm:text-sm px-2 sm:px-3">Entrar</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO / H1 */}
      <section className="py-16 md:py-24 px-4 bg-gradient-to-br from-primary/10 via-primary/5 to-accent/10">
        <AnimSection className="max-w-4xl mx-auto text-center space-y-6">
          <h1 className="text-3xl md:text-5xl font-extrabold leading-tight text-foreground">
            a Agenda Fleur: a agenda escolar digital criada para aproximar escolas e famílias
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Tecnologia simples, acessível e eficiente para transformar a comunicação escolar.
          </p>
        </AnimSection>
      </section>

      {/* INTRODUÇÃO */}
      <section className="py-16 md:py-20 px-4">
        <AnimSection className="max-w-3xl mx-auto space-y-6">
          <article className="prose prose-lg max-w-none text-foreground/90 space-y-4">
            <p>
              A Agenda Fleur é um sistema de <strong>agenda escolar digital</strong> criado para facilitar a comunicação entre escolas, creches e responsáveis.
            </p>
            <p>
              A plataforma permite que educadores registrem informações importantes do dia da criança, como alimentação, sono, atividades pedagógicas, fotos, recados e avaliações.
            </p>
            <p>
              Todas as informações ficam organizadas em um único ambiente digital, acessível pelo celular, tablet ou computador.
            </p>
            <p>
              A Agenda Fleur substitui a tradicional agenda de papel utilizada por muitas escolas e creches, tornando a comunicação mais rápida, segura e eficiente.
            </p>
          </article>
        </AnimSection>
      </section>

      {/* COMO SURGIU */}
      <section className="py-16 md:py-20 px-4 bg-muted/40">
        <AnimSection className="max-w-3xl mx-auto space-y-6">
          <h2 className="text-2xl md:text-4xl font-bold text-foreground">Como surgiu a Agenda Fleur</h2>
          <article className="prose prose-lg max-w-none text-foreground/90 space-y-4">
            <p>
              A ideia da Agenda Fleur surgiu a partir de uma necessidade real do dia a dia.
            </p>
            <p>
              A creche do meu filho utilizava uma agenda de papel para registrar informações sobre a rotina das crianças. Todos os dias os educadores precisavam escrever manualmente o que aconteceu durante o período escolar, como alimentação, sono, trocas de fralda e atividades realizadas.
            </p>
            <p>
              Apesar de funcionar, esse modelo apresenta diversas limitações.
            </p>
            <p>
              A agenda pode ser perdida, as informações não chegam em tempo real aos responsáveis e não existe um histórico digital organizado ao longo do tempo.
            </p>
            <p>
              Além disso, agendas de papel não permitem o envio de fotos, registros pedagógicos detalhados ou comunicação instantânea entre escola e família.
            </p>
            <p>
              Diante dessa realidade, surgiu a ideia de criar um <strong>sistema de agenda escolar</strong> digital simples, acessível e eficiente que pudesse substituir a agenda de papel e melhorar a comunicação entre escolas e responsáveis.
            </p>
            <p className="font-semibold text-primary">
              Assim nasceu a Agenda Fleur.
            </p>
          </article>
        </AnimSection>
      </section>

      {/* POR QUE É IMPORTANTE */}
      <section className="py-16 md:py-20 px-4">
        <AnimSection className="max-w-3xl mx-auto space-y-6">
          <h2 className="text-2xl md:text-4xl font-bold text-foreground">
            Por que uma agenda escolar digital é importante
          </h2>
          <article className="prose prose-lg max-w-none text-foreground/90 space-y-4">
            <p>
              A rotina escolar envolve muitas informações importantes que precisam ser compartilhadas com os responsáveis.
            </p>
            <p>
              Uma <strong>agenda escolar online</strong> permite que as escolas registrem a rotina diária das crianças e mantenham os responsáveis sempre informados sobre o que acontece durante o período escolar.
            </p>
            <p>Com uma agenda digital é possível:</p>
            <ul className="space-y-2 list-none pl-0">
              {[
                "Registrar alimentação",
                "Registrar sono",
                "Registrar trocas de fralda",
                "Registrar atividades pedagógicas",
                "Enviar fotos das atividades",
                "Compartilhar comunicados da escola",
                "Acompanhar avaliações",
                "Manter histórico completo do aluno",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p>
              Além disso, facilita o trabalho da equipe pedagógica e melhora a transparência na comunicação entre escola e responsáveis.
            </p>
          </article>
        </AnimSection>
      </section>

      {/* MISSÃO E VISÃO */}
      <section className="py-16 md:py-20 px-4 bg-muted/40">
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
          <AnimSection className="bg-card rounded-2xl border border-border p-8 shadow-sm space-y-4">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">Nossa missão</h2>
            <p className="text-foreground/90 leading-relaxed">
              Criar tecnologia simples e acessível que ajude escolas e creches a fortalecer a comunicação com as famílias e registrar o desenvolvimento das crianças de forma organizada, segura e eficiente.
            </p>
          </AnimSection>
          <AnimSection delay={0.15} className="bg-card rounded-2xl border border-border p-8 shadow-sm space-y-4">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">Nossa visão</h2>
            <p className="text-foreground/90 leading-relaxed">
              Ser uma das principais plataformas de <strong>agenda escolar digital</strong> do Brasil, ajudando escolas a modernizar sua comunicação e melhorar a experiência de alunos, responsáveis e educadores.
            </p>
          </AnimSection>
        </div>
      </section>

      {/* FUNCIONALIDADES */}
      <section className="py-16 md:py-20 px-4">
        <div className="max-w-4xl mx-auto space-y-10">
          <AnimSection className="text-center">
            <h2 className="text-2xl md:text-4xl font-bold text-foreground">Funcionalidades do sistema</h2>
            <p className="text-muted-foreground mt-2">
              Conheça os principais recursos da <strong>agenda digital para creches</strong> e escolas.
            </p>
          </AnimSection>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {funcionalidades.map((f, i) => (
              <AnimSection key={f.text} delay={i * 0.05}>
                <div className="flex items-start gap-3 bg-card rounded-xl border border-border p-4 shadow-sm hover:shadow-md transition-shadow">
                  <f.icon className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-foreground font-medium">{f.text}</span>
                </div>
              </AnimSection>
            ))}
          </div>
        </div>
      </section>

      {/* PARA QUEM */}
      <section className="py-16 md:py-20 px-4 bg-muted/40">
        <div className="max-w-3xl mx-auto space-y-8">
          <AnimSection className="space-y-3">
            <h2 className="text-2xl md:text-4xl font-bold text-foreground">Para quem é a Agenda Fleur</h2>
            <p className="text-foreground/90 leading-relaxed">
              A Agenda Fleur foi criada para atender instituições de ensino que desejam melhorar a comunicação com as famílias e organizar o registro pedagógico dos alunos. Pode ser utilizada por:
            </p>
          </AnimSection>
          <div className="space-y-3">
            {publicoAlvo.map((item, i) => (
              <AnimSection key={item} delay={i * 0.06}>
                <div className="flex items-center gap-3 bg-card rounded-xl border border-border p-4 shadow-sm">
                  <Star className="w-5 h-5 text-primary shrink-0" />
                  <span className="text-foreground font-medium">{item}</span>
                </div>
              </AnimSection>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 md:py-28 px-4 bg-gradient-to-br from-primary/10 via-primary/5 to-accent/10">
        <AnimSection className="max-w-3xl mx-auto text-center space-y-6">
          <h2 className="text-2xl md:text-4xl font-bold text-foreground">
            Transforme a rotina escolar da sua instituição
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Se sua escola ainda utiliza agenda de papel ou deseja melhorar a comunicação com as famílias, conheça a Agenda Fleur e descubra como a tecnologia pode transformar a rotina escolar.
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

      {/* FOOTER */}
      <footer className="py-6 px-4 border-t border-border">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">Copyright © 2026 - Desenvolvido por Fleur Tech Solutions.</p>
          <div className="flex items-center gap-4 text-xs">
            <Link to="/conheca" className="text-muted-foreground hover:text-primary transition-colors">Conheça</Link>
            <Link to="/login" className="text-muted-foreground hover:text-primary transition-colors">Entrar</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
