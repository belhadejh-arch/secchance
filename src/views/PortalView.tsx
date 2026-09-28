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
  // Family & Beneficiary sub-tabs (Requirement: طلباتي، مواعيدي، الحالات الجارية، الرسائل، الإشعارات، إيداع الملفات، التقارير المعتمدة، ملفي الشخصي)
  const [beneficiaryTab, setBeneficiaryTab] = useState<
    'requests' | 'appointments' | 'cases' | 'messages' | 'notifications' | 'files' | 'reports' | 'profile'
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

  const handleUploadDoc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocName.trim()) return;

    const newDoc: CaseFileDocument = {
      id: Date.now(),
      caseNumber: myRequests[0]?.caseNumber || 'SC-2026-DOC',
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

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
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
              {currentUser.firstName} {currentUser.lastName}
            </h2>
            <p className="text-xs text-[#203945]/70">
              البريد: {currentUser.email} • الولاية: {currentUser.wilayaName || 'الجزائر العاصمة'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onNewRequest}
            className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-[12px] bg-[#1766A6] hover:bg-[#125386] text-white text-xs font-bold shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>طلب جديد</span>
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

      {/* Sub Navigation Tabs (Requirement: طلباتي، مواعيدي، الحالات الجارية، الرسائل، الإشعارات، ملفي الشخصي، التقارير) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 no-scrollbar text-xs font-bold border-b border-[#E0E8E6]">
        <button
          onClick={() => setBeneficiaryTab('requests')}
          className={`px-3.5 py-2 rounded-[10px] transition-colors shrink-0 flex items-center gap-1.5 ${
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
          className={`px-3.5 py-2 rounded-[10px] transition-colors shrink-0 flex items-center gap-1.5 ${
            beneficiaryTab === 'appointments'
              ? 'bg-[#1766A6] text-white shadow-xs'
              : 'bg-[#FBFDFC] text-[#203945]/70 hover:bg-[#EAF3F8]'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>مواعيدي ({myAppointments.length})</span>
        </button>

        <button
          onClick={() => setBeneficiaryTab('cases')}
          className={`px-3.5 py-2 rounded-[10px] transition-colors shrink-0 flex items-center gap-1.5 ${
            beneficiaryTab === 'cases'
              ? 'bg-[#1766A6] text-white shadow-xs'
              : 'bg-[#FBFDFC] text-[#203945]/70 hover:bg-[#EAF3F8]'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>الحالات الجارية ({myActiveCases.length})</span>
        </button>

        <button
          onClick={() => setBeneficiaryTab('messages')}
          className={`px-3.5 py-2 rounded-[10px] transition-colors shrink-0 flex items-center gap-1.5 ${
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
          className={`px-3.5 py-2 rounded-[10px] transition-colors shrink-0 flex items-center gap-1.5 ${
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
          className={`px-3.5 py-2 rounded-[10px] transition-colors shrink-0 flex items-center gap-1.5 ${
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
          className={`px-3.5 py-2 rounded-[10px] transition-colors shrink-0 flex items-center gap-1.5 ${
            beneficiaryTab === 'reports'
              ? 'bg-[#1766A6] text-white shadow-xs'
              : 'bg-[#FBFDFC] text-[#203945]/70 hover:bg-[#EAF3F8]'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>التقارير المعتمدة ({permittedReports.length})</span>
        </button>

        <button
          onClick={() => setBeneficiaryTab('profile')}
          className={`px-3.5 py-2 rounded-[10px] transition-colors shrink-0 flex items-center gap-1.5 ${
            beneficiaryTab === 'profile'
              ? 'bg-[#1766A6] text-white shadow-xs'
              : 'bg-[#FBFDFC] text-[#203945]/70 hover:bg-[#EAF3F8]'
          }`}
        >
          <UserIcon className="w-3.5 h-3.5" />
          <span>ملفي الشخصي</span>
        </button>
      </div>

      {/* 1. TAB: REQUESTS (الطلبات) */}
      {beneficiaryTab === 'requests' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#203945]">سجل الطلبات والاستشارات</h3>
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
                  onClick={() => onSelectRequest(req)}
                  className="bg-[#FBFDFC] rounded-[18px] border border-[#E0E8E6] p-4 sm:p-5 shadow-xs hover:border-[#1766A6] cursor-pointer transition-all space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-xs text-[#1766A6]">{req.caseNumber}</span>
                    <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-[#EAF3F8] text-[#1766A6]">
                      {getPriorityText(req.priority)}
                    </span>
                  </div>

                  <h4 className="font-bold text-sm text-[#203945]">{req.serviceTitle}</h4>
                  <p className="text-xs text-[#203945]/70">
                    مقدم الخدمة: {req.providerName} • الولاية: {req.wilayaName}
                  </p>

                  <div className="flex items-center justify-between pt-1">
                    <span
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-[8px] ${
                        req.status === 'ACCEPTED' || req.status === 'WAITING_PAYMENT'
                          ? 'bg-[#EAF3F8] text-[#104A78]'
                          : req.status === 'PAID' || req.status === 'APPOINTMENT_CONFIRMED' || req.status === 'COMPLETED'
                          ? 'bg-[#E8F4EF] text-[#25866D]'
                          : req.status === 'REJECTED'
                          ? 'bg-[#FBECEB] text-[#A64842]'
                          : 'bg-[#E5ECE9] text-[#203945]'
                      }`}
                    >
                      {getStatusText(req.status)}
                    </span>

                    <span className="font-black text-sm text-[#25866D]">
                      {req.amountDzd.toLocaleString()} دج
                    </span>
                  </div>

                  {req.rejectionReason && (
                    <div className="bg-[#FBECEB] p-2.5 rounded-[10px] text-xs text-[#5F1D1A]">
                      <strong>سبب الرفض:</strong> {req.rejectionReason}
                    </div>
                  )}

                  {canPay && (
                    <div className="pt-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => onStartPayment(req)}
                        className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-[10px] bg-[#25866D] hover:bg-[#1E6F5A] text-white font-bold text-xs shadow-xs transition-colors"
                      >
                        <CreditCard className="w-4 h-4" />
                        <span>الدفع بالبطاقة الذهبية / CIB لتأكيد الموعد</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* 2. TAB: APPOINTMENTS (المواعيد) */}
      {beneficiaryTab === 'appointments' && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-[#203945]">مواعيد الجلسات المؤكدة والقادمة</h3>
          {myAppointments.length === 0 ? (
            <div className="bg-[#FBFDFC] border border-[#E0E8E6] rounded-[18px] p-8 text-center text-xs text-[#203945]/70">
              لا توجد مواعيد مجدولة حالياً. يتم تحديد الموعد فور قبول ومتابعة الطلب.
            </div>
          ) : (
            myAppointments.map((appt) => (
              <div
                key={appt.id}
                className="bg-[#FBFDFC] border border-[#E0E8E6] rounded-[16px] p-4 shadow-xs flex items-center justify-between text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-[#1766A6]">{appt.caseNumber}</span>
                    <span className="font-bold text-[#203945]">{appt.specialty}</span>
                  </div>
                  <p className="text-[#203945]/70">
                    المختص: {appt.specialistName} • التاريخ: {appt.date} • الوقت: {appt.time}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full font-bold ${
                    appt.status === 'CONFIRMED'
                      ? 'bg-[#E8F4EF] text-[#25866D]'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {appt.status}
                </span>
              </div>
            ))
          )}
        </div>
      )}

      {/* 3. TAB: ACTIVE CASES (الحالات) */}
      {beneficiaryTab === 'cases' && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-[#203945]">الحالات قيد المتابعة النشطة</h3>
          {myActiveCases.length === 0 ? (
            <div className="bg-[#FBFDFC] border border-[#E0E8E6] rounded-[18px] p-8 text-center text-xs text-[#203945]/70">
              لا توجد حالات جارية حالياً.
            </div>
          ) : (
            myActiveCases.map((c) => (
              <div
                key={c.id}
                onClick={() => onSelectRequest(c)}
                className="bg-[#FBFDFC] border border-[#E0E8E6] rounded-[18px] p-5 shadow-xs space-y-2 text-xs cursor-pointer hover:border-[#1766A6]"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-[#1766A6]">{c.caseNumber}</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#EAF3F8] text-[#1766A6] font-bold">
                    {c.status}
                  </span>
                </div>
                <h4 className="font-bold text-sm text-[#203945]">{c.serviceTitle}</h4>
                <p className="text-[#203945]/70">المشرف: {c.providerName} • الولاية: {c.wilayaName}</p>
                <p className="bg-[#F3F7F6] p-2.5 rounded-[10px] text-[#203945]/80">{c.description}</p>
              </div>
            ))
          )}
        </div>
      )}

      {/* 4. TAB: MESSAGES (الرسائل) */}
      {beneficiaryTab === 'messages' && (
        <div className="bg-[#FBFDFC] border border-[#E0E8E6] rounded-[20px] p-6 shadow-xs text-center space-y-3">
          <MessageSquare className="w-10 h-10 text-[#1766A6] mx-auto opacity-70" />
          <h3 className="font-bold text-sm text-[#203945]">المحادثات الآمنة والمباشرة مع المختصين</h3>
          <p className="text-xs text-[#203945]/70 max-w-md mx-auto">
            تواصل مشفر وسري مع الطبيب أو المحامي المتابع لملفك لتبادل الاستفسارات والمستجدات.
          </p>
          <button
            onClick={() => onOpenChat(1)}
            className="px-5 py-2.5 rounded-[12px] bg-[#1766A6] hover:bg-[#125386] text-white font-bold text-xs shadow-xs"
          >
            فتح غرفة المحادثات الآمنة ←
          </button>
        </div>
      )}

      {/* 5. TAB: NOTIFICATIONS (الإشعارات) */}
      {beneficiaryTab === 'notifications' && (
        <div className="bg-[#FBFDFC] border border-[#E0E8E6] rounded-[20px] p-5 shadow-xs space-y-3">
          <h3 className="font-bold text-sm text-[#203945]">الإشعارات والتنبيهات الحية</h3>
          <div className="space-y-2">
            {myNotifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => markNotificationAsReadInDb(notif.id)}
                className={`p-3 rounded-[12px] border cursor-pointer text-xs flex items-start gap-2.5 transition-colors ${
                  notif.isRead ? 'bg-[#FBFDFC] border-[#E0E8E6]' : 'bg-[#EAF3F8] border-[#1766A6]/30 font-semibold'
                }`}
              >
                <Bell className={`w-4 h-4 shrink-0 mt-0.5 ${notif.isRead ? 'text-[#203945]/40' : 'text-[#1766A6]'}`} />
                <div className="flex-1 space-y-0.5">
                  <div className="flex justify-between">
                    <span className="font-bold text-[#203945]">{notif.title}</span>
                    <span className="text-[10px] text-[#203945]/50">{notif.timestamp}</span>
                  </div>
                  <p className="text-[11px] text-[#203945]/80">{notif.message}</p>
                </div>
              </div>
            ))}
            {myNotifications.length === 0 && (
              <p className="text-xs text-center text-[#203945]/60 py-6">لا توجد إشعارات حالياً.</p>
            )}
          </div>
        </div>
      )}

      {/* 6. TAB: FILES & DOCUMENTS (الملفات) */}
      {beneficiaryTab === 'files' && (
        <div className="space-y-4">
          {/* Upload new doc form */}
          <div className="bg-[#FBFDFC] border border-[#E0E8E6] rounded-[18px] p-5 shadow-xs space-y-3">
            <h4 className="font-bold text-xs text-[#203945] flex items-center gap-1.5">
              <Upload className="w-4 h-4 text-[#1766A6]" />
              <span>إرفاق وثيقة أو تقرير جديد للملف</span>
            </h4>
            <form onSubmit={handleUploadDoc} className="flex flex-col sm:flex-row gap-2 text-xs">
              <input
                type="text"
                required
                value={newDocName}
                onChange={(e) => setNewDocName(e.target.value)}
                placeholder="اسم الوثيقة (مثال: محضر_قضائي.pdf أو شهادة_طبية.jpg)..."
                className="flex-1 h-10 px-3 bg-white border border-[#CCD8D5] rounded-[10px] outline-hidden focus:border-[#1766A6]"
              />
              <select
                value={newDocCategory}
                onChange={(e) => setNewDocCategory(e.target.value as any)}
                className="h-10 px-3 bg-white border border-[#CCD8D5] rounded-[10px]"
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

          {/* Files List */}
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

      {/* 7. TAB: PERMITTED REPORTS (التقارير المسموح برؤيتها) */}
      {beneficiaryTab === 'reports' && (
        <div className="space-y-3">
          <div className="bg-[#EAF3F8] p-3.5 rounded-[14px] border border-[#DCEBF4] text-xs text-[#104A78] flex items-start gap-2">
            <Shield className="w-4 h-4 text-[#1766A6] shrink-0 mt-0.5" />
            <p>
              <strong>الخصوصية والسرية الطبية:</strong> تعرض هذه النافذة حصرياً التقييمات والاستشارات المودعة من قبل الأخصائيين والمحامين المرتبطين بقضاياك فقط.
            </p>
          </div>

          {permittedReports.length === 0 ? (
            <div className="bg-[#FBFDFC] border border-[#E0E8E6] rounded-[18px] p-8 text-center text-xs text-[#203945]/70">
              لا توجد تقارير مودعة متاحة للعرض بعد. يتم إيداع التقارير بعد إتمام جلسة التقييم.
            </div>
          ) : (
            permittedReports.map((rep) => (
              <div
                key={rep.id}
                className="bg-[#FBFDFC] border border-[#E0E8E6] rounded-[18px] p-5 shadow-xs space-y-2.5 text-xs"
              >
                <div className="flex items-center justify-between border-b border-[#E0E8E6] pb-2">
                  <span className="font-mono font-bold text-[#1766A6]">{rep.caseNumber}</span>
                  <span className="text-[#203945]/60 text-[11px]">تاريخ التقرير: {rep.createdAt}</span>
                </div>
                <h4 className="font-bold text-sm text-[#203945]">{rep.specialistName} ({rep.specialty})</h4>
                <div className="bg-[#F3F7F6] p-3 rounded-[12px] space-y-1">
                  <p className="font-bold text-[#203945]">التقييم والاستشارة:</p>
                  <p className="text-[#203945]/80 leading-relaxed">{rep.evaluation}</p>
                </div>
                {rep.recommendations && (
                  <p className="text-[#25866D] font-medium">
                    <strong>التوصيات:</strong> {rep.recommendations}
                  </p>
                )}
                {rep.treatmentPlan && (
                  <p className="text-[#1766A6] font-medium">
                    <strong>الخطة المعتمدة:</strong> {rep.treatmentPlan}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* 8. TAB: BENEFICIARY PROFILE (ملفي الشخصي) */}
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
                حساب مستفيد / أسرة • الولاية: {currentUser.wilayaName || 'الجزائر العاصمة'}
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
              <p className="font-bold text-[#203945]">{currentUser.phone || 'غير مسجل'}</p>
            </div>

            <div className="bg-[#F3F7F6] p-3.5 rounded-[12px] space-y-1">
              <span className="text-[#203945]/70 block font-semibold">الولاية الجغرافية:</span>
              <p className="font-bold text-[#203945]">{currentUser.wilayaName || 'الجزائر العاصمة'}</p>
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
    </div>
  );
};
