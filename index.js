 // index.js
// Servidor Express robusto com Helmet, Morgan, CORS configurável e compatibilidade Railway

const express = require('express');
const cors = require('cors');
const morgan = require('morgan'); // instalar: npm i morgan
const helmet = require('helmet'); // instalar: npm i helmet

const app = express();

/**
 * Configuração de CORS
 * Adicione a URL do seu frontend (o site) aqui para permitir a comunicação.
 */
const allowedOrigins = [
  'http://localhost:5173', // para desenvolvimento local
  // 'https://quantum-production-077b.up.railway.app/',
];

// Em desenvolvimento, se quiser permitir TODAS origens, defina allowAllOrigins = true
const allowAllOrigins = false;

const corsOptions = {
  origin: function (origin, callback) {
    // permitir requisições sem origin (curl, mobile apps, serviços back-to-back)
    if (!origin) return callback(null, true);
    if (allowAllOrigins) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) return callback(null, true);
    return callback(new Error('Origem não permitida pela política de CORS'), false);
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  credentials: true,
  optionsSuccessStatus: 204,
};

// Middlewares
try { app.use(helmet()); } catch (e) { console.warn('Instale helmet para segurança extra: npm i helmet'); }
try { app.use(morgan('combined')); } catch (e) { console.warn('Instale morgan para logs HTTP: npm i morgan'); }

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // garante resposta a preflight

app.use(express.json({ limit: '1mb' }));

// Simple request logger for perf
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - start;
    console.log(`${req.method} ${req.originalUrl} -> ${res.statusCode} (${ms}ms)`);
  });
  next();
});

/** Routes **/
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Servidor operacional.' });
});

app.post('/api/contacts/filter', (req, res) => {
  try {
    console.log('/api/contacts/filter body:', req.body);
    const filtered = [{ id: '1', name: 'Contato Filtrado', email: 'filtrado@email.com' }];
    return res.json({ success: true, filtered });
  } catch (err) {
    console.error('Erro em /api/contacts/filter:', err);
    return res.status(500).json({ success: false, error: 'Erro interno no servidor' });
  }
});

/** 404 handler **/
app.use((req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

/** Global error handler **/
app.use((err, req, res, next) => {
  console.error('Erro não tratado:', err && err.stack ? err.stack : err);
  if (err && err.message && err.message.includes('Origem não permitida')) {
    return res.status(403).json({ error: 'Erro de CORS: Origem não permitida.' });
  }
  res.status(500).json({ error: 'Erro interno no servidor' });
});

/** Export + Listen condicional para compatibilidade com serverless **/
module.exports = app;

const PORT = process.env.PORT || 3000;
if (require.main === module) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor rodando em http://0.0.0.0:${PORT}`);
  });
}