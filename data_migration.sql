-- =============================================================================
-- PharmaLabel Designer — Full Data Migration Script (PostgreSQL -> Local)
-- =============================================================================

-- 1. Roles
INSERT INTO public.roles (id, name) VALUES
  ('d68e4294-eff5-4f3a-b6c2-3adff348e863', 'ADMIN'),
  ('0446db85-60cd-4f5e-8125-b049531c7716', 'REVIEWER'),
  ('fde5a0eb-2bb9-4fc1-8e59-f2eab0a1c966', 'OPERATOR'),
  ('8e667b7f-683e-4eca-8d5f-2a03165a8357', 'EXTERNAL'),
  ('39c97678-04c1-4d46-932d-959502633631', 'DESIGNER'),
  ('99725821-d189-4323-88e7-6ef97d4bec5c', 'QA_OFFICER'),
  ('5ef41349-0c25-4227-a19b-8167402a6e71', 'STUDY_MANAGER'),
  ('97f34622-6e9e-4047-beec-efe473d499c5', 'PRINT_OPERATOR')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- 2. Languages
INSERT INTO public.languages (id, name, code, direction, status) VALUES
  ('71835d23-b9b6-423a-9c9f-adfd84e00f72', 'English', 'en', 'LTR', 'ACTIVE'),
  ('26ca23b3-2318-4444-9ef2-20ddf55ad298', 'Spanish', 'es', 'LTR', 'ACTIVE'),
  ('6a1ff18b-60c5-44f2-8487-1926f3aea3ac', 'Arabic', 'ar', 'RTL', 'ACTIVE'),
  ('7fa4fb77-557c-48e6-a23d-caa8cbb25fbc', 'French', 'fr', 'LTR', 'ACTIVE'),
  ('ce065891-6aa0-4816-a3df-83cfd0b5556f', 'French-CA', 'fc', 'LTR', 'ACTIVE'),
  ('d94de550-c962-4e7c-b880-77b304ca988a', 'French-BE', 'fb', 'LTR', 'ACTIVE')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, code = EXCLUDED.code, direction = EXCLUDED.direction, status = EXCLUDED.status;

-- 3. Label Stocks
INSERT INTO public.label_stocks (id, stock_id, name, breadth, length, height, description, status) VALUES
  ('a8cbbf5b-0673-472c-853d-5b42117e3f28', 'Standard Tablet', 'Standard Tablet', 75.00, 75.00, 35.00, 'Standard dimensions for tablet bottle labels', 'ACTIVE'),
  ('af409aaf-63f4-4786-8c6b-b3e3fb473d01', 'Standard Syrup', 'Standard Syrup', 120.00, 120.00, 50.00, 'Standard dimensions for syrup bottle labels', 'ACTIVE'),
  ('475754a8-56de-47fc-8931-331313977d50', 'Standard Injection', 'Standard Injection', 55.00, 55.00, 20.00, 'Standard dimensions for injection vial labels', 'ACTIVE'),
  ('04ff9b0b-4619-4480-bdd8-9dc65e2770c0', 'Standard Ointment', 'Standard Ointment', 90.00, 90.00, 35.00, 'Standard dimensions for ointment tube labels', 'ACTIVE'),
  ('bb0caf91-1b66-4cf6-a70f-bddd5a5edf26', 'Standard Generic', 'Standard Generic', 80.00, 80.00, 40.00, 'Generic dimensions for various applications', 'ACTIVE')
ON CONFLICT (id) DO NOTHING;

-- 4. Placeholders
INSERT INTO public.placeholders (id, name, type, mapping_key, format_rules, default_value, status) VALUES
  ('866e07a9-648b-4940-a6e6-7b1533e55058', 'Batch Number', 'DATA', 'BATCH_NO', NULL, 'B12345', 'ACTIVE'),
  ('b660e839-5fc5-475b-8ee7-cb77b45ead83', 'Manufacturing Date', 'DATA', 'MFG_DATE', '{"format": "MM/YYYY"}', '01/2025', 'ACTIVE'),
  ('d34d105e-18ce-45d7-8d97-b7cc2f0afc6f', 'Expiry Date', 'DATA', 'EXP_DATE', '{"format": "MM/YYYY"}', '12/2027', 'ACTIVE'),
  ('e783a9d4-a9d1-4b9a-a6e4-5eb78a2e03c3', 'MRP Price', 'DATA', 'MRP', '{"prefix": "₹"}', '99.00', 'ACTIVE'),
  ('bd4a17b4-d173-4b5f-97eb-265a7d4eb114', 'Active Ingredient', 'DATA', 'ACTIVE_INGREDIENT', NULL, 'Paracetamol', 'ACTIVE'),
  ('5662d345-e24d-4c00-afa4-a312fc9943d8', 'Strength', 'DATA', 'STRENGTH', NULL, '500mg', 'ACTIVE'),
  ('4344828d-2f9b-4b18-9cf7-e5caea60c171', 'Manufacturing License No', 'DATA', 'MFG_LIC_NO', NULL, 'LIC12345', 'ACTIVE'),
  ('66fb65cd-3e4d-4c22-9b5d-a63040fd3146', 'Marketed By', 'DATA', 'MARKETED_BY', NULL, 'ABC Pharma Ltd', 'ACTIVE'),
  ('5c0d1ac7-0d5e-4324-9d75-fe17643db8b8', 'Net Contents', 'DATA', 'NET_CONTENT', NULL, '100 mL', 'ACTIVE'),
  ('e1a6120f-1089-4be2-bcc1-18116cb5a513', 'Dosage', 'DATA', 'DOSAGE', NULL, 'As directed by physician', 'ACTIVE'),
  ('da0f895e-4399-47c7-89eb-b61598d74c8f', 'Custom Note', 'FREE_TEXT', 'CUSTOM_NOTE', NULL, 'Sample Note', 'ACTIVE')
ON CONFLICT (id) DO NOTHING;

-- 5. Users
INSERT INTO public.users (id, username, email, password_hash, role_id, status, must_change_password) VALUES
  ('00000000-0000-0000-0000-000000000000', 'system', 'system@internal.label', 'N/A', NULL, 'ACTIVE', false),
  ('362990f3-5844-4879-8129-3f2723363be6', 'admin', 'admin@pharmalabel.com', '$2a$10$5xrji2mFJQAGVweUrfOgOurwWeUgXtKCzvBmqG5LCkAZuaD9Gvp4W', 'd68e4294-eff5-4f3a-b6c2-3adff348e863', 'ACTIVE', true)
ON CONFLICT (id) DO UPDATE SET password_hash = EXCLUDED.password_hash, role_id = EXCLUDED.role_id;

-- 6. Labels
INSERT INTO public.labels (id, name, label_stock_id, created_by, status, image_url, notes, created_at) VALUES
  ('f8781ec7-a11b-417d-b809-79afce353759', 'hemanth', 'a8cbbf5b-0673-472c-853d-5b42117e3f28', '362990f3-5844-4879-8129-3f2723363be6', 'ACTIVE', NULL, '', '2026-04-06 02:35:53'),
  ('18e4031c-01c5-46e9-b60c-0226f5ded5a6', 'dolo', 'a8cbbf5b-0673-472c-853d-5b42117e3f28', '362990f3-5844-4879-8129-3f2723363be6', 'ACTIVE', NULL, '', '2026-04-06 02:43:47'),
  ('b47e165e-8118-4ea7-aecb-d065c484e208', 'rk', 'a8cbbf5b-0673-472c-853d-5b42117e3f28', '362990f3-5844-4879-8129-3f2723363be6', 'ACTIVE', NULL, '', '2026-04-06 02:48:07'),
  ('72c4f6bc-9ea6-4873-bb59-9dc38a87292a', 'rk2', 'a8cbbf5b-0673-472c-853d-5b42117e3f28', '362990f3-5844-4879-8129-3f2723363be6', 'ACTIVE', '/uploads/d43a5b6d-44d7-4e66-b426-e655fa816ee1_wp3830173.jpg', '', '2026-04-06 02:53:06')
ON CONFLICT (id) DO NOTHING;

-- 7. Objects (Assets)
INSERT INTO public.objects (id, name, type, file_url, status, label_id, parent_id, version, activation_status) VALUES
  ('0d087614-4900-475e-b284-f35c5943ee4d', 'g', 'LOGO', '/uploads/f0f8c533-02c3-4d99-9dad-e0c77733eed7_MARVAL.jpg', 'ACTIVE', '72c4f6bc-9ea6-4873-bb59-9dc38a87292a', '0d087614-4900-475e-b284-f35c5943ee4d', 1, 'ACTIVE'),
  ('754cf95e-7df8-4f56-8291-ca61982b1d9a', 'hggb', 'LOGO', '/uploads/d43a5b6d-44d7-4e66-b426-e655fa816ee1_wp3830173.jpg', 'ACTIVE', '72c4f6bc-9ea6-4873-bb59-9dc38a87292a', '754cf95e-7df8-4f56-8291-ca61982b1d9a', 1, 'ACTIVE')
ON CONFLICT (id) DO NOTHING;

-- 8. Label Versions
INSERT INTO public.label_versions (id, label_id, version_no, design_json, created_by, created_at) VALUES
  ('af0572df-3f82-44fc-8a11-28d3f7efdb82', 'f8781ec7-a11b-417d-b809-79afce353759', 1, '{"bgColor":"#FFFFFF","labelSize":{"h":1123,"w":794},"elementsData":[{"x":318,"y":161,"id":"f287bd57-8eec-4ef1-9b63-79286e5e3750","name":"Subheading","text":"Add a subheading","type":"text","color":"#475569","width":220,"height":23,"zIndex":11,"fontSize":18,"fontFamily":"Outfit, sans-serif","fontWeight":"700","borderColor":"#000000","borderStyle":"none","borderWidth":0,"borderRadius":0}],"labelStockId":null}', '362990f3-5844-4879-8129-3f2723363be6', '2026-04-06 02:35:53'),
  ('52c9b688-ac5f-43c6-b76d-d47866f5f68d', '72c4f6bc-9ea6-4873-bb59-9dc38a87292a', 1, '{"bgColor":"#FFFFFF","labelSize":{"h":189,"w":567},"elementsData":[{"x":160,"y":71.5,"id":"6c8868d2-a0d6-48c8-849d-1959f6b7fbd1","html":"Add a subheading","name":"Subheading","text":"Add a subheading","type":"text","color":"#475569","width":220,"height":23,"zIndex":11,"fontSize":18,"fontFamily":"Outfit, sans-serif","fontWeight":"700","borderColor":"#000000","borderStyle":"none","borderWidth":0,"borderRadius":0},{"x":438,"y":31.5,"id":"f8a347e7-b2f1-4dd2-b90b-1b0a2ee4631a","name":"QR Code","text":"https://example.com","type":"qrcode","color":"#191c1e","width":80,"height":80,"zIndex":12,"borderColor":"#000000","borderStyle":"none","borderWidth":0,"borderRadius":0},{"x":20,"y":20,"id":"5ee3bfad-8f40-4fa3-9799-21f81337b40f","name":"Batch Number","text":"{{BATCH_NO}}","type":"text","color":"var(--color-primary)","width":140,"height":24,"zIndex":13,"fontSize":14,"fontFamily":"Inter, sans-serif","fontWeight":"600","borderColor":"#000000","borderStyle":"none","borderWidth":0,"borderRadius":0,"isPlaceholder":true,"placeholderKey":"BATCH_NO"}],"labelStockId":"a8cbbf5b-0673-472c-853d-5b42117e3f28"}', '362990f3-5844-4879-8129-3f2723363be6', '2026-04-06 02:53:06'),
  ('44cf31ed-4078-4bec-8c5e-5f9d2d10c255', '18e4031c-01c5-46e9-b60c-0226f5ded5a6', 1, '{"bgColor":"#FFFFFF","labelSize":{"h":1123,"w":794},"elementsData":[{"x":264,"y":184,"id":"541df881-d5b5-47e6-a01b-c330301ce96f","name":"Subheading","text":"Add a subheading","type":"text","color":"#475569","width":220,"height":23,"zIndex":11,"fontSize":18,"fontFamily":"Outfit, sans-serif","fontWeight":"700","borderColor":"#000000","borderStyle":"none","borderWidth":0,"borderRadius":0}],"labelStockId":"a8cbbf5b-0673-472c-853d-5b42117e3f28"}', '362990f3-5844-4879-8129-3f2723363be6', '2026-04-06 02:43:47'),
  ('389d82bd-e8eb-4d26-894d-9e9bd58568e3', '18e4031c-01c5-46e9-b60c-0226f5ded5a6', 2, '{"bgColor":"#FFFFFF","labelSize":{"h":1123,"w":794},"elementsData":[{"x":264,"y":184,"id":"541df881-d5b5-47e6-a01b-c330301ce96f","name":"Subheading","text":"Add a subheading","type":"text","color":"#475569","width":220,"height":23,"zIndex":11,"fontSize":18,"fontFamily":"Outfit, sans-serif","fontWeight":"700","borderColor":"#000000","borderStyle":"none","borderWidth":0,"borderRadius":0}],"labelStockId":"a8cbbf5b-0673-472c-853d-5b42117e3f28"}', '362990f3-5844-4879-8129-3f2723363be6', '2026-04-06 02:44:55'),
  ('5b4aea95-450b-4bcc-8d87-c8576de164cc', 'b47e165e-8118-4ea7-aecb-d065c484e208', 1, '{"bgColor":"#FFFFFF","labelSize":{"h":1123,"w":794},"elementsData":[],"labelStockId":"a8cbbf5b-0673-472c-853d-5b42117e3f28"}', '362990f3-5844-4879-8129-3f2723363be6', '2026-04-06 02:48:07')
ON CONFLICT (id) DO NOTHING;

-- 9. System Sessions
INSERT INTO public.user_sessions (id, user_id, recent_activity_log, last_accessed) VALUES
  ('d3f24e97-8ce9-45ad-87bb-c90cb5d2cafa', '362990f3-5844-4879-8129-3f2723363be6', '[{"id":"d32cbc23-763e-42fd-9e8d-c2a8d9a68bf2","time":1775484226061,"action":"Imported JSON file","fileId":null,"fileName":"rk2"}]', '2026-04-06 14:03:46')
ON CONFLICT (id) DO NOTHING;
