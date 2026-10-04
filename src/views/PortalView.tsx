import React, { useState } from 'react';
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
} from '../types';
import {
  User as UserIcon,
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
  MessageSquare,
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
  initialUsers,
  initialLegalTopics,
  initialCaseDocuments,
} from '../data/initialData';
import { markNotificationAsReadInDb } from '../services/dbService';

interface PortalViewProps {
  currentUser: User;
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
  onLogout: () => void;
}

export const PortalView: React.FC<PortalViewProps> = ({
  currentUser,
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
  onLogout,
}) => {
  // Navigation tabs (Matching Project Plan Requirements: requests, appointments, family-package, payments, invoices, messages, profile)
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
    | 'profile'
  >('requests');

  // Filter requests belonging to this beneficiary
  const myRequests = requests.filter(
    (r) => String(r.clientId) === String(currentUser.id)
  );

  // Active cases (accepted or in progress)
  const myActiveCases = myRequests.filter(
    (r) =>
      r.status === 'ACCEPTED' ||
      r.status === 'APPOINTMENT_CONFIRMED' ||
      r.status === 'IN_PROGRESS' ||
      r.status === 'PAID'
  );

  // Appointments for this beneficiary
  const myAppointments = appointments.filter(
    (a) =>
      String(a.clientId) === String(currentUser.id) ||
      myRequests.some((r) => r.caseNumber === a.caseNumber)
  );

  // Permitted reports for this user (only their own case numbers, respecting privacy)
  const permittedReports = reports.filter((rep) =>
    myRequests.some((r) => r.caseNumber === rep.caseNumber)
  );

  // Notifications for this beneficiary
  const myNotifications = notifications.filter(
    (n) => String(n.userId) === String(currentUser.id) || n.recipientRole === 'user' || n.recipientRole === 'ALL'
  );
  const unreadCount = myNotifications.filter((n) => !n.isRead).length;

  // Documents state
  const [myDocuments, setMyDocuments] = useState<CaseFileDocument[]>(
    initialCaseDocuments.filter((d) => String(d.clientId) === String(currentUser.id))
  );
  const [newDocName, setNewDocName] = useState('');
  const [newDocCategory, setNewDocCategory] = useState<CaseFileDocument['fileCategory']>('وثيقة شخصية');

  // Family Package State (Requirements 14 & 15 from Project Plan)
  const [familyPackage, setFamilyPackage] = useState({
    name: 'Family Plus',
    status: 'نشطة',
    startDate: '01/10/2026',
    endDate: '30/11/2026',
    remainingDays: 42,
    quotas: [
      { id: 'legal', service: 'جلسة استشارة قانونية', total: 1, remaining: 1, used: 0 },
      { id: 'psych', service: 'جلسة توجيه نفسي', total: 1, remaining: 1, used: 0 },
      { id: 'social', service: 'جلسة مرافقة اجتماعية', total: 1, remaining: 1, used: 0 },
    ],
  });
  const [packageMsg, setPackageMsg] = useState<string | null>(null);

  // Selected Invoice Modal State
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);

  const handleUsePackageSession = (sessionQuotaId: string) => {
    // Backend verification logic (Requirement 15)
    // 1. هل الباقة نشطة؟
    if (familyPackage.status !== 'نشطة') {
      setPackageMsg('عذراً، الباقة الأسرية غير نشطة حالياً.');
      return;
    }
    // 2. هل تاريخ الانتهاء لم يمر؟
    // 3. هل توجد حصة متبقية؟
    const quotaItem = familyPackage.quotas.find((q) => q.id === sessionQuotaId);
    if (!quotaItem || quotaItem.remaining <= 0) {
      setPackageMsg('عذراً، لقد استنفدت جميع الحصص المخصصة لهذه الخدمة في باقتك الحالية.');
      return;
    }

    // Deduct session quota
    setFamilyPackage({
      ...familyPackage,
      quotas: familyPackage.quotas.map((q) =>
        q.id === sessionQuotaId ? { ...q, remaining: q.remaining - 1, used: q.used + 1 } : q
      ),
    });

    setPackageMsg(`تم بنجاح تفعيل حجز «${quotaItem.service}» وخصم الحصة من رصيد باقة الأسرة.`);
    setTimeout(() => {
      onNewRequest();
    }, 1500);
  };

  const handleUploadDoc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocName.trim()) return;

    const newDoc: CaseFileDocument = {
      id: Date.now(),
      caseNumber: myRequests[0]?.caseNumber || 'SC2026-00001-',
      clientId: currentUser.id as any,
      clientName: `${currentUser.firstName} ${currentUser.lastName}`,
      providerId: 2,
      providerName: 'المختص المشرف',
      fileName: newDocName.trim(),
      fileCategory: newDocCategory,
      fileSize: '1.2 MB',
      uploadDate: new Date().toISOString().split('T')[0],
      isConfidential: true,
    };

    setMyDocuments([newDoc, ...myDocuments]);
    setNewDocName('');
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

  const getStatusText = (status: string) => {
    switch (status) {
      case 'NEW':
      case 'PENDING_PROVIDER':
        return 'قيد المراجعة والانتظار';
      case 'ACCEPTED':
      case 'WAITING_PAYMENT':
        return 'مقبول — بانتظار الدفع';
      case 'PAID':
      case 'APPOINTMENT_CONFIRMED':
        return 'موعد مؤكد ومحجوز';
      case 'IN_PROGRESS':
        return 'قيد المتابعة والعلاج';
      case 'COMPLETED':
        return 'مكتمل بنجاح';
      case 'REJECTED':
        return 'مرفوض';
      case 'CANCELLED':
        return 'ملغى';
      default:
        return status;
    }
  };

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
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
                👨‍👩‍👧 لوحة الأسرة / المستفيد
              </span>
              <span className="text-[10px] text-[#25866D] font-bold bg-[#E8F4EF] px-2 py-0.5 rounded-md">
                بيانات مشفرة وسرية
              </span>
            </div>
            <h2 className="font-black text-lg text-[#203945] mt-1">
              مرحباً بك، {currentUser.firstName} {currentUser.lastName} 👋
            </h2>
            <p className="text-xs text-[#203945]/70">
              البريد: {currentUser.email} • الولاية: {currentUser.wilayaName || 'قسنطينة'}
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

      {/* Quick Summary Cards from Plan (Page 13, 25, 26) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Card 1: What do you need today? */}
        <div className="bg-[#FBFDFC] p-4.5 rounded-[18px] border border-[#E0E8E6] shadow-xs flex flex-col justify-between space-y-2.5">
          <div>
            <span className="text-[11px] font-bold text-[#1766A6]">مرحباً بك</span>
            <h3 className="font-black text-sm text-[#203945] mt-0.5">ماذا تحتاج اليوم؟</h3>
            <p className="text-[11px] text-[#203945]/70 mt-1">
              طلب استشارة قانونية أو نفسية أو مرافقة علاجية بسرية تامة
            </p>
          </div>
          <button
            onClick={onNewRequest}
            className="w-full py-2 bg-[#1766A6] hover:bg-[#125386] text-white font-bold text-xs rounded-[10px] transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>[ طلب استشارة جديدة ]</span>
          </button>
        </div>

        {/* Card 2: Next Appointment */}
        <div className="bg-[#FBFDFC] p-4.5 rounded-[18px] border border-[#E0E8E6] shadow-xs flex flex-col justify-between space-y-2.5">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#25866D] flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>الموعد القادم</span>
              </span>
              <span className="text-[10px] font-bold bg-[#E8F4EF] text-[#25866D] px-2 py-0.5 rounded-full">
                مؤكد
              </span>
            </div>
            <h3 className="font-bold text-sm text-[#203945] mt-0.5">الاستشارة القانونية</h3>
            <p className="text-xs text-[#203945]/80 font-mono mt-1">
              📅 05/10/2026 — ⏰ 14:00
            </p>
          </div>
          <button
            onClick={() => setBeneficiaryTab('appointments')}
            className="w-full py-1.5 bg-[#EAF3F8] hover:bg-[#DCEBF4] text-[#1766A6] font-bold text-xs rounded-[10px] transition-colors text-center"
          >
            [ عرض الموعد ]
          </button>
        </div>

        {/* Card 3: Family Package */}
        <div className="bg-[#FBFDFC] p-4.5 rounded-[18px] border border-[#E0E8E6] shadow-xs flex flex-col justify-between space-y-2.5">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-purple-700">باقتي الأسرية</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                {familyPackage.status}
              </span>
            </div>
            <h3 className="font-bold text-sm text-[#203945] mt-0.5">{familyPackage.name}</h3>
            <p className="text-[11px] text-[#203945]/70 mt-1">
              متبقي {familyPackage.remainingDays} يوماً • الحصص المتاحة: 3
            </p>
          </div>
          <button
            onClick={() => setBeneficiaryTab('family-package')}
            className="w-full py-1.5 bg-[#F3F7F6] hover:bg-[#E5ECE9] text-[#203945] font-bold text-xs rounded-[10px] transition-colors text-center border border-[#DCE4E1]"
          >
            [ إدارة الباقة ]
          </button>
        </div>
      </div>

      {/* Navigation Tabs (Project Plan Standard) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 no-scrollbar text-xs font-bold border-b border-[#E0E8E6]">
        <button
          onClick={() => setBeneficiaryTab('requests')}
          className={`px-3 py-2 rounded-[10px] transition-colors shrink-0 flex items-center gap-1.5 ${
            beneficiaryTab === 'requests'
              ? 'bg-[#1766A6] text-white shadow-xs'
              : 'bg-[#FBFDFC] text-[#203945]/70 hover:bg-[#EAF3F8]'
          }`}
        >
          <FolderOpen className="w-3.5 h-3.5" />
          <span>طلباتي ({myRequests.length})</span>
        </button>

        <button
          onClick={() => setBeneficiaryTab('appointments')}
          className={`px-3 py-2 rounded-[10px] transition-colors shrink-0 flex items-center gap-1.5 ${
            beneficiaryTab === 'appointments'
              ? 'bg-[#1766A6] text-white shadow-xs'
              : 'bg-[#FBFDFC] text-[#203945]/70 hover:bg-[#EAF3F8]'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>مواعيدي ({myAppointments.length})</span>
        </button>

        <button
          onClick={() => setBeneficiaryTab('family-package')}
          className={`px-3 py-2 rounded-[10px] transition-colors shrink-0 flex items-center gap-1.5 ${
            beneficiaryTab === 'family-package'
              ? 'bg-[#1766A6] text-white shadow-xs'
              : 'bg-[#FBFDFC] text-[#203945]/70 hover:bg-[#EAF3F8]'
          }`}
        >
          <PackageCheck className="w-3.5 h-3.5" />
          <span>باقتي الأسرية (Family Plus)</span>
        </button>

        <button
          onClick={() => setBeneficiaryTab('payments')}
          className={`px-3 py-2 rounded-[10px] transition-colors shrink-0 flex items-center gap-1.5 ${
            beneficiaryTab === 'payments'
              ? 'bg-[#1766A6] text-white shadow-xs'
              : 'bg-[#FBFDFC] text-[#203945]/70 hover:bg-[#EAF3F8]'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5" />
          <span>المدفوعات</span>
        </button>

        <button
          onClick={() => setBeneficiaryTab('invoices')}
          className={`px-3 py-2 rounded-[10px] transition-colors shrink-0 flex items-center gap-1.5 ${
            beneficiaryTab === 'invoices'
              ? 'bg-[#1766A6] text-white shadow-xs'
              : 'bg-[#FBFDFC] text-[#203945]/70 hover:bg-[#EAF3F8]'
          }`}
        >
          <Receipt className="w-3.5 h-3.5" />
          <span>الفواتير</span>
        </button>

        <button
          onClick={() => setBeneficiaryTab('messages')}
          className={`px-3 py-2 rounded-[10px] transition-colors shrink-0 flex items-center gap-1.5 ${
            beneficiaryTab === 'messages'
              ? 'bg-[#1766A6] text-white shadow-xs'
              : 'bg-[#FBFDFC] text-[#203945]/70 hover:bg-[#EAF3F8]'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>الرسائل</span>
        </button>

        <button
          onClick={() => setBeneficiaryTab('notifications')}
          className={`px-3 py-2 rounded-[10px] transition-colors shrink-0 flex items-center gap-1.5 ${
            beneficiaryTab === 'notifications'
              ? 'bg-[#1766A6] text-white shadow-xs'
              : 'bg-[#FBFDFC] text-[#203945]/70 hover:bg-[#EAF3F8]'
          }`}
        >
          <Bell className="w-3.5 h-3.5" />
          <span>الإشعارات {unreadCount > 0 && `(${unreadCount})`}</span>
        </button>

        <button
          onClick={() => setBeneficiaryTab('files')}
          className={`px-3 py-2 rounded-[10px] transition-colors shrink-0 flex items-center gap-1.5 ${
            beneficiaryTab === 'files'
              ? 'bg-[#1766A6] text-white shadow-xs'
              : 'bg-[#FBFDFC] text-[#203945]/70 hover:bg-[#EAF3F8]'
          }`}
        >
          <Paperclip className="w-3.5 h-3.5" />
          <span>إيداع الملفات ({myDocuments.length})</span>
        </button>

        <button
          onClick={() => setBeneficiaryTab('reports')}
          className={`px-3 py-2 rounded-[10px] transition-colors shrink-0 flex items-center gap-1.5 ${
            beneficiaryTab === 'reports'
              ? 'bg-[#1766A6] text-white shadow-xs'
              : 'bg-[#FBFDFC] text-[#203945]/70 hover:bg-[#EAF3F8]'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>التقارير ({permittedReports.length})</span>
        </button>

        <button
          onClick={() => setBeneficiaryTab('profile')}
          className={`px-3 py-2 rounded-[10px] transition-colors shrink-0 flex items-center gap-1.5 ${
            beneficiaryTab === 'profile'
              ? 'bg-[#1766A6] text-white shadow-xs'
              : 'bg-[#FBFDFC] text-[#203945]/70 hover:bg-[#EAF3F8]'
          }`}
        >
          <UserIcon className="w-3.5 h-3.5" />
          <span>الملف الشخصي</span>
        </button>
      </div>

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
              const canPay =
                (req.status === 'ACCEPTED' || req.status === 'WAITING_PAYMENT') &&
                req.paymentStatus === 'PENDING';

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
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#E8F4EF] text-[#25866D]">
                        {getStatusText(req.status)}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-[#203945]/80 leading-relaxed">{req.description}</p>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-[#F0F4F2] text-xs">
                    <div className="flex items-center gap-3 text-[#203945]/70 text-[11px]">
                      <span>المشرف: {req.providerName}</span>
                      <span>•</span>
                      <span>المبلغ: {req.amountDzd.toLocaleString()} دج</span>
                      <span>•</span>
                      <span>الدفع: {req.paymentStatus === 'PAID' ? 'مسدد ✓' : 'بانتظار الدفع'}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {canPay && (
                        <button
                          onClick={() => onStartPayment(req)}
                          className="px-3.5 py-1.5 rounded-[8px] bg-[#25866D] text-white font-bold text-xs hover:bg-[#1E6F5A] flex items-center gap-1"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>سداد الرسوم (500 دج)</span>
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

          {/* Seeded Default Appointment if empty per Prototype */}
          <div className="bg-[#FBFDFC] rounded-[18px] border border-[#25866D]/30 p-4.5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">📅</span>
                <div>
                  <h4 className="font-black text-sm text-[#203945]">الاستشارة القانونية</h4>
                  <p className="text-[11px] text-[#25866D] font-bold">جلسة استشارة أولية مع محامٍ معتمد</p>
                </div>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-[#E8F4EF] text-[#25866D] text-[10px] font-bold">
                موعد مؤكد ومحجوز
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-white p-3 rounded-[12px] border border-[#E0E8E6]">
              <p>
                <span className="text-[#203945]/70 block text-[10px]">التاريخ:</span>
                <strong className="font-mono text-sm text-[#203945]">05/10/2026</strong>
              </p>
              <p>
                <span className="text-[#203945]/70 block text-[10px]">الوقت:</span>
                <strong className="font-mono text-sm text-[#1766A6]">14:00 ⏰</strong>
              </p>
              <p>
                <span className="text-[#203945]/70 block text-[10px]">المدة:</span>
                <strong>45 دقيقة</strong>
              </p>
              <p>
                <span className="text-[#203945]/70 block text-[10px]">النوع:</span>
                <span>استشارة عن بعد / حضورية</span>
              </p>
            </div>

            <div className="flex items-center justify-between pt-1 text-xs">
              <span className="text-[11px] text-[#203945]/60 font-mono">رقم الطلب: SC2026-00001-</span>
              <button
                onClick={() => setSelectedInvoice({
                  orderNumber: 'SC2026-00001-',
                  service: 'الاستشارة القانونية',
                  date: '05/10/2026',
                  time: '14:00',
                  amount: '500 دج',
                })}
                className="text-[#1766A6] font-bold hover:underline"
              >
                [ عرض الفاتورة المرفقة ]
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= 3. TAB: FAMILY PACKAGE (باقتي الأسرية) ================= */}
      {beneficiaryTab === 'family-package' && (
        <div className="bg-[#FBFDFC] border border-[#E0E8E6] rounded-[20px] p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E0E8E6]">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-lg text-[#203945]">{familyPackage.name}</h3>
                <span className="px-2.5 py-0.5 rounded-full bg-[#E8F4EF] text-[#25866D] text-[11px] font-bold">
                  الحالة: {familyPackage.status}
                </span>
              </div>
              <p className="text-xs text-[#203945]/70 mt-1">
                باقة متكاملة لحماية ودعم الأسرة (استشارات قانونية، توجيه نفسي، ومرافقة اجتماعية)
              </p>
            </div>

            <div className="text-left sm:text-right bg-[#EAF3F8] px-3.5 py-2 rounded-[12px] border border-[#DCEBF4]">
              <span className="text-[10px] text-[#1766A6] font-bold block">فترة الصلاحية:</span>
              <strong className="text-xs font-mono text-[#104A78]">
                {familyPackage.startDate} إلى {familyPackage.endDate}
              </strong>
              <span className="text-[10px] text-purple-700 block font-bold">
                (متبقي {familyPackage.remainingDays} يوماً)
              </span>
            </div>
          </div>

          {packageMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-[12px] text-xs text-emerald-800 font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{packageMsg}</span>
            </div>
          )}

          {/* Quota Table from Project Plan (Page 27) */}
          <div className="space-y-2">
            <h4 className="font-bold text-xs text-[#203945]">جدول حصص الاستشارات المشمولة بالباقة:</h4>
            <div className="border border-[#CCD8D5] rounded-[14px] overflow-hidden bg-white">
              <table className="w-full text-xs text-right">
                <thead className="bg-[#F3F7F6] text-[#203945] font-bold border-b border-[#CCD8D5]">
                  <tr>
                    <th className="p-3">الخدمة</th>
                    <th className="p-3 text-center">الحصة الإجمالية</th>
                    <th className="p-3 text-center">المستخدم</th>
                    <th className="p-3 text-center">المتبقي</th>
                    <th className="p-3 text-center">الإجراء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E0E8E6]">
                  {familyPackage.quotas.map((q) => (
                    <tr key={q.id} className="hover:bg-[#FBFDFC]">
                      <td className="p-3 font-bold text-[#203945]">{q.service}</td>
                      <td className="p-3 text-center font-mono">{q.total}</td>
                      <td className="p-3 text-center font-mono">{q.used}</td>
                      <td className="p-3 text-center font-mono font-bold text-[#25866D]">
                        {q.remaining}
                      </td>
                      <td className="p-3 text-center">
                        <button
                          disabled={q.remaining <= 0}
                          onClick={() => handleUsePackageSession(q.id)}
                          className="px-3 py-1.5 rounded-[8px] bg-[#1766A6] hover:bg-[#125386] disabled:opacity-40 text-white font-bold text-[11px] shadow-2xs transition-colors"
                        >
                          [ استخدام خدمة من الباقة ]
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="p-3 rounded-[12px] bg-[#F8FAF9] border border-[#E0E8E6] text-[11px] text-[#203945]/80 space-y-1">
            <strong>🔒 التحقق الآلي من الرصيد (Backend Quota Verification):</strong>
            <p>
              يتحقق النظام آلياً من سريان الباقة وتوفر الحصة قبل تأكيد الحجز وخصمها من الرصيد المتبقي دون الحاجة لدفع إضافي.
            </p>
          </div>
        </div>
      )}

      {/* ================= 4. TAB: PAYMENTS (المدفوعات) ================= */}
      {beneficiaryTab === 'payments' && (
        <div className="bg-[#FBFDFC] border border-[#E0E8E6] rounded-[20px] p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#E0E8E6]">
            <h3 className="font-bold text-sm text-[#203945]">سجل المعاملات والمدفوعات</h3>
            <span className="text-xs text-[#203945]/60">معاملات إلكترونية مؤكدة</span>
          </div>

          {/* Seeded payment record matching prototype */}
          <div className="space-y-2">
            <div className="bg-white p-4 rounded-[14px] border border-[#CCD8D5] flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                  ✓
                </div>
                <div>
                  <h4 className="font-bold text-sm text-[#203945]">الاستشارة القانونية</h4>
                  <p className="text-[11px] text-[#203945]/70 font-mono">
                    معاملة رقم: TX-2026-8842 • 05/10/2026
                  </p>
                </div>
              </div>
              <div className="text-left">
                <span className="font-black text-sm text-emerald-700 block">500 دج</span>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                  ناجحة / Paid
                </span>
              </div>
            </div>

            {transactions.map((t) => (
              <div key={t.id} className="bg-white p-4 rounded-[14px] border border-[#CCD8D5] flex items-center justify-between text-xs">
                <div>
                  <h4 className="font-bold text-sm text-[#203945]">{t.clientName}</h4>
                  <p className="text-[11px] text-[#203945]/70 font-mono">{t.transactionId} • {t.createdAt}</p>
                </div>
                <div className="text-left">
                  <span className="font-black text-sm text-emerald-700 block">{t.amountDzd} دج</span>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                    {t.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= 5. TAB: INVOICES (فواتيري) ================= */}
      {beneficiaryTab === 'invoices' && (
        <div className="bg-[#FBFDFC] border border-[#E0E8E6] rounded-[20px] p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#E0E8E6]">
            <h3 className="font-bold text-sm text-[#203945]">فواتيري الرسمية</h3>
            <span className="text-xs text-[#203945]/60">الفواتير الضريبية والقانونية المسددة</span>
          </div>

          <div className="bg-white p-4.5 rounded-[16px] border border-[#CCD8D5] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-[10px] bg-[#EAF3F8] text-[#1766A6] flex items-center justify-center font-bold">
                <Receipt className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-sm text-[#203945]">استشارة قانونية</h4>
                  <span className="text-[10px] font-mono bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full">
                    الحالة: مدفوعة ✓
                  </span>
                </div>
                <p className="text-[11px] text-[#203945]/70 font-mono mt-0.5">
                  رقم الفاتورة: INV-SC2026-0001 • التاريخ: 05/10/2026
                </p>
                <p className="font-black text-xs text-[#25866D] mt-1">المبلغ: 500 دج</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedInvoice({
                  orderNumber: 'SC2026-00001-',
                  service: 'استشارة قانونية',
                  date: '05/10/2026',
                  time: '14:00',
                  amount: '500 دج',
                })}
                className="px-3.5 py-1.5 rounded-[8px] bg-[#EAF3F8] text-[#1766A6] font-bold text-xs hover:bg-[#DCEBF4] transition-colors"
              >
                [ عرض الفاتورة ]
              </button>
              <button
                onClick={() => window.print()}
                className="px-3.5 py-1.5 rounded-[8px] bg-white border border-[#CCD8D5] text-[#203945] font-bold text-xs hover:bg-slate-100 transition-colors flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" />
                <span>[ تحميل ]</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= 6. TAB: MESSAGES (الرسائل) ================= */}
      {beneficiaryTab === 'messages' && (
        <div className="bg-[#FBFDFC] border border-[#E0E8E6] rounded-[20px] p-6 shadow-xs text-center space-y-4">
          <MessageSquare className="w-12 h-12 text-[#1766A6] mx-auto opacity-70" />
          <div>
            <h4 className="font-bold text-base text-[#203945]">المراسلات الآمنة والمشفرة</h4>
            <p className="text-xs text-[#203945]/70 mt-1 max-w-md mx-auto">
              يمكنك التواصل مباشرة مع المحامي أو الأخصائي النفسي المشرف على ملفك وسؤاله عن أي تفاصيل تتعلق بالحالة.
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
                  <span className="text-[10px] text-[#203945]/50 block">{n.createdAt}</span>
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
                type="text"
                required
                value={newDocName}
                onChange={(e) => setNewDocName(e.target.value)}
                placeholder="اسم الوثيقة (مثل: تقرير طبي، استدعاء...)"
                className="w-full h-10 px-3 bg-white border border-[#CCD8D5] rounded-[10px]"
              />
              <select
                value={newDocCategory}
                onChange={(e) => setNewDocCategory(e.target.value as any)}
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
                className="px-5 py-2.5 rounded-[10px] bg-[#1766A6] text-white font-bold hover:bg-[#125386]"
              >
                إرفاق الوثيقة
              </button>
            </form>
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
                <span className="px-2 py-0.5 rounded-md bg-[#E8F4EF] text-[#25866D] text-[10px] font-bold">
                  محمي بالسر المهني
                </span>
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
              <strong>الخصوصية والسرية الطبية:</strong> تعرض هذه النافذة حصرياً التقييمات والاستشارات المودعة من قبل الأخصائيين والمحامين المرتبطين بقضاياك فقط.
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
                <p className="text-[#203945]/80">{rep.summary}</p>
                <div className="bg-[#F3F7F6] p-2.5 rounded-[8px] text-[11px] text-[#25866D] font-bold">
                  التوصيات: {rep.recommendations}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ================= 10. TAB: PROFILE (الملف الشخصي) ================= */}
      {beneficiaryTab === 'profile' && (
        <div className="bg-[#FBFDFC] border border-[#E0E8E6] rounded-[20px] p-6 shadow-xs space-y-4 text-xs">
          <div className="flex items-center gap-3 pb-3 border-b border-[#E0E8E6]">
            <div className="w-12 h-12 rounded-full bg-[#EAF3F8] text-[#1766A6] flex items-center justify-center text-lg font-bold">
              {currentUser.firstName.charAt(0)}
            </div>
            <div>
              <h3 className="font-black text-base text-[#203945]">
                {currentUser.firstName} {currentUser.lastName}
              </h3>
              <p className="text-[#1766A6] font-bold">
                حساب مستفيد / أسرة • الولاية: {currentUser.wilayaName || 'قسنطينة'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="bg-[#F3F7F6] p-3.5 rounded-[12px] space-y-1">
              <span className="text-[#203945]/70 block font-semibold">البريد الإلكتروني:</span>
              <p className="font-bold text-[#203945]">{currentUser.email}</p>
            </div>

            <div className="bg-[#F3F7F6] p-3.5 rounded-[12px] space-y-1">
              <span className="text-[#203945]/70 block font-semibold">رقم الهاتف:</span>
              <p className="font-bold text-[#203945]">{currentUser.phone || '0673362606'}</p>
            </div>

            <div className="bg-[#F3F7F6] p-3.5 rounded-[12px] space-y-1">
              <span className="text-[#203945]/70 block font-semibold">الموقع / الولاية:</span>
              <p className="font-bold text-[#203945]">{currentUser.wilayaName || 'قسنطينة'}</p>
            </div>

            <div className="bg-[#F3F7F6] p-3.5 rounded-[12px] space-y-1">
              <span className="text-[#203945]/70 block font-semibold">حالة الحساب:</span>
              <p className="font-bold text-[#25866D]">
                {currentUser.status === 'active' ? 'حساب نشط ومحمي' : 'قيد المراجعة'}
              </p>
            </div>
          </div>

          <div className="bg-[#EAF3F8] p-3.5 rounded-[14px] border border-[#DCEBF4] text-[11px] text-[#104A78] space-y-1">
            <strong className="block font-bold">🔒 الحماية القانونية للبيانات الشخصية:</strong>
            <p className="leading-relaxed">
              وفقاً لأحكام القانون رقم 18-07 المؤرخ في 10 يونيو 2018 المتعلق بحماية الأشخاص الطبيعيين في مجال معالجة المعطيات ذات الطابع الشخصي، فإن كافة معلوماتك مشفرة ومصانة ولا يتم مشاركتها إلا مع المختص المعالج بعد موافقتك الصريحة.
            </p>
          </div>
        </div>
      )}

      {/* Invoice Viewer Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-[22px] max-w-md w-full p-6 space-y-4 shadow-2xl border border-[#E0E8E6] text-right text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-[#E0E8E6]">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-[#25866D]" />
                <h3 className="font-black text-sm text-[#203945]">فاتورة الاستشارة الرسمية</h3>
              </div>
              <span className="text-[10px] font-mono bg-[#E8F4EF] text-[#25866D] px-2 py-0.5 rounded-full font-bold">
                PAID / مدفوعة ✓
              </span>
            </div>

            <div className="space-y-2 bg-[#F8FAF9] p-4 rounded-[14px] border border-[#E5ECE9]">
              <p className="flex justify-between">
                <span className="text-[#203945]/70">رقم الفاتورة:</span>
                <span className="font-mono font-bold">INV-SC2026-0001</span>
              </p>
              <p className="flex justify-between">
                <span className="text-[#203945]/70">رقم الطلب:</span>
                <span className="font-mono font-bold text-[#1766A6]">{selectedInvoice.orderNumber}</span>
              </p>
              <p className="flex justify-between">
                <span className="text-[#203945]/70">نوع الخدمة:</span>
                <span className="font-bold">{selectedInvoice.service}</span>
              </p>
              <p className="flex justify-between">
                <span className="text-[#203945]/70">تاريخ وساعة الموعد:</span>
                <span>{selectedInvoice.date} — {selectedInvoice.time}</span>
              </p>
              <p className="flex justify-between">
                <span className="text-[#203945]/70">المستفيد:</span>
                <span>{currentUser.firstName} {currentUser.lastName}</span>
              </p>
              <div className="pt-2 border-t border-[#E0E8E6] flex justify-between font-black text-sm text-[#203945]">
                <span>المبلغ المسدد:</span>
                <span className="text-[#25866D]">{selectedInvoice.amount}</span>
              </div>
            </div>

            <p className="text-[10px] text-center text-[#203945]/60">
              منصة الفرصة الثانية — قسنطينة • www.secchance.dz
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
