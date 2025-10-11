import express from 'express';
import morgan from 'morgan';
import helmet from 'helmet';
import pg from 'pg';

const app = express();

// --- REFORÇO DE MIDDLEWARES ---
// Garantir que estes middlewares sejam os primeiros a serem executados.
app.use(helmet());
app.use(morgan('dev'));
// A linha mais importante: garantir que o "desempacotador" de JSON esteja pronto.
app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));

// --- ROTAS DA API ---

// Rota de Health Check para acordar o servidor
app.get('/api/health', (req, res) => {
  console.log("Health check recebido com sucesso.");
  res.status(200).json({ status: 'UP', timestamp: new Date().toISOString() });
});

// Rota para filtrar contatos
app.post('/api/contacts/filter', async (req, res) => {
    try {
        const filterObject = req.body;
        console.log("FILTRO RECEBIDO NO BACKEND:", filterObject);
        
        // Simulação de resposta bem-sucedida
        const mockResponse = [
            { id: 'contact1', email: 'exemplo1@email.com', tags: filterObject?.tags?.$all || [] },
            { id: 'contact2', email: 'exemplo2@email.com', tags: filterObject?.tags?.$all || [] }
        ];
        
        res.status(200).json(mockResponse);

    } catch (error) {
        console.error("ERRO na rota /api/contacts/filter:", error);
        res.status(500).json({ error: "Erro interno no servidor ao processar o filtro." });
    }
});

// Rota de exemplo para Landing Pages
app.get('/api/landing-pages', async (req, res) => {
    try {
        res.status(200).json([
            { id: 'lp1', name: 'Landing Page de Exemplo 1' }
        ]);
    } catch (error) {
         console.error("ERRO na rota /api/landing-pages:", error);
        res.status(500).json({ error: "Erro interno no servidor." });
    }
});

// Rota para capturar todas as outras chamadas de API não encontradas
app.all('/api/*', (req, res) => {
    res.status(404).json({ error: `Rota da API não encontrada: ${req.method} ${req.path}` });
});


// --- INICIALIZAÇÃO DO SERVIDOR ---
// Usar a porta que o Render fornece ou 3001 como padrão.
const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor soberano rodando com força total na porta ${PORT}`);
});

export default app;