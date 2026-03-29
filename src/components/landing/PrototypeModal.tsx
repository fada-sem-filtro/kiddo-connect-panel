import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Calendar,
  Users,
  MessageSquare,
  GraduationCap,
  BarChart3,
  CalendarDays,
  ClipboardList,
  UserCog,
  Building2,
  Baby,
  LayoutDashboard,
  FileText,
  UserCheck,
  Settings,
  Library,
  BookOpen,
  PartyPopper,
  Shield,
  Clock,
  Bell,
  ChevronRight,
  Star,
  CheckCircle2,
  Image as ImageIcon,
  TrendingUp,
  AlertTriangle,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";

type RoleType = "diretor" | "educador" | "responsavel";

interface PrototypeModalProps {
  open: boolean;
  onClose: () => void;
  role: RoleType;
}

// ============ MOCK DATA ============
const mockAlunos = [
  { id: "1", nome: "Maria Luísa", turma: "Infantil III", status: "presente" },
  { id: "2", nome: "Pedro Henrique", turma: "1º Ano A", status: "presente" },
  { id: "3", nome: "Ana Clara", turma: "Infantil III", status: "ausente" },
  { id: "4", nome: "Lucas Gabriel", turma: "2º Ano B", status: "presente" },
  { id: "5", nome: "Sofia Oliveira", turma: "1º Ano A", status: "presente" },
  { id: "6", nome: "Davi Santos", turma: "Infantil III", status: "presente" },
  { id: "7", nome: "Helena Costa", turma: "2º Ano B", status: "atrasado" },
  { id: "8", nome: "Theo Almeida", turma: "1º Ano A", status: "presente" },
];

const mockTurmas = [
  { id: "1", nome: "Infantil III", alunos: 18, educador: "Ana Silva", faixa: "4-5 anos" },
  { id: "2", nome: "1º Ano A", alunos: 25, educador: "Carlos Souza", faixa: "6-7 anos" },
  { id: "3", nome: "2º Ano B", alunos: 22, educador: "Beatriz Lima", faixa: "7-8 anos" },
  { id: "4", nome: "3º Ano A", alunos: 20, educador: "Roberto Dias", faixa: "8-9 anos" },
];

const mockEducadores = [
  { nome: "Ana Silva", turmas: "Infantil III", email: "ana@escola.com", ativo: true },
  { nome: "Carlos Souza", turmas: "1º Ano A", email: "carlos@escola.com", ativo: true },
  { nome: "Beatriz Lima", turmas: "2º Ano B", email: "beatriz@escola.com", ativo: true },
  { nome: "Roberto Dias", turmas: "3º Ano A", email: "roberto@escola.com", ativo: false },
];

const mockRecados = [
  {
    de: "Prof. Ana Silva",
    titulo: "Atividade de pintura",
    msg: "As crianças fizeram uma atividade de pintura hoje! 🎨",
    hora: "10:30",
    foto: true,
  },
  {
    de: "Coord. Pedagógica",
    titulo: "Reunião de pais",
    msg: "Reunião de pais dia 20/06 às 19h no auditório.",
    hora: "08:15",
    foto: false,
  },
  {
    de: "Prof. Carlos",
    titulo: "Lição de casa",
    msg: "Lembrem de trazer o material de matemática amanhã.",
    hora: "14:00",
    foto: false,
  },
  {
    de: "Direção",
    titulo: "Festa junina",
    msg: "A festa junina será no dia 25/06. Confirmem presença!",
    hora: "09:00",
    foto: true,
  },
];

const mockEventos = [
  { tipo: "refeicao", hora: "07:30", desc: "Café da manhã – Comeu bem", crianca: "Maria Luísa" },
  { tipo: "higiene", hora: "09:00", desc: "Troca de fralda", crianca: "Maria Luísa" },
  { tipo: "sono", hora: "12:00", desc: "Dormiu 1h30", crianca: "Maria Luísa" },
  { tipo: "refeicao", hora: "12:30", desc: "Almoço – Comeu pouco", crianca: "Maria Luísa" },
  { tipo: "atividade", hora: "14:00", desc: "Pintura com guache", crianca: "Maria Luísa" },
  { tipo: "refeicao", hora: "15:30", desc: "Lanche – Comeu tudo", crianca: "Maria Luísa" },
];

const mockBoletim = [
  { materia: "Português", n1: 8.5, n2: 9.0, n3: 8.0 },
  { materia: "Matemática", n1: 9.0, n2: 8.5, n3: 9.5 },
  { materia: "Ciências", n1: 7.5, n2: 8.0, n3: 8.5 },
  { materia: "História", n1: 8.0, n2: 7.5, n3: 9.0 },
  { materia: "Geografia", n1: 8.5, n2: 8.0, n3: 8.0 },
];

const mockGrade = [
  { hora: "07:30", seg: "Português", ter: "Matemática", qua: "Ciências", qui: "História", sex: "Ed. Física" },
  { hora: "08:30", seg: "Matemática", ter: "Português", qua: "Arte", qui: "Geografia", sex: "Português" },
  { hora: "09:30", seg: "Ciências", ter: "História", qua: "Português", qui: "Matemática", sex: "Ciências" },
  { hora: "10:30", seg: "Ed. Física", ter: "Arte", qua: "Matemática", qui: "Português", sex: "Geografia" },
];

const mockFeriados = [
  { data: "01/01", nome: "Confraternização Universal" },
  { data: "21/04", nome: "Tiradentes" },
  { data: "01/05", nome: "Dia do Trabalho" },
  { data: "07/09", nome: "Independência" },
  { data: "12/10", nome: "Dia das Crianças" },
  { data: "15/11", nome: "Proclamação da República" },
];

const mockPresencas = [
  { nome: "Maria Luísa", status: "presente", hora: "07:25" },
  { nome: "Pedro Henrique", status: "presente", hora: "07:30" },
  { nome: "Ana Clara", status: "ausente", hora: "—" },
  { nome: "Lucas Gabriel", status: "presente", hora: "07:45" },
  { nome: "Sofia Oliveira", status: "presente", hora: "07:20" },
  { nome: "Davi Santos", status: "presente", hora: "07:35" },
  { nome: "Helena Costa", status: "atrasado", hora: "08:10" },
  { nome: "Theo Almeida", status: "presente", hora: "07:28" },
];

// ============ MENU CONFIGS ============
interface MenuItem {
  id: string;
  label: string;
  icon: typeof Calendar;
  section?: string;
}

const diretorMenuItems: MenuItem[] = [
  { id: "dashboard", label: "Dashboard", icon: BarChart3, section: "Gestão" },
  { id: "membros", label: "Corpo Docente", icon: Users, section: "Gestão" },
  { id: "turmas", label: "Turmas", icon: GraduationCap, section: "Gestão" },
  { id: "alunos", label: "Alunos", icon: Baby, section: "Gestão" },
  { id: "usuarios", label: "Usuários", icon: UserCog, section: "Gestão" },
  { id: "feriados", label: "Feriados", icon: PartyPopper, section: "Gestão" },
  { id: "calendario", label: "Calendário", icon: CalendarDays, section: "Gestão" },
  { id: "recados", label: "Recados", icon: MessageSquare, section: "Comunicação" },
  { id: "relatorios", label: "Relatórios", icon: FileText, section: "Pedagógico" },
  { id: "boletim", label: "Boletim", icon: BookOpen, section: "Pedagógico" },
  { id: "materias", label: "Matérias", icon: Library, section: "Pedagógico" },
  { id: "grade", label: "Grade de Aulas", icon: CalendarDays, section: "Pedagógico" },
  { id: "desempenho", label: "Rel. Desempenho", icon: ClipboardList, section: "Pedagógico" },
  { id: "pedagogico", label: "Config. Pedagógicas", icon: Settings, section: "Configurações" },
];

const educadorMenuItems: MenuItem[] = [
  { id: "agenda", label: "Agenda", icon: Calendar, section: "Principal" },
  { id: "painel", label: "Painel Educador", icon: LayoutDashboard, section: "Principal" },
  { id: "turma", label: "Minha Turma", icon: Users, section: "Principal" },
  { id: "recados", label: "Recados", icon: MessageSquare, section: "Principal" },
  { id: "minha-agenda", label: "Minha Agenda", icon: ClipboardList, section: "Principal" },
  { id: "boletim", label: "Boletim", icon: BookOpen, section: "Pedagógico" },
  { id: "desempenho", label: "Rel. Desempenho", icon: ClipboardList, section: "Pedagógico" },
  { id: "grade", label: "Grade de Aulas", icon: CalendarDays, section: "Pedagógico" },
];

const responsavelMenuItems: MenuItem[] = [
  { id: "eventos", label: "Meus Eventos", icon: ClipboardList, section: "Acompanhamento" },
  { id: "recados", label: "Recados", icon: MessageSquare, section: "Acompanhamento" },
  { id: "calendario", label: "Calendário Escolar", icon: CalendarDays, section: "Acompanhamento" },
  { id: "desempenho", label: "Desempenho", icon: BookOpen, section: "Acadêmico" },
  { id: "grade", label: "Grade de Aulas", icon: CalendarDays, section: "Acadêmico" },
  { id: "boletim", label: "Boletim", icon: BookOpen, section: "Acadêmico" },
];

// ============ PAGE RENDERERS ============

function PageDashboardDiretor() {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-foreground">Dashboard da Escola</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Alunos", value: "248", icon: Baby, color: "bg-primary/10 text-primary" },
          { label: "Educadores", value: "18", icon: GraduationCap, color: "bg-blue-500/10 text-blue-600" },
          { label: "Turmas", value: "12", icon: Users, color: "bg-purple-500/10 text-purple-600" },
          { label: "Presença Hoje", value: "92%", icon: CheckCircle2, color: "bg-green-500/10 text-green-600" },
        ].map((c) => (
          <div key={c.label} className="rounded-xl border border-border bg-card p-3">
            <div className={`w-8 h-8 rounded-lg ${c.color} flex items-center justify-center mb-2`}>
              <c.icon className="w-4 h-4" />
            </div>
            <p className="text-2xl font-bold text-foreground">{c.value}</p>
            <p className="text-xs text-muted-foreground">{c.label}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="text-sm font-semibold mb-3">Presença por Turma</h3>
          <div className="space-y-2">
            {mockTurmas.map((t) => {
              const pct = Math.floor(Math.random() * 20 + 80);
              return (
                <div key={t.id} className="flex items-center gap-2 text-xs">
                  <span className="w-20 truncate text-foreground">{t.nome}</span>
                  <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-muted-foreground w-8 text-right">{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="text-sm font-semibold mb-3">Alertas</h3>
          <div className="space-y-2">
            {[
              { msg: "3 alunos ausentes há 3 dias consecutivos", type: "warning" },
              { msg: "Reunião pedagógica amanhã às 14h", type: "info" },
              { msg: "2 recados não lidos pelos responsáveis", type: "warning" },
            ].map((a, i) => (
              <div
                key={i}
                className={`flex items-center gap-2 text-xs p-2 rounded-lg ${a.type === "warning" ? "bg-orange-50 text-orange-700" : "bg-blue-50 text-blue-700"}`}
              >
                <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                <span>{a.msg}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function PageMembros() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">Corpo Docente</h2>
        <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
          {mockEducadores.length} educadores
        </span>
      </div>
      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-muted/60">
            <tr>
              <th className="text-left p-2 font-semibold">Nome</th>
              <th className="text-left p-2 font-semibold hidden sm:table-cell">Turmas</th>
              <th className="text-left p-2 font-semibold hidden md:table-cell">Email</th>
              <th className="text-center p-2 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {mockEducadores.map((e, i) => (
              <tr key={i} className={i % 2 === 0 ? "" : "bg-muted/20"}>
                <td className="p-2 font-medium text-foreground">{e.nome}</td>
                <td className="p-2 text-muted-foreground hidden sm:table-cell">{e.turmas}</td>
                <td className="p-2 text-muted-foreground hidden md:table-cell">{e.email}</td>
                <td className="p-2 text-center">
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${e.ativo ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}
                  >
                    {e.ativo ? "Ativo" : "Inativo"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PageTurmas() {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-foreground">Gestão de Turmas</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {mockTurmas.map((t) => (
          <div key={t.id} className="rounded-xl border border-border bg-card p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-foreground text-sm">{t.nome}</h3>
              <span className="text-[10px] bg-muted px-2 py-0.5 rounded-full text-muted-foreground">{t.faixa}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
              <GraduationCap className="w-3 h-3" />
              <span>{t.educador}</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <Users className="w-3 h-3 text-primary" />
              <span className="text-foreground font-medium">{t.alunos} alunos</span>
              <div className="flex-1 bg-muted rounded-full h-1.5 ml-2">
                <div className="h-full bg-primary rounded-full" style={{ width: `${(t.alunos / 25) * 100}%` }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PageAlunos() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">Alunos</h2>
        <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">{mockAlunos.length} alunos</span>
      </div>
      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-muted/60">
            <tr>
              <th className="text-left p-2 font-semibold">Aluno</th>
              <th className="text-left p-2 font-semibold">Turma</th>
              <th className="text-center p-2 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {mockAlunos.map((a, i) => (
              <tr key={a.id} className={i % 2 === 0 ? "" : "bg-muted/20"}>
                <td className="p-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                      <Baby className="w-3 h-3 text-primary" />
                    </div>
                    <span className="font-medium text-foreground">{a.nome}</span>
                  </div>
                </td>
                <td className="p-2 text-muted-foreground">{a.turma}</td>
                <td className="p-2 text-center">
                  <span
                    className={cn(
                      "px-1.5 py-0.5 rounded-full text-[10px] font-medium",
                      a.status === "presente"
                        ? "bg-green-100 text-green-700"
                        : a.status === "atrasado"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-600",
                    )}
                  >
                    {a.status === "presente" ? "Presente" : a.status === "atrasado" ? "Atrasado" : "Ausente"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PageRecados() {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-foreground">Recados</h2>
      <div className="space-y-3">
        {mockRecados.map((r, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-3 hover:shadow-sm transition-shadow">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center">
                <GraduationCap className="w-3.5 h-3.5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-foreground">{r.de}</p>
                <p className="text-[10px] text-muted-foreground">{r.hora}</p>
              </div>
            </div>
            <p className="text-xs font-semibold text-foreground mb-1">{r.titulo}</p>
            <p className="text-xs text-muted-foreground">{r.msg}</p>
            {r.foto && (
              <div className="mt-2 rounded-lg bg-gradient-to-br from-pink-50 to-orange-50 h-16 flex items-center justify-center border border-border">
                <ImageIcon className="w-5 h-5 text-orange-400" />
                <span className="text-[10px] text-muted-foreground ml-1">Foto anexada</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function PageCalendario() {
  const dias = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-foreground">Calendário Escolar</h2>
      <div className="rounded-xl border border-border bg-card p-4">
        <p className="text-sm font-semibold text-center mb-3">Junho 2026</p>
        <div className="grid grid-cols-7 gap-1 text-center">
          {dias.map((d) => (
            <p key={d} className="text-[10px] font-bold text-muted-foreground py-1">
              {d}
            </p>
          ))}
          {Array.from({ length: 30 }, (_, i) => i + 1).map((d) => {
            const isEvent = [5, 12, 15, 20, 25].includes(d);
            const isFeriado = [24].includes(d);
            return (
              <div
                key={d}
                className={cn(
                  "p-1 rounded text-xs",
                  isEvent
                    ? "bg-primary/10 text-primary font-bold"
                    : isFeriado
                      ? "bg-red-100 text-red-600 font-bold"
                      : "text-foreground",
                )}
              >
                {d}
              </div>
            );
          })}
        </div>
        <div className="mt-3 flex gap-3 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded bg-primary/40" /> Evento
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded bg-red-300" /> Feriado
          </span>
        </div>
      </div>
    </div>
  );
}

function PageFeriados() {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-foreground">Feriados</h2>
      <div className="space-y-2">
        {mockFeriados.map((f, i) => (
          <div key={i} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
            <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
              <PartyPopper className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <p className="text-xs font-bold text-foreground">{f.nome}</p>
              <p className="text-[10px] text-muted-foreground">{f.data}</p>
            </div>
            <span className="ml-auto text-[10px] bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
              Recorrente
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PageBoletim() {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-foreground">Boletim Escolar</h2>
      <div className="flex items-center gap-2 mb-2">
        <Baby className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold text-foreground">Maria Luísa – 1º Ano A</span>
      </div>
      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-muted/60">
            <tr>
              <th className="text-left p-2 font-semibold">Matéria</th>
              <th className="text-center p-2 font-semibold">1º Tri</th>
              <th className="text-center p-2 font-semibold">2º Tri</th>
              <th className="text-center p-2 font-semibold">3º Tri</th>
              <th className="text-center p-2 font-semibold">Média</th>
            </tr>
          </thead>
          <tbody>
            {mockBoletim.map((m, i) => {
              const media = ((m.n1 + m.n2 + m.n3) / 3).toFixed(1);
              return (
                <tr key={i} className={i % 2 === 0 ? "" : "bg-muted/20"}>
                  <td className="p-2 font-medium text-foreground">{m.materia}</td>
                  <td className="p-2 text-center text-muted-foreground">{m.n1}</td>
                  <td className="p-2 text-center text-muted-foreground">{m.n2}</td>
                  <td className="p-2 text-center text-muted-foreground">{m.n3}</td>
                  <td className="p-2 text-center font-bold text-primary">{media}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PageGrade() {
  const diasSemana = ["Seg", "Ter", "Qua", "Qui", "Sex"];
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-foreground">Grade de Aulas</h2>
      <p className="text-xs text-muted-foreground">1º Ano A – Segunda a Sexta</p>
      <div className="rounded-xl border border-border overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-muted/60">
            <tr>
              <th className="text-left p-2 font-semibold">Horário</th>
              {diasSemana.map((d) => (
                <th key={d} className="text-center p-2 font-semibold">
                  {d}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {mockGrade.map((g, i) => (
              <tr key={i} className={i % 2 === 0 ? "" : "bg-muted/20"}>
                <td className="p-2 font-mono text-primary font-medium">{g.hora}</td>
                <td className="p-2 text-center text-foreground">{g.seg}</td>
                <td className="p-2 text-center text-foreground">{g.ter}</td>
                <td className="p-2 text-center text-foreground">{g.qua}</td>
                <td className="p-2 text-center text-foreground">{g.qui}</td>
                <td className="p-2 text-center text-foreground">{g.sex}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PageRelatorios() {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-foreground">Relatórios</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {[
          {
            title: "Relatório de Presença",
            desc: "Acompanhe a frequência dos alunos por turma e período",
            icon: UserCheck,
          },
          { title: "Relatório por Aluno", desc: "Visão detalhada do desempenho individual", icon: Baby },
          { title: "Relatório de Turma", desc: "Análise comparativa entre turmas", icon: Users },
          { title: "Relatório Pedagógico", desc: "Progresso nas competências e habilidades", icon: BookOpen },
        ].map((r, i) => (
          <div
            key={i}
            className="rounded-xl border border-border bg-card p-4 hover:shadow-sm transition-shadow cursor-pointer"
          >
            <r.icon className="w-6 h-6 text-primary mb-2" />
            <h3 className="text-xs font-bold text-foreground">{r.title}</h3>
            <p className="text-[10px] text-muted-foreground mt-1">{r.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function PageDesempenho() {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-foreground">Relatório de Desempenho</h2>
      <div className="flex items-center gap-2 mb-2">
        <Baby className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold text-foreground">Maria Luísa – Infantil III</span>
      </div>
      <div className="space-y-3">
        {[
          {
            secao: "Desenvolvimento Social",
            itens: [
              { nome: "Interação com colegas", nivel: "Consolidado" },
              { nome: "Respeito às regras", nivel: "Em desenvolvimento" },
            ],
          },
          {
            secao: "Linguagem",
            itens: [
              { nome: "Expressão oral", nivel: "Consolidado" },
              { nome: "Vocabulário", nivel: "Consolidado" },
            ],
          },
          {
            secao: "Coordenação Motora",
            itens: [
              { nome: "Motricidade fina", nivel: "Em desenvolvimento" },
              { nome: "Motricidade grossa", nivel: "Consolidado" },
            ],
          },
        ].map((s, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-3">
            <h3 className="text-xs font-bold text-foreground mb-2">{s.secao}</h3>
            <div className="space-y-1.5">
              {s.itens.map((it, j) => (
                <div key={j} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{it.nome}</span>
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded-full text-[10px] font-medium",
                      it.nivel === "Consolidado" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700",
                    )}
                  >
                    {it.nivel}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PageMaterias() {
  const materias = ["Português", "Matemática", "Ciências", "História", "Geografia", "Arte", "Ed. Física", "Inglês"];
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-foreground">Matérias</h2>
      <div className="grid grid-cols-2 gap-2">
        {materias.map((m, i) => (
          <div key={i} className="flex items-center gap-2 rounded-xl border border-border bg-card p-3">
            <Library className="w-4 h-4 text-primary" />
            <span className="text-xs font-medium text-foreground">{m}</span>
            <span className="ml-auto w-2 h-2 rounded-full bg-green-500" />
          </div>
        ))}
      </div>
    </div>
  );
}

function PagePedagogico() {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-foreground">Configurações Pedagógicas</h2>
      <div className="space-y-3">
        {[
          { label: "Boletim Escolar", desc: "Ativar sistema de notas e boletins", ativo: true },
          { label: "Gestão de Matérias", desc: "Gerenciar disciplinas por turma", ativo: true },
          { label: "Grade de Aulas", desc: "Organizar horários semanais", ativo: true },
          { label: "Relatório de Desempenho", desc: "Avaliações qualitativas", ativo: false },
        ].map((c, i) => (
          <div key={i} className="flex items-center justify-between rounded-xl border border-border bg-card p-3">
            <div>
              <p className="text-xs font-bold text-foreground">{c.label}</p>
              <p className="text-[10px] text-muted-foreground">{c.desc}</p>
            </div>
            <div
              className={cn(
                "w-9 h-5 rounded-full flex items-center transition-colors px-0.5",
                c.ativo ? "bg-primary justify-end" : "bg-muted justify-start",
              )}
            >
              <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PageUsuarios() {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-foreground">Usuários</h2>
      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-muted/60">
            <tr>
              <th className="text-left p-2 font-semibold">Nome</th>
              <th className="text-left p-2 font-semibold hidden sm:table-cell">Email</th>
              <th className="text-center p-2 font-semibold">Perfil</th>
              <th className="text-center p-2 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {[
              { nome: "Ana Silva", email: "ana@escola.com", perfil: "Educador", ativo: true },
              { nome: "João Santos", email: "joao@email.com", perfil: "Responsável", ativo: true },
              { nome: "Carlos Souza", email: "carlos@escola.com", perfil: "Educador", ativo: true },
              { nome: "Maria Oliveira", email: "maria@email.com", perfil: "Responsável", ativo: true },
              { nome: "Roberto Dias", email: "roberto@escola.com", perfil: "Educador", ativo: false },
            ].map((u, i) => (
              <tr key={i} className={i % 2 === 0 ? "" : "bg-muted/20"}>
                <td className="p-2 font-medium text-foreground">{u.nome}</td>
                <td className="p-2 text-muted-foreground hidden sm:table-cell">{u.email}</td>
                <td className="p-2 text-center">
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-primary/10 text-primary">
                    {u.perfil}
                  </span>
                </td>
                <td className="p-2 text-center">
                  <span className={`w-2 h-2 rounded-full inline-block ${u.ativo ? "bg-green-500" : "bg-red-400"}`} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PagePainelEducador() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
          <GraduationCap className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground">Painel do Educador</h2>
          <p className="text-xs text-muted-foreground">Prof. Ana Silva – Infantil III</p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-green-500/10 rounded-xl p-3 text-center">
          <p className="text-xl font-bold text-green-600">15</p>
          <p className="text-[10px] text-muted-foreground">Presentes</p>
        </div>
        <div className="bg-red-500/10 rounded-xl p-3 text-center">
          <p className="text-xl font-bold text-red-500">2</p>
          <p className="text-[10px] text-muted-foreground">Ausentes</p>
        </div>
        <div className="bg-yellow-500/10 rounded-xl p-3 text-center">
          <p className="text-xl font-bold text-yellow-600">1</p>
          <p className="text-[10px] text-muted-foreground">Atrasado</p>
        </div>
      </div>
      <div className="rounded-xl border border-border bg-card p-3">
        <h3 className="text-xs font-semibold mb-2">Presença de Hoje</h3>
        <div className="space-y-1.5">
          {mockPresencas.slice(0, 6).map((p, i) => (
            <div key={i} className="flex items-center justify-between text-xs">
              <span className="text-foreground">{p.nome}</span>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-[10px]">{p.hora}</span>
                <span
                  className={cn(
                    "w-2 h-2 rounded-full",
                    p.status === "presente" ? "bg-green-500" : p.status === "atrasado" ? "bg-yellow-500" : "bg-red-400",
                  )}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PageMinhaTurma() {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-foreground">Minha Turma – Infantil III</h2>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-border bg-card p-3 text-center">
          <p className="text-xl font-bold text-primary">18</p>
          <p className="text-[10px] text-muted-foreground">Total de Alunos</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-3 text-center">
          <p className="text-xl font-bold text-green-600">88%</p>
          <p className="text-[10px] text-muted-foreground">Freq. Média</p>
        </div>
      </div>
      <div className="space-y-2">
        {mockAlunos
          .filter((a) => a.turma === "Infantil III")
          .map((a, i) => (
            <div key={i} className="flex items-center gap-2 rounded-xl border border-border bg-card p-3">
              <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center">
                <Baby className="w-3.5 h-3.5 text-primary" />
              </div>
              <span className="text-xs font-medium text-foreground flex-1">{a.nome}</span>
              <span
                className={cn(
                  "px-1.5 py-0.5 rounded-full text-[10px] font-medium",
                  a.status === "presente" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600",
                )}
              >
                {a.status === "presente" ? "Presente" : "Ausente"}
              </span>
            </div>
          ))}
      </div>
    </div>
  );
}

function PageAgendaEducador() {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-foreground">Minha Agenda</h2>
      <p className="text-xs text-muted-foreground">Terça-feira, 10 de Junho de 2026</p>
      <div className="space-y-2">
        {[
          { hora: "07:30", evento: "Acolhimento das crianças", tipo: "rotina" },
          { hora: "08:00", evento: "Roda de conversa", tipo: "atividade" },
          { hora: "09:00", evento: "Atividade de pintura", tipo: "atividade" },
          { hora: "10:00", evento: "Lanche", tipo: "refeicao" },
          { hora: "10:30", evento: "Parquinho", tipo: "recreacao" },
          { hora: "11:30", evento: "Almoço", tipo: "refeicao" },
          { hora: "12:00", evento: "Hora do sono", tipo: "sono" },
        ].map((e, i) => (
          <div key={i} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
            <span className="text-xs font-mono text-primary font-medium w-10">{e.hora}</span>
            <div
              className={cn(
                "w-1 h-8 rounded-full",
                e.tipo === "rotina"
                  ? "bg-blue-400"
                  : e.tipo === "atividade"
                    ? "bg-purple-400"
                    : e.tipo === "refeicao"
                      ? "bg-orange-400"
                      : e.tipo === "sono"
                        ? "bg-indigo-400"
                        : "bg-green-400",
              )}
            />
            <span className="text-xs text-foreground">{e.evento}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PageEventosResponsavel() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Baby className="w-4 h-4 text-primary" />
        <h2 className="text-lg font-bold text-foreground">Eventos de Maria Luísa</h2>
      </div>
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="bg-orange-50 rounded-lg p-2 text-center">
          <p className="text-lg font-bold text-orange-600">3</p>
          <p className="text-[10px] text-muted-foreground">Refeições</p>
        </div>
        <div className="bg-blue-50 rounded-lg p-2 text-center">
          <p className="text-lg font-bold text-blue-600">1</p>
          <p className="text-[10px] text-muted-foreground">Higiene</p>
        </div>
        <div className="bg-indigo-50 rounded-lg p-2 text-center">
          <p className="text-lg font-bold text-indigo-600">1</p>
          <p className="text-[10px] text-muted-foreground">Sono</p>
        </div>
      </div>
      <div className="space-y-2">
        {mockEventos.map((e, i) => (
          <div key={i} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
            <span className="text-xs font-mono text-primary font-medium w-10">{e.hora}</span>
            <div
              className={cn(
                "w-6 h-6 rounded-lg flex items-center justify-center",
                e.tipo === "refeicao"
                  ? "bg-orange-100"
                  : e.tipo === "higiene"
                    ? "bg-blue-100"
                    : e.tipo === "sono"
                      ? "bg-indigo-100"
                      : "bg-purple-100",
              )}
            >
              {e.tipo === "refeicao" ? "🍽️" : e.tipo === "higiene" ? "🧼" : e.tipo === "sono" ? "😴" : "🎨"}
            </div>
            <span className="text-xs text-foreground">{e.desc}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PageAgenda() {
  const dias = ["Seg 9", "Ter 10", "Qua 11", "Qui 12", "Sex 13"];
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-foreground">Agenda</h2>
      <div className="flex gap-1 overflow-x-auto pb-1">
        {dias.map((d, i) => (
          <div
            key={d}
            className={cn(
              "flex-shrink-0 px-3 py-2 rounded-xl text-xs text-center cursor-pointer transition-colors",
              i === 1 ? "bg-primary text-primary-foreground font-bold" : "bg-muted text-foreground hover:bg-muted/80",
            )}
          >
            {d}
          </div>
        ))}
      </div>
      <div className="space-y-2">
        {mockEventos.slice(0, 5).map((e, i) => (
          <div key={i} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
            <span className="text-xs font-mono text-primary font-medium w-10">{e.hora}</span>
            <div>
              <p className="text-xs font-medium text-foreground">{e.desc}</p>
              <p className="text-[10px] text-muted-foreground">{e.crianca}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============ PAGE ROUTER ============
function renderPage(pageId: string, role: RoleType) {
  switch (pageId) {
    case "dashboard":
      return <PageDashboardDiretor />;
    case "membros":
      return <PageMembros />;
    case "turmas":
      return <PageTurmas />;
    case "alunos":
      return <PageAlunos />;
    case "usuarios":
      return <PageUsuarios />;
    case "recados":
      return <PageRecados />;
    case "calendario":
      return <PageCalendario />;
    case "feriados":
      return <PageFeriados />;
    case "boletim":
      return <PageBoletim />;
    case "grade":
      return <PageGrade />;
    case "relatorios":
      return <PageRelatorios />;
    case "desempenho":
      return <PageDesempenho />;
    case "materias":
      return <PageMaterias />;
    case "pedagogico":
      return <PagePedagogico />;
    case "agenda":
      return <PageAgenda />;
    case "painel":
      return <PagePainelEducador />;
    case "turma":
      return <PageMinhaTurma />;
    case "minha-agenda":
      return <PageAgendaEducador />;
    case "eventos":
      return <PageEventosResponsavel />;
    default:
      return <PageDashboardDiretor />;
  }
}

const roleConfig: Record<
  RoleType,
  { label: string; items: MenuItem[]; defaultPage: string; userName: string; userRole: string; school: string }
> = {
  diretor: {
    label: "Diretor",
    items: diretorMenuItems,
    defaultPage: "dashboard",
    userName: "Dr. Carlos Mendes",
    userRole: "Diretor",
    school: "Escola Fleur Infantil",
  },
  educador: {
    label: "Educador",
    items: educadorMenuItems,
    defaultPage: "agenda",
    userName: "Prof. Ana Silva",
    userRole: "Educadora",
    school: "Escola Fleur Infantil",
  },
  responsavel: {
    label: "Responsável",
    items: responsavelMenuItems,
    defaultPage: "eventos",
    userName: "João Santos",
    userRole: "Responsável",
    school: "Maria Luísa – Infantil III",
  },
};

// ============ MAIN COMPONENT ============
export function PrototypeModal({ open, onClose, role }: PrototypeModalProps) {
  const config = roleConfig[role];
  const [activePage, setActivePage] = useState(config.defaultPage);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const sections = config.items.reduce(
    (acc, item) => {
      const section = item.section || "Geral";
      if (!acc[section]) acc[section] = [];
      acc[section].push(item);
      return acc;
    },
    {} as Record<string, MenuItem[]>,
  );

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-2 sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="bg-background rounded-2xl shadow-2xl w-full max-w-5xl h-[90vh] max-h-[700px] overflow-hidden flex flex-col"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", damping: 25 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-muted/40">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                  <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
                </div>
                <span className="text-xs font-medium text-muted-foreground ml-2">
                  Agenda Fleur – Visão {config.label}
                </span>
                <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                  Demonstração Interativa
                </span>
              </div>
              <button onClick={onClose} className="p-1 rounded-lg hover:bg-muted transition-colors">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {/* Body */}
            <div className="flex flex-1 overflow-hidden">
              {/* Mobile menu button */}
              <button
                className="md:hidden fixed bottom-4 right-4 z-[101] bg-primary text-primary-foreground rounded-full w-10 h-10 flex items-center justify-center shadow-lg"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                <ChevronRight className={cn("w-5 h-5 transition-transform", sidebarOpen && "rotate-180")} />
              </button>

              {/* Sidebar */}
              <div
                className={cn(
                  "bg-card border-r border-border flex flex-col transition-all duration-300 overflow-y-auto",
                  "w-48 flex-shrink-0",
                  "max-md:absolute max-md:inset-y-0 max-md:left-0 max-md:z-[102] max-md:top-10 max-md:shadow-xl",
                  sidebarOpen ? "max-md:translate-x-0" : "max-md:-translate-x-full",
                )}
              >
                {/* User */}
                <div className="px-3 py-3 border-b border-border">
                  <p className="text-xs font-bold text-foreground truncate">{config.userName}</p>
                  <p className="text-[10px] text-muted-foreground">{config.userRole}</p>
                  <p className="text-[10px] text-primary font-medium truncate mt-0.5">{config.school}</p>
                </div>

                {/* Nav */}
                <nav className="flex-1 px-2 py-3 space-y-3">
                  {Object.entries(sections).map(([section, items]) => (
                    <div key={section}>
                      <p className="px-2 text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                        {section}
                      </p>
                      <div className="space-y-0.5">
                        {items.map((item) => (
                          <button
                            key={item.id}
                            onClick={() => {
                              setActivePage(item.id);
                              setSidebarOpen(false);
                            }}
                            className={cn(
                              "w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-[11px] font-medium transition-all text-left",
                              activePage === item.id
                                ? "bg-primary text-primary-foreground shadow-sm"
                                : "text-muted-foreground hover:bg-muted hover:text-foreground",
                            )}
                          >
                            <item.icon className="w-3.5 h-3.5 flex-shrink-0" />
                            <span className="truncate">{item.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </nav>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-background">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activePage}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    {renderPage(activePage, role)}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
