import React, { useState } from 'react';
import { CareRequest, SpecialistReport, User } from '../types';
import { ArrowForward, ArrowRight, CreditCard, MessageSquare } from 'lucide-react';

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
        <p className="text-[#203945] font-semibold">لم يتم العثور على تفاصيل الطلب.</p>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-[#1766A6] text-white rounded-[10px] text-xs font-bold"
        >
          رجوع للطلبات
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
    <div className="space-y-4 max-w-3xl mx-auto">
      {/* Back button */}
      <div>
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#203945] hover:text-[#1766A6] transition-colors"
        >
          <ArrowRight className="w-4 h-4" />
          <span>رجوع للطلبات</span>
        </button>
      </div>

      {/* Main Request Card */}
      <div className="bg-[#FBFDFC] rounded-[20px] border border-[#E5ECE9] p-5 sm:p-6 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-bold text-[13px] text-[#1766A6]">
            {request.caseNumber}
          </span>
          <span className="font-bold text-[12px] text-[#203945]">
            الحالة: {request.status}
          </span>
        </div>

        <h2 className="font-black text-[18px] text-[#203945]">
          {request.serviceTitle}
        </h2>

        <p className="font-semibold text-[12px] text-[#25866D]">
          العميل: {request.clientName} | مقدم الخدمة: {request.providerName}
        </p>

        <p className="text-[13px] text-[#203945]/80 leading-[20px]">
          {request.description}
        </p>

        {request.rejectionReason && (
          <div className="bg-[#FBECEB] text-[#5F1D1A] text-[11px] p-2.5 rounded-[8px] border border-[#F5D4D2]">
            سبب الرفض: {request.rejectionReason}
          </div>
        )}

        {/* Attached Confidential Documents (Requirement 21) */}
        {request.attachedDocuments && request.attachedDocuments.length > 0 && (
          <div className="bg-[#EAF3F8] p-3.5 rounded-[14px] border border-[#DCEBF4] space-y-2">
            <span className="font-bold text-xs text-[#1766A6] block">
              📁 الوثائق والمستندات القضائية / الطبية المرفقة:
            </span>
            <div className="space-y-1.5">
              {request.attachedDocuments.map((doc, idx) => (
                <div
                  key={idx}
                  className="bg-white p-2 rounded-[8px] border border-[#CCD8D5] flex items-center justify-between text-xs"
                >
                  <span className="font-medium text-[#203945]">{doc}</span>
                  <span className="text-[10px] text-[#1766A6] font-bold">
                    🔒 مشفر ومحمي
                  </span>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-[#104A78] font-bold pt-1">
              🔒 هذا المستند خاص ولا يمكن الوصول إليه إلا من المستخدم والجهة المخولة.
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2 pt-1">
          {(request.status === 'ACCEPTED' || request.status === 'WAITING_PAYMENT') &&
            request.paymentStatus === 'PENDING' && (
              <button
                onClick={() => onStartPayment(request)}
                className="w-full flex items-center justify-center gap-1.5 py-3 px-4 rounded-[12px] bg-[#25866D] hover:bg-[#1e6c58] text-white font-bold text-xs sm:text-sm shadow-xs transition-colors"
              >
                <CreditCard className="w-4 h-4" />
                <span>إتمام الدفع الإلكتروني ({request.amountDzd.toLocaleString()} دج)</span>
              </button>
            )}

          <button
            onClick={() => onOpenChat(1)}
            className="w-full flex items-center justify-center gap-1.5 py-3 px-4 rounded-[12px] bg-[#1766A6] hover:bg-[#125386] text-white font-bold text-xs sm:text-sm shadow-xs transition-colors"
          >
            <MessageSquare className="w-4 h-4" />
            <span>فتح غرفة المحادثة المباشرة</span>
          </button>
        </div>
      </div>

      {/* Specialist Report Section */}
      {isSpecialist && (
        <form
          onSubmit={handleSaveReport}
          className="bg-[#FBFDFC] rounded-[20px] border border-[#E5ECE9] p-5 shadow-xs space-y-3"
        >
          <h3 className="font-bold text-[15px] text-[#1766A6]">
            كتابة تقرير وملاحظات مهنية للحالة
          </h3>

          <div className="space-y-2">
            <div>
              <label className="text-[12px] text-[#203945]/80 block mb-0.5">
                التقييم العيادي أو القانوني
              </label>
              <input
                required
                type="text"
                value={evaluation}
                onChange={(e) => setEvaluation(e.target.value)}
                className="w-full p-2.5 text-xs sm:text-sm bg-white border border-[#CCD8D5] rounded-[8px] outline-hidden focus:border-[#1766A6]"
              />
            </div>

            <div>
              <label className="text-[12px] text-[#203945]/80 block mb-0.5">
                الملاحظات المهنية
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-2.5 text-xs sm:text-sm bg-white border border-[#CCD8D5] rounded-[8px] outline-hidden focus:border-[#1766A6]"
              />
            </div>

            <div>
              <label className="text-[12px] text-[#203945]/80 block mb-0.5">
                التوصيات
              </label>
              <input
                type="text"
                value={recommendations}
                onChange={(e) => setRecommendations(e.target.value)}
                className="w-full p-2.5 text-xs sm:text-sm bg-white border border-[#CCD8D5] rounded-[8px] outline-hidden focus:border-[#1766A6]"
              />
            </div>

            <div>
              <label className="text-[12px] text-[#203945]/80 block mb-0.5">
                الخطة العلاجية / المتابعة
              </label>
              <input
                type="text"
                value={treatmentPlan}
                onChange={(e) => setTreatmentPlan(e.target.value)}
                className="w-full p-2.5 text-xs sm:text-sm bg-white border border-[#CCD8D5] rounded-[8px] outline-hidden focus:border-[#1766A6]"
              />
            </div>

            <button
              type="submit"
              disabled={!evaluation.trim()}
              className="w-full py-2.5 px-4 rounded-[10px] bg-[#1766A6] hover:bg-[#125386] text-white font-bold text-xs shadow-xs transition-colors mt-2"
            >
              حفظ وإرسال التقرير
            </button>
          </div>
        </form>
      )}

      {/* Reports List */}
      {caseReports.length > 0 && (
        <div className="space-y-2.5">
          <h3 className="font-bold text-[15px] text-[#203945]">
            التقارير والمتابعات المهنية
          </h3>

          {caseReports.map((rep) => (
            <div
              key={rep.id}
              className="bg-[#E8F4EF] rounded-[14px] p-4 text-[#1A5E4D] space-y-1.5 shadow-xs border border-[#D5EADB]"
            >
              <p className="font-bold text-[12px] text-[#1A5E4D]">
                المزود: {rep.specialistName} ({rep.specialty})
              </p>
              <p className="text-[12px]">التقييم: {rep.evaluation}</p>
              {rep.professionalNotes && <p className="text-[11px]">الملاحظات: {rep.professionalNotes}</p>}
              {rep.recommendations && <p className="text-[11px]">التوصيات: {rep.recommendations}</p>}
              {rep.treatmentPlan && <p className="text-[11px]">الخطة: {rep.treatmentPlan}</p>}
              {rep.nextAppointment && (
                <p className="font-bold text-[11px] text-[#1766A6] pt-1">
                  الموعد القادم: {rep.nextAppointment}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
