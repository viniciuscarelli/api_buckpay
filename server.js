import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

const app = express();
const PORT = process.env.PORT || 3000;

// 🔐 Token fixo direto aqui
const BUCKPAY_TOKEN = 'sk_live_4486537a115bd35cbf6aa7d8b7e2f11b';
const SECRET_ACCESS_TOKEN = '12345seguro';

console.log('[DEBUG] CHAVE USADA:', BUCKPAY_TOKEN.slice(0, 8) + '...');

app.use(cors());
app.use(express.json());

app.post('/gerar-pix', async (req, res) => {
  const { valor } = req.body;
  const token = req.headers['x-access-token'];

  if (!token || token !== SECRET_ACCESS_TOKEN) {
    return res.status(401).json({ error: 'Acesso não autorizado' });
  }

  if (!valor || isNaN(valor)) {
    return res.status(400).json({ error: 'Valor inválido' });
  }

  const centavos = Math.round(parseFloat(valor) * 100);
  if (centavos < 3000) {
    return res.status(400).json({ error: 'Valor mínimo é R$ 30,00' });
  }

  try {
    const response = await fetch('https://api.realtechdev.com.br/v1/transactions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${BUCKPAY_TOKEN}`,
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
      console.error('[BUCKPAY] Erro da API:', data);
      return res.status(500).json({ error: 'Erro da API BuckPay', detalhe: data });
    }

    return res.status(200).json({ data });

  } catch (err) {
    console.error('[BUCKPAY] Erro interno:', err);
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
});

app.get('/', (req, res) => {
  res.send('✅ API BuckPay online');
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
