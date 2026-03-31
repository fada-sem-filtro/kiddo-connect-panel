import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { SiteHeader } from "@/components/landing/SiteHeader";
import { motion, useInView } from "framer-motion";
import {
  ArrowRight,
  MessageSquare,
  Shield,
  Zap,
  CheckCircle2,
  Rocket,
  Users,
  ClipboardList,
  FileText,
  RefreshCw,
  Mail,
  User,
  School,
  MapPin,
  Phone,
  Hash,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import logoFleur from "@/assets/logo-fleur-2.webp";

/* ── Animated wrappers ── */
function Anim({
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
      initial={{ opacity: 0, y: 36 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ── Contact Modal (reusable) ── */
function ContactModal({
  open,
  onOpenChange,
  title = "Solicite seu orçamento",
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title?: string;
}) {
  const [form, setForm] = useState({
    nome: "",
    escola: "",
    cidade: "",
    telefone: "",
    email: "",
    alunos: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { error } = await supabase.from("orcamentos").insert({
        nome: form.nome,
        escola: form.escola,
        cidade: form.cidade,
        telefone: form.telefone || null,
        email: form.email,
        num_alunos: form.alunos || null,
      });
      if (error) throw error;
      toast.success("Solicitação enviada com sucesso! Entraremos em contato em breve.");
      onOpenChange(false);
      setForm({
        nome: "",
        escola: "",
        cidade: "",
        telefone: "",
        email: "",
        alunos: "",
      });
    } catch {
      toast.error("Erro ao enviar solicitação. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  const fields = [
    { id: "nome", label: "Nome", icon: User, type: "text" },
    { id: "escola", label: "Escola", icon: School, type: "text" },
    { id: "cidade", label: "Cidade", icon: MapPin, type: "text" },
    { id: "telefone", label: "Telefone", icon: Phone, type: "tel" },
    { id: "email", label: "Email", icon: Mail, type: "email" },
    { id: "alunos", label: "Número de alunos", icon: Hash, type: "number" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">{title}</DialogTitle>
          <DialogDescription>Preencha os dados abaixo e entraremos em contato.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {fields.map((f) => (
            <div key={f.id} className="space-y-1">
              <Label htmlFor={f.id}>{f.label}</Label>
              <div className="relative">
                <f.icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id={f.id}
                  type={f.type}
                  required
                  className="pl-10"
                  value={(form as any)[f.id]}
                  onChange={(e) => setForm((p) => ({ ...p, [f.id]: e.target.value }))}
                />
              </div>
            </div>
          ))}
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Enviando..." : "Enviar solicitação"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ── Page ── */
export default function HomePage() {
  const [demoOpen, setDemoOpen] = useState(false);
  const [orcamentoOpen, setOrcamentoOpen] = useState(false);

  useEffect(() => {
    document.title = "Agenda Escolar Digital | Agenda Fleur — A agenda que custa menos que papel";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute(
        "content",
        "Agenda Fleur é a agenda escolar digital que substitui a agenda de papel. Sistema completo para escolas, creches e responsáveis com comunicação em tempo real.",
      );
    }
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader onOrcamentoClick={() => setOrcamentoOpen(true)} />

      {/* ─── SECTION 1: HERO ─── */}
      <section className="relative overflow-hidden py-20 md:py-32 px-4">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="relative max-w-5xl mx-auto text-center space-y-8">
          <Anim>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight">
              A agenda escolar digital que custa <span className="text-primary">menos que a agenda de papel.</span>
            </h1>
          </Anim>

          <Anim delay={0.1}>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Modernize a comunicação da sua escola e centralize tudo em um único sistema.
            </p>
          </Anim>

          <Anim delay={0.1}>
            <p className="text-base text-muted-foreground max-w-xl mx-auto">
              Com a Agenda Fleur sua escola substitui a agenda de papel por uma solução digital simples, rápida e
              eficiente.
            </p>
          </Anim>

          <Anim delay={0.2}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Button
                  size="lg"
                  className="text-base sm:text-lg px-8 py-6 w-full sm:w-auto"
                  onClick={() => setDemoOpen(true)}
                >
                  Solicitar demonstração
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Button
                  size="lg"
                  variant="outline"
                  className="text-base sm:text-lg px-8 py-6 w-full sm:w-auto border-2"
                  onClick={() => setOrcamentoOpen(true)}
                >
                  Solicitar orçamento
                </Button>
              </motion.div>
            </div>
          </Anim>

          <div className="flex justify-center mb-4">
            <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-semibold tracking-wide animate-fade-in">
              <Zap className="w-4 h-4" />
              Planos mensais com valores competitivos
            </span>
          </div>

          <Anim delay={0.1}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 text-sm text-muted-foreground pt-4">
              {[
                "Implantação rápida",
                "Sistema simples para professores e responsáveis",
                "Atualizações constantes sem custo adicional",
              ].map((b) => (
                <div key={b} className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                  <span>{b}</span>
                </div>
              ))}
            </div>
          </Anim>
        </div>
      </section>

      {/* ─── SECTION 2: PROBLEMA ─── */}
      <section className="py-16 md:py-24 px-4 bg-muted/30">
        <div className="max-w-4xl mx-auto space-y-10">
          <Anim className="text-center space-y-4">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold">
              A agenda de papel já não atende mais a rotina das escolas.
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Comunicação perdida, agendas esquecidas e excesso de trabalho manual são problemas comuns na rotina
              escolar.
            </p>
          </Anim>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              {
                icon: FileText,
                text: "Agenda esquecida pelos alunos",
              },
              {
                icon: MessageSquare,
                text: "Falta de controle das comunicações",
              },
              {
                icon: ClipboardList,
                text: "Muito trabalho manual da secretaria",
              },
              {
                icon: Users,
                text: "Dificuldade de acompanhar informações dos alunos",
              },
            ].map((p, i) => (
              <Anim key={p.text} delay={i * 0.08}>
                <div className="flex items-start gap-4 p-5 rounded-xl bg-card border border-border shadow-sm">
                  <div className="p-2 rounded-lg bg-destructive/10">
                    <p.icon className="w-5 h-5 text-destructive" />
                  </div>
                  <span className="text-foreground font-medium">{p.text}</span>
                </div>
              </Anim>
            ))}
          </div>

          <Anim className="text-center">
            <p className="text-primary font-semibold text-lg">
              A Agenda Fleur resolve esses desafios com uma solução digital simples.
            </p>
          </Anim>
        </div>
      </section>

      {/* ─── SECTION 3: BENEFÍCIOS ─── */}
      <section className="py-16 md:py-24 px-4">
        <div className="max-w-5xl mx-auto space-y-10">
          <Anim className="text-center space-y-3">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold">
              Uma solução moderna para a comunicação escolar
            </h2>
          </Anim>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                icon: MessageSquare,
                title: "Comunicação centralizada",
                desc: "Centralize recados, avisos e informações importantes em um único lugar.",
              },
              {
                icon: ClipboardList,
                title: "Mais organização",
                desc: "Acompanhe tudo de forma simples e organizada.",
              },
              {
                icon: Shield,
                title: "Mais segurança",
                desc: "Histórico completo das comunicações da escola.",
              },
              {
                icon: Zap,
                title: "Menos papel",
                desc: "Reduza custos e modernize a rotina da instituição.",
              },
            ].map((b, i) => (
              <Anim key={b.title} delay={i * 0.08}>
                <Card className="h-full border-2 hover:border-primary/30 transition-colors">
                  <CardContent className="p-6 space-y-3 text-center">
                    <div className="mx-auto w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <b.icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="font-bold text-foreground">{b.title}</h3>
                    <p className="text-sm text-muted-foreground">{b.desc}</p>
                  </CardContent>
                </Card>
              </Anim>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SECTION 4: COMO FUNCIONA ─── */}
      <section className="py-16 md:py-24 px-4 bg-gradient-to-br from-primary/5 via-transparent to-accent/5">
        <div className="max-w-4xl mx-auto space-y-10">
          <Anim className="text-center space-y-3">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold">Começar é simples</h2>
          </Anim>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                step: "1",
                icon: Rocket,
                title: "Criação da conta da escola",
                desc: "Cadastro rápido e sem burocracia.",
              },
              {
                step: "2",
                icon: Users,
                title: "Cadastre alunos e professores",
                desc: "Organize turmas e vínculos facilmente.",
              },
              {
                step: "3",
                icon: CheckCircle2,
                title: "Comece a utilizar o sistema em menos de 1 minuto",
                desc: "Pronto para usar imediatamente.",
              },
            ].map((s, i) => (
              <Anim key={s.step} delay={i * 0.1}>
                <div className="relative text-center space-y-4 p-6 rounded-2xl bg-card border border-border shadow-sm">
                  <div className="mx-auto w-14 h-14 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-xl">
                    {s.step}
                  </div>
                  <h3 className="font-bold text-foreground text-lg">{s.title}</h3>
                  <p className="text-sm text-muted-foreground">{s.desc}</p>
                </div>
              </Anim>
            ))}
          </div>

          <Anim className="text-center">
            <p className="text-muted-foreground">
              Em poucos minutos sua escola já pode começar a utilizar a Agenda Fleur.
            </p>
          </Anim>
        </div>
      </section>

      {/* ─── SECTION 5: CHANGELOG ─── */}
      <section className="py-16 md:py-24 px-4">
        <div className="max-w-3xl mx-auto space-y-10">
          <Anim className="text-center space-y-3">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold">Novidades do sistema</h2>
            <p className="text-muted-foreground">
              A Agenda Fleur está em constante evolução para atender melhor as escolas.
            </p>
          </Anim>

          <div className="space-y-4">
            {[
              {
                version: "2.3",
                date: "Abril 2026",
                desc: "Novidades no módulo financeiro e melhorias gerais.",
              },
              {
                version: "2.2",
                date: "Março 2026",
                desc: "Melhorias de desempenho e novas funcionalidades.",
              },
              {
                version: "2.1",
                date: "Fevereiro 2026",
                desc: "Aprimoramentos na experiência de uso e correções.",
              },
            ].map((v, i) => (
              <Anim key={v.version} delay={i * 0.08}>
                <div className="flex items-start gap-4 p-5 rounded-xl bg-card border border-border shadow-sm">
                  <div className="flex items-center justify-center shrink-0 w-10 h-10 rounded-lg bg-primary/10">
                    <RefreshCw className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-foreground">Versão {v.version}</span>
                      <span className="text-xs text-muted-foreground">— {v.date}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{v.desc}</p>
                  </div>
                </div>
              </Anim>
            ))}
          </div>

          <Anim className="text-center">Em breve visualização do histórico completo de atualizações</Anim>
        </div>
      </section>

      {/* ─── SECTION 6: CTA FINAL ─── */}
      <section className="py-20 md:py-28 px-4 bg-gradient-to-br from-primary/10 via-primary/5 to-accent/10">
        <Anim className="max-w-3xl mx-auto text-center space-y-6">
          <h2 className="text-3xl md:text-5xl font-extrabold">
            Leve sua escola para o <span className="text-primary">digital</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Solicite uma demonstração ou peça um orçamento e descubra como a Agenda Fleur pode ajudar sua escola.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Button
                size="lg"
                className="text-base sm:text-lg px-8 py-6 w-full sm:w-auto"
                onClick={() => setDemoOpen(true)}
              >
                Solicitar demonstração
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Button
                size="lg"
                variant="outline"
                className="text-base sm:text-lg px-8 py-6 w-full sm:w-auto border-2"
                onClick={() => setOrcamentoOpen(true)}
              >
                Solicitar orçamento
              </Button>
            </motion.div>
          </div>
        </Anim>
      </section>

      {/* ─── CONTATO ─── */}
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
            <button
              onClick={() => setOrcamentoOpen(true)}
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
      </footer>

      {/* ─── MODALS ─── */}
      <ContactModal open={demoOpen} onOpenChange={setDemoOpen} title="Solicitar demonstração" />
      <ContactModal open={orcamentoOpen} onOpenChange={setOrcamentoOpen} title="Solicitar orçamento" />
    </div>
  );
}
