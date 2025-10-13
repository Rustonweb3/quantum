import express from 'express';
import morgan from 'morgan';
import helmet from 'helmet';
import cors from 'cors';
import pg from 'pg';

const app = express();

// --- CONFIGURAÇÃO DO SERVIDOR ---
app.use(cors({ origin: 'https://quantum-frontend-1l5.pages.dev' }));
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// --- CONEXÃO COM A BASE DE DADOS POSTGRESQL ---
const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// --- ARQUITETURA DO BANCO DE DADOS (CRIAÇÃO DAS "ESPERAS") ---
const initializeDatabase = async () => {
    const client = await pool.connect();
    try {
        console.log("✅ Conexão com a Fonte Soberana (PostgreSQL) estabelecida!");
        const createTable = async (tableName, schema) => {
            await client.query(`CREATE TABLE IF NOT EXISTS ${tableName} (${schema});`);
            console.log(`✅ Tabela '${tableName}' espelhada com sucesso.`);
        };

        // Tabelas espelhadas a partir do seu sistema funcional
        await createTable('funnel_projects', `id SERIAL PRIMARY KEY, name VARCHAR(255) NOT NULL, description TEXT, created_by VARCHAR(255), created_date TIMESTAMPTZ DEFAULT NOW()`);
        await createTable('automations', `id SERIAL PRIMARY KEY, name VARCHAR(255) NOT NULL, project_id INTEGER REFERENCES funnel_projects(id) ON DELETE CASCADE, landing_page_id INTEGER, thank_you_page_id INTEGER, trigger_tag VARCHAR(255), company_id VARCHAR(255), status VARCHAR(50) DEFAULT 'inactive', steps JSONB, created_date TIMESTAMPTZ DEFAULT NOW()`);
        await createTable('contacts', `id SERIAL PRIMARY KEY, email VARCHAR(255) UNIQUE NOT NULL, first_name VARCHAR(255), phone VARCHAR(50), tags TEXT[], source VARCHAR(255), created_date TIMESTAMPTZ DEFAULT NOW()`);
        await createTable('landing_pages', `id SERIAL PRIMARY KEY, name VARCHAR(255) NOT NULL, slug VARCHAR(255) UNIQUE NOT NULL, project_id INTEGER REFERENCES funnel_projects(id), design_json JSONB, created_by VARCHAR(255), created_date TIMESTAMPTZ DEFAULT NOW()`);
        await createTable('thank_you_pages', `id SERIAL PRIMARY KEY, name VARCHAR(255) NOT NULL, slug VARCHAR(255) UNIQUE NOT NULL, project_id INTEGER REFERENCES funnel_projects(id), design_json JSONB, created_by VARCHAR(255), created_date TIMESTAMPTZ DEFAULT NOW()`);
        await createTable('sales_pages', `id SERIAL PRIMARY KEY, name VARCHAR(255) NOT NULL, slug VARCHAR(255) UNIQUE NOT NULL, project_id INTEGER REFERENCES funnel_projects(id), design_json JSONB, created_by VARCHAR(255), created_date TIMESTAMPTZ DEFAULT NOW()`);
        await createTable('segments', `id SERIAL PRIMARY KEY, name VARCHAR(255) NOT NULL, rules JSONB, created_date TIMESTAMPTZ DEFAULT NOW()`);

        // Tabela CRÍTICA descoberta a partir da análise do seu Dashboard.jsx
        await createTable('page_visits', `id SERIAL PRIMARY KEY, contact_id INTEGER, page_slug VARCHAR(255), duration_seconds INTEGER, created_by VARCHAR(255), created_date TIMESTAMPTZ DEFAULT NOW()`);

    } catch (err) {
        console.error("❌ Erro catastrófico ao inicializar a Fonte Soberana:", err);
        process.exit(1);
    } finally {
        client.release();
    }
};

// --- FÁBRICA DE ROTAS DA API (O ENCAIXE DAS "ESPERAS") ---
const createEntityRoutes = (entityName) => {
    const tableName = entityName.replace(/-/g, '_');

    // Rota para BUSCAR/FILTRAR (espelha o método .filter())
    app.post(`/api/${entityName}/filter`, async (req, res) => {
        try {
            let query = `SELECT * FROM ${tableName}`;
            const filterKeys = Object.keys(req.body);
            const values = Object.values(req.body);

            if (filterKeys.length > 0) {
                const whereClauses = filterKeys.map((key, i) => `${key} = $${i + 1}`);
                query += ` WHERE ${whereClauses.join(' AND ')}`;
            }
            query += ` ORDER BY created_date DESC`;

            const result = await pool.query(query, values);
            res.status(200).json(result.rows);
        } catch (error) {
            console.error(`ERRO [filter] em ${tableName}:`, error);
            res.status(500).json({ error: `Erro ao buscar ${tableName}.` });
        }
    });

    // Rota para CRIAR (espelha o método .create())
    app.post(`/api/${entityName}`, async (req, res) => {
        try {
            const columns = Object.keys(req.body);
            const values = Object.values(req.body);
            if (columns.length === 0) {
                return res.status(400).json({ error: 'Nenhum dado fornecido para criação.' });
            }
            const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
            const query = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders}) RETURNING *`;
            const result = await pool.query(query, values);
            res.status(201).json(result.rows[0]);
        } catch (error) {
            console.error(`ERRO [create] em ${tableName}:`, error);
            res.status(500).json({ error: `Erro ao criar ${tableName}.` });
        }
    });
};

// --- ATIVAÇÃO DE TODAS AS ROTAS ESPELHADAS ---
app.get('/api/health', (req, res) => res.status(200).json({ status: 'UP' }));
const entities = [
    'funnel-projects', 'automations', 'contacts', 'landing-pages', 
    'thank-you-pages', 'sales-pages', 'segments', 'page-visits'
];
entities.forEach(createEntityRoutes);

// --- INICIALIZAÇÃO DO SERVIDOR ---
const PORT = process.env.PORT || 3001;
initializeDatabase().then(() => {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Servidor Espelho ATIVO e SOBERANO na porta ${PORT}`);
    });
});

export default app; 