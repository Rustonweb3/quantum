import express from 'express';
import morgan from 'morgan';
import helmet from 'helmet';
import pg from 'pg';

const app = express();

app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (req, res) => {
  console.log("Health check recebido com sucesso.");
  res.status(200).json({ status: 'UP', timestamp: new Date().toISOString() });
});

app.post('/api/contacts/filter', async (req, res) => {
    try {
        const filterObject = req.body;
        console.log("ROTA CORRETA: Filtro recebido no backend via POST:", filterObject);
        
        const mockResponse = [
            { id: 'contact1', email: 'exemplo1-corrigido@email.com', tags: filterObject?.tags?.$all || [] },
            { id: 'contact2', email: 'exemplo2-corrigido@email.com', tags: filterObject?.tags?.$all || [] }
        ];
        
        res.status(200).json(mockResponse);

    } catch (error) {
        console.error("ERRO na rota /api/contacts/filter:", error);
        res.status(500).json({ error: "Erro interno no servidor ao processar o filtro." });
    }
});

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

app.all('/api/*', (req, res) => {
    res.status(404).json({ error: `Rota da API não encontrada: ${req.method} ${req.path}` });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor soberano rodando com força total na porta ${PORT}`);
});

export default app;