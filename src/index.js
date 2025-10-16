import express from 'express';
import morgan from 'morgan';
import helmet from 'helmet';
import cors from 'cors';
import pg from 'pg';
import telemetryAnalytics from './telemetryAnalytics.js';

// import { registerEntities } from "./entities.js"; // Linha original comentada, a nova será inserida

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

// A conexão e a chamada do registerEntities serão feitas dentro do bloco de inicialização
// para garantir que o 'pool' esteja pronto.

// --- INICIALIZAÇÃO E CRIAÇÃO DAS TABELAS ESPELHO ---
const initializeDatabase = async () => {
    const client = await pool.connect();
    try {
        console.log("✅ Conexão com a Fonte Soberana (PostgreSQL) estabelecida!");
        
        await client.query(`CREATE TABLE IF NOT EXISTS contacts (id SERIAL PRIMARY KEY, email VARCHAR(255) UNIQUE NOT NULL, first_name VARCHAR(255), phone VARCHAR(50), tags TEXT[], created_date TIMESTAMPTZ DEFAULT NOW(), source VARCHAR(255), country_code VARCHAR(10), city_area_code VARCHAR(10));`);
        console.log("✅ Tabela 'contacts' verificada.");

        await client.query(`CREATE TABLE IF NOT EXISTS landing_pages (id SERIAL PRIMARY KEY, name VARCHAR(255) NOT NULL, slug VARCHAR(255) UNIQUE NOT NULL, project_id INTEGER, design_json JSONB, created_by VARCHAR(255), created_date TIMESTAMPTZ DEFAULT NOW());`);
        console.log("✅ Tabela 'landing_pages' verificada.");

        await client.query(`CREATE TABLE IF NOT EXISTS thank_you_pages (id SERIAL PRIMARY KEY, name VARCHAR(255) NOT NULL, slug VARCHAR(255) UNIQUE NOT NULL, project_id INTEGER, design_json JSONB, created_by VARCHAR(255), created_date TIMESTAMPTZ DEFAULT NOW());`);
        console.log("✅ Tabela 'thank_you_pages' verificada.");

        await client.query(`CREATE TABLE IF NOT EXISTS sales_pages (id SERIAL PRIMARY KEY, name VARCHAR(255) NOT NULL, slug VARCHAR(255) UNIQUE NOT NULL, project_id INTEGER, design_json JSONB, offer_json JSONB, created_by VARCHAR(255), created_date TIMESTAMPTZ DEFAULT NOW());`);
        console.log("✅ Tabela 'sales_pages' verificada.");

        await client.query(`CREATE TABLE IF NOT EXISTS funnel_projects (id SERIAL PRIMARY KEY, name VARCHAR(255) NOT NULL, description TEXT, created_by VARCHAR(255), created_date TIMESTAMPTZ DEFAULT NOW());`);
        console.log("✅ Tabela 'funnel_projects' verificada.");

        await client.query(`CREATE TABLE IF NOT EXISTS automations (id SERIAL PRIMARY KEY, name VARCHAR(255) NOT NULL, project_id INTEGER, landing_page_id INTEGER, thank_you_page_id INTEGER, trigger_tag VARCHAR(255), company_id VARCHAR(255), created_date TIMESTAMPTZ DEFAULT NOW());`);
        console.log("✅ Tabela 'automations' verificada.");
        
        await client.query(`CREATE TABLE IF NOT EXISTS page_visits (id SERIAL PRIMARY KEY, page_type VARCHAR(50) NOT NULL, slug VARCHAR(255) NOT NULL, ip_address VARCHAR(64), user_agent TEXT, referrer TEXT, country VARCHAR(100), created_date TIMESTAMPTZ DEFAULT NOW());`);
        console.log("✅ Tabela 'page_visits' verificada.");

        await client.query(`
          CREATE TABLE IF NOT EXISTS telemetry (
            id SERIAL PRIMARY KEY,
            user_id VARCHAR(255),
            event_type VARCHAR(100) NOT NULL,
            origin_page VARCHAR(255),
            payload JSONB,
            created_date TIMESTAMPTZ DEFAULT NOW()
          );
        `);
        console.log("✅ Tabela 'telemetry' verificada.");

        await client.query(`
          CREATE TABLE IF NOT EXISTS video_watch (
            id SERIAL PRIMARY KEY,
            video_id VARCHAR(255) NOT NULL,
            page_slug VARCHAR(255),
            user_id VARCHAR(255),
            event_type VARCHAR(50) NOT NULL,
            progress_seconds INTEGER DEFAULT 0,
            duration_seconds INTEGER DEFAULT 0,
            created_date TIMESTAMPTZ DEFAULT NOW()
          );
        `);
        console.log("✅ Tabela 'video_watch' verificada.");

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
app.post('/api/contacts/filter', async (req, res) => { try { const result = await pool.query('SELECT * FROM contacts ORDER BY created_date DESC'); res.status(200).json(result.rows); } catch (error) { console.error("Erro ao buscar contatos:", error); res.status(500).json({ error: "Erro ao buscar contatos." }); } });
app.post('/api/contacts', async (req, res) => { const { email, first_name, phone, tags, source, country_code, city_area_code } = req.body; try { const result = await pool.query( 'INSERT INTO contacts (email, first_name, phone, tags, source, country_code, city_area_code) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *', [email, first_name, phone, tags, source, country_code, city_area_code]); res.status(201).json(result.rows[0]); } catch (error) { console.error("Erro ao criar contato:", error); res.status(500).json({ error: "Erro ao criar contato." }); } });

// --- ROTAS DE LANDING PAGES ---
app.post('/api/landing-pages/filter', async (req, res) => { const { slug } = req.body || {}; try { const result = await pool.query(slug ? 'SELECT * FROM landing_pages WHERE slug = $1' : 'SELECT * FROM landing_pages', slug ? [slug] : []); res.status(200).json(result.rows); } catch (error) { console.error("Erro ao buscar Landing Pages:", error); res.status(500).json({ error: "Erro ao buscar Landing Pages." }); } });
app.post('/api/landing-pages', async (req, res) => { const { name, slug, project_id, design_json, created_by } = req.body; try { const result = await pool.query('INSERT INTO landing_pages (name, slug, project_id, design_json, created_by) VALUES ($1, $2, $3, $4, $5) RETURNING *', [name, slug, project_id, design_json, created_by]); res.status(201).json(result.rows[0]); } catch (error) { console.error("Erro ao criar Landing Page:", error); res.status(500).json({ error: "Erro ao criar Landing Page." }); } });

// --- ROTAS DE FUNNEL PROJECTS ---
app.post('/api/funnel-projects/filter', async (req, res) => { try { const result = await pool.query('SELECT * FROM funnel_projects ORDER BY created_date DESC'); res.status(200).json(result.rows); } catch (error) { console.error("Erro ao buscar projetos:", error); res.status(500).json({ error: "Erro ao buscar projetos de funil." }); } });
app.post('/api/funnel-projects', async (req, res) => { const { name, description, created_by } = req.body; try { const result = await pool.query('INSERT INTO funnel_projects (name, description, created_by) VALUES ($1, $2, $3) RETURNING *', [name, description, created_by]); res.status(201).json(result.rows[0]); } catch (error) { console.error("Erro ao criar projeto:", error); res.status(500).json({ error: "Erro ao criar projeto de funil." }); } });

// --- ROTAS DE AUTOMATIONS ---
app.post('/api/automations/filter', async (req, res) => { try { const result = await pool.query('SELECT * FROM automations ORDER BY created_date DESC'); res.status(200).json(result.rows); } catch (error) { console.error("Erro ao buscar automações:", error); res.status(500).json({ error: "Erro ao buscar automações." }); } });
app.post('/api/automations', async (req, res) => { const { name, project_id, landing_page_id, thank_you_page_id, trigger_tag, company_id } = req.body; try { const result = await pool.query('INSERT INTO automations (name, project_id, landing_page_id, thank_you_page_id, trigger_tag, company_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *', [name, project_id, landing_page_id, thank_you_page_id, trigger_tag, company_id]); res.status(201).json(result.rows[0]); } catch (error) { console.error("Erro ao criar automação:", error); res.status(500).json({ error: "Erro ao criar automação." }); } });

// --- ROTAS DE SALES PAGES ---
app.post('/api/sales-pages/filter', async (req, res) => { try { const { slug, project_id } = req.body || {}; let q = 'SELECT * FROM sales_pages'; const p = []; const wh = []; if (slug) { p.push(slug); wh.push(`slug = $${p.length}`); } if (project_id) { p.push(project_id); wh.push(`project_id = $${p.length}`); } if (wh.length) q += ' WHERE ' + wh.join(' AND '); const r = await pool.query(q, p); res.json(r.rows); } catch (err) { console.error('Erro ao buscar sales pages:', err); res.status(500).json({ error: 'Erro ao buscar sales pages' }); } });
app.post('/api/sales-pages', async (req, res) => { try { const { name, slug, project_id, design_json, offer_json, created_by } = req.body || {}; const r = await pool.query(`INSERT INTO sales_pages (name, slug, project_id, design_json, offer_json, created_by) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`, [name, slug, project_id, design_json || {}, offer_json || {}, created_by || 'unknown']); res.json(r.rows[0]); } catch (err) { console.error('Erro ao criar sales page:', err); res.status(500).json({ error: 'Erro ao criar sales page' }); } });

// --- ROTAS DE THANK YOU PAGES ---
app.post('/api/thank-you-pages/filter', async (req, res) => { try { const { slug, project_id } = req.body || {}; let q = 'SELECT * FROM thank_you_pages'; const p = []; const wh = []; if (slug) { p.push(slug); wh.push(`slug = $${p.length}`); } if (project_id) { p.push(project_id); wh.push(`project_id = $${p.length}`); } if (wh.length) q += ' WHERE ' + wh.join(' AND '); const r = await pool.query(q, p); res.json(r.rows); } catch (err) { console.error('Erro ao buscar thank you pages:', err); res.status(500).json({ error: 'Erro ao buscar thank you pages' }); } });
app.post('/api/thank-you-pages', async (req, res) => { try { const { name, slug, project_id, design_json, created_by } = req.body || {}; const r = await pool.query(`INSERT INTO thank_you_pages (name, slug, project_id, design_json, created_by) VALUES ($1,$2,$3,$4,$5) RETURNING *`, [name, slug, project_id, design_json || {}, created_by || 'unknown']); res.json(r.rows[0]); } catch (err) { console.error('Erro ao criar thank you page:', err); res.status(500).json({ error: 'Erro ao criar thank you page' }); } });

// --- ROTAS DE PAGE VISITS ---
app.post('/api/page-visits', async (req, res) => { try { const { page_type, slug, referrer, country } = req.body || {}; const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress; const ua = req.headers['user-agent'] || 'unknown'; const result = await pool.query( `INSERT INTO page_visits (page_type, slug, ip_address, user_agent, referrer, country) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`, [page_type || 'unknown', slug || 'unknown', ip, ua, referrer || null, country || null] ); res.status(201).json(result.rows[0]); } catch (err) { console.error('Erro ao registrar visita:', err); res.status(500).json({ error: 'Falha ao registrar visita.' }); } });
app.post('/api/page-visits/filter', async (req, res) => { try { const { page_type } = req.body || {}; const query = page_type ? 'SELECT page_type, COUNT(*) AS total, MAX(created_date) AS ultima_visita FROM page_visits WHERE page_type = $1 GROUP BY page_type' : 'SELECT page_type, COUNT(*) AS total, MAX(created_date) AS ultima_visita FROM page_visits GROUP BY page_type'; const params = page_type ? [page_type] : []; const result = await pool.query(query, params); res.status(200).json(result.rows); } catch (err) { console.error('Erro ao buscar métricas de visitas:', err); res.status(500).json({ error: 'Falha ao buscar métricas.' }); } });

// --- ROTAS DE TELEMETRIA ---
app.post('/api/telemetry', async (req, res) => {
  try {
    const { user_id, event_type, origin_page, payload } = req.body || {};
    const r = await pool.query(
      `INSERT INTO telemetry (user_id, event_type, origin_page, payload)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [user_id || null, event_type, origin_page || null, payload || {}]
    );
    res.status(201).json(r.rows[0]);
  } catch (err) {
    console.error('Erro ao registrar telemetria:', err);
    res.status(500).json({ error: 'Falha ao registrar telemetria.' });
  }
});
app.post('/api/telemetry/filter', async (req, res) => {
  try {
    const { event_type, origin_page, date_from, date_to } = req.body || {};
    const wh = [], p = [];
    if (event_type) { p.push(event_type); wh.push(`event_type = $${p.length}`); }
    if (origin_page) { p.push(origin_page); wh.push(`origin_page = $${p.length}`); }
    if (date_from) { p.push(date_from); wh.push(`created_date >= $${p.length}`); }
    if (date_to)   { p.push(date_to);   wh.push(`created_date <  $${p.length}`); }
    let q = 'SELECT * FROM telemetry';
    if (wh.length) q += ' WHERE ' + wh.join(' AND ');
    q += ' ORDER BY created_date DESC LIMIT 500';
    const r = await pool.query(q, p);
    res.json(r.rows);
  } catch (err) {
    console.error('Erro ao filtrar telemetria:', err);
    res.status(500).json({ error: 'Falha ao buscar telemetria.' });
  }
});

// --- ROTAS DE VIDEO WATCH ---
app.post('/api/video-watch', async (req, res) => {
  try {
    const { video_id, page_slug, user_id, event_type, progress_seconds, duration_seconds } = req.body || {};
    const r = await pool.query(`
      INSERT INTO video_watch (video_id, page_slug, user_id, event_type, progress_seconds, duration_seconds)
      VALUES ($1,$2,$3,$4,$5,$6)
      RETURNING *`,
      [video_id, page_slug, user_id, event_type, progress_seconds || 0, duration_seconds || 0]
    );
    res.status(201).json(r.rows[0]);
  } catch (err) {
    console.error('Erro ao registrar evento de vídeo:', err);
    res.status(500).json({ error: 'Falha ao registrar evento de vídeo.' });
  }
});
app.post('/api/video-watch/filter', async (req, res) => {
  try {
    const { video_id, user_id, page_slug } = req.body || {};
    const p = [], wh = [];
    if (video_id) { p.push(video_id); wh.push(`video_id = $${p.length}`); }
    if (user_id)  { p.push(user_id);  wh.push(`user_id = $${p.length}`); }
    if (page_slug){ p.push(page_slug);wh.push(`page_slug = $${p.length}`); }
    let q = 'SELECT * FROM video_watch';
    if (wh.length) q += ' WHERE ' + wh.join(' AND ');
    q += ' ORDER BY created_date DESC LIMIT 500';
    const r = await pool.query(q, p);
    res.json(r.rows);
  } catch (err) {
    console.error('Erro ao buscar registros de vídeo:', err);
    res.status(500).json({ error: 'Falha ao buscar registros de vídeo.' });
  }
});

// --- ROTAS DE ANALYTICS E DASHBOARD ---
app.get('/api/analytics/overview', async (req, res) => {
  try {
    const results = await Promise.all([
      pool.query('SELECT COUNT(*) AS total_contacts FROM contacts'),
      pool.query('SELECT COUNT(*) AS total_automations FROM automations'),
      pool.query('SELECT COUNT(*) AS total_lps FROM landing_pages'),
      pool.query('SELECT COUNT(*) AS total_sales_pages FROM sales_pages'),
      pool.query('SELECT COUNT(*) AS total_visits FROM page_visits'),
      pool.query('SELECT page_type, COUNT(*) AS total FROM page_visits GROUP BY page_type')
    ]);

    const [contacts, automations, lps, sales, visits, byType] = results.map(r => r.rows);

    res.status(200).json({
      contacts: parseInt(contacts[0]?.total_contacts || 0, 10),
      automations: parseInt(automations[0]?.total_automations || 0, 10),
      landing_pages: parseInt(lps[0]?.total_lps || 0, 10),
      sales_pages: parseInt(sales[0]?.total_sales_pages || 0, 10),
      total_visits: parseInt(visits[0]?.total_visits || 0, 10),
      visits_by_type: byType.map(item => ({...item, total: parseInt(item.total, 10)}))
    });
  } catch (err) {
    console.error('Erro ao obter métricas do dashboard:', err);
    res.status(500).json({ error: 'Falha ao carregar métricas do dashboard.' });
  }
});

app.get('/api/analytics/visits-history', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT date_trunc('day', created_date) AS dia, COUNT(*) AS total
      FROM page_visits
      WHERE created_date > NOW() - INTERVAL '30 days'
      GROUP BY dia
      ORDER BY dia ASC
    `);
    res.status(200).json(result.rows.map(row => ({...row, total: parseInt(row.total, 10)})));
  } catch (err) {
    console.error('Erro ao obter histórico de visitas:', err);
    res.status(500).json({ error: 'Falha ao obter histórico de visitas.' });
  }
});

app.get('/api/analytics/telemetry-overview', async (_req, res) => {
  try {
    const [byEvent, last24h] = await Promise.all([
      pool.query(`SELECT event_type, COUNT(*)::int AS total FROM telemetry GROUP BY event_type ORDER BY total DESC`),
      pool.query(`SELECT date_trunc('hour', created_date) AS hora, COUNT(*)::int AS total FROM telemetry WHERE created_date > NOW() - INTERVAL '24 hours' GROUP BY hora ORDER BY hora ASC`)
    ]);
    res.json({ by_event: byEvent.rows, last_24h: last24h.rows });
  } catch (err) {
    console.error('Erro no overview de telemetria:', err);
    res.status(500).json({ error: 'Falha ao obter overview de telemetria.' });
  }
});


// --- ROTAS PÚBLICAS ---
app.get('/public/lp/:slug', async (req, res) => { try { const { slug } = req.params; const result = await pool.query('SELECT design_json FROM landing_pages WHERE slug = $1', [slug]); if (result.rows.length === 0) return res.status(404).json({ error: 'Página não encontrada.' }); res.status(200).json(result.rows[0].design_json); } catch (error) { console.error("Erro ao buscar LP pública:", error); res.status(500).json({ error: "Erro ao buscar dados da página." }); } });
app.get('/public/typ/:slug', async (req, res) => { try { const { slug } = req.params; const result = await pool.query('SELECT design_json FROM thank_you_pages WHERE slug = $1', [slug]); if (result.rows.length === 0) return res.status(404).json({ error: 'Página não encontrada.' }); res.status(200).json(result.rows[0].design_json); } catch (error) { console.error("Erro ao buscar TYP pública:", error); res.status(500).json({ error: "Erro ao buscar dados da página." }); } });
app.get('/public/sales/:slug', async (req, res) => { try { const { slug } = req.params; const result = await pool.query('SELECT design_json, offer_json FROM sales_pages WHERE slug = $1', [slug]); if (result.rows.length === 0) return res.status(404).json({ error: 'Página não encontrada.' }); res.status(200).json(result.rows[0]); } catch (error) { console.error("Erro ao buscar Sales Page pública:", error); res.status(500).json({ error: "Erro ao buscar dados da página." }); } });

// --- INICIALIZAÇÃO DO SERVIDOR ---
app.use('/api', telemetryAnalytics);
const PORT = process.env.PORT || 3001;
initializeDatabase().then(() => {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Servidor com Fonte Soberana ativa na porta ${PORT}`);
    });
});

export default app;