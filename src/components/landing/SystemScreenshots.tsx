import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import {
  Users, BookOpen, Calendar, Clock, MessageSquare,
  GraduationCap, BarChart3, Bell, CheckCircle2, Star,
  Baby, FileText, Image as ImageIcon,
} from "lucide-react";

const AnimCard = ({ children, i }: { children: React.ReactNode; i: number }) => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: i * 0.08 }}
    >
      {children}
    </motion.div>
  );
};

/* ---- Mini screenshot mockup shell ---- */
const MockWindow = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden hover:shadow-md transition-shadow group">
    {/* title bar */}
    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-muted/60 border-b border-border">
      <span className="w-2 h-2 rounded-full bg-red-400" />
      <span className="w-2 h-2 rounded-full bg-yellow-400" />
      <span className="w-2 h-2 rounded-full bg-green-400" />
      <span className="ml-2 text-[9px] font-medium text-muted-foreground truncate">{title}</span>
    </div>
    <div className="p-2.5 space-y-1.5 min-h-[140px]">{children}</div>
  </div>
);

const MiniBar = ({ w, color = "bg-primary" }: { w: string; color?: string }) => (
  <div className={`h-1.5 rounded-full ${color}`} style={{ width: w }} />
);

const MiniRow = ({ children, highlight }: { children: React.ReactNode; highlight?: boolean }) => (
  <div className={`flex items-center gap-1.5 px-1.5 py-1 rounded text-[8px] ${highlight ? "bg-primary/10" : "bg-muted/40"}`}>
    {children}
  </div>
);

/* ===== Individual Screens ===== */

function DashboardDiretor() {
  return (
    <MockWindow title="Dashboard do Diretor">
      <div className="grid grid-cols-3 gap-1.5">
        <div className="bg-primary/10 rounded-lg p-1.5 text-center">
          <p className="text-[16px] font-bold text-primary">248</p>
          <p className="text-[7px] text-muted-foreground">Alunos</p>
        </div>
        <div className="bg-accent/60 rounded-lg p-1.5 text-center">
          <p className="text-[16px] font-bold text-foreground">18</p>
          <p className="text-[7px] text-muted-foreground">Educadores</p>
        </div>
        <div className="bg-muted rounded-lg p-1.5 text-center">
          <p className="text-[16px] font-bold text-foreground">12</p>
          <p className="text-[7px] text-muted-foreground">Turmas</p>
        </div>
      </div>
      <div className="space-y-1 mt-1">
        <p className="text-[7px] font-semibold text-muted-foreground">Presença hoje</p>
        <div className="flex items-end gap-0.5 h-8">
          {[70, 85, 90, 60, 95, 80, 88].map((v, i) => (
            <div key={i} className="flex-1 bg-primary/70 rounded-t" style={{ height: `${v}%` }} />
          ))}
        </div>
      </div>
    </MockWindow>
  );
}

function DashboardEducador() {
  return (
    <MockWindow title="Dashboard do Educador">
      <div className="flex items-center gap-1.5 mb-1">
        <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
          <GraduationCap className="w-3 h-3 text-primary" />
        </div>
        <div>
          <p className="text-[8px] font-bold text-foreground">Prof. Ana Silva</p>
          <p className="text-[7px] text-muted-foreground">Turma B2 – Infantil III</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-1">
        <div className="bg-green-500/10 rounded p-1 text-center">
          <p className="text-[10px] font-bold text-green-600">22/25</p>
          <p className="text-[6px] text-muted-foreground">Presentes</p>
        </div>
        <div className="bg-orange-500/10 rounded p-1 text-center">
          <p className="text-[10px] font-bold text-orange-600">3</p>
          <p className="text-[6px] text-muted-foreground">Ausentes</p>
        </div>
      </div>
      <div className="space-y-0.5 mt-1">
        <MiniRow><Bell className="w-2.5 h-2.5 text-primary" /><span className="text-foreground">2 recados pendentes</span></MiniRow>
        <MiniRow><Calendar className="w-2.5 h-2.5 text-primary" /><span className="text-foreground">Reunião pedagógica 14h</span></MiniRow>
      </div>
    </MockWindow>
  );
}

function DashboardResponsavel() {
  return (
    <MockWindow title="Dashboard do Responsável">
      <div className="flex items-center gap-1.5 mb-1.5">
        <div className="w-6 h-6 rounded-full bg-pink-100 flex items-center justify-center">
          <Baby className="w-3.5 h-3.5 text-pink-500" />
        </div>
        <div>
          <p className="text-[8px] font-bold text-foreground">Maria Luísa</p>
          <p className="text-[7px] text-muted-foreground">1º Ano A</p>
        </div>
        <span className="ml-auto text-[7px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-medium">Presente</span>
      </div>
      <div className="space-y-1">
        <MiniRow highlight><MessageSquare className="w-2.5 h-2.5 text-primary" /><span className="text-foreground font-medium">Novo recado da Prof. Ana</span></MiniRow>
        <MiniRow><Calendar className="w-2.5 h-2.5 text-muted-foreground" /><span className="text-foreground">Festa junina – 15/06</span></MiniRow>
        <MiniRow><FileText className="w-2.5 h-2.5 text-muted-foreground" /><span className="text-foreground">Boletim disponível</span></MiniRow>
      </div>
    </MockWindow>
  );
}

function CadastroAlunos() {
  const alunos = [
    { nome: "Maria Luísa", turma: "1º Ano A", status: true },
    { nome: "Pedro Henrique", turma: "2º Ano B", status: true },
    { nome: "Ana Clara", turma: "1º Ano A", status: false },
    { nome: "Lucas Gabriel", turma: "3º Ano A", status: true },
  ];
  return (
    <MockWindow title="Cadastro de Alunos">
      <div className="space-y-1">
        {alunos.map((a, i) => (
          <div key={i} className="flex items-center gap-1.5 px-1.5 py-1 rounded bg-muted/40 text-[8px]">
            <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center">
              <Users className="w-2.5 h-2.5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground truncate">{a.nome}</p>
              <p className="text-[6px] text-muted-foreground">{a.turma}</p>
            </div>
            <span className={`w-1.5 h-1.5 rounded-full ${a.status ? "bg-green-500" : "bg-red-400"}`} />
          </div>
        ))}
      </div>
    </MockWindow>
  );
}

function CadastroProfessores() {
  const profs = [
    { nome: "Ana Silva", turmas: "B2, B3" },
    { nome: "Carlos Souza", turmas: "A1" },
    { nome: "Beatriz Lima", turmas: "C1, C2" },
    { nome: "Roberto Dias", turmas: "A2" },
  ];
  return (
    <MockWindow title="Cadastro de Professores">
      <div className="space-y-1">
        {profs.map((p, i) => (
          <div key={i} className="flex items-center gap-1.5 px-1.5 py-1 rounded bg-muted/40 text-[8px]">
            <div className="w-4 h-4 rounded-full bg-accent flex items-center justify-center">
              <GraduationCap className="w-2.5 h-2.5 text-foreground" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-foreground">{p.nome}</p>
              <p className="text-[6px] text-muted-foreground">Turmas: {p.turmas}</p>
            </div>
          </div>
        ))}
      </div>
    </MockWindow>
  );
}

function GestaoTurmas() {
  const turmas = [
    { nome: "1º Ano A", alunos: 25, cor: "bg-blue-400" },
    { nome: "2º Ano B", alunos: 22, cor: "bg-purple-400" },
    { nome: "3º Ano A", alunos: 20, cor: "bg-pink-400" },
    { nome: "Infantil III", alunos: 18, cor: "bg-orange-400" },
  ];
  return (
    <MockWindow title="Gestão de Turmas">
      <div className="grid grid-cols-2 gap-1.5">
        {turmas.map((t, i) => (
          <div key={i} className="rounded-lg border border-border p-1.5">
            <div className="flex items-center gap-1">
              <span className={`w-2 h-2 rounded-sm ${t.cor}`} />
              <p className="text-[8px] font-bold text-foreground">{t.nome}</p>
            </div>
            <p className="text-[7px] text-muted-foreground mt-0.5">{t.alunos} alunos</p>
            <MiniBar w={`${(t.alunos / 25) * 100}%`} />
          </div>
        ))}
      </div>
    </MockWindow>
  );
}

function CalendarioSemanal() {
  const dias = ["Seg", "Ter", "Qua", "Qui", "Sex"];
  const eventos = [
    { dia: 0, label: "Reunião", cor: "bg-primary" },
    { dia: 2, label: "Passeio", cor: "bg-orange-400" },
    { dia: 4, label: "Festa", cor: "bg-pink-400" },
  ];
  return (
    <MockWindow title="Calendário Semanal">
      <div className="grid grid-cols-5 gap-0.5">
        {dias.map((d, i) => (
          <div key={d} className="text-center">
            <p className="text-[7px] font-bold text-muted-foreground mb-0.5">{d}</p>
            <div className={`rounded p-1 min-h-[50px] ${i === 0 || i === 2 || i === 4 ? "bg-primary/5" : "bg-muted/30"}`}>
              {eventos.filter(e => e.dia === i).map((e, j) => (
                <div key={j} className={`${e.cor} text-white rounded px-0.5 py-0.5 text-[6px] font-medium mb-0.5`}>
                  {e.label}
                </div>
              ))}
              <p className="text-[8px] font-bold text-foreground">{10 + i}</p>
            </div>
          </div>
        ))}
      </div>
    </MockWindow>
  );
}

function HorarioAulas() {
  const aulas = [
    { hora: "07:30", materia: "Português", prof: "Ana" },
    { hora: "08:30", materia: "Matemática", prof: "Carlos" },
    { hora: "09:30", materia: "Ciências", prof: "Beatriz" },
    { hora: "10:30", materia: "História", prof: "Roberto" },
  ];
  return (
    <MockWindow title="Grade de Aulas">
      <p className="text-[7px] text-muted-foreground font-semibold mb-1">Segunda-feira – 1º Ano A</p>
      <div className="space-y-1">
        {aulas.map((a, i) => (
          <div key={i} className="flex items-center gap-1.5 px-1.5 py-1 rounded-lg bg-muted/40 text-[8px]">
            <Clock className="w-2.5 h-2.5 text-primary flex-shrink-0" />
            <span className="font-mono text-primary text-[7px]">{a.hora}</span>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground truncate">{a.materia}</p>
              <p className="text-[6px] text-muted-foreground">Prof. {a.prof}</p>
            </div>
          </div>
        ))}
      </div>
    </MockWindow>
  );
}

function RecadosFotos() {
  return (
    <MockWindow title="Recados com Fotos">
      <div className="space-y-1.5">
        <div className="rounded-lg border border-border p-1.5">
          <div className="flex items-center gap-1 mb-1">
            <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center">
              <GraduationCap className="w-2.5 h-2.5 text-primary" />
            </div>
            <p className="text-[8px] font-bold text-foreground">Prof. Ana Silva</p>
            <span className="text-[6px] text-muted-foreground ml-auto">10:30</span>
          </div>
          <p className="text-[7px] text-foreground mb-1">As crianças fizeram uma atividade de pintura hoje! 🎨</p>
          <div className="rounded bg-gradient-to-br from-yellow-100 to-orange-100 h-10 flex items-center justify-center">
            <ImageIcon className="w-4 h-4 text-orange-400" />
          </div>
        </div>
        <div className="rounded-lg border border-border p-1.5">
          <div className="flex items-center gap-1 mb-0.5">
            <div className="w-4 h-4 rounded-full bg-accent flex items-center justify-center">
              <Users className="w-2.5 h-2.5 text-foreground" />
            </div>
            <p className="text-[8px] font-bold text-foreground">Coord. Pedagógica</p>
          </div>
          <p className="text-[7px] text-foreground">Reunião de pais dia 20/06 às 19h.</p>
        </div>
      </div>
    </MockWindow>
  );
}

function BoletimEscolar() {
  const materias = [
    { nome: "Português", nota: 8.5 },
    { nome: "Matemática", nota: 9.0 },
    { nome: "Ciências", nota: 7.5 },
    { nome: "História", nota: 8.0 },
  ];
  return (
    <MockWindow title="Boletim Escolar">
      <div className="flex items-center gap-1 mb-1.5">
        <Baby className="w-3 h-3 text-primary" />
        <p className="text-[8px] font-bold text-foreground">Maria Luísa – 1º Tri</p>
      </div>
      <div className="space-y-1">
        {materias.map((m, i) => (
          <div key={i} className="flex items-center gap-1.5 text-[8px]">
            <span className="text-foreground flex-1 truncate">{m.nome}</span>
            <div className="w-12 bg-muted rounded-full h-1.5 overflow-hidden">
              <div className="h-full bg-primary rounded-full" style={{ width: `${m.nota * 10}%` }} />
            </div>
            <span className="font-bold text-primary w-5 text-right">{m.nota}</span>
          </div>
        ))}
      </div>
      <div className="mt-1.5 text-center">
        <p className="text-[7px] text-muted-foreground">Média geral</p>
        <p className="text-[14px] font-bold text-primary">8.3</p>
      </div>
    </MockWindow>
  );
}

/* ===== Main Export ===== */
const screenshotComponents = [
  { id: "dashboard-diretor", component: DashboardDiretor },
  { id: "dashboard-educador", component: DashboardEducador },
  { id: "dashboard-responsavel", component: DashboardResponsavel },
  { id: "cadastro-alunos", component: CadastroAlunos },
  { id: "cadastro-professores", component: CadastroProfessores },
  { id: "gestao-turmas", component: GestaoTurmas },
  { id: "calendario-semanal", component: CalendarioSemanal },
  { id: "horario-aulas", component: HorarioAulas },
  { id: "recados-fotos", component: RecadosFotos },
  { id: "boletim-escolar", component: BoletimEscolar },
];

export default function SystemScreenshots() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {screenshotComponents.map((s, i) => (
        <AnimCard key={s.id} i={i}>
          <s.component />
        </AnimCard>
      ))}
    </div>
  );
}
