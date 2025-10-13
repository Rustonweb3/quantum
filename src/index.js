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
app.use(express.json({ limit: '10mb' }));
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

        // Tabela Contacts (já existe)
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

        // Tabela Landing Pages (já existe)
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
        console.log("✅ Tabela 'landing_pages' verificada.");

        // *** NOVA TABELA PARA FUNNEL PROJECTS ***
        await client.query(`
            CREATE TABLE IF NOT EXISTS funnel_projects (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                created_date TIMESTAMPTZ DEFAULT NOW()
            );
        `);
        console.log("✅ Tabela 'funnel_projects' ativada para o extermínio.");

        // *** NOVA TABELA PARA AUTOMATIONS ***
        await client.query(`
            CREATE TABLE IF NOT EXISTS automations (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                project_id INTEGER REFERENCES funnel_projects(id) ON DELETE CASCADE,
                trigger_type VARCHAR(255),
                steps JSONB,
                created_date TIMESTAMPTZ DEFAULT NOW()
            );
        `);
        console.log("✅ Tabela 'automations' pronta para a batalha.");

    } catch (err) {
        console.error("❌ Erro catastrófico ao inicializar a Fonte Soberana:", err);
        process.exit(1);
    } finally {
        client.release();
    }
};

// --- ROTAS DA API ---
app.get('/api/health', (req, res) => res.status(200).json({ status: 'UP' }));

// --- ROTAS DE CONTATOS (mantidas) ---
app.post('/api/contacts/filter', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM contacts ORDER BY created_date DESC');
        res.status(200).json(result.rows);
    } catch (error) {
        console.error("Erro ao buscar contatos:", error);
        res.status(500).json({ error: "Erro ao buscar contatos." });
    }
});

app.post('/api/contacts', async (req, res) => {
    const { email, first_name, phone, tags, source, country_code, city_area_code } = req.body;
    if (!email) {
        return res.status(400).json({ error: 'Email é obrigatório.' });
    }
    try {
        const result = await pool.query(
            `INSERT INTO contacts (email, first_name, phone, tags, source, country_code, city_area_code)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             ON CONFLICT (email) DO UPDATE SET
                first_name = EXCLUDED.first_name,
                phone = EXCLUDED.phone,
                tags = EXCLUDED.tags,
                source = EXCLUDED.source,
                country_code = EXCLUDED.country_code,
                city_area_code = EXCLUDED.city_area_code
             RETURNING *`,
            [email, first_name, phone, tags, source, country_code, city_area_code]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error("Erro ao criar ou atualizar contato:", error);
        res.status(500).json({ error: "Erro ao criar ou atualizar contato." });
    }
});

// --- ROTAS DE LANDING PAGES (mantidas) ---
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

// *** NOVAS ROTAS PARA FUNNEL PROJECTS ***
app.post('/api/funnel-projects/filter', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM funnel_projects ORDER BY created_date DESC');
        res.status(200).json(result.rows);
    } catch (error) {
        console.error("Erro ao buscar projetos de funil:", error);
        res.status(500).json({ error: "Erro ao buscar projetos de funil." });
    }
});

app.post('/api/funnel-projects', async (req, res) => {
    const { name, description } = req.body;
    if (!name) {
        return res.status(400).json({ error: 'Nome do projeto é obrigatório.' });
    }
    try {
        const result = await pool.query(
            'INSERT INTO funnel_projects (name, description) VALUES ($1, $2) RETURNING *',
            [name, description]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error("Erro ao criar projeto de funil:", error);
        res.status(500).json({ error: "Erro ao criar projeto de funil." });
    }
});


// *** NOVAS ROTAS PARA AUTOMATIONS ***
app.post('/api/automations/filter', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM automations ORDER BY created_date DESC');
        res.status(200).json(result.rows);
    } catch (error) {
        console.error("Erro ao buscar automações:", error);
        res.status(500).json({ error: "Erro ao buscar automações." });
    }
});

app.post('/api/automations', async (req, res) => {
    const { name, project_id, trigger_type, steps } = req.body;
    if (!name || !project_id) {
        return res.status(400).json({ error: 'Nome da automação e ID do projeto são obrigatórios.' });
    }
    try {
        const result = await pool.query(
            'INSERT INTO automations (name, project_id, trigger_type, steps) VALUES ($1, $2, $3, $4) RETURNING *',
            [name, project_id, trigger_type, steps]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error("Erro ao criar automação:", error);
        res.status(500).json({ error: "Erro ao criar automação." });
    }
});

const PORT = process.env.PORT || 3001;

initializeDatabase().then(() => {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Servidor com Fonte Soberana ativa na porta ${PORT}`);
    });
});

export default app;