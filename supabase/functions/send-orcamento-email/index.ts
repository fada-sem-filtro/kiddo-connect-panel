import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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
      const htmlBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #F8BBD0, #F48FB1); padding: 20px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">🌸 Agenda Fleur</h1>
          </div>
          <div style="background: #ffffff; padding: 24px; border: 1px solid #f0f0f0; border-top: none; border-radius: 0 0 12px 12px;">
            <p style="font-size: 16px; color: #333;">Olá ${nome || 'Cliente'},</p>
            <div style="font-size: 14px; color: #555; line-height: 1.6; white-space: pre-wrap;">${conteudo}</div>
            <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
            <p style="font-size: 12px; color: #999;">Atenciosamente,<br/>Equipe Agenda Fleur</p>
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
          from: "Agenda Fleur <onboarding@resend.dev>",
          to: [to],
          subject: subject || "Resposta ao seu orçamento - Agenda Fleur",
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
