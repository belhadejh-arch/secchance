import React, { useState } from 'react';
import { CareRequest, SpecialistReport, User } from '../types';
import {
  ArrowRight,
  CreditCard,
  MessageSquare,
  FileText,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Send,
} from 'lucide-react';

interface CaseDetailViewProps {
  request: CareRequest | null;
  currentUser: User | null;
  reports: SpecialistReport[];
  onStartPayment: (request: CareRequest) => void;
  onAddReport: (
    caseNumber: string,
    evaluation: string,
    notes: string,
    recommendations: string,
    plan: string,
    nextAppt: string
  ) => void;
  onOpenChat: (convId: number) => void;
  onBack: () => void;
}

export const CaseDetailView: React.FC<CaseDetailViewProps> = ({
  request,
  currentUser,
  reports,
  onStartPayment,
  onAddReport,
  onOpenChat,
  onBack,
}) => {
  const [evaluation, setEvaluation] = useState('');
  const [notes, setNotes] = useState('');
  const [recommendations, setRecommendations] = useState('');
  const [treatmentPlan, setTreatmentPlan] = useState('');
  const [nextAppt, setNextAppt] = useState('2026-10-10');

  if (!request) {
    return (
      <div className="text-center py-12 space-y-3">
        <p className="text-slate-600 font-semibold">لم يتم العثور على تفاصيل الحالة.</p>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-blue-700 text-white rounded-xl text-xs font-bold"
        >
          العودة للطلبات
        </button>
      </div>
    );
  }

  const caseReports = reports.filter((r) => r.caseNumber === request.caseNumber);
  const isSpecialist =
    currentUser?.roleSlug &&
    ['psychologist', 'lawyer', 'treatment_center', 'clinic'].includes(
      currentUser.roleSlug
    );

  const handleSaveReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!evaluation.trim()) return;
    onAddReport(
      request.caseNumber,
      evaluation,
      notes,
      recommendations,
      treatmentPlan,
      nextAppt
    );
    setEvaluation('');
    setNotes('');
    setRecommendations('');
    setTreatmentPlan('');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back button */}
      <div>
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-700 hover:text-blue-700 py-1.5 px-2.5 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <ArrowRight className="w-4 h-4" />
          <span>الرجوع إلى قائمة الطلبات</span>
        </button>
      </div>

      {/* Main Request Information Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="font-black text-sm text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg">
              {request.caseNumber}
            </span>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700">
              الأولوية: {request.priority}
            </span>
          </div>

          <span className="text-xs font-bold px-3 py-1 rounded-lg bg-blue-100 text-blue-900">
            الحالة: {request.status}
          </span>
        </div>

        <div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900">
            {request.serviceTitle}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            العميل: <span className="font-bold text-slate-800">{request.clientName}</span> | مقدم الخدمة: <span className="font-bold text-blue-700">{request.providerName}</span> | الولاية: {request.wilayaName}
          </p>
        </div>

        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-700 leading-relaxed">
          <span className="font-bold text-slate-900 block mb-1">وصف الحالة والتفاصيل:</span>
          {request.description}
        </div>

        {/* If Rejected */}
        {request.rejectionReason && (
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-900 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">تم رفض هذا الطلب:</span>
              <span>السبب: {request.rejectionReason}</span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row gap-3">
          {(request.status === 'ACCEPTED' || request.status === 'WAITING_PAYMENT') &&
            request.paymentStatus === 'PENDING' && (
              <button
                onClick={() => onStartPayment(request)}
                className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-sm transition-colors flex items-center justify-center gap-2"
              >
                <CreditCard className="w-4 h-4" />
                <span>إتمام الدفع الإلكتروني ({request.amountDzd.toLocaleString()} دج)</span>
              </button>
            )}

          <button
            onClick={() => onOpenChat(1)}
            className="flex-1 py-3 px-4 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs sm:text-sm shadow-sm transition-colors flex items-center justify-center gap-2"
          >
            <MessageSquare className="w-4 h-4" />
            <span>فتح غرفة المحادثة المباشرة</span>
          </button>
        </div>
      </div>

      {/* Specialist Report Form */}
      {isSpecialist && (
        <form
          onSubmit={handleSaveReport}
          className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4"
        >
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <FileText className="w-5 h-5 text-blue-700" />
            <h3 className="font-black text-slate-900 text-base">
              تحرير تقرير وملاحظات عيادية / قانونية للحالة
            </h3>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                التقييم العيادي أو القانوني
              </label>
              <textarea
                required
                value={evaluation}
                onChange={(e) => setEvaluation(e.target.value)}
                placeholder="أدخل التقييم الأولي أو ملخص الاستشارة القانونية/الطبية..."
                rows={2}
                className="w-full p-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl outline-hidden focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                الملاحظات المهنية الدقيقة
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="ملاحظات سلوكية، تاريخ الإدمان، الأعراض، أو السوابق القانونية..."
                rows={2}
                className="w-full p-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl outline-hidden focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  التوصيات
                </label>
                <input
                  type="text"
                  value={recommendations}
                  onChange={(e) => setRecommendations(e.target.value)}
                  placeholder="مثال: جلسات دعم أسبوعية، إشراك الأسرة..."
                  className="w-full p-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl outline-hidden focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  الخطة العلاجية المقترحة
                </label>
                <input
                  type="text"
                  value={treatmentPlan}
                  onChange={(e) => setTreatmentPlan(e.target.value)}
                  placeholder="مثال: برنامج إزالة السموم + مرافقة 6 أسابيع"
                  className="w-full p-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl outline-hidden focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                تاريخ الموعد القادم
              </label>
              <input
                type="date"
                value={nextAppt}
                onChange={(e) => setNextAppt(e.target.value)}
                className="w-full p-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl outline-hidden focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={!evaluation.trim()}
              className="w-full py-2.5 px-4 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs sm:text-sm shadow-xs transition-colors flex items-center justify-center gap-1.5"
            >
              <Send className="w-4 h-4" />
              <span>حفظ وإرسال التقرير لملف الحالة</span>
            </button>
          </div>
        </form>
      )}

      {/* Existing Reports List */}
      <div className="space-y-3">
        <h3 className="font-black text-slate-900 text-base">
          التقارير والمتابعات المهنية المسجلة ({caseReports.length})
        </h3>

        {caseReports.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center text-xs text-slate-500">
            لا توجد تقارير مسجلة لهذه الحالة بعد.
          </div>
        ) : (
          caseReports.map((rep) => (
            <div
              key={rep.id}
              className="bg-white rounded-2xl border border-blue-200 p-5 shadow-xs space-y-2.5"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-extrabold text-blue-800">
                  {rep.specialistName} ({rep.specialty})
                </span>
                <span className="text-slate-400">{rep.createdAt}</span>
              </div>

              <div className="text-xs sm:text-sm space-y-1.5 text-slate-800">
                <p>
                  <span className="font-bold text-slate-900">التقييم:</span> {rep.evaluation}
                </p>
                {rep.professionalNotes && (
                  <p>
                    <span className="font-bold text-slate-900">الملاحظات:</span> {rep.professionalNotes}
                  </p>
                )}
                {rep.recommendations && (
                  <p>
                    <span className="font-bold text-slate-900">التوصيات:</span> {rep.recommendations}
                  </p>
                )}
                {rep.treatmentPlan && (
                  <p>
                    <span className="font-bold text-slate-900">الخطة العلاجية:</span> {rep.treatmentPlan}
                  </p>
                )}
              </div>

              {rep.nextAppointment && (
                <div className="pt-2 border-t border-slate-100 flex items-center gap-2 text-xs font-bold text-blue-700">
                  <Calendar className="w-4 h-4" />
                  <span>الموعد القادم المحدد: {rep.nextAppointment}</span>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
