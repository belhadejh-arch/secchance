import React, { useState } from 'react';
import { api } from '../services/api';
import { Sparkles, X, AlertTriangle, PhoneCall, ArrowLeft, CheckCircle2, ShieldAlert } from 'lucide-react';

interface AITriageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartCaseWithData?: (suggestedData: { description: string; addiction_type_id: number; priority: string }) => void;
}

export const AITriageModal: React.FC<AITriageModalProps> = ({ isOpen, onClose, onStartCaseWithData }) => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAnalyze = async () => {
    if (!input || input.trim().length < 5) {
      setError('يرجى كتابة وصف موجز لا يقل عن 5 أحرف');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await api.aiTriage(input);
      setResult(res.data);
    } catch (err: any) {
      setError(err.message || 'فشل الاتصال بالمساعد الذكي');
    } finally {
      setLoading(false);
    }
  };

  const handleProceed = () => {
    if (result && onStartCaseWithData) {
      onStartCaseWithData({
        description: input,
        addiction_type_id: result.suggested_addiction_type_id || 1,
        priority: result.suggested_priority || 'Medium'
      });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-6 shadow-2xl border border-slate-200 text-right animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 text-slate-900 font-extrabold text-lg">
            <span>المساعد الذكي للتوجيه الأولي السري</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Safety Disclaimer Banner */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-start gap-3 text-xs text-amber-900">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block">إشعار الأمان الطبي والإرشادي:</span>
            هذا المساعد الذكي مصمم لتقديم التوجيه الإنساني الأولي والمساعدة في تصنيف الحالة فقط. لا يقدم تشخيصاً طبياً قاطعاً ولا يصف أدوية.
          </div>
        </div>

        {/* Query Input */}
        {!result && (
          <div className="space-y-4">
            <label className="block text-xs sm:text-sm font-bold text-slate-700">
              صف وضعك أو وضع الشخص المعني باختصار وسرية تامة:
            </label>
            <textarea
              rows={4}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="مثال: أخي يتناول حبوب مهدئة ومؤثرات عقلية منذ 6 أشهر وتراجعت صحته وبدأ يفقد السيطرة، ونحن كعائلة لا نعرف كيف نوجهه للعلاج وبدأنا نخاف من مشكلات قانونية..."
              className="w-full p-3.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#1565C0] focus:border-transparent outline-none transition-all leading-relaxed"
            />

            {error && <div className="text-xs text-red-600 font-semibold">{error}</div>}

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={handleAnalyze}
                disabled={loading}
                className="px-6 py-2.5 bg-[#1565C0] hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold rounded-xl text-sm flex items-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <span>جاري التحليل والتوجيه...</span>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>تحليل الحالة وتقديم التوجيه</span>
                  </>
                )}
              </button>
              <span className="text-[11px] text-slate-400">سري ومجهول الهوية بالكامل</span>
            </div>
          </div>
        )}

        {/* Analysis Result */}
        {result && (
          <div className="space-y-5 animate-in fade-in">
            {result.is_critical && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-red-700 font-bold text-sm">
                  <ShieldAlert className="w-5 h-5 text-red-600" />
                  <span>تنبيه أولوية قصوى / طوارئ</span>
                </div>
                <p className="text-xs text-red-900 leading-relaxed">
                  الحالة تستدعي التدخل السريع. يرجى الاتصال فوراً بالخط الأخضر 1099 أو الحماية المدنية 14.
                </p>
              </div>
            )}

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
              <div className="text-xs font-bold text-slate-500">رسالة المساعد التوجيهية:</div>
              <p className="text-sm text-slate-800 leading-relaxed font-medium">
                {result.guidance_message}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-blue-50/70 border border-blue-100 p-3 rounded-xl space-y-1">
                <span className="text-slate-500 font-semibold block">الأولوية المقترحة:</span>
                <span className="font-extrabold text-[#1565C0] text-sm">{result.suggested_priority}</span>
              </div>

              <div className="bg-emerald-50/70 border border-emerald-100 p-3 rounded-xl space-y-1">
                <span className="text-slate-500 font-semibold block">الإجراء الموصى به:</span>
                <span className="font-bold text-[#2E7D32]">فتح ملف حالة وتكليف أخصائي</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setResult(null)}
                className="text-xs text-slate-500 hover:text-slate-700 underline"
              >
                تحليل استفسار آخر
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold"
                >
                  إغلاق
                </button>
                <button
                  type="button"
                  onClick={handleProceed}
                  className="px-5 py-2 bg-[#1565C0] hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs"
                >
                  <span>متابعة فتح ملف الحالة الآن</span>
                  <ArrowLeft className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
