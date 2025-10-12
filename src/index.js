import express from 'express';
import morgan from 'morgan';
import helmet from 'helmet';
import cors from 'cors'; // IMPORTANTE: Importa a biblioteca cors

const app = express();

// --- CONFIGURAÇÃO DA PONTE SOBERANA ---
const corsOptions = {
  origin: 'https://quantum-frontend-1l5.pages.dev' // Permite APENAS o seu frontend
};
app.use(cors(corsOptions));

// --- MIDDLEWARES PADRÃO ---
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- ROTAS DA API ---
app.get('/api/health', (req, res) => {
  console.log("Health check recebido com sucesso (via Ponte Soberana).");
  res.status(200).json({ status: 'UP' });
});

app.post('/api/contacts/filter', (req, res) => {
  try {
      console.log("ROTA POST RECEBIDA DIRETAMENTE:", req.body);
      const mockResponse = [
          { id: 'contact1', email: 'vitoria@soberania.digital' },
          { id: 'contact2', email: 'missao_cumprida@email.com' }
      ];
      res.status(200).json(mockResponse);
  } catch (error) {
      res.status(500).json({ error: "Erro interno no servidor." });
  }
});

// ... (outras rotas podem ser adicionadas aqui no futuro)

const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor com Ponte Soberana ativa na porta ${PORT}`);
});

export default app;