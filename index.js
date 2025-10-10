 // ================================================
// 🚀 SERVIDOR BACKEND - DIAGNÓSTICO FINAL
// Estrutura robusta com CORS, Helmet, Morgan e compatibilidade Railway
// ================================================

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');

const app = express();

// ----------------------------------------------------
// ⚙️ Configuração de CORS
// ----------------------------------------------------
const allowedOrigins = [
  'http://localhost:5173', // Frontend local
  'https://quantum-production-077b.up.railway.app', // Domínio oficial do backend (permitido)
  // 'https://seu-frontend-oficial.vercel.app', // Exemplo para produção
];

const corsOptions = {
  origin: function (origin, callback) {
    // Permite requests sem origem (curl, Postman, server-to-server)
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    console.warn(`🚫 Origem bloqueada pelo CORS: ${origin}`);
    return callback(new Error('Origem não permitida pela política de CORS'), false);
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  credentials: true,
};

// ----------------------------------------------------
// 🧱 Middlewares essenciais
// ----------------------------------------------------
app.use(helmet());
app.use(morgan('combined'));
app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // ✅ garante preflight em todas as rotas
app.use(express.json({ limit: '1mb' }));

// ----------------------------------------------------
// 🩺 Rotas principais da API
// ----------------------------------------------------
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Servidor operacional.' });
});

app.post('/api/contacts/filter', (req, res) => {
  try {
    console.log('📩 Body recebido:', req.body);
    const filtered = [
      { id: '1', name: 'Contato Filtrado', email: 'filtrado@email.com' }
    ];
    return res.status(200).json({ success: true, filtered });
  } catch (err) {
    console.error('❌ Erro em /api/contacts/filter:', err);
    return res.status(500).json({ success: false, error: 'Erro interno no servidor' });
  }
});

// ----------------------------------------------------
// 🧭 Diagnóstico: listar todas as rotas registradas
// ----------------------------------------------------
app.get('/api/routes', (req, res) => {
  try {
    const routes = [];
    app._router.stack.forEach(layer => {
      if (layer.route && layer.route.path) {
        const methods = Object.keys(layer.route.methods)
          .map(m => m.toUpperCase())
          .join(', ');
        routes.push({ path: layer.route.path, methods });
      }
    });
    res.json({ total: routes.length, routes });
  } catch (err) {
    console.error('Erro ao listar rotas:', err);
    res.status(500).json({ error: 'Erro ao listar rotas', detail: err.message });
  }
});

// ----------------------------------------------------
// 🪞 Diagnóstico extra: mostra headers e origem da requisição
// ----------------------------------------------------
app.all('/api/debug', (req, res) => {
  res.json({
    method: req.method,
    origin: req.headers.origin,
    headers: req.headers,
    body: req.body
  });
});

// ----------------------------------------------------
// 🚨 Tratamento de Erros e 404
// ----------------------------------------------------
app.use((req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

app.use((err, req, res, next) => {
  console.error('❌ Erro não tratado:', err.stack);
  if (err.message.includes('política de CORS')) {
    return res.status(403).json({ error: 'Erro de CORS: Origem não permitida.' });
  }
  res.status(500).json({ error: 'Erro interno no servidor' });
});

// ----------------------------------------------------
// 🧠 Inicialização compatível com Railway
// ----------------------------------------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor soberano ativo na porta ${PORT}`);
});

module.exports = app;
