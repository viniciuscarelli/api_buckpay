import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

// Log parcial da chave para debug (seguro)
console.log('[DEBUG] BUCKPAY_TOKEN:', process.env.BUCKPAY_TOKEN?.slice(0, 8) + '...');

// Libera CORS para qualquer origem
app.use(cors({
  origin: '*',
  methods: ['POST'],
  allowedHeaders: ['Content-Type', 'x-access-token']
}));

app.use(express.json());

// Rota de geração do PIX
app.post('/gerar-pix', async (req, res) => {
  const { valor } = req.body;
  const tokenRecebido = req.headers['x-access-token'];
  const tokenEsperado = process.env.SECRET_ACCESS_TOKEN || '12345seguro'; // padrão fallback

  if (!tokenRecebido || tokenRecebido !== tokenEsperado) {
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
        'Authorization': `Token ${process.env.BUCKPAY_TOKEN || 'sk_live_4486537a115bd35cbf6aa7d8b7e2f11b'}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        amount: centavos,
        external_id: `doacao_${Date.now()}`,
        payment_method: 'pix',
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[BUCKPAY] Erro da API:', data);
      return res.status(500).json({ error: 'Erro da API BuckPay', detalhe: data });
    }

    res.status(200).json({ data });

  } catch (err) {
    console.error('[BUCKPAY] Erro interno:', err);
    res.status(500).json({ error: 'Erro interno no servidor' });
  }
});

// Página raiz
app.get('/', (req, res) => {
  res.send('✅ API BuckPay online');
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
