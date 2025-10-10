 // ================================================
// 🚀 SERVIDOR BACKEND - VERSÃO FINAL CORRIGIDA
// Express + CORS Simplificado + Compatibilidade Railway
// ================================================

// --- Dependências ---
const express = require('express');
const cors = require('cors');
const app = express();

// ======================================
// --- Middlewares Essenciais ---
// ======================================

// 1. CORS Simplificado e Robusto
//    Permite requisições de qualquer origem.
app.use(cors());

// 2. Middleware para o Express entender JSON no corpo das requisições
app.use(express.json());

// ======================================
// --- Rotas da API ---
// ======================================

// Rota de saúde para verificar se o servidor está no ar
app.get('/api/health', (req, res) => {
  console.log('Rota /api/health chamada com sucesso.');
  res.json({ status: 'OK', message: 'Servidor operacional.' });
});

// Rota simulada de contatos (GET)
app.get('/api/contacts', (req, res) => {
  console.log('Rota GET /api/contacts SIMULADA chamada com sucesso.');
  res.json([
    { id: '1', name: 'Contato de Teste 1', email: 'teste1@exemplo.com' },
    { id: '2', name: 'Contato de Teste 2', email: 'teste2@exemplo.com' },
  ]);
});

// Rota POST simulada para filtrar contatos
app.post('/api/contacts/filter', (req, res) => {
  console.log('Rota POST /api/contacts/filter chamada com body:', req.body);
  res.json({
    success: true,
    filtered: [
      { id: '1', name: 'Contato Filtrado', email: 'filtrado@exemplo.com' }
    ]
  });
});

// ======================================
// --- Inicialização do Servidor ---
// ======================================

// Exporta o app para ambientes serverless como a Vercel (não prejudica o Railway)
module.exports = app;

// Define a porta - O Railway fornecerá a variável process.env.PORT
const PORT = process.env.PORT || 3000;

// Inicia o servidor e o faz "escutar" por conexões na porta definida.
// ESTA É A PARTE CRÍTICA QUE FOI CORRIGIDA.
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor ativo e escutando na porta ${PORT}`);
});