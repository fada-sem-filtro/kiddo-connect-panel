import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as React from "npm:react@18.3.1";
import { renderAsync } from "npm:@react-email/components@0.0.22";
import { InviteEmail } from "../_shared/email-templates/invite.tsx";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SITE_NAME = "Agenda Fleur";
const FROM_DOMAIN = "agendafleur.app";
const SITE_URL = "https://agendafleur.app";

async function sendInviteEmail(params: {
  to: string;
  userName: string;
  userRole: string;
  schoolName?: string;
  schoolLogo?: string;
}) {
  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
  if (!RESEND_API_KEY) {
    console.error('RESEND_API_KEY not configured');
    return { ok: false, error: 'RESEND_API_KEY not configured' };
  }

  try {
    const html = await renderAsync(
      React.createElement(InviteEmail, {
        siteName: SITE_NAME,
        siteUrl: SITE_URL,
        confirmationUrl: SITE_URL,
        recipient: params.to,
        userName: params.userName,
        userRole: params.userRole,
        schoolName: params.schoolName,
        schoolLogo: params.schoolLogo,
      })
    );

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: `${SITE_NAME} <contato@${FROM_DOMAIN}>`,
        to: [params.to],
        subject: 'Você foi convidado(a) para a Agenda Fleur 🌸',
        html,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('Resend send failed:', errText);
      return { ok: false, error: errText };
    }
    return { ok: true };
  } catch (e) {
    console.error('Error rendering/sending invite email:', e);
    return { ok: false, error: (e as Error).message };
  }
}

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

    if ((hasDiretor || hasSecretaria) && !hasAdmin && !['educador', 'responsavel', 'aluno', 'secretaria'].includes(role)) {
      return new Response(JSON.stringify({ error: 'You can only create educador, responsavel, aluno or secretaria users' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Cross-tenant guard: non-admin callers may only create users in their own creche
    if (!hasAdmin && creche_id) {
      const { data: callerMemberships } = await userClient
        .from('creche_membros')
        .select('creche_id')
        .eq('user_id', callingUser.id);
      const allowed = (callerMemberships || []).some((m: any) => m.creche_id === creche_id);
      if (!allowed) {
        return new Response(JSON.stringify({ error: 'Forbidden: cannot create users in another school' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    if (!hasAdmin && !creche_id) {
      return new Response(JSON.stringify({ error: 'creche_id is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const defaultPassword = 'fleur@2026';

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

    const { error: roleError } = await adminClient
      .from('user_roles')
      .insert({ user_id: newUser.user.id, role });

    if (roleError) {
      return new Response(JSON.stringify({ error: roleError.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (telefone) {
      await adminClient
        .from('profiles')
        .update({ telefone })
        .eq('user_id', newUser.user.id);
    }

    let schoolName: string | undefined;
    let schoolLogo: string | undefined;

    if (creche_id) {
      const { error: membroError } = await adminClient
        .from('creche_membros')
        .insert({ user_id: newUser.user.id, creche_id });

      if (membroError) {
        console.error('Error linking user to creche:', membroError.message);
      }

      const { data: creche } = await adminClient
        .from('creches')
        .select('nome, logo_url')
        .eq('id', creche_id)
        .maybeSingle();
      if (creche) {
        schoolName = creche.nome;
        schoolLogo = creche.logo_url || undefined;
      }
    }

    // Enviar email de boas-vindas com dados de acesso
    const emailResult = await sendInviteEmail({
      to: email,
      userName: nome,
      userRole: role,
      schoolName,
      schoolLogo,
    });

    return new Response(JSON.stringify({ user: newUser.user, email_sent: emailResult.ok, email_error: emailResult.ok ? undefined : emailResult.error }), {
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
