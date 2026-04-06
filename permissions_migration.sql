-- =============================================================================
-- PharmaLabel Designer — Permissions Sync (PostgreSQL -> Local)
-- =============================================================================

INSERT INTO public.permissions (id, role_id, module, event, allowed) VALUES
  ('1f081382-9593-4fa2-961d-52aac77b4e6f', NULL, 'dashboard', 'VIEW', true),
  ('9c4cfde1-c859-495a-a72c-fe7c2856f85d', NULL, 'editor', 'VIEW', true),
  ('e6998ba8-634b-42ed-b477-160c20c94e5a', NULL, 'editor', 'CREATE', true),
  ('5ec412ab-29eb-4bc9-96e5-d7acb276c900', NULL, 'editor', 'EDIT', true),
  ('baad86ac-d1e4-4913-9daa-ad4cdfe8940a', NULL, 'editor', 'APPROVE', true),
  ('e85d578c-ebd9-47d1-b872-8c2353d999db', NULL, 'dashboard', 'VIEW', true),
  ('3cc63896-d72f-4cba-8811-d9290e792367', NULL, 'templates', 'VIEW', true),
  ('273e6927-e4d2-4d01-8f63-be9afa8b3987', NULL, 'dashboard', 'CREATE', true),
  ('0326d00c-b891-4209-b6e6-2752b3563669', NULL, 'dashboard', 'EDIT', true),
  ('1929f115-7459-4243-ac8a-6567cc7d5fb2', NULL, 'templates', 'VIEW', true),
  ('feb229d8-19a6-424d-9ac7-747fb991eb53', NULL, 'dashboard', 'APPROVE', true),
  ('ec30d8ee-bf42-494f-aa7f-7f6dcac42f85', NULL, 'users', 'VIEW', false),
  ('36ae78da-6149-497b-b501-4d91ddc3e8d2', NULL, 'translation', 'VIEW', false),
  ('341a4cb0-72ef-484c-a4f5-be3d7ae82062', NULL, 'editor', 'VIEW', false),
  ('05a4e9c6-46eb-4752-82c4-7984aa58db93', NULL, 'history', 'VIEW', false),
  ('f54b5c24-e60a-44cf-a58d-0da3e6a2c9a9', NULL, 'dashboard', 'VIEW', true),
  ('5d2bc57d-a032-4cf9-8c33-2a2fa8444d96', NULL, 'settings', 'VIEW', false),
  ('5e3914a5-27f8-4aed-8a80-3dc6d8e658b9', NULL, 'saved-templates', 'VIEW', false),
  ('29d80a31-ec68-4fe4-8eae-bbe89a0482aa', NULL, 'dashboard', 'DELETE', true),
  ('70440d68-9fb9-4416-b778-7ff4272f4e82', 'd68e4294-eff5-4f3a-b6c2-3adff348e863', 'LABELS', 'READ', true),
  ('281a4883-4dd2-4e9c-a262-6f259c2cefa6', 'd68e4294-eff5-4f3a-b6c2-3adff348e863', 'LABELS', 'CREATE', true),
  ('6c0a6ee9-e6d1-42dd-b6e9-69c3dd7b0a3b', 'd68e4294-eff5-4f3a-b6c2-3adff348e863', 'LABELS', 'UPDATE', true),
  ('ae7b60b1-8d85-4fa1-a7ea-56cea92eb2fd', 'd68e4294-eff5-4f3a-b6c2-3adff348e863', 'LABELS', 'DELETE', true),
  ('77e89907-b208-4ad3-923a-13d7d33614c0', 'd68e4294-eff5-4f3a-b6c2-3adff348e863', 'PLACEHOLDERS', 'READ', true),
  ('01a5d52a-0eb0-4737-871e-3cf436855275', 'd68e4294-eff5-4f3a-b6c2-3adff348e863', 'PLACEHOLDERS', 'UPDATE', true),
  ('5a0cfee7-af2e-435a-9388-6fbe0f0c56c6', 'd68e4294-eff5-4f3a-b6c2-3adff348e863', 'USERS', 'READ', true),
  ('e60a6439-b852-4b58-b84e-ebf8fc888721', 'd68e4294-eff5-4f3a-b6c2-3adff348e863', 'USERS', 'MANAGE', true),
  ('dfcce1fe-3a64-4eab-99ef-3cb440ae8d7a', 'd68e4294-eff5-4f3a-b6c2-3adff348e863', 'AUDIT', 'READ', true),
  ('86c26a6c-28a7-4be7-a92c-8e7f61993ce1', 'd68e4294-eff5-4f3a-b6c2-3adff348e863', 'SIGNATURES', 'CREATE', true)
ON CONFLICT (id) DO NOTHING;
