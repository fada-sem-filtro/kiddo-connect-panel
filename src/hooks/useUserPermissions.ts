import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface UserPermission {
  modulo: string;
  pode_visualizar: boolean;
  pode_criar: boolean;
  pode_editar: boolean;
  pode_excluir: boolean;
}

/**
 * Hook that loads the current user's permissions based on their role and school.
 * Admins bypass all permission checks.
 */
export function useUserPermissions() {
  const { role, userCreche } = useAuth();
  const [permissions, setPermissions] = useState<UserPermission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      // Admins bypass permission system
      if (role === 'admin' || !userCreche?.id || !role) {
        setPermissions([]);
        setLoading(false);
        return;
      }

      const perfil = role === 'diretor' ? 'diretor' : role;
      const { data } = await supabase
        .from('permissoes_perfil')
        .select('modulo, pode_visualizar, pode_criar, pode_editar, pode_excluir')
        .eq('creche_id', userCreche.id)
        .eq('perfil', perfil);

      setPermissions((data as UserPermission[]) || []);
      setLoading(false);
    };
    fetch();
  }, [role, userCreche?.id]);

  /**
   * Check if the user can view a specific module.
   * If no permission record exists for the module, defaults to true (visible).
   * Admins always return true.
   */
  const canView = useCallback((modulo: string): boolean => {
    if (role === 'admin') return true;
    if (permissions.length === 0) return true; // No permissions configured yet
    const perm = permissions.find(p => p.modulo === modulo);
    if (!perm) return false; // Module not in permission table = hidden (director must explicitly enable)
    return perm.pode_visualizar;
  }, [role, permissions]);

  const canCreate = useCallback((modulo: string): boolean => {
    if (role === 'admin') return true;
    if (permissions.length === 0) return true;
    const perm = permissions.find(p => p.modulo === modulo);
    if (!perm) return true;
    return perm.pode_criar;
  }, [role, permissions]);

  const canEdit = useCallback((modulo: string): boolean => {
    if (role === 'admin') return true;
    if (permissions.length === 0) return true;
    const perm = permissions.find(p => p.modulo === modulo);
    if (!perm) return true;
    return perm.pode_editar;
  }, [role, permissions]);

  const canDelete = useCallback((modulo: string): boolean => {
    if (role === 'admin') return true;
    if (permissions.length === 0) return true;
    const perm = permissions.find(p => p.modulo === modulo);
    if (!perm) return true;
    return perm.pode_excluir;
  }, [role, permissions]);

  return { permissions, loading, canView, canCreate, canEdit, canDelete };
}
