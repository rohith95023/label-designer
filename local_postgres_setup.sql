-- =============================================================================
-- PharmaLabel Designer — Supabase / PostgreSQL Setup Script
-- =============================================================================
-- Optimized for: Supabase (Auth, RLS, Realtime)
-- PostgreSQL Version: 15+
-- =============================================================================

-- ── 0.  Extensions & Schemas ──────────────────────────────────────────────────
-- Supabase usually has an 'extensions' schema. We ensure pgcrypto is available.
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA extensions;

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
    id                    UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username              TEXT        NOT NULL UNIQUE,
    email                 TEXT        NOT NULL UNIQUE,
    role_id               UUID        REFERENCES public.roles(id),
    status                TEXT        DEFAULT 'ACTIVE',
    failed_login_attempts INTEGER     DEFAULT 0,
    locked_until          TIMESTAMPTZ,
    password_changed_at   TIMESTAMPTZ DEFAULT now(),
    must_change_password  BOOLEAN     DEFAULT false,
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
    id        UUID PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
    name      TEXT NOT NULL,
    code      TEXT NOT NULL UNIQUE,
    direction TEXT CHECK (direction IN ('LTR', 'RTL')),
    status    TEXT DEFAULT 'ACTIVE'
);

CREATE TABLE IF NOT EXISTS public.label_stocks (
    id          UUID PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
    name        TEXT NOT NULL,
    length      NUMERIC,
    width       NUMERIC,
    height      NUMERIC,
    description TEXT
);

CREATE TABLE IF NOT EXISTS public.objects (
    id       UUID PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
    name     TEXT NOT NULL,
    type     TEXT,
    file_url TEXT,
    status   TEXT DEFAULT 'ACTIVE',
    label_id UUID  -- Optional: link to a specific label if it's a dedicated asset
);

CREATE TABLE IF NOT EXISTS public.placeholders (
    id           UUID PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
    name         TEXT NOT NULL,
    type         TEXT CHECK (type IN ('DATA', 'FREE_TEXT', 'RUNTIME', 'VISIT')),
    mapping_key  TEXT UNIQUE,
    format_rules JSONB
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
    created_at     TIMESTAMPTZ DEFAULT now(),
    updated_at     TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.label_versions (
    id            UUID        PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
    label_id      UUID        REFERENCES public.labels(id) ON DELETE CASCADE,
    version_no    INTEGER     NOT NULL,
    design_json   JSONB       NOT NULL,
    created_by    UUID        REFERENCES public.users(id),
    created_at    TIMESTAMPTZ DEFAULT now(),
    UNIQUE(label_id, version_no)
);

-- =============================================================================
-- SECTION 4: WORKFLOW & SYSTEM TABLES
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.approvals (
    id          UUID        PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
    entity_type TEXT        NOT NULL,
    entity_id   UUID        NOT NULL,
    status      TEXT        DEFAULT 'PENDING',
    approved_by UUID        REFERENCES public.users(id),
    approved_at TIMESTAMPTZ
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

-- ── 5.1 Basic Access Policies (Standard Authenticated Access) ───────────────

-- Roles: Read-only for authenticated users, full access for service role/admins
CREATE POLICY "Public Roles - Select" ON public.roles FOR SELECT USING (true);

-- Users Profile: Users can see all profiles but only update their own
CREATE POLICY "Users Profile - Select" ON public.users FOR SELECT USING (true);
CREATE POLICY "Users Profile - Update" ON public.users FOR UPDATE USING (auth.uid() = id);

-- Labels: Authenticated users can read/write labels
CREATE POLICY "Labels - Access" ON public.labels FOR ALL TO authenticated USING (true);
CREATE POLICY "Label Versions - Access" ON public.label_versions FOR ALL TO authenticated USING (true);

-- Master Data: Read-only for authenticated, write for admins (heuristic policy)
CREATE POLICY "Master Data - Select" ON public.languages FOR SELECT USING (true);
CREATE POLICY "Master Data - Select" ON public.label_stocks FOR SELECT USING (true);
CREATE POLICY "Master Data - Select" ON public.objects FOR SELECT USING (true);
CREATE POLICY "Master Data - Select" ON public.placeholders FOR SELECT USING (true);

-- Audit Logs: Insert only for authenticated users (system logs)
CREATE POLICY "Audit Logs - Insert" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Audit Logs - Select" ON public.audit_logs FOR SELECT TO authenticated USING (true);

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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================================================
-- SECTION 7: SEED DATA
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
