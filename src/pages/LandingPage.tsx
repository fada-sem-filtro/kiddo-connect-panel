import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  XCircle,
  Users,
  GraduationCap,
  BookOpen,
  Calendar,
  ClipboardList,
  Shield,
  School,
  ChevronRight,
  Star,
  FileSpreadsheet,
  Clock,
  BarChart3,
  BookMarked,
  UserCog,
  Eye,
  Mail,
  Phone,
  MapPin,
  Hash,
  User,
  MessageSquare,
  Image,
  Bell,
  CalendarDays,
  ListChecks,
  Settings,
  Lock,
  Megaphone,
  Baby,
  FileText,
  Clipboard,
  UserCheck,
  PieChart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import logoFleur from "@/assets/logo-fleur-2.webp";

/* ── Reusable animated wrapper ── */
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

function AnimCard({ children, className = "", i = 0 }: { children: React.ReactNode; className?: string; i?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30, scale: 0.97 }}
      animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{ duration: 0.4, delay: i * 0.08, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ── Contact Modal ── */
function ContactModal({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [form, setForm] = useState({ nome: "", escola: "", cidade: "", telefone: "", email: "", alunos: "" });
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
      setForm({ nome: "", escola: "", cidade: "", telefone: "", email: "", alunos: "" });
    } catch (err: any) {
      toast.error("Erro ao enviar solicitação. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Solicite seu orçamento</DialogTitle>
          <DialogDescription>Preencha os dados abaixo e entraremos em contato.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {[
            { id: "nome", label: "Nome", icon: User, type: "text" },
            { id: "escola", label: "Escola", icon: School, type: "text" },
            { id: "cidade", label: "Cidade", icon: MapPin, type: "text" },
            { id: "telefone", label: "Telefone", icon: Phone, type: "tel" },
            { id: "email", label: "Email", icon: Mail, type: "email" },
            { id: "alunos", label: "Número de alunos", icon: Hash, type: "number" },
          ].map((f) => (
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

/* ── Data ── */
const problems = [
  {
    icon: FileSpreadsheet,
    title: "Planilhas desorganizadas",
    desc: "Dados espalhados em múltiplos arquivos sem integração",
  },
  { icon: Clock, title: "Horários confusos", desc: "Dificuldade em organizar grades e calendários" },
  { icon: BarChart3, title: "Falta de visão pedagógica", desc: "Sem acompanhamento estruturado do desempenho" },
  { icon: BookMarked, title: "Processos manuais", desc: "Retrabalho constante e risco de erros" },
];

const benefits = [
  { icon: Shield, title: "Gestão centralizada", desc: "Todas as informações em um único lugar" },
  { icon: ClipboardList, title: "Organização pedagógica", desc: "Estrutura clara para turmas, matérias e avaliações" },
  { icon: Calendar, title: "Calendário estruturado", desc: "Grade semanal organizada por turma" },
  { icon: GraduationCap, title: "Gestão de professores", desc: "Controle completo do corpo docente" },
  { icon: Users, title: "Gestão de turmas", desc: "Organização eficiente de alunos por turma" },
  { icon: BarChart3, title: "Acompanhamento acadêmico", desc: "Boletins e relatórios de desempenho" },
];

const features = [
  {
    icon: Users,
    title: "Gestão de alunos",
    desc: "Cadastro completo de alunos com vínculo às turmas e organização das informações acadêmicas.",
  },
  {
    icon: GraduationCap,
    title: "Gestão de professores",
    desc: "Cadastro e gestão de educadores com associação às matérias e turmas.",
  },
  {
    icon: School,
    title: "Gestão de turmas",
    desc: "Organização das turmas da escola com controle de alunos e professores.",
  },
  {
    icon: BookOpen,
    title: "Matérias personalizadas",
    desc: "O diretor pode cadastrar e configurar as matérias da escola de forma flexível.",
  },
  {
    icon: Calendar,
    title: "Grade de aulas semanal",
    desc: "Definição dos horários das aulas por turma com vínculo ao professor responsável.",
  },
  {
    icon: ClipboardList,
    title: "Boletim escolar",
    desc: "Registro e acompanhamento do desempenho dos alunos por período letivo.",
  },
  {
    icon: FileText,
    title: "Relatório de desempenho",
    desc: "Relatórios qualitativos com modelo personalizável por escola.",
  },
  {
    icon: MessageSquare,
    title: "Recados e comunicação",
    desc: "Envio de recados entre educadores e responsáveis com suporte a fotos.",
  },
  { icon: Image, title: "Anexo de fotos", desc: "Anexe imagens nos recados para uma comunicação visual e eficiente." },
  { icon: Bell, title: "Notificações", desc: "Sistema de notificações em tempo real para manter todos informados." },
  { icon: CalendarDays, title: "Calendário escolar", desc: "Gestão de feriados e eventos do calendário acadêmico." },
  {
    icon: Baby,
    title: "Agenda infantil",
    desc: "Registro diário de alimentação, sono, higiene e atividades para creches.",
  },
  {
    icon: Clipboard,
    title: "Controle de presença",
    desc: "Registro de presença diária com horário de chegada e saída.",
  },
  { icon: UserCheck, title: "Pessoas autorizadas", desc: "Cadastro de pessoas autorizadas para buscar cada criança." },
  {
    icon: Settings,
    title: "Config. pedagógicas",
    desc: "Ative ou desative módulos pedagógicos por escola: boletim, relatório, grade.",
  },
  {
    icon: Lock,
    title: "Permissões por perfil",
    desc: "Configure o que cada perfil pode visualizar e fazer no sistema.",
  },
  {
    icon: PieChart,
    title: "Dashboards por perfil",
    desc: "Painéis personalizados para diretor, educador e responsável.",
  },
  {
    icon: Shield,
    title: "Multi-tenant SaaS",
    desc: "Cada escola possui suas configurações, dados e identidade visual.",
  },
];

const profiles = [
  {
    icon: UserCog,
    title: "Diretor",
    items: [
      "Dashboard com visão geral da escola",
      "Gestão de turmas e professores",
      "Cadastro e configuração de matérias",
      "Grade de aulas semanal",
      "Boletim escolar por período",
      "Relatório de desempenho qualitativo",
      "Calendário escolar e feriados",
      "Gestão de alunos e responsáveis",
      "Recados com anexo de fotos",
      "Controle de presença",
      "Configurações pedagógicas",
      "Permissões por perfil",
    ],
  },
  {
    icon: GraduationCap,
    title: "Educador",
    items: [
      "Dashboard personalizado",
      "Visualização das turmas que leciona",
      "Grade de aulas semanal",
      "Registro de notas no boletim",
      "Preenchimento de relatório de desempenho",
      "Agenda infantil (alimentação, sono, higiene)",
      "Controle de presença diária",
      "Recados com anexo de fotos",
      "Registro de eventos diários",
      "Notificações em tempo real",
    ],
  },
  {
    icon: Eye,
    title: "Responsável",
    items: [
      "Dashboard com informações do aluno",
      "Boletim escolar do filho",
      "Relatório de desempenho qualitativo",
      "Grade de aulas semanal",
      "Agenda infantil diária",
      "Eventos e calendário escolar",
      "Recados com anexo de fotos",
      "Notificações em tempo real",
      "Pessoas autorizadas para busca",
    ],
  },
];

const steps = [
  { n: "1", text: "Diretor cadastra professores e turmas" },
  { n: "2", text: "Diretor define matérias e calendário semanal" },
  { n: "3", text: "Professores acessam suas turmas" },
  { n: "4", text: "A escola acompanha o desempenho acadêmico" },
  { n: "5", text: "Responsável acompanha o desempenho acadêmico do aluno" },
];

const screenshots = [
  "Dashboard do Diretor",
  "Dashboard do Educador",
  "Dashboard do Responsável",
  "Cadastro de Alunos",
  "Cadastro de Professores",
  "Gestão de Turmas",
  "Calendário Semanal",
  "Horário das Aulas",
  "Recados com Fotos",
  "Boletim Escolar",
];

const comparison = [
  { item: "Organização", old: false, new_: true },
  { item: "Automação", old: false, new_: true },
  { item: "Controle pedagógico", old: false, new_: true },
  { item: "Escalabilidade", old: false, new_: true },
  { item: "Segurança dos dados", old: false, new_: true },
];

const audiences = [
  "Escolas particulares",
  "Instituições de ensino fundamental",
  "Escolas de pequeno e médio porte",
  "Instituições que desejam modernizar sua gestão",
];

/* ── Page ── */
export default function LandingPage() {
  const [contactOpen, setContactOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background font-[Quicksand] overflow-x-hidden">
      <ContactModal open={contactOpen} onOpenChange={setContactOpen} />

      {/* NAV */}
      <motion.nav
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="sticky top-0 z-50 bg-card/80 backdrop-blur-md border-b border-border"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <img src={logoFleur} alt="Agenda Fleur" className="w-8 h-8" />
            <span className="font-bold text-lg text-foreground">Agenda Fleur</span>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/login">
              <Button variant="ghost" size="sm">
                Entrar
              </Button>
            </Link>
            <Button size="sm" onClick={() => setContactOpen(true)}>
              Solicite sua Demonstração
            </Button>
          </div>
        </div>
      </motion.nav>

      {/* HERO */}
      <section className="relative overflow-hidden py-20 md:py-32 px-4">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/10" />
        <div className="relative max-w-4xl mx-auto text-center space-y-6">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-4xl md:text-6xl font-extrabold text-foreground leading-tight"
          >
            Sistema Completo de
            <br />
            <span className="text-primary">Gestão Escolar</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto"
          >
            Uma plataforma moderna que organiza a gestão pedagógica e administrativa da sua escola em um único lugar.
          </motion.p>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="text-base text-muted-foreground max-w-xl mx-auto"
          >
            Controle turmas, professores, matérias, calendário escolar e desempenho acadêmico com uma plataforma
            simples, rápida e segura.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-3 justify-center pt-4"
          >
            <Button size="lg" className="text-base px-8" onClick={() => setContactOpen(true)}>
              Solicite sua Demonstração <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button size="lg" variant="outline" className="text-base px-8" asChild>
              <a href="#funcionalidades">
                Ver funcionalidades <ChevronRight className="ml-1 w-4 h-4" />
              </a>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* PROBLEMA */}
      <section className="py-16 md:py-24 px-4 bg-muted/40">
        <div className="max-w-6xl mx-auto space-y-10">
          <AnimSection className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">Os desafios da gestão escolar</h2>
            <p className="text-muted-foreground">
              Muitas escolas ainda utilizam planilhas, processos manuais ou sistemas limitados para organizar suas
              atividades pedagógicas.
            </p>
          </AnimSection>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {problems.map((p, i) => (
              <AnimCard key={p.title} i={i}>
                <Card className="border-destructive/20 bg-destructive/5 h-full">
                  <CardContent className="p-6 text-center space-y-3">
                    <p.icon className="w-10 h-10 mx-auto text-destructive" />
                    <h3 className="font-bold text-foreground">{p.title}</h3>
                    <p className="text-sm text-muted-foreground">{p.desc}</p>
                  </CardContent>
                </Card>
              </AnimCard>
            ))}
          </div>
        </div>
      </section>

      {/* SOLUÇÃO */}
      <section className="py-16 md:py-24 px-4">
        <div className="max-w-6xl mx-auto space-y-10">
          <AnimSection className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              Uma plataforma pensada para escolas modernas
            </h2>
            <p className="text-muted-foreground">
              Nosso sistema centraliza todas as informações acadêmicas e administrativas da escola, permitindo uma
              gestão mais organizada, eficiente e profissional.
            </p>
          </AnimSection>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {benefits.map((b, i) => (
              <AnimCard key={b.title} i={i}>
                <Card className="border-primary/20 hover:border-primary/40 transition-colors h-full hover:shadow-md">
                  <CardContent className="p-6 space-y-3">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <b.icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="font-bold text-foreground">{b.title}</h3>
                    <p className="text-sm text-muted-foreground">{b.desc}</p>
                  </CardContent>
                </Card>
              </AnimCard>
            ))}
          </div>
        </div>
      </section>

      {/* FUNCIONALIDADES */}
      <section id="funcionalidades" className="py-16 md:py-24 px-4 bg-muted/40">
        <div className="max-w-6xl mx-auto space-y-10">
          <AnimSection className="text-center space-y-3">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">Funcionalidades do Sistema</h2>
            <p className="text-muted-foreground">Tudo o que sua escola precisa em uma única plataforma</p>
          </AnimSection>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <AnimCard key={f.title} i={i}>
                <Card className="hover:shadow-lg transition-shadow h-full">
                  <CardContent className="p-6 space-y-3">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <f.icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="font-bold text-lg text-foreground">{f.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                  </CardContent>
                </Card>
              </AnimCard>
            ))}
          </div>
        </div>
      </section>

      {/* PERFIS */}
      <section className="py-16 md:py-24 px-4">
        <div className="max-w-6xl mx-auto space-y-10">
          <AnimSection className="text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">Perfis de Usuário</h2>
          </AnimSection>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {profiles.map((p, i) => (
              <AnimCard key={p.title} i={i}>
                <Card className="border-primary/20 h-full">
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <p.icon className="w-6 h-6 text-primary" />
                      </div>
                      <h3 className="text-xl font-bold text-foreground">{p.title}</h3>
                    </div>
                    <ul className="space-y-2">
                      {p.items.map((item) => (
                        <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </AnimCard>
            ))}
          </div>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section className="py-16 md:py-24 px-4 bg-muted/40">
        <div className="max-w-4xl mx-auto space-y-10">
          <AnimSection className="text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">Como o Sistema Funciona</h2>
          </AnimSection>
          <div className="space-y-4">
            {steps.map((s, i) => (
              <AnimCard key={s.n} i={i}>
                <div className="flex items-center gap-4 bg-card rounded-2xl p-5 border border-border shadow-sm">
                  <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg shrink-0">
                    {s.n}
                  </div>
                  <p className="text-foreground font-medium">{s.text}</p>
                  {i < steps.length - 1 && (
                    <ArrowRight className="w-5 h-5 text-muted-foreground ml-auto hidden md:block" />
                  )}
                </div>
              </AnimCard>
            ))}
          </div>
        </div>
      </section>

      {/* PRINTS */}
      <section className="py-16 md:py-24 px-4">
        <div className="max-w-6xl mx-auto space-y-10">
          <AnimSection className="text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">Veja o Sistema em Ação</h2>
          </AnimSection>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {screenshots.map((s, i) => (
              <AnimCard key={s} i={i}>
                <div className="aspect-video bg-muted rounded-xl border border-border flex items-center justify-center p-3 hover:shadow-md transition-shadow">
                  <p className="text-xs text-muted-foreground text-center font-medium">{s}</p>
                </div>
              </AnimCard>
            ))}
          </div>
          <p className="text-center text-sm text-muted-foreground">* Imagens ilustrativas. Prints reais em breve.</p>
        </div>
      </section>

      {/* COMPARAÇÃO */}
      <section className="py-16 md:py-24 px-4 bg-muted/40">
        <div className="max-w-3xl mx-auto space-y-10">
          <AnimSection className="text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">Comparação</h2>
          </AnimSection>
          <AnimSection delay={0.15}>
            <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
              <div className="grid grid-cols-3 bg-muted/60 p-4 font-bold text-sm text-foreground">
                <span>Recurso</span>
                <span className="text-center">Métodos antigos</span>
                <span className="text-center">Agenda Fleur</span>
              </div>
              {comparison.map((c, i) => (
                <div
                  key={c.item}
                  className={`grid grid-cols-3 p-4 text-sm items-center ${i % 2 === 0 ? "" : "bg-muted/20"}`}
                >
                  <span className="text-foreground font-medium">{c.item}</span>
                  <span className="flex justify-center">
                    <XCircle className="w-5 h-5 text-destructive" />
                  </span>
                  <span className="flex justify-center">
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                  </span>
                </div>
              ))}
            </div>
          </AnimSection>
        </div>
      </section>

      {/* PARA QUEM */}
      <section className="py-16 md:py-24 px-4">
        <div className="max-w-4xl mx-auto space-y-8">
          <AnimSection className="text-center space-y-3">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">Para quem é o sistema?</h2>
            <p className="text-muted-foreground">Nossa plataforma foi desenvolvida especialmente para:</p>
          </AnimSection>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
            {audiences.map((a, i) => (
              <AnimCard key={a} i={i}>
                <div className="flex items-center gap-3 bg-card rounded-xl border border-border p-4 shadow-sm hover:shadow-md transition-shadow">
                  <Star className="w-5 h-5 text-primary shrink-0" />
                  <span className="text-foreground font-medium">{a}</span>
                </div>
              </AnimCard>
            ))}
          </div>
        </div>
      </section>

      {/* CTA CONVERSÃO */}
      <section className="py-20 md:py-28 px-4 bg-gradient-to-br from-primary/10 via-primary/5 to-accent/10">
        <AnimSection className="max-w-3xl mx-auto text-center space-y-6">
          <h2 className="text-3xl md:text-5xl font-extrabold text-foreground">
            Leve sua escola para o<br />
            <span className="text-primary">próximo nível</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Solicite uma demonstração e descubra como nossa plataforma pode transformar a gestão da sua escola.
          </p>
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
            <Button size="lg" className="text-lg px-10 py-6" onClick={() => setContactOpen(true)}>
              Solicite sua Demonstração <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
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
      <footer className="py-6 px-4 border-t border-border text-center">
        <p className="text-xs text-muted-foreground">Copyright © 2026 - Desenvolvido por Fleur Tech Solutions.</p>
      </footer>
    </div>
  );
}
