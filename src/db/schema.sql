-- Quantum Integrum™ Schema - Etapa 1A
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ===========================
-- 1. FUNNEL PROJECTS
-- ===========================
CREATE TABLE IF NOT EXISTS public.funnel_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_by TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ===========================
-- 2. AUTOMATIONS
-- ===========================
CREATE TABLE IF NOT EXISTS public.automations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  funnel_project_id UUID REFERENCES public.funnel_projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'draft',
  config_json JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ===========================
-- 3. AUTOMATION STEPS
-- ===========================
CREATE TABLE IF NOT EXISTS public.automation_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  automation_id UUID REFERENCES public.automations(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  order_index INT DEFAULT 0,
  config_json JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ===========================
-- 4. STEP VARIATIONS
-- ===========================
CREATE TABLE IF NOT EXISTS public.step_variations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  step_id UUID REFERENCES public.automation_steps(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  weight NUMERIC DEFAULT 1,
  content_json JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ===========================
-- 5. TELEMETRY
-- ===========================
CREATE TABLE IF NOT EXISTS public.telemetry (
  id BIGSERIAL PRIMARY KEY,
  event TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id TEXT,
  payload_json JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Adicionando tabelas obrigatórias faltantes da diretriz anterior para consolidar o schema
-- ===========================
-- 6. CONTACTS
-- ===========================
CREATE TABLE IF NOT EXISTS public.contacts (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  first_name VARCHAR(255),
  phone VARCHAR(50),
  tags TEXT[],
  created_date TIMESTAMPTZ DEFAULT NOW(),
  source VARCHAR(255),
  country_code VARCHAR(10),
  city_area_code VARCHAR(10),
  status VARCHAR(50) DEFAULT 'lead',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================
-- 7. LANDING PAGES
-- ===========================
CREATE TABLE IF NOT EXISTS public.landing_pages (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  project_id INTEGER,
  design_json JSONB,
  created_by VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================
-- 8. THANK YOU PAGES
-- ===========================
CREATE TABLE IF NOT EXISTS public.thank_you_pages (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  project_id INTEGER,
  design_json JSONB,
  created_by VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================
-- 9. SALES PAGES
-- ===========================
CREATE TABLE IF NOT EXISTS public.sales_pages (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  project_id INTEGER,
  design_json JSONB,
  offer_json JSONB,
  created_by VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================
-- 10. PAGE VISITS
-- ===========================
CREATE TABLE IF NOT EXISTS public.page_visits (
  id SERIAL PRIMARY KEY,
  page_type VARCHAR(50) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  ip_address VARCHAR(64),
  user_agent TEXT,
  referrer TEXT,
  country VARCHAR(100),
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================
-- 11. VIDEO WATCH
-- ===========================
CREATE TABLE IF NOT EXISTS public.video_watch (
  id SERIAL PRIMARY KEY,
  video_id VARCHAR(255) NOT NULL,
  page_slug VARCHAR(255),
  user_id VARCHAR(255),
  event_type VARCHAR(50) NOT NULL, -- play, pause, complete, leave
  progress_seconds INTEGER DEFAULT 0,
  duration_seconds INTEGER DEFAULT 0,
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);