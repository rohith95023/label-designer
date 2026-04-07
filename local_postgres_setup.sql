
-------- =============================================================================
-- PharmaLabel Designer — PostgreSQL / PostgreSQL Setup Script
-- =============================================================================
-- Optimized for: PostgreSQL (Auth, RLS, Realtime)
-- PostgreSQL Version: 15+
-- =============================================================================

-- ── 0.  Extensions & Schemas ──────────────────────────────────────────────────
-- PostgreSQL usually has an 'extensions' schema.
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
-- In PostgreSQL, the primary user data is in auth.users. 
-- This public.users table acts as a profile linked to PostgreSQL Auth.
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
  ALTER TABLE public.user_auth_tokens ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
EXCEPTION
  WHEN OTHERS THEN 
    RAISE NOTICE 'RLS not supported or error enabling RLS. Skipping.';
END $$;

-- ── 5.1 Basic Access Policies ───────────────────────────────────────────────

-- Helper function to simulate PostgreSQL auth.uid() locally if needed
CREATE SCHEMA IF NOT EXISTS "auth";
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

-- =============================================================================
-- SECTION 8: SEED DATA
-- =============================================================================

-- ── 8.1 Roles ────────────────────────────────────────────────────────────────
INSERT INTO public.roles (name) VALUES
  ('ADMIN'),
  ('REVIEWER'),
  ('OPERATOR'),
  ('EXTERNAL'),
  ('DESIGNER'),
  ('QA_OFFICER'),
  ('STUDY_MANAGER'),
  ('PRINT_OPERATOR')
ON CONFLICT (name) DO NOTHING;

-- ── 8.2 Languages ─────────────────────────────────────────────────────────────
INSERT INTO public.languages (name, code, direction, status) VALUES
  ('English', 'en', 'LTR', 'ACTIVE'),
  ('Spanish', 'es', 'LTR', 'ACTIVE'),
  ('Arabic', 'ar', 'RTL', 'ACTIVE'),
  ('French', 'fr', 'LTR', 'ACTIVE'),
  ('German', 'de', 'LTR', 'ACTIVE'),
  ('Hindi', 'hi', 'LTR', 'ACTIVE'),
  ('Telugu', 'te', 'LTR', 'ACTIVE')
ON CONFLICT (code) DO NOTHING;

-- ── 8.3 Placeholders ─────────────────────────────────────────────────────────
INSERT INTO public.placeholders (name, mapping_key, type, default_value, description) VALUES
  ('Protocol Number', 'PROTOCOL_NO', 'DATA', 'CL-2024-V91', 'Clinical study protocol reference'),
  ('Patient ID', 'PATIENT_ID', 'DATA', 'P-882931', 'Unique participant identifier'),
  ('Medication Name', 'MEDICATION', 'DATA', 'Methylprednisolone IP', 'Drug product designation'),
  ('Strength', 'STRENGTH', 'DATA', '40 mg / mL', 'Concentration or potency'),
  ('Dosage Form', 'DOSAGE', 'DATA', '10 mL Injection', 'Administration format'),
  ('Expiry Date', 'EXP_DATE', 'DATA', '2027-02-15', 'Product expiration date'),
  ('Manufacturing Date', 'MFG_DATE', 'DATA', '2024-02-15', 'Production date'),
  ('Route of Admin', 'ROUTE', 'DATA', 'Subcutaneous', 'Administration method'),
  ('Batch Number', 'BATCH_NO', 'DATA', 'BATCH-XQ102', 'Manufacturing batch ID'),
  ('Site Name', 'SITE_NAME', 'DATA', 'St. Jude Research Center', 'Clinical trial site location'),
  ('Sponsor Name', 'SPONSOR', 'DATA', 'PharmaCore Solutions', 'Study sponsor entity'),
  ('Manufacturing Lic No', 'MFG_LIC_NO', 'DATA', 'MFG/2024/99182', 'Regulated license reference'),
  ('Custom Note', 'CUSTOM_NOTE', 'FREE_TEXT', 'Sample clinical note', 'User-defined note field')
ON CONFLICT (mapping_key) DO NOTHING;

-- ── 8.4 Label Stocks ─────────────────────────────────────────────────────────
INSERT INTO public.label_stocks (stock_id, name, breadth, length, description, status) VALUES
  ('STK-100-50', 'Standard Vial (100x50mm)', 100, 50, 'Standard adhesive vial label', 'ACTIVE'),
  ('STK-75-25', 'Syringe Wrap (75x25mm)', 75, 25, 'Thin wrap-around syringe label', 'ACTIVE'),
  ('STK-150-100', 'Carton Box (150x100mm)', 150, 100, 'Large cardboard carton label', 'ACTIVE'),
  ('STK-50-50', 'Square Ampoule (50x50mm)', 50, 50, 'Small square ampoule label', 'ACTIVE')
ON CONFLICT (name) DO NOTHING;

-- ── 8.5 Phrases ──────────────────────────────────────────────────────────────
INSERT INTO public.phrases (phrase_key, default_text) VALUES
  ('WARNING_KEEP_REACH', 'Keep out of reach of children.'),
  ('WARNING_RESTRICTED', 'For Clinical Trial Use Only.'),
  ('STORE_CONDITION', 'Store at 2°C to 8°C. Do not freeze.'),
  ('WARNING_DO_NOT_CONSUME', 'Do not consume directly. For external use only.')
ON CONFLICT (phrase_key) DO NOTHING;

-- ── 8.6 Translations ─────────────────────────────────────────────────────────

-- English
INSERT INTO public.translations (phrase_id, language_id, translated_text)
SELECT p.id, l.id, p.default_text
FROM public.phrases p, public.languages l
WHERE l.code = 'en'
ON CONFLICT (phrase_id, language_id) DO NOTHING;

-- Hindi
INSERT INTO public.translations (phrase_id, language_id, translated_text)
SELECT p.id, l.id, 
  CASE p.phrase_key
    WHEN 'WARNING_KEEP_REACH' THEN 'बच्चों की पहुँच से दूर रखें।'
    WHEN 'WARNING_RESTRICTED' THEN 'केवल नैदानिक ​​​​परीक्षण उपयोग के लिए।'
    WHEN 'STORE_CONDITION' THEN '2°C से 8°C पर स्टोर करें। फ्रीज न करें।'
    ELSE NULL
  END
FROM public.phrases p, public.languages l
WHERE l.code = 'hi' AND p.phrase_key IN ('WARNING_KEEP_REACH', 'WARNING_RESTRICTED', 'STORE_CONDITION')
ON CONFLICT (phrase_id, language_id) DO NOTHING;

-- Spanish
INSERT INTO public.translations (phrase_id, language_id, translated_text)
SELECT p.id, l.id, 
  CASE p.phrase_key
    WHEN 'WARNING_KEEP_REACH' THEN 'Mantener fuera del alcance de los niños.'
    WHEN 'WARNING_RESTRICTED' THEN 'Solo para uso en ensayos clínicos.'
    WHEN 'STORE_CONDITION' THEN 'Conservar de 2°C a 8°C. No congelar.'
    ELSE NULL
  END
FROM public.phrases p, public.languages l
WHERE l.code = 'es' AND p.phrase_key IN ('WARNING_KEEP_REACH', 'WARNING_RESTRICTED', 'STORE_CONDITION')
ON CONFLICT (phrase_id, language_id) DO NOTHING;

-- Telugu
INSERT INTO public.translations (phrase_id, language_id, translated_text)
SELECT p.id, l.id, 
  CASE p.phrase_key
    WHEN 'WARNING_KEEP_REACH' THEN 'పిల్లలకు దూరంగా ఉంచండి.'
    WHEN 'WARNING_RESTRICTED' THEN 'నిర్దేశించిన క్లినికల్ ట్రయల్ ఉపయోగం కోసం మాత్రమే.'
    WHEN 'STORE_CONDITION' THEN '2°C నుండి 8°C వద్ద నిల్వ చేయండి. ఫ్రీజ్ చేయవద్దు.'
    ELSE NULL
  END
FROM public.phrases p, public.languages l
WHERE l.code = 'te' AND p.phrase_key IN ('WARNING_KEEP_REACH', 'WARNING_RESTRICTED', 'STORE_CONDITION')
ON CONFLICT (phrase_id, language_id) DO NOTHING;

-- ── 8.7 System Config ────────────────────────────────────────────────────────
INSERT INTO public.system_config (config_key, config_value) VALUES
  ('sod.prevent_same_user_approve', 'true'),
  ('audit.log_limit_days', '365'),
  ('app.version', '1.0.0-PROD'),
  ('app.theme.primary', '#004A99')
ON CONFLICT (config_key) DO NOTHING;

-- ── 8.8 Admin & Operator Users ───────────────────────────────────────────────
DO $$ 
DECLARE
  admin_role_id UUID := (SELECT id FROM public.roles WHERE name = 'ADMIN');
  op_role_id UUID := (SELECT id FROM public.roles WHERE name = 'OPERATOR');
BEGIN
  -- Admin
  INSERT INTO public.users (username, email, password_hash, role_id, status, must_change_password)
  VALUES ('admin', 'admin@pharmalabel.com', '$2a$10$7Z2v8.1.5v6v6v6v6v6v6u/5yO6X9z9z9z9z9z9z9z9z9z9z9z9z', admin_role_id, 'ACTIVE', false)
  ON CONFLICT (username) DO NOTHING;

  -- Operator
  INSERT INTO public.users (username, email, password_hash, role_id, status, must_change_password)
  VALUES ('operator', 'op@pharmalabel.com', '$2a$10$7Z2v8.1.5v6v6v6v6v6v6u/5yO6X9z9z9z9z9z9z9z9z9z9z9z9z', op_role_id, 'ACTIVE', false)
  ON CONFLICT (username) DO NOTHING;
END $$;

-- ── 8.9 Default Permissions ──────────────────────────────────────────────────
INSERT INTO public.permissions (role_id, module, event, allowed) 
SELECT id, m, e, true
FROM public.roles, (VALUES 
  ('dashboard', 'VIEW'),
  ('templates', 'VIEW'),
  ('templates', 'CREATE'),
  ('editor', 'VIEW'),
  ('editor', 'SAVE'),
  ('translation', 'VIEW'),
  ('history', 'VIEW'),
  ('print', 'VIEW'),
  ('masters', 'VIEW')
) AS perms(m, e)
WHERE name IN ('ADMIN', 'OPERATOR')
ON CONFLICT DO NOTHING;
