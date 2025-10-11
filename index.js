import express from 'express';
import morgan from 'morgan';
import helmet from 'helmet';
import pg from 'pg';

const app = express();

// Middlewares Essenciais (sem o CORS)
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- ROTAS DA API ---

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'UP', timestamp: new Date().toISOString() });
});

// A sua rota de filtro de contatos (mantida como está)
app.post('/api/contacts/filter', async (req, res) => {
    const filterObject = req.body;
    console.log("FILTRO RECEBIDO NO BACKEND:", filterObject);
    // A lógica do banco de dados para filtrar os contatos viria aqui.
    // Por enquanto, retornamos um resultado de exemplo.
    res.status(200).json([
        { id: 'contact1', email: 'exemplo1@email.com', tags: filterObject.tags?.$all || [] },
        { id: 'contact2', email: 'exemplo2@email.com', tags: filterObject.tags?.$all || [] }
    ]);
});

// Rota de exemplo para Landing Pages (mantida como está)
app.get('/api/landing-pages', async (req, res) => {
    res.status(200).json([
        { id: 'lp1', name: 'Landing Page de Exemplo 1' }
    ]);
});


// --- INICIALIZAÇÃO DO SERVIDOR ---
const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor soberano rodando com força total na porta ${PORT}`);
});

export default app;