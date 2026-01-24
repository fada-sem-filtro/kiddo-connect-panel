import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Crianca, Educador, Evento, Recado, Turma } from '@/types';
import { 
  criancasData, 
  educadoresData, 
  eventosData, 
  recadosData, 
  turmas as turmasData 
} from '@/data/mockData';

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
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [turmas] = useState<Turma[]>(turmasData);
  const [criancas, setCriancas] = useState<Crianca[]>(criancasData);
  const [educadores, setEducadores] = useState<Educador[]>(educadoresData);
  const [eventos, setEventos] = useState<Evento[]>(eventosData);
  const [recados, setRecados] = useState<Recado[]>(recadosData);

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
