import { useState, useEffect, useRef } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Trash2, Edit, User, Phone, Save, X, Camera } from 'lucide-react';

interface AuthorizedPerson {
  id: string;
  nome: string;
  parentesco: string;
  telefone: string | null;
  foto_url: string | null;
  documento: string | null;
}

interface AuthorizedPickupsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  criancaId: string;
  criancaNome: string;
}

export function AuthorizedPickupsModal({ open, onOpenChange, criancaId, criancaNome }: AuthorizedPickupsModalProps) {
  const [persons, setPersons] = useState<AuthorizedPerson[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ nome: '', parentesco: '', telefone: '', documento: '' });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchPersons = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('authorized_pickups')
      .select('*')
      .eq('crianca_id', criancaId)
      .order('nome');
    if (data) setPersons(data);
    setLoading(false);
  };

  useEffect(() => {
    if (open && criancaId) fetchPersons();
  }, [open, criancaId]);

  const resetForm = () => {
    setForm({ nome: '', parentesco: '', telefone: '', documento: '' });
    setEditId(null);
    setShowForm(false);
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('A foto deve ter no máximo 5MB');
      return;
    }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const uploadPhoto = async (personId: string): Promise<string | null> => {
    if (!photoFile) return null;
    const ext = photoFile.name.split('.').pop();
    const path = `${criancaId}/${personId}.${ext}`;
    
    const { error } = await supabase.storage
      .from('authorized-pickups-photos')
      .upload(path, photoFile, { upsert: true });

    if (error) {
      console.error('Upload error:', error);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from('authorized-pickups-photos')
      .getPublicUrl(path);

    return urlData.publicUrl + '?t=' + Date.now();
  };

  const handleSave = async () => {
    if (!form.nome) {
      toast.error('Informe o nome');
      return;
    }

    setUploading(true);

    if (editId) {
      let foto_url: string | null | undefined = undefined;
      if (photoFile) {
        foto_url = await uploadPhoto(editId);
      }

      const updateData: any = {
        nome: form.nome,
        parentesco: form.parentesco || 'Outro',
        telefone: form.telefone || null,
        documento: form.documento || null,
      };
      if (foto_url !== undefined && foto_url !== null) {
        updateData.foto_url = foto_url;
      }

      const { error } = await supabase.from('authorized_pickups').update(updateData).eq('id', editId);
      if (error) toast.error('Erro ao atualizar');
      else toast.success('Atualizado!');
    } else {
      const { data: inserted, error } = await supabase.from('authorized_pickups').insert({
        crianca_id: criancaId,
        nome: form.nome,
        parentesco: form.parentesco || 'Outro',
        telefone: form.telefone || null,
        documento: form.documento || null,
      }).select('id').single();

      if (error) {
        toast.error('Erro ao cadastrar');
      } else if (inserted && photoFile) {
        const foto_url = await uploadPhoto(inserted.id);
        if (foto_url) {
          await supabase.from('authorized_pickups').update({ foto_url }).eq('id', inserted.id);
        }
        toast.success('Pessoa autorizada cadastrada!');
      } else {
        toast.success('Pessoa autorizada cadastrada!');
      }
    }

    setUploading(false);
    resetForm();
    fetchPersons();
  };

  const handleEdit = (p: AuthorizedPerson) => {
    setForm({ nome: p.nome, parentesco: p.parentesco, telefone: p.telefone || '', documento: p.documento || '' });
    setEditId(p.id);
    setShowForm(true);
    setPhotoFile(null);
    setPhotoPreview(p.foto_url || null);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('authorized_pickups').delete().eq('id', id);
    if (error) toast.error('Erro ao remover');
    else {
      toast.success('Removido!');
      fetchPersons();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg rounded-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            Pessoas autorizadas — {criancaNome}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {loading ? (
            <p className="text-sm text-muted-foreground text-center py-4">Carregando...</p>
          ) : persons.length === 0 && !showForm ? (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhuma pessoa autorizada cadastrada.</p>
          ) : (
            <div className="space-y-2">
              {persons.map((p) => (
                <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/30">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={p.foto_url || undefined} />
                    <AvatarFallback><User className="w-4 h-4" /></AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{p.nome}</p>
                    <p className="text-xs text-muted-foreground">{p.parentesco}</p>
                    {p.telefone && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Phone className="w-3 h-3" /> {p.telefone}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(p)}>
                      <Edit className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(p.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {showForm && (
            <div className="space-y-3 p-4 rounded-xl border border-primary/20 bg-primary/5">
              {/* Photo upload */}
              <div className="flex flex-col items-center gap-2">
                <div
                  className="relative cursor-pointer group"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Avatar className="w-20 h-20 border-2 border-dashed border-primary/40 group-hover:border-primary transition-colors">
                    <AvatarImage src={photoPreview || undefined} />
                    <AvatarFallback className="bg-primary/10">
                      <Camera className="w-6 h-6 text-primary" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="w-5 h-5 text-white" />
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">Clique para adicionar foto</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoChange}
                />
              </div>

              <div className="space-y-2">
                <Label>Nome *</Label>
                <Input value={form.nome} onChange={(e) => setForm(f => ({ ...f, nome: e.target.value }))} placeholder="Nome completo" />
              </div>
              <div className="space-y-2">
                <Label>Parentesco</Label>
                <Input value={form.parentesco} onChange={(e) => setForm(f => ({ ...f, parentesco: e.target.value }))} placeholder="Ex: Avó, Tio" />
              </div>
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input value={form.telefone} onChange={(e) => setForm(f => ({ ...f, telefone: e.target.value }))} placeholder="(00) 00000-0000" />
              </div>
              <div className="space-y-2">
                <Label>Documento (opcional)</Label>
                <Input value={form.documento} onChange={(e) => setForm(f => ({ ...f, documento: e.target.value }))} placeholder="RG ou CPF" />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" size="sm" onClick={resetForm}>
                  <X className="w-3.5 h-3.5 mr-1" /> Cancelar
                </Button>
                <Button size="sm" onClick={handleSave} disabled={uploading}>
                  <Save className="w-3.5 h-3.5 mr-1" /> {uploading ? 'Salvando...' : editId ? 'Salvar' : 'Cadastrar'}
                </Button>
              </div>
            </div>
          )}

          {!showForm && (
            <Button variant="outline" className="w-full" onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4 mr-2" /> Adicionar pessoa autorizada
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
