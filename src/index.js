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
app.use(express.json({ limit: '10mb' })); // Aumenta o limite para JSON
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

const initializeDatabase = async () => {
    const client = await pool.connect();
    try {
        console.log("✅ Conexão com a Fonte Soberana (PostgreSQL) estabelecida!");
        await client.query(`
            CREATE TABLE IF NOT EXISTS contacts (
                id SERIAL PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                first_name VARCHAR(255),
                phone VARCHAR(50),
                tags TEXT[],
                created_date TIMESTAMPTZ DEFAULT NOW(),
                source VARCHAR(255),
                country_code VARCHAR(10),
                city_area_code VARCHAR(10)
            );
        `);
        console.log("✅ Tabela 'contacts' verificada.");

        // *** NOVA TABELA PARA LANDING PAGES ***
        await client.query(`
            CREATE TABLE IF NOT EXISTS landing_pages (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                slug VARCHAR(255) UNIQUE NOT NULL,
                project_id INTEGER,
                design_json JSONB,
                created_date TIMESTAMPTZ DEFAULT NOW()
            );
        `);
        console.log("✅ Tabela 'landing_pages' verificada e pronta para a batalha.");

    } catch (err) {
        console.error("❌ Erro catastrófico ao inicializar a Fonte Soberana:", err);
        process.exit(1);
    } finally {
        client.release();
    }
};

// --- ROTAS DA API ---
app.get('/api/health', (req, res) => res.status(200).json({ status: 'UP' }));

// --- ROTAS DE CONTATOS ---
app.post('/api/contacts/filter', async (req, res) => { /* ... código mantido ... */ });
app.post('/api/contacts', async (req, res) => { /* ... código mantido ... */ });

// *** NOVAS ROTAS PARA LANDING PAGES ***
app.post('/api/landing-pages/filter', async (req, res) => {
    const { slug } = req.body;
    if (!slug) return res.status(400).json({ error: 'Slug é obrigatório para filtrar.' });
    try {
        const result = await pool.query('SELECT * FROM landing_pages WHERE slug = $1', [slug]);
        res.status(200).json(result.rows);
    } catch (error) {
        res.status(500).json({ error: "Erro ao buscar Landing Page." });
    }
});

app.post('/api/landing-pages', async (req, res) => {
    const { name, slug, project_id, design_json } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO landing_pages (name, slug, project_id, design_json) VALUES ($1, $2, $3, $4) RETURNING *',
            [name, slug, project_id, design_json]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: "Erro ao criar Landing Page." });
    }
});

const PORT = process.env.PORT || 3001;

initializeDatabase().then(() => {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Servidor com Fonte Soberana ativa na porta ${PORT}`);
    });
});

export default app;