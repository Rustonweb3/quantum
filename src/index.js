import express from 'express';
import morgan from 'morgan';
import helmet from 'helmet';
import cors from 'cors';
import pg from 'pg'; // Arsenal para conectar ao PostgreSQL

const app = express();

// --- CONFIGURAÇÃO DA PONTE SOBERANA (CORS) ---
const corsOptions = {
  origin: 'https://quantum-frontend-1l5.pages.dev'
};
app.use(cors(corsOptions));

// --- MIDDLEWARES PADRÃO ---
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- CONFIGURAÇÃO DA FONTE SOBERANA (BASE DE DADOS) ---
const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // A nossa chave secreta
  ssl: {
    rejectUnauthorized: false // Requerido pelo Render
  }
});

// --- VERIFICAÇÃO E CRIAÇÃO DA TABELA AO INICIAR ---
const initializeDatabase = async () => {
    try {
        const client = await pool.connect();
        console.log("✅ Conexão com a Fonte Soberana (PostgreSQL) estabelecida!");

        // Cria a tabela 'contacts' se ela não existir
        await client.query(`
            CREATE TABLE IF NOT EXISTS contacts (
                id SERIAL PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                first_name VARCHAR(255),
                last_name VARCHAR(255),
                phone VARCHAR(50),
                tags TEXT[],
                created_date TIMESTAMPTZ DEFAULT NOW()
            );
        `);
        console.log("✅ Tabela 'contacts' verificada e pronta para a batalha.");
        client.release();
    } catch (err) {
        console.error("❌ Erro catastrófico ao inicializar a Fonte Soberana:", err);
        // Em caso de falha, o processo será encerrado para evitar inconsistências.
        process.exit(1);
    }
};

// --- ROTAS DA API (AGORA COM DADOS REAIS) ---
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'UP' });
});

app.post('/api/contacts/filter', async (req, res) => {
  try {
      console.log("ROTA POST RECEBIDA DIRETAMENTE:", req.body);
      // AGORA VAMOS BUSCAR DADOS REAIS!
      const result = await pool.query('SELECT * FROM contacts ORDER BY created_date DESC LIMIT 100');
      res.status(200).json(result.rows);
  } catch (error) {
      console.error("ERRO na rota /api/contacts/filter:", error);
      res.status(500).json({ error: "Erro interno no servidor ao buscar contatos." });
  }
});

const PORT = process.env.PORT || 3001;

// Inicia o servidor SÓ DEPOIS de verificar a base de dados
initializeDatabase().then(() => {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Servidor com Fonte Soberana ativa na porta ${PORT}`);
    });
});

export default app;