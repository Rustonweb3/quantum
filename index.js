 // CÓDIGO DE TESTE - OPERAÇÃO CAVALO DE TROIA
const express = require('express');
const cors = require('cors');
const app = express();

// Trecho 1 - Aplicamos a política de CORS de forma ampla para o teste
app.use(cors());

// Trecho 2 - Habilitamos o parser de JSON
app.use(express.json());

// Trecho 3 - Rota de teste de saúde (existente)
app.get('/api/health', (req, res) => {
  console.log('Rota /api/health chamada com sucesso.');
  res.json({ status: 'OK', message: 'Servidor de teste operacional.' });
});

// Trecho 4 - Rota de contatos SIMULADA
app.get('/api/contacts', (req, res) => {
  console.log('Rota /api/contacts SIMULADA chamada com sucesso.');
  // Responde com dados falsos para simular sucesso
  res.json([
    { id: '1', name: 'Contato de Teste 1', email: 'teste1@exemplo.com' },
    { id: '2', name: 'Contato de Teste 2', email: 'teste2@exemplo.com' },
  ]);
});

// Trecho 5 - Exportando o app para ser usado pela Vercel
module.exports = app;