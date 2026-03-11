import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { Notificacao } from '@/types';

interface NotificationContextType {
  notificacoes: Notificacao[];
  unreadCount: number;
  addNotificacao: (notificacao: Omit<Notificacao, 'id' | 'createdAt' | 'lida'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotificacoes: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([
    {
      id: '1',
      titulo: 'Bem-vindo ao Fleur! 🌸',
      mensagem: 'Seu painel de gerenciamento está pronto para uso.',
      tipo: 'sistema',
      lida: false,
      createdAt: new Date().toISOString(),
    },
  ]);

  const unreadCount = notificacoes.filter(n => !n.lida).length;

  const addNotificacao = useCallback((notificacao: Omit<Notificacao, 'id' | 'createdAt' | 'lida'>) => {
    const newNotificacao: Notificacao = {
      ...notificacao,
      id: Date.now().toString(),
      lida: false,
      createdAt: new Date().toISOString(),
    };
    setNotificacoes(prev => [newNotificacao, ...prev]);
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotificacoes(prev => 
      prev.map(n => n.id === id ? { ...n, lida: true } : n)
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotificacoes(prev => prev.map(n => ({ ...n, lida: true })));
  }, []);

  const clearNotificacoes = useCallback(() => {
    setNotificacoes([]);
  }, []);

  return (
    <NotificationContext.Provider value={{
      notificacoes,
      unreadCount,
      addNotificacao,
      markAsRead,
      markAllAsRead,
      clearNotificacoes,
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
