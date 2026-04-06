
-------- =============================================================================
-- PharmaLabel Designer — Supabase / PostgreSQL Setup Script
-- =============================================================================
-- Optimized for: Supabase (Auth, RLS, Realtime)
-- PostgreSQL Version: 15+
-- =============================================================================

-- ── 0.  Extensions & Schemas ──────────────────────────────────────────────────
-- Supabase usually has an 'extensions' schema.
CREATE SCHEMA IF NOT EXISTS "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA extensions;

-- Function for automatic updated_at timestamps
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- SECTION 1: CORE TABLES & AUTH PROFILES
-- =============================================================================

-- ── 1.1 roles ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.roles (
    id   UUID PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
    name VARCHAR(255) UNIQUE NOT NULL
);

-- ── 1.2 users (Profile Table) ─────────────────────────────────────────────────
-- In Supabase, the primary user data is in auth.users. 
-- This public.users table acts as a profile linked to Supabase Auth.
CREATE TABLE IF NOT EXISTS public.users (
    id                    UUID        PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
    username              VARCHAR(255) NOT NULL UNIQUE,
    email                 VARCHAR(255) NOT NULL UNIQUE,
    password_hash         VARCHAR(255),
    role_id               UUID        REFERENCES public.roles(id),
    status                VARCHAR(255) DEFAULT 'ACTIVE',
    failed_login_attempts INTEGER     DEFAULT 0,
    locked_until          TIMESTAMPTZ,
    password_changed_at   TIMESTAMPTZ DEFAULT now(),
    must_change_password  BOOLEAN     DEFAULT true,
    created_at            TIMESTAMPTZ DEFAULT now()
);

-- ── 1.3 permissions ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.permissions (
    id      UUID        PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
    role_id UUID        REFERENCES public.roles(id) ON DELETE CASCADE,
    module  VARCHAR(255) NOT NULL,
    event   VARCHAR(255) NOT NULL,
    allowed BOOLEAN     DEFAULT true
);

-- =============================================================================
-- SECTION 2: SETUP MASTER TABLES
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.languages (
    id                 UUID PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
    name               VARCHAR(255) NOT NULL,
    code               VARCHAR(255) NOT NULL UNIQUE,
    direction          VARCHAR(255) CHECK (direction IN ('LTR', 'RTL')),
    status             VARCHAR(255) DEFAULT 'ACTIVE',
    country_code       VARCHAR(255),
    currency_symbol    VARCHAR(255),
    date_format        VARCHAR(255),
    is_default_variant BOOLEAN DEFAULT false,
    parent_language_id UUID REFERENCES public.languages(id),
    region_name        VARCHAR(255),
    time_format        VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS public.label_stocks (
    id                UUID PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
    stock_id          VARCHAR(255) NOT NULL,
    name              VARCHAR(255) NOT NULL UNIQUE,
    breadth           NUMERIC NOT NULL,
    length            NUMERIC,
    height            NUMERIC,
    description       VARCHAR(255),
    quantity_on_hand  NUMERIC DEFAULT 0,
    reorder_level     NUMERIC DEFAULT 0,
    max_stock_level   NUMERIC,
    unit_of_measure   VARCHAR(255) DEFAULT 'EA',
    status            VARCHAR(255) DEFAULT 'ACTIVE' CHECK (status IN ('DRAFT', 'ACTIVE', 'RETIRED')),
    supplier          VARCHAR(255),
    cost_center       VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS public.objects (
    id                UUID PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
    name              VARCHAR(255) NOT NULL,
    type              VARCHAR(255),
    file_url          VARCHAR(255),
    status            TEXT DEFAULT 'ACTIVE',
    activation_status VARCHAR(255) DEFAULT 'DRAFT',
    description       TEXT,
    metadata          JSONB,
    tags              VARCHAR(255),
    version           INTEGER DEFAULT 1,
    parent_id         UUID REFERENCES public.objects(id),
    label_id          UUID, -- Refers to public.labels(id) but added later for cycle
    created_at        TIMESTAMP DEFAULT now(),
    updated_at        TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.placeholders (
    id            UUID PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
    name          VARCHAR(255) NOT NULL,
    type          VARCHAR(255) CHECK (type IN ('DATA', 'FREE_TEXT', 'RUNTIME', 'VISIT')),
    mapping_key   VARCHAR(255) UNIQUE,
    format_rules  JSONB,
    default_value VARCHAR(255),
    description   VARCHAR(255),
    status        VARCHAR(255) DEFAULT 'ACTIVE'
);

CREATE TABLE IF NOT EXISTS public.phrases (
    id           UUID PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
    phrase_key   VARCHAR(255) UNIQUE NOT NULL,
    default_text VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS public.translations (
    id              UUID PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
    phrase_id       UUID REFERENCES public.phrases(id) ON DELETE CASCADE,
    language_id     UUID REFERENCES public.languages(id) ON DELETE CASCADE,
    translated_text VARCHAR(255),
    UNIQUE(phrase_id, language_id)
);

-- =============================================================================
-- SECTION 3: LABEL DESIGN TABLES
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.labels (
    id             UUID        PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
    name           VARCHAR(255) NOT NULL,
    brand          VARCHAR(255),
    category       VARCHAR(255),
    image_url      VARCHAR(255),
    label_stock_id UUID        REFERENCES public.label_stocks(id),
    created_by     UUID        REFERENCES public.users(id),
    status         VARCHAR(255) DEFAULT 'DRAFT',
    notes          TEXT,
    created_at     TIMESTAMPTZ DEFAULT now(),
    updated_at     TIMESTAMPTZ DEFAULT now()
);

-- Circular references for objects
ALTER TABLE public.objects ADD CONSTRAINT objects_label_id_fkey FOREIGN KEY (label_id) REFERENCES public.labels(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS public.label_versions (
    id            UUID        PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
    label_id      UUID        REFERENCES public.labels(id) ON DELETE CASCADE,
    version_no    INTEGER     NOT NULL,
    design_json   JSONB       NOT NULL,
    created_by    UUID        REFERENCES public.users(id),
    created_at    TIMESTAMPTZ DEFAULT now(),
    UNIQUE(label_id, version_no)
);

-- ── 3.3 Automate Updated At ───────────────────────────────────────────────────
CREATE OR REPLACE TRIGGER trigger_update_labels
  BEFORE UPDATE ON public.labels
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =============================================================================
-- SECTION 4: WORKFLOW & SYSTEM TABLES
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.approvals (
    id           UUID        PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
    label_id     UUID        REFERENCES public.labels(id) ON DELETE CASCADE,
    version_no   INTEGER     NOT NULL,
    status       VARCHAR(255) DEFAULT 'PENDING',
    requested_by UUID        REFERENCES public.users(id),
    approved_by  UUID        REFERENCES public.users(id),
    comments     VARCHAR(255),
    created_at   TIMESTAMPTZ DEFAULT now(),
    approved_at  TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.electronic_signatures (
    id          UUID        PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
    user_id     UUID        REFERENCES public.users(id),
    entity_type VARCHAR(255) NOT NULL,
    entity_id   UUID        NOT NULL,
    meaning     VARCHAR(255) NOT NULL,
    signed_at   TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id         UUID        PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
    user_id    UUID        REFERENCES public.users(id),
    action     VARCHAR(255) NOT NULL,
    module     VARCHAR(255) NOT NULL,
    entity_id  UUID,
    old_data   JSONB,
    new_data   JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.system_config (
    id           UUID        PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
    config_key   VARCHAR(255) NOT NULL UNIQUE,
    config_value VARCHAR(255),
    updated_at   TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_auth_tokens (
    id         UUID        PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
    user_id    UUID        REFERENCES public.users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    family_id  UUID        NOT NULL,
    revoked    BOOLEAN     DEFAULT false,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_sessions (
    id                    UUID        PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
    user_id               VARCHAR(255) UNIQUE NOT NULL,
    dashboard_preferences JSONB,
    recent_activity_log   JSONB,
    last_accessed        TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.print_requests (
    id              UUID        PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
    label_id        UUID        REFERENCES public.labels(id) ON DELETE CASCADE,
    label_stock_id  UUID        REFERENCES public.label_stocks(id) ON DELETE CASCADE,
    quantity        INTEGER     NOT NULL CHECK (quantity > 0),
    printer_name    VARCHAR(255),
    status          VARCHAR(255) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'CANCELLED')),
    requested_by_id UUID        REFERENCES public.users(id) ON DELETE SET NULL,
    requested_at    TIMESTAMPTZ DEFAULT now()
);

-- =============================================================================
-- SECTION 5: ROW LEVEL SECURITY (RLS)
-- =============================================================================

-- Enable RLS on all public tables (If supported by local PG version, otherwise ignore)
DO $$ 
BEGIN
  ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.languages ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.label_stocks ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.objects ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.placeholders ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.phrases ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.translations ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.labels ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.label_versions ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.approvals ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.electronic_signatures ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.print_requests ENABLE ROW LEVEL SECURITY;
EXCEPTION
  WHEN OTHERS THEN 
    RAISE NOTICE 'RLS not supported or error enabling RLS. Skipping.';
END $$;

-- ── 5.1 Basic Access Policies ───────────────────────────────────────────────

-- Helper function to simulate Supabase auth.uid() locally if needed
CREATE OR REPLACE FUNCTION auth.uid() RETURNS UUID AS $$
  -- Replace with your session-based logic or a mock UUID for local testing
  SELECT NULL::UUID;
$$ LANGUAGE sql STABLE;

-- Roles: Read-only for authenticated
CREATE POLICY "Public Roles - Select" ON public.roles FOR SELECT USING (true);

-- Users Profile
CREATE POLICY "Users Profile - Select" ON public.users FOR SELECT USING (true);
-- To work locally, we might skip the check or use the mock auth.uid()
-- CREATE POLICY "Users Profile - Update" ON public.users FOR UPDATE USING (auth.uid() = id);

-- Labels
CREATE POLICY "Labels - Access" ON public.labels FOR ALL USING (true);
CREATE POLICY "Label Versions - Access" ON public.label_versions FOR ALL USING (true);

-- Master Data
CREATE POLICY "Languages - Select" ON public.languages FOR SELECT USING (true);
CREATE POLICY "Label Stocks - Select" ON public.label_stocks FOR SELECT USING (true);
CREATE POLICY "Objects - Select" ON public.objects FOR SELECT USING (true);
CREATE POLICY "Placeholders - Select" ON public.placeholders FOR SELECT USING (true);

-- Audit Logs
CREATE POLICY "Audit Logs - Access" ON public.audit_logs FOR ALL USING (true);

-- Print Requests
CREATE POLICY "Print Requests - Access" ON public.print_requests FOR ALL USING (true);

-- =============================================================================
-- SECTION 8: SEED DATA
-- =============================================================================

-- Roles
INSERT INTO public.roles (id, name) VALUES
  ('d68e4294-eff5-4f3a-b6c2-3adff348e863', 'ADMIN'),
  ('0446db85-60cd-4f5e-8125-b049531c7716', 'REVIEWER'),
  ('39c97678-04c1-4d46-932d-959502633631', 'DESIGNER')
ON CONFLICT (name) DO NOTHING;

-- Languages
INSERT INTO public.languages (name, code, direction, status) VALUES
  ('English', 'en', 'LTR', 'ACTIVE'),
  ('Spanish', 'es', 'LTR', 'ACTIVE')
ON CONFLICT (code) DO NOTHING;

-- System Config
INSERT INTO public.system_config (config_key, config_value) VALUES
  ('sod.prevent_same_user_approve', 'true'),
  ('audit.log_limit_days', '365')
ON CONFLICT (config_key) DO NOTHING;
