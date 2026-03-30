import { useState, useEffect } from 'react';
import { Plus, Trash2, UserPlus } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface ResponsavelEntry {
  nome: string;
  email: string;
  telefone: string;
  parentesco: string;
}

interface CriancaDbModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editData?: { id: string; nome: string; data_nascimento: string; turma_id: string; observacoes: string | null; email_aluno?: string | null } | null;
  turmas: { id: string; nome: string; creche_id: string }[];
  onSaved: () => void;
}

function calcAge(dateStr: string): number {
  if (!dateStr) return 0;
  const birth = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

export function CriancaDbModal({ open, onOpenChange, editData, turmas, onSaved }: CriancaDbModalProps) {
  const { userCreche } = useAuth();
  const [nome, setNome] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [turmaId, setTurmaId] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [emailAluno, setEmailAluno] = useState('');
  const [responsaveis, setResponsaveis] = useState<ResponsavelEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const showEmailAluno = calcAge(dataNascimento) >= 6;

  useEffect(() => {
    if (open) {
      if (editData) {
        setNome(editData.nome);
        setDataNascimento(editData.data_nascimento);
        setTurmaId(editData.turma_id);
        setObservacoes(editData.observacoes || '');
        setEmailAluno(editData.email_aluno || '');
        setResponsaveis([]);
      } else {
        setNome('');
        setDataNascimento('');
        setTurmaId('');
        setObservacoes('');
        setEmailAluno('');
        setResponsaveis([{ nome: '', email: '', telefone: '', parentesco: 'Mãe' }]);
      }
    }
  }, [editData, open]);

  const addResponsavel = () => {
    setResponsaveis(prev => [...prev, { nome: '', email: '', telefone: '', parentesco: 'Mãe' }]);
  };

  const removeResponsavel = (index: number) => {
    setResponsaveis(prev => prev.filter((_, i) => i !== index));
  };

  const updateResponsavel = (index: number, field: keyof ResponsavelEntry, value: string) => {
    setResponsaveis(prev => prev.map((r, i) => i === index ? { ...r, [field]: value } : r));
  };

  const findOrCreateUser = async (resp: ResponsavelEntry): Promise<string | null> => {
    // Try to find existing profile by email
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('email', resp.email)
      .maybeSingle();

    if (existingProfile) {
      return existingProfile.user_id;
    }

    // Create new user via edge function
    const { data, error } = await supabase.functions.invoke('create-user', {
      body: {
        email: resp.email,
        nome: resp.nome,
        telefone: resp.telefone || null,
        role: 'responsavel',
        creche_id: userCreche?.id || null,
      },
    });

    if (error || data?.error) {
      const msg = data?.error || error?.message || 'Erro ao criar responsável';
      toast.error(`Erro ao criar ${resp.nome}: ${msg}`);
      return null;
    }

    return data.user.id;
  };

  const createStudentAccount = async (criancaId: string, email: string, studentName: string) => {
    // Check if a profile with this email already exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('email', email)
      .maybeSingle();

    if (existingProfile) {
      // Link existing user
      await supabase.from('criancas').update({ user_id: existingProfile.user_id }).eq('id', criancaId);
      return;
    }

    // Get creche_id from the turma
    const selectedTurma = turmas.find(t => t.id === turmaId);
    const crecheId = selectedTurma?.creche_id || userCreche?.id || null;

    const { data, error } = await supabase.functions.invoke('create-user', {
      body: {
        email,
        nome: studentName,
        role: 'aluno',
        creche_id: crecheId,
      },
    });

    if (error || data?.error) {
      toast.error(`Erro ao criar conta do aluno: ${data?.error || error?.message}`);
      return;
    }

    // Link user_id to crianca
    await supabase.from('criancas').update({ user_id: data.user.id }).eq('id', criancaId);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome || !dataNascimento || !turmaId) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }

    // Validate responsáveis if adding new child
    if (!editData && responsaveis.length > 0) {
      const invalidResp = responsaveis.find(r => r.nome && !r.email);
      if (invalidResp) {
        toast.error('Preencha o email de todos os responsáveis');
        return;
      }
    }

    setLoading(true);

    try {
      const payload = {
        nome,
        data_nascimento: dataNascimento,
        turma_id: turmaId,
        observacoes: observacoes || null,
        email_aluno: showEmailAluno ? (emailAluno || null) : null,
      };

      let criancaId: string;

      if (editData) {
        const { error } = await supabase.from('criancas').update(payload).eq('id', editData.id);
        if (error) throw error;
        criancaId = editData.id;

        // If email_aluno was added/changed, create auth account if not yet linked
        if (showEmailAluno && emailAluno) {
          const { data: existing } = await supabase
            .from('criancas')
            .select('user_id')
            .eq('id', criancaId)
            .single();

          if (!existing?.user_id) {
            await createStudentAccount(criancaId, emailAluno, nome);
          }
        }

        toast.success('Aluno atualizado!');
      } else {
        const { data: newCrianca, error } = await supabase
          .from('criancas')
          .insert(payload)
          .select('id')
          .single();
        if (error) throw error;
        criancaId = newCrianca.id;

        // Create student auth account if email provided
        if (showEmailAluno && emailAluno) {
          await createStudentAccount(criancaId, emailAluno, nome);
        }

        // Process responsáveis - find or create each one
        const validResps = responsaveis.filter(r => r.nome && r.email);
        for (const resp of validResps) {
          const userId = await findOrCreateUser(resp);
          if (userId) {
            await supabase.from('crianca_responsaveis').insert({
              crianca_id: criancaId,
              responsavel_user_id: userId,
              parentesco: resp.parentesco,
            });
          }
        }

        toast.success('Aluno cadastrado com sucesso!');
      }

      onSaved();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar aluno');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{editData ? 'Editar Aluno' : 'Novo Aluno'}</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh] pr-4">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground">Dados do Aluno</h3>

              <div className="space-y-2">
                <Label>Nome *</Label>
                <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome completo" required />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Data de Nascimento *</Label>
                  <Input type="date" value={dataNascimento} onChange={(e) => setDataNascimento(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>Turma *</Label>
                  <Select value={turmaId} onValueChange={setTurmaId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a turma" />
                    </SelectTrigger>
                    <SelectContent>
                      {turmas.map((t) => (
                        <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Observações</Label>
                <Textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)} placeholder="Alergias, observações especiais..." />
              </div>

              {showEmailAluno && (
                <div className="space-y-2">
                  <Label>Email do Aluno</Label>
                  <Input type="email" value={emailAluno} onChange={(e) => setEmailAluno(e.target.value)} placeholder="email@exemplo.com" />
                  <p className="text-xs text-muted-foreground">Para alunos acima de 6 anos. Permite acesso ao sistema.</p>
                </div>
              )}
            </div>

            {!editData && (
              <>
                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-foreground">Responsáveis</h3>
                    <Button type="button" variant="outline" size="sm" onClick={addResponsavel}>
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar
                    </Button>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Se o responsável não existir no sistema, será criado automaticamente com acesso ao app.
                  </p>

                  {responsaveis.map((resp, index) => (
                    <div key={index} className="p-4 border border-border rounded-xl space-y-4 bg-muted/30">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                          <UserPlus className="w-3.5 h-3.5" />
                          Responsável {index + 1}
                        </span>
                        {responsaveis.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive h-8 w-8"
                            onClick={() => removeResponsavel(index)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-xs">Nome</Label>
                          <Input
                            value={resp.nome}
                            onChange={(e) => updateResponsavel(index, 'nome', e.target.value)}
                            placeholder="Nome completo"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Parentesco</Label>
                          <Select
                            value={resp.parentesco}
                            onValueChange={(v) => updateResponsavel(index, 'parentesco', v)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Mãe">Mãe</SelectItem>
                              <SelectItem value="Pai">Pai</SelectItem>
                              <SelectItem value="Avó">Avó</SelectItem>
                              <SelectItem value="Avô">Avô</SelectItem>
                              <SelectItem value="Tio(a)">Tio(a)</SelectItem>
                              <SelectItem value="Responsável">Responsável</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Email *</Label>
                          <Input
                            type="email"
                            value={resp.email}
                            onChange={(e) => updateResponsavel(index, 'email', e.target.value)}
                            placeholder="email@exemplo.com"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Telefone</Label>
                          <Input
                            value={resp.telefone}
                            onChange={(e) => updateResponsavel(index, 'telefone', e.target.value)}
                            placeholder="(00) 00000-0000"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Salvando...' : editData ? 'Salvar' : 'Cadastrar'}
              </Button>
            </div>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
