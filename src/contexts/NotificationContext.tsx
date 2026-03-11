import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface NotificacaoDb {
  id: string;
  user_id: string;
  titulo: string;
  mensagem: string;
  tipo: string;
  lida: boolean;
  crianca_id: string | null;
  created_at: string;
}

interface NotificationContextType {
  notificacoes: NotificacaoDb[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotificacoes: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [notificacoes, setNotificacoes] = useState<NotificacaoDb[]>([]);

  const fetchNotificacoes = useCallback(async () => {
    if (!user) { setNotificacoes([]); return; }
    const { data } = await supabase
      .from('notificacoes')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);
    if (data) setNotificacoes(data as unknown as NotificacaoDb[]);
  }, [user]);

  useEffect(() => {
    fetchNotificacoes();
  }, [fetchNotificacoes]);

  // Realtime subscription
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('notificacoes-realtime')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notificacoes',
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        const newNotif = payload.new as unknown as NotificacaoDb;
        setNotificacoes(prev => [newNotif, ...prev]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const unreadCount = notificacoes.filter(n => !n.lida).length;

  const markAsRead = useCallback(async (id: string) => {
    setNotificacoes(prev => prev.map(n => n.id === id ? { ...n, lida: true } : n));
    await supabase.from('notificacoes').update({ lida: true } as any).eq('id', id);
  }, []);

  const markAllAsRead = useCallback(async () => {
    setNotificacoes(prev => prev.map(n => ({ ...n, lida: true })));
    if (!user) return;
    await supabase.from('notificacoes').update({ lida: true } as any).eq('user_id', user.id).eq('lida', false);
  }, [user]);

  const clearNotificacoes = useCallback(async () => {
    setNotificacoes([]);
    if (!user) return;
    await supabase.from('notificacoes').delete().eq('user_id', user.id);
  }, [user]);

  return (
    <NotificationContext.Provider value={{
      notificacoes, unreadCount, markAsRead, markAllAsRead, clearNotificacoes,
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within a NotificationProvider');
  return context;
}
