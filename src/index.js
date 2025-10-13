import express from 'express';
import morgan from 'morgan';
import helmet from 'helmet';
import cors from 'cors';
import pg from 'pg';

const app = express();

// --- CONFIGURAÇÃO INICIAL ---
const corsOptions = {
  origin: 'https://quantum-frontend-1l5.pages.dev'
};
app.use(cors(corsOptions));
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// --- CONEXÃO COM A FONTE SOBERANA (BASE DE DADOS) ---
const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// --- INICIALIZAÇÃO E CRIAÇÃO DE TODAS AS TABELAS ---
const initializeDatabase = async () => {
    const client = await pool.connect();
    try {
        console.log("✅ Conexão com a Fonte Soberana (PostgreSQL) estabelecida!");

        // Tabela de Projetos (O Objeto MACRO)
        await client.query(`
            CREATE TABLE IF NOT EXISTS funnel_projects (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                created_date TIMESTAMPTZ DEFAULT NOW()
            );
        `);
        console.log("✅ Tabela 'funnel_projects' verificada.");

        // Tabela de Automações/Funis
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
        console.log("✅ Tabela 'automations' verificada.");
        
        // Tabela de Contatos
        await client.query(`
            CREATE TABLE IF NOT EXISTS contacts (
                id SERIAL PRIMARY KEY, email VARCHAR(255) UNIQUE NOT NULL, first_name VARCHAR(255),
                phone VARCHAR(50), tags TEXT[], created_date TIMESTAMPTZ DEFAULT NOW(),
                source VARCHAR(255), country_code VARCHAR(10), city_area_code VARCHAR(10)
            );
        `);
        console.log("✅ Tabela 'contacts' verificada.");

        // Tabela de Landing Pages
        await client.query(`
            CREATE TABLE IF NOT EXISTS landing_pages (
                id SERIAL PRIMARY KEY, name VARCHAR(255) NOT NULL, slug VARCHAR(255) UNIQUE NOT NULL,
                project_id INTEGER REFERENCES funnel_projects(id), design_json JSONB, created_date TIMESTAMPTZ DEFAULT NOW()
            );
        `);
        console.log("✅ Tabela 'landing_pages' verificada.");

        // Tabela de Sales Pages
        await client.query(`
            CREATE TABLE IF NOT EXISTS sales_pages (
                id SERIAL PRIMARY KEY, name VARCHAR(255) NOT NULL, slug VARCHAR(255) UNIQUE NOT NULL,
                project_id INTEGER REFERENCES funnel_projects(id), design_json JSONB, created_date TIMESTAMPTZ DEFAULT NOW()
            );
        `);
        console.log("✅ Tabela 'sales_pages' verificada.");

        // Tabela de Thank You Pages
        await client.query(`
            CREATE TABLE IF NOT EXISTS thank_you_pages (
                id SERIAL PRIMARY KEY, name VARCHAR(255) NOT NULL, slug VARCHAR(255) UNIQUE NOT NULL,
                project_id INTEGER REFERENCES funnel_projects(id), design_json JSONB, created_date TIMESTAMPTZ DEFAULT NOW()
            );
        `);
        console.log("✅ Tabela 'thank_you_pages' verificada.");

        // Tabela de Segmentos
         await client.query(`
            CREATE TABLE IF NOT EXISTS segments (
                id SERIAL PRIMARY KEY, name VARCHAR(255) NOT NULL, rules JSONB,
                created_date TIMESTAMPTZ DEFAULT NOW()
            );
        `);
        console.log("✅ Tabela 'segments' verificada.");


    } catch (err) {
        console.error("❌ Erro catastrófico ao inicializar a Fonte Soberana:", err);
        process.exit(1);
    } finally {
        client.release();
    }
};

// --- FÁBRICA DE ROTAS DA API (PARA EVITAR REPETIÇÃO) ---
const createEntityRoutes = (entityName) => {
    const tableName = entityName.replace('-', '_');
    
    // Rota para buscar/filtrar
    app.post(`/api/${entityName}/filter`, async (req, res) => {
        try {
            // Adicionar lógica de filtro real aqui se necessário. Por agora, lista todos.
            const result = await pool.query(`SELECT * FROM ${tableName} ORDER BY created_date DESC`);
            res.status(200).json(result.rows);
        } catch (error) {
            console.error(`Erro ao buscar '${tableName}':`, error);
            res.status(500).json({ error: `Erro ao buscar ${tableName}.` });
        }
    });

    // Rota para criar
    app.post(`/api/${entityName}`, async (req, res) => {
        try {
            const columns = Object.keys(req.body);
            const values = Object.values(req.body);
            const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');

            const query = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders}) RETURNING *`;
            
            const result = await pool.query(query, values);
            res.status(201).json(result.rows[0]);
        } catch (error) {
            console.error(`Erro ao criar '${tableName}':`, error);
            res.status(500).json({ error: `Erro ao criar ${tableName}.` });
        }
    });
};


// --- ATIVAÇÃO DE TODAS AS ROTAS ---
app.get('/api/health', (req, res) => res.status(200).json({ status: 'UP' }));

createEntityRoutes('funnel-projects');
createEntityRoutes('automations');
createEntityRoutes('contacts');
createEntityRoutes('landing-pages');
createEntityRoutes('sales-pages');
createEntityRoutes('thank-you-pages');
createEntityRoutes('segments');


// --- INICIALIZAÇÃO DO SERVIDOR ---
const PORT = process.env.PORT || 3001;
initializeDatabase().then(() => {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Servidor Soberano ATIVO e com todas as rotas operacionais na porta ${PORT}`);
    });
});

export default app;