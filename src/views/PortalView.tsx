import React, { useEffect, useState } from 'react';
import {
  User,
  CareRequest,
  PaymentTransaction,
  Appointment,
  SpecialistReport,
  PlatformNotification,
  Priority,
  LegalTopic,
  CaseFileDocument,
  ServiceItem,
} from '../types';
import { AccountSettingsUpdate } from '../services/dbService';
import {
  User as UserIcon,
  House,
  Users,
  MapPin,
  Settings,
  ShieldCheck,
  Building2,
  LogOut,
  Plus,
  CreditCard,
  Check,
  X,
  FolderOpen,
  Scale,
  Shield,
  FileText,
  Lock,
  MessageCircle,
  Calendar,
  Bell,
  Eye,
  Paperclip,
  Activity,
  AlertTriangle,
  Upload,
  Receipt,
  Download,
  PackageCheck,
  Sparkles,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import {
  initialLegalTopics,
} from '../data/initialData';
import {
  downloadCaseDocumentInDb,
  listCaseDocumentsInDb,
  markNotificationAsReadInDb,
  uploadCaseDocumentInDb,
} from '../services/dbService';
import { AccountDashboardView } from './AccountDashboardView';
import { FamilyPackageView } from './FamilyPackageView';
import { AccountSettingsView } from './AccountSettingsView';
import { getCustomerRequestProgress } from '../lib/requestProgress';

interface PortalViewProps {
  currentUser: User;
  services: ServiceItem[];
  requests: CareRequest[];
  transactions: PaymentTransaction[];
  appointments?: Appointment[];
  reports?: SpecialistReport[];
  notifications?: PlatformNotification[];
  onSelectRequest: (req: CareRequest) => void;
  onStartPayment: (req: CareRequest) => void;
  onNewRequest: () => void;
  onAcceptRequest: (requestId: number | string, priority: Priority) => void;
  onRejectRequestClick: (requestId: number | string) => void;
  onOpenChat: (convId: number) => void;
  onRequestService: (service: ServiceItem) => void;
  onOpenDirectory: (tab: 'centers' | 'associations') => void;
  onLogout: () => void;
  onUpdateAccountSettings: (updates: AccountSettingsUpdate) => Promise<User>;
}

export const PortalView: React.FC<PortalViewProps> = ({
  currentUser,
  services,
  requests,
  transactions,
  appointments = [],
  reports = [],
  notifications = [],
  onSelectRequest,
  onStartPayment,
  onNewRequest,
  onAcceptRequest,
  onRejectRequestClick,
  onOpenChat,
  onRequestService,
  onOpenDirectory,
  onLogout,
  onUpdateAccountSettings,
}) => {
  // Main navigation for the beneficiary account.
  const [beneficiaryTab, setBeneficiaryTab] = useState<
    | 'requests'
    | 'appointments'
    | 'family-package'
    | 'payments'
    | 'invoices'
    | 'messages'
    | 'notifications'
    | 'files'
    | 'reports'
    | 'dashboard'
    | 'family-members'
    | 'privacy'
    | 'settings'
    | 'profile'
  >('dashboard');

  // Filter requests belonging to this beneficiary
  const myRequests = requests.filter(
    (r) => String(r.clientId) === String(currentUser.id)
  );

  // Appointments for this beneficiary
  const myAppointments = appointments.filter(
    (a) =>
      String(a.clientId) === String(currentUser.id) ||
      myRequests.some((r) => r.caseNumber === a.caseNumber)
  );
  const myTransactions = transactions.filter(
    (transaction) =>
      String(transaction.clientId) === String(currentUser.id) ||
      (Boolean(transaction.caseNumber) &&
        myRequests.some((request) => request.caseNumber === transaction.caseNumber))
  );

  // Permitted reports for this user (only their own case numbers, respecting privacy)
  const permittedReports = reports.filter((rep) =>
    myRequests.some((r) => r.caseNumber === rep.caseNumber)
  );

  // Notifications for this beneficiary
  const myNotifications = notifications.filter(
    (n) => String(n.userId) === String(currentUser.id) || n.recipientRole === 'user' || n.recipientRole === 'ALL'
  );

  // Documents state
  const [myDocuments, setMyDocuments] = useState<CaseFileDocument[]>([]);
  const [newDocFile, setNewDocFile] = useState<File | null>(null);
  const [newDocCategory, setNewDocCategory] = useState<CaseFileDocument['fileCategory']>('وثيقة شخصية');
  const [documentError, setDocumentError] = useState('');
  const [documentUploading, setDocumentUploading] = useState(false);

  useEffect(() => {
    let active = true;
    listCaseDocumentsInDb()
      .then((documents) => {
        if (active) {
          setMyDocuments(documents.filter((document) => String(document.clientId) === String(currentUser.id)));
        }
      })
      .catch((error) => {
        if (active) setDocumentError(error instanceof Error ? error.message : 'تعذر تحميل الوثائق.');
      });
    return () => {
      active = false;
    };
  }, [currentUser.id]);

  // Selected Invoice Modal State
  const [selectedInvoice, setSelectedInvoice] = useState<PaymentTransaction | null>(null);

  const handleUploadDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocFile || !myRequests[0] || documentUploading) {
      setDocumentError('اختر ملفًا وطلبًا محفوظًا أولًا.');
      return;
    }
    setDocumentUploading(true);
    setDocumentError('');
    try {
      const savedDoc = await uploadCaseDocumentInDb(myRequests[0].id, newDocFile, newDocCategory);
      setMyDocuments((previous) => [savedDoc, ...previous]);
      setNewDocFile(null);
      const fileInput = document.getElementById('case-document-file') as HTMLInputElement | null;
      if (fileInput) fileInput.value = '';
    } catch (error) {
      setDocumentError(error instanceof Error ? error.message : 'تعذر رفع الوثيقة.');
    } finally {
      setDocumentUploading(false);
    }
  };

  const handleDownloadDocument = async (id: string | number) => {
    try {
      const result = await downloadCaseDocumentInDb(id);
      const bytes = Uint8Array.from(atob(result.base64), (character) => character.charCodeAt(0));
      const url = URL.createObjectURL(new Blob([bytes], { type: result.mimeType }));
      const link = document.createElement('a');
      link.href = url;
      link.download = result.fileName;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      setDocumentError(error instanceof Error ? error.message : 'تعذر تنزيل الوثيقة.');
    }
  };

  const getPriorityText = (prio: Priority) => {
    switch (prio) {
      case 'Critical':
        return '🔴 عاجلة جداً';
      case 'High':
        return '🟠 عاجلة';
      case 'Medium':
        return '🟡 متوسطة';
      default:
        return '🟢 عادية';
    }
  };

  const accountMenu = [
    { key: 'dashboard', title: 'الرئيسية', icon: <House className="h-4 w-4" />, action: () => setBeneficiaryTab('dashboard') },
    { key: 'new-request', title: 'طلب استشارة', icon: <Plus className="h-4 w-4" />, action: onNewRequest },
    { key: 'requests', title: 'طلباتي', icon: <FolderOpen className="h-4 w-4" />, action: () => setBeneficiaryTab('requests') },
    { key: 'appointments', title: 'مواعيدي', icon: <Calendar className="h-4 w-4" />, action: () => setBeneficiaryTab('appointments') },
    { key: 'family-members', title: 'أفراد أسرتي', icon: <Users className="h-4 w-4" />, action: () => setBeneficiaryTab('family-members') },
    { key: 'family-package', title: 'الباقة الأسرية', icon: <PackageCheck className="h-4 w-4" />, action: () => setBeneficiaryTab('family-package') },
    { key: 'payments', title: 'مدفوعاتي', icon: <CreditCard className="h-4 w-4" />, action: () => setBeneficiaryTab('payments') },
    { key: 'invoices', title: 'فواتيري', icon: <Receipt className="h-4 w-4" />, action: () => setBeneficiaryTab('invoices') },
    { key: 'nearby', title: 'الجهات القريبة مني', icon: <MapPin className="h-4 w-4" />, action: () => onOpenDirectory('centers') },
    { key: 'messages', title: 'رسائلي', icon: <MessageCircle className="h-4 w-4" />, action: () => setBeneficiaryTab('messages') },
    { key: 'privacy', title: 'الخصوصية', icon: <ShieldCheck className="h-4 w-4" />, action: () => setBeneficiaryTab('privacy') },
    { key: 'settings', title: 'الإعدادات', icon: <Settings className="h-4 w-4" />, action: () => setBeneficiaryTab('settings') },
  ];

  return (
    <div className="mx-auto grid w-full max-w-[1280px] gap-5 lg:grid-cols-[250px_minmax(0,1fr)]" dir="rtl">
      <aside className="h-fit rounded-[18px] border border-[#E0E8E6] bg-[#FBFDFC] p-3 shadow-xs lg:sticky lg:top-4">
        <div className="mb-2 px-2 py-2">
          <p className="text-sm font-black text-[#203945]">القائمة</p>
          <p className="mt-1 text-[11px] text-[#203945]/60">{currentUser.firstName} {currentUser.lastName}</p>
        </div>
        <nav aria-label="قائمة الحساب" className="grid grid-cols-2 gap-1 sm:grid-cols-3 lg:flex lg:flex-col">
          {accountMenu.map((item) => {
            const active = item.key === beneficiaryTab;
            return (
              <button
                key={item.key}
                type="button"
                onClick={item.action}
                aria-current={active ? 'page' : undefined}
                className={`flex min-h-[44px] items-center gap-2 rounded-[10px] px-2.5 py-2 text-right text-xs font-bold transition-colors ${
                  active
                    ? 'bg-[#1766A6] text-white'
                    : 'text-[#203945]/80 hover:bg-[#EAF3F8] hover:text-[#104A78]'
                }`}
              >
                <span className="shrink-0">{item.icon}</span>
                <span>{item.title}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      <main className="min-w-0 space-y-5">
      {/* Profile Header */}
      <div className="bg-[#FBFDFC] rounded-[22px] p-5 sm:p-6 border border-[#E0E8E6] shadow-xs flex items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <img
            src="/logo.png"
            alt="Logo"
            className="w-12 h-12 object-contain rounded-full border border-[#DCEBF4] bg-white p-1 shrink-0"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#1766A6]/10 text-[#1766A6] text-[10px] font-bold">
                حساب المستفيد
              </span>
            </div>
            <h2 className="font-black text-lg text-[#203945] mt-1">
              {currentUser.firstName} {currentUser.lastName}
            </h2>
            <p className="text-xs text-[#203945]/70">
              البريد: {currentUser.email || 'غير مسجل'} • الولاية: {currentUser.wilayaName || 'غير محددة'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onNewRequest}
            className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-[12px] bg-[#1766A6] hover:bg-[#125386] text-white text-xs font-bold shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>طلب استشارة</span>
          </button>

          <button
            onClick={onLogout}
            className="p-2 rounded-xl text-[#A64842] hover:bg-[#FBECEB] transition-colors"
            title="تسجيل الخروج"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      {beneficiaryTab === 'dashboard' && (
        <AccountDashboardView
          currentUser={currentUser}
          requests={myRequests}
          appointments={myAppointments}
          transactions={myTransactions}
          reports={permittedReports}
          services={services}
          onNewRequest={onNewRequest}
          onRequestService={onRequestService}
          onOpenDirectory={onOpenDirectory}
          onSelectRequest={onSelectRequest}
          onStartPayment={onStartPayment}
        />
      )}

      {beneficiaryTab === 'family-members' && (
        <section className="rounded-[20px] border border-dashed border-[#CCD8D5] bg-[#FBFDFC] p-8 text-center shadow-xs">
          <Users className="mx-auto h-10 w-10 text-[#1766A6]" />
          <h2 className="mt-3 font-black text-[#203945]">أفراد أسرتي</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[#203945]/70">
            لا توجد صلات بأفراد أسرة مسجلة في بيانات هذا الحساب حاليًا.
          </p>
        </section>
      )}

      {beneficiaryTab === 'privacy' && (
        <section className="space-y-3 rounded-[20px] border border-[#E0E8E6] bg-[#FBFDFC] p-5 shadow-xs">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EAF3F8] text-[#1766A6]">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-black text-[#203945]">الخصوصية</h2>
              <p className="mt-1 text-xs text-[#203945]/65">بيانات الحساب والطلبات المرتبطة به.</p>
            </div>
          </div>
          <p className="rounded-[14px] bg-[#F3F7F6] p-4 text-sm leading-relaxed text-[#203945]/80">
            تعرض لوحة الحساب الطلبات والمواعيد والمدفوعات المرتبطة بحسابك فقط. لا تتوفر حاليًا إعدادات إضافية لتغيير تفضيلات الخصوصية من هذه الشاشة.
          </p>
        </section>
      )}

      {/* ================= 1. TAB: REQUESTS (طلباتي) ================= */}
      {beneficiaryTab === 'requests' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#203945]">سجل طلباتي واستشاراتي</h3>
            <button
              onClick={onNewRequest}
              className="flex items-center gap-1 px-3 py-1.5 rounded-[10px] bg-[#1766A6] text-white text-xs font-bold hover:bg-[#125386]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>طلب استشارة أو خدمة</span>
            </button>
          </div>

          {myRequests.length === 0 ? (
            <div className="bg-[#FBFDFC] rounded-[18px] border border-[#E0E8E6] p-8 text-center space-y-3">
              <FolderOpen className="w-10 h-10 text-[#1766A6] mx-auto opacity-70" />
              <p className="font-bold text-xs text-[#203945]">ليس لديك أي طلبات مسجلة حالياً</p>
              <button
                onClick={onNewRequest}
                className="px-5 py-2.5 rounded-[12px] bg-[#1766A6] text-white text-xs font-bold shadow-xs hover:bg-[#125386]"
              >
                تقديم أول طلب الآن
              </button>
            </div>
          ) : (
            myRequests.map((req) => {
              const progress = getCustomerRequestProgress(
                req,
                myAppointments,
                myTransactions,
                permittedReports
              );
              const canPay =
                (req.status === 'ACCEPTED' || req.status === 'WAITING_PAYMENT') &&
                ['PENDING', 'FAILED', 'CANCELLED'].includes(req.paymentStatus);

              return (
                <div
                  key={req.id}
                  className="bg-[#FBFDFC] rounded-[18px] border border-[#E0E8E6] p-4.5 shadow-xs space-y-3 hover:border-[#1766A6] transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#F0F4F2] pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-[#1766A6] bg-[#EAF3F8] px-2 py-0.5 rounded-md" dir="ltr">
                        {req.caseNumber}
                      </span>
                      <h4 className="font-bold text-sm text-[#203945]">{req.serviceTitle}</h4>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#F3F7F6] text-[#203945]">
                        {getPriorityText(req.priority)}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        progress.tone === 'success'
                          ? 'bg-green-50 text-[#16A34A]'
                          : progress.tone === 'action'
                            ? 'bg-amber-50 text-[#D97706]'
                            : progress.tone === 'progress'
                              ? 'bg-teal-50 text-[#0F766E]'
                              : 'bg-slate-100 text-[#64748B]'
                      }`}>
                        {progress.label}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-[#203945]/80 leading-relaxed">{req.description}</p>
                  <p className={`text-xs font-semibold ${
                    progress.tone === 'action' ? 'text-[#D97706]' : 'text-[#64748B]'
                  }`}>
                    {progress.detail}
                  </p>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-[#F0F4F2] text-xs">
                    <div className="flex items-center gap-3 text-[#203945]/70 text-[11px]">
                      <span>المشرف: {req.providerName}</span>
                      <span>•</span>
                      <span>المبلغ: {req.amountDzd.toLocaleString()} دج</span>
                      <span>•</span>
                       <span>
                         الدفع: {{
                           PAID: 'مسدد',
                           NOT_REQUIRED: 'غير مطلوب',
                           PENDING: 'بانتظار الدفع',
                           PROCESSING: 'قيد المعالجة',
                           FAILED: 'فشل الدفع',
                           REFUNDED: 'مسترد',
                           CANCELLED: 'ملغى',
                         }[req.paymentStatus]}
                       </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {canPay && (
                        <button
                          onClick={() => onStartPayment(req)}
                          className="px-3.5 py-1.5 rounded-[8px] bg-[#25866D] text-white font-bold text-xs hover:bg-[#1E6F5A] flex items-center gap-1"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                           <span>سداد الرسوم ({req.amountDzd.toLocaleString('ar-DZ')} دج)</span>
                        </button>
                      )}

                      <button
                        onClick={() => onSelectRequest(req)}
                        className="px-3 py-1.5 rounded-[8px] bg-[#EAF3F8] text-[#1766A6] font-bold text-xs hover:bg-[#DCEBF4]"
                      >
                        عرض تفاصيل الطلب
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ================= 2. TAB: APPOINTMENTS (مواعيدي) ================= */}
      {beneficiaryTab === 'appointments' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#203945]">جدول مواعيدي واستشاراتي</h3>
            <button
              onClick={onNewRequest}
              className="flex items-center gap-1 px-3 py-1.5 rounded-[10px] bg-[#1766A6] text-white text-xs font-bold hover:bg-[#125386]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>حجز موعد استشارة</span>
            </button>
          </div>

          {myAppointments.length === 0 ? (
            <div className="rounded-[18px] border border-dashed border-[#CCD8D5] bg-[#FBFDFC] p-8 text-center">
              <Calendar className="mx-auto h-9 w-9 text-[#1766A6]" />
              <p className="mt-2 text-sm font-bold text-[#203945]">لا توجد مواعيد مسجلة لهذا الحساب.</p>
            </div>
          ) : (
            myAppointments.map((appointment) => {
              const request = myRequests.find((item) => item.caseNumber === appointment.caseNumber);
              const statusLabels: Record<Appointment['status'], string> = {
                PENDING: 'بانتظار التأكيد',
                CONFIRMED: 'مؤكد',
                COMPLETED: 'مكتمل',
                CANCELLED: 'ملغى',
              };
              return (
                <article key={appointment.id} className="rounded-[18px] border border-[#E0E8E6] bg-[#FBFDFC] p-4 shadow-xs">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h4 className="font-black text-sm text-[#203945]">
                        {request?.serviceTitle || appointment.type}
                      </h4>
                      <p className="mt-1 text-xs text-[#203945]/65">{appointment.specialistName}</p>
                    </div>
                    <span className="rounded-full bg-[#EAF3F8] px-3 py-1 text-xs font-bold text-[#104A78]">
                      {statusLabels[appointment.status]}
                    </span>
                  </div>
                  <div className="mt-3 grid gap-2 rounded-xl bg-white p-3 text-xs sm:grid-cols-3">
                    <p><span className="text-[#203945]/60">التاريخ: </span><strong>{appointment.date}</strong></p>
                    <p><span className="text-[#203945]/60">الوقت: </span><strong>{appointment.time}</strong></p>
                    <p><span className="text-[#203945]/60">رقم الطلب: </span><strong dir="ltr">{appointment.caseNumber}</strong></p>
                  </div>
                </article>
              );
            })
          )}
        </div>
      )}

      {/* ================= 3. TAB: FAMILY PACKAGE (باقتي الأسرية) ================= */}
      {beneficiaryTab === 'family-package' && (
        <FamilyPackageView />
      )}

      {/* ================= 4. TAB: PAYMENTS (المدفوعات) ================= */}
      {beneficiaryTab === 'payments' && (
        <div className="bg-[#FBFDFC] border border-[#E0E8E6] rounded-[20px] p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#E0E8E6]">
            <h3 className="font-bold text-sm text-[#203945]">سجل المعاملات والمدفوعات</h3>
            <span className="text-xs text-[#203945]/60">معاملات إلكترونية مؤكدة</span>
          </div>

          {myTransactions.length === 0 ? (
            <div className="rounded-[16px] border border-dashed border-[#CCD8D5] bg-white p-7 text-center">
              <CreditCard className="mx-auto h-8 w-8 text-[#1766A6]" />
              <p className="mt-2 text-sm font-bold text-[#203945]">لا توجد معاملات دفع مسجلة لهذا الحساب.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {myTransactions.map((transaction) => {
                const statusLabels: Record<PaymentTransaction['status'], string> = {
                  SUCCESSFUL: 'ناجحة',
                  FAILED: 'فاشلة',
                  PENDING: 'قيد الانتظار',
                  REFUNDED: 'مستردة',
                  CANCELLED: 'ملغاة',
                };
                const succeeded = transaction.status === 'SUCCESSFUL';
                return (
                  <article key={transaction.id} className="flex flex-col gap-3 rounded-[14px] border border-[#CCD8D5] bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <span className={`flex h-9 w-9 items-center justify-center rounded-full font-bold ${succeeded ? 'bg-emerald-50 text-emerald-700' : 'bg-[#F3F7F6] text-[#52656D]'}`}>
                        {succeeded ? <Check className="h-4 w-4" /> : <CreditCard className="h-4 w-4" />}
                      </span>
                      <div>
                        <h4 className="font-bold text-sm text-[#203945]">{transaction.serviceTitle}</h4>
                        <p className="text-[11px] text-[#203945]/70">
                          {transaction.paymentId} • {transaction.paidAt || transaction.createdAt}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end">
                      <span className="font-black text-sm text-[#203945]">
                        {transaction.amountDzd.toLocaleString('ar-DZ')} {transaction.currency}
                      </span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${succeeded ? 'bg-emerald-50 text-emerald-700' : 'bg-[#F3F7F6] text-[#52656D]'}`}>
                        {transaction.paymentMethod === 'DEMO' ? 'دفع تجريبي — دون خصم' : statusLabels[transaction.status]}
                      </span>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ================= 5. TAB: INVOICES (فواتيري) ================= */}
      {beneficiaryTab === 'invoices' && (
        <div className="bg-[#FBFDFC] border border-[#E0E8E6] rounded-[20px] p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#E0E8E6]">
            <h3 className="font-bold text-sm text-[#203945]">فواتيري وإيصالات الدفع</h3>
            <span className="text-xs text-[#203945]/60">إيصالات مستندة إلى معاملات دفع ناجحة</span>
          </div>

          {myTransactions.filter((transaction) => transaction.status === 'SUCCESSFUL').length === 0 ? (
            <div className="rounded-[16px] border border-dashed border-[#CCD8D5] bg-white p-7 text-center">
              <Receipt className="mx-auto h-8 w-8 text-[#1766A6]" />
              <p className="mt-2 text-sm font-bold text-[#203945]">لا توجد إيصالات دفع ناجحة لهذا الحساب.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {myTransactions
                .filter((transaction) => transaction.status === 'SUCCESSFUL')
                .map((transaction) => (
                  <article key={transaction.id} className="flex flex-col gap-3 rounded-[16px] border border-[#CCD8D5] bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#EAF3F8] text-[#1766A6]">
                        <Receipt className="h-5 w-5" />
                      </span>
                      <div>
                        <h4 className="font-bold text-sm text-[#203945]">{transaction.serviceTitle}</h4>
                        <p className="mt-1 text-[11px] text-[#203945]/70">
                          {transaction.paymentId} • {transaction.paidAt || transaction.createdAt}
                        </p>
                        {transaction.caseNumber && (
                          <p className="mt-0.5 text-[11px] text-[#203945]/60" dir="ltr">{transaction.caseNumber}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-sm text-[#25866D]">
                        {transaction.amountDzd.toLocaleString('ar-DZ')} {transaction.currency}
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectedInvoice(transaction)}
                        className="rounded-[8px] bg-[#EAF3F8] px-3.5 py-1.5 text-xs font-bold text-[#1766A6] transition-colors hover:bg-[#DCEBF4]"
                      >
                        عرض الإيصال
                      </button>
                    </div>
                  </article>
                ))}
            </div>
          )}
        </div>
      )}

      {/* ================= 6. TAB: MESSAGES (الرسائل) ================= */}
      {beneficiaryTab === 'messages' && (
        <div className="bg-[#FBFDFC] border border-[#E0E8E6] rounded-[20px] p-6 shadow-xs text-center space-y-4">
          <MessageCircle className="w-12 h-12 text-[#1766A6] mx-auto opacity-70" />
          <div>
            <h4 className="font-bold text-base text-[#203945]">المراسلات الآمنة والمشفرة</h4>
            <p className="text-xs text-[#203945]/70 mt-1 max-w-md mx-auto">
              يمكنك التواصل مباشرة مع المستشار القانوني أو الأخصائي النفسي العيادي المشرف على ملفك وسؤاله عن أي تفاصيل تتعلق بالحالة.
            </p>
          </div>
          <button
            onClick={() => onOpenChat(1)}
            className="px-6 py-2.5 bg-[#1766A6] hover:bg-[#125386] text-white font-bold text-xs rounded-[12px] shadow-xs transition-colors"
          >
            فتح صندوق المحادثة الآمن الآن ←
          </button>
        </div>
      )}

      {/* ================= 7. TAB: NOTIFICATIONS (الإشعارات) ================= */}
      {beneficiaryTab === 'notifications' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#203945]">الإشعارات والتنبيهات المباشرة</h3>
            <span className="text-xs text-[#203945]/60">{myNotifications.length} إشعار</span>
          </div>

          <div className="space-y-2">
            {myNotifications.map((n) => (
              <div
                key={n.id}
                className={`p-3.5 rounded-[14px] border text-xs flex items-start justify-between gap-3 ${
                  n.isRead ? 'bg-[#FBFDFC] border-[#E5ECE9]' : 'bg-white border-[#1766A6]/40 shadow-xs'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#203945]">{n.title}</span>
                    {!n.isRead && (
                      <span className="w-2 h-2 rounded-full bg-[#1766A6]" />
                    )}
                  </div>
                  <p className="text-[11px] text-[#203945]/80 leading-relaxed">{n.message}</p>
                  <span className="text-[10px] text-[#203945]/50 block">{n.timestamp}</span>
                </div>

                {!n.isRead && (
                  <button
                    onClick={() => markNotificationAsReadInDb(n.id)}
                    className="text-[10px] font-bold text-[#1766A6] hover:underline shrink-0"
                  >
                    تحديد كمقروء
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= 8. TAB: FILES (إيداع الملفات) ================= */}
      {beneficiaryTab === 'files' && (
        <div className="space-y-4">
          <div className="bg-[#FBFDFC] border border-[#E0E8E6] rounded-[20px] p-5 shadow-xs space-y-3">
            <h4 className="font-bold text-sm text-[#203945]">إيداع ملف أو وثيقة جديدة</h4>
            <form onSubmit={handleUploadDoc} className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <input
                id="case-document-file"
                type="file"
                required
                accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                onChange={(e) => setNewDocFile(e.target.files?.[0] || null)}
                disabled={!myRequests.length || documentUploading}
                className="w-full h-10 px-3 bg-white border border-[#CCD8D5] rounded-[10px]"
              />
              <select
                value={newDocCategory}
                onChange={(e) => setNewDocCategory(e.target.value as any)}
                disabled={!myRequests.length || documentUploading}
                className="w-full h-10 px-3 bg-white border border-[#CCD8D5] rounded-[10px]"
              >
                <option value="وثيقة شخصية">وثيقة شخصية</option>
                <option value="شهادة طبية">شهادة طبية</option>
                <option value="تقرير طبي">تقرير طبي</option>
                <option value="وثيقة قضائية">وثيقة قضائية</option>
                <option value="محضر رسمي">محضر رسمي</option>
              </select>
              <button
                type="submit"
                disabled={!myRequests.length || !newDocFile || documentUploading}
                className="px-5 py-2.5 rounded-[10px] bg-[#1766A6] text-white font-bold hover:bg-[#125386]"
              >
                {documentUploading ? 'جارٍ الرفع والتشفير...' : 'رفع الوثيقة إلى أحدث طلب'}
              </button>
            </form>
            <p className="text-[11px] leading-5 text-[#203945]/70">
              تُحفظ الوثيقة مشفرة ومربوطة بأحدث طلب لديك. الحد الأقصى 2 ميغابايت، ويقتصر الوصول على أطراف الطلب المخولين.
            </p>
            {documentError && <p role="alert" className="text-xs font-bold text-red-700">{documentError}</p>}
            {!myRequests.length && (
              <p className="text-xs text-amber-800">أنشئ طلبًا أولًا لربط الوثيقة بملف حالة حقيقي.</p>
            )}
          </div>

          <div className="space-y-2">
            {myDocuments.map((doc) => (
              <div
                key={doc.id}
                className="bg-white border border-[#CCD8D5] p-3.5 rounded-[14px] flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#EAF3F8] text-[#1766A6] flex items-center justify-center font-bold">
                    PDF
                  </div>
                  <div>
                    <h5 className="font-bold text-[#203945]">{doc.fileName}</h5>
                    <p className="text-[10px] text-[#203945]/60">
                      التصنيف: {doc.fileCategory} • الحجم: {doc.fileSize} • تاريخ الرفع: {doc.uploadDate}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => void handleDownloadDocument(doc.id)}
                  className="flex items-center gap-1 rounded-md bg-[#E8F4EF] px-2 py-1 text-[10px] font-bold text-[#25866D] hover:bg-[#d6ede3]"
                >
                  <Download className="h-3 w-3" />
                  تنزيل الوثيقة
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= 9. TAB: REPORTS (التقارير المعتمدة) ================= */}
      {beneficiaryTab === 'reports' && (
        <div className="space-y-3">
          <div className="bg-[#EAF3F8] p-3.5 rounded-[14px] border border-[#DCEBF4] text-xs text-[#104A78] flex items-start gap-2">
            <Shield className="w-4 h-4 text-[#1766A6] shrink-0 mt-0.5" />
            <p>
              <strong>الخصوصية والسرية:</strong> تعرض هذه النافذة حصرياً التقييمات والاستشارات المودعة من قبل الأخصائيين النفسيين العياديين والمستشارين القانونيين المرتبطين بقضاياك فقط.
            </p>
          </div>

          {permittedReports.length === 0 ? (
            <div className="bg-[#FBFDFC] rounded-[18px] border border-[#E0E8E6] p-8 text-center space-y-2">
              <FileText className="w-8 h-8 text-[#1766A6] mx-auto opacity-70" />
              <p className="font-bold text-xs text-[#203945]">لا توجد تقارير مودعة بعد في ملفك</p>
            </div>
          ) : (
            permittedReports.map((rep) => (
              <div key={rep.id} className="bg-white border border-[#CCD8D5] p-4 rounded-[16px] space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-[#203945]">{rep.caseNumber} — تقرير استشارة</h4>
                  <span className="text-[10px] text-[#203945]/60">{rep.createdAt}</span>
                </div>
                <p className="text-[#203945]/80">{rep.evaluation}</p>
                <div className="bg-[#F3F7F6] p-2.5 rounded-[8px] text-[11px] text-[#25866D] font-bold">
                  التوصيات: {rep.recommendations}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ================= 10. TAB: PROFILE (الملف الشخصي) ================= */}
      {beneficiaryTab === 'settings' && (
        <AccountSettingsView currentUser={currentUser} onSave={onUpdateAccountSettings} />
      )}

      </main>

      {/* Invoice Viewer Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-[22px] max-w-md w-full p-6 space-y-4 shadow-2xl border border-[#E0E8E6] text-right text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-[#E0E8E6]">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-[#25866D]" />
                <h3 className="font-black text-sm text-[#203945]">إيصال الدفع</h3>
              </div>
              <span className="text-[10px] font-mono bg-[#E8F4EF] text-[#25866D] px-2 py-0.5 rounded-full font-bold">
                {selectedInvoice.paymentMethod === 'DEMO' ? 'إيصال تجريبي — دون تحصيل' : selectedInvoice.status === 'SUCCESSFUL' ? 'مدفوعة' : selectedInvoice.status}
              </span>
            </div>

            <div className="space-y-2 bg-[#F8FAF9] p-4 rounded-[14px] border border-[#E5ECE9]">
              <p className="flex justify-between">
                <span className="text-[#203945]/70">رقم الدفع:</span>
                <span className="font-mono font-bold">{selectedInvoice.paymentId}</span>
              </p>
              <p className="flex justify-between">
                <span className="text-[#203945]/70">مرجع الطلب:</span>
                <span className="font-mono font-bold text-[#1766A6]">{selectedInvoice.orderId}</span>
              </p>
              <p className="flex justify-between">
                <span className="text-[#203945]/70">نوع الخدمة:</span>
                <span className="font-bold">{selectedInvoice.serviceTitle}</span>
              </p>
              <p className="flex justify-between">
                <span className="text-[#203945]/70">تاريخ الدفع:</span>
                <span>{selectedInvoice.paidAt || selectedInvoice.createdAt}</span>
              </p>
              <p className="flex justify-between">
                <span className="text-[#203945]/70">المستفيد:</span>
                <span>{selectedInvoice.clientName}</span>
              </p>
              <div className="pt-2 border-t border-[#E0E8E6] flex justify-between font-black text-sm text-[#203945]">
                <span>المبلغ:</span>
                <span className="text-[#25866D]">
                  {selectedInvoice.amountDzd.toLocaleString('ar-DZ')} {selectedInvoice.currency}
                </span>
              </div>
            </div>

            <p className="text-[10px] leading-relaxed text-center text-[#203945]/60">
              هذا الإيصال يعرض تفاصيل معاملة الدفع المحفوظة في الحساب.
            </p>

            <div className="flex justify-end pt-2 border-t border-[#E0E8E6] gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 rounded-[10px] bg-[#EAF3F8] text-[#1766A6] font-bold text-xs"
              >
                طباعة / تحميل
              </button>
              <button
                type="button"
                onClick={() => setSelectedInvoice(null)}
                className="px-5 py-2 rounded-[10px] bg-[#1766A6] text-white font-bold text-xs"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
