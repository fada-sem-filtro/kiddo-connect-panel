import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Creche { id: string; nome: string; tipo_periodo?: string; }

/**
 * Hook + component for admin school selection.
 * For admin: shows a school selector and returns the selected school ID.
 * For other roles: returns the user's school ID directly.
 */
export function useAdminSchoolSelector() {
  const { role, userCreche } = useAuth();
  const [creches, setCreches] = useState<Creche[]>([]);
  const [selectedCrecheId, setSelectedCrecheId] = useState('');
  const [selectedCreche, setSelectedCreche] = useState<Creche | null>(null);

  useEffect(() => {
    if (role !== 'admin') return;
    supabase.from('creches').select('id, nome, tipo_periodo').order('nome')
      .then(({ data }) => setCreches((data as Creche[]) || []));
  }, [role]);

  useEffect(() => {
    if (role === 'admin') {
      setSelectedCreche(creches.find(c => c.id === selectedCrecheId) || null);
    }
  }, [selectedCrecheId, creches, role]);

  const effectiveCrecheId = role === 'admin' ? selectedCrecheId : userCreche?.id || '';
  const isAdmin = role === 'admin';

  return { effectiveCrecheId, selectedCrecheId, setSelectedCrecheId, creches, isAdmin, selectedCreche };
}

interface AdminSchoolSelectorProps {
  selectedCrecheId: string;
  setSelectedCrecheId: (id: string) => void;
  creches: { id: string; nome: string }[];
}

export function AdminSchoolSelector({ selectedCrecheId, setSelectedCrecheId, creches }: AdminSchoolSelectorProps) {
  return (
    <Card className="rounded-2xl border-2 border-border">
      <CardContent className="p-4">
        <div className="max-w-sm">
          <Label className="text-xs text-muted-foreground flex items-center gap-1">
            <Building2 className="w-3 h-3" /> Escola
          </Label>
          <Select value={selectedCrecheId} onValueChange={setSelectedCrecheId}>
            <SelectTrigger className="rounded-xl mt-1"><SelectValue placeholder="Selecione a escola" /></SelectTrigger>
            <SelectContent>
              {creches.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
