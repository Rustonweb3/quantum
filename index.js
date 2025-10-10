 // ================================================
// 🧠 CÓDIGO DE TESTE - OPERAÇÃO CAVALO DE TROIA
// Express + CORS Blindado + Compatibilidade Railway/Vercel
// ================================================

console.log('🔥 index.js iniciado');
console.log('require.main é:', require.main);

const express = require('express');
const cors = require('cors');
const app = express();

// ======================================
// 🔰 CORS BLINDADO PARA RAILWAY / VERCEL
// ======================================
const corsOptions = {
  origin: '*', // pode restringir depois: ['https://seusite.com']
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204
};

// Middleware CORS padrão
app.use(cors(corsOptions));

// Middleware manual para interceptar preflights
app.options('*', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.status(204).end();
});

// Middleware auxiliar (garantia de header mesmo em erro)
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  next();
});

// ======================================
// 🔌 Middlewares essenciais
// ======================================
app.use(express.json());

// ======================================
// 🔍 Rotas de teste
// ======================================

// Rota de saúde
app.get('/api/health', (req, res) => {
  console.log('Rota /api/health chamada com sucesso.');
  res.json({ status: 'OK', message: 'Servidor de teste operacional.' });
});

// Rota simulada de contatos
app.get('/api/contacts', (req, res) => {
  console.log('Rota /api/contacts SIMULADA chamada com sucesso.');
  res.json([
    { id: '1', name: 'Contato de Teste 1', email: 'teste1@exemplo.com' },
    { id: '2', name: 'Contato de Teste 2', email: 'teste2@exemplo.com' },
  ]);
});

// Rota POST simulada para /api/contacts/filter
app.post('/api/contacts/filter', (req, res) => {
  console.log('POST /api/contacts/filter chamado com body:', req.body);
  res.json({
    success: true,
    filtered: [
      { id: '1', name: 'Contato Filtrado', email: 'filtrado@exemplo.com' }
    ]
  });
});

// ======================================
// ⚙️ Exportação e inicialização
// ======================================

// Exporta o app para ambientes serverless (Vercel/Railway)
module.exports = app;

console.log('🧠 require.main === module ?', require.main === module);

// Detecta ambiente serverless
const isServerless = process.env.RAILWAY_ENVIRONMENT || process.env.VERCEL;

// Inicialização local automática (somente se não estiver em deploy)
if (!isServerless && require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor ativo e escutando na porta ${PORT}`);
  });
}
