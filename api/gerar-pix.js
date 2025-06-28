export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-access-token');

  if (req.method === 'OPTIONS') {
    return res.status(200).end(); // pré-flight CORS
  }

  // ... (restante do código segue aqui)

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const token = req.headers['x-access-token'];
  const tokenCorreto = process.env.SECRET_ACCESS_TOKEN;

  if (!token || token !== tokenCorreto) {
    return res.status(401).json({ error: 'Acesso não autorizado' });
  }

  const { valor } = req.body;
  if (!valor || isNaN(valor)) {
    return res.status(400).json({ error: 'Valor inválido' });
  }

  const centavos = Math.round(parseFloat(valor) * 100);
  if (centavos < 50000) {
    return res.status(400).json({ error: 'Valor mínimo para BuckPay é R$ 500,00' });
  }

  try {
    const response = await fetch('https://api.realtechdev.com.br/v1/transactions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${process.env.BUCKPAY_TOKEN}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        amount: centavos,
        external_id: `doacao_${Date.now()}`,
        payment_method: 'pix',
        description: `Doação R$ ${valor}`
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(500).json({ error: 'Erro da API BuckPay', detalhe: data });
    }

    return res.json({ data });
  } catch (err) {
    console.error('[BUCKPAY] Erro interno:', err);
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
}
