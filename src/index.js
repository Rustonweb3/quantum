import express from 'express';
import morgan from 'morgan';
import helmet from 'helmet';
import cors from 'cors';
import pg from 'pg';

const app = express();

const corsOptions = {
  origin: 'https://quantum-frontend-1l5.pages.dev'
};
app.use(cors(corsOptions));

app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

const initializeDatabase = async () => {
    try {
        const client = await pool.connect();
        console.log("✅ Conexão com a Fonte Soberana (PostgreSQL) estabelecida!");
        await client.query(`
            CREATE TABLE IF NOT EXISTS contacts (
                id SERIAL PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                first_name VARCHAR(255),
                last_name VARCHAR(255),
                phone VARCHAR(50),
                tags TEXT[],
                created_date TIMESTAMPTZ DEFAULT NOW(),
                country_code VARCHAR(10),
                city_area_code VARCHAR(10),
                source VARCHAR(255)
            );
        `);
        console.log("✅ Tabela 'contacts' verificada e pronta para a batalha.");
        client.release();
    } catch (err) {
        console.error("❌ Erro catastrófico ao inicializar a Fonte Soberana:", err);
        process.exit(1);
    }
};

// --- ROTAS DA API ---
app.get('/api/health', (req, res) => res.status(200).json({ status: 'UP' }));

app.post('/api/contacts/filter', async (req, res) => {
  try {
      const result = await pool.query('SELECT * FROM contacts ORDER BY created_date DESC LIMIT 100');
      res.status(200).json(result.rows);
  } catch (error) {
      console.error("ERRO na rota /api/contacts/filter:", error);
      res.status(500).json({ error: "Erro interno no servidor ao buscar contatos." });
  }
});

// *** NOVA ROTA PARA CRIAR CONTATOS ***
app.post('/api/contacts', async (req, res) => {
    const { email, first_name, phone, tags, source, country_code, city_area_code } = req.body;
    console.log("RECEBENDO NOVO CONTATO:", req.body);

    if (!email) {
        return res.status(400).json({ error: 'O email é obrigatório.' });
    }

    try {
        // Insere ou atualiza o contato. Se o email já existir, atualiza os dados.
        const result = await pool.query(
            `INSERT INTO contacts (email, first_name, phone, tags, source, country_code, city_area_code)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             ON CONFLICT (email) 
             DO UPDATE SET
                first_name = EXCLUDED.first_name,
                phone = EXCLUDED.phone,
                tags = contacts.tags || EXCLUDED.tags,
                source = EXCLUDED.source,
                country_code = EXCLUDED.country_code,
                city_area_code = EXCLUDED.city_area_code,
                created_date = NOW()
             RETURNING *;`,
            [email, first_name, phone, tags, source, country_code, city_area_code]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error("ERRO ao criar/atualizar contato:", error);
        res.status(500).json({ error: "Erro interno no servidor ao guardar o contato." });
    }
});


const PORT = process.env.PORT || 3001;

initializeDatabase().then(() => {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Servidor com Fonte Soberana ativa na porta ${PORT}`);
    });
});

export default app;