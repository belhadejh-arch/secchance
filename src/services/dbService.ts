import {
  Appointment,
  Association,
  AuditLogEntry,
  CareRequest,
  CaseFileDocument,
  ConsultationAvailabilitySlot,
  Conversation,
  Message,
  PartnerOrganization,
  PaymentTransaction,
  PlatformNotification,
  SpecialistReport,
  TreatmentCenter,
  TreatmentFollowUp,
  LegalReference,
  User,
} from '../types';

const apiBase = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
const apiPath = (path: string) => `${apiBase}/api/v1${path}`;

async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(apiPath(path), {
    ...options,
    credentials: 'include',
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result.error || `تعذر إكمال الطلب (${response.status}).`);
  }
  return result as T;
}

interface BootstrapData {
  user: User;
  users: User[];
  services: any[];
  requests: CareRequest[];
  appointments: Appointment[];
  reports: SpecialistReport[];
  transactions: PaymentTransaction[];
  auditLogs: AuditLogEntry[];
  partners: PartnerOrganization[];
  followUps: TreatmentFollowUp[];
  notifications: PlatformNotification[];
  conversations: Conversation[];
  messagesMap: Record<number, Message[]>;
  centers: TreatmentCenter[];
  associations: Association[];
}

type SnapshotKey = keyof Omit<BootstrapData, 'user'>;
type Subscriber = (value: any) => void;

const subscribers = new Map<SnapshotKey, Set<Subscriber>>();
let snapshot: Partial<BootstrapData> = {};
let pollTimer: ReturnType<typeof setInterval> | undefined;
let refreshing: Promise<void> | null = null;

const emptySnapshot: Record<SnapshotKey, any> = {
  users: [],
  services: [],
  requests: [],
  appointments: [],
  reports: [],
  transactions: [],
  auditLogs: [],
  partners: [],
  followUps: [],
  notifications: [],
  conversations: [],
  messagesMap: {},
  centers: [],
  associations: [],
};

function publishSnapshot(data: Partial<BootstrapData>) {
  snapshot = { ...snapshot, ...data };
  for (const [key, listeners] of subscribers) {
    const value = (snapshot as any)[key] ?? emptySnapshot[key];
    listeners.forEach((listener) => listener(value));
  }
}

async function refreshSnapshot() {
  if (refreshing) return refreshing;
  refreshing = (async () => {
    try {
      const data = await api<BootstrapData>('/bootstrap');
      publishSnapshot(data);
    } catch (error) {
      if (error instanceof Error && /تسجيل الدخول|الحساب/i.test(error.message)) {
        snapshot = {};
        for (const [key, listeners] of subscribers) {
          listeners.forEach((listener) => listener(emptySnapshot[key]));
        }
      } else {
        console.error('تعذر تحديث بيانات المنصة:', error);
      }
    } finally {
      refreshing = null;
    }
  })();
  return refreshing;
}

function subscribe<T>(key: SnapshotKey, callback: (data: T) => void): () => void {
  const listeners = subscribers.get(key) ?? new Set<Subscriber>();
  listeners.add(callback as Subscriber);
  subscribers.set(key, listeners);
  callback(((snapshot as any)[key] ?? emptySnapshot[key]) as T);
  void refreshSnapshot();
  if (!pollTimer) {
    pollTimer = setInterval(() => void refreshSnapshot(), 8000);
  }

  return () => {
    listeners.delete(callback as Subscriber);
    if (!listeners.size) subscribers.delete(key);
    if (!subscribers.size && pollTimer) {
      clearInterval(pollTimer);
      pollTimer = undefined;
    }
  };
}

export async function initializeDatabase(): Promise<void> {
  await api<{ ok: boolean }>('/health');
}

export async function getCurrentUser(): Promise<User | null> {
  const result = await api<{ user: User | null }>('/auth/me');
  return result.user;
}

export interface AccountSettingsUpdate {
  email: string;
  phone: string;
  currentPassword?: string;
  newPassword?: string;
}

export async function updateAccountSettingsInDb(updates: AccountSettingsUpdate): Promise<User> {
  const result = await api<{ user: User }>('/profile/settings', {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
  await refreshSnapshot();
  return result.user;
}

export async function getPublicLegalReferences(): Promise<{
  legalReferences: LegalReference[];
  updatedAt: string | null;
}> {
  return api('/public/legal-references');
}

export async function updateLegalReferencesInDb(
  legalReferences: LegalReference[]
): Promise<{ legalReferences: LegalReference[]; updatedAt: string | null }> {
  return api('/admin/legal-references', {
    method: 'PATCH',
    body: JSON.stringify({ legalReferences }),
  });
}

export async function uploadLegalReferencePdfInDb(
  id: string,
  file: File
): Promise<{ legalReferences: LegalReference[]; updatedAt: string | null }> {
  const maxSizeBytes = 5 * 1024 * 1024;
  if (!file.name.toLowerCase().endsWith('.pdf') || (file.type && file.type !== 'application/pdf')) {
    throw new Error('اختر ملف قانون بصيغة PDF.');
  }
  if (file.size > maxSizeBytes) {
    throw new Error('يجب ألا يتجاوز حجم ملف القانون 5 ميغابايت.');
  }
  if (file.size === 0) {
    throw new Error('ملف القانون فارغ.');
  }

  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('تعذر قراءة ملف القانون المحدد.'));
    reader.onload = () => resolve(String(reader.result || ''));
    reader.readAsDataURL(file);
  });
  const base64 = dataUrl.slice(dataUrl.indexOf(',') + 1);
  return api('/admin/legal-references/document', {
    method: 'POST',
    body: JSON.stringify({
      id,
      fileName: file.name,
      mimeType: 'application/pdf',
      base64,
    }),
  });
}

export async function logoutUser(): Promise<void> {
  await api('/auth/logout', { method: 'POST' });
  snapshot = {};
  for (const [key, listeners] of subscribers) {
    listeners.forEach((listener) => listener(emptySnapshot[key]));
  }
}

export function subscribeToUsers(callback: (users: User[]) => void) {
  return subscribe('users', callback);
}

export function subscribeToServices(callback: (services: BootstrapData['services']) => void) {
  return subscribe('services', callback);
}

export function subscribeToCareRequests(callback: (requests: CareRequest[]) => void) {
  return subscribe('requests', callback);
}

export function subscribeToAppointments(callback: (appointments: Appointment[]) => void) {
  return subscribe('appointments', callback);
}

export function subscribeToSpecialistReports(callback: (reports: SpecialistReport[]) => void) {
  return subscribe('reports', callback);
}

export function subscribeToPaymentTransactions(callback: (transactions: PaymentTransaction[]) => void) {
  return subscribe('transactions', callback);
}

export function subscribeToAuditLogs(callback: (logs: AuditLogEntry[]) => void) {
  return subscribe('auditLogs', callback);
}

export function subscribeToPartners(callback: (partners: PartnerOrganization[]) => void) {
  return subscribe('partners', callback);
}

export function subscribeToTreatmentFollowUps(callback: (items: TreatmentFollowUp[]) => void) {
  return subscribe('followUps', callback);
}

export function subscribeToNotifications(callback: (items: PlatformNotification[]) => void) {
  return subscribe('notifications', callback);
}

export function subscribeToConversations(callback: (items: Conversation[]) => void) {
  return subscribe('conversations', callback);
}

export function subscribeToMessages(callback: (messages: Record<number, Message[]>) => void) {
  return subscribe('messagesMap', callback);
}

export function subscribeToCenters(callback: (items: TreatmentCenter[]) => void) {
  return subscribe('centers', callback);
}

export function subscribeToAssociations(callback: (items: Association[]) => void) {
  return subscribe('associations', callback);
}

export async function authenticateUser(
  email: string,
  password: string,
  rememberMe = false
): Promise<{ user: User } | { error: string }> {
  try {
    const result = await api<{ user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, rememberMe }),
    });
    await refreshSnapshot();
    return result;
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'تعذر تسجيل الدخول.' };
  }
}

export async function createUserInDb(
  user: Omit<User, 'id'> & { password?: string },
  _actorName?: string
): Promise<User> {
  const selfRegistration = Boolean(user.accountType);
  const result = await api<{ user: User }>(selfRegistration ? '/auth/register' : '/users', {
    method: 'POST',
    body: JSON.stringify({
      ...user,
      consentAccepted: selfRegistration,
    }),
  });
  await refreshSnapshot();
  return result.user;
}

export async function updateUserInDb(id: string | number, updates: Partial<User>): Promise<void> {
  await api(`/users/${encodeURIComponent(String(id))}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
  await refreshSnapshot();
}

export async function deleteUserFromDb(id: string | number, _actorName?: string): Promise<void> {
  await api(`/users/${encodeURIComponent(String(id))}`, { method: 'DELETE' });
  await refreshSnapshot();
}

export async function approveUserInDb(id: string | number, _actorName?: string): Promise<void> {
  return updateUserInDb(id, { status: 'active' });
}

export async function rejectUserInDb(
  id: string | number,
  reason: string,
  _actorName?: string
): Promise<void> {
  await api(`/users/${encodeURIComponent(String(id))}`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'rejected', rejectionReason: reason }),
  });
  await refreshSnapshot();
}

export async function requestPasswordReset(email: string): Promise<{ success: boolean; message: string }> {
  try {
    const result = await api<{ message: string }>('/auth/password-reset', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
    return { success: true, message: result.message };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'تعذر معالجة طلب الاستعادة.' };
  }
}

export async function verifyAndResetPassword(
  _email: string,
  _code: string,
  _password: string
): Promise<{ success: false; message: string }> {
  return {
    success: false,
    message: 'إعادة تعيين كلمة المرور غير متاحة حتى تهيئة إرسال البريد بشكل آمن.',
  };
}

export async function createCareRequestInDb(request: Omit<CareRequest, 'id'>): Promise<CareRequest> {
  const result = await api<{ id: number; message: string }>('/requests', {
    method: 'POST',
    body: JSON.stringify({
      providerId: request.providerId,
      serviceId: request.serviceId,
      category: request.category,
      description: request.description,
      priority: request.priority,
      appointmentDate: request.appointmentDate,
      appointmentTime: request.appointmentTime,
      consentAccepted: true,
    }),
  });
  await refreshSnapshot();
  const saved = (snapshot.requests || []).find((item) => String(item.id) === String(result.id));
  if (saved) return saved;
  throw new Error('تم إرسال الطلب، لكن تعذر تحميل تفاصيله. حدّث الصفحة لمتابعته.');
}

export async function updateCareRequestInDb(
  id: string | number,
  updates: Partial<CareRequest>,
  _actorName?: string
): Promise<void> {
  if (updates.serviceRating) {
    await submitServiceRatingInDb(id, updates.serviceRating);
    return;
  }
  await api(`/requests/${encodeURIComponent(String(id))}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
  await refreshSnapshot();
}

export async function startPaymentInDb(
  requestId: string | number,
  method: 'EDAHABIA' | 'CIB'
): Promise<string> {
  const result = await api<{ checkoutUrl: string }>(`/requests/${encodeURIComponent(String(requestId))}/payment`, {
    method: 'POST',
    body: JSON.stringify({ method }),
  });
  return result.checkoutUrl;
}

export async function confirmDemoAppointmentInDb(requestId: string | number): Promise<void> {
  await api(`/requests/${encodeURIComponent(String(requestId))}/demo-payment`, {
    method: 'POST',
  });
  await refreshSnapshot();
}

export async function createAppointmentInDb(appt: Omit<Appointment, 'id'>): Promise<Appointment> {
  const request = (snapshot.requests || []).find((item) => item.caseNumber === appt.caseNumber);
  if (!request) throw new Error('لا يمكن إنشاء موعد مستقل عن طلب استشارة محفوظ.');
  throw new Error('يتم إنشاء الموعد تلقائيًا مع طلب الاستشارة والتحقق من الدفع.');
}

export async function updateAppointmentStatusInDb(
  id: string | number,
  status: Appointment['status']
): Promise<void> {
  await api(`/appointments/${encodeURIComponent(String(id))}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
  await refreshSnapshot();
}

export async function addSpecialistReportInDb(
  report: Omit<SpecialistReport, 'id'>
): Promise<SpecialistReport> {
  const request = (snapshot.requests || []).find((item) => item.caseNumber === report.caseNumber);
  if (!request) throw new Error('لم يتم العثور على الطلب المرتبط بهذا التقرير.');
  await api('/reports', {
    method: 'POST',
    body: JSON.stringify({
      requestId: request.id,
      evaluation: report.evaluation,
      professionalNotes: report.professionalNotes,
      recommendations: report.recommendations,
      treatmentPlan: report.treatmentPlan,
      nextAppointment: report.nextAppointment,
      clientSummary: '',
    }),
  });
  await refreshSnapshot();
  const saved = (snapshot.reports || []).find((item) => item.caseNumber === report.caseNumber);
  if (!saved) throw new Error('تم حفظ التقرير، لكن تعذر تحميله.');
  return saved;
}

export async function createPaymentTransactionInDb(): Promise<never> {
  throw new Error('لا يمكن تسجيل الدفع يدويًا؛ يجب التحقق منه عبر إشعار Chargily الموقّع.');
}

export async function addTreatmentFollowUpInDb(item: Omit<TreatmentFollowUp, 'id'>): Promise<void> {
  const request = (snapshot.requests || []).find((entry) => entry.caseNumber === item.caseNumber);
  if (!request) throw new Error('لم يتم العثور على الطلب المرتبط بالمتابعة.');
  await api('/follow-ups', {
    method: 'POST',
    body: JSON.stringify({
      requestId: request.id,
      notes: item.notes,
      progress: item.progress,
      weekNumber: Math.max(1, Math.ceil((Date.now() - new Date(request.createdAt).getTime()) / (7 * 86400000))),
    }),
  });
  await refreshSnapshot();
}

export async function createPartnerInDb(
  partner: Omit<PartnerOrganization, 'id'>
): Promise<PartnerOrganization> {
  const result = await api<PartnerOrganization>('/partners', {
    method: 'POST',
    body: JSON.stringify(partner),
  });
  await refreshSnapshot();
  return result;
}

export async function updatePartnerInDb(
  id: string | number,
  updates: Partial<PartnerOrganization>
): Promise<void> {
  await api(`/partners/${encodeURIComponent(String(id))}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
  await refreshSnapshot();
}

export async function deletePartnerFromDb(id: string | number): Promise<void> {
  await api(`/partners/${encodeURIComponent(String(id))}`, { method: 'DELETE' });
  await refreshSnapshot();
}

export async function createNotificationInDb(): Promise<never> {
  throw new Error('الإشعارات تنشأ من عمليات المنصة ولا يمكن إنشاؤها من الواجهة.');
}

export async function markNotificationAsReadInDb(id: string | number): Promise<void> {
  await api(`/notifications/${encodeURIComponent(String(id))}/read`, { method: 'POST' });
  await refreshSnapshot();
}

export async function sendMessageInDb(conversationId: number, content: string): Promise<void> {
  await api(`/conversations/${conversationId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  });
  await refreshSnapshot();
}

export async function submitServiceRatingInDb(
  requestId: number | string,
  rating: 1 | 2 | 3 | 4 | 5,
  feedback = ''
): Promise<void> {
  await api('/ratings', {
    method: 'POST',
    body: JSON.stringify({ requestId, rating, feedback }),
  });
  await refreshSnapshot();
}

export async function listCaseDocumentsInDb(): Promise<CaseFileDocument[]> {
  return api('/documents');
}

export async function uploadCaseDocumentInDb(
  requestId: string | number,
  file: File,
  category: CaseFileDocument['fileCategory']
): Promise<CaseFileDocument> {
  if (file.size > 2 * 1024 * 1024) {
    throw new Error('اختر ملفًا لا يتجاوز حجمه 2 ميغابايت.');
  }
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('تعذر قراءة الملف المحدد.'));
    reader.onload = () => resolve(String(reader.result || ''));
    reader.readAsDataURL(file);
  });
  const base64 = dataUrl.slice(dataUrl.indexOf(',') + 1);
  const result = await api<{ document: CaseFileDocument }>(
    `/requests/${encodeURIComponent(String(requestId))}/documents`,
    {
      method: 'POST',
      body: JSON.stringify({
        fileName: file.name,
        mimeType: file.type || 'application/octet-stream',
        base64,
        category,
      }),
    }
  );
  return result.document;
}

export async function downloadCaseDocumentInDb(id: string | number): Promise<{
  fileName: string;
  mimeType: string;
  base64: string;
}> {
  return api(`/documents/${encodeURIComponent(String(id))}`);
}

export async function recordPrivacyConsent(): Promise<void> {
  await api('/privacy/consent', {
    method: 'POST',
    body: JSON.stringify({ accepted: true }),
  });
}

export async function getPublicDirectory(type: 'centers' | 'associations'): Promise<TreatmentCenter[] | Association[]> {
  return api(`/public/directory?type=${type}`);
}

export async function getPublicServices(): Promise<BootstrapData['services']> {
  return api('/public/services');
}

export async function saveAvailabilityInDb(
  slots: ConsultationAvailabilitySlot[]
): Promise<ConsultationAvailabilitySlot[]> {
  const result = await api<{ availabilitySlots: ConsultationAvailabilitySlot[] }>(
    '/profile/availability',
    { method: 'PATCH', body: JSON.stringify({ slots }) }
  );
  return result.availabilitySlots;
}
