import { useState } from 'react';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface ChangePasswordModalProps {
  open: boolean;
  onSuccess: () => void;
}

export function ChangePasswordModal({ open, onSuccess }: ChangePasswordModalProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 6) {
      toast.error('A senha deve ter no mínimo 6 caracteres');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }

    setIsLoading(true);

    const { error: pwdError } = await supabase.auth.updateUser({ password });

    if (pwdError) {
      setIsLoading(false);
      const msg = pwdError.message || '';
      if (/different from the old password|same.*password/i.test(msg)) {
        toast.error('A nova senha deve ser diferente da senha atual.');
      } else if (/should be at least|at least \d+ characters/i.test(msg)) {
        toast.error('A senha não atende aos requisitos mínimos.');
      } else if (/weak|pwned|compromised/i.test(msg)) {
        toast.error('Esta senha é muito comum. Escolha uma senha mais forte.');
      } else {
        toast.error(`Erro ao alterar senha: ${msg}`);
      }
      return;
    }

    // Atualiza metadata separadamente para não falhar a troca de senha
    const { error: metaError } = await supabase.auth.updateUser({
      data: { must_change_password: false },
    });

    setIsLoading(false);

    if (metaError) {
      console.error('Erro ao atualizar metadata:', metaError);
    }

    toast.success('Senha alterada com sucesso! 🌸');
    onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="rounded-3xl" onPointerDownOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Lock className="w-5 h-5 text-primary" />
            Primeiro Acesso
          </DialogTitle>
          <DialogDescription>
            Por segurança, você precisa criar uma nova senha para continuar.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>Nova Senha *</Label>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                required
                minLength={6}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Confirmar Nova Senha *</Label>
            <div className="relative">
              <Input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repita a nova senha"
                required
                minLength={6}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                onClick={() => setShowConfirm(!showConfirm)}
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Salvando...' : 'Salvar Nova Senha'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
