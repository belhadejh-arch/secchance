import React, { useState } from 'react';
import { initialAwarenessArticles } from '../data/initialData';
import { BookOpen, Scale, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';

export const AwarenessView: React.FC = () => {
  const [expandedId, setExpandedId] = useState<number | null>(1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900">
          المراجع القانونية والتوعية والإرشاد (التشريع الجزائري)
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          أدلة رسمية ومقالات توعوية وفق التشريع الجزائري (القانون 04-18، وتعديلاته 23-05 و25-03، والمرسوم 07-229)
        </p>
      </div>

      {/* Official Legal Framework Box */}
      <div className="bg-gradient-to-br from-blue-900 to-indigo-950 text-white rounded-2xl p-6 shadow-md space-y-3">
        <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
          <Scale className="w-5 h-5" />
          <span>المراجع التشريعية الرسمية المعتمدة بالجمهورية الجزائرية الديمقراطية الشعبية</span>
        </div>

        <ul className="text-xs sm:text-sm text-slate-200 space-y-2 leading-relaxed">
          <li className="flex items-start gap-2">
            <span className="text-emerald-400 font-bold">•</span>
            <span>
              <strong>القانون رقم 04-18</strong> (المؤرخ في 25 ديسمبر 2004) المتعلق بالوقاية من المخدرات والمؤثرات العقلية وقمع الاستعمال والاتجار غير المشروعين بها.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-emerald-400 font-bold">•</span>
            <span>
              <strong>القانون رقم 23-05</strong> (المؤرخ في 7 مايو 2023) المعدل والمتمم للقانون 04-18، والذي يعزز تدابير الحماية والعلاج والمرافقة الطبية.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-emerald-400 font-bold">•</span>
            <span>
              <strong>القانون رقم 25-03</strong> (المؤرخ في 1 يوليو 2025) المكمل للآليات الوقائية وتحديث جداول المواد الخاضعة للرقابة.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-emerald-400 font-bold">•</span>
            <span>
              <strong>المرسوم التنفيذي رقم 07-229</strong> (المؤرخ في 30 يوليو 2007) الذي يحدد كيفيات تطبيق المادة 6 المتعلقة بالعلاج المزيل للتسمم.
            </span>
          </li>
        </ul>

        <div className="pt-2 border-t border-white/10 flex items-center gap-2 text-xs text-amber-300 font-medium">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>تنبيه قانوني: هذه المعلومات توعوية وإرشادية ولا تغني عن الاستشارة القانونية الفردية مع محامٍ معتمد بالمنصة.</span>
        </div>
      </div>

      {/* Articles List */}
      <div className="space-y-4">
        <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-blue-700" />
          <span>الشروح القانونية والطبية المتخصصة</span>
        </h2>

        {initialAwarenessArticles.map((article) => {
          const isExpanded = expandedId === article.id;
          return (
            <div
              key={article.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs transition-all space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-800 bg-blue-50 px-2.5 py-0.5 rounded-md">
                  {article.category}
                </span>
                <span className="text-[11px] text-slate-400">
                  آخر مراجعة: {article.date}
                </span>
              </div>

              <h3 className="font-extrabold text-base text-slate-900 leading-snug">
                {article.title}
              </h3>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100 font-normal">
                {article.summary}
              </p>

              {isExpanded && (
                <div className="text-xs sm:text-sm text-slate-700 leading-relaxed p-3 bg-blue-50/50 rounded-xl border border-blue-100 whitespace-pre-line animate-in fade-in duration-150">
                  {article.content}
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
                <span>المصدر / الكاتب: <strong className="text-slate-800">{article.author}</strong></span>
                <button
                  onClick={() => setExpandedId(isExpanded ? null : article.id)}
                  className="font-bold text-blue-700 hover:text-blue-800 flex items-center gap-1"
                >
                  <span>{isExpanded ? 'إخفاء التفاصيل' : 'قراءة التحليل الكامل'}</span>
                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
