import React, { useState } from 'react';
import { Appointment, CareRequest, ServiceItem, Priority, User } from '../types';
import { GuidanceProgress } from '../components/GuidanceProgress';
import {
  Check,
  Calendar,
  Clock,
  FileText,
  Upload,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Shield,
  HelpCircle,
  FileCheck,
  Receipt,
  User as UserIcon,
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
  // Step state: service, beneficiary, consultation, orientation, specialist, appointment
  // 1: طبيعة المساعدة
  // 2: لمن تتعلق الحالة؟
  // 3: وصف المشكلة وإرفاق وثيقة
  // 4: التقييم الأولي (الأسئلة الثلاثة)
  // 5: اختيار المختص
  // 6: الموعد وشروط الخدمة
  const [step, setStep] = useState<number>(legalDraft ? 5 : 1);

  // Form states
  const [selectedServiceId, setSelectedServiceId] = useState<number>(
    preselectedServiceId ?? services[0]?.id ?? 0
  );
  const [targetPerson, setTargetPerson] = useState<'self' | 'family'>(initialTargetPerson ?? 'self');
  const [problemDescription, setProblemDescription] = useState<string>(legalDraft?.description ?? '');
  const [attachedFileName, setAttachedFileName] = useState<string | null>(legalDraft?.attachedDocs[0] ?? null);
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
    social: 'المرافقة الاجتماعية',
    legal: 'المساعدة القانونية',
    treatment: 'العلاج وإعادة الإدماج',
    medical: 'الدعم الطبي',
  };
  const selectedService =
    services.find((service) => service.id === selectedServiceId) ??
    services.find((service) => service.id === preselectedServiceId) ??
    services[0];

  // Assessment answers (Requirement 9 & 21 from Project Plan)
  const [hasLegalProblem, setHasLegalProblem] = useState<'yes' | 'no' | 'unknown'>('no');
  const [hasSummons, setHasSummons] = useState<'yes' | 'no'>('no');
  const [isUrgent, setIsUrgent] = useState<'yes' | 'no'>('no');

  const [selectedSpecialistId, setSelectedSpecialistId] = useState<number | string | null>(null);
  const [selectedSlotKey, setSelectedSlotKey] = useState<string | null>(null);
  const [serviceTermsAccepted, setServiceTermsAccepted] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'EDAHABIA' | 'CIB'>('EDAHABIA');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submissionError, setSubmissionError] = useState<string>('');

  const professionalRoles =
    selectedService?.category === 'legal'
      ? ['lawyer', 'legal_advisor']
      : selectedService?.category === 'psychological'
        ? ['psychologist']
        : selectedService?.category === 'medical'
          ? ['doctor']
          : [];
  const eligibleSpecialists = specialists.filter(
    (specialist) =>
      specialist.status === 'active' &&
      professionalRoles.includes(specialist.roleSlug) &&
      (specialist.availabilitySlots ?? []).some((slot) => {
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
            request.status === 'WAITING_PAYMENT' &&
            (!request.appointmentHoldExpiresAt ||
              new Date(request.appointmentHoldExpiresAt).getTime() > Date.now())
        );
        const hasDuration = Boolean(selectedService?.durationMinutes || slot.durationMinutes);
        return startsAt > Date.now() && !alreadyBooked && !pendingRequest && hasDuration;
      })
  );
  const selectedSpecialist = eligibleSpecialists.find(
    (specialist) => String(specialist.id) === String(selectedSpecialistId)
  );
  const availableSlots =
    selectedSpecialist?.availabilitySlots
      ?.filter((slot) => {
        const startsAt = new Date(`${slot.date}T${slot.time}:00`).getTime();
        const alreadyBooked = appointments.some(
          (appointment) =>
            String(appointment.specialistId) === String(selectedSpecialist.id) &&
            appointment.date === slot.date &&
            appointment.time === slot.time &&
            appointment.status !== 'CANCELLED'
        );
        const pendingRequest = requests.some(
          (request) =>
            String(request.providerId) === String(selectedSpecialist.id) &&
            request.appointmentDate === slot.date &&
            request.appointmentTime === slot.time &&
            request.status === 'WAITING_PAYMENT' &&
            (!request.appointmentHoldExpiresAt ||
              new Date(request.appointmentHoldExpiresAt).getTime() > Date.now())
        );
        return startsAt > Date.now() && !alreadyBooked && !pendingRequest;
      })
      .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`)) ?? [];
  const selectedSlot = availableSlots.find(
    (slot) => `${slot.date}|${slot.time}` === selectedSlotKey
  );
  const appointmentDuration = selectedService?.durationMinutes ?? selectedSlot?.durationMinutes;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAttachedFileName(e.target.files[0].name);
    }
  };

  const handleContinueToPayment = async () => {
    if (!selectedService || !currentUser || !selectedSpecialist || !selectedSlot || !serviceTermsAccepted) {
      setSubmissionError('يرجى اختيار مختص وموعد متاح والموافقة على شروط الخدمة وسياسة الإلغاء.');
      return;
    }
    setIsSubmitting(true);
    setSubmissionError('');

    try {
      await onSubmit(
        selectedService.id,
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
          attachedDocs: attachedFileName ? [attachedFileName] : [],
          paymentMethod,
          assessment:
            selectedService.category === 'legal'
              ? { hasLegalProblem, hasSummons, isUrgent }
              : { isUrgent },
        }
      );
    } catch {
      setSubmissionError('تعذر تسجيل الموعد المعلّق. تحقق من الاتصال أو صلاحيات الحساب ثم حاول مجدداً.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 max-w-2xl mx-auto py-2">
      <GuidanceProgress activeStep={step === 6 ? 5 : step === 5 ? 4 : 3} />

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
            {services.map((service) => (
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
                    {service.category === 'legal' ? '⚖️' :
                     service.category === 'psychological' ? '🧠' :
                     service.category === 'social' ? '🤝' :
                     service.category === 'treatment' ? '🌱' : '🩺'}
                  </span>
                  <div>
                    <h4 className="font-bold text-sm text-[#203945]">{service.title}</h4>
                    <p className="text-[11px] text-[#1766A6] font-bold">
                      {categoryLabels[service.category] || service.category}
                    </p>
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
              {selectedService?.category === 'psychological'
                ? 'الشاشة 07 — الاستشارة النفسية'
                : 'الخطوة 3 — وصف الاحتياج'}
            </h2>
            {selectedService?.category === 'psychological' ? (
              <>
                <p className="text-xs text-[#203945]/70 mt-1">
                  استشارة مباشرة مع مختص نفسي عيادي مؤهل لتقديم الدعم النفسي والإرشاد ضمن اختصاصه المهني.
                </p>
                <p className="mt-1 text-sm font-black text-[#25866D]">السعر: 500 دج</p>
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
              {selectedService?.category === 'psychological' ? 'وصف احتياجك:' : 'وصف مختصر للحالة:'}
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

          {/* Document Upload (Optional per Prototype) */}
          <div className="p-3.5 rounded-[14px] bg-[#F3F7F6] border border-[#E0E8E6] space-y-2">
            <label className="block text-xs font-bold text-[#203945]">
              {selectedService?.category === 'psychological'
                ? 'إرفاق وثيقة عند الحاجة — اختياري:'
                : 'إرفاق وثيقة عند الحاجة — اختياري:'}
            </label>
            <div className="flex items-center gap-3">
              <label className="cursor-pointer px-3.5 py-2 rounded-[10px] bg-white border border-[#CCD8D5] hover:bg-[#EAF3F8] text-[#1766A6] font-bold text-xs flex items-center gap-1.5 transition-colors shadow-2xs">
                <Upload className="w-3.5 h-3.5" />
                <span>[ + رفع ملف ]</span>
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
              <span className="text-xs text-[#203945]/70 truncate max-w-[240px]">
                {attachedFileName ? (
                  <span className="text-emerald-700 font-bold flex items-center gap-1">
                    <FileCheck className="w-3.5 h-3.5" />
                    {attachedFileName}
                  </span>
                ) : (
                  'لم يتم إرفاق ملف (اختياري)'
                )}
              </span>
            </div>
          </div>

          {selectedService?.category === 'psychological' && (
            <div className="rounded-[12px] border border-[#DCEBF4] bg-[#EAF3F8] p-3 text-xs leading-relaxed text-[#104A78]">
              <strong className="block mb-1">تنبيه الخصوصية</strong>
              شارك المعلومات الضرورية للاستشارة فقط. تُستخدم التفاصيل لمعالجة طلبك، ولا تُعد إجابات التوجيه تشخيصًا طبيًا.
            </div>
          )}

          {selectedService?.category === 'legal' && (
            <div className="rounded-[12px] border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-950">
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

      {/* ================= STEP 5: ملخص الطلب واختيار الموعد والدفع ================= */}
      {step === 5 && (
        <div className="bg-[#FBFDFC] rounded-[20px] border border-[#E0E8E6] p-6 shadow-xs space-y-5">
          <div>
            <h2 className="text-[17px] font-black text-[#203945]">
              الخطوة 5 — مراجعة طلبك واختيار الموعد
            </h2>
            <p className="text-xs text-[#203945]/70 mt-1">
              راجع تفاصيل الجلسة، حدد التوقيت المناسب، وأكد حجزك الآمن
            </p>
          </div>

          {/* Summary Card */}
          <div className="bg-[#EAF3F8] rounded-[16px] p-4.5 border border-[#DCEBF4] space-y-3">
            <h4 className="font-black text-sm text-[#104A78]">مراجعة تفاصيل الخدمة:</h4>
            <div className="grid grid-cols-2 gap-2 text-xs text-[#203945]">
              <p>
                <strong>الخدمة:</strong> {selectedService?.title}
              </p>
              <p>
                <strong>المستفيد:</strong> {targetPerson === 'self' ? 'أنا (مباشر)' : 'أحد أفراد الأسرة'}
              </p>
              <p>
                <strong>نوع الخدمة:</strong> {categoryLabels[selectedService?.category ?? ''] || selectedService?.category}
              </p>
              <p>
                <strong>السعر:</strong>{' '}
                <span className="font-bold text-[#25866D]">
                  {selectedService?.amountDzd.toLocaleString('ar-DZ')} دج
                </span>
              </p>
              <p>
                <strong>الأولوية:</strong> {isUrgent === 'yes' ? '🔴 عاجلة' : '🟢 عادية'}
              </p>
            </div>
          </div>

          {/* Appointment Date and Time Selection (Requirement 11 & 23) */}
          <div className="space-y-3">
            <h4 className="font-bold text-sm text-[#203945] flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-[#1766A6]" />
              <span>اختر موعدك:</span>
            </h4>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#203945]">التاريخ:</label>
              <select
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full h-10 px-3 bg-white border border-[#CCD8D5] rounded-[10px] text-xs font-bold text-[#203945]"
              >
                <option value="2026-10-05">الإثنين 05/10/2026</option>
                <option value="2026-10-06">الثلاثاء 06/10/2026</option>
                <option value="2026-10-07">الأربعاء 07/10/2026</option>
                <option value="2026-10-11">الأحد 11/10/2026</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#203945]">
                الأوقات المتاحة (المواعيد غير المتاحة معطلة):
              </label>
              <div className="grid grid-cols-3 gap-2">
                {availableTimeSlots.map((slot) => (
                  <button
                    key={slot.time}
                    type="button"
                    disabled={!slot.available}
                    onClick={() => setSelectedTime(slot.time)}
                    className={`py-2.5 px-3 rounded-[10px] text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                      selectedTime === slot.time && slot.available
                        ? 'bg-[#1766A6] text-white shadow-xs'
                        : slot.available
                        ? 'bg-white border border-[#CCD8D5] text-[#203945] hover:border-[#1766A6]'
                        : 'bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed line-through'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>{slot.time}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Payment Method Selection */}
          <div className="space-y-3 pt-2 border-t border-[#E0E8E6]">
            <h4 className="font-bold text-sm text-[#203945] flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-[#25866D]" />
              <span>طريقة الدفع وتأكيد الحجز:</span>
            </h4>

            <div className="space-y-2">
              <label
                onClick={() => setPaymentMethod('card')}
                className={`p-3.5 rounded-[12px] border cursor-pointer flex items-center justify-between transition-colors ${
                  paymentMethod === 'card'
                    ? 'bg-[#E8F4EF] border-[#25866D]'
                    : 'bg-white border-[#E0E8E6]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <input
                    type="radio"
                    name="payMethod"
                    checked={paymentMethod === 'card'}
                    onChange={() => setPaymentMethod('card')}
                    className="accent-[#25866D]"
                  />
                  <div>
                    <strong className="text-xs text-[#203945] block">
                      الدفع الإلكتروني (البطاقة الذهبية / CIB)
                    </strong>
                    <span className="text-[11px] text-[#203945]/70">
                      المبلغ: {selectedService?.amountDzd.toLocaleString('ar-DZ')} دج
                    </span>
                  </div>
                </div>
                <span className="text-xs font-black text-[#25866D]">
                  {selectedService?.amountDzd.toLocaleString('ar-DZ')} دج
                </span>
              </label>

              <label
                onClick={() => setPaymentMethod('family_package')}
                className={`p-3.5 rounded-[12px] border cursor-pointer flex items-center justify-between transition-colors ${
                  paymentMethod === 'family_package'
                    ? 'bg-[#EAF3F8] border-[#1766A6]'
                    : 'bg-white border-[#E0E8E6]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <input
                    type="radio"
                    name="payMethod"
                    checked={paymentMethod === 'family_package'}
                    onChange={() => setPaymentMethod('family_package')}
                    className="accent-[#1766A6]"
                  />
                  <div>
                    <strong className="text-xs text-[#203945] block">
                      استخدام رصيد باقة الأسرة (Family Plus)
                    </strong>
                    <span className="text-[11px] text-[#1766A6]">
                      خصم تلقائي من رصيد الحصص المتبقية (1 حصة)
                    </span>
                  </div>
                </div>
                <span className="text-xs font-bold text-[#1766A6]">رصيد الباقة</span>
              </label>
            </div>
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
              disabled={isSubmitting}
              onClick={handleConfirmAndPay}
              className="px-6 py-2.5 rounded-[12px] bg-[#25866D] hover:bg-[#1E6F5A] disabled:opacity-50 text-white font-bold text-xs sm:text-sm shadow-xs transition-colors flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'جاري معالجة الدفع وتأكيد الحجز...' : 'الدفع وتأكيد الحجز'}</span>
            </button>
          </div>
        </div>
      )}

      {/* ================= STEP 6: شاشة النجاح الكاملة (Requirement 11 & 25) ================= */}
      {step === 6 && (
        <div className="bg-[#FBFDFC] rounded-[24px] border border-[#25866D]/30 p-6 sm:p-8 shadow-md text-center space-y-5 animate-in fade-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-full bg-[#E8F4EF] text-[#25866D] flex items-center justify-center mx-auto shadow-xs">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-black text-[#203945]">
              تم تأكيد حجزك بنجاح ✓
            </h2>
            <p className="text-xs text-[#203945]/70">
              تم توجيه طلبك إلى مقدم الخدمة المختص وإصدار الفاتورة
            </p>
          </div>

          {/* Details Card from Prototype */}
          <div className="bg-white rounded-[18px] border border-[#E0E8E6] p-5 max-w-md mx-auto text-right space-y-2.5 text-xs shadow-2xs">
            <div className="flex items-center justify-between pb-2 border-b border-[#F0F4F2]">
              <span className="font-bold text-[#203945]/70">رقم الطلب:</span>
              <span className="font-mono font-black text-sm text-[#1766A6]" dir="ltr">
                {createdOrderNumber}
              </span>
            </div>

            <div className="flex items-center justify-between pb-2 border-b border-[#F0F4F2]">
              <span className="font-bold text-[#203945]/70">الخدمة:</span>
               <strong className="text-[#203945]">{selectedService?.title}</strong>
            </div>

            <div className="flex items-center justify-between pb-2 border-b border-[#F0F4F2]">
              <span className="font-bold text-[#203945]/70">التاريخ:</span>
              <span className="font-semibold text-[#203945]">{selectedDate}</span>
            </div>

            <div className="flex items-center justify-between pb-2 border-b border-[#F0F4F2]">
              <span className="font-bold text-[#203945]/70">الوقت:</span>
              <span className="font-semibold text-[#203945]">{selectedTime}</span>
            </div>

            <div className="flex items-center justify-between pb-2 border-b border-[#F0F4F2]">
              <span className="font-bold text-[#203945]/70">المبلغ المدفوع:</span>
              <strong className="text-emerald-700 font-black">
                 {paymentMethod === 'card'
                   ? `${selectedService?.amountDzd.toLocaleString('ar-DZ')} دج`
                   : '0 دج (مغطى برصيد الباقة)'}
              </strong>
            </div>

            <div className="flex items-center justify-between">
              <span className="font-bold text-[#203945]/70">حالة الدفع والحجز:</span>
              <span className="px-2 py-0.5 rounded-full bg-[#E8F4EF] text-[#25866D] font-bold text-[10px]">
                مؤكد ومحجوز / Paid ✓
              </span>
            </div>
          </div>

          {/* Action Buttons from Prototype */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2 max-w-md mx-auto">
            <button
              onClick={() => setShowInvoiceModal(true)}
              className="w-full sm:flex-1 py-2.5 px-4 rounded-[12px] bg-[#EAF3F8] hover:bg-[#DCEBF4] text-[#1766A6] font-bold text-xs flex items-center justify-center gap-1.5 transition-colors border border-[#DCEBF4]"
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>عرض الفاتورة</span>
            </button>

            <button
              onClick={onNavigateToPortal || onCancel}
              className="w-full sm:flex-1 py-2.5 px-4 rounded-[12px] bg-[#1766A6] hover:bg-[#125386] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs"
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span>العودة إلى لوحة التحكم</span>
            </button>
          </div>
        </div>
      )}

      {/* Invoice Modal from Prototype */}
      {showInvoiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-[22px] max-w-md w-full p-6 space-y-4 shadow-2xl border border-[#E0E8E6] text-right text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-[#E0E8E6]">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-[#25866D]" />
                <h3 className="font-black text-sm text-[#203945]">فاتورة المعاملة الرسمية</h3>
              </div>
              <span className="text-[10px] font-mono bg-[#E8F4EF] text-[#25866D] px-2 py-0.5 rounded-full font-bold">
                PAID / مسددة
              </span>
            </div>

            <div className="space-y-2 bg-[#F8FAF9] p-4 rounded-[14px] border border-[#E5ECE9]">
              <p className="flex justify-between">
                <span className="text-[#203945]/70">رقم الفاتورة:</span>
                <span className="font-mono font-bold">INV-{createdOrderNumber.replace(/-/g, '')}</span>
              </p>
              <p className="flex justify-between">
                <span className="text-[#203945]/70">رقم الطلب:</span>
                <span className="font-mono font-bold text-[#1766A6]">{createdOrderNumber}</span>
              </p>
              <p className="flex justify-between">
                <span className="text-[#203945]/70">الخدمة:</span>
                 <span className="font-bold">{selectedService?.title}</span>
              </p>
              <p className="flex justify-between">
                <span className="text-[#203945]/70">التاريخ والوقت:</span>
                <span>{selectedDate} — {selectedTime}</span>
              </p>
              <p className="flex justify-between">
                <span className="text-[#203945]/70">المستفيد:</span>
                <span>{currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'مستفيد المنصة'}</span>
              </p>
              <div className="pt-2 border-t border-[#E0E8E6] flex justify-between font-black text-sm text-[#203945]">
                <span>المجموع المدفوع:</span>
                <span className="text-[#25866D]">
                   {paymentMethod === 'card'
                     ? `${selectedService?.amountDzd.toLocaleString('ar-DZ')} دج`
                     : '0 دج (رصيد الباقة)'}
                </span>
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
                onClick={() => setShowInvoiceModal(false)}
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
