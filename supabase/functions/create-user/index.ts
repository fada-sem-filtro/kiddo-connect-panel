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

    // Check admin or diretor role
    const { data: hasAdmin } = await userClient.rpc('has_role', {
      _user_id: callingUser.id,
      _role: 'admin',
    });

    const { data: hasDiretor } = await userClient.rpc('has_role', {
      _user_id: callingUser.id,
      _role: 'diretor',
    });

    if (!hasAdmin && !hasDiretor) {
      return new Response(JSON.stringify({ error: 'Forbidden: admin or diretor role required' }), {
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
    if (hasDiretor && !hasAdmin && !['educador', 'responsavel'].includes(role)) {
      return new Response(JSON.stringify({ error: 'Directors can only create educador or responsavel users' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Fetch school name if creche_id is provided
    let schoolName: string | undefined;
    if (creche_id) {
      const { data: crecheData } = await adminClient
        .from('creches')
        .select('nome')
        .eq('id', creche_id)
        .single();
      schoolName = crecheData?.nome || undefined;
    }

    // Use inviteUserByEmail to trigger the invite email template via auth-email-hook
    const { data: newUser, error: createError } = await adminClient.auth.admin.inviteUserByEmail(
      email,
      {
        data: { nome, telefone, schoolName, userRole: role },
        redirectTo: 'https://agendafleur.app/reset-password',
      }
    );

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
