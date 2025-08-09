import fetch from 'node-fetch';

const BUCKPAY_TOKEN = process.env.BUCKPAY_TOKEN;
const SECRET_ACCESS_TOKEN = process.env.SECRET_ACCESS_TOKEN;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const token = req.headers['x-access-token'];
  if (token !== SECRET_ACCESS_TOKEN) {
    return res.status(401).json({ error: 'Acesso não autorizado' });
  }

  const { valor } = req.body;
  const centavos = Math.round(Number(valor));

  if (!centavos || centavos < 3000) {
    return res.status(400).json({ error: 'Valor mínimo R$ 30,00' });
  }

  try {
    const response = await fetch('https://api.realtechdev.com.br/v1/transactions', {
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

    const data = await response.json();

    if (!response.ok) {
      return res.status(500).json({ error: 'Erro da API BuckPay', detalhe: data });
    }

    return res.status(200).json({ data });

  } catch (err) {
    console.error('[ERRO]', err);
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
}
