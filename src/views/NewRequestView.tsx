import React, { useState } from 'react';
import { Appointment, CareRequest, ServiceItem, Priority, User } from '../types';
import { GuidanceProgress } from '../components/GuidanceProgress';
import {
  Check,
  Calendar,
  Clock,
  Upload,
  ArrowRight,
  Shield,
  FileCheck,
} from 'lucide-react';

interface NewRequestViewProps {
  services: ServiceItem[];
  specialists: User[];
  appointments: Appointment[];
  requests: CareRequest[];
  preselectedServiceId?: number;
  initialTargetPerson?: 'self' | 'family';
  legalDraft?: {
    caseType: string;
    description: string;
    wilaya: string;
    attachedDocs: string[];
    priority: Priority;
  } | null;
  currentUser?: User | null;
  onSubmit: (
    serviceId: number,
    priority: Priority,
    wilaya: string,
    description: string,
    extraData?: any
  ) => void | Promise<void>;
  onCancel: () => void;
  onNavigateToPortal?: () => void;
}

export const NewRequestView: React.FC<NewRequestViewProps> = ({
  services,
  specialists,
  appointments,
  requests,
  preselectedServiceId,
  initialTargetPerson,
  legalDraft,
  currentUser,
  onSubmit,
  onCancel,
  onNavigateToPortal,
}) => {
  // Step state: service, beneficiary, consultation, assessment, specialist, appointment, payment
  // 1: طبيعة المساعدة
  // 2: لمن تتعلق الحالة؟
  // 3: وصف المشكلة وإرفاق وثيقة
  // 4: التقييم الأولي (الأسئلة الثلاثة)
  // 5: الشاشة 08 — اختيار المختص
  // 6: الشاشة 09 — حجز الموعد
  // 7: الشاشة 10 — الدفع
  const [step, setStep] = useState<number>(legalDraft ? 5 : 1);
  const consultationServices = services.filter(
    (service) => service.category === 'legal' || service.category === 'psychological'
  );

  // Form states
  const [selectedServiceId, setSelectedServiceId] = useState<number>(
    consultationServices.find((service) => service.id === preselectedServiceId)?.id ??
      consultationServices[0]?.id ??
      0
  );
  const [targetPerson, setTargetPerson] = useState<'self' | 'family'>(initialTargetPerson ?? 'self');
  const [problemDescription, setProblemDescription] = useState<string>(legalDraft?.description ?? '');
  const legalTopics = [
    'استفسار قانوني.',
    'وضعية أحد أفراد الأسرة.',
    'وضعية مرتبطة بالمخدرات أو المؤثرات العقلية.',
    'إجراء قانوني.',
    'وضعية قضائية.',
    'حقوق والتزامات.',
    'أخرى.',
  ];
  const psychologicalTopics = [
    'الدعم النفسي والتعامل مع الضغوط',
    'القلق والتوتر',
    'العلاقات الأسرية',
    'الدعم النفسي المرتبط بالتعافي',
    'أخرى',
  ];
  const [consultationTopic, setConsultationTopic] = useState(legalDraft?.caseType ?? legalTopics[0]);

  const categoryLabels: Record<string, string> = {
    psychological: 'الدعم النفسي',
    legal: 'المساعدة القانونية',
  };
  const selectedService =
    consultationServices.find((service) => service.id === selectedServiceId) ??
    consultationServices[0];
  const getServiceForProvider = (providerId: number | string) =>
    consultationServices.find(
      (service) =>
        service.category === selectedService?.category &&
        String(service.providerId) === String(providerId)
    );

  // Assessment answers (Requirement 9 & 21 from Project Plan)
  const [hasLegalProblem, setHasLegalProblem] = useState<'yes' | 'no' | 'unknown'>('no');
  const [hasSummons, setHasSummons] = useState<'yes' | 'no'>('no');
  const [isUrgent, setIsUrgent] = useState<'yes' | 'no'>('no');

  const [selectedSpecialistId, setSelectedSpecialistId] = useState<number | string | null>(null);
  const [selectedSlotKey, setSelectedSlotKey] = useState<string | null>(null);
  const [serviceTermsAccepted, setServiceTermsAccepted] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'EDAHABIA' | 'CIB'>('EDAHABIA');
  const [bookingRequestCreated, setBookingRequestCreated] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submissionError, setSubmissionError] = useState<string>('');

  const professionalRoles =
    selectedService?.category === 'legal'
      ? ['lawyer', 'legal_advisor']
      : selectedService?.category === 'psychological'
        ? ['psychologist', 'doctor']
        : [];
  const requiredDurationMinutes = selectedService?.category === 'psychological' ? 50 : 30;
  const getAvailableSlots = (specialist: User) =>
    (specialist.availabilitySlots ?? [])
      .filter((slot) => {
        const startsAt = new Date(`${slot.date}T${slot.time}:00`).getTime();
        const alreadyBooked = appointments.some(
          (appointment) =>
            String(appointment.specialistId) === String(specialist.id) &&
            appointment.date === slot.date &&
            appointment.time === slot.time &&
            appointment.status !== 'CANCELLED'
        );
        const pendingRequest = requests.some(
          (request) =>
            String(request.providerId) === String(specialist.id) &&
            request.appointmentDate === slot.date &&
            request.appointmentTime === slot.time &&
            (
              ['ACCEPTED', 'PAID', 'APPOINTMENT_CONFIRMED', 'IN_PROGRESS'].includes(request.status) ||
              (
                ['PENDING_PROVIDER', 'WAITING_PAYMENT'].includes(request.status) &&
                (!request.appointmentHoldExpiresAt ||
                  new Date(request.appointmentHoldExpiresAt).getTime() > Date.now())
              )
            )
        );
        return startsAt > Date.now() && !alreadyBooked && !pendingRequest;
      })
      .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
  const eligibleSpecialists = specialists.filter(
    (specialist) =>
      specialist.status === 'active' &&
      specialist.professionalDetailsVerified === true &&
      professionalRoles.includes(specialist.roleSlug) &&
       Boolean(getServiceForProvider(specialist.id)) &&
       getAvailableSlots(specialist).some((slot) => Number(slot.durationMinutes) >= requiredDurationMinutes)
  );
  const selectedSpecialist = eligibleSpecialists.find(
    (specialist) => String(specialist.id) === String(selectedSpecialistId)
  );
  const selectedProviderService = selectedSpecialist
    ? getServiceForProvider(selectedSpecialist.id) ?? selectedService
    : selectedService;
  const availableSlots = selectedSpecialist
    ? getAvailableSlots(selectedSpecialist).filter(
        (slot) => Number(slot.durationMinutes) >= requiredDurationMinutes
      )
    : [];
  const selectedSlot = availableSlots.find(
    (slot) => `${slot.date}|${slot.time}` === selectedSlotKey
  );
  const appointmentDuration = selectedService?.durationMinutes ?? selectedSlot?.durationMinutes;

  const handleCreateAppointmentRequest = async () => {
    if (!selectedProviderService || !currentUser || !selectedSpecialist || !selectedSlot || !serviceTermsAccepted) {
      setSubmissionError('يرجى اختيار مختص وموعد متاح والموافقة على شروط الخدمة وسياسة الإلغاء.');
      return;
    }
    const slotStillAvailable = getAvailableSlots(selectedSpecialist).some(
      (slot) => slot.date === selectedSlot.date && slot.time === selectedSlot.time
    );
    if (!slotStillAvailable) {
      setSelectedSlotKey(null);
      setSubmissionError('هذا الموعد لم يعد متاحاً. اختر موعداً آخر من الأوقات المتاحة.');
      setStep(6);
      return;
    }

    setIsSubmitting(true);
    setSubmissionError('');
    try {
      await onSubmit(
        selectedProviderService.id,
        isUrgent === 'yes' ? 'Critical' : 'High',
        legalDraft?.wilaya ?? currentUser.wilayaName ?? '16. الجزائر العاصمة',
        `${consultationTopic ? `[موضوع الاستشارة: ${consultationTopic}] ` : ''}[لمن الحالة: ${targetPerson === 'self' ? 'أنا' : 'أحد أفراد أسرتي'}] ${problemDescription}`,
        {
          specialistId: selectedSpecialist.id,
          specialistName: `${selectedSpecialist.firstName} ${selectedSpecialist.lastName}`.trim(),
          appointmentDate: selectedSlot.date,
          appointmentTime: selectedSlot.time,
          durationMinutes: appointmentDuration,
          appointmentHoldExpiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
          consultationTopic,
          paymentMethod,
          assessment:
            selectedService.category === 'legal'
              ? { hasLegalProblem, hasSummons, isUrgent }
              : { isUrgent },
        }
      );
      setBookingRequestCreated(true);
      setStep(7);
    } catch {
      setSubmissionError('تعذر تسجيل طلب الموعد. تحقق من الاتصال أو صلاحيات الحساب ثم حاول مجدداً.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 max-w-2xl mx-auto py-2">
      <GuidanceProgress activeStep={step === 7 ? 6 : step === 6 ? 5 : step === 5 ? 4 : 3} />

      {/* ================= STEP 1: طبيعة المساعدة ================= */}
      {step === 1 && (
        <div className="bg-[#FBFDFC] rounded-[20px] border border-[#E0E8E6] p-6 shadow-xs space-y-4">
          <div>
            <h2 className="text-[17px] font-black text-[#203945]">
              الخطوة 1 — طبيعة الطلب
            </h2>
            <p className="text-xs text-[#203945]/70 mt-1">
              ما نوع المساعدة التي تحتاج إليها من منصة الفرصة الثانية؟
            </p>
          </div>

          <div className="space-y-2">
            {consultationServices.map((service) => (
              <div
                key={service.id}
                onClick={() => setSelectedServiceId(service.id)}
                className={`p-4 rounded-[14px] border cursor-pointer transition-all flex items-center justify-between gap-3 ${
                  selectedService?.id === service.id
                    ? 'bg-[#EAF3F8] border-[#1766A6] shadow-xs'
                    : 'bg-white border-[#E0E8E6] hover:bg-[#F3F7F6]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">
                    {service.category === 'legal' ? '⚖️' : '🧠'}
                  </span>
                  <div>
                    <h4 className="font-bold text-sm text-[#203945]">{service.title}</h4>
                    <p className="text-[11px] text-[#1766A6] font-bold">
                      {categoryLabels[service.category] || service.category} · {service.amountDzd.toLocaleString('ar-DZ')} دج
                    </p>
                    {service.providerName && (
                      <p className="text-[11px] text-[#203945]/70">مقدم الخدمة: {service.providerName}</p>
                    )}
                    <p className="text-[11px] text-[#203945]/70">{service.description}</p>
                  </div>
                </div>
                <div
                  className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                    selectedService?.id === service.id
                      ? 'border-[#1766A6] bg-[#1766A6] text-white'
                      : 'border-[#CCD8D5] bg-white'
                  }`}
                >
                  {selectedService?.id === service.id && <Check className="w-3 h-3" />}
                </div>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-[#E0E8E6] flex justify-between items-center">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-xs font-bold text-[#203945]/70 hover:text-[#203945]"
            >
              إلغاء والعودة
            </button>
            <button
              type="button"
              onClick={() => setStep(2)}
              className="px-6 py-2.5 rounded-[12px] bg-[#1766A6] hover:bg-[#125386] text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5"
            >
              <span>المتابعة إلى الخطوة التالية</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ================= STEP 2: لمن تتعلق الحالة؟ ================= */}
      {step === 2 && (
        <div className="bg-[#FBFDFC] rounded-[20px] border border-[#E0E8E6] p-6 shadow-xs space-y-4">
          <div>
            <h2 className="text-[17px] font-black text-[#203945]">
              الخطوة 2 — لمن تتعلق الحالة؟
            </h2>
            <p className="text-xs text-[#203945]/70 mt-1">
              حدد الطرف المستفيد لتخصيص خطة المرافقة والدعم المناسبة
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div
              onClick={() => setTargetPerson('self')}
              className={`p-5 rounded-[16px] border cursor-pointer transition-all space-y-2 flex flex-col justify-between ${
                targetPerson === 'self'
                  ? 'bg-[#EAF3F8] border-[#1766A6] shadow-xs'
                  : 'bg-white border-[#E0E8E6] hover:bg-[#F3F7F6]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl">👤</span>
                <span className="text-xs font-bold text-[#1766A6]">مستفيد مباشر</span>
              </div>
              <div>
                <h4 className="font-bold text-sm text-[#203945]">الحالة تخصني أنا شخصياً</h4>
                <p className="text-[11px] text-[#203945]/70 mt-1">
                  أبحث عن المساعدة المناسبة للخدمة التي اخترتها بسرية تامة.
                </p>
              </div>
              <div className="pt-2 text-right">
                <span className="text-xs font-bold text-[#1766A6]">
                  {targetPerson === 'self' ? '✓ تم التحديد' : 'تحديد ←'}
                </span>
              </div>
            </div>

            <div
              onClick={() => setTargetPerson('family')}
              className={`p-5 rounded-[16px] border cursor-pointer transition-all space-y-2 flex flex-col justify-between ${
                targetPerson === 'family'
                  ? 'bg-[#EAF3F8] border-[#1766A6] shadow-xs'
                  : 'bg-white border-[#E0E8E6] hover:bg-[#F3F7F6]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl">👨‍👩‍👧</span>
                <span className="text-xs font-bold text-[#25866D]">دعم الأسرة</span>
              </div>
              <div>
                <h4 className="font-bold text-sm text-[#203945]">أنا أحد أفراد الأسرة</h4>
                <p className="text-[11px] text-[#203945]/70 mt-1">
                  أطلب المساعدة لأحد أفراد أسرتي وفق نوع الخدمة المختارة.
                </p>
              </div>
              <div className="pt-2 text-right">
                <span className="text-xs font-bold text-[#25866D]">
                  {targetPerson === 'family' ? '✓ تم التحديد' : 'تحديد ←'}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-[#E0E8E6] flex justify-between items-center">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-4 py-2 text-xs font-bold text-[#203945]/70 hover:text-[#203945]"
            >
              السابق
            </button>
            <button
              type="button"
              onClick={() => setStep(3)}
              className="px-6 py-2.5 rounded-[12px] bg-[#1766A6] hover:bg-[#125386] text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5"
            >
              <span>المتابعة</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ================= STEP 3: وصف المشكلة وإرفاق وثيقة ================= */}
      {step === 3 && (
        <div className="bg-[#FBFDFC] rounded-[20px] border border-[#E0E8E6] p-6 shadow-xs space-y-4">
          <div>
            <h2 className="text-[17px] font-black text-[#203945]">
              {selectedService?.category === 'legal'
                ? 'الاستشارة القانونية'
                : selectedService?.category === 'psychological'
                  ? 'الشاشة 07 — الاستشارة النفسية'
                  : 'الخطوة 3 — وصف الاحتياج'}
            </h2>
            {selectedService?.category === 'legal' ? (
              <>
                <p className="text-xs text-[#203945]/70 mt-1">
                  استشارة مباشرة مع مستشار قانوني مؤهل لفهم الوضعية القانونية والإجراءات والمسارات الممكنة ضمن اختصاصه.
                </p>
                <p className="mt-1 text-sm font-black text-[#25866D]">السعر: {selectedService.amountDzd.toLocaleString('ar-DZ')} دج</p>
              </>
            ) : selectedService?.category === 'psychological' ? (
              <>
                <p className="text-xs text-[#203945]/70 mt-1">
                  استشارة مباشرة مع مختص نفسي عيادي مؤهل لتقديم الدعم النفسي والإرشاد ضمن اختصاصه المهني.
                </p>
                <p className="mt-1 text-sm font-black text-[#25866D]">السعر: {selectedService.amountDzd.toLocaleString('ar-DZ')} دج</p>
              </>
            ) : (
              <p className="text-xs text-[#203945]/70 mt-1">
                اشرح احتياجك باختصار حتى يتمكن مقدم خدمة {categoryLabels[selectedService?.category ?? ''] || 'المساعدة'} من فهم طلبك.
              </p>
            )}
          </div>

          {(selectedService?.category === 'psychological' || selectedService?.category === 'legal') && (
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#203945]">
                {selectedService.category === 'psychological' ? 'موضوع الاستشارة' : 'ما موضوع استشارتك؟'}
              </label>
              <select
                required
                value={consultationTopic}
                onChange={(e) => setConsultationTopic(e.target.value)}
                className="w-full h-11 px-3 bg-white border border-[#CCD8D5] rounded-[10px] text-xs font-bold text-[#203945]"
              >
                {(selectedService.category === 'psychological' ? psychologicalTopics : legalTopics).map((topic) => (
                  <option key={topic} value={topic}>{topic}</option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[#203945]" htmlFor="consultation-need-description">
              {selectedService?.category === 'legal'
                ? 'اشرح لنا سؤالك أو وضعيتك'
                : selectedService?.category === 'psychological'
                  ? 'وصف احتياجك:'
                  : 'وصف مختصر للحالة:'}
            </label>
            <textarea
              id="consultation-need-description"
              required
              rows={4}
              value={problemDescription}
              onChange={(e) => setProblemDescription(e.target.value)}
              placeholder="اكتب هنا تفاصيل الحالة واحتياجك إلى الخدمة المختارة..."
              className="w-full p-3.5 bg-white border border-[#CCD8D5] rounded-[12px] text-xs text-[#203945] outline-hidden focus:border-[#1766A6] leading-relaxed resize-none"
            />
          </div>

          <p className="rounded-[14px] border border-[#E0E8E6] bg-[#F3F7F6] p-3.5 text-xs leading-6 text-[#203945]/75">
            يمكن رفع الوثائق المشفرة بعد إرسال الطلب من تبويب «الملفات» في حسابك؛ اختيار ملف هنا قبل إنشاء الطلب لن يحفظه.
          </p>

          {selectedService?.category === 'psychological' && (
            <div className="rounded-[12px] border border-[#DCEBF4] bg-[#EAF3F8] p-3 text-xs leading-relaxed text-[#104A78]">
              <strong className="block mb-1">تنبيه الخصوصية</strong>
              شارك المعلومات الضرورية للاستشارة فقط. تُستخدم التفاصيل لمعالجة طلبك، ولا تُعد إجابات التوجيه تشخيصًا طبيًا.
            </div>
          )}

          {selectedService?.category === 'legal' && (
            <div
              role="note"
              aria-label="تنبيه الخصوصية ونطاق الاستشارة القانونية"
              className="rounded-[12px] border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-950 space-y-1"
            >
              <strong className="block">تنبيه الخصوصية ونطاق الاستشارة</strong>
              شارك المعلومات والوثائق الضرورية فقط. تُستخدم التفاصيل لفهم طلبك ومعالجته بسرية.
              الاستشارة لا تعني صدور حكم قضائي أو قرار رسمي، ولا تعني تلقائيًا تمثيلك أمام الجهات القضائية.
            </div>
          )}

          <div className="pt-3 border-t border-[#E0E8E6] flex justify-between items-center">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="px-4 py-2 text-xs font-bold text-[#203945]/70 hover:text-[#203945]"
            >
              السابق
            </button>
            <button
              type="button"
              disabled={!problemDescription.trim()}
              onClick={() => setStep(4)}
              className="px-6 py-2.5 rounded-[12px] bg-[#1766A6] hover:bg-[#125386] disabled:opacity-50 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5"
            >
              <span>{selectedService?.category === 'psychological' ? 'المتابعة إلى اختيار المختص' : 'المتابعة إلى التوجيه الأولي'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ================= STEP 4: تقييم أولي مناسب للخدمة ================= */}
      {step === 4 && (
        <div className="bg-[#FBFDFC] rounded-[20px] border border-[#E0E8E6] p-6 shadow-xs space-y-4">
          <div>
            <h2 className="text-[17px] font-black text-[#203945]">
              الخطوة 4 — شاشة التقييم الأولي
            </h2>
            <p className="text-xs text-[#203945]/70 mt-1">
              تساعدنا إجاباتك على توجيه طلبك إلى مقدم الخدمة المناسب. هذه المعلومات سرية.
            </p>
          </div>

          {selectedService?.category === 'legal' && (
            <>
          <div className="bg-white p-4 rounded-[14px] border border-[#E0E8E6] space-y-2">
            <h4 className="font-bold text-xs sm:text-sm text-[#203945]">
              السؤال 1: هل لديك حالياً مشكلة قانونية أو استفسار مرتبط بالحالة؟
            </h4>
            <div className="flex items-center gap-4 text-xs font-medium text-[#203945]">
              {[
                { val: 'yes', label: 'نعم' },
                { val: 'no', label: 'لا' },
                { val: 'unknown', label: 'لا أعرف' },
              ].map((opt) => (
                <label key={opt.val} className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="q1"
                    checked={hasLegalProblem === opt.val}
                    onChange={() => setHasLegalProblem(opt.val as any)}
                    className="accent-[#1766A6]"
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Question 2 */}
          <div className="bg-white p-4 rounded-[14px] border border-[#E0E8E6] space-y-2">
            <h4 className="font-bold text-xs sm:text-sm text-[#203945]">
              السؤال 2: هل توجد وثائق أو استدعاء رسمي من جهة معينة؟
            </h4>
            <div className="flex items-center gap-4 text-xs font-medium text-[#203945]">
              {[
                { val: 'yes', label: 'نعم' },
                { val: 'no', label: 'لا' },
              ].map((opt) => (
                <label key={opt.val} className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="q2"
                    checked={hasSummons === opt.val}
                    onChange={() => setHasSummons(opt.val as any)}
                    className="accent-[#1766A6]"
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
          </div>
            </>
          )}

          {/* سؤال الأولوية مشترك بين جميع أنواع الخدمات */}
          <div className="bg-white p-4 rounded-[14px] border border-[#E0E8E6] space-y-2">
            <h4 className="font-bold text-xs sm:text-sm text-[#203945]">
              السؤال 3: هل تحتاج إلى موعد عاجل ذو أولوية قصوى؟
            </h4>
            <div className="flex items-center gap-4 text-xs font-medium text-[#203945]">
              {[
                { val: 'yes', label: 'نعم (عاجل جداً)' },
                { val: 'no', label: 'لا (موعد عادي)' },
              ].map((opt) => (
                <label key={opt.val} className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="q3"
                    checked={isUrgent === opt.val}
                    onChange={() => setIsUrgent(opt.val as any)}
                    className="accent-[#1766A6]"
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-[#E0E8E6] flex justify-between items-center">
            <button
              type="button"
              onClick={() => setStep(3)}
              className="px-4 py-2 text-xs font-bold text-[#203945]/70 hover:text-[#203945]"
            >
              السابق
            </button>
            <button
              type="button"
              onClick={() => setStep(5)}
              className="px-6 py-2.5 rounded-[12px] bg-[#1766A6] hover:bg-[#125386] text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5"
            >
              <span>عرض الخدمة المناسبة وحجز الموعد</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ================= STEP 5: الشاشة 08 — اختيار المختص ================= */}
      {step === 5 && (
        <div className="bg-[#FBFDFC] rounded-[20px] border border-[#E0E8E6] p-6 shadow-xs space-y-5">
          <div>
            <h2 className="text-[17px] font-black text-[#203945]">
              الشاشة 08: اختيار المختص
            </h2>
            <p className="text-xs text-[#203945]/70 mt-1">
              اختر مختصاً متاحاً للاستشارة المطلوبة. لا نعرض إلا البيانات المهنية الموثقة والمواعيد المتاحة.
            </p>
          </div>

          <div className="space-y-3">
            {eligibleSpecialists.length === 0 ? (
              <div className="rounded-[14px] border border-[#E0E8E6] bg-white p-5 text-center text-sm text-[#203945]/70">
                لا يوجد حالياً مختص معتمد نشر موعداً متاحاً لهذه الاستشارة. سيظهر المختص هنا بعد اعتماد حسابه وإضافة مواعيده من لوحة المختص.
              </div>
            ) : eligibleSpecialists.map((specialist) => {
              const slots = getAvailableSlots(specialist).filter(
                (slot) => Number(slot.durationMinutes) >= requiredDurationMinutes
              );
              const isSelected = String(selectedSpecialistId) === String(specialist.id);
              return (
                <article
                  key={specialist.id}
                  className={`space-y-3 rounded-[16px] border bg-white p-4 ${
                    isSelected ? 'border-[#1766A6] ring-1 ring-[#1766A6]' : 'border-[#E0E8E6]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-black text-sm text-[#203945]">
                        {specialist.firstName} {specialist.lastName}
                      </h3>
                      <p className="mt-1 text-xs font-bold text-[#1766A6]">
                        {['psychologist', 'doctor'].includes(specialist.roleSlug) ? 'أخصائي نفسي عيادي' : 'مستشار قانوني'}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs font-black text-[#25866D]">
                      {getServiceForProvider(specialist.id)?.amountDzd.toLocaleString('ar-DZ')} دج
                    </span>
                  </div>

                  {(specialist.specialty || specialist.subSpecialty || specialist.licenseNumber || specialist.wilayaName) && (
                    <div className="space-y-1 text-xs text-[#203945]/75">
                      {specialist.specialty && <p>الاختصاص: {specialist.specialty}</p>}
                      {specialist.subSpecialty && <p>الاختصاص الفرعي: {specialist.subSpecialty}</p>}
                      {specialist.licenseNumber && <p>رقم الاعتماد: {specialist.licenseNumber}</p>}
                      {specialist.wilayaName && <p>الولاية: {specialist.wilayaName}</p>}
                    </div>
                  )}

                  <div className="space-y-1">
                    <p className="text-xs font-bold text-[#203945]">المواعيد المتاحة</p>
                    {slots.map((slot) => (
                      <p key={`${slot.date}|${slot.time}`} className="text-xs text-[#203945]/70">
                        {slot.date} — {slot.time}
                        {(selectedService?.durationMinutes ?? slot.durationMinutes) &&
                          ` · ${selectedService?.durationMinutes ?? slot.durationMinutes} دقيقة`}
                      </p>
                    ))}
                  </div>
                  <button
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => {
                      setSelectedSpecialistId(specialist.id);
                      setSelectedSlotKey(null);
                      setSubmissionError('');
                    }}
                    className={`w-full rounded-[10px] px-4 py-2.5 text-xs font-bold ${
                      isSelected ? 'bg-[#EAF3F8] text-[#1766A6]' : 'bg-[#1766A6] text-white hover:bg-[#125386]'
                    }`}
                  >
                    {isSelected ? 'تم اختيار المختص' : 'اختيار المختص'}
                  </button>
                </article>
              );
            })}
          </div>

          <div className="rounded-[12px] border border-[#DCEBF4] bg-[#EAF3F8] p-3 text-xs text-[#104A78]">
            اختر مختصاً من القائمة أعلاه للانتقال إلى المواعيد المتاحة وحجز الموعد.
          </div>

          {submissionError && (
            <p role="alert" className="rounded-[10px] bg-red-50 border border-red-200 px-3 py-2 text-xs font-bold text-red-700">
              {submissionError}
            </p>
          )}
          <div className="pt-3 border-t border-[#E0E8E6] flex justify-between items-center">
            <button
              type="button"
              onClick={() => setStep(4)}
              className="px-4 py-2 text-xs font-bold text-[#203945]/70 hover:text-[#203945]"
            >
              السابق
            </button>
            <button
              type="button"
              disabled={!selectedSpecialist}
              onClick={() => setStep(6)}
              className="px-6 py-2.5 rounded-[12px] bg-[#1766A6] hover:bg-[#125386] disabled:opacity-50 text-white font-bold text-xs sm:text-sm shadow-xs transition-colors flex items-center gap-2"
            >
              <span>المتابعة إلى حجز الموعد</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ================= STEP 6: الشاشة 09 — حجز الموعد ================= */}
      {step === 6 && (
        <div className="bg-[#FBFDFC] rounded-[20px] border border-[#E0E8E6] p-6 shadow-xs space-y-5">
          <div>
            <h2 className="text-[17px] font-black text-[#203945]">الشاشة 09: حجز الموعد</h2>
            <p className="text-xs text-[#203945]/70 mt-1">اختر موعداً ما زال متاحاً للمختص المحدد.</p>
          </div>

          <div className="rounded-[16px] border border-[#DCEBF4] bg-[#EAF3F8] p-4 space-y-2 text-xs text-[#203945]">
            <p><strong>الخدمة:</strong> {selectedProviderService?.title}</p>
            <p><strong>المختص:</strong> {selectedSpecialist ? `${selectedSpecialist.firstName} ${selectedSpecialist.lastName}` : '—'}</p>
            <p><strong>السعر:</strong> {selectedProviderService?.amountDzd.toLocaleString('ar-DZ')} دج</p>
            <p><strong>مدة الخدمة:</strong> {appointmentDuration ? `${appointmentDuration} دقيقة` : 'غير محددة'}</p>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-bold text-[#203945]">التاريخ والساعة المتاحان</h3>
            {availableSlots.length === 0 ? (
              <p className="rounded-[12px] bg-amber-50 p-3 text-xs text-amber-900">
                لم تعد هناك مواعيد متاحة لهذا المختص. ارجع واختر مختصاً آخر.
              </p>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {availableSlots.map((slot) => {
                  const key = `${slot.date}|${slot.time}`;
                  const isSelected = selectedSlotKey === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => {
                        setSelectedSlotKey(key);
                        setSubmissionError('');
                      }}
                      className={`rounded-[12px] border p-3 text-right text-xs font-bold ${
                        isSelected
                          ? 'border-[#1766A6] bg-[#EAF3F8] text-[#104A78]'
                          : 'border-[#E0E8E6] bg-white text-[#203945] hover:border-[#1766A6]'
                      }`}
                    >
                      <Calendar className="ml-1 inline h-4 w-4" />
                      {slot.date}
                      <Clock className="mr-3 ml-1 inline h-4 w-4" />
                      {slot.time}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <label className="flex items-start gap-2 rounded-[12px] border border-[#E0E8E6] bg-white p-3 text-xs leading-relaxed text-[#203945]">
            <input
              type="checkbox"
              checked={serviceTermsAccepted}
              onChange={(event) => setServiceTermsAccepted(event.target.checked)}
              className="mt-0.5 accent-[#1766A6]"
            />
            <span>أوافق على شروط الخدمة وسياسة الإلغاء.</span>
          </label>

          {submissionError && (
            <p role="alert" className="rounded-[10px] border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700">
              {submissionError}
            </p>
          )}

          <div className="flex items-center justify-between border-t border-[#E0E8E6] pt-3">
            <button type="button" onClick={() => setStep(5)} className="px-4 py-2 text-xs font-bold text-[#203945]/70">
              السابق
            </button>
            <button
              type="button"
              disabled={!selectedSlot || !serviceTermsAccepted || isSubmitting || !appointmentDuration}
              onClick={handleCreateAppointmentRequest}
              className="flex items-center gap-2 rounded-[12px] bg-[#1766A6] px-6 py-2.5 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span>{isSubmitting ? 'جارٍ حفظ الطلب...' : 'الانتقال إلى الدفع'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* ================= STEP 7: الشاشة 10 — الدفع ================= */}
      {step === 7 && (
        <div className="bg-[#FBFDFC] rounded-[20px] border border-[#E0E8E6] p-6 shadow-xs space-y-5">
          <div>
            <h2 className="text-[17px] font-black text-[#203945]">الشاشة 10: إتمام الدفع</h2>
            <p className="text-xs text-[#203945]/70 mt-1">راجع تفاصيل الخدمة واختر طريقة الدفع.</p>
          </div>

          <div className="rounded-[16px] border border-[#DCEBF4] bg-[#EAF3F8] p-4 space-y-2 text-xs text-[#203945]">
            <p><strong>الخدمة:</strong> {selectedService?.title}</p>
            <p><strong>المبلغ المستحق:</strong> {selectedService?.amountDzd.toLocaleString('ar-DZ')} دج</p>
          </div>

          <fieldset className="space-y-2">
            <legend className="text-sm font-bold text-[#203945]">طريقة الدفع</legend>
            {([
              { value: 'CIB', title: 'CIB — الدفع بواسطة بطاقة CIB' },
              { value: 'EDAHABIA', title: 'EDAHABIA — الدفع بواسطة البطاقة الذهبية' },
            ] as const).map((method) => (
              <label
                key={method.value}
                className={`flex cursor-pointer items-center gap-3 rounded-[12px] border bg-white p-3 text-xs font-bold ${
                  paymentMethod === method.value ? 'border-[#1766A6] bg-[#EAF3F8]' : 'border-[#E0E8E6]'
                }`}
              >
                <input
                  type="radio"
                  name="legal-consultation-payment-method"
                  value={method.value}
                  checked={paymentMethod === method.value}
                  onChange={() => setPaymentMethod(method.value)}
                  className="accent-[#1766A6]"
                />
                {method.title}
              </label>
            ))}
          </fieldset>

          <div role="note" className="flex items-start gap-2 rounded-[12px] border border-[#DCEBF4] bg-[#EAF3F8] p-3 text-xs leading-relaxed text-[#104A78]">
            <Shield className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              تتم معالجة الدفع عبر مزود الدفع المعتمد. لا تحتفظ المنصة ببيانات البطاقة الحساسة مثل رقم البطاقة الكامل أو رمز CVV أو الرقم السري أو رمز OTP.
            </p>
          </div>

          {bookingRequestCreated && (
            <p className="rounded-[12px] border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-950">
              تم تسجيل طلب الموعد وهو بانتظار قبول المختص. لن يُخصم أي مبلغ قبل إتمام الدفع عبر مزود معتمد وتأكيده.
            </p>
          )}

          {submissionError && (
            <p role="alert" className="rounded-[10px] border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700">
              {submissionError}
            </p>
          )}

          <div className="flex items-center justify-between border-t border-[#E0E8E6] pt-3">
            <button
              type="button"
              onClick={() => onNavigateToPortal ? onNavigateToPortal() : onCancel()}
              className="px-4 py-2 text-xs font-bold text-[#203945]/70"
            >
              العودة إلى الطلبات
            </button>
            <button
              type="button"
              onClick={() => setSubmissionError('بوابة الدفع غير مهيأة في هذا المشروع؛ لم يتم تنفيذ الدفع أو تسجيله كعملية ناجحة.')}
              className="rounded-[12px] bg-[#25866D] px-6 py-2.5 text-xs font-bold text-white hover:bg-[#1E6F5A]"
            >
              الدفع الآن — {selectedService?.amountDzd.toLocaleString('ar-DZ')} دج
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
