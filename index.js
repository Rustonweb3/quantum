 // ================================================
// 🚀 SERVIDOR BACKEND - VERSÃO FINAL E DEFINITIVA
// Estrutura robusta, CORS configurável, Helmet, Morgan e compatibilidade com Railway
// ================================================

const express = require('express');
const cors = require('cors');
const morgan = require('morgan'); // Para logs HTTP detalhados
const helmet = require('helmet');   // Para headers de segurança

const app = express();

/**
 * ----------------------------------------------------
 * Configuração de CORS - Links Inseridos
 * ----------------------------------------------------
 */
const allowedOrigins = [
  'http://localhost:5173', // Correto: Permissão para o seu frontend rodar localmente.
  'https://quantum-production-077b.up.railway.app', // Adicionado conforme solicitado. (OBS: Esta é a URL do próprio backend).
  
  // IMPORTANTE: Quando o seu frontend for para o ar e tiver uma URL PÚBLICA,
  // ela precisará ser adicionada aqui para que o sistema funcione em produção.
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    }
    return callback(new Error('Origem não permitida pela política de CORS'), false);
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  credentials: true,
};

// --- Middlewares Essenciais ---
app.use(helmet());
app.use(morgan('combined'));
app.use(cors(corsOptions));
app.use(express.json({ limit: '1mb' }));

// --- Rotas da API ---
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Servidor operacional.' });
});

app.post('/api/contacts/filter', (req, res) => {
  try {
    const filtered = [{ id: '1', name: 'Contato Filtrado', email: 'filtrado@email.com' }];
    return res.status(200).json({ success: true, filtered });
  } catch (err) {
    console.error('Erro em /api/contacts/filter:', err);
    return res.status(500).json({ success: false, error: 'Erro interno no servidor' });
  }
});

// --- Tratamento de Erros ---
app.use((req, res, next) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

app.use((err, req, res, next) => {
  console.error('Erro não tratado:', err.stack);
  if (err.message.includes('política de CORS')) {
    return res.status(403).json({ error: 'Erro de CORS: A origem da requisição não é permitida.' });
  }
  res.status(500).json({ error: 'Erro interno no servidor' });
});

// ======================================
// --- Inicialização do Servidor (CORRIGIDO PARA RAILWAY) ---
// ======================================
const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor soberano (Final) ativo e escutando na porta ${PORT}`);
});

module.exports = app;