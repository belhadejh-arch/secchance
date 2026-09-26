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
      if (Array.isArray(payload.batch)) {
        const results = [];
        await client.query('BEGIN');
        try {
          for (const statement of payload.batch) {
            const params = (statement.params || []).map(value => {
              if (value && typeof value === 'object' && Number.isInteger(value.__batchResult)) {
                const result = results[value.__batchResult];
                return result?.rows?.[0]?.[value.column || 'id'] ?? null;
              }
              return value;
            });
            const result = await client.query(statement.sql, params);
            if (statement.expectRowCount !== undefined && result.rowCount !== statement.expectRowCount) {
              throw new Error('Expected ' + statement.expectRowCount + ' affected row(s), received ' + result.rowCount);
            }
            results.push({ rows: result.rows, rowCount: result.rowCount });
          }
          await client.query('COMMIT');
          process.stdout.write(JSON.stringify({ results }));
        } catch (error) {
          await client.query('ROLLBACK').catch(() => {});
          throw error;
        }
      } else {
        const result = await client.query(payload.sql, payload.params || []);
        process.stdout.write(JSON.stringify({ rows: result.rows, rowCount: result.rowCount }));
      }
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
      const rowCount = sqliteDb.getRowsModified();
      const lastIdRes = sqliteDb.exec('SELECT last_insert_rowid() as id');
      const lastInsertRowId = Number(lastIdRes[0]?.values[0]?.[0] || 0);
      return { rows: [{ id: lastInsertRowId } as any], rowCount };
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

export interface BatchStatement {
  sql: string;
  params?: any[];
  expectRowCount?: number;
}

export interface BatchResult {
  rows: any[];
  rowCount: number;
  lastInsertRowId: number;
  changes: number;
}

export function executeBatch(statements: BatchStatement[]): BatchResult[] {
  if (!initialized) throw new Error('Database not initialized');
  if (statements.length === 0) return [];
  if (!databaseUrl) {
    if (!sqliteDb) throw new Error('Database not initialized');
    const results: BatchResult[] = [];
    sqliteDb.run('BEGIN TRANSACTION');
    try {
      for (const statement of statements) {
        const params = (statement.params || []).map((value: any) => {
          if (value && typeof value === 'object' && Number.isInteger(value.__batchResult)) {
            const result = results[value.__batchResult];
            return result?.rows?.[0]?.[value.column || 'id'] ?? null;
          }
          return value;
        });
        const result = executeDatabase<any>(toPostgresSql(statement.sql), params);
        if (statement.expectRowCount !== undefined && result.rowCount !== statement.expectRowCount) {
          throw new Error(`Expected ${statement.expectRowCount} affected row(s), received ${result.rowCount}`);
        }
        results.push({
          rows: result.rows,
          rowCount: result.rowCount,
          lastInsertRowId: Number(result.rows[0]?.id || 0),
          changes: result.rowCount || 0,
        });
      }
      sqliteDb.run('COMMIT');
      return results;
    } catch (error) {
      sqliteDb.run('ROLLBACK');
      throw error;
    }
  }

  const batch = statements.map(statement => ({
    sql: toPostgresSql(statement.sql),
    params: statement.params || [],
    expectRowCount: statement.expectRowCount,
  }));
  const result = spawnSync(process.execPath, ['-e', databaseWorker], {
    input: JSON.stringify({ batch }),
    encoding: 'utf8',
    timeout: 30000,
    env: process.env,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`PostgreSQL transaction failed: ${result.stderr || 'unknown database error'}`);
  }
  try {
    const response = JSON.parse(result.stdout || '{"results":[]}');
    return (response.results || []).map((item: any) => ({
      rows: item.rows || [],
      rowCount: item.rowCount || 0,
      lastInsertRowId: Number(item.rows?.[0]?.id || 0),
      changes: item.rowCount || 0,
    }));
  } catch {
    throw new Error(`PostgreSQL returned an invalid transaction response: ${result.stdout}`);
  }
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
    CREATE TABLE IF NOT EXISTS services (
      id SERIAL PRIMARY KEY,
      provider_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      amount_dzd INTEGER NOT NULL DEFAULT 0,
      category TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS service_requests (
      id SERIAL PRIMARY KEY,
      case_file_id INTEGER NOT NULL UNIQUE,
      requester_id INTEGER NOT NULL,
      provider_id INTEGER NOT NULL,
      service_id INTEGER NOT NULL,
      addiction_type_id INTEGER NOT NULL,
      amount_dzd INTEGER NOT NULL,
      payment_status TEXT NOT NULL DEFAULT 'NOT_REQUIRED',
      status TEXT NOT NULL DEFAULT 'WAITING_PROVIDER',
      priority TEXT NOT NULL,
      description TEXT NOT NULL,
      rejection_reason TEXT,
      appointment_id INTEGER,
      assigned_staff_id INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS request_history (
      id SERIAL PRIMARY KEY,
      request_id INTEGER NOT NULL,
      user_id INTEGER,
      action TEXT NOT NULL,
      from_status TEXT,
      to_status TEXT,
      details TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS service_reports (
      id SERIAL PRIMARY KEY,
      request_id INTEGER NOT NULL,
      provider_id INTEGER NOT NULL,
      assessment TEXT,
      professional_notes TEXT,
      recommendations TEXT,
      treatment_plan TEXT,
      next_appointment TEXT,
      client_summary TEXT,
      final_evaluation TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS payments (
      id SERIAL PRIMARY KEY,
      request_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      provider_id INTEGER NOT NULL,
      amount_dzd INTEGER NOT NULL,
      currency TEXT NOT NULL DEFAULT 'dzd',
      payment_method TEXT NOT NULL,
      transaction_id TEXT,
      status TEXT NOT NULL DEFAULT 'PROCESSING',
      gateway_checkout_id TEXT UNIQUE,
      checkout_url TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      paid_at TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS payment_transactions (
      id SERIAL PRIMARY KEY,
      payment_id INTEGER NOT NULL,
      gateway TEXT NOT NULL,
      gateway_transaction_id TEXT,
      gateway_checkout_id TEXT,
      amount_dzd INTEGER NOT NULL,
      currency TEXT NOT NULL,
      status TEXT NOT NULL,
      event_id TEXT UNIQUE,
      payload TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS refunds (
      id SERIAL PRIMARY KEY,
      payment_id INTEGER NOT NULL,
      requested_by INTEGER,
      amount_dzd INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'REQUESTED',
      reason TEXT,
      gateway_refund_id TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS provider_staff (
      id SERIAL PRIMARY KEY,
      provider_id INTEGER NOT NULL,
      staff_user_id INTEGER NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (provider_id, staff_user_id)
    );
    CREATE TABLE IF NOT EXISTS payment_checkout_locks (
      request_id INTEGER PRIMARY KEY,
      lock_token TEXT NOT NULL UNIQUE,
      payment_id INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_services_provider_active ON services (provider_id, is_active);
    CREATE INDEX IF NOT EXISTS idx_service_requests_provider_status ON service_requests (provider_id, status);
    CREATE INDEX IF NOT EXISTS idx_service_requests_requester_created ON service_requests (requester_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_request_history_request ON request_history (request_id, id);
    CREATE INDEX IF NOT EXISTS idx_service_reports_request ON service_reports (request_id, id);
    CREATE INDEX IF NOT EXISTS idx_payments_request_status ON payments (request_id, status);
    CREATE INDEX IF NOT EXISTS idx_payment_transactions_payment ON payment_transactions (payment_id, id);
    CREATE INDEX IF NOT EXISTS idx_provider_staff_staff_active ON provider_staff (staff_user_id, is_active);
  `);
  // Existing PostgreSQL installations may already have the first version of
  // service_requests. Keep data intact while adding the staff-assignment field.
  if (databaseUrl) {
    db.run('ALTER TABLE service_requests ADD COLUMN IF NOT EXISTS assigned_staff_id INTEGER');
  }
  db.run('CREATE INDEX IF NOT EXISTS idx_service_requests_assigned_staff ON service_requests (assigned_staff_id)');
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
    ['show_rejection_reason_to_client', 'false'],
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
  const adminRole = queryOne<{ id: number }>('SELECT id FROM roles WHERE slug = ?', ['admin']);
  const existingAdmin = queryOne('SELECT id FROM users WHERE email = ?', [adminEmail]);
  if (!existingAdmin && adminRole && configuredAdminPassword) {
    db.run(`
      INSERT INTO users (first_name, last_name, email, phone, password, role_id, role_slug, wilaya_id, is_verified, status)
      VALUES (?, ?, ?, ?, ?, ?, 'admin', 1, 1, 'active')
    `, ['مدير', 'المنصة', adminEmail, process.env.ADMIN_PHONE || '',
      bcrypt.hashSync(configuredAdminPassword, 12), adminRole.id]);
    console.log(`✅ Primary admin account provisioned: ${adminEmail}`);
  }

}