import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface SuporteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SuporteModal({ open, onOpenChange }: SuporteModalProps) {
  const { user, profile } = useAuth();
  const [assunto, setAssunto] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;

    if (!assunto.trim() || !mensagem.trim()) {
      toast.error('Preencha todos os campos');
      return;
    }

    setSending(true);
    const { error } = await supabase.from('suporte_mensagens').insert({
      user_id: user.id,
      nome: profile.nome,
      email: profile.email,
      assunto: assunto.trim(),
      mensagem: mensagem.trim(),
    });
    setSending(false);

    if (error) {
      toast.error('Erro ao enviar mensagem');
      return;
    }

    toast.success('Mensagem enviada com sucesso! Responderemos em breve. 🌸');
    setAssunto('');
    setMensagem('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg">Suporte</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Envie sua dúvida ou solicitação para nossa equipe.
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Nome</Label>
            <Input value={profile?.nome || ''} disabled className="bg-muted" />
          </div>
          <div className="space-y-2">
            <Label>E-mail</Label>
            <Input value={profile?.email || ''} disabled className="bg-muted" />
          </div>
          <div className="space-y-2">
            <Label>Assunto</Label>
            <Input
              value={assunto}
              onChange={e => setAssunto(e.target.value)}
              placeholder="Ex: Dúvida sobre funcionalidade"
              required
              maxLength={200}
            />
          </div>
          <div className="space-y-2">
            <Label>Mensagem</Label>
            <Textarea
              value={mensagem}
              onChange={e => setMensagem(e.target.value)}
              placeholder="Descreva sua dúvida ou solicitação..."
              required
              maxLength={2000}
              rows={4}
            />
          </div>
          <Button type="submit" disabled={sending} className="w-full rounded-xl gap-2">
            <Send className="w-4 h-4" />
            {sending ? 'Enviando...' : 'Enviar Mensagem'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
