// Types for the Fleur School Management System

export type EventType = 'ALIMENTACAO' | 'SONECA' | 'BRINCADEIRA' | 'ATIVIDADE' | 'HIGIENE' | 'MEDICAMENTO' | 'SAIDA' | 'OUTRO';

export type TipoRefeicao = 'lanche' | 'almoco';
export type ResultadoRefeicao = 'comeu_bem' | 'comeu_pouco' | 'parcial' | 'experimentou' | 'rejeitou';
export type TipoHigiene = 'banho' | 'xixi' | 'coco';

export const TIPO_REFEICAO_LABELS: Record<TipoRefeicao, string> = {
  lanche: 'Lanche',
  almoco: 'Almoço',
};

export const RESULTADO_REFEICAO_LABELS: Record<ResultadoRefeicao, string> = {
  comeu_bem: 'Comeu bem',
  comeu_pouco: 'Comeu pouco',
  parcial: 'Parcial',
  experimentou: 'Experimentou',
  rejeitou: 'Rejeitou',
};

export const TIPO_HIGIENE_LABELS: Record<TipoHigiene, string> = {
  banho: 'Banho',
  xixi: 'Xixi',
  coco: 'Cocô',
};

export const FAIXA_ETARIA_OPTIONS = [
  'Berçário (0 a 1 ano)',
  'Berçário II (1 a 2 anos)',
  'Maternal I (2 anos)',
  'Maternal II (3 anos)',
  'Pré I (4 anos)',
  'Pré II (5 anos)',
  '1º Ano (6 anos)',
  '2º Ano (7 anos)',
  '3º Ano (8 anos)',
  '4º Ano (9 anos)',
  '5º Ano (10 anos)',
];

export const FAIXAS_FUNDAMENTAL = FAIXA_ETARIA_OPTIONS.filter(f => f.includes('Ano'));

export function isTurmaFundamental(faixaEtaria: string | null | undefined): boolean {
  if (!faixaEtaria) return false;
  return FAIXAS_FUNDAMENTAL.includes(faixaEtaria);
}

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
  MEDICAMENTO: 'Medicamento',
  SAIDA: 'Saída',
  OUTRO: 'Outro',
};

export const EVENT_TYPE_ICONS: Record<EventType, string> = {
  ALIMENTACAO: '🍽️',
  SONECA: '🌙',
  BRINCADEIRA: '🎮',
  ATIVIDADE: '📚',
  HIGIENE: '🚿',
  MEDICAMENTO: '💊',
  SAIDA: '🚪',
  OUTRO: '📋',
};
