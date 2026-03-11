import { Turma, Crianca, Educador, Evento, Recado } from '@/types';

export const turmas: Turma[] = [
  { id: '1', nome: 'Berçário I', descricao: 'Crianças de 0 a 1 ano' },
  { id: '2', nome: 'Berçário II', descricao: 'Crianças de 1 a 2 anos' },
  { id: '3', nome: 'Maternal I', descricao: 'Crianças de 2 a 3 anos' },
  { id: '4', nome: 'Maternal II', descricao: 'Crianças de 3 a 4 anos' },
];

export const criancasData: Crianca[] = [
  {
    id: '1',
    nome: 'Maria Silva',
    dataNascimento: '2023-03-15',
    turmaId: '3',
    observacoes: 'Alergia a amendoim',
    responsaveis: [
      { id: '1', nome: 'Ana Silva', telefone: '(11) 99999-1111', email: 'ana@email.com', parentesco: 'Mãe' },
      { id: '2', nome: 'João Silva', telefone: '(11) 99999-2222', email: 'joao@email.com', parentesco: 'Pai' },
    ],
    createdAt: '2024-01-01',
  },
  {
    id: '2',
    nome: 'Pedro Santos',
    dataNascimento: '2023-06-20',
    turmaId: '3',
    responsaveis: [
      { id: '3', nome: 'Carla Santos', telefone: '(11) 99999-3333', email: 'carla@email.com', parentesco: 'Mãe' },
    ],
    createdAt: '2024-01-02',
  },
  {
    id: '3',
    nome: 'Lucas Oliveira',
    dataNascimento: '2022-11-10',
    turmaId: '4',
    observacoes: 'Precisa de atenção especial durante refeições',
    responsaveis: [
      { id: '4', nome: 'Fernanda Oliveira', telefone: '(11) 99999-4444', email: 'fernanda@email.com', parentesco: 'Mãe' },
    ],
    createdAt: '2024-01-03',
  },
];

export const educadoresData: Educador[] = [
  {
    id: '1',
    nome: 'Beatriz Costa',
    email: 'beatriz@fleur.com',
    telefone: '(11) 99999-5555',
    turmaId: '3',
    createdAt: '2024-01-01',
  },
  {
    id: '2',
    nome: 'Carolina Mendes',
    email: 'carolina@fleur.com',
    telefone: '(11) 99999-6666',
    turmaId: '4',
    createdAt: '2024-01-01',
  },
];

export const eventosData: Evento[] = [
  {
    id: '1',
    tipo: 'ALIMENTACAO',
    criancaId: '1',
    observacao: 'Almoçou bem e repetiu a refeição',
    dataInicio: '2026-01-24T08:30:00',
    dataFim: '2026-01-24T09:00:00',
    createdAt: '2026-01-24T08:30:00',
  },
  {
    id: '2',
    tipo: 'ALIMENTACAO',
    criancaId: '2',
    observacao: 'Almoçou bem e repetiu a refeição',
    dataInicio: '2026-01-24T08:30:00',
    dataFim: '2026-01-24T09:00:00',
    createdAt: '2026-01-24T08:30:00',
  },
  {
    id: '3',
    tipo: 'ALIMENTACAO',
    criancaId: '1',
    observacao: 'Comeu pouco no almoço',
    dataInicio: '2026-01-24T08:40:00',
    dataFim: '2026-01-24T09:10:00',
    createdAt: '2026-01-24T08:40:00',
  },
  {
    id: '4',
    tipo: 'ATIVIDADE',
    criancaId: '1',
    observacao: 'Participou das atividades pedagógicas',
    dataInicio: '2026-01-24T12:00:00',
    dataFim: '2026-01-24T13:00:00',
    createdAt: '2026-01-24T12:00:00',
  },
  {
    id: '5',
    tipo: 'SONECA',
    criancaId: '1',
    observacao: 'Dormiu tranquila por 2 horas',
    dataInicio: '2026-01-24T13:30:00',
    dataFim: '2026-01-24T15:30:00',
    createdAt: '2026-01-24T13:30:00',
  },
];

export const recadosData: Recado[] = [
  {
    id: '1',
    titulo: 'Lembrete: Reunião de Pais',
    conteudo: 'Lembramos que a reunião de pais será realizada no próximo sábado às 9h. Contamos com a presença de todos!',
    turmaId: '3',
    remetenteId: '1',
    remetenteTipo: 'educador',
    lido: false,
    createdAt: '2026-01-23T10:00:00',
    updatedAt: '2026-01-23T10:00:00',
    respostas: [
      {
        id: '2',
        titulo: '',
        conteudo: 'Obrigada pelo aviso! Estaremos presentes.',
        turmaId: '3',
        remetenteId: '1',
        remetenteTipo: 'responsavel',
        parentId: '1',
        lido: true,
        createdAt: '2026-01-23T11:30:00',
        updatedAt: '2026-01-23T11:30:00',
      },
    ],
  },
  {
    id: '3',
    titulo: 'Festa Junina',
    conteudo: 'Nossa festa junina será dia 15 de junho! Pedimos que as crianças venham caracterizadas.',
    turmaId: '3',
    remetenteId: '1',
    remetenteTipo: 'educador',
    lido: true,
    createdAt: '2026-01-22T14:00:00',
    updatedAt: '2026-01-22T14:00:00',
  },
];
