import { Bell, Check, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNotifications, NotificacaoDb } from '@/contexts/NotificationContext';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const typeIcons: Record<string, string> = {
  evento: '📅',
  recado: '💬',
  feriado: '🎉',
  sistema: '✨',
};

export function NotificationBell() {
  const { notificacoes, unreadCount, markAsRead, markAllAsRead, clearNotificacoes } = useNotifications();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative rounded-2xl hover:bg-primary/10 transition-all duration-300"
        >
          <Bell className="h-5 w-5 text-foreground" />
          {unreadCount > 0 && (
            <span className="notification-badge">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-80 p-0 rounded-2xl border-2 border-border bg-card shadow-lg" 
        align="end"
        sideOffset={8}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/50 rounded-t-2xl">
          <h3 className="font-bold text-foreground flex items-center gap-2">
            <span>🔔</span> Notificações
          </h3>
          <div className="flex gap-1">
            {unreadCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={markAllAsRead}
                className="h-7 px-2 text-xs rounded-xl hover:bg-primary/10"
              >
                <Check className="h-3 w-3 mr-1" />
                Ler todas
              </Button>
            )}
          </div>
        </div>
        
        <ScrollArea className="max-h-80">
          {notificacoes.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              <span className="text-3xl mb-2 block">🌸</span>
              <p className="text-sm">Nenhuma notificação</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notificacoes.map(notif => (
                <div 
                  key={notif.id}
                  onClick={() => markAsRead(notif.id)}
                  className={cn(
                    "p-3 cursor-pointer transition-all duration-200 hover:bg-muted/50",
                    !notif.lida && "bg-primary/5"
                  )}
                >
                  <div className="flex gap-3">
                    <span className="text-xl">{typeIcons[notif.tipo]}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={cn(
                          "text-sm truncate",
                          !notif.lida && "font-semibold"
                        )}>
                          {notif.titulo}
                        </p>
                        {!notif.lida && (
                          <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                        {notif.mensagem}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(notif.createdAt), { 
                          addSuffix: true, 
                          locale: ptBR 
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {notificacoes.length > 0 && (
          <div className="p-2 border-t border-border bg-muted/30 rounded-b-2xl">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearNotificacoes}
              className="w-full text-xs text-muted-foreground hover:text-destructive rounded-xl"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Limpar todas
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
