// Stub for future Google Indexing API integration. Currently logs the request
// so the admin UI can offer a "Solicitar indexação" button without requiring
// Google credentials yet. When credentials become available, plug them in here.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { url, type = 'URL_UPDATED' } = await req.json();
    if (!url || typeof url !== 'string') {
      return new Response(JSON.stringify({ error: 'url is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const hasCreds = !!Deno.env.get('GOOGLE_INDEXING_SA_JSON');

    if (!hasCreds) {
      console.log('[google-indexing-request] queued (no credentials configured):', { url, type });
      return new Response(JSON.stringify({
        ok: true,
        queued: true,
        message: 'Solicitação registrada. Configure as credenciais do Google para enviar à Indexing API.',
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Future: call https://indexing.googleapis.com/v3/urlNotifications:publish
    // with a service-account-derived OAuth token and { url, type } body.
    console.log('[google-indexing-request] would publish:', { url, type });
    return new Response(JSON.stringify({ ok: true, queued: false }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
