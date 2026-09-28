import React, { useState } from 'react';
import {
  User,
  CareRequest,
  PaymentTransaction,
  Priority,
  LegalTopic,
  CaseFileDocument,
  AuditLogEntry,
  UserComplaint,
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
  MessageSquareWarning,
  History,
  Eye,
  EyeOff,
} from 'lucide-react';
import {
  initialUsers,
  initialLegalTopics,
  initialCaseDocuments,
  initialAuditLogs,
  initialComplaints,
} from '../data/initialData';

interface PortalViewProps {
  currentUser: User;
  requests: CareRequest[];
  transactions: PaymentTransaction[];
  onSelectRequest: (request: CareRequest) => void;
  onStartPayment: (request: CareRequest) => void;
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
  onSelectRequest,
  onStartPayment,
  onNewRequest,
  onAcceptRequest,
  onRejectRequestClick,
  onLogout,
}) => {
  const [providerTab, setProviderTab] = useState<'waiting' | 'active'>('waiting');
  const [adminTab, setAdminTab] = useState<
    'requests' | 'payments' | 'legal-content' | 'documents' | 'audit-logs' | 'complaints'
  >('requests');

  // Legal Content Management State (Requirement 23)
  const [legalTopics, setLegalTopics] = useState<LegalTopic[]>(initialLegalTopics);
  const [isAddingTopic, setIsAddingTopic] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newLawRef, setNewLawRef] = useState('');
  const [newArticle, setNewArticle] = useState('');
  const [newOfficialText, setNewOfficialText] = useState('');
  const [newPlainExplanation, setNewPlainExplanation] = useState('');
  const [newSource, setNewSource] = useState('الجريدة الرسمية للجمهورية الجزائرية');

  // Documents State (Requirement 21)
  const [caseDocuments] = useState<CaseFileDocument[]>(initialCaseDocuments);

  // Complaints State
  const [complaints] = useState<UserComplaint[]>(initialComplaints);

  // Audit Logs State (Requirement 20)
  const [auditLogs] = useState<AuditLogEntry[]>(initialAuditLogs);

  const getRoleTitle = (slug: string) => {
    switch (slug) {
      case 'family':
        return 'ولي أمر / باحث عن مرافقة وخدمات';
      case 'patient':
        return 'مستفيد / متعافٍ';
      case 'psychologist':
        return 'أخصائي نفسي عيادي معتمد';
      case 'lawyer':
        return 'مستشار قانوني ومحامٍ معتمد';
      case 'treatment_center':
        return 'مركز علاج الإدمان الاستشفائي';
      case 'clinic':
        return 'العيادة الطبية المتخصصة الشفاء';
      case 'association':
        return 'جمعية خيرية ومرافقة اجتماعية';
      case 'admin':
        return 'الإدارة العامة للمنصة والرقابة المركزية';
      default:
        return 'مستخدم مسجل';
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

  const getStatusText = (status: string) => {
    switch (status) {
      case 'NEW':
      case 'PENDING_PROVIDER':
        return 'في انتظار مقدم الخدمة';
      case 'ACCEPTED':
      case 'WAITING_PAYMENT':
        return 'مقبول - بانتظار الدفع';
      case 'PAID':
      case 'APPOINTMENT_CONFIRMED':
        return 'مدفوع وموعد مؤكد';
      case 'IN_PROGRESS':
        return 'المتابعة جارية';
      case 'COMPLETED':
        return 'مكتملة';
      case 'REJECTED':
        return 'مرفوض';
      default:
        return status;
    }
  };

  const handleAddLegalTopic = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newLawRef.trim()) return;

    const newTopicItem: LegalTopic = {
      id: Date.now(),
      title: newTitle.trim(),
      plainSummary: newPlainExplanation.slice(0, 120) + '...',
      legalReference: newLawRef.trim(),
      lawDate: '2026',
      relevantArticle: newArticle.trim() || 'المادة المعتمدة',
      officialText: newOfficialText.trim() || 'النص الرسمي المعتمد في الجريدة الرسمية',
      amendments: ['تعديل منشور ومحدث في المنصة'],
      plainExplanation: newPlainExplanation.trim(),
      executiveDecree: 'المرسوم التنفيذي رقم 07-229 والمقررات التطبيقية',
      officialSource: newSource.trim(),
      lastReviewedDate: new Date().toISOString().split('T')[0],
      status: 'ACTIVE',
    };

    setLegalTopics([newTopicItem, ...legalTopics]);
    setIsAddingTopic(false);
    setNewTitle('');
    setNewLawRef('');
    setNewArticle('');
    setNewOfficialText('');
    setNewPlainExplanation('');
  };

  const toggleTopicStatus = (id: number) => {
    setLegalTopics(
      legalTopics.map((t) =>
        t.id === id ? { ...t, status: t.status === 'ACTIVE' ? 'ARCHIVED' : 'ACTIVE' } : t
      )
    );
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* Profile Header with Logo */}
      <div className="bg-[#FBFDFC] rounded-[20px] p-5 border border-[#E5ECE9] shadow-xs flex items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <img
            src="/logo.png"
            alt="Logo"
            className="w-13 h-13 object-contain rounded-full border border-[#DCEBF4] bg-white p-1 shrink-0"
          />
          <div>
            <h2 className="font-black text-[18px] text-[#203945]">
              {currentUser.firstName} {currentUser.lastName}
            </h2>
            <p className="text-[12px] font-semibold text-[#1766A6]">
              {getRoleTitle(currentUser.roleSlug)}
            </p>
            <p className="text-[11px] text-[#203945]/60">
              الولاية: {currentUser.wilayaName || 'الجزائر العاصمة'}
            </p>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="p-2.5 rounded-xl text-[#A64842] hover:bg-[#FBECEB] transition-colors"
          title="خروج"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>

      {/* ROLE 1: FAMILY / PATIENT */}
      {(currentUser.roleSlug === 'family' || currentUser.roleSlug === 'patient') && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-[16px] font-bold text-[#203945]">
              طلباتي ومتابعاتي (My Requests)
            </h3>
            <button
              onClick={onNewRequest}
              className="flex items-center gap-1 px-3 py-1.5 rounded-[10px] bg-[#1766A6] text-white text-[11px] font-bold shadow-xs transition-colors hover:bg-[#125386]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>طلب خدمة أو استشارة</span>
            </button>
          </div>

          {requests.filter((r) => r.clientId === currentUser.id).length === 0 ? (
            <div className="bg-[#FBFDFC] rounded-[16px] border border-[#E5ECE9] p-7 text-center space-y-2">
              <FolderOpen className="w-9 h-9 text-[#1766A6] mx-auto" />
              <p className="font-bold text-sm text-[#203945]">ليس لديك أي طلبات حالية</p>
              <button
                onClick={onNewRequest}
                className="px-4 py-2 rounded-xl bg-[#1766A6] text-white text-xs font-bold shadow-xs"
              >
                ابدأ بطلب استشارة أو خدمة
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {requests
                .filter((r) => r.clientId === currentUser.id)
                .map((req) => {
                  const canPay =
                    (req.status === 'ACCEPTED' || req.status === 'WAITING_PAYMENT') &&
                    req.paymentStatus === 'PENDING';

                  return (
                    <div
                      key={req.id}
                      onClick={() => onSelectRequest(req)}
                      className="bg-[#FBFDFC] rounded-[16px] border border-[#E5ECE9] p-4 shadow-xs hover:border-[#1766A6]/40 cursor-pointer transition-all space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[11px] text-[#1766A6]">
                          {req.caseNumber}
                        </span>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-[8px] ${
                            req.priority === 'Critical' || req.priority === 'High'
                              ? 'bg-[#FBECEB] text-[#5F1D1A]'
                              : 'bg-[#E8F4EF] text-[#1A5E4D]'
                          }`}
                        >
                          الأولوية: {getPriorityText(req.priority)}
                        </span>
                      </div>

                      <h4 className="font-bold text-[15px] text-[#203945]">
                        {req.serviceTitle}
                      </h4>

                      <p className="text-[12px] text-[#203945]/70">
                        مقدم الخدمة: {req.providerName} | الولاية: {req.wilayaName}
                      </p>

                      <div className="flex items-center justify-between pt-1">
                        <span
                          className={`text-[11px] font-bold px-2 py-1 rounded-[8px] ${
                            req.status === 'ACCEPTED' || req.status === 'WAITING_PAYMENT'
                              ? 'bg-[#EAF3F8] text-[#104A78]'
                              : req.status === 'PAID' || req.status === 'APPOINTMENT_CONFIRMED'
                              ? 'bg-[#E8F4EF] text-[#1A5E4D]'
                              : req.status === 'REJECTED'
                              ? 'bg-[#FBECEB] text-[#5F1D1A]'
                              : 'bg-[#E5ECE9] text-[#203945]'
                          }`}
                        >
                          الحالة: {getStatusText(req.status)}
                        </span>

                        <span className="font-black text-[14px] text-[#25866D]">
                          {req.amountDzd.toLocaleString()} دج
                        </span>
                      </div>

                      {canPay && (
                        <div className="pt-1.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => onStartPayment(req)}
                            className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-[10px] bg-[#25866D] hover:bg-[#1e6c58] text-white font-bold text-[12px] shadow-xs transition-colors"
                          >
                            <CreditCard className="w-4 h-4" />
                            <span>الدفع الآن (البطاقة الذهبية / CIB)</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* ROLE 2: PROVIDERS */}
      {currentUser.roleSlug in
        { psychologist: 1, lawyer: 1, treatment_center: 1, clinic: 1, association: 1 } && (
        <div className="space-y-3">
          {/* Tabs */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setProviderTab('waiting')}
              className={`py-2 px-3 rounded-[10px] text-[11px] font-bold transition-colors ${
                providerTab === 'waiting'
                  ? 'bg-[#1766A6] text-white shadow-xs'
                  : 'bg-[#E5ECE9] text-[#203945] hover:bg-[#d8e1de]'
              }`}
            >
              الطلبات في انتظارك (
              {
                requests.filter(
                  (r) =>
                    r.providerId === currentUser.id &&
                    (r.status === 'PENDING_PROVIDER' || r.status === 'NEW')
                ).length
              }
              )
            </button>
            <button
              onClick={() => setProviderTab('active')}
              className={`py-2 px-3 rounded-[10px] text-[11px] font-bold transition-colors ${
                providerTab === 'active'
                  ? 'bg-[#1766A6] text-white shadow-xs'
                  : 'bg-[#E5ECE9] text-[#203945] hover:bg-[#d8e1de]'
              }`}
            >
              الحالات الجارية (
              {
                requests.filter(
                  (r) =>
                    r.providerId === currentUser.id &&
                    r.status !== 'PENDING_PROVIDER' &&
                    r.status !== 'NEW' &&
                    r.status !== 'REJECTED'
                ).length
              }
              )
            </button>
          </div>

          {providerTab === 'waiting' ? (
            <div className="space-y-3">
              <h3 className="text-[15px] font-bold text-[#A64842]">
                الطلبات في انتظارك
              </h3>

              {requests.filter(
                (r) =>
                  r.providerId === currentUser.id &&
                  (r.status === 'PENDING_PROVIDER' || r.status === 'NEW')
              ).length === 0 ? (
                <p className="text-[12px] text-[#203945]/60 py-4 text-center">
                  لا توجد طلبات جديدة في الانتظار حالياً.
                </p>
              ) : (
                requests
                  .filter(
                    (r) =>
                      r.providerId === currentUser.id &&
                      (r.status === 'PENDING_PROVIDER' || r.status === 'NEW')
                  )
                  .map((req) => (
                    <div
                      key={req.id}
                      className="bg-[#FBFDFC] rounded-[16px] border border-[#E5ECE9] p-4 shadow-xs space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[11px] text-[#1766A6]">
                          {req.caseNumber}
                        </span>
                        <span className="font-bold text-[12px] text-[#203945]">
                          العميل: {req.clientName}
                        </span>
                      </div>

                      <h4 className="font-bold text-[15px] text-[#203945]">
                        {req.serviceTitle}
                      </h4>

                      <p className="text-[12px] text-[#203945]/80 line-clamp-2 leading-relaxed">
                        {req.description}
                      </p>

                      <div className="flex items-center gap-2 pt-2 border-t border-[#E5ECE9]">
                        <button
                          onClick={() => onAcceptRequest(req.id, req.priority)}
                          className="flex-1 flex items-center justify-center gap-1 py-2 px-3 rounded-[10px] bg-[#1766A6] text-white font-bold text-[12px] hover:bg-[#125386] transition-colors"
                        >
                          <Check className="w-4 h-4" />
                          <span>قبول الطلب</span>
                        </button>
                        <button
                          onClick={() => onRejectRequestClick(req.id)}
                          className="flex-1 flex items-center justify-center gap-1 py-2 px-3 rounded-[10px] border border-[#A64842] text-[#A64842] hover:bg-[#FBECEB] font-bold text-[12px] transition-colors"
                        >
                          <X className="w-4 h-4" />
                          <span>رفض مع السبب</span>
                        </button>
                      </div>
                    </div>
                  ))
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <h3 className="text-[15px] font-bold text-[#203945]">
                الحالات والمتابعات المقبولة والجارية
              </h3>

              {requests
                .filter(
                  (r) =>
                    r.providerId === currentUser.id &&
                    r.status !== 'PENDING_PROVIDER' &&
                    r.status !== 'NEW' &&
                    r.status !== 'REJECTED'
                )
                .map((req) => (
                  <div
                    key={req.id}
                    onClick={() => onSelectRequest(req)}
                    className="bg-[#FBFDFC] rounded-[16px] border border-[#E5ECE9] p-4 shadow-xs hover:border-[#1766A6]/40 cursor-pointer transition-all space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[11px] text-[#1766A6]">
                        {req.caseNumber}
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-[8px] bg-[#EAF3F8] text-[#104A78]">
                        {req.status}
                      </span>
                    </div>
                    <h4 className="font-bold text-[14px] text-[#203945]">
                      {req.serviceTitle}
                    </h4>
                    <p className="text-[12px] text-[#203945]/70">
                      العميل: {req.clientName} | الموعد: {req.appointmentDate || 'لم يحدد بعد'}
                    </p>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* ROLE 3: ADMIN (Comprehensive Control Center) */}
      {currentUser.roleSlug === 'admin' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[18px] font-black text-[#203945]">
              لوحة الإدارة والتحكم الشامل 🛡️
            </h3>
            <span className="text-xs bg-[#EAF3F8] text-[#104A78] px-2.5 py-1 rounded-[8px] font-bold">
              صلاحيات المدير الكاملة (Super Admin)
            </span>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="bg-[#FBFDFC] p-3 rounded-[14px] border border-[#E5ECE9] text-center shadow-xs">
              <span className="text-[10px] text-[#203945]/70 block font-semibold">إجمالي المستخدمين</span>
              <span className="text-[16px] font-black text-[#1766A6]">{initialUsers.length}</span>
            </div>
            <div className="bg-[#FBFDFC] p-3 rounded-[14px] border border-[#E5ECE9] text-center shadow-xs">
              <span className="text-[10px] text-[#203945]/70 block font-semibold">الطلبات المسجلة</span>
              <span className="text-[16px] font-black text-[#1766A6]">{requests.length}</span>
            </div>
            <div className="bg-[#FBFDFC] p-3 rounded-[14px] border border-[#E5ECE9] text-center shadow-xs">
              <span className="text-[10px] text-[#203945]/70 block font-semibold">المدفوعات الإلكترونية</span>
              <span className="text-[16px] font-black text-[#1766A6]">{transactions.length}</span>
            </div>
            <div className="bg-[#FBFDFC] p-3 rounded-[14px] border border-[#E5ECE9] text-center shadow-xs">
              <span className="text-[10px] text-[#203945]/70 block font-semibold">إجمالي الإيرادات</span>
              <span className="text-[15px] font-black text-[#25866D]">
                {transactions
                  .filter((t) => t.status === 'SUCCESSFUL')
                  .reduce((acc, curr) => acc + curr.amountDzd, 0)
                  .toLocaleString()}{' '}
                دج
              </span>
            </div>
          </div>

          {/* Admin Navigation Tabs (Requirement 22) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-[#E5ECE9] text-xs font-bold no-scrollbar">
            <button
              onClick={() => setAdminTab('requests')}
              className={`py-2 px-3 rounded-[8px] shrink-0 transition-colors ${
                adminTab === 'requests' ? 'bg-[#1766A6] text-white shadow-xs' : 'bg-[#E5ECE9] text-[#203945]'
              }`}
            >
              الطلبات ({requests.length})
            </button>
            <button
              onClick={() => setAdminTab('payments')}
              className={`py-2 px-3 rounded-[8px] shrink-0 transition-colors ${
                adminTab === 'payments' ? 'bg-[#1766A6] text-white shadow-xs' : 'bg-[#E5ECE9] text-[#203945]'
              }`}
            >
              المدفوعات ({transactions.length})
            </button>
            <button
              onClick={() => setAdminTab('legal-content')}
              className={`py-2 px-3 rounded-[8px] shrink-0 transition-colors flex items-center gap-1 ${
                adminTab === 'legal-content' ? 'bg-[#1766A6] text-white shadow-xs' : 'bg-[#E5ECE9] text-[#203945]'
              }`}
            >
              <Scale className="w-3.5 h-3.5" />
              <span>إدارة المحتوى القانوني ({legalTopics.length})</span>
            </button>
            <button
              onClick={() => setAdminTab('documents')}
              className={`py-2 px-3 rounded-[8px] shrink-0 transition-colors flex items-center gap-1 ${
                adminTab === 'documents' ? 'bg-[#1766A6] text-white shadow-xs' : 'bg-[#E5ECE9] text-[#203945]'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>الملفات المحمية ({caseDocuments.length})</span>
            </button>
            <button
              onClick={() => setAdminTab('audit-logs')}
              className={`py-2 px-3 rounded-[8px] shrink-0 transition-colors flex items-center gap-1 ${
                adminTab === 'audit-logs' ? 'bg-[#1766A6] text-white shadow-xs' : 'bg-[#E5ECE9] text-[#203945]'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Audit Logs ({auditLogs.length})</span>
            </button>
            <button
              onClick={() => setAdminTab('complaints')}
              className={`py-2 px-3 rounded-[8px] shrink-0 transition-colors flex items-center gap-1 ${
                adminTab === 'complaints' ? 'bg-[#1766A6] text-white shadow-xs' : 'bg-[#E5ECE9] text-[#203945]'
              }`}
            >
              <MessageSquareWarning className="w-3.5 h-3.5" />
              <span>الشكاوى ({complaints.length})</span>
            </button>
          </div>

          {/* TAB 1: REQUESTS */}
          {adminTab === 'requests' && (
            <div className="space-y-2">
              <h4 className="text-[14px] font-bold text-[#203945]">جميع طلبات المنصة والحالات</h4>
              {requests.map((req) => (
                <div
                  key={req.id}
                  onClick={() => onSelectRequest(req)}
                  className="bg-[#FBFDFC] p-3 rounded-[14px] border border-[#E5ECE9] cursor-pointer space-y-1 shadow-xs hover:border-[#1766A6]/40 transition-colors"
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-[#1766A6]">{req.caseNumber}</span>
                    <span className="text-[#203945] font-semibold">{req.status}</span>
                  </div>
                  <p className="font-bold text-[13px] text-[#203945]">{req.serviceTitle}</p>
                  <p className="text-[11px] text-[#203945]/70">
                    العميل: {req.clientName} | مقدم الخدمة: {req.providerName}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* TAB 2: PAYMENTS */}
          {adminTab === 'payments' && (
            <div className="space-y-2">
              <h4 className="text-[14px] font-bold text-[#203945]">سجل العمليات والمدفوعات الإلكترونية</h4>
              {transactions.map((txn) => (
                <div
                  key={txn.id}
                  className="bg-[#FBFDFC] p-3.5 rounded-[14px] border border-[#E5ECE9] space-y-1.5 shadow-xs"
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-[#1766A6]">{txn.paymentId}</span>
                    <span className="bg-[#E8F4EF] text-[#1A5E4D] px-2 py-0.5 rounded-[6px] font-bold text-[10px]">
                      {txn.status}
                    </span>
                  </div>
                  <p className="text-[12px] font-semibold text-[#203945]">{txn.serviceTitle}</p>
                  <p className="text-[11px] text-[#203945]/70">
                    العميل: {txn.clientName} | مقدم الخدمة: {txn.providerName}
                  </p>
                  <div className="flex items-center justify-between text-[11px] pt-1">
                    <span className="font-bold text-[#25866D]">
                      المبلغ: {txn.amountDzd.toLocaleString()} دج ({txn.paymentMethod})
                    </span>
                    <span className="text-[#203945]/50 text-[10px]">{txn.createdAt}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: LEGAL CONTENT MANAGEMENT (Requirement 23) */}
          {adminTab === 'legal-content' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-[14px] font-bold text-[#203945]">
                    ⚖️ إدارة المحتوى والمصادر القانونية
                  </h4>
                  <p className="text-[11px] text-[#203945]/70">
                    التحكم في القوانين والمواد والشروحات مع الاحتفاظ بنسخ الإصدارات وتاريخ التحقق
                  </p>
                </div>
                <button
                  onClick={() => setIsAddingTopic(!isAddingTopic)}
                  className="px-3 py-1.5 rounded-[8px] bg-[#1766A6] text-white text-xs font-bold shadow-xs hover:bg-[#125386] transition-colors"
                >
                  {isAddingTopic ? 'إلغاء' : '+ إضافة مادة / قانون'}
                </button>
              </div>

              {/* Add Legal Topic Form */}
              {isAddingTopic && (
                <form
                  onSubmit={handleAddLegalTopic}
                  className="bg-[#EAF3F8] p-4 rounded-[16px] border border-[#DCEBF4] space-y-3 shadow-xs"
                >
                  <h5 className="font-bold text-xs text-[#1766A6]">
                    إضافة نص أو مادة قانونية موثقة
                  </h5>
                  <div className="space-y-2">
                    <input
                      required
                      type="text"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="عنوان الموضوع القانوني (مثال: شروط الإعفاء من المتابعة)..."
                      className="w-full p-2 text-xs bg-white border border-[#CCD8D5] rounded-[8px]"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        required
                        type="text"
                        value={newLawRef}
                        onChange={(e) => setNewLawRef(e.target.value)}
                        placeholder="المرجع القانوني (مثال: القانون 04-18)..."
                        className="w-full p-2 text-xs bg-white border border-[#CCD8D5] rounded-[8px]"
                      />
                      <input
                        required
                        type="text"
                        value={newArticle}
                        onChange={(e) => setNewArticle(e.target.value)}
                        placeholder="المادة ذات الصلة (مثال: المادة 6)..."
                        className="w-full p-2 text-xs bg-white border border-[#CCD8D5] rounded-[8px]"
                      />
                    </div>
                    <textarea
                      required
                      value={newOfficialText}
                      onChange={(e) => setNewOfficialText(e.target.value)}
                      placeholder="النص الرسمي الكامل للمادة..."
                      rows={2}
                      className="w-full p-2 text-xs bg-white border border-[#CCD8D5] rounded-[8px]"
                    />
                    <textarea
                      required
                      value={newPlainExplanation}
                      onChange={(e) => setNewPlainExplanation(e.target.value)}
                      placeholder="الشرح الإجرائي المبسط للمواطن..."
                      rows={2}
                      className="w-full p-2 text-xs bg-white border border-[#CCD8D5] rounded-[8px]"
                    />
                    <input
                      type="text"
                      value={newSource}
                      onChange={(e) => setNewSource(e.target.value)}
                      placeholder="المصدر الرسمي (الجريدة الرسمية)..."
                      className="w-full p-2 text-xs bg-white border border-[#CCD8D5] rounded-[8px]"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2 rounded-[8px] bg-[#1766A6] text-white text-xs font-bold hover:bg-[#125386] transition-colors"
                  >
                    حفظ ونشر المادة القانونية في المنصة
                  </button>
                </form>
              )}

              {/* Legal Topics List */}
              <div className="space-y-2">
                {legalTopics.map((topic) => (
                  <div
                    key={topic.id}
                    className="bg-[#FBFDFC] p-3.5 rounded-[14px] border border-[#E5ECE9] space-y-2 shadow-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-[#1766A6]">{topic.relevantArticle}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-[#203945]/60">
                          آخر مراجعة: {topic.lastReviewedDate}
                        </span>
                        <button
                          onClick={() => toggleTopicStatus(topic.id)}
                          className={`p-1 rounded text-xs flex items-center gap-1 font-bold ${
                            topic.status === 'ACTIVE'
                              ? 'text-[#25866D] bg-[#E8F4EF]'
                              : 'text-[#A64842] bg-[#FBECEB]'
                          }`}
                          title="نشر أو إخفاء المحتوى"
                        >
                          {topic.status === 'ACTIVE' ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                          <span>{topic.status === 'ACTIVE' ? 'منشور' : 'مخفي'}</span>
                        </button>
                      </div>
                    </div>
                    <h5 className="font-bold text-sm text-[#203945]">{topic.title}</h5>
                    <p className="text-xs text-[#203945]/80 italic border-r-2 border-[#1766A6] pr-2">
                      {topic.officialText}
                    </p>
                    <p className="text-[11px] text-[#203945]/70">
                      المصدر: {topic.officialSource}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: PROTECTED DOCUMENTS (Requirement 21) */}
          {adminTab === 'documents' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-[14px] font-bold text-[#203945]">
                    🔒 إدارة الملفات والوثائق السرية المحمية
                  </h4>
                  <p className="text-[11px] text-[#203945]/70">
                    ملفات القضايا والتقارير الطبية المحجوبة عن البحث العام والمحمية بنظام RBAC
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                {caseDocuments.map((doc) => (
                  <div
                    key={doc.id}
                    className="bg-[#FBFDFC] p-3.5 rounded-[14px] border border-[#E5ECE9] space-y-1.5 shadow-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Lock className="w-4 h-4 text-[#1766A6]" />
                        <span className="font-bold text-xs text-[#203945]">{doc.fileName}</span>
                      </div>
                      <span className="text-[10px] bg-[#EAF3F8] text-[#104A78] px-2 py-0.5 rounded-[6px] font-bold">
                        {doc.fileCategory}
                      </span>
                    </div>

                    <p className="text-[11px] text-[#203945]/70">
                      الحالة: {doc.caseNumber} • العميل: {doc.clientName} • مقدم الخدمة: {doc.providerName}
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-[#203945]/60 pt-1 border-t border-[#E5ECE9]">
                      <span>الحجم: {doc.fileSize} • تاريخ الرفع: {doc.uploadDate}</span>
                      <span className="font-bold text-[#1766A6]">
                        🔒 هذا المستند خاص ولا يمكن الوصول إليه إلا من المستخدم والجهة المخولة.
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: AUDIT LOGS (Requirement 20) */}
          {adminTab === 'audit-logs' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-[14px] font-bold text-[#203945]">
                    🛡️ سجل العمليات والرقابة الأمنية (Audit Logs)
                  </h4>
                  <p className="text-[11px] text-[#203945]/70">
                    تسجيل غير قابل للتعديل لكافة عمليات الدخول، الوصول للملفات السرية، وتحديث التقارير
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                {auditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="bg-[#FBFDFC] p-3 rounded-[12px] border border-[#E5ECE9] space-y-1 text-xs shadow-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#1766A6]">{log.action}</span>
                      <span className="text-[10px] text-[#203945]/60">{log.timestamp}</span>
                    </div>
                    <p className="text-[11px] text-[#203945] font-medium">{log.details}</p>
                    <div className="flex items-center justify-between text-[10px] text-[#203945]/50 pt-1">
                      <span>المستخدم: {log.userName} (ID: {log.userId})</span>
                      <span dir="ltr">IP: {log.ipAddress}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: COMPLAINTS */}
          {adminTab === 'complaints' && (
            <div className="space-y-3">
              <h4 className="text-[14px] font-bold text-[#203945]">إدارة الشكاوى والاستفسارات</h4>
              <div className="space-y-2">
                {complaints.map((c) => (
                  <div
                    key={c.id}
                    className="bg-[#FBFDFC] p-3.5 rounded-[14px] border border-[#E5ECE9] space-y-1 shadow-xs"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[#203945]">{c.subject}</span>
                      <span className="bg-[#FFF3E0] text-[#E65100] px-2 py-0.5 rounded text-[10px] font-bold">
                        {c.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#203945]/80">{c.description}</p>
                    <div className="flex items-center justify-between text-[10px] text-[#203945]/50 pt-1">
                      <span>المرسل: {c.userName}</span>
                      <span>{c.createdAt}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
