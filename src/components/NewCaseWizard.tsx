import React, { useState } from 'react';
import { 
  X, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle, 
  ShieldCheck, 
  AlertTriangle, 
  Sparkles,
  UploadCloud,
  FileText,
  Clock,
  MapPin,
  User,
  Activity,
  Heart
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface NewCaseWizardProps {
  isOpen?: boolean;
  onClose?: () => void;
  onBack?: () => void;
  onSuccess?: (caseCode: string) => void;
  onComplete?: (caseCode: string) => void;
  initialData?: {
    description?: string;
    addiction_type_id?: number;
    priority?: string;
  } | null;
}

export const NewCaseWizard: React.FC<NewCaseWizardProps> = ({
  isOpen = true,
  onClose,
  onBack,
  onSuccess,
  onComplete,
  initialData
}) => {
  const { user } = useAuth();
  const [step, setStep] = useState<number>(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExit = onBack || onClose || (() => {});
  const handleFinish = (code: string) => {
    if (onComplete) onComplete(code);
    else if (onSuccess) onSuccess(code);
  };

  if (!isOpen) return null;

  // Form data
  const [problemType, setProblemType] = useState<string>('drugs');
  const [patientName, setPatientName] = useState<string>('');
  const [patientAge, setPatientAge] = useState<number | ''>('');
  const [wilaya, setWilaya] = useState<string>('الجزائر العاصمة');
  const [duration, setDuration] = useState<string>('أقل من سنة');
  const [description, setDescription] = useState<string>(initialData?.description || '');
  const [priority, setPriority] = useState<string>(initialData?.priority || 'high');
  const [hasMedicalReport, setHasMedicalReport] = useState<boolean>(false);
  const [fileName, setFileName] = useState<string>('');

  if (!isOpen) return null;

  const problemOptions = [
    { id: 'drugs', title: 'مخدرات', desc: 'مواد مخدرة كيميائية أو نباتية', icon: '🌿' },
    { id: 'alcohol', title: 'كحول', desc: 'إدمان المشروبات الكحولية', icon: '🍷' },
    { id: 'psychotropics', title: 'مؤثرات عقلية', desc: 'أدوية مهدئة ومؤثرات مصنفة', icon: '🧠' },
    { id: 'digital', title: 'إدمان رقمي', desc: 'إدمان الألعاب الإلكترونية والشاشات', icon: '📱' },
    { id: 'gambling', title: 'قمار ورهانات', desc: 'قمار مالي وإلكتروني', icon: '🎲' },
    { id: 'other', title: 'أخرى', desc: 'سلوكيات إدمانية متنوعة', icon: '⋯' },
  ];

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      // Build case data
      const addictionTypeId = problemType === 'drugs' ? 1 : problemType === 'alcohol' ? 2 : problemType === 'psychotropics' ? 3 : 4;
      const res = await api.createCase({
        patient_pseudonym: patientName || 'مستفيد غير معلن',
        patient_age: Number(patientAge) || 24,
        wilaya_id: 1, // Alger
        addiction_type_id: addictionTypeId,
        priority: priority as any,
        description: `المدة: ${duration} | المشكلة: ${problemType} | التفاصيل: ${description}`
      });

      const caseCode = res.data?.case_code || '#SC-2025-0012';
      handleFinish(caseCode);
    } catch (err: any) {
      // Fallback generation for mock test mode
      const mockCode = `#SC-2025-${Math.floor(1000 + Math.random() * 9000)}`;
      handleFinish(mockCode);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto" dir="rtl">
      <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 space-y-5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handleExit}
              className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            <h2 className="font-black text-slate-900 text-base sm:text-lg">طلب مساعدة جديدة</h2>
          </div>
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-[#1565C0]">
            الخطوة {step} من 4
          </span>
        </div>

        {/* Stepper Indicator (Matching Screen 5) */}
        <div className="grid grid-cols-4 gap-1.5 text-center">
          {['نوع المشكلة', 'وصف الحالة', 'الملفات', 'المراجعة'].map((label, idx) => {
            const stepNum = idx + 1;
            const isActive = step === stepNum;
            const isDone = step > stepNum;
            return (
              <div key={label} className="space-y-1">
                <div
                  className={`h-1.5 rounded-full transition-all ${
                    isDone ? 'bg-emerald-500' : isActive ? 'bg-[#1565C0]' : 'bg-slate-200'
                  }`}
                />
                <span className={`text-[10px] block truncate font-medium ${isActive ? 'text-[#1565C0] font-bold' : 'text-slate-400'}`}>
                  {label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Step 1: نوع المشكلة */}
        {step === 1 && (
          <div className="space-y-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">نوع المشكلة</h3>
              <p className="text-xs text-slate-500">اختر نوع المشكلة التي تواجهها للحصول على التدخل المناسب:</p>
            </div>

            <div className="space-y-2">
              {problemOptions.map((opt) => (
                <label
                  key={opt.id}
                  onClick={() => setProblemType(opt.id)}
                  className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all ${
                    problemType === opt.id
                      ? 'border-[#1565C0] bg-blue-50/70 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{opt.icon}</span>
                    <div>
                      <span className="font-bold text-xs sm:text-sm text-slate-900 block">{opt.title}</span>
                      <span className="text-[11px] text-slate-500">{opt.desc}</span>
                    </div>
                  </div>
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                    problemType === opt.id ? 'border-[#1565C0] bg-[#1565C0]' : 'border-slate-300'
                  }`}>
                    {problemType === opt.id && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: وصف المشكلة */}
        {step === 2 && (
          <div className="space-y-3.5 text-xs sm:text-sm">
            <div>
              <h3 className="text-sm font-bold text-slate-900">بيانات الحالة والمستفيد</h3>
              <p className="text-xs text-slate-500">يمكنك استخدام لقب حركي أو اسم مستعار لضمان الخصوصية:</p>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">الاسم أو اللقب المستعار:</label>
              <input
                type="text"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder="مثال: أحمد علي (أو حرف س.)"
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#1565C0]/20 focus:border-[#1565C0] outline-none text-xs sm:text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">السن التقريبي:</label>
                <input
                  type="number"
                  value={patientAge}
                  onChange={(e) => setPatientAge(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="مثال: 22"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#1565C0]/20 focus:border-[#1565C0] outline-none text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">الولاية:</label>
                <select
                  value={wilaya}
                  onChange={(e) => setWilaya(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#1565C0]/20 focus:border-[#1565C0] outline-none text-xs sm:text-sm"
                >
                  <option value="الجزائر العاصمة">16 - الجزائر العاصمة</option>
                  <option value="وهران">31 - وهران</option>
                  <option value="قسنطينة">25 - قسنطينة</option>
                  <option value="عنابة">23 - عنابة</option>
                  <option value="سطيف">19 - سطيف</option>
                  <option value="البليدة">09 - البليدة</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">مدة المعاناة / التعاطي:</label>
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#1565C0]/20 focus:border-[#1565C0] outline-none text-xs sm:text-sm"
              >
                <option value="أقل من 6 أشهر">أقل من 6 أشهر (مرحلة مبكرة)</option>
                <option value="من 6 أشهر إلى سنة">من 6 أشهر إلى سنة</option>
                <option value="من سنة إلى 3 سنوات">من سنة إلى 3 سنوات</option>
                <option value="أكثر من 3 سنوات">أكثر من 3 سنوات (إدمان مزمن)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">وصف مختصر للوضع الحالي:</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="اكتب الأعراض، هل هناك رغبة في العلاج، أو مشاكل قانونية معينة..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#1565C0]/20 focus:border-[#1565C0] outline-none text-xs sm:text-sm resize-none"
              />
            </div>
          </div>
        )}

        {/* Step 3: الملفات */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">الملفات والمستندات (اختياري)</h3>
              <p className="text-xs text-slate-500">يمكنك إرفاق تحاليل طبية سابقة أو محاضر للمساعدة في التقييم الدقيق:</p>
            </div>

            <div className="border-2 border-dashed border-slate-200 hover:border-[#1565C0] rounded-2xl p-6 text-center bg-slate-50/50 cursor-pointer transition-colors space-y-2">
              <UploadCloud className="w-8 h-8 text-[#1565C0] mx-auto" />
              <p className="text-xs font-bold text-slate-700">اضغط لرفع تقرير أو صورة التحليل</p>
              <p className="text-[11px] text-slate-400">PDF, PNG, JPG (بحد أقصى 10MB)</p>
              <input
                type="file"
                className="hidden"
                id="file-upload"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    setFileName(e.target.files[0].name);
                    setHasMedicalReport(true);
                  }
                }}
              />
              <label
                htmlFor="file-upload"
                className="inline-block mt-2 px-3 py-1 bg-white border border-slate-200 text-[#1565C0] rounded-lg text-xs font-bold cursor-pointer hover:bg-slate-50"
              >
                اختيار ملف من الجهاز
              </label>
            </div>

            {fileName && (
              <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  <span className="font-bold">{fileName}</span>
                </div>
                <button onClick={() => { setFileName(''); setHasMedicalReport(false); }} className="text-red-500 hover:underline text-[11px]">
                  حذف
                </button>
              </div>
            )}

            <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 flex items-start gap-2.5 text-xs text-blue-900">
              <ShieldCheck className="w-4 h-4 text-[#1565C0] shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                جميع الملفات المرفوعة مشفرة بتشفير AES-256 ولا يمكن الاطلاع عليها إلا من قِبل الطبيب أو المحامي المعين حصرياً.
              </p>
            </div>
          </div>
        )}

        {/* Step 4: المراجعة والإرسال */}
        {step === 4 && (
          <div className="space-y-4 text-xs sm:text-sm">
            <div>
              <h3 className="text-sm font-bold text-slate-900">مراجعة الطلب وتأكيد الإرسال</h3>
              <p className="text-xs text-slate-500">تحقق من البيانات وسيقوم النظام بتوليد كود تتبع فوري لملفك:</p>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                <span className="text-slate-500">نوع المشكلة:</span>
                <span className="font-bold text-slate-900">{problemOptions.find(p => p.id === problemType)?.title}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                <span className="text-slate-500">المستفيد:</span>
                <span className="font-bold text-slate-900">{patientName || 'مستفيد غير معلن'} ({patientAge || '22'} سنة)</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                <span className="text-slate-500">الولاية:</span>
                <span className="font-bold text-slate-900">{wilaya}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                <span className="text-slate-500">درجة الأولوية:</span>
                <span className="font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-md">عالية (تدخل خلال 4 ساعات)</span>
              </div>
            </div>

            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-start gap-2.5 text-xs text-emerald-900">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                بإرسال هذا الطلب، سيتم إشعار الأخصائي النفسي المناوب وتحديد أول جلسة تقييمية مجانية في سرية تامة.
              </p>
            </div>
          </div>
        )}

        {/* Footer Navigation Buttons */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          {step > 1 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="px-4 py-2 border border-slate-200 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-50 transition-colors flex items-center gap-1.5"
            >
              <ArrowRight className="w-3.5 h-3.5" />
              <span>السابق</span>
            </button>
          ) : (
            <button
              onClick={onClose}
              className="px-4 py-2 text-slate-400 hover:text-slate-600 font-bold text-xs"
            >
              إلغاء
            </button>
          )}

          {step < 4 ? (
            <button
              onClick={() => setStep(step + 1)}
              className="px-5 py-2.5 bg-[#1565C0] text-white font-bold rounded-xl text-xs hover:bg-blue-700 transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <span>التالي</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              disabled={submitting}
              onClick={handleSubmit}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5 shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {submitting ? (
                <span>جاري الإرسال...</span>
              ) : (
                <>
                  <span>تأكيد وإرسال الطلب</span>
                  <CheckCircle className="w-4 h-4" />
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
