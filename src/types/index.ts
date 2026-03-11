// Types for the Fleur School Management System

export type EventType = 'ALIMENTACAO' | 'SONECA' | 'BRINCADEIRA' | 'ATIVIDADE' | 'HIGIENE' | 'OUTRO';

export interface Responsavel {
  id: string;
  nome: string;
  telefone: string;
  email: string;
  parentesco: string;
}

export interface Crianca {
  id: string;
  nome: string;
  dataNascimento: string;
  turmaId: string;
  foto?: string;
  observacoes?: string;
  responsaveis: Responsavel[];
  createdAt: string;
}

export interface Turma {
  id: string;
  nome: string;
  descricao?: string;
  educadorId?: string;
}

export interface Educador {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  turmaIds: string[];
  foto?: string;
  createdAt: string;
}

export interface Evento {
  id: string;
  tipo: EventType;
  criancaId: string;
  observacao?: string;
  dataInicio: string;
  dataFim?: string;
  createdAt: string;
}

export interface Recado {
  id: string;
  titulo: string;
  conteudo: string;
  criancaId?: string;
  turmaId?: string;
  remetenteId: string;
  remetenteTipo: 'educador' | 'responsavel';
  parentId?: string; // For thread replies
  respostas?: Recado[];
  lido: boolean;
  createdAt: string;
  updatedAt: string;
}

// Feriado e Evento Futuro
export interface Feriado {
  id: string;
  nome: string;
  data: string;
  recorrente: boolean;
  createdAt: string;
}

export interface EventoFuturo {
  id: string;
  nome: string;
  descricao?: string;
  dataInicio: string;
  dataFim?: string;
  turmaId?: string; // undefined = todas as turmas
  createdAt: string;
}

// Notificação
export interface Notificacao {
  id: string;
  titulo: string;
  mensagem: string;
  tipo: 'evento' | 'recado' | 'feriado' | 'sistema';
  lida: boolean;
  criancaId?: string;
  createdAt: string;
}

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  ALIMENTACAO: 'Alimentação',
  SONECA: 'Soneca',
  BRINCADEIRA: 'Brincadeira',
  ATIVIDADE: 'Atividade',
  HIGIENE: 'Higiene',
  OUTRO: 'Outro',
};

export const EVENT_TYPE_ICONS: Record<EventType, string> = {
  ALIMENTACAO: '🍽️',
  SONECA: '🌙',
  BRINCADEIRA: '🎮',
  ATIVIDADE: '📚',
  HIGIENE: '🚿',
  OUTRO: '📋',
};
