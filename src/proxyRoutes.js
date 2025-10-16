// ============================================================
// 🧠 Quantum Proxy Layer — Fonte Soberana v1.0
// ============================================================
import express from 'express';
import pg from 'pg';

const router = express.Router();
const { Client } = pg;

// A conexão é movida para uma função async para garantir que o pool esteja pronto
// Usaremos um Pool em vez de um Client para melhor gestão de conexões
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

pool.connect()
  .then(() => console.log('✅ [Quantum Proxy] Conectado à Fonte Soberana (PostgreSQL)'))
  .catch(err => console.error('❌ [Quantum Proxy] Erro de conexão com o banco:', err));

// ============================================================
// 🔹 Utilitário de execução genérico
// ============================================================
async function runQuery(query, params = []) {
  try {
    const result = await pool.query(query, params);
    return result.rows || [];
  } catch (err) {
    console.error('❌ [Quantum Proxy] Erro ao executar query:', query, err);
    // Retornar um array vazio em caso de erro para manter a consistência da API
    return [];
  }
}

// ============================================================
// 🔸 Rotas Genéricas de Entidades Principais
// ============================================================

// 🔹 Funnel Projects
router.post('/funnel-projects/filter', async (req, res) => {
  console.log('🧠 [Quantum Proxy] /funnel-projects/filter acionado');
  const data = await runQuery('SELECT * FROM funnel_projects ORDER BY created_at DESC');
  res.json(data);
});

// 🔹 Sales Pages
router.post('/sales-pages/filter', async (req, res) => {
  console.log('🧠 [Quantum Proxy] /sales-pages/filter acionado');
  const data = await runQuery('SELECT * FROM sales_pages ORDER BY created_at DESC');
  res.json(data);
});

// 🔹 Automations
router.post('/automations/filter', async (req, res) => {
  console.log('🧠 [Quantum Proxy] /automations/filter acionado');
  const data = await runQuery('SELECT * FROM automations ORDER BY created_at DESC');
  res.json(data);
});

// 🔹 Page Visits
router.post('/page-visits/filter', async (req, res) => {
  console.log('🧠 [Quantum Proxy] /page-visits/filter acionado');
  const data = await runQuery('SELECT * FROM page_visits ORDER BY created_date DESC');
  res.json(data);
});

// 🔹 Telemetry
router.post('/telemetry/filter', async (req, res) => {
  console.log('🧠 [Quantum Proxy] /telemetry/filter acionado');
  const data = await runQuery('SELECT * FROM telemetry ORDER BY created_at DESC');
  res.json(data);
});

// 🔹 Video Watch
router.post('/video-watch/filter', async (req, res) => {
  console.log('🧠 [Quantum Proxy] /video-watch/filter acionado');
  const data = await runQuery('SELECT * FROM video_watch ORDER BY created_date DESC');
  res.json(data);
});

// --- ROTAS DE CONTATOS ---
router.post('/contacts/filter', async (req, res) => { 
    console.log('🧠 [Quantum Proxy] /contacts/filter acionado');
    const data = await runQuery('SELECT * FROM contacts ORDER BY created_date DESC');
    res.json(data);
});
router.post('/contacts', async (req, res) => { 
    const { email, first_name, phone, tags, source, country_code, city_area_code } = req.body; 
    console.log('🧠 [Quantum Proxy] /contacts (create) acionado');
    const data = await runQuery('INSERT INTO contacts (email, first_name, phone, tags, source, country_code, city_area_code) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *', [email, first_name, phone, tags, source, country_code, city_area_code]);
    res.status(201).json(data[0] || {});
});

// --- ROTAS DE LANDING PAGES ---
router.post('/landing-pages/filter', async (req, res) => { 
    const { slug } = req.body || {};
    console.log('🧠 [Quantum Proxy] /landing-pages/filter acionado com slug:', slug);
    const query = slug ? 'SELECT * FROM landing_pages WHERE slug = $1' : 'SELECT * FROM landing_pages';
    const params = slug ? [slug] : [];
    const data = await runQuery(query, params);
    res.json(data);
});
router.post('/landing-pages', async (req, res) => { 
    const { name, slug, project_id, design_json, created_by } = req.body;
    console.log('🧠 [Quantum Proxy] /landing-pages (create) acionado');
    const data = await runQuery('INSERT INTO landing_pages (name, slug, project_id, design_json, created_by) VALUES ($1, $2, $3, $4, $5) RETURNING *', [name, slug, project_id, design_json, created_by]);
    res.status(201).json(data[0] || {});
});


// ============================================================
// 🔸 Rotas Simuladas (Placeholder de Compatibilidade)
// ============================================================
// 🔹 Catalog
router.post('/catalog/list', async (req, res) => {
  console.log('🧠 [Quantum Proxy] /catalog/list acionado');
  res.json([]);
});
router.post('/catalog/schema', async (req, res) => {
  console.log('🧠 [Quantum Proxy] /catalog/schema acionado');
  res.json({ fields: [] });
});
router.post('/catalog/get', async (req, res) => {
  console.log('🧠 [Quantum Proxy] /catalog/get acionado');
  res.json(null);
});

// 🔹 GenomIQ Modules
const genomIQModules = [
  'genomiq-action', 'genomiq-config', 'genomiq-decision-log',
  'genomiq-diagnostics', 'genomiq-event-log', 'genomiq-snapshot'
];

genomIQModules.forEach(mod => {
  router.post(`/${mod}/filter`, async (req, res) => {
    console.log(`🧠 [Quantum Proxy] /${mod}/filter acionado`);
    res.json([]);
  });
  router.post(`/${mod}`, async (req, res) => {
    console.log(`🧠 [Quantum Proxy] /${mod} (create) acionado`);
    res.json({ success: true });
  });
});

// 🔹 Automation Steps e Templates
['automation-steps', 'step-variations', 'templates'].forEach(mod => {
  router.post(`/${mod}/filter`, async (req, res) => {
    console.log(`🧠 [Quantum Proxy] /${mod}/filter acionado`);
    res.json([]);
  });
  router.post(`/${mod}`, async (req, res) => {
    console.log(`🧠 [Quantum Proxy] /${mod} (create) acionado`);
    res.json({ success: true });
  });
});

// ============================================================
// ✅ Exportação
// ============================================================
export default router;
