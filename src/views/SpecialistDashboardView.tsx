import React, { useState } from 'react';
import {
  User,
  CareRequest,
  Appointment,
  SpecialistReport,
  TreatmentFollowUp,
  PlatformNotification,
  RequestStatus,
} from '../types';
import {
  FileText,
  Calendar,
  CheckCircle,
  Clock,
  MessageSquare,
  Plus,
  X,
  Send,
  AlertCircle,
  Check,
  Shield,
  Stethoscope,
  Scale,
  Bell,
  Activity,
  History,
  User as UserIcon,
  ChevronRight,
  Phone,
  MapPin,
  FileCheck,
} from 'lucide-react';
import {
  updateCareRequestInDb,
  addSpecialistReportInDb,
  updateAppointmentStatusInDb,
  addTreatmentFollowUpInDb,
  markNotificationAsReadInDb,
} from '../services/dbService';

interface SpecialistDashboardViewProps {
  currentUser: User;
  requests: CareRequest[];
  appointments: Appointment[];
  reports: SpecialistReport[];
  followUps?: TreatmentFollowUp[];
  notifications?: PlatformNotification[];
  users?: User[];
  onOpenChat: (convId: number) => void;
  onOpenRequestDetail: (req: CareRequest) => void;
}

export const SpecialistDashboardView: React.FC<SpecialistDashboardViewProps> = ({
  currentUser,
  requests,
  appointments,
  reports,
  followUps = [],
  notifications = [],
  users = [],
  onOpenChat,
  onOpenRequestDetail,
}) => {
  // Filter cases assigned to this specialist
  const myRequests = requests.filter(
    (r) =>
      String(r.providerId) === String(currentUser.id) ||
      r.providerName?.toLowerCase().includes(currentUser.lastName?.toLowerCase() || '')
  );

  const newCases = myRequests.filter(
    (r) => r.status === 'NEW' || r.status === 'PENDING_PROVIDER'
  );
  const inProgressCases = myRequests.filter(
    (r) => r.status === 'IN_PROGRESS' || r.status === 'ACCEPTED' || r.status === 'APPOINTMENT_CONFIRMED'
  );
  const completedCases = myRequests.filter((r) => r.status === 'COMPLETED');

  const myAppointments = appointments.filter(
    (a) =>
      String(a.specialistId) === String(currentUser.id) ||
      a.specialistName?.toLowerCase().includes(currentUser.lastName?.toLowerCase() || '')
  );

  const myReports = reports.filter(
    (rep) =>
      String(rep.specialistId) === String(currentUser.id) ||
      rep.specialistName?.toLowerCase().includes(currentUser.lastName?.toLowerCase() || '')
  );

  const myFollowUps = followUps.filter(
    (f) =>
      String(f.specialistId) === String(currentUser.id) ||
      f.specialistName?.toLowerCase().includes(currentUser.lastName?.toLowerCase() || '')
  );

  const myNotifications = notifications.filter(
    (n) =>
      String(n.userId) === String(currentUser.id) ||
      n.recipientRole === currentUser.roleSlug ||
      n.recipientRole === 'ALL'
  );

  // Active sub-tab (Dashboard, الحالات الجديدة، الحالات الجارية، المواعيد، كتابة التقرير، متابعة العلاج، الرسائل، الإشعارات، الملف الشخصي)
  const [activeTab, setActiveTab] = useState<
    'new-cases' | 'in-progress' | 'completed' | 'appointments' | 'write-report' | 'followup' | 'notifications' | 'profile'
  >('in-progress');

  // Selected case for viewing in-progress details
  const [selectedCaseForDetail, setSelectedCaseForDetail] = useState<CareRequest | null>(
    inProgressCases[0] || myRequests[0] || null
  );

  // Reject modal state
  const [rejectModalReqId, setRejectModalReqId] = useState<string | number | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [customRejectionReason, setCustomRejectionReason] = useState('');

  // Write Report state
  const [reportCaseNo, setReportCaseNo] = useState(myRequests[0]?.caseNumber || '');
  const [evalDate, setEvalDate] = useState(new Date().toISOString().split('T')[0]);
  const [caseSummary, setCaseSummary] = useState('');
  const [evaluation, setEvaluation] = useState('');
  const [professionalNotes, setProfessionalNotes] = useState('');
  const [recommendations, setRecommendations] = useState('');
  const [treatmentPlan, setTreatmentPlan] = useState('');
  const [nextAppointmentDate, setNextAppointmentDate] = useState('2026-10-15');
  const [submittingReport, setSubmittingReport] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);

  // Follow-up state
  const [followUpCaseNo, setFollowUpCaseNo] = useState(myRequests[0]?.caseNumber || '');
  const [followUpDate, setFollowUpDate] = useState(new Date().toISOString().split('T')[0]);
  const [followUpNotes, setFollowUpNotes] = useState('');
  const [followUpProgress, setFollowUpProgress] = useState<
    'ممتاز' | 'متحسن' | 'مستقر' | 'يحتاج تكثيف المتابعة' | 'حالة حرجة'
  >('متحسن');
  const [followUpPlan, setFollowUpPlan] = useState('');
  const [followUpRecs, setFollowUpRecs] = useState('');
  const [followUpNextAppt, setFollowUpNextAppt] = useState('2026-10-15');
  const [submittingFollowUp, setSubmittingFollowUp] = useState(false);
  const [followUpSuccess, setFollowUpSuccess] = useState(false);

  // Handle Accept
  const handleAcceptCase = async (reqId: string | number) => {
    await updateCareRequestInDb(reqId, { status: 'ACCEPTED' }, `${currentUser.firstName} ${currentUser.lastName}`);
  };

  // Handle Reject
  const handleConfirmReject = async () => {
    if (!rejectModalReqId) return;
    const finalReason = rejectionReason === 'سبب آخر' ? (customRejectionReason.trim() || 'سبب آخر') : rejectionReason;
    if (!finalReason.trim()) return;

    await updateCareRequestInDb(
      rejectModalReqId,
      { status: 'REJECTED', rejectionReason: finalReason },
      `${currentUser.firstName} ${currentUser.lastName}`
    );
    setRejectModalReqId(null);
    setRejectionReason('');
    setCustomRejectionReason('');
  };

  // Submit Report
  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!evaluation.trim()) return;

    setSubmittingReport(true);
    await addSpecialistReportInDb({
      caseNumber: reportCaseNo,
      specialistId: currentUser.id,
      specialistName: `${currentUser.firstName} ${currentUser.lastName}`,
      specialty: currentUser.specialty || (currentUser.roleSlug === 'lawyer' ? 'محامٍ معتمد' : 'أخصائي نفسي عيادي'),
      evaluation: `${caseSummary ? `[ملخص الحالة]: ${caseSummary}\n\n` : ''}${evaluation}`,
      professionalNotes,
      recommendations,
      treatmentPlan,
      nextAppointment: nextAppointmentDate,
      createdAt: evalDate,
    });

    setSubmittingReport(false);
    setReportSuccess(true);
    setTimeout(() => {
      setReportSuccess(false);
      setEvaluation('');
      setCaseSummary('');
      setProfessionalNotes('');
      setRecommendations('');
      setTreatmentPlan('');
    }, 1500);
  };

  // Submit Follow-up
  const handleSubmitFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!followUpNotes.trim()) return;

    setSubmittingFollowUp(true);
    const matchedReq = myRequests.find((r) => r.caseNumber === followUpCaseNo);

    await addTreatmentFollowUpInDb({
      caseNumber: followUpCaseNo,
      clientId: matchedReq?.clientId || 'unknown',
      clientName: matchedReq?.clientName || 'المستفيد',
      specialistId: currentUser.id,
      specialistName: `${currentUser.firstName} ${currentUser.lastName}`,
      date: followUpDate,
      notes: followUpNotes,
      progress: followUpProgress,
      currentPlan: followUpPlan,
      recommendations: followUpRecs,
      nextAppointment: followUpNextAppt,
      createdAt: new Date().toISOString(),
    });

    setSubmittingFollowUp(false);
    setFollowUpSuccess(true);
    setTimeout(() => {
      setFollowUpSuccess(false);
      setFollowUpNotes('');
      setFollowUpPlan('');
      setFollowUpRecs('');
    }, 1500);
  };

  const isLawyer = currentUser.roleSlug === 'lawyer' || currentUser.roleSlug === 'legal_advisor';
  const unreadNotifsCount = myNotifications.filter((n) => !n.isRead).length;

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-[#FBFDFC] border border-[#E0E8E6] rounded-[22px] p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-[#1766A6]/10 text-[#1766A6] text-[11px] font-black uppercase">
              لوحة تحكم الأخصائي والمختص
            </span>
            <span className="px-2 py-0.5 rounded-md bg-[#E8F4EF] text-[#25866D] text-[11px] font-bold flex items-center gap-1">
              <Shield className="w-3.5 h-3.5" />
              <span>نظام السر المهني والقانوني</span>
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-[#203945] mt-1.5 flex items-center gap-2">
            {isLawyer ? <Scale className="w-6 h-6 text-[#1766A6]" /> : <Stethoscope className="w-6 h-6 text-[#25866D]" />}
            <span>
              {currentUser.firstName} {currentUser.lastName}
            </span>
          </h1>
          <p className="text-xs text-[#203945]/70 mt-1">
            {currentUser.specialty || (isLawyer ? 'مستشار قانوني ومحامٍ معتمد' : 'أخصائي نفسي عيادي وعلاج الإدمان')} • {currentUser.wilayaName || 'الجزائر'}
          </p>
        </div>

        {/* Quick action buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveTab('write-report')}
            className="px-4 py-2.5 rounded-[12px] bg-[#25866D] hover:bg-[#1E6F5A] text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5"
          >
            <FileText className="w-4 h-4" />
            <span>كتابة تقرير جديد</span>
          </button>

          <button
            onClick={() => setActiveTab('followup')}
            className="px-4 py-2.5 rounded-[12px] bg-[#1766A6] hover:bg-[#125386] text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Activity className="w-4 h-4" />
            <span>تسجيل متابعة علاجية</span>
          </button>
        </div>
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div
          onClick={() => setActiveTab('new-cases')}
          className="bg-[#FBFDFC] border border-[#E0E8E6] p-4 rounded-[18px] shadow-xs cursor-pointer hover:border-[#1766A6] transition-colors"
        >
          <span className="text-[11px] font-bold text-[#E65100]">الحالات الجديدة (بانتظار الرد)</span>
          <p className="text-2xl font-black text-[#E65100] mt-1">{newCases.length}</p>
        </div>

        <div
          onClick={() => setActiveTab('in-progress')}
          className="bg-[#FBFDFC] border border-[#E0E8E6] p-4 rounded-[18px] shadow-xs cursor-pointer hover:border-[#1766A6] transition-colors"
        >
          <span className="text-[11px] font-bold text-[#1766A6]">الحالات الجارية</span>
          <p className="text-2xl font-black text-[#1766A6] mt-1">{inProgressCases.length}</p>
        </div>

        <div
          onClick={() => setActiveTab('completed')}
          className="bg-[#FBFDFC] border border-[#E0E8E6] p-4 rounded-[18px] shadow-xs cursor-pointer hover:border-[#25866D] transition-colors"
        >
          <span className="text-[11px] font-bold text-[#25866D]">الحالات المكتملة</span>
          <p className="text-2xl font-black text-[#25866D] mt-1">{completedCases.length}</p>
        </div>

        <div
          onClick={() => setActiveTab('appointments')}
          className="bg-[#FBFDFC] border border-[#E0E8E6] p-4 rounded-[18px] shadow-xs cursor-pointer hover:border-[#1766A6] transition-colors"
        >
          <span className="text-[11px] font-bold text-[#203945]/70">المواعيد القادمة</span>
          <p className="text-2xl font-black text-[#203945] mt-1">{myAppointments.length}</p>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 no-scrollbar text-xs font-bold border-b border-[#E0E8E6]">
        <button
          onClick={() => setActiveTab('new-cases')}
          className={`px-3.5 py-2 rounded-[10px] transition-colors shrink-0 flex items-center gap-1.5 ${
            activeTab === 'new-cases'
              ? 'bg-[#E65100] text-white shadow-xs'
              : 'bg-[#FBFDFC] text-[#203945]/70 hover:bg-[#EAF3F8]'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>الحالات الجديدة ({newCases.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('in-progress')}
          className={`px-3.5 py-2 rounded-[10px] transition-colors shrink-0 flex items-center gap-1.5 ${
            activeTab === 'in-progress'
              ? 'bg-[#1766A6] text-white shadow-xs'
              : 'bg-[#FBFDFC] text-[#203945]/70 hover:bg-[#EAF3F8]'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>الحالات الجارية ({inProgressCases.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('completed')}
          className={`px-3.5 py-2 rounded-[10px] transition-colors shrink-0 flex items-center gap-1.5 ${
            activeTab === 'completed'
              ? 'bg-[#25866D] text-white shadow-xs'
              : 'bg-[#FBFDFC] text-[#203945]/70 hover:bg-[#EAF3F8]'
          }`}
        >
          <CheckCircle className="w-3.5 h-3.5" />
          <span>الحالات المكتملة ({completedCases.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('appointments')}
          className={`px-3.5 py-2 rounded-[10px] transition-colors shrink-0 flex items-center gap-1.5 ${
            activeTab === 'appointments'
              ? 'bg-[#1766A6] text-white shadow-xs'
              : 'bg-[#FBFDFC] text-[#203945]/70 hover:bg-[#EAF3F8]'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>المواعيد ({myAppointments.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('write-report')}
          className={`px-3.5 py-2 rounded-[10px] transition-colors shrink-0 flex items-center gap-1.5 ${
            activeTab === 'write-report'
              ? 'bg-[#1766A6] text-white shadow-xs'
              : 'bg-[#FBFDFC] text-[#203945]/70 hover:bg-[#EAF3F8]'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>كتابة التقرير</span>
        </button>

        <button
          onClick={() => setActiveTab('followup')}
          className={`px-3.5 py-2 rounded-[10px] transition-colors shrink-0 flex items-center gap-1.5 ${
            activeTab === 'followup'
              ? 'bg-[#1766A6] text-white shadow-xs'
              : 'bg-[#FBFDFC] text-[#203945]/70 hover:bg-[#EAF3F8]'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>متابعة العلاج</span>
        </button>

        <button
          onClick={() => setActiveTab('notifications')}
          className={`px-3.5 py-2 rounded-[10px] transition-colors shrink-0 flex items-center gap-1.5 ${
            activeTab === 'notifications'
              ? 'bg-[#1766A6] text-white shadow-xs'
              : 'bg-[#FBFDFC] text-[#203945]/70 hover:bg-[#EAF3F8]'
          }`}
        >
          <Bell className="w-3.5 h-3.5" />
          <span>الإشعارات {unreadNotifsCount > 0 && `(${unreadNotifsCount})`}</span>
        </button>

        <button
          onClick={() => onOpenChat(1)}
          className="px-3.5 py-2 rounded-[10px] transition-colors shrink-0 flex items-center gap-1.5 bg-[#FBFDFC] text-[#203945]/70 hover:bg-[#EAF3F8]"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>الرسائل</span>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`px-3.5 py-2 rounded-[10px] transition-colors shrink-0 flex items-center gap-1.5 ${
            activeTab === 'profile'
              ? 'bg-[#1766A6] text-white shadow-xs'
              : 'bg-[#FBFDFC] text-[#203945]/70 hover:bg-[#EAF3F8]'
          }`}
        >
          <UserIcon className="w-3.5 h-3.5" />
          <span>الملف الشخصي</span>
        </button>
      </div>

      {/* ===================== TAB 1: NEW CASES (قبول / رفض مع سبب الرفض) ===================== */}
      {activeTab === 'new-cases' && (
        <div className="space-y-4">
          <div className="bg-[#FFF8E1] border border-[#FFE082] p-3 rounded-[14px] text-xs text-[#E65100]">
            ⚡ <strong>طلبات جديدة في انتظار قرارك:</strong> يمكنك قبول الطلب للانتقال للمتابعة وتحديد الموعد، أو رفض الطلب مع تسجيل السبب الإلزامي.
          </div>

          {newCases.length === 0 ? (
            <div className="bg-[#FBFDFC] border border-[#E0E8E6] rounded-[20px] p-8 text-center text-xs text-[#203945]/70">
              لا توجد طلبات جديدة معلقة حالياً.
            </div>
          ) : (
            newCases.map((req) => (
              <div
                key={req.id}
                className="bg-[#FBFDFC] border border-[#E0E8E6] rounded-[20px] p-5 shadow-xs space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono text-xs font-bold text-[#1766A6]">{req.caseNumber}</span>
                    <h3 className="font-black text-sm text-[#203945] mt-0.5">{req.serviceTitle}</h3>
                    <p className="text-xs text-[#203945]/80 mt-1">
                      <strong>المستفيد:</strong> {req.clientName} • <strong>الولاية:</strong> {req.wilayaName} • <strong>تاريخ الطلب:</strong> {req.createdAt}
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-[#FFF3E0] text-[#E65100] text-xs font-bold">
                    أولوية {req.priority}
                  </span>
                </div>

                <div className="bg-[#F3F7F6] p-3 rounded-[12px] text-xs text-[#203945]/80 leading-relaxed">
                  <strong>شرح الحالة المقدم من المستفيد:</strong>
                  <p className="mt-1">{req.description}</p>
                </div>

                {/* Actions: Accept or Reject */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E0E8E6]">
                  <button
                    onClick={() => {
                      setRejectModalReqId(req.id);
                      setRejectionReason('الحالة خارج اختصاصي الدقيق');
                    }}
                    className="px-4 py-2 rounded-[10px] bg-[#FBECEB] hover:bg-[#F5D4D2] text-[#A64842] font-bold text-xs transition-colors"
                  >
                    رفض الطلب مع ذكر السبب
                  </button>

                  <button
                    onClick={() => handleAcceptCase(req.id)}
                    className="px-5 py-2 rounded-[10px] bg-[#25866D] hover:bg-[#1E6F5A] text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>قبول الطلب والبدء في المتابعة</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ===================== TAB 2: IN-PROGRESS CASES (ملف المستفيد، تاريخ الحالة، المواعيد، الملاحظات، خطة المتابعة، التقارير، سجل الجلسات) ===================== */}
      {activeTab === 'in-progress' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Cases list sidebar */}
          <div className="space-y-2">
            <h3 className="font-bold text-xs text-[#203945] px-1">الحالات الجارية النشطة</h3>
            {inProgressCases.length === 0 ? (
              <div className="bg-[#FBFDFC] border border-[#E0E8E6] p-4 rounded-[14px] text-xs text-[#203945]/60 text-center">
                لا توجد حالات جارية حالياً
              </div>
            ) : (
              inProgressCases.map((c) => {
                const isSelected = selectedCaseForDetail?.id === c.id;
                return (
                  <div
                    key={c.id}
                    onClick={() => setSelectedCaseForDetail(c)}
                    className={`p-3.5 rounded-[14px] border cursor-pointer transition-all space-y-1 ${
                      isSelected
                        ? 'bg-[#EAF3F8] border-[#1766A6] shadow-xs'
                        : 'bg-[#FBFDFC] border-[#E0E8E6] hover:bg-[#F3F7F6]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-[#1766A6]">{c.caseNumber}</span>
                      <span className="px-2 py-0.5 rounded-full bg-[#E8F4EF] text-[#25866D] text-[10px] font-bold">
                        {c.status}
                      </span>
                    </div>
                    <p className="font-bold text-xs text-[#203945]">{c.clientName}</p>
                    <p className="text-[11px] text-[#203945]/70 line-clamp-1">{c.serviceTitle}</p>
                  </div>
                );
              })
            )}
          </div>

          {/* Full Case Detail Panel */}
          <div className="md:col-span-2 space-y-4">
            {selectedCaseForDetail ? (
              <div className="bg-[#FBFDFC] border border-[#E0E8E6] rounded-[20px] p-5 shadow-xs space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between border-b border-[#E0E8E6] pb-3">
                  <div>
                    <span className="font-mono text-xs font-bold text-[#1766A6]">
                      {selectedCaseForDetail.caseNumber}
                    </span>
                    <h3 className="font-black text-base text-[#203945] mt-0.5">
                      {selectedCaseForDetail.serviceTitle}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onOpenChat(1)}
                      className="px-3 py-1.5 rounded-[10px] bg-[#EAF3F8] text-[#1766A6] text-xs font-bold hover:bg-[#DCEBF4] transition-colors flex items-center gap-1"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>محادثة المستفيد</span>
                    </button>

                    <button
                      onClick={() => {
                        setReportCaseNo(selectedCaseForDetail.caseNumber);
                        setActiveTab('write-report');
                      }}
                      className="px-3 py-1.5 rounded-[10px] bg-[#25866D] text-white text-xs font-bold hover:bg-[#1E6F5A] transition-colors flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>تقرير جديد</span>
                    </button>
                  </div>
                </div>

                {/* 1. ملف المستفيد */}
                <div className="bg-[#F3F7F6] p-4 rounded-[14px] space-y-2 text-xs">
                  <h4 className="font-bold text-[#1766A6] flex items-center gap-1.5">
                    <UserIcon className="w-4 h-4" />
                    <span>ملف وبيانات المستفيد</span>
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-[#203945]">
                    <p><strong>الاسم الكامل:</strong> {selectedCaseForDetail.clientName}</p>
                    <p><strong>الولاية:</strong> {selectedCaseForDetail.wilayaName}</p>
                    <p><strong>تاريخ بدء الحالة:</strong> {selectedCaseForDetail.createdAt}</p>
                    <p><strong>حالة الدفع:</strong> {selectedCaseForDetail.paymentStatus}</p>
                  </div>
                </div>

                {/* 2. الملاحظات وخطة المتابعة */}
                <div className="space-y-2 text-xs">
                  <h4 className="font-bold text-[#203945]">الوصف الأولي والملاحظات:</h4>
                  <p className="bg-white p-3 rounded-[12px] border border-[#E0E8E6] text-[#203945]/80 leading-relaxed">
                    {selectedCaseForDetail.description}
                  </p>
                </div>

                {/* 3. المواعيد المرتبطة بالحالة */}
                <div className="space-y-2 text-xs">
                  <h4 className="font-bold text-[#203945]">مواعيد الجلسات:</h4>
                  <div className="space-y-1.5">
                    {myAppointments
                      .filter((a) => a.caseNumber === selectedCaseForDetail.caseNumber)
                      .map((appt) => (
                        <div
                          key={appt.id}
                          className="p-2.5 rounded-[10px] bg-white border border-[#E0E8E6] flex items-center justify-between"
                        >
                          <span>📅 {appt.date} • {appt.time}</span>
                          <span className="font-bold text-[#25866D]">{appt.status}</span>
                        </div>
                      ))}
                    {myAppointments.filter((a) => a.caseNumber === selectedCaseForDetail.caseNumber).length === 0 && (
                      <p className="text-[#203945]/60 italic">لا توجد مواعيد مخصصة لهذه الحالة بعد.</p>
                    )}
                  </div>
                </div>

                {/* 4. التقارير المودعة للحالة */}
                <div className="space-y-2 text-xs">
                  <h4 className="font-bold text-[#203945]">التقارير السريرية والقانونية المودعة:</h4>
                  <div className="space-y-2">
                    {myReports
                      .filter((r) => r.caseNumber === selectedCaseForDetail.caseNumber)
                      .map((rep) => (
                        <div
                          key={rep.id}
                          className="p-3 rounded-[12px] bg-white border border-[#CCD8D5] space-y-1.5"
                        >
                          <div className="flex justify-between font-bold text-[#1766A6]">
                            <span>تقرير مهني • {rep.specialty}</span>
                            <span className="text-[#203945]/60 text-[11px]">{rep.createdAt}</span>
                          </div>
                          <p className="text-[#203945]/80">{rep.evaluation}</p>
                          {rep.recommendations && (
                            <p className="text-[#25866D] text-[11px]">
                              <strong>التوصيات:</strong> {rep.recommendations}
                            </p>
                          )}
                        </div>
                      ))}
                    {myReports.filter((r) => r.caseNumber === selectedCaseForDetail.caseNumber).length === 0 && (
                      <p className="text-[#203945]/60 italic">لم يتم إيداع تقارير رسمية لهذه الحالة حتى الآن.</p>
                    )}
                  </div>
                </div>

                {/* 5. سجل الجلسات والمتابعة */}
                <div className="space-y-2 text-xs">
                  <h4 className="font-bold text-[#203945]">سجل جلسات المتابعة والتطور:</h4>
                  <div className="space-y-2">
                    {myFollowUps
                      .filter((f) => f.caseNumber === selectedCaseForDetail.caseNumber)
                      .map((f) => (
                        <div
                          key={f.id}
                          className="p-3 rounded-[12px] bg-[#EAF3F8] border border-[#DCEBF4] space-y-1"
                        >
                          <div className="flex justify-between font-bold text-[#104A78]">
                            <span>جلسة متابعة • {f.date}</span>
                            <span className="px-2 py-0.5 rounded-full bg-white text-[#25866D] text-[10px]">
                              التطور: {f.progress}
                            </span>
                          </div>
                          <p className="text-[#203945]/80">{f.notes}</p>
                          {f.currentPlan && (
                            <p className="text-[11px] text-[#1766A6]">
                              <strong>الخطة الحالية:</strong> {f.currentPlan}
                            </p>
                          )}
                        </div>
                      ))}
                  </div>
                </div>

                {/* Status action buttons */}
                <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E0E8E6]">
                  <button
                    onClick={() => {
                      setFollowUpCaseNo(selectedCaseForDetail.caseNumber);
                      setActiveTab('followup');
                    }}
                    className="px-4 py-2 rounded-[10px] bg-[#EAF3F8] text-[#1766A6] font-bold text-xs"
                  >
                    تسجيل جلسة متابعة
                  </button>

                  <button
                    onClick={async () => {
                      await updateCareRequestInDb(
                        selectedCaseForDetail.id,
                        { status: 'COMPLETED' },
                        currentUser.firstName
                      );
                    }}
                    className="px-4 py-2 rounded-[10px] bg-[#25866D] hover:bg-[#1E6F5A] text-white font-bold text-xs shadow-xs"
                  >
                    إتمام وإغلاق الحالة بنجاح
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-[#FBFDFC] border border-[#E0E8E6] rounded-[20px] p-8 text-center text-xs text-[#203945]/70">
                اختر حالة من القائمة لعرض تفاصيلها وسجلاتها.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================== TAB 3: COMPLETED CASES ===================== */}
      {activeTab === 'completed' && (
        <div className="space-y-3">
          {completedCases.length === 0 ? (
            <div className="bg-[#FBFDFC] border border-[#E0E8E6] rounded-[20px] p-8 text-center text-xs text-[#203945]/70">
              لا توجد حالات مكتملة حتى الآن.
            </div>
          ) : (
            completedCases.map((c) => (
              <div
                key={c.id}
                className="bg-[#FBFDFC] border border-[#E0E8E6] rounded-[20px] p-5 shadow-xs space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-[#1766A6]">{c.caseNumber}</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#E8F4EF] text-[#25866D] font-bold">
                    مكتملة ومؤرشفة
                  </span>
                </div>
                <h4 className="font-black text-sm text-[#203945]">{c.serviceTitle}</h4>
                <p className="text-[#203945]/70">المستفيد: {c.clientName} • الولاية: {c.wilayaName}</p>
                <p className="bg-[#F3F7F6] p-2.5 rounded-[10px] text-[#203945]/80">{c.description}</p>
              </div>
            ))
          )}
        </div>
      )}

      {/* ===================== TAB 4: APPOINTMENTS ===================== */}
      {activeTab === 'appointments' && (
        <div className="space-y-3">
          {myAppointments.map((appt) => (
            <div
              key={appt.id}
              className="bg-[#FBFDFC] border border-[#E0E8E6] rounded-[18px] p-4 shadow-xs flex items-center justify-between gap-3 text-xs"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-[#1766A6]">{appt.caseNumber}</span>
                  <span className="font-bold text-[#203945]">{appt.specialty}</span>
                </div>
                <p className="text-[#203945]/70">
                  📅 التاريخ: {appt.date} • ⏰ الوقت: {appt.time}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`px-2.5 py-1 rounded-full font-bold ${
                    appt.status === 'CONFIRMED'
                      ? 'bg-[#E8F4EF] text-[#25866D]'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {appt.status}
                </span>

                {appt.status !== 'CONFIRMED' && (
                  <button
                    onClick={() => updateAppointmentStatusInDb(appt.id, 'CONFIRMED', currentUser.firstName)}
                    className="px-3 py-1 rounded-[8px] bg-[#25866D] text-white font-bold hover:bg-[#1E6F5A]"
                  >
                    تأكيد الموعد
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ===================== TAB 5: WRITE REPORT (Requirement 12) ===================== */}
      {activeTab === 'write-report' && (
        <div className="bg-[#FBFDFC] border border-[#E0E8E6] rounded-[22px] p-6 shadow-xs space-y-4 max-w-2xl mx-auto">
          <div className="border-b border-[#E0E8E6] pb-3">
            <h3 className="font-black text-base text-[#203945]">
              📝 تحرير تقرير مهني سري مرتبط بالحالة (محفوظ في قاعدة البيانات)
            </h3>
            <p className="text-xs text-[#1766A6] mt-0.5">
              بيانات المستفيد، ملخص الحالة، التقييم، التوصيات، الخطة العلاجية والموعد القادم
            </p>
          </div>

          {reportSuccess ? (
            <div className="p-8 text-center space-y-2">
              <CheckCircle className="w-12 h-12 text-[#25866D] mx-auto" />
              <p className="font-bold text-[#25866D] text-sm">
                تم حفظ التقرير بنجاح وربطه بالحالة في قاعدة البيانات السحابية!
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmitReport} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#203945] block mb-1">رقم الحالة / الملف</label>
                  <select
                    value={reportCaseNo}
                    onChange={(e) => setReportCaseNo(e.target.value)}
                    className="w-full h-10 px-3 bg-white border border-[#CCD8D5] rounded-[10px] font-mono"
                  >
                    {myRequests.map((r) => (
                      <option key={r.id} value={r.caseNumber}>
                        {r.caseNumber} - {r.clientName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-[#203945] block mb-1">تاريخ التقييم</label>
                  <input
                    type="date"
                    value={evalDate}
                    onChange={(e) => setEvalDate(e.target.value)}
                    className="w-full h-10 px-3 bg-white border border-[#CCD8D5] rounded-[10px]"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-[#203945] block mb-1">ملخص الحالة</label>
                <input
                  type="text"
                  value={caseSummary}
                  onChange={(e) => setCaseSummary(e.target.value)}
                  placeholder="موجز عن وضعية الحالة والتشخيص الأولي..."
                  className="w-full h-10 px-3 bg-white border border-[#CCD8D5] rounded-[10px]"
                />
              </div>

              <div>
                <label className="font-bold text-[#203945] block mb-1">
                  التقييم السريري / القانوني المفصل
                </label>
                <textarea
                  required
                  rows={3}
                  value={evaluation}
                  onChange={(e) => setEvaluation(e.target.value)}
                  placeholder="التقييم السريري الدقيق، الأعراض، والملاحظات المهنية..."
                  className="w-full p-3 bg-white border border-[#CCD8D5] rounded-[10px] resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#203945] block mb-1">الملاحظات المهنية</label>
                  <textarea
                    rows={2}
                    value={professionalNotes}
                    onChange={(e) => setProfessionalNotes(e.target.value)}
                    placeholder="ملاحظات سرية..."
                    className="w-full p-3 bg-white border border-[#CCD8D5] rounded-[10px] resize-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#203945] block mb-1">التوصيات</label>
                  <textarea
                    rows={2}
                    value={recommendations}
                    onChange={(e) => setRecommendations(e.target.value)}
                    placeholder="التوصيات والخطوات العاجلة..."
                    className="w-full p-3 bg-white border border-[#CCD8D5] rounded-[10px] resize-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#203945] block mb-1">الخطة العلاجية / القانونية</label>
                  <input
                    type="text"
                    value={treatmentPlan}
                    onChange={(e) => setTreatmentPlan(e.target.value)}
                    placeholder="بروتوكول العلاج أو الإجراء القانوني..."
                    className="w-full h-10 px-3 bg-white border border-[#CCD8D5] rounded-[10px]"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#203945] block mb-1">الموعد القادم</label>
                  <input
                    type="date"
                    value={nextAppointmentDate}
                    onChange={(e) => setNextAppointmentDate(e.target.value)}
                    className="w-full h-10 px-3 bg-white border border-[#CCD8D5] rounded-[10px]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#E0E8E6]">
                <button
                  type="submit"
                  disabled={submittingReport}
                  className="px-6 py-2.5 rounded-[12px] bg-[#25866D] hover:bg-[#1E6F5A] text-white font-bold text-xs shadow-xs"
                >
                  {submittingReport ? 'جاري الحفظ...' : 'حفظ التقرير وربطه بقاعدة البيانات'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* ===================== TAB 6: TREATMENT TRACKING (Requirement 13) ===================== */}
      {activeTab === 'followup' && (
        <div className="space-y-6">
          {/* New follow-up form */}
          <div className="bg-[#FBFDFC] border border-[#E0E8E6] rounded-[22px] p-6 shadow-xs space-y-4 max-w-2xl mx-auto">
            <div className="border-b border-[#E0E8E6] pb-3">
              <h3 className="font-black text-base text-[#203945]">🩺 تسجيل متابعة علاجية جديدة</h3>
              <p className="text-xs text-[#25866D] mt-0.5">
                تاريخ المتابعة، الملاحظات، تطور الحالة، الخطة الحالية، التوصيات، والموعد القادم
              </p>
            </div>

            {followUpSuccess ? (
              <div className="p-8 text-center space-y-2">
                <CheckCircle className="w-12 h-12 text-[#25866D] mx-auto" />
                <p className="font-bold text-[#25866D] text-sm">تم تسجيل المتابعة العلاجية بنجاح!</p>
              </div>
            ) : (
              <form onSubmit={handleSubmitFollowUp} className="space-y-3.5 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-[#203945] block mb-1">رقم الحالة</label>
                    <select
                      value={followUpCaseNo}
                      onChange={(e) => setFollowUpCaseNo(e.target.value)}
                      className="w-full h-10 px-3 bg-white border border-[#CCD8D5] rounded-[10px] font-mono"
                    >
                      {myRequests.map((r) => (
                        <option key={r.id} value={r.caseNumber}>
                          {r.caseNumber} - {r.clientName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-[#203945] block mb-1">تاريخ المتابعة</label>
                    <input
                      type="date"
                      value={followUpDate}
                      onChange={(e) => setFollowUpDate(e.target.value)}
                      className="w-full h-10 px-3 bg-white border border-[#CCD8D5] rounded-[10px]"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-[#203945] block mb-1">تطور الحالة</label>
                  <select
                    value={followUpProgress}
                    onChange={(e) => setFollowUpProgress(e.target.value as any)}
                    className="w-full h-10 px-3 bg-white border border-[#CCD8D5] rounded-[10px]"
                  >
                    <option value="ممتاز">ممتاز (استجابة كلية للبروتوكول)</option>
                    <option value="متحسن">متحسن (انحسار الأعراض والالتزام بالجلسات)</option>
                    <option value="مستقر">مستقر (تحت المراقبة المستمرة)</option>
                    <option value="يحتاج تكثيف المتابعة">يحتاج تكثيف المتابعة والدعم الأسري</option>
                    <option value="حالة حرجة">حالة حرجة (تتطلب تدخل استشفائي عاجل)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-[#203945] block mb-1">الملاحظات السريرية والتطور</label>
                  <textarea
                    required
                    rows={2}
                    value={followUpNotes}
                    onChange={(e) => setFollowUpNotes(e.target.value)}
                    placeholder="ملاحظات الجلسة وتطور الاستجابة العلاجية..."
                    className="w-full p-3 bg-white border border-[#CCD8D5] rounded-[10px] resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-[#203945] block mb-1">الخطة الحالية</label>
                    <input
                      type="text"
                      value={followUpPlan}
                      onChange={(e) => setFollowUpPlan(e.target.value)}
                      placeholder="العلاج الدوائي أو السلوكي..."
                      className="w-full h-10 px-3 bg-white border border-[#CCD8D5] rounded-[10px]"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-[#203945] block mb-1">الموعد القادم</label>
                    <input
                      type="date"
                      value={followUpNextAppt}
                      onChange={(e) => setFollowUpNextAppt(e.target.value)}
                      className="w-full h-10 px-3 bg-white border border-[#CCD8D5] rounded-[10px]"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2 border-t border-[#E0E8E6]">
                  <button
                    type="submit"
                    disabled={submittingFollowUp}
                    className="px-6 py-2.5 rounded-[12px] bg-[#1766A6] text-white font-bold text-xs"
                  >
                    حفظ المتابعة العلاجية
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Previous Follow-up Timeline */}
          <div className="bg-[#FBFDFC] border border-[#E0E8E6] rounded-[22px] p-6 shadow-xs space-y-4 max-w-2xl mx-auto">
            <h4 className="font-bold text-sm text-[#203945] flex items-center gap-2">
              <History className="w-4 h-4 text-[#1766A6]" />
              <span>تاريخ وسجل المتابعات السابقة للمستفيدين</span>
            </h4>

            <div className="space-y-3">
              {myFollowUps.map((f) => (
                <div
                  key={f.id}
                  className="p-3.5 rounded-[14px] bg-[#F3F7F6] border border-[#E0E8E6] space-y-1 text-xs"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-mono font-bold text-[#1766A6]">{f.caseNumber}</span>
                    <span className="px-2 py-0.5 rounded-full bg-white text-[#25866D] font-bold text-[10px]">
                      {f.progress}
                    </span>
                  </div>
                  <p className="text-[#203945]">{f.notes}</p>
                  <p className="text-[10px] text-[#203945]/60">
                    📅 التاريخ: {f.date} • الموعد القادم: {f.nextAppointment}
                  </p>
                </div>
              ))}
              {myFollowUps.length === 0 && (
                <p className="text-xs text-[#203945]/60 italic text-center">لا توجد متابعات مسجلة بعد.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===================== TAB 7: NOTIFICATIONS (Requirement 20) ===================== */}
      {activeTab === 'notifications' && (
        <div className="bg-[#FBFDFC] border border-[#E0E8E6] rounded-[22px] p-6 shadow-xs space-y-3 max-w-2xl mx-auto">
          <div className="flex items-center justify-between border-b border-[#E0E8E6] pb-3">
            <h3 className="font-bold text-sm text-[#203945]">🔔 إشعارات المختص الفورية</h3>
            <span className="text-xs text-[#1766A6] font-semibold">{myNotifications.length} إشعار</span>
          </div>

          <div className="space-y-2">
            {myNotifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => markNotificationAsReadInDb(notif.id)}
                className={`p-3 rounded-[12px] border cursor-pointer transition-colors flex items-start gap-2.5 text-xs ${
                  notif.isRead
                    ? 'bg-[#FBFDFC] border-[#E0E8E6]'
                    : 'bg-[#EAF3F8] border-[#1766A6]/30 font-semibold'
                }`}
              >
                <Bell className={`w-4 h-4 shrink-0 mt-0.5 ${notif.isRead ? 'text-[#203945]/40' : 'text-[#1766A6]'}`} />
                <div className="flex-1 space-y-0.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[#203945] font-bold">{notif.title}</span>
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

      {/* ===================== TAB 8: SPECIALIST PROFILE (الملف الشخصي) ===================== */}
      {activeTab === 'profile' && (
        <div className="bg-[#FBFDFC] border border-[#E0E8E6] rounded-[22px] p-6 shadow-xs space-y-4 max-w-2xl mx-auto text-xs">
          <div className="flex items-center gap-3 pb-3 border-b border-[#E0E8E6]">
            <div className="w-12 h-12 rounded-full bg-[#E8F4EF] text-[#25866D] flex items-center justify-center text-lg font-bold">
              {currentUser.firstName.charAt(0)}
            </div>
            <div>
              <h3 className="font-black text-base text-[#203945]">
                {currentUser.firstName} {currentUser.lastName}
              </h3>
              <p className="text-[#25866D] font-bold">
                {currentUser.specialty || (isLawyer ? 'محامٍ ومستشار قانوني معتمد' : 'أخصائي نفسي عيادي وعلاج إدمان')}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="bg-[#F3F7F6] p-3.5 rounded-[12px] space-y-1">
              <span className="text-[#203945]/70 block font-semibold">البريد المهني:</span>
              <p className="font-bold text-[#203945]">{currentUser.email}</p>
            </div>

            <div className="bg-[#F3F7F6] p-3.5 rounded-[12px] space-y-1">
              <span className="text-[#203945]/70 block font-semibold">رقم الهاتف المهني:</span>
              <p className="font-bold text-[#203945]">{currentUser.phone || 'غير مسجل'}</p>
            </div>

            <div className="bg-[#F3F7F6] p-3.5 rounded-[12px] space-y-1">
              <span className="text-[#203945]/70 block font-semibold">الولاية الجغرافية:</span>
              <p className="font-bold text-[#203945]">{currentUser.wilayaName || 'الجزائر العاصمة'}</p>
            </div>

            <div className="bg-[#F3F7F6] p-3.5 rounded-[12px] space-y-1">
              <span className="text-[#203945]/70 block font-semibold">رقم الاعتماد المهني:</span>
              <p className="font-bold text-[#1766A6] font-mono">
                {currentUser.licenseNumber || 'ALG-SPEC-2026-CONF'}
              </p>
            </div>

            <div className="bg-[#F3F7F6] p-3.5 rounded-[12px] space-y-1 sm:col-span-2">
              <span className="text-[#203945]/70 block font-semibold">عنوان العيادة أو المكتب:</span>
              <p className="font-bold text-[#203945]">{currentUser.address || 'وسط المدينة'}</p>
            </div>
          </div>

          <div className="bg-[#EAF3F8] p-3.5 rounded-[14px] border border-[#DCEBF4] text-[11px] text-[#104A78] space-y-1">
            <strong className="block font-bold">📜 ميثاق السر المهني والأخلاقي:</strong>
            <p className="leading-relaxed">
              وفقاً لقانون العقوبات الجزائري، وقانون الصحة، والقانون رقم 18-07 المتعلق بحماية الأشخاص الطبيعيين في مجال معالجة المعطيات ذات الطابع الشخصي، يلتزم المختص بالحفاظ الكامل على سرية ملفات المستفيدين وتقاريرهم.
            </p>
          </div>
        </div>
      )}

      {/* ===================== MODAL: REJECT CASE WITH MANDATORY REASON ===================== */}
      {rejectModalReqId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-[#FBFDFC] rounded-[24px] max-w-md w-full shadow-2xl border border-[#E0E8E6] p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E0E8E6] pb-3">
              <h3 className="font-black text-sm text-[#5F1D1A]">تسجيل سبب رفض الطلب (إلزامي)</h3>
              <button onClick={() => setRejectModalReqId(null)} className="text-[#203945]/50">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <p className="text-[#203945]">اختر أو اكتب سبب عدم إمكانية استقبال هذه الحالة:</p>
              {[
                'الحالة خارج اختصاصي الدقيق',
                'جدول المواعيد ممتلئ حالياً',
                'المستفيد يقع خارج النطاق الجغرافي للعيادة',
                'الحالة تتطلب تدخلاً استشفائياً عاجلاً بمستشفى متخصص',
                'سبب آخر',
              ].map((reason) => (
                <label
                  key={reason}
                  className="flex items-center gap-2 p-2.5 rounded-[10px] bg-[#F3F7F6] border border-[#CCD8D5] cursor-pointer"
                >
                  <input
                    type="radio"
                    name="rejectReasonRadio"
                    checked={rejectionReason === reason}
                    onChange={() => setRejectionReason(reason)}
                    className="accent-[#A64842]"
                  />
                  <span className="font-semibold text-[#203945]">{reason}</span>
                </label>
              ))}

              {rejectionReason === 'سبب آخر' && (
                <textarea
                  rows={2}
                  value={customRejectionReason}
                  onChange={(e) => setCustomRejectionReason(e.target.value)}
                  placeholder="اكتب سبب الرفض هنا..."
                  className="w-full p-2.5 bg-white border border-[#CCD8D5] rounded-[10px] text-xs resize-none"
                />
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E0E8E6] text-xs">
              <button
                onClick={() => setRejectModalReqId(null)}
                className="px-4 py-2 font-bold text-[#203945]/70"
              >
                إلغاء
              </button>
              <button
                onClick={handleConfirmReject}
                className="px-5 py-2 rounded-[10px] bg-[#A64842] text-white font-bold hover:bg-[#8A3A35]"
              >
                تأكيد الرفض
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
