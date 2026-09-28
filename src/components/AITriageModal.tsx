import React, { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface AITriageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToRequest?: () => void;
}

export const AITriageModal: React.FC<AITriageModalProps> = ({
  isOpen,
  onClose,
  onNavigateToRequest,
}) => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [aiResult, setAiResult] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRunTriage = async () => {
    const trimmed = query.trim();
    if (!trimmed) return;
    setIsLoading(true);
    setAiResult(null);

    // Rule 17: منع التشخيص التلقائي
    const lower = trimmed.toLowerCase();
    const selfDiagnosisKeywords = ['أنا مدمن', 'انا مدمن', 'هل أنا مدمن', 'هل انا مدمن', 'تشخيص حالتي', 'عندي إدمان', 'عندي ادمان'];
    const isSelfDiagnosis = selfDiagnosisKeywords.some((k) => lower.includes(k));

    if (isSelfDiagnosis) {
      setTimeout(() => {
        setAiResult(
          `⚠️ تنبيه مهني وطبي:\n«هذه المعلومات لا تكفي لتشخيص الحالة. يرجى التواصل مع متخصص مؤهل.»\n\nنوصي بحجز جلسة استشارة سرية مع أخصائي نفسي أو طبيب إدمان معتمد عبر المنصة للتقييم السريري الدقيق والشامل.`
        );
        setIsLoading(false);
      }, 400);
      return;
    }

    // Rule 15: منع اختلاق القوانين
    const prompt = `أنت مساعد ذكاء اصطناعي توعوي لمنصة "الفرصة الثانية" الجزائرية.
قواعد إلزامية صارمة:
1. ممنوع منعاً باتاً اختلاق أو استنتاج أي رقم قانون، أو رقم مادة، أو عقوبة، أو إجراء قضائي غير موجود في التشريع الجزائري الرسمي الموثق (القانون 04-18 المؤرخ في 25 ديسمبر 2004 وتعديلاته بالقانون 23-05 والمرسوم 25-03، والمرسوم التنفيذي 07-229).
2. إذا سأل المستخدم عن معلومة قانونية غير موثقة قطعيًا في هذه النصوص الرسمية، فيجب عليك كتابة هذه الجملة نصياً بالضبط:
«لم يتم العثور على مصدر رسمي مؤكد لهذه المعلومة، يرجى الرجوع إلى النص القانوني الرسمي أو استشارة محامٍ.»
3. لا تقدم أي تشخيص طبي قطعي ولا تشخيص قانوني نهائي، واختم دائماً بضرورة استشارة المتخصص المؤهل.
نص استفسار المستخدم:
${trimmed}`;

    try {
      const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || '';
      if (apiKey) {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
            }),
          }
        );
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        setAiResult(text || '«لم يتم العثور على مصدر رسمي مؤكد لهذه المعلومة، يرجى الرجوع إلى النص القانوني الرسمي أو استشارة محامٍ.»');
      } else {
        await new Promise((resolve) => setTimeout(resolve, 600));
        // Strict verified Algerian legal framework fallback
        if (
          trimmed.includes('مادة 6') ||
          trimmed.includes('علاج طوعي') ||
          trimmed.includes('دعوى عمومية') ||
          trimmed.includes('قانون') ||
          trimmed.includes('محامي')
        ) {
          setAiResult(`📜 التوجيه القانوني الأولي وفق التشريع الجزائري الرسمي:
• المرجع: المادة 6 من القانون رقم 04-18 المؤرخ في 25 ديسمبر 2004 المعدل والمتمم بالقانون 23-05 والقانون 25-03.
• النص الرسمي: «لا تمارس الدعوى العمومية ضد الأشخاص الذين استهلكوا مخدرات أو مؤثرات عقلية إذا ثبت أنهم خضعوا لعلاج مزيل للتسمم أو كانوا تحت متابعة طبية منذ حدوث الوقائع المنسوبة إليهم.»
• التطبيق: المرسوم التنفيذي رقم 07-229 (30 يوليو 2007) يحدد شروط تسليم الشهادة الطبية وإخطار وكيل الجمهورية المختص.
⚠️ المعلومات توعوية ولا تشكل استشارة قانونية نهائية. يرجى مراجعة محامٍ معتمد عبر قسم المساعدة القانونية بالمنصة.`);
        } else {
          setAiResult(`«لم يتم العثور على مصدر رسمي مؤكد لهذه المعلومة، يرجى الرجوع إلى النص القانوني الرسمي أو استشارة محامٍ.»

نوصي باختيار أخصائي نفسي أو مستشار قانوني معتمد عبر المنصة للحصول على تقييم مهني موثق.`);
        }
      }
    } catch {
      setAiResult('«لم يتم العثور على مصدر رسمي مؤكد لهذه المعلومة، يرجى الرجوع إلى النص القانوني الرسمي أو استشارة محامٍ.»');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-[#FBFDFC] rounded-[22px] max-w-lg w-full shadow-xl border border-[#E5ECE9] p-5 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Header with Logo */}
        <div className="flex items-center justify-between pb-2 border-b border-[#E5ECE9]">
          <div className="flex items-center gap-2.5">
            <img
              src="/logo.png"
              alt="Logo"
              className="w-9 h-9 object-contain rounded-full border border-[#CCD8D5] bg-white p-0.5"
            />
            <div>
              <h3 className="font-bold text-[15px] sm:text-[16px] text-[#203945] leading-tight">
                المساعد الذكي والتوجيه التوعوي
              </h3>
              <p className="text-[10px] text-[#1766A6] font-semibold">
                التشريع الجزائري الرسمي الموثق • لا يقدم تشخيصاً نهائياً
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#203945]/50 hover:text-[#203945] p-1.5 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Life-threatening Warning Card (Requirement 19) */}
        <div className="bg-[#FBECEB] border border-[#F5D4D2] rounded-[14px] p-3 text-[11px] text-[#5F1D1A] leading-relaxed flex items-start gap-2 shadow-xs">
          <AlertTriangle className="w-4 h-4 text-[#A64842] shrink-0 mt-0.5" />
          <p>
            <strong>🚨 تنبيه طوارئ فوري:</strong> إذا كانت هناك حالة تهدد الحياة أو تسمم حاد أو فقدان وعي أو صعوبة شديدة في التنفس، لا تنتظر رد المنصة، وتوجه فوراً إلى خدمات الطوارئ أو أقرب مؤسسة صحية. المنصة ليست بديلاً عن الطوارئ الطبية.
          </p>
        </div>

        {/* Input Area */}
        <div className="space-y-2">
          <label className="text-[12px] font-bold text-[#203945] block">
            صِف الاستفسار أو الحالة للحصول على توجيه أولي وفق النصوص المعتمدة:
          </label>

          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="اكتب استفسارك هنا (مثال: ما هي شروط الاستفادة من العلاج الطوعي وفق المادة 6؟)..."
            className="w-full h-[110px] p-3 text-xs sm:text-sm bg-white border border-[#CCD8D5] rounded-[12px] outline-hidden focus:border-[#1766A6] resize-none shadow-xs text-[#203945]"
          />

          {isLoading && (
            <div className="w-full bg-[#EAF3F8] h-1.5 rounded-full overflow-hidden">
              <div className="bg-[#1766A6] h-full w-2/3 animate-pulse rounded-full" />
            </div>
          )}

          {aiResult && (
            <div className="bg-[#EAF3F8] rounded-[14px] p-3.5 border border-[#DCEBF4] space-y-1.5 shadow-xs">
              <span className="font-bold text-[12px] text-[#1766A6] block">
                نتيجة التوجيه المعتمد:
              </span>
              <p className="text-[11px] sm:text-[12px] text-[#104A78] leading-[20px] whitespace-pre-line font-medium">
                {aiResult}
              </p>
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 border-t border-[#E5ECE9]">
          {onNavigateToRequest && (
            <button
              onClick={() => {
                onClose();
                onNavigateToRequest();
              }}
              className="text-xs font-bold text-[#1766A6] hover:underline"
            >
              الانتقال لطلب استشارة متخصصة مع محامٍ أو طبيب ←
            </button>
          )}

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-[#203945]/70 hover:text-[#203945]"
            >
              إغلاق
            </button>

            <button
              onClick={handleRunTriage}
              disabled={!query.trim() || isLoading}
              className="px-4 py-2 rounded-[10px] bg-[#1766A6] hover:bg-[#125386] disabled:opacity-50 text-white font-bold text-xs transition-colors shadow-xs"
            >
              فحص التوجيه المعتمد
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
