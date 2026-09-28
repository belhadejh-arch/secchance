import React, { useState } from 'react';
import {
  User,
  CareRequest,
  Appointment,
  SpecialistReport,
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
} from 'lucide-react';
import {
  updateCareRequestInDb,
  addSpecialistReportInDb,
  updateAppointmentStatusInDb,
} from '../services/dbService';

interface SpecialistDashboardViewProps {
  currentUser: User;
  requests: CareRequest[];
  appointments: Appointment[];
  reports: SpecialistReport[];
  onOpenChat: (convId: number) => void;
  onOpenRequestDetail: (req: CareRequest) => void;
}

export const SpecialistDashboardView: React.FC<SpecialistDashboardViewProps> = ({
  currentUser,
  requests,
  appointments,
  reports,
  onOpenChat,
  onOpenRequestDetail,
}) => {
  // Filter cases assigned to this specialist
  const myRequests = requests.filter(
    (r) =>
      String(r.providerId) === String(currentUser.id) ||
      r.providerName?.toLowerCase().includes(currentUser.lastName?.toLowerCase() || '')
  );

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

  // Active sub-tab in Specialist dashboard
  const [activeTab, setActiveTab] = useState<'cases' | 'appointments' | 'reports'>('cases');

  // New report modal state
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedCaseNumber, setSelectedCaseNumber] = useState<string>(
    myRequests[0]?.caseNumber || ''
  );
  const [evaluation, setEvaluation] = useState('');
  const [professionalNotes, setProfessionalNotes] = useState('');
  const [recommendations, setRecommendations] = useState('');
  const [treatmentPlan, setTreatmentPlan] = useState('');
  const [nextAppointmentDate, setNextAppointmentDate] = useState('2026-10-15');
  const [submittingReport, setSubmittingReport] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);

  // Status update handler
  const handleUpdateStatus = async (reqId: string | number, newStatus: RequestStatus) => {
    await updateCareRequestInDb(reqId, { status: newStatus }, `${currentUser.firstName} ${currentUser.lastName}`);
  };

  // Submit report handler
  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!evaluation.trim()) return;

    setSubmittingReport(true);
    await addSpecialistReportInDb({
      caseNumber: selectedCaseNumber,
      specialistId: currentUser.id,
      specialistName: `${currentUser.firstName} ${currentUser.lastName}`,
      specialty: currentUser.specialty || (currentUser.roleSlug === 'lawyer' ? 'محامٍ معتمد' : 'أخصائي عيادي'),
      evaluation,
      professionalNotes,
      recommendations,
      treatmentPlan,
      nextAppointment: nextAppointmentDate,
      createdAt: new Date().toLocaleDateString('ar-DZ'),
    });

    setSubmittingReport(false);
    setReportSuccess(true);
    setTimeout(() => {
      setReportSuccess(false);
      setIsReportModalOpen(false);
      setEvaluation('');
      setProfessionalNotes('');
      setRecommendations('');
      setTreatmentPlan('');
    }, 1200);
  };

  const isLawyer = currentUser.roleSlug === 'lawyer' || currentUser.roleSlug === 'legal_advisor';

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#FBFDFC] border border-[#E0E8E6] rounded-[22px] p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-[#1766A6]/10 text-[#1766A6] text-[11px] font-black uppercase">
              لوحة تحكم المختص المعتمد
            </span>
            <span className="px-2 py-0.5 rounded-md bg-[#E8F4EF] text-[#25866D] text-[11px] font-bold flex items-center gap-1">
              <Shield className="w-3.5 h-3.5" />
              <span>سرية البيانات الطبية والقضائية</span>
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-[#203945] mt-1.5 flex items-center gap-2">
            {isLawyer ? <Scale className="w-6 h-6 text-[#1766A6]" /> : <Stethoscope className="w-6 h-6 text-[#25866D]" />}
            <span>
              {currentUser.firstName} {currentUser.lastName}
            </span>
          </h1>
          <p className="text-xs text-[#203945]/70 mt-1">
            {currentUser.specialty || (isLawyer ? 'مستشار قانوني ومحامٍ معتمد' : 'أخصائي نفسي وعيادي')} • {currentUser.wilayaName || 'الجزائر'}
          </p>
        </div>

        {/* Action button */}
        <button
          onClick={() => setIsReportModalOpen(true)}
          className="px-4 py-2.5 rounded-[12px] bg-[#25866D] hover:bg-[#1E6F5A] text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>{isLawyer ? 'تحرير استشارة / مذكرة قانونية' : 'إيداع تقرير طبي سرّي'}</span>
        </button>
      </div>

      {/* Metrics overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-[#FBFDFC] border border-[#E0E8E6] p-4 rounded-[18px] shadow-xs">
          <span className="text-[11px] font-bold text-[#203945]/70">الحالات المسندة</span>
          <p className="text-2xl font-black text-[#1766A6] mt-1">{myRequests.length}</p>
        </div>

        <div className="bg-[#FBFDFC] border border-[#E0E8E6] p-4 rounded-[18px] shadow-xs">
          <span className="text-[11px] font-bold text-[#203945]/70">المواعيد المجدولة</span>
          <p className="text-2xl font-black text-[#25866D] mt-1">{myAppointments.length}</p>
        </div>

        <div className="bg-[#FBFDFC] border border-[#E0E8E6] p-4 rounded-[18px] shadow-xs">
          <span className="text-[11px] font-bold text-[#203945]/70">التقارير المودعة</span>
          <p className="text-2xl font-black text-[#203945] mt-1">{myReports.length}</p>
        </div>

        <div className="bg-[#FBFDFC] border border-[#E0E8E6] p-4 rounded-[18px] shadow-xs">
          <span className="text-[11px] font-bold text-[#203945]/70">حالات قيد الانتظار</span>
          <p className="text-2xl font-black text-[#E65100] mt-1">
            {myRequests.filter((r) => r.status === 'PENDING_PROVIDER').length}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#E0E8E6] pb-2 text-xs font-bold">
        <button
          onClick={() => setActiveTab('cases')}
          className={`px-4 py-2 rounded-[10px] transition-colors flex items-center gap-1.5 ${
            activeTab === 'cases'
              ? 'bg-[#1766A6] text-white shadow-xs'
              : 'bg-[#FBFDFC] text-[#203945]/70 hover:bg-[#EAF3F8]'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>الحالات المسندة ({myRequests.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('appointments')}
          className={`px-4 py-2 rounded-[10px] transition-colors flex items-center gap-1.5 ${
            activeTab === 'appointments'
              ? 'bg-[#1766A6] text-white shadow-xs'
              : 'bg-[#FBFDFC] text-[#203945]/70 hover:bg-[#EAF3F8]'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>مواعيد الجلسات ({myAppointments.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`px-4 py-2 rounded-[10px] transition-colors flex items-center gap-1.5 ${
            activeTab === 'reports'
              ? 'bg-[#1766A6] text-white shadow-xs'
              : 'bg-[#FBFDFC] text-[#203945]/70 hover:bg-[#EAF3F8]'
          }`}
        >
          <CheckCircle className="w-4 h-4" />
          <span>التقارير المنجزة ({myReports.length})</span>
        </button>
      </div>

      {/* Tab Content 1: Cases */}
      {activeTab === 'cases' && (
        <div className="space-y-3">
          {myRequests.length === 0 ? (
            <div className="bg-[#FBFDFC] border border-[#E0E8E6] rounded-[18px] p-8 text-center text-[#203945]/70 text-xs">
              لا توجد حالات مسندة إليك حالياً. ستظهر الحالات الجديدة هنا فور إسنادها.
            </div>
          ) : (
            myRequests.map((req) => (
              <div
                key={req.id}
                className="bg-[#FBFDFC] border border-[#E0E8E6] rounded-[18px] p-4 sm:p-5 shadow-xs space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono text-xs font-bold text-[#1766A6] block">
                      {req.caseNumber}
                    </span>
                    <h3 className="font-black text-sm text-[#203945] mt-0.5">{req.serviceTitle}</h3>
                    <p className="text-xs text-[#203945]/80 mt-1">
                      <strong>المستفيد:</strong> {req.clientName} • الولاية: {req.wilayaName}
                    </p>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                      req.status === 'COMPLETED'
                        ? 'bg-[#E8F4EF] text-[#25866D]'
                        : req.status === 'IN_PROGRESS' || req.status === 'ACCEPTED'
                        ? 'bg-[#EAF3F8] text-[#1766A6]'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {req.status}
                  </span>
                </div>

                <p className="text-xs text-[#203945]/80 bg-[#F3F7F6] p-3 rounded-[12px] leading-relaxed">
                  {req.description}
                </p>

                {/* Actions on this case */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#E0E8E6] text-xs">
                  <div className="flex items-center gap-1.5">
                    {req.status === 'PENDING_PROVIDER' && (
                      <button
                        onClick={() => handleUpdateStatus(req.id, 'ACCEPTED')}
                        className="px-3 py-1.5 rounded-[8px] bg-[#25866D] text-white font-bold hover:bg-[#1E6F5A] transition-colors"
                      >
                        قبول الحالة
                      </button>
                    )}

                    {req.status !== 'IN_PROGRESS' && req.status !== 'COMPLETED' && (
                      <button
                        onClick={() => handleUpdateStatus(req.id, 'IN_PROGRESS')}
                        className="px-3 py-1.5 rounded-[8px] bg-[#1766A6] text-white font-bold hover:bg-[#125386] transition-colors"
                      >
                        بدء المتابعة
                      </button>
                    )}

                    {req.status !== 'COMPLETED' && (
                      <button
                        onClick={() => handleUpdateStatus(req.id, 'COMPLETED')}
                        className="px-3 py-1.5 rounded-[8px] bg-[#E8F4EF] text-[#25866D] font-bold hover:bg-[#C5E4D8] transition-colors"
                      >
                        إتمام الحالة
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onOpenChat(1)}
                      className="px-3 py-1.5 rounded-[8px] border border-[#CCD8D5] text-[#203945] font-bold hover:bg-[#EAF3F8] transition-colors flex items-center gap-1"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-[#1766A6]" />
                      <span>محادثة المستفيد</span>
                    </button>

                    <button
                      onClick={() => {
                        setSelectedCaseNumber(req.caseNumber);
                        setIsReportModalOpen(true);
                      }}
                      className="px-3 py-1.5 rounded-[8px] bg-[#1766A6] text-white font-bold hover:bg-[#125386] transition-colors flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>كتابة تقرير</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab Content 2: Appointments */}
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

      {/* Tab Content 3: Reports */}
      {activeTab === 'reports' && (
        <div className="space-y-3">
          {myReports.map((rep) => (
            <div
              key={rep.id}
              className="bg-[#FBFDFC] border border-[#E0E8E6] rounded-[18px] p-5 shadow-xs space-y-2 text-xs"
            >
              <div className="flex items-center justify-between border-b border-[#E0E8E6] pb-2">
                <span className="font-mono font-bold text-[#1766A6]">{rep.caseNumber}</span>
                <span className="text-[#203945]/60">{rep.createdAt}</span>
              </div>
              <p className="font-bold text-[#203945]">التقييم السريري / القانوني:</p>
              <p className="text-[#203945]/80 leading-relaxed bg-[#F3F7F6] p-3 rounded-[10px]">
                {rep.evaluation}
              </p>
              {rep.recommendations && (
                <p className="text-[#25866D] font-medium">
                  <strong>التوصيات:</strong> {rep.recommendations}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ===================== MODAL: WRITE SPECIALIST REPORT ===================== */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-[#FBFDFC] rounded-[24px] max-w-lg w-full shadow-2xl border border-[#E0E8E6] p-6 space-y-4 my-6">
            <div className="flex items-center justify-between pb-3 border-b border-[#E0E8E6]">
              <div>
                <h3 className="font-black text-base text-[#203945]">
                  {isLawyer ? 'تحرير استشارة / تقرير قانوني' : 'تحرير تقرير طبي وتقييم سريري'}
                </h3>
                <p className="text-[11px] text-[#1766A6]">
                  محمي بالسر المهني وفق التشريع الجزائري
                </p>
              </div>
              <button onClick={() => setIsReportModalOpen(false)} className="text-[#203945]/50">
                <X className="w-5 h-5" />
              </button>
            </div>

            {reportSuccess ? (
              <div className="p-8 text-center space-y-2">
                <CheckCircle className="w-12 h-12 text-[#25866D] mx-auto" />
                <p className="font-bold text-[#25866D] text-sm">تم إيداع التقرير في الملف بنجاح!</p>
              </div>
            ) : (
              <form onSubmit={handleSubmitReport} className="space-y-3.5 text-xs">
                <div>
                  <label className="font-bold text-[#203945] block mb-1">رقم الحالة / الملف</label>
                  <input
                    type="text"
                    required
                    value={selectedCaseNumber}
                    onChange={(e) => setSelectedCaseNumber(e.target.value)}
                    placeholder="SC-2026-..."
                    className="w-full h-10 px-3 bg-white border border-[#CCD8D5] rounded-[10px] font-mono"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#203945] block mb-1">
                    {isLawyer ? 'الرأي القانوني والموقف القضائي' : 'التقييم السريري وتشخيص الحالة'}
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={evaluation}
                    onChange={(e) => setEvaluation(e.target.value)}
                    placeholder="صِف حالة المستفيد وتفاصيل الجلسة..."
                    className="w-full p-3 bg-white border border-[#CCD8D5] rounded-[10px] resize-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#203945] block mb-1">
                    {isLawyer ? 'المواد القانونية والتوصيات القضائية' : 'التوصيات وخطة العلاج'}
                  </label>
                  <textarea
                    rows={2}
                    value={recommendations}
                    onChange={(e) => setRecommendations(e.target.value)}
                    placeholder="التوصيات والخطوات الواجب اتخاذها..."
                    className="w-full p-3 bg-white border border-[#CCD8D5] rounded-[10px] resize-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#203945] block mb-1">تاريخ الجلسة / المتابعة القادمة</label>
                  <input
                    type="date"
                    value={nextAppointmentDate}
                    onChange={(e) => setNextAppointmentDate(e.target.value)}
                    className="w-full h-10 px-3 bg-white border border-[#CCD8D5] rounded-[10px]"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-[#E0E8E6]">
                  <button
                    type="button"
                    onClick={() => setIsReportModalOpen(false)}
                    className="px-4 py-2 font-bold text-[#203945]/70"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={submittingReport}
                    className="px-5 py-2 bg-[#25866D] text-white font-bold rounded-[10px] shadow-xs"
                  >
                    {submittingReport ? 'جاري الحفظ...' : 'إيداع وحفظ التقرير'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
