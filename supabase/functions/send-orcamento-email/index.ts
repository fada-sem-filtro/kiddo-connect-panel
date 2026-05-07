import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // --- AuthN/AuthZ: require a valid Supabase JWT belonging to an admin ---
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const authHeader = req.headers.get("Authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Unauthorized - Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const callingUserId = claimsData.claims.sub;
    const { data: hasAdmin } = await userClient.rpc("has_role", {
      _user_id: callingUserId,
      _role: "admin",
    });

    if (!hasAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden: admin role required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { to, subject, text, nome, conteudo } = await req.json();

    if (!to || !conteudo) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

    // If RESEND_API_KEY is available, send via Resend
    if (RESEND_API_KEY) {
      // HTML-escape user-supplied values to prevent HTML/script injection in outbound email
      const escapeHtml = (s: string) =>
        String(s)
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#39;");

      const safeNome = escapeHtml(nome || "Cliente");
      const safeConteudo = escapeHtml(conteudo);

      const htmlBody = `
  <div style="
    font-family: Arial, sans-serif;
    background-color: #f8fafc;
    padding: 32px 16px;
  ">

    <div style="
      max-width: 600px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 20px;
      overflow: hidden;
      border: 1px solid #eef2f7;
      box-shadow: 0 4px 20px rgba(15, 23, 42, 0.06);
    ">

      <!-- Header -->
      <div style="
        background: linear-gradient(135deg, #ffffff 0%, #fdf2f8 100%);
        padding: 28px 24px;
        text-align: center;
        border-bottom: 1px solid #f1f5f9;
      ">

        <div style="
          display: inline-flex;
          align-items: center;
          gap: 10px;
        ">

          <img 
            src="https://agendafleur.app/logo-fleur-2.webp"
            alt="Agenda Fleur"
            style="
              width: 32px;
              height: 32px;
              object-fit: contain;
            "
          />

          <h1 style="
            margin: 0;
            font-size: 24px;
            font-weight: 700;
            color: #0f172a;
            letter-spacing: -0.5px;
          ">
            Agenda Fleur
          </h1>

        </div>

      </div>

      <!-- Content -->
      <div style="padding: 32px 24px;">

        <p style="
          margin-top: 0;
          font-size: 16px;
          color: #334155;
          line-height: 1.6;
        ">
          Olá ${safeNome},
        </p>

        <div style="
          font-size: 15px;
          color: #475569;
          line-height: 1.8;
          white-space: pre-wrap;
        ">
          ${safeConteudo}
        </div>

        <!-- Divider -->
        <div style="
          height: 1px;
          background: #e2e8f0;
          margin: 32px 0 24px;
        "></div>

        <!-- Footer -->
        <p style="
          margin: 0;
          font-size: 13px;
          color: #94a3b8;
          line-height: 1.6;
        ">
          Atenciosamente,<br/>
          <strong style="color: #64748b;">Equipe Agenda Fleur</strong>
        </p>

      </div>

    </div>

  </div>
`;

      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "Agenda Fleur <contato@agendafleur.app>",
          to: [to],
          subject: subject || "Apresentação do Sistema Escolar - Agenda Fleur",
          html: htmlBody,
        }),
      });

      if (!res.ok) {
        const errData = await res.text();
        throw new Error(`Resend error: ${errData}`);
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fallback: log email (no email provider configured)
    console.log(`[EMAIL] To: ${to}, Subject: ${subject}`);
    console.log(`[EMAIL] Body: ${text}`);

    return new Response(JSON.stringify({ success: true, note: "Email logged (no provider configured)" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error sending email:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
