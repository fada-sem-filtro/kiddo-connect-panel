import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

interface Profile {
  id: string;
  user_id: string;
  nome: string;
  email: string;
  telefone: string | null;
  avatar_url: string | null;
}

interface UserCreche {
  id: string;
  nome: string;
  logo_url?: string | null;
  endereco?: string | null;
  telefone?: string | null;
  email?: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  role: AppRole | null;
  loading: boolean;
  userCreche: UserCreche | null;
  isDiretor: boolean;
  mustChangePassword: boolean;
  setMustChangePassword: (v: boolean) => void;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  updatePassword: (password: string) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [userCreche, setUserCreche] = useState<UserCreche | null>(null);
  const [mustChangePassword, setMustChangePassword] = useState(false);

  // isDiretor is now derived from role
  const isDiretor = role === 'diretor';

  const fetchUserData = async (userId: string) => {
    try {
      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (profileData) {
        // If user is inactive, sign them out immediately
        if (profileData.ativo === false) {
          await supabase.auth.signOut();
          setProfile(null);
          setRole(null);
          setUserCreche(null);
          return;
        }
        setProfile(profileData);
      }

      // Fetch role using security definer function
      const { data: roleData } = await supabase
        .rpc('get_user_role', { _user_id: userId });
      
      if (roleData) setRole(roleData);

      // Fetch creche membership
      const { data: membroData } = await supabase
        .from('creche_membros')
        .select('creche_id, creches(id, nome, logo_url, endereco, telefone, email)')
        .eq('user_id', userId)
        .limit(1)
        .maybeSingle();

      if (membroData && membroData.creches) {
        const creche = membroData.creches as unknown as { id: string; nome: string; logo_url: string | null; endereco: string | null; telefone: string | null; email: string | null };
        setUserCreche({
          id: creche.id,
          nome: creche.nome,
          logo_url: creche.logo_url,
          endereco: creche.endereco,
          telefone: creche.telefone,
          email: creche.email,
        });
      } else {
        setUserCreche(null);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          const meta = session.user.user_metadata;
          if (meta?.must_change_password) {
            setMustChangePassword(true);
          }
          setTimeout(() => fetchUserData(session.user.id), 0);
        } else {
          setProfile(null);
          setRole(null);
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserData(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error as Error | null };

    // Check if user is active
    if (data.user) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('ativo')
        .eq('user_id', data.user.id)
        .single();

      if (profileData && (profileData as any).ativo === false) {
        await supabase.auth.signOut();
        return { error: new Error('Sua conta está desabilitada. Entre em contato com a direção.') };
      }

      // Check must_change_password flag
      if (data.user.user_metadata?.must_change_password) {
        setMustChangePassword(true);
      }
    }

    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setRole(null);
    setUserCreche(null);
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { error: error as Error | null };
  };

  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    return { error: error as Error | null };
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, role, loading, userCreche, isDiretor, mustChangePassword, setMustChangePassword, signIn, signOut, resetPassword, updatePassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
