import initSqlJs, { Database } from 'sql.js';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'scp_database.sqlite');

let dbInstance: Database | null = null;

// Helper to save DB to disk
export function saveDb(): void {
  if (!dbInstance) return;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const data = dbInstance.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  } catch (err) {
    console.error('Error saving SQLite database to disk:', err);
  }
}

// Database helper functions
export function query<T = any>(sql: string, params: any[] = []): T[] {
  if (!dbInstance) throw new Error('Database not initialized');
  const stmt = dbInstance.prepare(sql);
  if (params.length > 0) {
    stmt.bind(params);
  }
  const results: T[] = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject() as T);
  }
  stmt.free();
  return results;
}

export function queryOne<T = any>(sql: string, params: any[] = []): T | null {
  const results = query<T>(sql, params);
  return results.length > 0 ? results[0] : null;
}

export function execute(sql: string, params: any[] = []): { lastInsertRowId: number; changes: number } {
  if (!dbInstance) throw new Error('Database not initialized');
  if (params.length === 0) {
    dbInstance.run(sql);
  } else {
    dbInstance.run(sql, params);
  }
  saveDb();
  
  const lastIdRes = dbInstance.exec('SELECT last_insert_rowid() as id');
  const lastInsertRowId = lastIdRes[0]?.values[0]?.[0] ? Number(lastIdRes[0].values[0][0]) : 0;
  
  return { lastInsertRowId, changes: 1 };
}

export async function getDb(): Promise<Database> {
  if (dbInstance) return dbInstance;

  const SQL = await initSqlJs();

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (fs.existsSync(DB_PATH)) {
    try {
      const fileBuffer = fs.readFileSync(DB_PATH);
      dbInstance = new SQL.Database(fileBuffer);
    } catch (err) {
      console.warn('Failed to load existing database file, creating fresh DB:', err);
      dbInstance = new SQL.Database();
    }
  } else {
    dbInstance = new SQL.Database();
  }

  // Create tables & seed data
  initSchema(dbInstance);
  saveDb();
  return dbInstance;
}

function initSchema(db: Database) {
  db.run(`
    CREATE TABLE IF NOT EXISTS roles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS permissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS role_has_permissions (
      role_id INTEGER NOT NULL,
      permission_id INTEGER NOT NULL,
      PRIMARY KEY (role_id, permission_id)
    );

    CREATE TABLE IF NOT EXISTS wilayas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE,
      name_ar TEXT NOT NULL,
      name_fr TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS communes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      wilaya_id INTEGER NOT NULL,
      name TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS addiction_types (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name_ar TEXT NOT NULL,
      name_en TEXT NOT NULL,
      description TEXT,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
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
      status TEXT DEFAULT 'active', -- 'active', 'pending_approval', 'suspended'
      avatar_url TEXT,
      last_login_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS specialist_profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL UNIQUE,
      specialty TEXT NOT NULL,
      license_number TEXT NOT NULL,
      years_of_experience INTEGER DEFAULT 1,
      bio TEXT,
      verification_status TEXT DEFAULT 'approved', -- 'pending', 'approved', 'rejected'
      availability_schedule TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS centers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      wilaya_id INTEGER NOT NULL,
      address TEXT,
      phone TEXT,
      services TEXT,
      capacity INTEGER DEFAULT 50,
      current_occupancy INTEGER DEFAULT 0,
      verification_status TEXT DEFAULT 'approved',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS associations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      wilaya_id INTEGER NOT NULL,
      address TEXT,
      phone TEXT,
      services TEXT,
      verification_status TEXT DEFAULT 'approved',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS case_files (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      number_case TEXT NOT NULL UNIQUE,
      created_by INTEGER NOT NULL,
      patient_id INTEGER NOT NULL,
      assigned_psychologist_id INTEGER,
      assigned_lawyer_id INTEGER,
      treatment_center_id INTEGER,
      addiction_type_id INTEGER NOT NULL,
      priority TEXT NOT NULL, -- 'Critical', 'High', 'Medium', 'Low'
      status TEXT NOT NULL, -- 'NEW', 'UNDER_REVIEW', 'ASSIGNED', 'FIRST_SESSION', 'FOLLOW_UP', 'REFERRED', 'COMPLETED', 'ARCHIVED'
      description TEXT NOT NULL,
      target_response_hours INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS case_notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      case_file_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      note TEXT NOT NULL,
      is_private INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS case_assignments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      case_file_id INTEGER NOT NULL,
      specialist_id INTEGER NOT NULL,
      assigned_by INTEGER NOT NULL,
      role_type TEXT NOT NULL,
      status TEXT DEFAULT 'accepted',
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS assessments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      case_file_id INTEGER NOT NULL,
      psychologist_id INTEGER NOT NULL,
      severity TEXT NOT NULL, -- 'Mild', 'Moderate', 'Severe', 'Extreme'
      recommendation TEXT NOT NULL,
      mental_health_notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS treatment_plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      case_file_id INTEGER NOT NULL,
      goal TEXT NOT NULL,
      strategy TEXT NOT NULL,
      duration TEXT NOT NULL,
      sessions_count INTEGER DEFAULT 8,
      final_evaluation TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS therapy_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      case_file_id INTEGER NOT NULL,
      session_number INTEGER NOT NULL,
      date TEXT NOT NULL,
      duration INTEGER NOT NULL, -- minutes
      notes TEXT NOT NULL,
      session_next TEXT,
      status TEXT DEFAULT 'COMPLETED',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS case_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      case_file_id INTEGER NOT NULL,
      progress_percentage INTEGER NOT NULL, -- 0, 10, 25, 50, 75, 100
      notes TEXT,
      updated_by INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS case_documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      case_file_id INTEGER NOT NULL,
      uploaded_by INTEGER NOT NULL,
      file_name TEXT NOT NULL,
      file_type TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      storage_path TEXT NOT NULL,
      visibility TEXT DEFAULT 'all', -- 'all', 'medical_only', 'legal_only', 'admin_only'
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS conversations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      case_file_id INTEGER NOT NULL UNIQUE,
      title TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS conversation_participants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      conversation_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      joined_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      conversation_id INTEGER NOT NULL,
      sender_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      attachment_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS message_read_statuses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      message_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      read_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS appointments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      case_file_id INTEGER NOT NULL,
      created_by INTEGER NOT NULL,
      specialist_id INTEGER NOT NULL,
      appointment_date TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      type TEXT NOT NULL, -- 'psychological', 'legal', 'treatment', 'referral'
      status TEXT DEFAULT 'CONFIRMED', -- 'PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW', 'RESCHEDULED'
      notes TEXT,
      cancellation_reason TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS legal_consultations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      case_file_id INTEGER NOT NULL,
      lawyer_id INTEGER NOT NULL,
      status TEXT DEFAULT 'IN_REVIEW', -- 'PENDING', 'ACCEPTED', 'IN_REVIEW', 'COMPLETED', 'REJECTED'
      legal_opinion TEXT,
      recommendation TEXT,
      rejection_reason TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS treatment_follow_ups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      case_file_id INTEGER NOT NULL,
      center_id INTEGER NOT NULL,
      week_number INTEGER NOT NULL,
      medical_notes TEXT NOT NULL,
      status_summary TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS ratings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      case_file_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      rating INTEGER NOT NULL,
      feedback TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT DEFAULT 'info',
      link TEXT,
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT,
      details TEXT,
      ip_address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS emergency_resources (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title_ar TEXT NOT NULL,
      phone_number TEXT NOT NULL,
      description_ar TEXT NOT NULL,
      is_24_7 INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS system_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  // Seed default data if empty
  const roleCount = query<{ count: number }>('SELECT COUNT(*) as count FROM roles')[0]?.count || 0;
  if (roleCount === 0) {
    seedInitialData(db);
  }
}

function seedInitialData(db: Database) {
  // Roles
  const roles = [
    { name: 'مدير النظام', slug: 'admin' },
    { name: 'أخصائي نفسي', slug: 'psychologist' },
    { name: 'محامٍ ومستشار قانوني', slug: 'lawyer' },
    { name: 'مركز علاج الإدمان', slug: 'treatment_center' },
    { name: 'جمعية دعم مجتمعي', slug: 'association' },
    { name: 'ولي أمر / أسرة', slug: 'family' },
    { name: 'مستفيد / طالب مساعدة', slug: 'patient' },
    { name: 'زائر', slug: 'guest' },
  ];

  roles.forEach(r => {
    db.run('INSERT INTO roles (name, slug) VALUES (?, ?)', [r.name, r.slug]);
  });

  // Wilayas of Algeria (sample key wilayas)
  const wilayas = [
    { code: '16', name_ar: 'الجزائر العاصمة', name_fr: 'Alger' },
    { code: '31', name_ar: 'وهران', name_fr: 'Oran' },
    { code: '25', name_ar: 'قسنطينة', name_fr: 'Constantine' },
    { code: '19', name_ar: 'سطيف', name_fr: 'Sétif' },
    { code: '06', name_ar: 'بجاية', name_fr: 'Béjaïa' },
    { code: '09', name_ar: 'البليدة', name_fr: 'Blida' },
    { code: '15', name_ar: 'تيزي وزو', name_fr: 'Tizi Ouzou' },
    { code: '13', name_ar: 'تلمسان', name_fr: 'Tlemcen' },
    { code: '23', name_ar: 'عنابة', name_fr: 'Annaba' },
    { code: '35', name_ar: 'بومرداس', name_fr: 'Boumerdès' },
    { code: '30', name_ar: 'ورقلة', name_fr: 'Ouargla' },
    { code: '47', name_ar: 'غرداية', name_fr: 'Ghardaïa' },
  ];

  wilayas.forEach(w => {
    db.run('INSERT INTO wilayas (code, name_ar, name_fr) VALUES (?, ?, ?)', [w.code, w.name_ar, w.name_fr]);
  });

  // Addiction types
  const addictionTypes = [
    { name_ar: 'المخدرات والمؤثرات العقلية', name_en: 'Narcotics & Psychotropics', desc: 'إدمان المواد الكيميائية والأقراص المهلوسة' },
    { name_ar: 'الكحول والمسكرات', name_en: 'Alcohol', desc: 'إدمان المشروبات الكحولية واضطرابات الاعتماد' },
    { name_ar: 'الأدوية والمهدئات الطبية', name_en: 'Prescription Drugs', desc: 'إساءة استخدام الأدوية الموصوفة والمسكنات الأفيونية' },
    { name_ar: 'الإدمان الرقمي والألعاب الإلكترونية', name_en: 'Digital & Gaming Addiction', desc: 'قضاء ساعات مفرطة وعزلة اجتماعية واضطرابات السلوك الرقمي' },
    { name_ar: 'الميسر والقمار الإلكتروني', name_en: 'Gambling', desc: 'اضطرابات المراهنات وتراكم الديون السلوكية' },
    { name_ar: 'أخرى (سلوكية / نفسية مختلطة)', name_en: 'Other', desc: 'حالات مركبة تتطلب توجيهاً وتقييماً مخصصاً' },
  ];

  addictionTypes.forEach(a => {
    db.run('INSERT INTO addiction_types (name_ar, name_en, description) VALUES (?, ?, ?)', [a.name_ar, a.name_en, a.desc]);
  });

  // Emergency resources
  const emergencies = [
    { title: 'الرقم الأخضر للإرشاد وعلاج الإدمان', phone: '1099', desc: 'خط ساخن وطني مجاني للاستماع والتوجيه السري على مدار الساعة', is24: 1 },
    { title: 'الدرك الوطني (المساعدة وحماية القصر)', phone: '1055', desc: 'خط النجدة والإبلاغ عن حالات الخطر المحدق', is24: 1 },
    { title: 'الشرطة والأمن الوطني', phone: '1548', desc: 'للأوضاع الطارئة والتدخل العاجل لحماية الأشخاص', is24: 1 },
    { title: 'الحماية المدنية والإسعاف الفوري', phone: '14', desc: 'لحالات التسمم الحاد، الجرعات الزائدة، أو الطوارئ الطبية', is24: 1 },
  ];

  emergencies.forEach(e => {
    db.run('INSERT INTO emergency_resources (title_ar, phone_number, description_ar, is_24_7) VALUES (?, ?, ?, ?)', [e.title, e.phone, e.desc, e.is24]);
  });

  // Default system settings
  db.run('INSERT INTO system_settings (key, value) VALUES (?, ?)', ['platform_name', 'منصة الفرصة الثانية — Second Chance Platform']);
  db.run('INSERT INTO system_settings (key, value) VALUES (?, ?)', ['primary_color', '#1565C0']);
  db.run('INSERT INTO system_settings (key, value) VALUES (?, ?)', ['secondary_color', '#2E7D32']);
  db.run('INSERT INTO system_settings (key, value) VALUES (?, ?)', ['official_email', 'contact@secondchance.dz']);
  db.run('INSERT INTO system_settings (key, value) VALUES (?, ?)', ['max_file_size_mb', '10']);
  db.run('INSERT INTO system_settings (key, value) VALUES (?, ?)', ['enable_ai_triage', '1']);

  // Initial users for every role with hashed password "password123"
  const passwordHash = bcrypt.hashSync('password123', 10);

  // 1. Admin
  db.run(`
    INSERT INTO users (first_name, last_name, email, phone, password, role_id, role_slug, wilaya_id, is_verified, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 'active')
  `, ['سفيان', 'بن علي', 'admin@scp.dz', '0550112233', passwordHash, 1, 'admin', 1]);

  // 2. Psychologist
  db.run(`
    INSERT INTO users (first_name, last_name, email, phone, password, role_id, role_slug, wilaya_id, is_verified, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 'active')
  `, ['د. نادية', 'قادري', 'psychologist@scp.dz', '0661223344', passwordHash, 2, 'psychologist', 1]);

  db.run(`
    INSERT INTO specialist_profiles (user_id, specialty, license_number, years_of_experience, bio, verification_status, availability_schedule)
    VALUES (2, 'علم النفس العيادي وعلاج الإدمان السلوكي', 'DZ-PSY-2021-884', 12, 'أخصائية نفسية عيادية معتمدة متخصصة في العلاج المعرفي السلوكي (CBT) وإعادة التأهيل النفسي لمتعاطي المواد المخدرة.', 'approved', 'الأحد إلى الخميس: 09:00 - 16:00')
  `);

  // 3. Lawyer
  db.run(`
    INSERT INTO users (first_name, last_name, email, phone, password, role_id, role_slug, wilaya_id, is_verified, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 'active')
  `, ['أ. عبد النور', 'مصباح', 'lawyer@scp.dz', '0770334455', passwordHash, 3, 'lawyer', 1]);

  db.run(`
    INSERT INTO specialist_profiles (user_id, specialty, license_number, years_of_experience, bio, verification_status, availability_schedule)
    VALUES (3, 'القانون الجنائي وقضايا حماية المستهلك والوقاية من المخدرات', 'DZ-BAR-ALG-1994', 15, 'محامٍ معتمد لدى منظمة المحامين بالعاصمة، متخصص في تدابير العلاج الإجباري والبدائل القانونية وتأهيل الأحداث.', 'approved', 'الاثنين والأربعاء: 13:00 - 17:00')
  `);

  // 4. Treatment Center
  db.run(`
    INSERT INTO users (first_name, last_name, email, phone, password, role_id, role_slug, wilaya_id, is_verified, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 'active')
  `, ['مركز الأمل', 'لعلاج الإدمان', 'center@scp.dz', '021998877', passwordHash, 4, 'treatment_center', 1]);

  db.run(`
    INSERT INTO centers (user_id, name, wilaya_id, address, phone, services, capacity, current_occupancy, verification_status)
    VALUES (4, 'مركز الأمل الوطني للاستشفاء وإزالة السموم', 1, 'الجزائر العاصمة - دالي براهيم', '021998877', 'إزالة السموم الطبية (Detox), المتابعة النفسية الإقامية, التأهيل الرياضي والغذائي', 60, 28, 'approved')
  `);

  // 5. Association
  db.run(`
    INSERT INTO users (first_name, last_name, email, phone, password, role_id, role_slug, wilaya_id, is_verified, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 'active')
  `, ['جمعية بصائر', 'للإدماج الاجتماعي', 'association@scp.dz', '023445566', passwordHash, 5, 'association', 2]);

  db.run(`
    INSERT INTO associations (user_id, name, wilaya_id, address, phone, services, verification_status)
    VALUES (5, 'جمعية بصائر للتكفل الأسري والإدماج المهني', 2, 'وهران - حي مرافال', '023445566', 'ورشات تدريب مهني، دعم أسري، مرافقة بعد التعافي، توزيع حقائب مدرسية ودعم اجتماعي', 'approved')
  `);

  // 6. Family User
  db.run(`
    INSERT INTO users (first_name, last_name, email, phone, password, role_id, role_slug, wilaya_id, is_verified, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 'active')
  `, ['فاطمة الزهراء', 'براهيمي', 'family@scp.dz', '0555667788', passwordHash, 6, 'family', 1]);

  // 7. Patient User
  db.run(`
    INSERT INTO users (first_name, last_name, email, phone, password, role_id, role_slug, wilaya_id, is_verified, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 'active')
  `, ['أمين', 'براهيمي', 'patient@scp.dz', '0555998877', passwordHash, 7, 'patient', 1]);

  // Initial Case File for demonstration and realistic interaction
  db.run(`
    INSERT INTO case_files (
      number_case, created_by, patient_id, assigned_psychologist_id, assigned_lawyer_id, treatment_center_id,
      addiction_type_id, priority, status, description, target_response_hours
    ) VALUES (
      'SCP-2026-00101', 6, 7, 2, 3, 4,
      1, 'High', 'FIRST_SESSION',
      'طلب استغاثة من الأم لمساعدة ابنها الشاب (22 عاماً) الذي يعاني من تعاطي المهدئات ومؤثرات البريغابالين مع تراجع حاد في الدراسة وعزلة تامة وتغيرات مزاجية سريعة. الأسرة بحاجة ماسة لبرنامج علاجي متكامل واستشارة قانونية حول الحماية والرعاية.',
      24
    )
  `);

  // Initial Conversation for the case
  db.run(`INSERT INTO conversations (case_file_id, title) VALUES (1, 'محادثة الحالة SCP-2026-00101')`);
  db.run(`INSERT INTO conversation_participants (conversation_id, user_id) VALUES (1, 6)`);
  db.run(`INSERT INTO conversation_participants (conversation_id, user_id) VALUES (1, 2)`);
  db.run(`INSERT INTO conversation_participants (conversation_id, user_id) VALUES (1, 1)`);

  // Initial Messages
  db.run(`
    INSERT INTO messages (conversation_id, sender_id, content)
    VALUES (1, 6, 'السلام عليكم دكتورة نادية، شكراً جزيلاً لقبول الحالة، نحن في وضع نفسي حرج جداً ونرجو توجيهنا بالخطوات الأولى.')
  `);
  db.run(`
    INSERT INTO messages (conversation_id, sender_id, content)
    VALUES (1, 2, 'وعليكم السلام ورحمة الله أختي فاطمة. نحن هنا لمساندتكم بسرية تامة. لقد تمت جدولة أول جلسة تقييمية يوم غد، وسنضع معاً خطة علاجية مخصصة تشمل فترات إزالة السموم والمتابعة النفسية.')
  `);

  // Initial Appointment
  db.run(`
    INSERT INTO appointments (case_file_id, created_by, specialist_id, appointment_date, start_time, end_time, type, status, notes)
    VALUES (1, 6, 2, '2026-09-22', '10:00', '11:00', 'psychological', 'CONFIRMED', 'جلسة التقييم السريري الأولي للمريض والأسرة')
  `);

  // Initial Assessment
  db.run(`
    INSERT INTO assessments (case_file_id, psychologist_id, severity, recommendation, mental_health_notes)
    VALUES (1, 2, 'Severe', 'يوصى بالبدء الفوري ببرنامج إزالة السموم بالتنسيق مع مركز الأمل للاستشفاء لمدة أسبوعين، متبوعاً بـ 10 جلسات علاج سلوكي معرفي (CBT) وجلسات إرشاد أسري.', 'المريض واعٍ بحالته ولديه رغبة دفينة في التعافي، يعاني من قلق انفصالي وأعراض انسحابية معتدلة.')
  `);

  // Treatment Plan
  db.run(`
    INSERT INTO treatment_plans (case_file_id, goal, strategy, duration, sessions_count)
    VALUES (1, 'الوصول إلى التعافي المستدام ومنع الانتكاسة واستعادة التوازن الدراسي', 'علاج سلوكي معرفي CBT + تنظيم الدعم الأسري والنشاط البدني', '3 أشهر', 12)
  `);

  // Therapy Session 1
  db.run(`
    INSERT INTO therapy_sessions (case_file_id, session_number, date, duration, notes, session_next, status)
    VALUES (1, 1, '2026-09-20', 50, 'تمت مراجعة التاريخ المرضي للمريض وبناء تحالف علاجي قوي، وتحديد المحفزات البيئية لتعاطي المهدئات.', '2026-09-27', 'COMPLETED')
  `);

  // Progress
  db.run(`
    INSERT INTO case_progress (case_file_id, progress_percentage, notes, updated_by)
    VALUES (1, 25, 'تم إنجاز التقييم الطبي الأولي وبدء مرحلة التثقيف النفسي بنجاح ملحوظ وتعاون من المريض والأسرة.', 2)
  `);

  // Notifications
  db.run(`
    INSERT INTO notifications (user_id, title, message, type, link)
    VALUES (6, 'تم قبول وتعيين الأخصائي', 'تم إسناد ملفك رقم SCP-2026-00101 إلى د. نادية قادري بنجاح.', 'case_update', '/dashboard/case/1')
  `);
  db.run(`
    INSERT INTO notifications (user_id, title, message, type, link)
    VALUES (2, 'إسناد حالة جديدة ذات أولوية عالية', 'تم إسناد الحالة رقم SCP-2026-00101 إليك لمباشرة الجلسة التقييمية.', 'case_assigned', '/dashboard/specialist/cases')
  `);

  // Audit log
  db.run(`
    INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address)
    VALUES (1, 'CREATE_CASE', 'case_files', '1', 'إنشاء واعتماد ملف الحالة الأولي وتعيين الأخصائيين', '127.0.0.1')
  `);
}
