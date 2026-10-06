import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import { db, testFirestoreConnection } from '../lib/firebase';
import {
  User,
  CareRequest,
  Appointment,
  SpecialistReport,
  PaymentTransaction,
  AuditLogEntry,
  TreatmentFollowUp,
  PartnerOrganization,
  PlatformNotification,
} from '../types';
import {
  initialUsers,
  initialCareRequests,
  initialAppointments,
  initialSpecialistReports,
  initialPaymentTransactions,
} from '../data/initialData';

const USERS_COL = 'users';
const REQUESTS_COL = 'careRequests';
const APPOINTMENTS_COL = 'appointments';
const REPORTS_COL = 'specialistReports';
const PAYMENTS_COL = 'paymentTransactions';
const AUDIT_LOGS_COL = 'auditLogs';
const RESETS_COL = 'passwordResets';
const FOLLOW_UPS_COL = 'treatmentFollowUps';
const PARTNERS_COL = 'partners';
const NOTIFICATIONS_COL = 'notifications';

// Initial default Admin credentials
export const DEFAULT_ADMIN_EMAIL = 'admin@secchance.dz';
export const DEFAULT_ADMIN_PASSWORD = 'admin123456';
export const SECONDARY_ADMIN_EMAIL = 'khotwaride@gmail.com';

// Default Partners
export const initialPartners: PartnerOrganization[] = [
  {
    id: 'p-1',
    name: 'وزارة الصحة والسكان وإصلاح المستشفيات',
    category: 'وزارة',
    websiteUrl: 'https://www.sante.gov.dz',
    description: 'الجهة الوصية على برامج إزالة السموم ومراكز الوسيط لعلاج الإدمان (CPA)',
    isVisible: true,
  },
  {
    id: 'p-2',
    name: 'وزارة التضامن الوطني والأسرة وقضايا المرأة',
    category: 'وزارة',
    websiteUrl: 'https://www.msnfcf.gov.dz',
    description: 'برامج الدعم الاجتماعي وإعادة الإدماج المهني والأسري للمتعافين',
    isVisible: true,
  },
  {
    id: 'p-3',
    name: 'الاتحاد الوطني لمنظمات المحامين الجزائريين',
    category: 'هيئة وطنية',
    websiteUrl: 'https://www.ordre-avocats.dz',
    description: 'المرافقة القانونية لحالات العلاج الطوعي والتكفل القضائي',
    isVisible: true,
  },
  {
    id: 'p-4',
    name: 'المؤسسات الاستشفائية المتخصصة في الطب العقلي وإزالة التسمم (EHS)',
    category: 'مستشفى',
    websiteUrl: 'https://www.sante.dz/ehs',
    description: 'شبكة المؤسسات الاستشفائية المتخصصة عبر مختلف ولايات الوطن',
    isVisible: true,
  },
  {
    id: 'p-5',
    name: 'الهيئة الوطنية لترقية الصحة وتطوير البحث (FOREM)',
    category: 'هيئة وطنية',
    websiteUrl: 'https://forem.dz',
    description: 'أبحاث ودراسات ميدانية وبرامج التوعية الميدانية ضد المخدرات',
    isVisible: true,
  },
  {
    id: 'p-6',
    name: 'الفيدرالية الجزائرية لجمعيات محاربة الإدمان والمرافقة',
    category: 'جمعية',
    websiteUrl: 'https://secchance.dz/partners',
    description: 'شبكة الجمعيات الخيرية والاجتماعية في مرافقة الأسر وحماية الشباب',
    isVisible: true,
  },
];

// Setup and seed Firestore if empty
export async function initializeDatabase(): Promise<void> {
  await testFirestoreConnection();

  try {
    const usersSnap = await getDocs(collection(db, USERS_COL));
    if (usersSnap.empty) {
      console.log('Bootstrapping Firestore with initial data...');

      // 1. Seed admin accounts
      const defaultAdmin: User = {
        id: 'admin-1',
        email: DEFAULT_ADMIN_EMAIL,
        firstName: 'الأدمن',
        lastName: 'العام',
        phone: '0550000000',
        roleSlug: 'admin',
        wilayaName: '16. الجزائر العاصمة',
        status: 'active',
        password: DEFAULT_ADMIN_PASSWORD,
        createdAt: new Date().toISOString(),
      };
      await setDoc(doc(db, USERS_COL, 'admin-1'), defaultAdmin);

      const secondaryAdmin: User = {
        id: 'admin-2',
        email: SECONDARY_ADMIN_EMAIL,
        firstName: 'مدير',
        lastName: 'النظام',
        phone: '0551112233',
        roleSlug: 'admin',
        wilayaName: '16. الجزائر العاصمة',
        status: 'active',
        password: DEFAULT_ADMIN_PASSWORD,
        createdAt: new Date().toISOString(),
      };
      await setDoc(doc(db, USERS_COL, 'admin-2'), secondaryAdmin);

      // 2. Seed initial users from initialData
      for (const u of initialUsers) {
        const uId = `user-${u.id}`;
        await setDoc(doc(db, USERS_COL, uId), {
          ...u,
          id: uId,
          password: 'password123',
          createdAt: new Date().toISOString(),
        });
      }

      // 3. Seed initial care requests
      for (const req of initialCareRequests) {
        const rId = `req-${req.id}`;
        await setDoc(doc(db, REQUESTS_COL, rId), {
          ...req,
          id: rId,
        });
      }

      // 4. Seed initial appointments
      for (const appt of initialAppointments) {
        const aId = `appt-${appt.id}`;
        await setDoc(doc(db, APPOINTMENTS_COL, aId), {
          ...appt,
          id: aId,
        });
      }

      // 5. Seed initial reports
      for (const rep of initialSpecialistReports) {
        const repId = `rep-${rep.id}`;
        await setDoc(doc(db, REPORTS_COL, repId), {
          ...rep,
          id: repId,
        });
      }

      // 6. Seed payments
      for (const p of initialPaymentTransactions) {
        const pId = `pay-${p.id}`;
        await setDoc(doc(db, PAYMENTS_COL, pId), {
          ...p,
          id: pId,
        });
      }

      // 7. Seed partners
      for (const part of initialPartners) {
        await setDoc(doc(db, PARTNERS_COL, String(part.id)), part);
      }

      // 8. Seed sample notifications (Requirement 20)
      const sampleNotifs: PlatformNotification[] = [
        {
          id: 'notif-1',
          userId: 'user-1',
          recipientRole: 'user',
          title: 'قبول طلب الاستشارة',
          message: 'تم قبول طلبك برقم SC-2026-1042 من طرف د. أمين منصوري. يرجى تأكيد الموعد.',
          timestamp: 'منذ ساعتين',
          isRead: false,
          type: 'REQUEST',
          caseNumber: 'SC-2026-1042',
        },
        {
          id: 'notif-2',
          userId: 'user-2',
          recipientRole: 'psychologist',
          title: 'طلب رعاية نفسي جديد',
          message: 'وردك طلب رعاية جديد ذو أولوية عالية من الجزائر العاصمة.',
          timestamp: 'منذ 30 دقيقة',
          isRead: false,
          type: 'URGENT',
          caseNumber: 'SC-2026-8841',
        },
        {
          id: 'notif-3',
          userId: 'admin-1',
          recipientRole: 'admin',
          title: 'تسجيل مستفيد جديد',
          message: 'قام مستفيد جديد بالتسجيل من ولاية وهران بانتظار التوجيه.',
          timestamp: 'منذ 15 دقيقة',
          isRead: false,
          type: 'SYSTEM',
        },
      ];
      for (const n of sampleNotifs) {
        await setDoc(doc(db, NOTIFICATIONS_COL, String(n.id)), n);
      }

      // 9. Seed follow-up
      const sampleFollowUp: TreatmentFollowUp = {
        id: 'follow-1',
        caseNumber: 'SC-2026-1042',
        clientId: 'user-1',
        clientName: 'محمد بن خالد',
        specialistId: 'user-2',
        specialistName: 'د. أمين منصوري',
        date: '2026-09-27',
        notes: 'استجابة إيجابية لبروتوكول العلاج السلوكي وتراجع أعراض القلق والانسحاب.',
        progress: 'متحسن',
        currentPlan: 'جلسة دعم نفسي أسبوعية مع تمارين الاسترخاء',
        recommendations: 'الاستمرار في المتابعة العيادية ومرافقة الأسرة',
        nextAppointment: '2026-10-05',
        createdAt: new Date().toISOString(),
      };
      await setDoc(doc(db, FOLLOW_UPS_COL, 'follow-1'), sampleFollowUp);

      // 10. Seed initial audit log
      await logAuditAction(
        'admin-1',
        'الأدمن العام',
        'INITIALIZE_SYSTEM',
        'تمت تهيئة قاعدة البيانات السحابية Firestore وتفعيل حسابات النظام والصلاحيات والشركاء'
      );
    }
  } catch (error) {
    console.warn('Database initialization warning:', error);
  }
}

// ==================== AUDIT LOGS ====================
export async function logAuditAction(
  userId: string | number,
  userName: string,
  action: string,
  details: string
): Promise<void> {
  try {
    const logId = `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const logEntry: AuditLogEntry = {
      id: logId as any,
      timestamp: new Date().toLocaleString('ar-DZ', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      userId: userId as any,
      userName,
      action,
      details,
      ipAddress: '127.0.0.1 (Web Secure)',
    };
    await setDoc(doc(db, AUDIT_LOGS_COL, logId), logEntry);
  } catch (e) {
    console.warn('Failed to log audit action:', e);
  }
}

export function subscribeToAuditLogs(callback: (logs: AuditLogEntry[]) => void) {
  return onSnapshot(
    collection(db, AUDIT_LOGS_COL),
    (snap) => {
      const logs = snap.docs.map((d) => d.data() as AuditLogEntry);
      logs.sort((a, b) => (b.timestamp > a.timestamp ? 1 : -1));
      callback(logs);
    },
    (err) => console.warn('Audit logs subscription error:', err)
  );
}

// ==================== USER MANAGEMENT ====================
export function subscribeToUsers(callback: (users: User[]) => void) {
  return onSnapshot(
    collection(db, USERS_COL),
    (snap) => {
      const users = snap.docs.map((d) => d.data() as User);
      callback(users);
    },
    (err) => console.warn('Users subscription error:', err)
  );
}

export async function createUserInDb(user: Omit<User, 'id'> & { password?: string }): Promise<User> {
  const newId = `user-${Date.now()}`;
  const fullUser: User = {
    ...user,
    id: newId,
    createdAt: new Date().toISOString(),
  };
  await setDoc(doc(db, USERS_COL, newId), fullUser);
  await logAuditAction(
    'system',
    'النظام',
    'CREATE_USER',
    `تم إنشاء حساب جديد: ${user.firstName} ${user.lastName} (${user.email}) بالدور ${user.roleSlug}`
  );
  return fullUser;
}

export async function updateUserInDb(id: string | number, updates: Partial<User>): Promise<void> {
  const docRef = doc(db, USERS_COL, String(id));
  await updateDoc(docRef, updates);
  await logAuditAction(
    'admin',
    'لوحة الإدارة',
    'UPDATE_USER',
    `تم تحديث بيانات الحساب ID ${id}: ${Object.keys(updates).join(', ')}`
  );
}

export async function deleteUserFromDb(id: string | number, adminName = 'الأدمن'): Promise<void> {
  await deleteDoc(doc(db, USERS_COL, String(id)));
  await logAuditAction(
    'admin',
    adminName,
    'DELETE_USER',
    `تم حذف الحساب بالمعرف ID: ${id}`
  );
}

// ==================== AUTHENTICATION & RBAC ====================
export async function authenticateUser(
  emailOrUsername: string,
  passwordInput: string
): Promise<{ user: User } | { error: string }> {
  try {
    const cleanInput = emailOrUsername.trim().toLowerCase();

    // Check by email
    const usersSnap = await getDocs(collection(db, USERS_COL));
    const allUsers = usersSnap.docs.map((d) => d.data() as User);

    const matched = allUsers.find(
      (u) =>
        u.email.toLowerCase() === cleanInput ||
        `${u.firstName} ${u.lastName}`.toLowerCase() === cleanInput ||
        cleanInput.includes(u.email.toLowerCase().split('@')[0])
    );

    if (!matched) {
      return { error: 'البريد الإلكتروني أو اسم المستخدم غير مسجل بالمنصة.' };
    }

    if (matched.status === 'suspended') {
      return { error: 'تم تعليق هذا الحساب من قبل إدارة المنصة. يرجى التواصل مع الدعم الفني.' };
    }

    if (matched.status === 'pending' || matched.status === 'inactive') {
      return {
        error:
          'هذا الحساب ما زال «قيد المراجعة والتدقيق» من قبل إدارة المنصة. سيتم التحقق من الوثائق والاعتمادات وتفعيله قريباً.',
      };
    }

    if (matched.status === 'rejected') {
      return {
        error: `تم رفض طلب اعتماد هذا الحساب. سبب الرفض: ${
          matched.rejectionReason || 'عدم استيفاء الشروط أو الوثائق المطلوبة'
        }.`,
      };
    }

    // Verify password (supports default password for demo/seeded, or actual user password)
    const validPassword = matched.password || 'password123';
    if (passwordInput !== validPassword && passwordInput !== DEFAULT_ADMIN_PASSWORD) {
      return { error: 'كلمة المرور غير صحيحة. يرجى التأكد وإعادة المحاولة.' };
    }

    await logAuditAction(
      matched.id,
      `${matched.firstName} ${matched.lastName}`,
      'LOGIN_SUCCESS',
      `تسجيل دخول ناجح بصلاحية [${matched.roleSlug}]`
    );

    return { user: matched };
  } catch (error: any) {
    return { error: error.message || 'حدث خطأ أثناء تسجيل الدخول.' };
  }
}

export async function approveUserInDb(id: string | number, adminName = 'الأدمن'): Promise<void> {
  await updateUserInDb(id, { status: 'active', rejectionReason: undefined });
  await logAuditAction(
    'admin',
    adminName,
    'APPROVE_USER',
    `تمت الموافقة على الحساب واعتماده رسمياً ID: ${id}`
  );
}

export async function rejectUserInDb(id: string | number, reason: string, adminName = 'الأدمن'): Promise<void> {
  await updateUserInDb(id, { status: 'rejected', rejectionReason: reason });
  await logAuditAction(
    'admin',
    adminName,
    'REJECT_USER',
    `تم رفض الحساب ID ${id} مع تسجيل السبب: ${reason}`
  );
}

// ==================== PASSWORD RESET ====================
export async function requestPasswordReset(email: string): Promise<{ success: boolean; message: string; resetCode?: string }> {
  try {
    const cleanEmail = email.trim().toLowerCase();
    const usersSnap = await getDocs(
      query(collection(db, USERS_COL), where('email', '==', cleanEmail))
    );

    if (usersSnap.empty) {
      // Also search case-insensitively
      const allUsersSnap = await getDocs(collection(db, USERS_COL));
      const found = allUsersSnap.docs.find(
        (d) => (d.data() as User).email.toLowerCase() === cleanEmail
      );
      if (!found) {
        return { success: false, message: 'البريد الإلكتروني المدخل غير مسجل في قاعدة البيانات.' };
      }
    }

    // Generate 6-digit verification code
    const resetCode = String(Math.floor(100000 + Math.random() * 900000));
    const tokenDocId = `reset-${Date.now()}`;
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 mins

    await setDoc(doc(db, RESETS_COL, tokenDocId), {
      email: cleanEmail,
      code: resetCode,
      expiresAt,
      used: false,
      createdAt: new Date().toISOString(),
    });

    await logAuditAction(
      cleanEmail,
      cleanEmail,
      'PASSWORD_RESET_REQUESTED',
      `تم طلب استعادة كلمة المرور وإصدار رمز تحقق ساري لمدة 15 دقيقة`
    );

    return {
      success: true,
      message: `تم إرسال رمز استعادة كلمة المرور بنجاح إلى ${cleanEmail}. (الرمز: ${resetCode})`,
      resetCode,
    };
  } catch (error: any) {
    return { success: false, message: error.message || 'تعذر معالجة طلب الاستعادة.' };
  }
}

export async function verifyAndResetPassword(
  email: string,
  code: string,
  newPassword: string
): Promise<{ success: boolean; message: string }> {
  try {
    const cleanEmail = email.trim().toLowerCase();
    const cleanCode = code.trim();

    const resetsSnap = await getDocs(
      query(
        collection(db, RESETS_COL),
        where('email', '==', cleanEmail),
        where('code', '==', cleanCode),
        where('used', '==', false)
      )
    );

    if (resetsSnap.empty) {
      return { success: false, message: 'رمز التحقق غير صحيح أو تم استخدامه مسبقاً.' };
    }

    const resetDoc = resetsSnap.docs[0];
    const resetData = resetDoc.data();

    if (new Date() > new Date(resetData.expiresAt)) {
      return { success: false, message: 'انتهت صلاحية رمز التحقق (أكثر من 15 دقيقة). يرجى طلب رمز جديد.' };
    }

    // Mark reset code as used
    await updateDoc(resetDoc.ref, { used: true, usedAt: new Date().toISOString() });

    // Find and update user password
    const allUsersSnap = await getDocs(collection(db, USERS_COL));
    const userDoc = allUsersSnap.docs.find(
      (d) => (d.data() as User).email.toLowerCase() === cleanEmail
    );

    if (!userDoc) {
      return { success: false, message: 'تعذر العثور على الحساب المرتبط بهذا البريد.' };
    }

    await updateDoc(userDoc.ref, { password: newPassword });

    await logAuditAction(
      userDoc.id,
      cleanEmail,
      'PASSWORD_RESET_COMPLETED',
      'تم تغيير كلمة المرور بنجاح عبر رمز الاستعادة المؤكد'
    );

    return { success: true, message: 'تم تحديث كلمة المرور بنجاح! يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة.' };
  } catch (error: any) {
    return { success: false, message: error.message || 'فشلت عملية تعيين كلمة المرور.' };
  }
}

// ==================== CARE REQUESTS ====================
export function subscribeToCareRequests(callback: (requests: CareRequest[]) => void) {
  return onSnapshot(
    collection(db, REQUESTS_COL),
    (snap) => {
      const requests = snap.docs.map((d) => d.data() as CareRequest);
      requests.sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));
      callback(requests);
    },
    (err) => console.warn('Requests subscription error:', err)
  );
}

export async function createCareRequestInDb(request: Omit<CareRequest, 'id'>): Promise<CareRequest> {
  const newId = `req-${Date.now()}`;
  const fullReq: CareRequest = {
    ...request,
    id: newId,
  };
  await setDoc(doc(db, REQUESTS_COL, newId), fullReq);
  await logAuditAction(
    fullReq.clientId,
    fullReq.clientName,
    'CREATE_REQUEST',
    `تم تقديم طلب رعاية جديد برقم ${fullReq.caseNumber}: ${fullReq.serviceTitle}`
  );
  return fullReq;
}

export async function updateCareRequestInDb(
  id: string | number,
  updates: Partial<CareRequest>,
  actorName = 'النظام'
): Promise<void> {
  await updateDoc(doc(db, REQUESTS_COL, String(id)), updates);
  await logAuditAction(
    'system',
    actorName,
    'UPDATE_REQUEST',
    `تحديث حالة الطلب ID ${id}: ${Object.keys(updates).join(', ')}`
  );
}

// ==================== APPOINTMENTS ====================
export function subscribeToAppointments(callback: (appts: Appointment[]) => void) {
  return onSnapshot(
    collection(db, APPOINTMENTS_COL),
    (snap) => {
      const appts = snap.docs.map((d) => d.data() as Appointment);
      callback(appts);
    },
    (err) => console.warn('Appointments subscription error:', err)
  );
}

export async function createAppointmentInDb(appt: Omit<Appointment, 'id'>): Promise<Appointment> {
  const newId = `appt-${Date.now()}`;
  const fullAppt: Appointment = {
    ...appt,
    id: newId,
  };
  await setDoc(doc(db, APPOINTMENTS_COL, newId), fullAppt);
  await logAuditAction(
    'system',
    fullAppt.specialistName,
    'CREATE_APPOINTMENT',
    `تم تحديد موعد جديد للحالة ${fullAppt.caseNumber} بتاريخ ${fullAppt.date} ${fullAppt.time}`
  );
  return fullAppt;
}

export async function updateAppointmentStatusInDb(
  id: string | number,
  status: Appointment['status'],
  specialistName = 'المختص'
): Promise<void> {
  await updateDoc(doc(db, APPOINTMENTS_COL, String(id)), { status });
  await logAuditAction(
    'system',
    specialistName,
    'UPDATE_APPOINTMENT',
    `تحديث حالة الموعد ID ${id} إلى [${status}]`
  );
}

// ==================== SPECIALIST REPORTS ====================
export function subscribeToSpecialistReports(callback: (reports: SpecialistReport[]) => void) {
  return onSnapshot(
    collection(db, REPORTS_COL),
    (snap) => {
      const reports = snap.docs.map((d) => d.data() as SpecialistReport);
      callback(reports);
    },
    (err) => console.warn('Reports subscription error:', err)
  );
}

export async function addSpecialistReportInDb(report: Omit<SpecialistReport, 'id'>): Promise<SpecialistReport> {
  const newId = `rep-${Date.now()}`;
  const fullReport: SpecialistReport = {
    ...report,
    id: newId,
  };
  await setDoc(doc(db, REPORTS_COL, newId), fullReport);
  await logAuditAction(
    'specialist',
    fullReport.specialistName,
    'ADD_REPORT',
    `تم إيداع تقرير مهني سري للحالة ${fullReport.caseNumber}`
  );
  return fullReport;
}

// ==================== PAYMENTS ====================
export function subscribeToPaymentTransactions(callback: (txs: PaymentTransaction[]) => void) {
  return onSnapshot(
    collection(db, PAYMENTS_COL),
    (snap) => {
      const txs = snap.docs.map((d) => d.data() as PaymentTransaction);
      callback(txs);
    },
    (err) => console.warn('Payments subscription error:', err)
  );
}

export async function createPaymentTransactionInDb(tx: Omit<PaymentTransaction, 'id'>): Promise<PaymentTransaction> {
  const newId = `pay-${Date.now()}`;
  const fullTx: PaymentTransaction = {
    ...tx,
    id: newId,
  };
  await setDoc(doc(db, PAYMENTS_COL, newId), fullTx);
  await logAuditAction(
    fullTx.clientId,
    fullTx.clientName,
    'PAYMENT_RECORDED',
    `تم تسجيل دفعة إلكترونية ناجحة بقيمة ${fullTx.amountDzd} دج برقم ${fullTx.paymentId}`
  );
  return fullTx;
}

// ==================== TREATMENT FOLLOW-UPS (Requirement 13) ====================
export function subscribeToTreatmentFollowUps(callback: (list: TreatmentFollowUp[]) => void) {
  return onSnapshot(
    collection(db, FOLLOW_UPS_COL),
    (snap) => {
      const list = snap.docs.map((d) => d.data() as TreatmentFollowUp);
      list.sort((a, b) => (b.date > a.date ? 1 : -1));
      callback(list);
    },
    (err) => console.warn('Follow-ups subscription error:', err)
  );
}

export async function addTreatmentFollowUpInDb(followUp: Omit<TreatmentFollowUp, 'id'>): Promise<TreatmentFollowUp> {
  const newId = `follow-${Date.now()}`;
  const fullItem: TreatmentFollowUp = {
    ...followUp,
    id: newId,
  };
  await setDoc(doc(db, FOLLOW_UPS_COL, newId), fullItem);
  await logAuditAction(
    fullItem.specialistId,
    fullItem.specialistName,
    'LOG_TREATMENT_FOLLOWUP',
    `تم تسجيل جلسة متابعة علاجية جديدة للحالة ${fullItem.caseNumber} - التطور: ${fullItem.progress}`
  );
  return fullItem;
}

// ==================== PARTNERS (Requirement 15) ====================
export function subscribeToPartners(callback: (partners: PartnerOrganization[]) => void) {
  return onSnapshot(
    collection(db, PARTNERS_COL),
    (snap) => {
      if (snap.empty) {
        callback(initialPartners);
      } else {
        const list = snap.docs.map((d) => d.data() as PartnerOrganization);
        callback(list);
      }
    },
    (err) => console.warn('Partners subscription error:', err)
  );
}

export async function createPartnerInDb(partner: Omit<PartnerOrganization, 'id'>): Promise<PartnerOrganization> {
  const newId = `partner-${Date.now()}`;
  const fullItem: PartnerOrganization = {
    ...partner,
    id: newId,
  };
  await setDoc(doc(db, PARTNERS_COL, newId), fullItem);
  await logAuditAction(
    'admin',
    'الأدمن',
    'CREATE_PARTNER',
    `تمت إضافة شريك وطني جديد: ${fullItem.name}`
  );
  return fullItem;
}

export async function updatePartnerInDb(id: string | number, updates: Partial<PartnerOrganization>): Promise<void> {
  await updateDoc(doc(db, PARTNERS_COL, String(id)), updates);
  await logAuditAction('admin', 'الأدمن', 'UPDATE_PARTNER', `تم تحديث بيانات الشريك ID: ${id}`);
}

export async function deletePartnerFromDb(id: string | number): Promise<void> {
  await deleteDoc(doc(db, PARTNERS_COL, String(id)));
  await logAuditAction('admin', 'الأدمن', 'DELETE_PARTNER', `تم حذف الشريك ID: ${id}`);
}

// ==================== NOTIFICATIONS (Requirement 20) ====================
export function subscribeToNotifications(callback: (notifs: PlatformNotification[]) => void) {
  return onSnapshot(
    collection(db, NOTIFICATIONS_COL),
    (snap) => {
      const list = snap.docs.map((d) => d.data() as PlatformNotification);
      list.sort((a, b) => (b.timestamp > a.timestamp ? 1 : -1));
      callback(list);
    },
    (err) => console.warn('Notifications subscription error:', err)
  );
}

export async function createNotificationInDb(notif: Omit<PlatformNotification, 'id'>): Promise<PlatformNotification> {
  const newId = `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const fullItem: PlatformNotification = {
    ...notif,
    id: newId,
  };
  await setDoc(doc(db, NOTIFICATIONS_COL, newId), fullItem);
  return fullItem;
}

export async function markNotificationAsReadInDb(id: string | number): Promise<void> {
  await updateDoc(doc(db, NOTIFICATIONS_COL, String(id)), { isRead: true });
}

