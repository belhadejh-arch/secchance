import React, { useState } from 'react';
import { ServiceItem, Priority, User } from '../types';
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
  preselectedServiceId?: number;
  currentUser?: User | null;
  onSubmit: (
    serviceId: number,
    priority: Priority,
    wilaya: string,
    description: string,
    extraData?: any
  ) => void;
  onCancel: () => void;
  onNavigateToPortal?: () => void;
}

export const NewRequestView: React.FC<NewRequestViewProps> = ({
  services,
  preselectedServiceId,
  currentUser,
  onSubmit,
  onCancel,
  onNavigateToPortal,
}) => {
  // Step state: 1 to 6
  // 1: طبيعة المساعدة
  // 2: لمن تتعلق الحالة؟
  // 3: وصف المشكلة وإرفاق وثيقة
  // 4: التقييم الأولي (الأسئلة الثلاثة)
  // 5: ملخص الطلب واختيار الموعد
  // 6: تأكيد الدفع وشاشة النجاح
  const [step, setStep] = useState<number>(1);

  // Form states
  const [selectedCategory, setSelectedCategory] = useState<string>('استشارة قانونية');
  const [targetPerson, setTargetPerson] = useState<'self' | 'family'>('self');
  const [problemDescription, setProblemDescription] = useState<string>('');
  const [attachedFileName, setAttachedFileName] = useState<string | null>(null);

  // Assessment answers (Requirement 9 & 21 from Project Plan)
  const [hasLegalProblem, setHasLegalProblem] = useState<'yes' | 'no' | 'unknown'>('no');
  const [hasSummons, setHasSummons] = useState<'yes' | 'no'>('no');
  const [isUrgent, setIsUrgent] = useState<'yes' | 'no'>('no');

  // Appointment selection
  const [selectedDate, setSelectedDate] = useState<string>('2026-10-05');
  const [selectedTime, setSelectedTime] = useState<string>('14:00');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'family_package'>('card');

  // Result state
  const [createdOrderNumber, setCreatedOrderNumber] = useState<string>('SC2026-00001-');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState<boolean>(false);

  const availableTimeSlots = [
    { time: '09:00', available: true },
    { time: '10:00', available: false }, // Disabled per plan
    { time: '11:30', available: true },
    { time: '14:00', available: true },
    { time: '15:00', available: false }, // Disabled per plan
    { time: '16:30', available: true },
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAttachedFileName(e.target.files[0].name);
    }
  };

  const handleConfirmAndPay = () => {
    setIsSubmitting(true);

    const generatedNo = `SC2026-${String(Math.floor(1 + Math.random() * 99999)).padStart(5, '0')}-`;
    setCreatedOrderNumber(generatedNo);

    // Map category to matching service
    const matchedService =
      services.find((s) => s.category.includes(selectedCategory) || s.title.includes(selectedCategory)) ||
      services[0];

    setTimeout(() => {
      setIsSubmitting(false);
      setStep(6); // Success screen

      if (currentUser) {
        onSubmit(
          matchedService?.id || 1,
          isUrgent === 'yes' ? 'Critical' : 'High',
          currentUser.wilayaName || '16. الجزائر العاصمة',
          `[لمن الحالة: ${targetPerson === 'self' ? 'أنا' : 'أحد أفراد أسرتي'}] ${problemDescription}`,
          {
            orderNumber: generatedNo,
            appointmentDate: selectedDate,
            appointmentTime: selectedTime,
            assessment: { hasLegalProblem, hasSummons, isUrgent },
            paymentMethod,
          }
        );
      }
    }, 1200);
  };

  return (
    <div className="space-y-4 max-w-2xl mx-auto py-2">
      {/* Progress Stepper (Except on Success screen) */}
      {step < 6 && (
        <div className="bg-[#FBFDFC] border border-[#E0E8E6] rounded-[18px] p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-[#203945] mb-2">
            <span>الخطوة {step} من 5:</span>
            <span className="text-[#1766A6]">
              {step === 1 && 'طبيعة المساعدة'}
              {step === 2 && 'لمن تتعلق الحالة؟'}
              {step === 3 && 'وصف المشكلة والوثائق'}
              {step === 4 && 'التقييم الأولي السريع'}
              {step === 5 && 'مراجعة الموعد والدفع'}
            </span>
          </div>
          <div className="w-full bg-[#E5ECE9] h-2 rounded-full overflow-hidden">
            <div
              className="bg-[#1766A6] h-full transition-all duration-300"
              style={{ width: `${(step / 5) * 100}%` }}
            />
          </div>
        </div>
      )}

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
            {[
              { id: 'استشارة قانونية', title: 'استشارة قانونية', icon: '⚖️', desc: 'توجيه قانوني وإرشاد لحماية المتعالج وفق المادة 6 وقانون مكافحة المخدرات' },
              { id: 'استشارة نفسية', title: 'استشارة ومرافقة نفسية', icon: '🧠', desc: 'جلسات دعم نفسي متخصصة، مرافقة عيادية، وعلاج سلوكي معرفي' },
              { id: 'مرافقة اجتماعية', title: 'مرافقة اجتماعية وتوجيه', icon: '🤝', desc: 'مساعدة وإرشاد للتعامل مع الآثار الاجتماعية وإعادة إدماج المتعافي' },
              { id: 'توجيه نحو العلاج', title: 'توجيه نحو العلاج وإزالة السموم', icon: '🏥', desc: 'المساعدة في الوصول إلى مراكز علاج الإدمان والمؤسسات الاستشفائية المناسبة' },
              { id: 'متابعة حالة', title: 'متابعة حالة مستمرة', icon: '🔄', desc: 'متابعة دورية لحالة مستفيد حالي واستكمال مراحل خطة التعافي' },
            ].map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedCategory(item.id)}
                className={`p-4 rounded-[14px] border cursor-pointer transition-all flex items-center justify-between gap-3 ${
                  selectedCategory === item.id
                    ? 'bg-[#EAF3F8] border-[#1766A6] shadow-xs'
                    : 'bg-white border-[#E0E8E6] hover:bg-[#F3F7F6]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{item.icon}</span>
                  <div>
                    <h4 className="font-bold text-sm text-[#203945]">{item.title}</h4>
                    <p className="text-[11px] text-[#203945]/70">{item.desc}</p>
                  </div>
                </div>
                <div
                  className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                    selectedCategory === item.id
                      ? 'border-[#1766A6] bg-[#1766A6] text-white'
                      : 'border-[#CCD8D5] bg-white'
                  }`}
                >
                  {selectedCategory === item.id && <Check className="w-3 h-3" />}
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
                  أبحث عن استشارة وتوجيه طبي أو نفسي أو قانوني لمساعدتي على التعافي بسرية تامة.
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
                  الحالة تخص ابني/ابنتي أو أحد الأقارب وأرغب في مرافقة قانونية أو نفسية لحمايته وعلاجه.
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
              الخطوة 3 — وصف المشكلة
            </h2>
            <p className="text-xs text-[#203945]/70 mt-1">
              اشرح لنا مشكلتك أو وضع الحالة باختصار لمساعدة المستشار على فهم الوضع بدقة
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[#203945]">
              وصف مختصر للحالة:
            </label>
            <textarea
              required
              rows={4}
              value={problemDescription}
              onChange={(e) => setProblemDescription(e.target.value)}
              placeholder="اكتب هنا تفاصيل الوضع باختصار، مثل: طبيعة المخاوف، الاستفسار القانوني، الأعراض، أو الرغبة في بدء العلاج الطوعي..."
              className="w-full p-3.5 bg-white border border-[#CCD8D5] rounded-[12px] text-xs text-[#203945] outline-hidden focus:border-[#1766A6] leading-relaxed resize-none"
            />
          </div>

          {/* Document Upload (Optional per Prototype) */}
          <div className="p-3.5 rounded-[14px] bg-[#F3F7F6] border border-[#E0E8E6] space-y-2">
            <label className="block text-xs font-bold text-[#203945]">
              إرفاق وثيقة — اختياري (استدعاء، تقرير طبي، أو وثيقة رسمية):
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
              <span>المتابعة إلى التقييم الأولي</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ================= STEP 4: التقييم الأولي السريع (3 أسئلة من الخطة) ================= */}
      {step === 4 && (
        <div className="bg-[#FBFDFC] rounded-[20px] border border-[#E0E8E6] p-6 shadow-xs space-y-4">
          <div>
            <h2 className="text-[17px] font-black text-[#203945]">
              الخطوة 4 — شاشة التقييم الأولي
            </h2>
            <p className="text-xs text-[#203945]/70 mt-1">
              تساعدنا إجاباتك على توجيهك إلى الخدمة والمختص الأنسب لحالتك. هذه المعلومات سرية ولا تشكل قراراً قضائياً.
            </p>
          </div>

          {/* Question 1 */}
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

          {/* Question 3 */}
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
            <h4 className="font-black text-sm text-[#104A78]">مراجعة تفاصيل الاستشارة:</h4>
            <div className="grid grid-cols-2 gap-2 text-xs text-[#203945]">
              <p>
                <strong>الخدمة:</strong> {selectedCategory}
              </p>
              <p>
                <strong>المستفيد:</strong> {targetPerson === 'self' ? 'أنا (مباشر)' : 'أحد أفراد الأسرة'}
              </p>
              <p>
                <strong>نوع الطلب:</strong> استشارة أولية متخصصة
              </p>
              <p>
                <strong>مدة الجلسة:</strong> 45 دقيقة
              </p>
              <p>
                <strong>السعر:</strong>{' '}
                <span className="font-bold text-[#25866D]">500 دج</span>
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
                      المبلغ: 500 دج • بوابة دفع حكومية آمنة 100%
                    </span>
                  </div>
                </div>
                <span className="text-xs font-black text-[#25866D]">500 دج</span>
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
              تم توجيه طلبك إلى المستشار المختص وتم تأكيد الموعد وإصدار الفاتورة الرسمية
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
              <strong className="text-[#203945]">{selectedCategory}</strong>
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
                {paymentMethod === 'card' ? '500 دج' : '0 دج (مغطى برصيد الباقة)'}
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
                <span className="font-bold">{selectedCategory}</span>
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
                  {paymentMethod === 'card' ? '500 دج' : '0 دج (رصيد الباقة)'}
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
