export default async function handler(req, res) {
  // ✅ Cabeçalhos CORS seguros
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-access-token');

  // ✅ Pré-flight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const BUCKPAY_TOKEN = 'sk_live_4486537a115bd35cbf6aa7d8b7e2f11b';
    const SECRET_ACCESS_TOKEN = '12345seguro';

    const token = req.headers['x-access-token'];
    if (!token || token !== SECRET_ACCESS_TOKEN) {
      return res.status(401).json({ error: 'Acesso não autorizado' });
    }

    const { valor } = req.body;
    if (!valor || isNaN(valor)) {
      return res.status(400).json({ error: 'Valor inválido' });
    }

    const centavos = Math.round(Number(valor));
    if (centavos < 3000) {
      return res.status(400).json({ error: 'Valor mínimo é R$ 30,00' });
    }

    // ✅ Fetch usando native fetch da Vercel (sem dependência externa)
    const apiResponse = await fetch('https://api.realtechdev.com.br/v1/transactions', {
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

    const data = await apiResponse.json();

    if (!apiResponse.ok) {
      console.error('[BUCKPAY] Erro da API:', data);
      return res.status(500).json({ error: 'Erro da API BuckPay', detalhe: data });
    }

    return res.status(200).json({ data });

  } catch (error) {
    console.error('[BUCKPAY] Erro interno:', error);
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
}
