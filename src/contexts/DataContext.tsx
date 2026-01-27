import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { Crianca, Educador, Evento, Recado, Turma, Feriado, EventoFuturo } from '@/types';
import { 
  criancasData, 
  educadoresData, 
  eventosData, 
  recadosData, 
  turmas as turmasData 
} from '@/data/mockData';

// Hook para usar notificações (será injetado pelo App)
let notifyNewEvento: ((criancaNome: string, tipoEvento: string) => void) | null = null;

export function setNotifyCallback(callback: (criancaNome: string, tipoEvento: string) => void) {
  notifyNewEvento = callback;
}

interface DataContextType {
  // Turmas
  turmas: Turma[];
  
  // Crianças
  criancas: Crianca[];
  addCrianca: (crianca: Omit<Crianca, 'id' | 'createdAt'>) => void;
  updateCrianca: (id: string, crianca: Partial<Crianca>) => void;
  deleteCrianca: (id: string) => void;
  getCriancasByTurma: (turmaId: string) => Crianca[];
  
  // Educadores
  educadores: Educador[];
  addEducador: (educador: Omit<Educador, 'id' | 'createdAt'>) => void;
  updateEducador: (id: string, educador: Partial<Educador>) => void;
  deleteEducador: (id: string) => void;
  
  // Eventos
  eventos: Evento[];
  addEvento: (evento: Omit<Evento, 'id' | 'createdAt'>) => void;
  addEventoTurma: (turmaId: string, evento: Omit<Evento, 'id' | 'createdAt' | 'criancaId'>) => void;
  updateEvento: (id: string, evento: Partial<Evento>) => void;
  deleteEvento: (id: string) => void;
  getEventosByCrianca: (criancaId: string, date?: string) => Evento[];
  
  // Recados
  recados: Recado[];
  addRecado: (recado: Omit<Recado, 'id' | 'createdAt' | 'updatedAt' | 'lido' | 'respostas'>) => void;
  addRecadoTurma: (turmaId: string, recado: Omit<Recado, 'id' | 'createdAt' | 'updatedAt' | 'lido' | 'respostas' | 'turmaId'>) => void;
  updateRecado: (id: string, recado: Partial<Recado>) => void;
  deleteRecado: (id: string) => void;
  addResposta: (parentId: string, resposta: Omit<Recado, 'id' | 'createdAt' | 'updatedAt' | 'lido' | 'respostas' | 'parentId'>) => void;

  // Feriados
  feriados: Feriado[];
  addFeriado: (feriado: Omit<Feriado, 'id' | 'createdAt'>) => void;
  updateFeriado: (id: string, feriado: Partial<Feriado>) => void;
  deleteFeriado: (id: string) => void;

  // Eventos Futuros
  eventosFuturos: EventoFuturo[];
  addEventoFuturo: (evento: Omit<EventoFuturo, 'id' | 'createdAt'>) => void;
  updateEventoFuturo: (id: string, evento: Partial<EventoFuturo>) => void;
  deleteEventoFuturo: (id: string) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// Mock data for feriados and eventos futuros
const feriadosData: Feriado[] = [
  { id: '1', nome: 'Carnaval', data: '2026-02-17', recorrente: true, createdAt: '2024-01-01' },
  { id: '2', nome: 'Páscoa', data: '2026-04-05', recorrente: true, createdAt: '2024-01-01' },
  { id: '3', nome: 'Dia das Crianças', data: '2026-10-12', recorrente: true, createdAt: '2024-01-01' },
];

const eventosFuturosData: EventoFuturo[] = [
  { id: '1', nome: 'Festa Junina', descricao: 'Festa tradicional com danças e comidas típicas', dataInicio: '2026-06-15', createdAt: '2024-01-01' },
  { id: '2', nome: 'Reunião de Pais', descricao: 'Reunião semestral com os responsáveis', dataInicio: '2026-02-20', turmaId: '3', createdAt: '2024-01-01' },
];

export function DataProvider({ children }: { children: ReactNode }) {
  const [turmas] = useState<Turma[]>(turmasData);
  const [criancas, setCriancas] = useState<Crianca[]>(criancasData);
  const [educadores, setEducadores] = useState<Educador[]>(educadoresData);
  const [eventos, setEventos] = useState<Evento[]>(eventosData);
  const [recados, setRecados] = useState<Recado[]>(recadosData);
  const [feriados, setFeriados] = useState<Feriado[]>(feriadosData);
  const [eventosFuturos, setEventosFuturos] = useState<EventoFuturo[]>(eventosFuturosData);

  // Crianças
  const addCrianca = (crianca: Omit<Crianca, 'id' | 'createdAt'>) => {
    const newCrianca: Crianca = {
      ...crianca,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    setCriancas(prev => [...prev, newCrianca]);
  };

  const updateCrianca = (id: string, crianca: Partial<Crianca>) => {
    setCriancas(prev => prev.map(c => c.id === id ? { ...c, ...crianca } : c));
  };

  const deleteCrianca = (id: string) => {
    setCriancas(prev => prev.filter(c => c.id !== id));
  };

  const getCriancasByTurma = (turmaId: string) => {
    return criancas.filter(c => c.turmaId === turmaId);
  };

  // Educadores
  const addEducador = (educador: Omit<Educador, 'id' | 'createdAt'>) => {
    const newEducador: Educador = {
      ...educador,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    setEducadores(prev => [...prev, newEducador]);
  };

  const updateEducador = (id: string, educador: Partial<Educador>) => {
    setEducadores(prev => prev.map(e => e.id === id ? { ...e, ...educador } : e));
  };

  const deleteEducador = (id: string) => {
    setEducadores(prev => prev.filter(e => e.id !== id));
  };

  // Eventos
  const addEvento = (evento: Omit<Evento, 'id' | 'createdAt'>) => {
    const newEvento: Evento = {
      ...evento,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    setEventos(prev => [...prev, newEvento]);
    
    // Notificar responsável
    const crianca = criancas.find(c => c.id === evento.criancaId);
    if (crianca && notifyNewEvento) {
      notifyNewEvento(crianca.nome, evento.tipo);
    }
  };

  const addEventoTurma = (turmaId: string, evento: Omit<Evento, 'id' | 'createdAt' | 'criancaId'>) => {
    const criancasDaTurma = getCriancasByTurma(turmaId);
    const novosEventos = criancasDaTurma.map(crianca => ({
      ...evento,
      id: `${Date.now()}-${crianca.id}`,
      criancaId: crianca.id,
      createdAt: new Date().toISOString(),
    }));
    setEventos(prev => [...prev, ...novosEventos]);

    // Notificar sobre evento da turma
    const turma = turmas.find(t => t.id === turmaId);
    if (turma && notifyNewEvento) {
      notifyNewEvento(`Turma ${turma.nome}`, evento.tipo);
    }
  };

  const updateEvento = (id: string, evento: Partial<Evento>) => {
    setEventos(prev => prev.map(e => e.id === id ? { ...e, ...evento } : e));
  };

  const deleteEvento = (id: string) => {
    setEventos(prev => prev.filter(e => e.id !== id));
  };

  const getEventosByCrianca = (criancaId: string, date?: string) => {
    return eventos.filter(e => {
      const matchesCrianca = e.criancaId === criancaId;
      if (!date) return matchesCrianca;
      const eventDate = new Date(e.dataInicio).toDateString();
      const targetDate = new Date(date).toDateString();
      return matchesCrianca && eventDate === targetDate;
    });
  };

  // Feriados
  const addFeriado = (feriado: Omit<Feriado, 'id' | 'createdAt'>) => {
    const newFeriado: Feriado = {
      ...feriado,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    setFeriados(prev => [...prev, newFeriado]);
  };

  const updateFeriado = (id: string, feriado: Partial<Feriado>) => {
    setFeriados(prev => prev.map(f => f.id === id ? { ...f, ...feriado } : f));
  };

  const deleteFeriado = (id: string) => {
    setFeriados(prev => prev.filter(f => f.id !== id));
  };

  // Eventos Futuros
  const addEventoFuturo = (evento: Omit<EventoFuturo, 'id' | 'createdAt'>) => {
    const newEvento: EventoFuturo = {
      ...evento,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    setEventosFuturos(prev => [...prev, newEvento]);
  };

  const updateEventoFuturo = (id: string, evento: Partial<EventoFuturo>) => {
    setEventosFuturos(prev => prev.map(e => e.id === id ? { ...e, ...evento } : e));
  };

  const deleteEventoFuturo = (id: string) => {
    setEventosFuturos(prev => prev.filter(e => e.id !== id));
  };

  // Recados
  const addRecado = (recado: Omit<Recado, 'id' | 'createdAt' | 'updatedAt' | 'lido' | 'respostas'>) => {
    const newRecado: Recado = {
      ...recado,
      id: Date.now().toString(),
      lido: false,
      respostas: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setRecados(prev => [...prev, newRecado]);
  };

  const addRecadoTurma = (turmaId: string, recado: Omit<Recado, 'id' | 'createdAt' | 'updatedAt' | 'lido' | 'respostas' | 'turmaId'>) => {
    const newRecado: Recado = {
      ...recado,
      id: Date.now().toString(),
      turmaId,
      lido: false,
      respostas: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setRecados(prev => [...prev, newRecado]);
  };

  const updateRecado = (id: string, recado: Partial<Recado>) => {
    setRecados(prev => prev.map(r => {
      if (r.id === id) {
        return { ...r, ...recado, updatedAt: new Date().toISOString() };
      }
      // Check in respostas
      if (r.respostas) {
        return {
          ...r,
          respostas: r.respostas.map(resp => 
            resp.id === id ? { ...resp, ...recado, updatedAt: new Date().toISOString() } : resp
          ),
        };
      }
      return r;
    }));
  };

  const deleteRecado = (id: string) => {
    setRecados(prev => prev.filter(r => r.id !== id).map(r => ({
      ...r,
      respostas: r.respostas?.filter(resp => resp.id !== id),
    })));
  };

  const addResposta = (parentId: string, resposta: Omit<Recado, 'id' | 'createdAt' | 'updatedAt' | 'lido' | 'respostas' | 'parentId'>) => {
    const newResposta: Recado = {
      ...resposta,
      id: Date.now().toString(),
      parentId,
      lido: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setRecados(prev => prev.map(r => {
      if (r.id === parentId) {
        return {
          ...r,
          respostas: [...(r.respostas || []), newResposta],
        };
      }
      return r;
    }));
  };

  return (
    <DataContext.Provider value={{
      turmas,
      criancas,
      addCrianca,
      updateCrianca,
      deleteCrianca,
      getCriancasByTurma,
      educadores,
      addEducador,
      updateEducador,
      deleteEducador,
      eventos,
      addEvento,
      addEventoTurma,
      updateEvento,
      deleteEvento,
      getEventosByCrianca,
      recados,
      addRecado,
      addRecadoTurma,
      updateRecado,
      deleteRecado,
      addResposta,
      feriados,
      addFeriado,
      updateFeriado,
      deleteFeriado,
      eventosFuturos,
      addEventoFuturo,
      updateEventoFuturo,
      deleteEventoFuturo,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
