import React, { useEffect, useState } from 'react';
import { Appointment, CareRequest, PaymentTransaction, SpecialistReport, User } from '../types';
import { ArrowRight, CalendarDays, Check, Circle, Clock3, CreditCard, MessageSquare, Star } from 'lucide-react';

interface CaseDetailViewProps {
  request: CareRequest | null;
  currentUser: User | null;
  reports: SpecialistReport[];
  appointments: Appointment[];
  transactions: PaymentTransaction[];
  onStartPayment: (request: CareRequest) => void;
  onSubmitRating: (requestId: number | string, rating: 1 | 2 | 3 | 4 | 5) => Promise<void>;
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
  appointments,
  transactions,
  onStartPayment,
  onSubmitRating,
  onAddReport,
  onOpenChat,
  onBack,
}) => {
  const [evaluation, setEvaluation] = useState('');
  const [notes, setNotes] = useState('');
  const [recommendations, setRecommendations] = useState('');
  const [treatmentPlan, setTreatmentPlan] = useState('');
  const [nextAppt, setNextAppt] = useState('2026-10-10');
  const [ratingSelection, setRatingSelection] = useState<number>(request?.serviceRating ?? 0);
  const [locallySavedRating, setLocallySavedRating] = useState<number | null>(null);
  const [savingRating, setSavingRating] = useState(false);
  const [ratingError, setRatingError] = useState('');

  useEffect(() => {
    setRatingSelection(request?.serviceRating ?? 0);
    setLocallySavedRating(null);
    setRatingError('');
  }, [request?.id, request?.serviceRating]);

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
  const isSpecialist = Boolean(
    currentUser &&
      ['psychologist', 'doctor', 'lawyer', 'legal_advisor', 'treatment_center', 'clinic', 'hospital', 'association', 'admin'].includes(
        currentUser.roleSlug
      )
  );
  const appointment = appointments
    .filter((item) => item.caseNumber === request.caseNumber && item.status !== 'CANCELLED')
    .sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`))[0];
  const appointmentDate = appointment?.date || request.appointmentDate || undefined;
  const appointmentTime = appointment?.time || request.appointmentTime || undefined;
  const consultantName = appointment?.specialistName || request.providerName;
  const paymentConfirmed =
    request.paymentStatus === 'PAID' ||
    transactions.some(
      (transaction) =>
        transaction.caseNumber === request.caseNumber && transaction.status === 'SUCCESSFUL'
    );
  const paymentNotRequired = request.paymentStatus === 'NOT_REQUIRED';
  const consultationStarted =
    request.status === 'IN_PROGRESS' ||
    request.status === 'COMPLETED' ||
    appointment?.status === 'COMPLETED';
  const appointmentBooked =
    appointment?.status === 'CANCELLED'
      ? consultationStarted
      : appointment?.status === 'CONFIRMED' ||
        appointment?.status === 'COMPLETED' ||
        ['APPOINTMENT_CONFIRMED', 'IN_PROGRESS', 'COMPLETED'].includes(request.status);
  const consultationComplete =
    request.status === 'COMPLETED' || appointment?.status === 'COMPLETED';
  const statusLabels: Record<CareRequest['status'], string> = {
    NEW: 'تم إرسال الطلب',
    PENDING_PROVIDER: 'بانتظار رد مقدم الخدمة',
    ACCEPTED: 'تم قبول الطلب',
    WAITING_PAYMENT: 'بانتظار الدفع',
    PAID: 'تم الدفع',
    APPOINTMENT_CONFIRMED: 'تم حجز الموعد',
    IN_PROGRESS: 'الاستشارة جارية',
    COMPLETED: 'الاستشارة مكتملة',
    REJECTED: 'رُفض الطلب',
    CANCELLED: 'أُلغي الطلب',
  };
  const journey = [
    { label: 'تم إرسال الطلب', done: true, detail: 'تم تسجيل الطلب في المنصة.' },
    {
      label: paymentNotRequired ? 'الدفع غير مطلوب' : 'تم الدفع',
      done: paymentConfirmed || paymentNotRequired,
      detail: paymentConfirmed
        ? 'تم تأكيد الدفع من بيانات المعاملة.'
        : paymentNotRequired
          ? 'لا توجد رسوم مطلوبة لهذا الطلب.'
          : 'لم يُؤكد الدفع بعد.',
    },
    {
      label: 'تم حجز الموعد',
      done: appointmentBooked,
      detail: appointment?.status === 'CANCELLED'
        ? 'أُلغي الموعد المسجل.'
        : appointmentBooked
          ? 'تم تأكيد حجز الموعد.'
          : 'بانتظار تأكيد الموعد.',
    },
    {
      label: 'موعد الاستشارة',
      done: consultationStarted,
      detail: appointmentDate
        ? `${appointmentDate}${appointmentTime ? ` — ${appointmentTime}` : ''}`
        : 'لم يُحدد الموعد بعد.',
    },
    {
      label: 'الاستشارة مكتملة',
      done: consultationComplete,
      detail: consultationComplete ? 'أكدت البيانات اكتمال الاستشارة.' : 'لم تُسجل الاستشارة مكتملة بعد.',
    },
  ];

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

  const handleSaveRating = async () => {
    if (
      !consultationComplete ||
      isSpecialist ||
      request.serviceRating ||
      locallySavedRating ||
      ratingSelection < 1 ||
      ratingSelection > 5
    ) {
      return;
    }

    setSavingRating(true);
    setRatingError('');
    try {
      await onSubmitRating(request.id, ratingSelection as 1 | 2 | 3 | 4 | 5);
      setLocallySavedRating(ratingSelection);
    } catch {
      setRatingError('تعذر حفظ التقييم. حاول مرة أخرى.');
    } finally {
      setSavingRating(false);
    }
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
            الحالة: {statusLabels[request.status]}
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

      <section
        aria-labelledby="consultation-follow-up-title"
        className="space-y-4 rounded-[20px] border border-[#DCEBF4] bg-[#FBFDFC] p-5 shadow-xs sm:p-6"
        dir="rtl"
      >
        <div>
          <p className="text-xs font-bold text-[#25866D]">متابعة الطلب</p>
          <h2 id="consultation-follow-up-title" className="mt-1 text-xl font-black text-[#104A78]">
            متابعة الاستشارة
          </h2>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-[14px] bg-[#F3F7F6] p-3">
            <p className="text-[11px] text-[#203945]/60">نوع الاستشارة</p>
            <p className="mt-1 text-sm font-bold text-[#203945]">{request.serviceTitle}</p>
          </div>
          <div className="rounded-[14px] bg-[#F3F7F6] p-3">
            <p className="text-[11px] text-[#203945]/60">حالة الطلب</p>
            <p className="mt-1 text-sm font-bold text-[#203945]">{statusLabels[request.status]}</p>
          </div>
          <div className="rounded-[14px] bg-[#F3F7F6] p-3">
            <p className="text-[11px] text-[#203945]/60">الموعد</p>
            <p className="mt-1 flex items-center gap-2 text-sm font-bold text-[#203945]">
              <CalendarDays className="h-4 w-4 shrink-0 text-[#1766A6]" />
              {appointmentDate || 'لم يُحدد بعد'}
            </p>
          </div>
          <div className="rounded-[14px] bg-[#F3F7F6] p-3">
            <p className="text-[11px] text-[#203945]/60">الساعة</p>
            <p className="mt-1 flex items-center gap-2 text-sm font-bold text-[#203945]">
              <Clock3 className="h-4 w-4 shrink-0 text-[#1766A6]" />
              {appointmentTime || 'لم تُحدد بعد'}
            </p>
          </div>
          <div className="rounded-[14px] bg-[#F3F7F6] p-3 sm:col-span-2">
            <p className="text-[11px] text-[#203945]/60">اسم المستشار</p>
            <p className="mt-1 text-sm font-bold text-[#203945]">{consultantName || 'غير محدد'}</p>
          </div>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-black text-[#203945]">مسار الطلب</h3>
          <ol className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
            {journey.map((step, index) => (
              <li
                key={step.label}
                className={`rounded-[12px] border p-3 ${
                  step.done ? 'border-[#CFE5DA] bg-[#F3FAF6]' : 'border-[#E5ECE9] bg-white'
                }`}
              >
                <div className="flex items-center gap-2">
                  {step.done ? (
                    <Check className="h-4 w-4 shrink-0 text-[#25866D]" />
                  ) : (
                    <Circle className="h-4 w-4 shrink-0 text-[#9AABA6]" />
                  )}
                  <span className="text-xs font-bold text-[#203945]">
                    {index + 1}. {step.label}
                  </span>
                </div>
                <p className="mt-2 text-[11px] leading-relaxed text-[#203945]/65">{step.detail}</p>
              </li>
            ))}
          </ol>
        </div>

        <div className="space-y-2 border-t border-[#E0E8E6] pt-4">
          <button
            type="button"
            onClick={() => onOpenChat(1)}
            disabled={!appointmentBooked || consultationComplete}
            aria-describedby="consultation-entry-note"
            className="w-full rounded-[12px] bg-[#1766A6] px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-[#125386] disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            الدخول إلى الاستشارة
          </button>
          <p id="consultation-entry-note" className="text-center text-xs text-[#203945]/65">
            {consultationComplete
              ? 'اكتملت الاستشارة.'
              : appointment?.status === 'CANCELLED'
                ? 'أُلغي الموعد؛ يتاح الدخول بعد تأكيد موعد جديد.'
              : appointmentBooked
                ? 'يفتح زر الدخول قناة التواصل المتاحة للاستشارة.'
                : 'يتاح الدخول بعد تأكيد حجز الموعد.'}
          </p>
        </div>
      </section>

      {consultationComplete && !isSpecialist && (
        <section
          aria-labelledby="consultation-rating-title"
          className="space-y-3 rounded-[20px] border border-[#DCEBF4] bg-white p-5 shadow-xs"
          dir="rtl"
        >
          <div>
            <h3 id="consultation-rating-title" className="font-black text-[#203945]">
              تقييم الخدمة
            </h3>
            <p className="mt-1 text-sm text-[#203945]/70">
              مشاركة تقييمك تساعدنا على تحسين الخدمة
            </p>
          </div>
          {(request.serviceRating || locallySavedRating) ? (
            <div className="flex items-center gap-1" aria-label={`تقييمك ${request.serviceRating || locallySavedRating} من 5`}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-7 w-7 ${
                    star <= (request.serviceRating || locallySavedRating || 0)
                      ? 'fill-amber-400 text-amber-500'
                      : 'text-slate-300'
                  }`}
                />
              ))}
              <span className="mr-2 text-xs font-bold text-[#25866D]">تم حفظ تقييمك، شكرًا لك.</span>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-1" role="radiogroup" aria-label="اختر تقييمًا من نجمة إلى خمس نجوم">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    role="radio"
                    aria-checked={ratingSelection === star}
                    aria-label={`${star} ${star === 1 ? 'نجمة' : 'نجوم'} من 5`}
                    onClick={() => setRatingSelection(star)}
                    className="rounded-md p-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1766A6]"
                  >
                    <Star
                      className={`h-8 w-8 transition-colors ${
                        star <= ratingSelection
                          ? 'fill-amber-400 text-amber-500'
                          : 'text-slate-300 hover:text-amber-400'
                      }`}
                    />
                  </button>
                ))}
              </div>
              {ratingError && <p role="alert" className="text-xs font-bold text-red-700">{ratingError}</p>}
              <button
                type="button"
                onClick={handleSaveRating}
                disabled={!ratingSelection || savingRating}
                className="rounded-[10px] bg-[#25866D] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#1E6F5A] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {savingRating ? 'جارٍ حفظ التقييم…' : 'إرسال التقييم'}
              </button>
            </>
          )}
        </section>
      )}

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
