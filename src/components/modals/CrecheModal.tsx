import { useState, useEffect, useRef } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Upload, X } from 'lucide-react';

interface CrecheData {
  id?: string;
  nome: string;
  endereco: string | null;
  telefone: string | null;
  email: string | null;
  logo_url?: string | null;
  tipo_periodo?: string | null;
}

const TIPOS_PERIODO = [
  { value: 'mensal', label: 'Mensal' },
  { value: 'bimestral', label: 'Bimestral' },
  { value: 'trimestral', label: 'Trimestral' },
  { value: 'semestral', label: 'Semestral' },
  { value: 'anual', label: 'Anual' },
];

interface CrecheModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
  editData?: CrecheData | null;
}

export function CrecheModal({ open, onOpenChange, onSave, editData }: CrecheModalProps) {
  const [nome, setNome] = useState('');
  const [endereco, setEndereco] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [tipoPeriodo, setTipoPeriodo] = useState('bimestral');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editData) {
      setNome(editData.nome);
      setEndereco(editData.endereco || '');
      setTelefone(editData.telefone || '');
      setEmail(editData.email || '');
      setTipoPeriodo(editData.tipo_periodo || 'bimestral');
      setLogoUrl(editData.logo_url || null);
      setLogoPreview(editData.logo_url || null);
    } else {
      setNome('');
      setEndereco('');
      setTelefone('');
      setEmail('');
      setTipoPeriodo('bimestral');
      setLogoUrl(null);
      setLogoPreview(null);
    }
    setLogoFile(null);
  }, [editData, open]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Selecione uma imagem válida');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Imagem deve ter no máximo 2MB');
      return;
    }
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const removeLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    setLogoUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const uploadLogo = async (crecheId: string): Promise<string | null> => {
    if (!logoFile) return logoUrl;
    const ext = logoFile.name.split('.').pop();
    const path = `${crecheId}/logo.${ext}`;
    const { error } = await supabase.storage.from('creche-logos').upload(path, logoFile, { upsert: true });
    if (error) {
      console.error('Upload error:', error);
      return logoUrl;
    }
    const { data: urlData } = supabase.storage.from('creche-logos').getPublicUrl(path);
    return urlData.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }

    setSaving(true);
    const payload: Record<string, unknown> = {
      nome: nome.trim(),
      endereco: endereco.trim() || null,
      telefone: telefone.trim() || null,
      email: email.trim() || null,
    };

    let crecheId = editData?.id;

    if (editData?.id) {
      const newLogoUrl = await uploadLogo(editData.id);
      payload.logo_url = newLogoUrl;
      const { error } = await supabase.from('creches').update(payload as any).eq('id', editData.id);
      if (error) {
        setSaving(false);
        toast.error('Erro ao salvar escola');
        console.error(error);
        return;
      }
    } else {
      const { data, error } = await supabase.from('creches').insert(payload as any).select('id').single();
      if (error || !data) {
        setSaving(false);
        toast.error('Erro ao salvar escola');
        console.error(error);
        return;
      }
      crecheId = data.id;
      if (logoFile) {
        const newLogoUrl = await uploadLogo(data.id);
        if (newLogoUrl) {
          await supabase.from('creches').update({ logo_url: newLogoUrl }).eq('id', data.id);
        }
      }
    }

    setSaving(false);
    toast.success(editData?.id ? 'Escola atualizada!' : 'Escola cadastrada!');
    onSave();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editData?.id ? 'Editar Escola' : 'Nova Escola'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Logo upload */}
          <div className="space-y-2">
            <Label>Logo da Escola</Label>
            <div className="flex items-center gap-4">
              <Avatar className="w-20 h-20 border-2 border-border rounded-xl">
                <AvatarImage src={logoPreview || undefined} className="object-cover" />
                <AvatarFallback className="bg-muted text-muted-foreground text-xs rounded-xl">
                  {nome ? nome.substring(0, 2).toUpperCase() : 'LOGO'}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col gap-2">
                <Button type="button" variant="outline" size="sm" className="rounded-xl" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="w-4 h-4 mr-2" />
                  {logoPreview ? 'Trocar' : 'Enviar Logo'}
                </Button>
                {logoPreview && (
                  <Button type="button" variant="ghost" size="sm" className="rounded-xl text-destructive" onClick={removeLogo}>
                    <X className="w-4 h-4 mr-2" />
                    Remover
                  </Button>
                )}
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                <p className="text-xs text-muted-foreground">PNG, JPG até 2MB</p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="nome">Nome *</Label>
            <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome da escola" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="endereco">Endereço</Label>
            <Input id="endereco" value={endereco} onChange={(e) => setEndereco(e.target.value)} placeholder="Endereço completo" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone</Label>
              <Input id="telefone" value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="(00) 00000-0000" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="contato@escola.com" />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
