import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const authHeader = req.headers.get('Authorization')!;
    const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });
    
    const { data: { user: callingUser } } = await userClient.auth.getUser();
    if (!callingUser) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check admin, diretor, or secretaria role
    const { data: hasAdmin } = await userClient.rpc('has_role', {
      _user_id: callingUser.id,
      _role: 'admin',
    });

    const { data: hasDiretor } = await userClient.rpc('has_role', {
      _user_id: callingUser.id,
      _role: 'diretor',
    });

    const { data: hasSecretaria } = await userClient.rpc('has_role', {
      _user_id: callingUser.id,
      _role: 'secretaria',
    });

    if (!hasAdmin && !hasDiretor && !hasSecretaria) {
      return new Response(JSON.stringify({ error: 'Forbidden: admin, diretor or secretaria role required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { email, nome, telefone, role, creche_id } = await req.json();

    if (!email || !nome || !role) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Directors can only create educador or responsavel roles
    if (hasDiretor && !hasAdmin && !['educador', 'responsavel', 'aluno', 'secretaria'].includes(role)) {
      return new Response(JSON.stringify({ error: 'Directors can only create educador or responsavel users' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const defaultPassword = 'fleur@2026';

    // Create user with default password and must_change_password flag
    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password: defaultPassword,
      email_confirm: true,
      user_metadata: { nome, telefone, must_change_password: true },
    });

    if (createError) {
      return new Response(JSON.stringify({ error: createError.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Assign role
    const { error: roleError } = await adminClient
      .from('user_roles')
      .insert({ user_id: newUser.user.id, role });

    if (roleError) {
      return new Response(JSON.stringify({ error: roleError.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update profile with telefone if provided
    if (telefone) {
      await adminClient
        .from('profiles')
        .update({ telefone })
        .eq('user_id', newUser.user.id);
    }

    // Auto-link to creche if creche_id provided
    if (creche_id) {
      const { error: membroError } = await adminClient
        .from('creche_membros')
        .insert({ user_id: newUser.user.id, creche_id });

      if (membroError) {
        console.error('Error linking user to creche:', membroError.message);
      }
    }

    return new Response(JSON.stringify({ user: newUser.user }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
