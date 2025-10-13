import express from 'express';
import morgan from 'morgan';
import helmet from 'helmet';
import cors from 'cors';
import pg from 'pg';

const app = express();

// --- CONFIGURAÇÃO INICIAL ---
const corsOptions = {
  origin: 'https://quantum-frontend-1l5.pages.dev' // A origem do seu frontend soberano
};
app.use(cors(corsOptions));
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// --- CONEXÃO COM A FONTE SOBERANA (PostgreSQL) ---
const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// --- INICIALIZAÇÃO E CRIAÇÃO DAS TABELAS ESPELHO ---
const initializeDatabase = async () => {
    const client = await pool.connect();
    try {
        console.log("✅ Conexão com a Fonte Soberana (PostgreSQL) estabelecida!");

        // Tabela de Contatos
        await client.query(`
            CREATE TABLE IF NOT EXISTS contacts (
                id SERIAL PRIMARY KEY, email VARCHAR(255) UNIQUE NOT NULL, first_name VARCHAR(255),
                phone VARCHAR(50), tags TEXT[], created_date TIMESTAMPTZ DEFAULT NOW(), source VARCHAR(255),
                country_code VARCHAR(10), city_area_code VARCHAR(10)
            );
        `);
        console.log("✅ Tabela 'contacts' verificada.");

        // Tabela de Landing Pages
        await client.query(`
            CREATE TABLE IF NOT EXISTS landing_pages (
                id SERIAL PRIMARY KEY, name VARCHAR(255) NOT NULL, slug VARCHAR(255) UNIQUE NOT NULL,
                project_id INTEGER, design_json JSONB, created_by VARCHAR(255), created_date TIMESTAMPTZ DEFAULT NOW()
            );
        `);
        console.log("✅ Tabela 'landing_pages' verificada.");

        // Tabela de Thank You Pages
        await client.query(`
            CREATE TABLE IF NOT EXISTS thank_you_pages (
                id SERIAL PRIMARY KEY, name VARCHAR(255) NOT NULL, slug VARCHAR(255) UNIQUE NOT NULL,
                project_id INTEGER, design_json JSONB, created_by VARCHAR(255), created_date TIMESTAMPTZ DEFAULT NOW()
            );
        `);
        console.log("✅ Tabela 'thank_you_pages' verificada.");

        // Tabela de Sales Pages
        await client.query(`
            CREATE TABLE IF NOT EXISTS sales_pages (
                id SERIAL PRIMARY KEY, name VARCHAR(255) NOT NULL, slug VARCHAR(255) UNIQUE NOT NULL,
                project_id INTEGER, design_json JSONB, offer_json JSONB, created_by VARCHAR(255), 
                created_date TIMESTAMPTZ DEFAULT NOW()
            );
        `);
        console.log("✅ Tabela 'sales_pages' verificada.");

        // Tabela de Funnel Projects
        await client.query(`
            CREATE TABLE IF NOT EXISTS funnel_projects (
                id SERIAL PRIMARY KEY, name VARCHAR(255) NOT NULL, description TEXT, created_by VARCHAR(255),
                created_date TIMESTAMPTZ DEFAULT NOW()
            );
        `);
        console.log("✅ Tabela 'funnel_projects' verificada.");

        // Tabela de Automations
        await client.query(`
            CREATE TABLE IF NOT EXISTS automations (
                id SERIAL PRIMARY KEY, name VARCHAR(255) NOT NULL, project_id INTEGER, landing_page_id INTEGER,
                thank_you_page_id INTEGER, trigger_tag VARCHAR(255), company_id VARCHAR(255),
                created_date TIMESTAMPTZ DEFAULT NOW()
            );
        `);
        console.log("✅ Tabela 'automations' verificada.");

    } catch (err) {
        console.error("❌ Erro catastrófico ao inicializar a Fonte Soberana:", err);
        process.exit(1);
    } finally {
        client.release();
    }
};

// --- ROTAS DA API ESPELHO ---
app.get('/api/health', (req, res) => res.status(200).json({ status: 'UP' }));

// --- ROTAS DE CONTATOS ---
app.post('/api/contacts/filter', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM contacts ORDER BY created_date DESC');
        res.status(200).json(result.rows);
    } catch (error) { res.status(500).json({ error: "Erro ao buscar contatos." }); }
});
app.post('/api/contacts', async (req, res) => {
    const { email, first_name, phone, tags, source, country_code, city_area_code } = req.body;
    try {
        const result = await pool.query( 'INSERT INTO contacts (email, first_name, phone, tags, source, country_code, city_area_code) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *', [email, first_name, phone, tags, source, country_code, city_area_code]);
        res.status(201).json(result.rows[0]);
    } catch (error) { res.status(500).json({ error: "Erro ao criar contato." }); }
});

// --- ROTAS DE LANDING PAGES ---
app.post('/api/landing-pages/filter', async (req, res) => {
    const { slug } = req.body || {};
    try {
        const result = await pool.query(slug ? 'SELECT * FROM landing_pages WHERE slug = $1' : 'SELECT * FROM landing_pages', slug ? [slug] : []);
        res.status(200).json(result.rows);
    } catch (error) { res.status(500).json({ error: "Erro ao buscar Landing Pages." }); }
});
app.post('/api/landing-pages', async (req, res) => {
    const { name, slug, project_id, design_json, created_by } = req.body;
    try {
        const result = await pool.query('INSERT INTO landing_pages (name, slug, project_id, design_json, created_by) VALUES ($1, $2, $3, $4, $5) RETURNING *', [name, slug, project_id, design_json, created_by]);
        res.status(201).json(result.rows[0]);
    } catch (error) { res.status(500).json({ error: "Erro ao criar Landing Page." }); }
});

// --- ROTAS DE FUNNEL PROJECTS ---
app.post('/api/funnel-projects/filter', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM funnel_projects ORDER BY created_date DESC');
        res.status(200).json(result.rows);
    } catch (error) { res.status(500).json({ error: "Erro ao buscar projetos de funil." }); }
});
app.post('/api/funnel-projects', async (req, res) => {
    const { name, description, created_by } = req.body;
    try {
        const result = await pool.query('INSERT INTO funnel_projects (name, description, created_by) VALUES ($1, $2, $3) RETURNING *', [name, description, created_by]);
        res.status(201).json(result.rows[0]);
    } catch (error) { res.status(500).json({ error: "Erro ao criar projeto de funil." }); }
});

// --- ROTAS DE AUTOMATIONS ---
app.post('/api/automations/filter', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM automations ORDER BY created_date DESC');
        res.status(200).json(result.rows);
    } catch (error) { res.status(500).json({ error: "Erro ao buscar automações." }); }
});
app.post('/api/automations', async (req, res) => {
    const { name, project_id, landing_page_id, thank_you_page_id, trigger_tag, company_id } = req.body;
    try {
        const result = await pool.query('INSERT INTO automations (name, project_id, landing_page_id, thank_you_page_id, trigger_tag, company_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *', [name, project_id, landing_page_id, thank_you_page_id, trigger_tag, company_id]);
        res.status(201).json(result.rows[0]);
    } catch (error) { res.status(500).json({ error: "Erro ao criar automação." }); }
});

// --- ROTAS DE SALES PAGES ---
app.post('/api/sales-pages/filter', async (req, res) => {
    try {
        const { slug, project_id } = req.body || {};
        let q = 'SELECT * FROM sales_pages';
        const p = [];
        const wh = [];
        if (slug) { p.push(slug); wh.push(`slug = $${p.length}`); }
        if (project_id) { p.push(project_id); wh.push(`project_id = $${p.length}`); }
        if (wh.length) q += ' WHERE ' + wh.join(' AND ');
        const r = await pool.query(q, p);
        res.json(r.rows);
    } catch (err) { res.status(500).json({ error: 'Erro ao buscar sales pages' }); }
});
app.post('/api/sales-pages', async (req, res) => {
    try {
        const { name, slug, project_id, design_json, offer_json, created_by } = req.body || {};
        const r = await pool.query(`INSERT INTO sales_pages (name, slug, project_id, design_json, offer_json, created_by) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`, [name, slug, project_id, design_json || {}, offer_json || {}, created_by || 'unknown']);
        res.json(r.rows[0]);
    } catch (err) { res.status(500).json({ error: 'Erro ao criar sales page' }); }
});

// --- ROTAS DE THANK YOU PAGES ---
app.post('/api/thank-you-pages/filter', async (req, res) => {
    try {
        const { slug, project_id } = req.body || {};
        let q = 'SELECT * FROM thank_you_pages';
        const p = [];
        const wh = [];
        if (slug) { p.push(slug); wh.push(`slug = $${p.length}`); }
        if (project_id) { p.push(project_id); wh.push(`project_id = $${p.length}`); }
        if (wh.length) q += ' WHERE ' + wh.join(' AND ');
        const r = await pool.query(q, p);
        res.json(r.rows);
    } catch (err) { res.status(500).json({ error: 'Erro ao buscar thank you pages' }); }
});
app.post('/api/thank-you-pages', async (req, res) => {
    try {
        const { name, slug, project_id, design_json, created_by } = req.body || {};
        const r = await pool.query(`INSERT INTO thank_you_pages (name, slug, project_id, design_json, created_by) VALUES ($1,$2,$3,$4,$5) RETURNING *`, [name, slug, project_id, design_json || {}, created_by || 'unknown']);
        res.json(r.rows[0]);
    } catch (err) { res.status(500).json({ error: 'Erro ao criar thank you page' }); }
});

// --- ROTAS PÚBLICAS ---
app.get('/public/lp/:slug', async (req, res) => {
    try {
        const { slug } = req.params;
        const result = await pool.query('SELECT design_json FROM landing_pages WHERE slug = $1', [slug]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Página não encontrada.' });
        res.status(200).json(result.rows[0].design_json);
    } catch (error) { res.status(500).json({ error: "Erro ao buscar dados da página." }); }
});
app.get('/public/typ/:slug', async (req, res) => {
    try {
        const { slug } = req.params;
        const result = await pool.query('SELECT design_json FROM thank_you_pages WHERE slug = $1', [slug]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Página não encontrada.' });
        res.status(200).json(result.rows[0].design_json);
    } catch (error) { res.status(500).json({ error: "Erro ao buscar dados da página." }); }
});
app.get('/public/sales/:slug', async (req, res) => {
    try {
        const { slug } = req.params;
        const result = await pool.query('SELECT design_json, offer_json FROM sales_pages WHERE slug = $1', [slug]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Página não encontrada.' });
        res.status(200).json(result.rows[0]);
    } catch (error) { res.status(500).json({ error: "Erro ao buscar dados da página." }); }
});

// --- INICIALIZAÇÃO DO SERVIDOR ---
const PORT = process.env.PORT || 3001;
initializeDatabase().then(() => {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Servidor com Fonte Soberana ativa na porta ${PORT}`);
    });
});

export default app;