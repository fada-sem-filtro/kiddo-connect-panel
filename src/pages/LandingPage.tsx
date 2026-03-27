import { useState } from "react";
import { Link } from "react-router-dom";
import { 
  ArrowRight, CheckCircle2, XCircle, Users, GraduationCap, BookOpen, 
  Calendar, ClipboardList, Shield, School, ChevronRight, Star,
  FileSpreadsheet, Clock, BarChart3, BookMarked, UserCog, Eye,
  Mail, Phone, Building2, MapPin, Hash, User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import logoFleur from "@/assets/logo-fleur-2.webp";

function ContactModal({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [form, setForm] = useState({ nome: "", escola: "", cidade: "", telefone: "", email: "", alunos: "" });
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Solicitação enviada com sucesso! Entraremos em contato em breve.");
    onOpenChange(false);
    setForm({ nome: "", escola: "", cidade: "", telefone: "", email: "", alunos: "" });
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
          ].map(f => (
            <div key={f.id} className="space-y-1">
              <Label htmlFor={f.id}>{f.label}</Label>
              <div className="relative">
                <f.icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  id={f.id} type={f.type} required className="pl-10"
                  value={(form as any)[f.id]}
                  onChange={e => setForm(p => ({ ...p, [f.id]: e.target.value }))}
                />
              </div>
            </div>
          ))}
          <Button type="submit" className="w-full">Enviar solicitação</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

const problems = [
  { icon: FileSpreadsheet, title: "Planilhas desorganizadas", desc: "Dados espalhados em múltiplos arquivos sem integração" },
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
  { icon: Users, title: "Gestão de alunos", desc: "Cadastro completo de alunos com vínculo às turmas e organização das informações acadêmicas." },
  { icon: GraduationCap, title: "Gestão de professores", desc: "Cadastro e gestão de educadores com associação às matérias e turmas." },
  { icon: School, title: "Gestão de turmas", desc: "Organização das turmas da escola com controle de alunos e professores." },
  { icon: BookOpen, title: "Matérias personalizadas", desc: "O diretor pode cadastrar e configurar as matérias da escola." },
  { icon: Calendar, title: "Calendário semanal", desc: "Definição dos horários das aulas por turma. Cada matéria é vinculada ao professor responsável." },
  { icon: ClipboardList, title: "Boletim escolar", desc: "Registro e acompanhamento do desempenho dos alunos." },
  { icon: Shield, title: "Controle por perfil", desc: "O sistema possui níveis de acesso diferentes para cada perfil." },
];

const profiles = [
  { icon: UserCog, title: "Diretor", items: ["Gestão pedagógica da escola", "Turmas", "Professores", "Matérias", "Organização escolar"] },
  { icon: GraduationCap, title: "Educador", items: ["Acesso às turmas e matérias que leciona", "Registro de avaliações", "Visualização da grade de aulas"] },
  { icon: Eye, title: "Responsável", items: ["Acesso às informações pedagógicas do aluno", "Boletim escolar", "Grade de aulas"] },
];

const steps = [
  { n: "1", text: "Administrador configura a escola" },
  { n: "2", text: "Diretor cadastra professores e turmas" },
  { n: "3", text: "Diretor define matérias e calendário semanal" },
  { n: "4", text: "Professores acessam suas turmas" },
  { n: "5", text: "A escola acompanha o desempenho acadêmico" },
];

const screenshots = [
  "Dashboard do Diretor", "Dashboard do Educador", "Dashboard do Responsável",
  "Cadastro de Alunos", "Cadastro de Professores", "Gestão de Turmas",
  "Calendário Semanal", "Horário das Aulas", "Recados com Fotos", "Boletim Escolar"
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

export default function LandingPage() {
  const [contactOpen, setContactOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background font-[Quicksand]">
      <ContactModal open={contactOpen} onOpenChange={setContactOpen} />

      {/* NAV */}
      <nav className="sticky top-0 z-50 bg-card/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <img src={logoFleur} alt="Agenda Fleur" className="w-8 h-8" />
            <span className="font-bold text-lg text-foreground">Agenda Fleur</span>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/login">
              <Button variant="ghost" size="sm">Entrar</Button>
            </Link>
            <Button size="sm" onClick={() => setContactOpen(true)}>Solicite um orçamento</Button>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative overflow-hidden py-20 md:py-32 px-4">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/10" />
        <div className="relative max-w-4xl mx-auto text-center space-y-6">
          <h1 className="text-4xl md:text-6xl font-extrabold text-foreground leading-tight">
            Sistema Completo de<br />
            <span className="text-primary">Gestão Escolar</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Uma plataforma moderna que organiza a gestão pedagógica e administrativa da sua escola em um único lugar.
          </p>
          <p className="text-base text-muted-foreground max-w-xl mx-auto">
            Controle turmas, professores, matérias, calendário escolar e desempenho acadêmico com uma plataforma simples, rápida e segura.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
            <Button size="lg" className="text-base px-8" onClick={() => setContactOpen(true)}>
              Solicite seu orçamento <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button size="lg" variant="outline" className="text-base px-8" asChild>
              <a href="#funcionalidades">Ver funcionalidades <ChevronRight className="ml-1 w-4 h-4" /></a>
            </Button>
          </div>
        </div>
      </section>

      {/* PROBLEMA */}
      <section className="py-16 md:py-24 px-4 bg-muted/40">
        <div className="max-w-6xl mx-auto space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">Os desafios da gestão escolar</h2>
            <p className="text-muted-foreground">
              Muitas escolas ainda utilizam planilhas, processos manuais ou sistemas limitados para organizar suas atividades pedagógicas.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {problems.map(p => (
              <Card key={p.title} className="border-destructive/20 bg-destructive/5">
                <CardContent className="p-6 text-center space-y-3">
                  <p.icon className="w-10 h-10 mx-auto text-destructive" />
                  <h3 className="font-bold text-foreground">{p.title}</h3>
                  <p className="text-sm text-muted-foreground">{p.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* SOLUÇÃO */}
      <section className="py-16 md:py-24 px-4">
        <div className="max-w-6xl mx-auto space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">Uma plataforma pensada para escolas modernas</h2>
            <p className="text-muted-foreground">
              Nosso sistema centraliza todas as informações acadêmicas e administrativas da escola, permitindo uma gestão mais organizada, eficiente e profissional.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {benefits.map(b => (
              <Card key={b.title} className="border-primary/20 hover:border-primary/40 transition-colors">
                <CardContent className="p-6 space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <b.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-bold text-foreground">{b.title}</h3>
                  <p className="text-sm text-muted-foreground">{b.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FUNCIONALIDADES */}
      <section id="funcionalidades" className="py-16 md:py-24 px-4 bg-muted/40">
        <div className="max-w-6xl mx-auto space-y-10">
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">Funcionalidades do Sistema</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map(f => (
              <Card key={f.title} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6 space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <f.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-bold text-lg text-foreground">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* PERFIS */}
      <section className="py-16 md:py-24 px-4">
        <div className="max-w-6xl mx-auto space-y-10">
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">Perfis de Usuário</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {profiles.map(p => (
              <Card key={p.title} className="border-primary/20">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <p.icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground">{p.title}</h3>
                  </div>
                  <ul className="space-y-2">
                    {p.items.map(item => (
                      <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section className="py-16 md:py-24 px-4 bg-muted/40">
        <div className="max-w-4xl mx-auto space-y-10">
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">Como o Sistema Funciona</h2>
          </div>
          <div className="space-y-4">
            {steps.map((s, i) => (
              <div key={s.n} className="flex items-center gap-4 bg-card rounded-2xl p-5 border border-border shadow-sm">
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg shrink-0">
                  {s.n}
                </div>
                <p className="text-foreground font-medium">{s.text}</p>
                {i < steps.length - 1 && <ArrowRight className="w-5 h-5 text-muted-foreground ml-auto hidden md:block" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRINTS */}
      <section className="py-16 md:py-24 px-4">
        <div className="max-w-6xl mx-auto space-y-10">
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">Veja o Sistema em Ação</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {screenshots.map(s => (
              <div key={s} className="aspect-video bg-muted rounded-xl border border-border flex items-center justify-center p-3">
                <p className="text-xs text-muted-foreground text-center font-medium">{s}</p>
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-muted-foreground">* Imagens ilustrativas. Prints reais em breve.</p>
        </div>
      </section>

      {/* COMPARAÇÃO */}
      <section className="py-16 md:py-24 px-4 bg-muted/40">
        <div className="max-w-3xl mx-auto space-y-10">
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">Comparação</h2>
          </div>
          <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
            <div className="grid grid-cols-3 bg-muted/60 p-4 font-bold text-sm text-foreground">
              <span>Recurso</span>
              <span className="text-center">Métodos antigos</span>
              <span className="text-center">Agenda Fleur</span>
            </div>
            {comparison.map((c, i) => (
              <div key={c.item} className={`grid grid-cols-3 p-4 text-sm items-center ${i % 2 === 0 ? "" : "bg-muted/20"}`}>
                <span className="text-foreground font-medium">{c.item}</span>
                <span className="flex justify-center"><XCircle className="w-5 h-5 text-destructive" /></span>
                <span className="flex justify-center"><CheckCircle2 className="w-5 h-5 text-primary" /></span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PARA QUEM */}
      <section className="py-16 md:py-24 px-4">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-3">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">Para quem é o sistema?</h2>
            <p className="text-muted-foreground">Nossa plataforma foi desenvolvida especialmente para:</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
            {audiences.map(a => (
              <div key={a} className="flex items-center gap-3 bg-card rounded-xl border border-border p-4 shadow-sm">
                <Star className="w-5 h-5 text-primary shrink-0" />
                <span className="text-foreground font-medium">{a}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA CONVERSÃO */}
      <section className="py-20 md:py-28 px-4 bg-gradient-to-br from-primary/10 via-primary/5 to-accent/10">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <h2 className="text-3xl md:text-5xl font-extrabold text-foreground">
            Leve sua escola para o<br /><span className="text-primary">próximo nível</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Solicite uma demonstração e descubra como nossa plataforma pode transformar a gestão da sua escola.
          </p>
          <Button size="lg" className="text-lg px-10 py-6" onClick={() => setContactOpen(true)}>
            Solicite sua demonstração <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
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
        <p className="text-xs text-muted-foreground">
          Copyright © 2026 - Desenvolvido por Fleur Tech Solutions.
        </p>
      </footer>
    </div>
  );
}
