-- Core Second Chance Platform schema.
-- Reference rows contain roles, wilayas, and product terms only; no demo accounts
-- or sample cases are inserted.

CREATE TABLE IF NOT EXISTS roles (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS permissions (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS role_has_permissions (
  role_id BIGINT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id BIGINT NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS wilayas (
  id BIGSERIAL PRIMARY KEY,
  name_ar TEXT NOT NULL,
  name_fr TEXT,
  code VARCHAR(2) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS communes (
  id BIGSERIAL PRIMARY KEY,
  wilaya_id BIGINT NOT NULL REFERENCES wilayas(id),
  name TEXT NOT NULL,
  UNIQUE (wilaya_id, name)
);

CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL DEFAULT '',
  password TEXT NOT NULL,
  role_id BIGINT NOT NULL REFERENCES roles(id),
  role_slug TEXT NOT NULL,
  wilaya_id BIGINT REFERENCES wilayas(id),
  commune_id BIGINT REFERENCES communes(id),
  is_verified SMALLINT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  avatar_url TEXT,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS users_role_status_idx ON users(role_slug, status);

CREATE TABLE IF NOT EXISTS specialist_profiles (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  specialty TEXT NOT NULL,
  license_number TEXT NOT NULL,
  years_of_experience INTEGER,
  bio TEXT,
  verification_status TEXT NOT NULL DEFAULT 'pending',
  availability_schedule JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS centers (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  wilaya_id BIGINT NOT NULL REFERENCES wilayas(id),
  address TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  services TEXT NOT NULL DEFAULT '',
  capacity INTEGER,
  current_occupancy INTEGER,
  verification_status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS associations (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  wilaya_id BIGINT NOT NULL REFERENCES wilayas(id),
  address TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  services TEXT NOT NULL DEFAULT '',
  verification_status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS addiction_types (
  id BIGSERIAL PRIMARY KEY,
  name_ar TEXT NOT NULL UNIQUE,
  name_en TEXT,
  description TEXT,
  is_active SMALLINT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS services (
  id BIGSERIAL PRIMARY KEY,
  provider_id BIGINT NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  amount_dzd INTEGER NOT NULL CHECK (amount_dzd >= 0),
  category TEXT NOT NULL,
  is_active SMALLINT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (provider_id, category)
);

CREATE TABLE IF NOT EXISTS case_files (
  id BIGSERIAL PRIMARY KEY,
  number_case TEXT NOT NULL UNIQUE,
  created_by BIGINT NOT NULL REFERENCES users(id),
  patient_id BIGINT NOT NULL REFERENCES users(id),
  assigned_psychologist_id BIGINT REFERENCES users(id),
  assigned_lawyer_id BIGINT REFERENCES users(id),
  treatment_center_id BIGINT REFERENCES centers(id),
  addiction_type_id BIGINT REFERENCES addiction_types(id),
  priority TEXT NOT NULL DEFAULT 'Medium',
  status TEXT NOT NULL DEFAULT 'NEW',
  description TEXT NOT NULL,
  target_response_hours INTEGER NOT NULL DEFAULT 72,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS appointments (
  id BIGSERIAL PRIMARY KEY,
  case_file_id BIGINT NOT NULL REFERENCES case_files(id) ON DELETE CASCADE,
  created_by BIGINT NOT NULL REFERENCES users(id),
  specialist_id BIGINT NOT NULL REFERENCES users(id),
  appointment_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  notes TEXT,
  cancellation_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS appointments_provider_time_idx
  ON appointments(specialist_id, appointment_date, start_time);

CREATE TABLE IF NOT EXISTS service_requests (
  id BIGSERIAL PRIMARY KEY,
  case_file_id BIGINT NOT NULL REFERENCES case_files(id),
  requester_id BIGINT NOT NULL REFERENCES users(id),
  provider_id BIGINT NOT NULL REFERENCES users(id),
  assigned_staff_id BIGINT REFERENCES users(id),
  service_id BIGINT NOT NULL REFERENCES services(id),
  addiction_type_id BIGINT REFERENCES addiction_types(id),
  amount_dzd INTEGER NOT NULL CHECK (amount_dzd >= 0),
  payment_status TEXT NOT NULL DEFAULT 'PENDING',
  status TEXT NOT NULL DEFAULT 'PENDING_PROVIDER',
  priority TEXT NOT NULL DEFAULT 'Medium',
  rejection_reason TEXT,
  description TEXT NOT NULL,
  appointment_id BIGINT REFERENCES appointments(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS service_requests_requester_idx ON service_requests(requester_id, created_at DESC);
CREATE INDEX IF NOT EXISTS service_requests_provider_status_idx ON service_requests(provider_id, status, priority);

CREATE TABLE IF NOT EXISTS case_assignments (
  id BIGSERIAL PRIMARY KEY,
  case_file_id BIGINT NOT NULL REFERENCES case_files(id) ON DELETE CASCADE,
  specialist_id BIGINT NOT NULL REFERENCES users(id),
  assigned_by BIGINT NOT NULL REFERENCES users(id),
  role_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS request_history (
  id BIGSERIAL PRIMARY KEY,
  request_id BIGINT NOT NULL REFERENCES service_requests(id) ON DELETE CASCADE,
  user_id BIGINT REFERENCES users(id),
  action TEXT NOT NULL,
  from_status TEXT,
  to_status TEXT,
  details TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS service_reports (
  id BIGSERIAL PRIMARY KEY,
  request_id BIGINT NOT NULL REFERENCES service_requests(id) ON DELETE CASCADE,
  provider_id BIGINT NOT NULL REFERENCES users(id),
  assessment TEXT,
  professional_notes TEXT,
  recommendations TEXT,
  treatment_plan TEXT,
  next_appointment TEXT,
  client_summary TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS treatment_follow_ups (
  id BIGSERIAL PRIMARY KEY,
  case_file_id BIGINT NOT NULL REFERENCES case_files(id) ON DELETE CASCADE,
  center_id BIGINT REFERENCES centers(id),
  week_number INTEGER NOT NULL DEFAULT 1,
  medical_notes TEXT,
  status_summary TEXT NOT NULL DEFAULT 'مستقر',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS case_notes (
  id BIGSERIAL PRIMARY KEY,
  case_file_id BIGINT NOT NULL REFERENCES case_files(id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL REFERENCES users(id),
  note TEXT NOT NULL,
  is_private SMALLINT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS case_documents (
  id BIGSERIAL PRIMARY KEY,
  case_file_id BIGINT NOT NULL REFERENCES case_files(id) ON DELETE CASCADE,
  uploaded_by BIGINT NOT NULL REFERENCES users(id),
  file_name TEXT NOT NULL,
  file_category TEXT NOT NULL DEFAULT 'وثيقة شخصية',
  file_type TEXT,
  file_size BIGINT,
  storage_path TEXT NOT NULL,
  encrypted_content TEXT NOT NULL DEFAULT '',
  visibility TEXT NOT NULL DEFAULT 'admin_only',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE case_documents ADD COLUMN IF NOT EXISTS file_category TEXT NOT NULL DEFAULT 'وثيقة شخصية';
ALTER TABLE case_documents ADD COLUMN IF NOT EXISTS encrypted_content TEXT NOT NULL DEFAULT '';

CREATE TABLE IF NOT EXISTS conversations (
  id BIGSERIAL PRIMARY KEY,
  case_file_id BIGINT NOT NULL UNIQUE REFERENCES case_files(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS conversation_participants (
  id BIGSERIAL PRIMARY KEY,
  conversation_id BIGINT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (conversation_id, user_id)
);

CREATE TABLE IF NOT EXISTS messages (
  id BIGSERIAL PRIMARY KEY,
  conversation_id BIGINT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id BIGINT NOT NULL REFERENCES users(id),
  content TEXT NOT NULL,
  attachment_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS message_read_statuses (
  id BIGSERIAL PRIMARY KEY,
  message_id BIGINT NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (message_id, user_id)
);

CREATE TABLE IF NOT EXISTS payments (
  id BIGSERIAL PRIMARY KEY,
  request_id BIGINT NOT NULL REFERENCES service_requests(id),
  user_id BIGINT NOT NULL REFERENCES users(id),
  provider_id BIGINT NOT NULL REFERENCES users(id),
  amount_dzd INTEGER NOT NULL CHECK (amount_dzd >= 0),
  currency TEXT NOT NULL DEFAULT 'DZD',
  payment_method TEXT NOT NULL,
  transaction_id TEXT,
  gateway_checkout_id TEXT,
  checkout_url TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  paid_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS payments_request_status_idx ON payments(request_id, status, created_at DESC);

CREATE TABLE IF NOT EXISTS payment_transactions (
  id BIGSERIAL PRIMARY KEY,
  payment_id BIGINT NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  gateway TEXT NOT NULL,
  gateway_transaction_id TEXT,
  gateway_checkout_id TEXT,
  amount_dzd INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'DZD',
  status TEXT NOT NULL,
  event_id TEXT NOT NULL UNIQUE,
  payload TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS refunds (
  id BIGSERIAL PRIMARY KEY,
  payment_id BIGINT NOT NULL REFERENCES payments(id),
  requested_by BIGINT REFERENCES users(id),
  amount_dzd INTEGER NOT NULL CHECK (amount_dzd >= 0),
  status TEXT NOT NULL DEFAULT 'PENDING',
  reason TEXT NOT NULL,
  gateway_refund_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ratings (
  id BIGSERIAL PRIMARY KEY,
  case_file_id BIGINT NOT NULL REFERENCES case_files(id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL REFERENCES users(id),
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  feedback TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (case_file_id, user_id)
);

CREATE TABLE IF NOT EXISTS notifications (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'STATUS',
  link TEXT,
  is_read SMALLINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  details TEXT,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS system_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS family_package_catalog (
  id SMALLINT PRIMARY KEY CHECK (id = 1),
  name TEXT NOT NULL,
  duration_days INTEGER NOT NULL CHECK (duration_days > 0),
  legal_consultations INTEGER NOT NULL CHECK (legal_consultations >= 0),
  psychological_consultations INTEGER NOT NULL CHECK (psychological_consultations >= 0),
  family_guidance_services INTEGER NOT NULL CHECK (family_guidance_services >= 0),
  price_dzd INTEGER CHECK (price_dzd IS NULL OR price_dzd > 0),
  is_active BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
INSERT INTO family_package_catalog
  (id, name, duration_days, legal_consultations, psychological_consultations,
   family_guidance_services, price_dzd, is_active)
VALUES (1, 'الباقة الأسرية', 30, 3, 3, 3, NULL, FALSE)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS family_package_subscriptions (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id),
  payment_id BIGINT REFERENCES payments(id),
  price_dzd INTEGER NOT NULL CHECK (price_dzd > 0),
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  legal_remaining INTEGER NOT NULL,
  psychological_remaining INTEGER NOT NULL,
  family_guidance_remaining INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING_PAYMENT',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO roles (name, slug) VALUES
  ('مستفيد / أسرة', 'family'),
  ('مستفيد', 'patient'),
  ('مستخدم', 'user'),
  ('أخصائي نفسي عيادي', 'psychologist'),
  ('مستشار قانوني', 'lawyer'),
  ('مركز علاجي', 'treatment_center'),
  ('جمعية', 'association'),
  ('إدارة المنصة', 'admin')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO wilayas (code, name_ar, name_fr) VALUES
  ('01','أدرار','Adrar'), ('02','الشلف','Chlef'), ('03','الأغواط','Laghouat'),
  ('04','أم البواقي','Oum El Bouaghi'), ('05','باتنة','Batna'), ('06','بجاية','Béjaïa'),
  ('07','بسكرة','Biskra'), ('08','بشار','Béchar'), ('09','البليدة','Blida'),
  ('10','البويرة','Bouira'), ('11','تمنراست','Tamanrasset'), ('12','تبسة','Tébessa'),
  ('13','تلمسان','Tlemcen'), ('14','تيارت','Tiaret'), ('15','تيزي وزو','Tizi Ouzou'),
  ('16','الجزائر العاصمة','Alger'), ('17','الجلفة','Djelfa'), ('18','جيجل','Jijel'),
  ('19','سطيف','Sétif'), ('20','سعيدة','Saïda'), ('21','سكيكدة','Skikda'),
  ('22','سيدي بلعباس','Sidi Bel Abbès'), ('23','عنابة','Annaba'), ('24','قالمة','Guelma'),
  ('25','قسنطينة','Constantine'), ('26','المدية','Médéa'), ('27','مستغانم','Mostaganem'),
  ('28','المسيلة','M''Sila'), ('29','معسكر','Mascara'), ('30','ورقلة','Ouargla'),
  ('31','وهران','Oran'), ('32','البيض','El Bayadh'), ('33','إليزي','Illizi'),
  ('34','برج بوعريريج','Bordj Bou Arréridj'), ('35','بومرداس','Boumerdès'),
  ('36','الطارف','El Tarf'), ('37','تندوف','Tindouf'), ('38','تيسمسيلت','Tissemsilt'),
  ('39','الوادي','El Oued'), ('40','خنشلة','Khenchela'), ('41','سوق أهراس','Souk Ahras'),
  ('42','تيبازة','Tipaza'), ('43','ميلة','Mila'), ('44','عين الدفلى','Aïn Defla'),
  ('45','النعامة','Naâma'), ('46','عين تموشنت','Aïn Témouchent'), ('47','غرداية','Ghardaïa'),
  ('48','غليزان','Relizane'), ('49','تيميمون','Timimoun'), ('50','برج باجي مختار','Bordj Badji Mokhtar'),
  ('51','أولاد جلال','Ouled Djellal'), ('52','بني عباس','Béni Abbès'),
  ('53','إن صالح','In Salah'), ('54','إن قزام','In Guezzam'), ('55','توقرت','Touggourt'),
  ('56','جانت','Djanet'), ('57','المغير','El M''Ghair'), ('58','المنيعة','El Meniaa')
ON CONFLICT (code) DO NOTHING;
