-- =============================================================================
-- PharmaLabel Designer — Supabase / PostgreSQL Setup Script
-- =============================================================================
-- Optimized for: Supabase (Auth, RLS, Realtime)
-- PostgreSQL Version: 15+
-- =============================================================================

-- ── 0.  Extensions & Schemas ──────────────────────────────────────────────────
-- Supabase usually has an 'extensions' schema. We ensure pgcrypto is available.
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
    name TEXT UNIQUE NOT NULL
);

-- ── 1.2 users (Profile Table) ─────────────────────────────────────────────────
-- In Supabase, the primary user data is in auth.users. 
-- This public.users table acts as a profile linked to Supabase Auth.
CREATE TABLE IF NOT EXISTS public.users (
    id                    UUID        PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
    username              TEXT        NOT NULL UNIQUE,
    email                 TEXT        NOT NULL UNIQUE,
    password_hash         TEXT,
    role_id               UUID        REFERENCES public.roles(id),
    status                TEXT        DEFAULT 'ACTIVE',
    failed_login_attempts INTEGER     DEFAULT 0,
    locked_until          TIMESTAMPTZ,
    password_changed_at   TIMESTAMPTZ DEFAULT now(),
    must_change_password  BOOLEAN     DEFAULT true,
    created_at            TIMESTAMPTZ DEFAULT now()
);

-- ── 1.3 permissions ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.permissions (
    id      UUID    PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
    role_id UUID    REFERENCES public.roles(id) ON DELETE CASCADE,
    module  TEXT    NOT NULL,
    event   TEXT    NOT NULL,
    allowed BOOLEAN DEFAULT true
);

-- =============================================================================
-- SECTION 2: SETUP MASTER TABLES
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.languages (
    id                 UUID PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
    name               TEXT NOT NULL,
    code               TEXT NOT NULL UNIQUE,
    direction          TEXT CHECK (direction IN ('LTR', 'RTL')),
    status             TEXT DEFAULT 'ACTIVE',
    country_code       TEXT,
    currency_symbol    TEXT,
    date_format        TEXT,
    is_default_variant BOOLEAN DEFAULT false,
    parent_language_id UUID REFERENCES public.languages(id),
    region_name        TEXT,
    time_format        TEXT
);

CREATE TABLE IF NOT EXISTS public.label_stocks (
    id                UUID PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
    stock_id          TEXT NOT NULL,
    name              TEXT NOT NULL UNIQUE,
    breadth           NUMERIC NOT NULL,
    length            NUMERIC,
    height            NUMERIC,
    description       TEXT,
    quantity_on_hand  NUMERIC DEFAULT 0,
    reorder_level     NUMERIC DEFAULT 0,
    max_stock_level   NUMERIC,
    unit_of_measure   TEXT DEFAULT 'EA',
    status            TEXT DEFAULT 'ACTIVE' CHECK (status IN ('DRAFT', 'ACTIVE', 'RETIRED')),
    supplier          TEXT,
    cost_center       TEXT
);

CREATE TABLE IF NOT EXISTS public.objects (
    id                UUID PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
    name              TEXT NOT NULL,
    type              TEXT,
    file_url          TEXT,
    status            TEXT DEFAULT 'ACTIVE',
    activation_status TEXT DEFAULT 'DRAFT',
    description       TEXT,
    metadata          JSONB,
    tags              TEXT,
    version           INTEGER DEFAULT 1,
    parent_id         UUID REFERENCES public.objects(id),
    label_id          UUID, -- Refers to public.labels(id) but added later for cycle
    created_at        TIMESTAMPTZ DEFAULT now(),
    updated_at        TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.placeholders (
    id            UUID PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
    name          TEXT NOT NULL,
    type          TEXT CHECK (type IN ('DATA', 'FREE_TEXT', 'RUNTIME', 'VISIT')),
    mapping_key   TEXT UNIQUE,
    format_rules  JSONB,
    default_value TEXT,
    description   TEXT,
    status        TEXT DEFAULT 'ACTIVE'
);

CREATE TABLE IF NOT EXISTS public.phrases (
    id           UUID PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
    phrase_key   TEXT UNIQUE NOT NULL,
    default_text TEXT
);

CREATE TABLE IF NOT EXISTS public.translations (
    id              UUID PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
    phrase_id       UUID REFERENCES public.phrases(id) ON DELETE CASCADE,
    language_id     UUID REFERENCES public.languages(id) ON DELETE CASCADE,
    translated_text TEXT,
    UNIQUE(phrase_id, language_id)
);

-- =============================================================================
-- SECTION 3: LABEL DESIGN TABLES
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.labels (
    id             UUID        PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
    name           TEXT        NOT NULL,
    brand          TEXT,
    category       TEXT,
    image_url      TEXT,
    label_stock_id UUID        REFERENCES public.label_stocks(id),
    created_by     UUID        REFERENCES public.users(id),
    status         TEXT        DEFAULT 'DRAFT',
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
    notes         TEXT,
    created_by    UUID        REFERENCES public.users(id),
    created_at    TIMESTAMPTZ DEFAULT now(),
    UNIQUE(label_id, version_no)
);

-- ── 3.3 Automate Updated At ───────────────────────────────────────────────────
CREATE TRIGGER trigger_update_labels
  BEFORE UPDATE ON public.labels
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =============================================================================
-- SECTION 4: WORKFLOW & SYSTEM TABLES
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.approvals (
    id           UUID        PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
    label_id     UUID        REFERENCES public.labels(id) ON DELETE CASCADE,
    version_no   INTEGER     NOT NULL,
    status       TEXT        DEFAULT 'PENDING',
    requested_by UUID        REFERENCES public.users(id),
    approved_by  UUID        REFERENCES public.users(id),
    comments     TEXT,
    created_at   TIMESTAMPTZ DEFAULT now(),
    approved_at  TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.electronic_signatures (
    id          UUID        PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
    user_id     UUID        REFERENCES public.users(id),
    entity_type TEXT        NOT NULL,
    entity_id   UUID        NOT NULL,
    meaning     TEXT        NOT NULL,
    signed_at   TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id         UUID        PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
    user_id    UUID        REFERENCES public.users(id),
    action     TEXT        NOT NULL,
    module     TEXT        NOT NULL,
    entity_id  UUID,
    old_data   JSONB,
    new_data   JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.system_config (
    id           UUID        PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
    config_key   TEXT        NOT NULL UNIQUE,
    config_value TEXT,
    updated_at   TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_auth_tokens (
    id         UUID        PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
    user_id    UUID        REFERENCES public.users(id) ON DELETE CASCADE,
    token_hash TEXT        NOT NULL,
    family_id  UUID        NOT NULL,
    revoked    BOOLEAN     DEFAULT false,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_sessions (
    id                    UUID        PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
    user_id               TEXT        UNIQUE NOT NULL,
    dashboard_preferences JSONB,
    recent_activity_log   JSONB,
    last_accessed        TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.print_requests (
    id              UUID        PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
    label_id        UUID        REFERENCES public.labels(id) ON DELETE CASCADE,
    label_stock_id  UUID        REFERENCES public.label_stocks(id) ON DELETE CASCADE,
    quantity        INTEGER     NOT NULL CHECK (quantity > 0),
    printer_name    TEXT,
    status          TEXT        DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'CANCELLED')),
    requested_by_id UUID        REFERENCES public.users(id) ON DELETE SET NULL,
    requested_at    TIMESTAMPTZ DEFAULT now()
);

-- =============================================================================
-- SECTION 5: ROW LEVEL SECURITY (RLS)
-- =============================================================================

-- Enable RLS on all public tables
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

-- ── 5.1 Basic Access Policies (Standard Authenticated Access) ───────────────

-- Roles: Read-only for authenticated users, full access for service role/admins
CREATE POLICY "Public Roles - Select" ON public.roles FOR SELECT USING (true);

-- Users Profile: Users can see all profiles but only update their own
CREATE POLICY "Users Profile - Select" ON public.users FOR SELECT USING (true);
CREATE POLICY "Users Profile - Update" ON public.users FOR UPDATE USING (auth.uid() = id);

-- Labels: Authenticated users can read/write labels
CREATE POLICY "Labels - Access" ON public.labels FOR ALL TO authenticated USING (true);
CREATE POLICY "Label Versions - Access" ON public.label_versions FOR ALL TO authenticated USING (true);

-- Master Data Policies
CREATE POLICY "Languages - Authenticated Select" ON public.languages FOR SELECT USING (true);
CREATE POLICY "Label Stocks - Authenticated Select" ON public.label_stocks FOR SELECT USING (true);
CREATE POLICY "Objects - Authenticated Select" ON public.objects FOR SELECT USING (true);
CREATE POLICY "Placeholders - Authenticated Select" ON public.placeholders FOR SELECT USING (true);

-- Audit Logs: Insert only for authenticated users (system logs)
CREATE POLICY "Audit Logs - Insert" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Audit Logs - Select" ON public.audit_logs FOR SELECT TO authenticated USING (true);

-- Print Requests
CREATE POLICY "Print Requests - Access" ON public.print_requests FOR ALL TO authenticated USING (true);

-- =============================================================================
-- SECTION 6: AUTH AUTOMATION (Supabase Trigger)
-- =============================================================================

-- Function to handle new user joins via Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, username, email, role_id)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'username', new.email), 
    new.email,
    '39c97678-04c1-4d46-932d-959502633631' -- Default to 'DESIGNER' role
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to call the function on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================================================
-- SECTION 7: REALTIME ENABLEMENT
-- =============================================================================

-- Enable Realtime for standard clinical tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.labels;
ALTER PUBLICATION supabase_realtime ADD TABLE public.label_versions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.audit_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.system_config;

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
