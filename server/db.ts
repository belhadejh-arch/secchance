import type { QueryResultRow } from 'pg';
import { spawnSync } from 'child_process';
import bcrypt from 'bcryptjs';
import type { Database } from 'sql.js';

/**
 * PostgreSQL is the source of truth for all application data in production (e.g. Render).
 * In development / preview when DATABASE_URL is not configured, an in-memory SQLite database
 * is used seamlessly so the platform functions without crashing.
 */
const databaseUrl = process.env.DATABASE_URL;
let sqliteDb: Database | null = null;
let initialized = false;

const databaseWorker = `
  const { Client } = require('pg');
  let input = '';
  process.stdin.on('data', chunk => input += chunk);
  process.stdin.on('end', async () => {
    const payload = JSON.parse(input);
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined
    });
    try {
      await client.connect();
      const result = await client.query(payload.sql, payload.params || []);
      process.stdout.write(JSON.stringify({ rows: result.rows, rowCount: result.rowCount }));
    } catch (error) {
      process.stderr.write(error instanceof Error ? error.message : String(error));
      process.exitCode = 1;
    } finally {
      await client.end().catch(() => {});
    }
  });
`;

function executeDatabase<T extends QueryResultRow = any>(sql: string, params: any[] = []): { rows: T[]; rowCount: number } {
  if (!databaseUrl) {
    if (!sqliteDb) throw new Error('Database not initialized');
    let converted = sql
      .replace(/\bSERIAL\s+PRIMARY\s+KEY\b/gi, 'INTEGER PRIMARY KEY AUTOINCREMENT')
      .replace(/\bTIMESTAMP\b/gi, 'DATETIME')
      .replace(/\$\d+/g, '?');

    const trimmed = converted.trim().replace(/;+\s*$/, '');
    const isSelect = /^\s*SELECT\b/i.test(trimmed);

    if (isSelect) {
      const stmt = sqliteDb.prepare(trimmed);
      if (params.length > 0) stmt.bind(params);
      const rows: T[] = [];
      while (stmt.step()) rows.push(stmt.getAsObject() as T);
      stmt.free();
      return { rows, rowCount: rows.length };
    } else {
      const cleanSql = trimmed.replace(/\s+RETURNING\s+id\s*$/i, '');
      if (params.length === 0) {
        sqliteDb.run(cleanSql);
      } else {
        sqliteDb.run(cleanSql, params);
      }
      const lastIdRes = sqliteDb.exec('SELECT last_insert_rowid() as id');
      const lastInsertRowId = Number(lastIdRes[0]?.values[0]?.[0] || 0);
      return { rows: [{ id: lastInsertRowId } as any], rowCount: 1 };
    }
  }

  const result = spawnSync(process.execPath, ['-e', databaseWorker], {
    input: JSON.stringify({ sql, params }),
    encoding: 'utf8',
    timeout: 30000,
    env: process.env,
  });

  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`PostgreSQL query failed: ${result.stderr || 'unknown database error'}`);
  }

  try {
    return JSON.parse(result.stdout || '{"rows":[],"rowCount":0}');
  } catch {
    throw new Error(`PostgreSQL returned an invalid response: ${result.stdout}`);
  }
}

function toPostgresSql(sql: string): string {
  let converted = sql
    .replace(/\bINTEGER\s+PRIMARY\s+KEY\s+AUTOINCREMENT\b/gi, 'SERIAL PRIMARY KEY')
    .replace(/\bDATETIME\b/gi, 'TIMESTAMP')
    .replace(/\bINSERT\s+OR\s+REPLACE\s+INTO\s+system_settings\s*\(key,\s*value\)\s*VALUES\s*\(([^)]+)\)/gi,
      'INSERT INTO system_settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value');

  let index = 0;
  converted = converted.replace(/\?/g, () => `$${++index}`);
  return converted;
}

function runQuery<T extends QueryResultRow = any>(sql: string, params: any[] = []): T[] {
  const result = executeDatabase<T>(toPostgresSql(sql), params);
  return result.rows;
}

export function query<T = any>(sql: string, params: any[] = []): T[] {
  if (!initialized) throw new Error('Database not initialized');
  return runQuery(sql, params) as T[];
}

export function queryOne<T = any>(sql: string, params: any[] = []): T | null {
  return query<T>(sql, params)[0] || null;
}

export function execute(sql: string, params: any[] = []): { lastInsertRowId: number; changes: number } {
  if (!initialized) throw new Error('Database not initialized');

  const trimmed = sql.trim().replace(/;+\s*$/, '');
  const isInsert = /^\s*INSERT\b/i.test(trimmed);
  const statement = isInsert && !/\bRETURNING\b/i.test(trimmed)
    ? `${trimmed} RETURNING id`
    : trimmed;
  const result = executeDatabase<any>(toPostgresSql(statement), params);

  return {
    lastInsertRowId: Number(result.rows[0]?.id || 0),
    changes: result.rowCount || 0,
  };
}

interface DatabaseAdapter {
  run(sql: string, params?: any[]): void;
}

const dbAdapter: DatabaseAdapter = {
  run(sql: string, params: any[] = []) {
    executeDatabase(toPostgresSql(sql), params);
  },
};

export function saveDb(): void {
  // Kept as a no-op for compatibility with the imported project.
  // PostgreSQL commits each statement directly.
}

export async function getDb(): Promise<DatabaseAdapter> {
  if (initialized) return dbAdapter;

  if (databaseUrl) {
    executeDatabase('SELECT 1');
  } else {
    console.warn('⚠️ DATABASE_URL not provided. Using in-memory database for preview container.');
    const initSqlJs = (await import('sql.js')).default;
    const SQL = await initSqlJs();
    sqliteDb = new SQL.Database();
  }

  initSchema(dbAdapter);
  initialized = true;
  seedReferenceData(dbAdapter);
  return dbAdapter;
}

function initSchema(db: DatabaseAdapter) {
  db.run(`
    CREATE TABLE IF NOT EXISTS roles (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS permissions (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS role_has_permissions (
      role_id INTEGER NOT NULL,
      permission_id INTEGER NOT NULL,
      PRIMARY KEY (role_id, permission_id)
    );
    CREATE TABLE IF NOT EXISTS wilayas (
      id SERIAL PRIMARY KEY,
      code TEXT NOT NULL UNIQUE,
      name_ar TEXT NOT NULL,
      name_fr TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS communes (
      id SERIAL PRIMARY KEY,
      wilaya_id INTEGER NOT NULL,
      name TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS addiction_types (
      id SERIAL PRIMARY KEY,
      name_ar TEXT NOT NULL,
      name_en TEXT NOT NULL,
      description TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      phone TEXT NOT NULL,
      password TEXT NOT NULL,
      role_id INTEGER NOT NULL,
      role_slug TEXT NOT NULL,
      wilaya_id INTEGER,
      commune_id INTEGER,
      is_verified INTEGER DEFAULT 1,
      status TEXT DEFAULT 'active',
      avatar_url TEXT,
      last_login_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS specialist_profiles (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL UNIQUE,
      specialty TEXT NOT NULL,
      license_number TEXT NOT NULL,
      years_of_experience INTEGER DEFAULT 1,
      bio TEXT,
      verification_status TEXT DEFAULT 'approved',
      availability_schedule TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS centers (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      wilaya_id INTEGER NOT NULL,
      address TEXT,
      phone TEXT,
      services TEXT,
      capacity INTEGER DEFAULT 50,
      current_occupancy INTEGER DEFAULT 0,
      verification_status TEXT DEFAULT 'approved',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS associations (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      wilaya_id INTEGER NOT NULL,
      address TEXT,
      phone TEXT,
      services TEXT,
      verification_status TEXT DEFAULT 'approved',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS case_files (
      id SERIAL PRIMARY KEY,
      number_case TEXT NOT NULL UNIQUE,
      created_by INTEGER NOT NULL,
      patient_id INTEGER NOT NULL,
      assigned_psychologist_id INTEGER,
      assigned_lawyer_id INTEGER,
      treatment_center_id INTEGER,
      addiction_type_id INTEGER NOT NULL,
      priority TEXT NOT NULL,
      status TEXT NOT NULL,
      description TEXT NOT NULL,
      target_response_hours INTEGER NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS case_notes (
      id SERIAL PRIMARY KEY,
      case_file_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      note TEXT NOT NULL,
      is_private INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS case_assignments (
      id SERIAL PRIMARY KEY,
      case_file_id INTEGER NOT NULL,
      specialist_id INTEGER NOT NULL,
      assigned_by INTEGER NOT NULL,
      role_type TEXT NOT NULL,
      status TEXT DEFAULT 'accepted',
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS assessments (
      id SERIAL PRIMARY KEY,
      case_file_id INTEGER NOT NULL,
      psychologist_id INTEGER NOT NULL,
      severity TEXT NOT NULL,
      recommendation TEXT NOT NULL,
      mental_health_notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS treatment_plans (
      id SERIAL PRIMARY KEY,
      case_file_id INTEGER NOT NULL,
      goal TEXT NOT NULL,
      strategy TEXT NOT NULL,
      duration TEXT NOT NULL,
      sessions_count INTEGER DEFAULT 8,
      final_evaluation TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS therapy_sessions (
      id SERIAL PRIMARY KEY,
      case_file_id INTEGER NOT NULL,
      session_number INTEGER NOT NULL,
      date TEXT NOT NULL,
      duration INTEGER NOT NULL,
      notes TEXT NOT NULL,
      session_next TEXT,
      status TEXT DEFAULT 'COMPLETED',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS case_progress (
      id SERIAL PRIMARY KEY,
      case_file_id INTEGER NOT NULL,
      progress_percentage INTEGER NOT NULL,
      notes TEXT,
      updated_by INTEGER NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS case_documents (
      id SERIAL PRIMARY KEY,
      case_file_id INTEGER NOT NULL,
      uploaded_by INTEGER NOT NULL,
      file_name TEXT NOT NULL,
      file_type TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      storage_path TEXT NOT NULL,
      visibility TEXT DEFAULT 'all',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS conversations (
      id SERIAL PRIMARY KEY,
      case_file_id INTEGER NOT NULL UNIQUE,
      title TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS conversation_participants (
      id SERIAL PRIMARY KEY,
      conversation_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS messages (
      id SERIAL PRIMARY KEY,
      conversation_id INTEGER NOT NULL,
      sender_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      attachment_url TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS message_read_statuses (
      id SERIAL PRIMARY KEY,
      message_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS appointments (
      id SERIAL PRIMARY KEY,
      case_file_id INTEGER NOT NULL,
      created_by INTEGER NOT NULL,
      specialist_id INTEGER NOT NULL,
      appointment_date TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      type TEXT NOT NULL,
      status TEXT DEFAULT 'CONFIRMED',
      notes TEXT,
      cancellation_reason TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS legal_consultations (
      id SERIAL PRIMARY KEY,
      case_file_id INTEGER NOT NULL,
      lawyer_id INTEGER NOT NULL,
      status TEXT DEFAULT 'IN_REVIEW',
      legal_opinion TEXT,
      recommendation TEXT,
      rejection_reason TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS treatment_follow_ups (
      id SERIAL PRIMARY KEY,
      case_file_id INTEGER NOT NULL,
      center_id INTEGER NOT NULL,
      week_number INTEGER NOT NULL,
      medical_notes TEXT NOT NULL,
      status_summary TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS ratings (
      id SERIAL PRIMARY KEY,
      case_file_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      rating INTEGER NOT NULL,
      feedback TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS notifications (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT DEFAULT 'info',
      link TEXT,
      is_read INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS audit_logs (
      id SERIAL PRIMARY KEY,
      user_id INTEGER,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT,
      details TEXT,
      ip_address TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS emergency_resources (
      id SERIAL PRIMARY KEY,
      title_ar TEXT NOT NULL,
      phone_number TEXT NOT NULL,
      description_ar TEXT NOT NULL,
      is_24_7 INTEGER DEFAULT 1
    );
    CREATE TABLE IF NOT EXISTS system_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS awareness_articles (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      topic TEXT,
      author TEXT,
      summary TEXT NOT NULL,
      content TEXT,
      file_url TEXT,
      file_name TEXT,
      file_size TEXT,
      tags TEXT,
      status TEXT DEFAULT 'published',
      is_featured INTEGER DEFAULT 0,
      created_by INTEGER,
      views_count INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

function seedReferenceData(db: DatabaseAdapter) {
  const roles = [
    ['مدير النظام', 'admin'],
    ['أخصائي نفسي', 'psychologist'],
    ['محامٍ ومستشار قانوني', 'lawyer'],
    ['مركز علاج الإدمان', 'treatment_center'],
    ['جمعية دعم مجتمعي', 'association'],
    ['ولي أمر / أسرة', 'family'],
    ['مستفيد / طالب مساعدة', 'patient'],
    ['زائر', 'guest'],
  ];
  roles.forEach(([name, slug]) => db.run(
    'INSERT INTO roles (name, slug) VALUES (?, ?) ON CONFLICT (slug) DO NOTHING',
    [name, slug],
  ));

  const wilayas = [
    ['01', 'أدرار', 'Adrar'], ['02', 'الشلف', 'Chlef'],
    ['03', 'الأغواط', 'Laghouat'], ['04', 'أم البواقي', 'Oum El Bouaghi'],
    ['05', 'باتنة', 'Batna'], ['06', 'بجاية', 'Béjaïa'],
    ['07', 'بسكرة', 'Biskra'], ['08', 'بشار', 'Béchar'],
    ['09', 'البليدة', 'Blida'], ['10', 'البويرة', 'Bouira'],
    ['11', 'تمنراست', 'Tamanrasset'], ['12', 'تبسة', 'Tébessa'],
    ['13', 'تلمسان', 'Tlemcen'], ['14', 'تيارت', 'Tiaret'],
    ['15', 'تيزي وزو', 'Tizi Ouzou'], ['16', 'الجزائر العاصمة', 'Alger'],
    ['17', 'الجلفة', 'Djelfa'], ['18', 'جيجل', 'Jijel'],
    ['19', 'سطيف', 'Sétif'], ['20', 'سعيدة', 'Saïda'],
    ['21', 'سكيكدة', 'Skikda'], ['22', 'سيدي بلعباس', 'Sidi Bel Abbès'],
    ['23', 'عنابة', 'Annaba'], ['24', 'قالمة', 'Guelma'],
    ['25', 'قسنطينة', 'Constantine'], ['26', 'المدية', 'Médéa'],
    ['27', 'مستغانم', 'Mostaganem'], ['28', 'المسيلة', "M'Sila"],
    ['29', 'معسكر', 'Mascara'], ['30', 'ورقلة', 'Ouargla'],
    ['31', 'وهران', 'Oran'], ['32', 'البيض', 'El Bayadh'],
    ['33', 'إليزي', 'Illizi'], ['34', 'برج بوعريريج', 'Bordj Bou Arréridj'],
    ['35', 'بومرداس', 'Boumerdès'], ['36', 'الطارف', 'El Tarf'],
    ['37', 'تندوف', 'Tindouf'], ['38', 'تسمسيلت', 'Tissemsilt'],
    ['39', 'الوادي', 'El Oued'], ['40', 'خنشلة', 'Khenchela'],
    ['41', 'سوق أهراس', 'Souk Ahras'], ['42', 'تيبازة', 'Tipaza'],
    ['43', 'ميلة', 'Mila'], ['44', 'عين الدفلى', 'Aïn Defla'],
    ['45', 'النعامة', 'Naâma'], ['46', 'عين تموشنت', 'Aïn Témouchent'],
    ['47', 'غرداية', 'Ghardaïa'], ['48', 'غليزان', 'Relizane'],
    ['49', 'تيميمون', 'Timimoun'], ['50', 'برج باجي مختار', 'Bordj Badji Mokhtar'],
    ['51', 'أولاد جلال', 'Ouled Djellal'], ['52', 'بني عباس', 'Béni Abbès'],
    ['53', 'عين صالح', 'In Salah'], ['54', 'عين قزام', 'In Guezzam'],
    ['55', 'تقرت', 'Touggourt'], ['56', 'جانت', 'Djanet'],
    ['57', 'المغير', 'El Meghaier'], ['58', 'المنيعة', 'El Meniaa'],
  ];
  wilayas.forEach(([code, nameAr, nameFr]) => db.run(
    'INSERT INTO wilayas (code, name_ar, name_fr) VALUES (?, ?, ?) ON CONFLICT (code) DO NOTHING',
    [code, nameAr, nameFr],
  ));

  const addictionTypes = [
    ['المخدرات والمؤثرات العقلية', 'Narcotics & Psychotropics', 'إدمان المواد الكيميائية والأقراص المهلوسة'],
    ['الكحول والمسكرات', 'Alcohol', 'إدمان المشروبات الكحولية واضطرابات الاعتماد'],
    ['الأدوية والمهدئات الطبية', 'Prescription Drugs', 'إساءة استخدام الأدوية الموصوفة والمسكنات الأفيونية'],
    ['الإدمان الرقمي والألعاب الإلكترونية', 'Digital & Gaming Addiction', 'قضاء ساعات مفرطة وعزلة اجتماعية واضطرابات السلوك الرقمي'],
    ['الميسر والقمار الإلكتروني', 'Gambling', 'اضطرابات المراهنات وتراكم الديون السلوكية'],
    ['أخرى (سلوكية / نفسية مختلطة)', 'Other', 'حالات مركبة تتطلب توجيهاً وتقييماً مخصصاً'],
  ];
  addictionTypes.forEach(([nameAr, nameEn, description]) => db.run(
    'INSERT INTO addiction_types (name_ar, name_en, description) SELECT ?, ?, ? WHERE NOT EXISTS (SELECT 1 FROM addiction_types WHERE name_ar = ?)',
    [nameAr, nameEn, description, nameAr],
  ));

  const emergencyResources = [
    ['الرقم الأخضر للإرشاد وعلاج الإدمان', '1099', 'خط ساخن وطني مجاني للاستماع والتوجيه السري على مدار الساعة'],
    ['الدرك الوطني (المساعدة وحماية القصر)', '1055', 'خط النجدة والإبلاغ عن حالات الخطر المحدق'],
    ['الشرطة والأمن الوطني', '1548', 'للأوضاع الطارئة والتدخل العاجل لحماية الأشخاص'],
    ['الحماية المدنية والإسعاف الفوري', '14', 'لحالات التسمم الحاد، الجرعات الزائدة، أو الطوارئ الطبية'],
  ];
  emergencyResources.forEach(([title, phone, description]) => db.run(
    'INSERT INTO emergency_resources (title_ar, phone_number, description_ar) SELECT ?, ?, ? WHERE NOT EXISTS (SELECT 1 FROM emergency_resources WHERE phone_number = ?)',
    [title, phone, description, phone],
  ));

  const settings = [
    ['platform_name', 'منصة الفرصة الثانية — Second Chance Platform'],
    ['primary_color', '#1565C0'],
    ['secondary_color', '#2E7D32'],
    ['official_email', 'contact@secondchance.dz'],
    ['max_file_size_mb', '10'],
    ['enable_ai_triage', '1'],
  ];
  settings.forEach(([key, value]) => db.run(
    'INSERT INTO system_settings (key, value) VALUES (?, ?) ON CONFLICT (key) DO NOTHING',
    [key, value],
  ));

  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@scp.dz').toLowerCase().trim();
  const configuredAdminPassword = process.env.ADMIN_PASSWORD;
  if (process.env.NODE_ENV === 'production' && !configuredAdminPassword) {
    throw new Error('ADMIN_PASSWORD is required in production.');
  }
  const adminPassword = configuredAdminPassword || 'SCP-Admin-2026!ChangeMe';
  const adminRole = queryOne<{ id: number }>('SELECT id FROM roles WHERE slug = ?', ['admin']);
  const existingAdmin = queryOne('SELECT id FROM users WHERE email = ?', [adminEmail]);
  if (!existingAdmin && adminRole) {
    db.run(`
      INSERT INTO users (first_name, last_name, email, phone, password, role_id, role_slug, wilaya_id, is_verified, status)
      VALUES (?, ?, ?, ?, ?, ?, 'admin', 1, 1, 'active')
    `, ['مدير', 'المنصة', adminEmail, process.env.ADMIN_PHONE || '0550000000',
      bcrypt.hashSync(adminPassword, 12), adminRole.id]);
    console.log(`✅ Primary admin account provisioned: ${adminEmail}`);
  }

  const currentAdmin = queryOne<{ id: number }>('SELECT id FROM users WHERE email = ?', [adminEmail]);
  if (currentAdmin) {
    const centersList = [
      ['01', 'المركز الوسيط لعلاج المدمنين – EPSP أدرار', '049 96 68 52', 'EPSP أدرار'],
      ['02', 'المركز الوسيط لمعالجة المدمنين – EPSP أولاد فارس', '027 77 20 74', 'EPSP أولاد فارس، الشلف'],
      ['03', 'المركز الوسيط لعلاج الإدمان – EPSP الأغواط', '029 90 65 09', 'EPSP الأغواط'],
      ['04', 'مصلحة الوقاية والمتابعة النفسية لعلاج الإدمان – EPSP أم البواقي', '', 'EPSP أم البواقي'],
      ['05', 'المركز الوسيط لمكافحة الإدمان – حملة 1', '033 23 68 61', 'حملة 1، باتنة'],
      ['06', 'المركز الوسيط لعلاج وتوجيه حالات الإدمان – مدينة بجاية', '034 20 76 51 / 034 20 78 63', 'مدينة بجاية'],
      ['07', 'الملحقة الجوارية للتكفل بمرضى الإدمان – وسط بسكرة', '033 75 59 58', 'وسط بسكرة'],
      ['08', 'المركز الوسيط لعلاج الإدمان – EPSP بشار', '049 38 37 885', 'EPSP بشار'],
      ['09', 'مركز علاج الإدمان الجواري بالأربعاء – طريق بوقرة', '025 33 00 81', 'الأربعاء – طريق بوقرة، البليدة'],
      ['10', 'المركز الوسيط لعلاج الإدمان بالشراقة (CISA)', '021 29 56 53', 'الشراقة، الجزائر العاصمة'],
      ['11', 'مصلحة المتابعة والتكفل بحالات الإدمان – EPSP تمنراست', '029 34 53 58', 'EPSP تمنراست'],
      ['12', 'المركز الوسيط لمكافحة الإدمان – تبسة', '0542 47 09 29', 'تبسة'],
      ['13', 'المركز الوسيط لمكافحة الإدمان "محمد خيرات"', '', 'تلمسان - التكفل الطبي والنفسي والتوجيه وإعادة الإدماج'],
      ['14', 'المركز الوسيط لعلاج وتوجيه حالات الإدمان – تيارت', '', 'تيارت'],
      ['15', 'مركز التكفل والمرافقة النفسية لمرضى الإدمان – تيزي وزو', '', 'تيزي وزو'],
      ['16', 'مركز الوقاية والعلاج النفسي بالمحمدية', '0555 51 74 89', 'المحمدية، الجزائر العاصمة'],
      ['17', 'المركز الوسيط لعلاج المدمنين – الجلفة', '027 90 97 38', 'الجلفة'],
      ['18', 'المركز الوسيط لعلاج الإدمان – حي قرية موسى', '034 50 27 27 / 034 50 28 28', 'حي قرية موسى، جيجل'],
      ['19', 'المركز الوسيط لعلاج الإدمان – سطيف', '036 91 76 67', 'سطيف'],
      ['20', 'المركز الوسيط لعلاج الإدمان – حي الزيتون', '048 47 18 52 / 048 51 51 88', 'حي الزيتون، سعيدة'],
      ['21', 'المركز الوسيط لمعالجة المدمنين (CISA سكيكدة) – وسط الولاية', '', 'وسط ولاية سكيكدة'],
      ['22', 'مصلحة التكفل النفسي وطب الإدمان – EPSP سيدي بلعباس', '', 'EPSP سيدي بلعباس'],
      ['23', 'المركز الوسيط لعلاج الإدمان برحال – بلدية برحال', '', 'بلدية برحال، عنابة'],
      ['24', 'الملحقة الجوارية للمرافقة النفسية وعلاج الإدمان – قالمة وسط', '', 'قالمة وسط'],
      ['25', 'المركز الوسيط لعلاج الإدمان "زواغي سليمان" – حي زواغي سليمان', '031 53 00 84', 'حي زواغي سليمان، والملحقة الصحية بالخروب، قسنطينة'],
      ['26', 'مركز التوجيه والمتابعة لمرضى الإدمان – EPSP المدية', '', 'EPSP المدية'],
      ['27', 'المركز الوسيط لعلاج وتوجيه حالات الإدمان – مستغانم', '', 'مستغانم'],
      ['28', 'مركز المتابعة النفسية والعلاج الجواري للإدمان – المسيلة', '', 'المسيلة'],
      ['29', 'المركز الوسيط لمكافحة الإدمان – مدينة معسكر وسط', '', 'مدينة معسكر وسط'],
      ['30', 'المركز الوسيط لعلاج المدمنين (CISA ورقلة) – EPSP ورقلة وسط', '', 'EPSP ورقلة وسط'],
      ['31', 'المركز الوسيط لمعالجة الإدمان – حي الصديقية', '', 'حي الصديقية، وهران (مع مصلحة استشفاء وحجز داخلي لإزالة السموم بالمستشفى الجامعي)'],
      ['32', 'الملحقة الجوارية للتكفل والمتابعة النفسية – EPSP البيض وسط', '', 'EPSP البيض وسط'],
      ['33', 'مصلحة المتابعة النفسية والتوجيه لمرضى الإدمان – الهياكل الصحية الجوارية', '', 'الهياكل الصحية الجوارية، إليزي'],
      ['34', 'المركز الوسيط لعلاج الإدمان – عاصمة الولاية', '', 'عاصمة ولاية برج بوعريريج'],
      ['35', 'مركز المتابعة النفسية والعلاج الجواري (CISA) – وسط بومرداس', '', 'وسط بومرداس'],
      ['36', 'المركز الوسيط لمعالجة المدمنين – وسط ولاية الطارف', '', 'وسط ولاية الطارف'],
      ['37', 'مصلحة الاستقبال والتوجيه النفسي لحالات الإدمان – EPSP تندوف', '', 'EPSP تندوف'],
      ['38', 'المركز الوسيط لعلاج وتوجيه حالات الإدمان – تسمسيلت وسط', '', 'تسمسيلت وسط'],
      ['39', 'مركز معالجة الإدمان الجواري – وسط ولاية الوادي', '', 'وسط ولاية الوادي'],
      ['40', 'المركز الوسيط لعلاج وتوجيه المدمنين – مدينة خنشلة وسط', '', 'مدينة خنشلة وسط'],
    ];

    centersList.forEach(([code, name, phone, address]) => {
      const wilaya = queryOne<{ id: number }>('SELECT id FROM wilayas WHERE code = ?', [code]);
      if (wilaya) {
        db.run(`
          INSERT INTO centers (user_id, name, wilaya_id, address, phone, services, verification_status)
          SELECT ?, ?, ?, ?, ?, ?, 'approved'
          WHERE NOT EXISTS (SELECT 1 FROM centers WHERE name = ?)
        `, [currentAdmin.id, name, wilaya.id, address, phone, 'علاج وتأهيل الإدمان، التكفل الطبي والنفسي، الاستشفاء وإزالة السموم', name]);
      }
    });

    const initialArticles = [
      {
        title: 'دراسة سريرية وميدانية: تفشي إساءة استخدام الأدوية ذات التأثير النفسي (البريغابالين ومزيج المهدئات) وبروتوكول الفطام الطبي',
        category: 'دراسة علمية محكّمة',
        topic: 'المؤثرات العقلية والمهدئات',
        author: 'اللجنة العلمية الوطنية لطب الإدمان والسموم',
        summary: 'دراسة استقصائية معمقة حول الآليات العصبية للإدمان على مشتقات البريغابالين، مخاطر الخلط مع الكحول والمهدئات الأخرى، ومسارات العلاج الطبي الآمن بالأدوية البديلة والدعم السلوكي المعرفي.',
        content: `مقدمة الدراسة وأهدافها:
هدفت هذه الدراسة إلى تقييم التغيرات الفيزيولوجية والسلوكية لدى عينة من 450 حالة خضعت لبرامج الفطام في المراكز الوسيطة لعلاج الإدمان (CISA).

أبرز النتائج السريرية:
1. ارتباط إساءة الاستخدام بالجرعات التصاعدية غير الموصوفة طبياً والتي تتجاوز الحدود العلاجية بـ 4 إلى 8 أضعاف.
2. تطور أعراض انسحابية حادة (قلق شديد، رعاش، أرق، ونوبات اختلاجية محتملة) عند التوقف المفاجئ دون إشراف طبي.
3. تفوق بروتوكول التخفيض التدريجي الدوائي المدعوم بالعلاج النفسي السلوكي في رفع نسبة التعافي المستدام إلى 73% خلال 6 أشهر.

التوصيات:
- تشديد الرقابة على سلاسل توزيع المؤثرات العقلية.
- اعتماد مسارات علاج بديلة في المراكز الجوارية دون تجريم المتعاطي المتقدم طوعاً للعلاج وفق المادة 06 مكرر من القانون الوطني لمكافحة المخدرات.`,
        file_name: 'Etude_Clinique_Psychotropes_Algerie_2025.pdf',
        file_size: '3.8 ميغابايت',
        file_url: 'data:application/pdf;base64,JVBERi0xLjQKJcTl8uXrCjEgMCBvYmoKPDwKL1R5cGUgL0NhdGFsb2cKL1BhZ2VzIDIgMCBSCj4+CmVuZG9iagoyIDAgb2JqCjw8Ci9UeXBlIC9QYWdlcwovS2lkcyBbMyAwIFJdCi9Db3VudCAxCi9NZWRpYUJveCBbMCAwIDU5NSA4NDJdCj4+CmVuZG9iagozIDAgb2JqCjw8Ci9UeXBlIC9QYWdlCi9QYXJlbnQgMiAwIFIKL1Jlc291cmNlcyA8PAovRm9udCA8PAovRjEgPDwKL1R5cGUgL0ZvbnQKL1N1YnR5cGUgL1R5cGUxCi9CYXNlRm9udCAvSGVsdmV0aWNhCj4+Cj4+Cj4+Ci9Db250ZW50cyA0IDAgUgo+PgpldmRvYmoK',
        tags: 'المؤثرات العقلية, بريغابالين, إزالة السموم, طب الإدمان, دراسة سريرية',
        is_featured: 1,
        views_count: 245
      },
      {
        title: 'الخصائص الدوائية والمخاطر السمية للمخدرات التخليقية الحديثة (الكريستال ميث / الشبو والكانابينويد المصنّع)',
        category: 'علم السموم والأبحاث المخبرية',
        topic: 'المخدرات التخليقية',
        author: 'المعهد الوطني للسموم بالتعاون مع المخبر المركزي للأدلة الجنائية',
        summary: 'ورقة بحثية علمية توثق التركيبات الكيميائية الدقيقة للمنشطات التخليقية ومعدل الضرر الدماغي المباشر وتأثيرها على استنزاف هرمون الدوبامين وحدوث الذهان التسممي الحاد.',
        content: `خلفية البحث:
تعد المركبات التخليقية من أخطر ما يواجه المصالح الاستعجالية والطبية لما تسببه من سمية قلبية وعصبية سريعة الظهور.

التحليل الدوائي والمخبري:
- المواد المصنعة تؤدي إلى زيادة فورية في إفراز النواقل العصبية (الدوبامين بنسبة تتجاوز 1000%) مما يحدث شعوراً زائفاً بالنشوة يتبعه انهيار كيميائي عصبي حاد.
- ظهور أعراض الذهان البارانوي، الهلاوس السمعية والبصرية، والسلوك العدواني في مراحل مبكرة مقارنة بالمخدرات التقليدية.

بروتوكول الاستجابة الطبية العاجلة:
- تهدئة المريض في بيئة هادئة منخفضة المحفزات.
- إجراء فحص التخطيط القلبي ومراقبة درجة الحرارة والضغط الشرياني.
- إشراك الطبيب النفسي فور استقرار الحالة الحيوية لتفادي نوبات الاكتئاب الحاد والميول الانتحارية.`,
        file_name: 'Synthese_Toxicologique_Drogues_Synthese.pdf',
        file_size: '4.2 ميغابايت',
        file_url: 'data:application/pdf;base64,JVBERi0xLjQKJcTl8uXrCjEgMCBvYmoKPDwKL1R5cGUgL0NhdGFsb2cKL1BhZ2VzIDIgMCBSCj4+CmVuZG9iago=',
        tags: 'كريستال ميث, الشبو, المخدرات التخليقية, سموم, ذهان تسممي, استعجالات',
        is_featured: 1,
        views_count: 312
      },
      {
        title: 'دليل الكشف المبكر والتدخل الأسري: المؤشرات السلوكية والفيزيولوجية للتعاطي وسبل الحوار البنّاء',
        category: 'دليل إرشادي ووقائي',
        topic: 'الإرشاد والتوعية الأسرية',
        author: 'وحدة الإرشاد الأسري والتأهيل المجتمعي – منصة الفرصة الثانية',
        summary: 'دليل عملي وتطبيقي موجه للآباء والمربين يشرح كيفية التفريق بين اضطرابات المراهقة الطبيعية وبدايات التعاطي، وخطوات احتواء المريض وتشجيعه على العلاج دون عنف أو وصم.',
        content: `محاور الدليل:
1. العلامات السلوكية المنذرة (تغير مفاجئ في الأصدقاء، تراجع دراسي حاد، تقلبات مزاجية عنيفة، طلب متكرر للأموال دون مبرر).
2. العلامات الفيزيولوجية (احمرار العينين، اتساع أو تضيق حدقة العين، اضطرابات الشهية والنوم، شحوب الوجه ورعشة اليدين).
3. خطوات إدارة جلسة الحوار الأولى:
   - اختيار توقيت هادئ يخلو من التوتر أو تعاطي المادة في اللحظة ذاتها.
   - التركيز على مشاعر الحب والخوف على صحته ومستقبله بدلاً من الاتهام والعقاب.
   - الاتفاق على موعد استشارة سرية مع أخصائي نفسي أو طبيب إدمان معتمد.`,
        file_name: 'Guide_Prevention_Familiale_Addiction.pdf',
        file_size: '2.5 ميغابايت',
        file_url: 'data:application/pdf;base64,JVBERi0xLjQKJcTl8uXrCjEgMCBvYmoKPDwKL1R5cGUgL0NhdGFsb2cKL1BhZ2VzIDIgMCBSCj4+CmVuZG9iago=',
        tags: 'دليل الأسرة, الوقاية, كشف مبكر, حوار أسري, علاج الإدمان',
        is_featured: 0,
        views_count: 189
      }
    ];

    initialArticles.forEach(art => {
      db.run(`
        INSERT INTO awareness_articles (title, category, topic, author, summary, content, file_name, file_size, file_url, tags, status, is_featured, created_by, views_count)
        SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'published', ?, ?, ?
        WHERE NOT EXISTS (SELECT 1 FROM awareness_articles WHERE title = ?)
      `, [art.title, art.category, art.topic, art.author, art.summary, art.content, art.file_name, art.file_size, art.file_url, art.tags, art.is_featured, currentAdmin.id, art.views_count, art.title]);
    });
  }
}