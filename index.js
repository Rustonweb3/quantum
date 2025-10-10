 // ================================================
// 🚀 SERVIDOR BACKEND - VERSÃO ARSENAL COMPLETO
// Estrutura robusta com Helmet, Morgan, CORS configurável e compatibilidade com Railway
// ================================================

const express = require('express');
const cors = require('cors');
const morgan = require('morgan'); // Para logs HTTP detalhados
const helmet = require('helmet');   // Para headers de segurança

const app = express();

/**
 * ----------------------------------------------------
 * IMPORTANTE: Configuração de CORS
 * Adicione a URL do seu frontend (o site) aqui para permitir a comunicação.
 * ----------------------------------------------------
 */
const allowedOrigins = [
  'http://localhost:5173', // Para seu teste local
  // 'https://quantum-production-077b.up.railway.app/ // <== COLOQUE A URL DO SEU FRONTEND AQUI
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

// 1. Helmet: Adiciona uma camada de segurança ao configurar vários headers HTTP
app.use(helmet());

// 2. Morgan: Faz o log de cada requisição que chega ao servidor no console
app.use(morgan('combined'));

// 3. CORS: Aplica a política de CORS que definimos acima
app.use(cors(corsOptions));

// 4. JSON Parser: Habilita o servidor a entender requisições com corpo em formato JSON
app.use(express.json({ limit: '1mb' }));


// --- Rotas da API (mantendo seus links) ---

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Servidor operacional.' });
});

app.post('/api/contacts/filter', (req, res) => {
  try {
    // A lógica de filtro do banco de dados virá aqui
    const filtered = [
      { id: '1', name: 'Contato Filtrado', email: 'filtrado@email.com' },
    ];
    return res.status(200).json({ success: true, filtered });
  } catch (err) {
    console.error('Erro em /api/contacts/filter:', err);
    return res.status(500).json({ success: false, error: 'Erro interno no servidor' });
  }
});


// --- Tratamento de Erros (Handlers) ---

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
// --- Inicialização do Servidor ---
// Correção para Railway: app.listen é chamado sem condições.
// ======================================

const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor soberano (Arsenal Completo) ativo e escutando na porta ${PORT}`);
});

module.exports = app;