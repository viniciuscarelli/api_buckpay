export default {
  async fetch(request, env, ctx) {
    // ✅ Configuração
    const BUCKPAY_TOKEN = 'sk_live_4486537a115bd35cbf6aa7d8b7e2f11b';
    const SECRET_ACCESS_TOKEN = '12345seguro';

    // ✅ Permitir CORS sempre
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-access-token',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      });
    }

    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Método não permitido' }), {
        status: 405,
        headers: corsHeaders,
      });
    }

    // ✅ Verifica token
    const token = request.headers.get('x-access-token');
    if (!token || token !== SECRET_ACCESS_TOKEN) {
      return new Response(JSON.stringify({ error: 'Acesso não autorizado' }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    try {
      const body = await request.json();
      const { valor } = body;

      const centavos = Math.round(Number(valor));
      if (!valor || isNaN(centavos) || centavos < 3000) {
        return new Response(JSON.stringify({ error: 'Valor inválido ou abaixo do mínimo R$ 30,00' }), {
          status: 400,
          headers: corsHeaders,
        });
      }

      const buckpayResponse = await fetch('https://api.realtechdev.com.br/v1/transactions', {
        method: 'POST',
        headers: {
          'Authorization': `Token ${BUCKPAY_TOKEN}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          amount: centavos,
          external_id: `doacao_${Date.now()}`,
          payment_method: 'pix',
          description: `Doação R$ ${(centavos / 100).toFixed(2)}`
        })
      });

      const data = await buckpayResponse.json();

      if (!buckpayResponse.ok) {
        return new Response(JSON.stringify({ error: 'Erro da API BuckPay', detalhe: data }), {
          status: 500,
          headers: corsHeaders,
        });
      }

      return new Response(JSON.stringify({ data }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });

    } catch (err) {
      return new Response(JSON.stringify({ error: 'Erro interno', detalhe: err.message }), {
        status: 500,
        headers: corsHeaders,
      });
    }
  }
};
