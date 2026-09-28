import React from 'react';
import { initialLegalTopics } from '../data/initialData';
import { Scale, BookOpen, AlertTriangle, FileText, CheckCircle2 } from 'lucide-react';

interface AwarenessViewProps {
  onNavigateToLegalAssistance?: () => void;
}

export const AwarenessView: React.FC<AwarenessViewProps> = ({
  onNavigateToLegalAssistance,
}) => {
  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-[20px] font-black text-[#203945]">
          الصفحة القانونية الموحدة والتوعية التشريعية ⚖️
        </h1>
        <p className="text-[12px] text-[#203945]/70 mt-0.5">
          الأطر التشريعية الرسمية الموثقة في الجزائر (القانون 04-18، تعديلاته 23-05 و 25-03، والمرسوم التنفيذي 07-229)
        </p>
      </div>

      {/* Official Legal Framework Banner */}
      <div className="bg-[#EAF3F8] rounded-[18px] p-4.5 space-y-2 border border-[#DCEBF4] shadow-xs">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-[#1766A6]" />
          <h2 className="font-bold text-[14px] text-[#1766A6]">
            📜 المراجع التشريعية الوطنية المعتمدة
          </h2>
        </div>
        <p className="text-[12px] text-[#104A78] leading-[20px] font-normal">
          • <strong>القانون رقم 04-18</strong> (25 ديسمبر 2004) المتعلق بالوقاية من المخدرات والمؤثرات العقلية وقمع الاستعمال والاتجار غير المشروعين بها.<br />
          • <strong>القانون رقم 23-05</strong> (07 مايو 2023) المعدل والمتمم للقانون 04-18 لتوسيع منظومة العلاج والتكفل وتجريم التحريض.<br />
          • <strong>القانون رقم 25-03</strong> (01 يوليو 2025) المتمم للأحكام الوقائية والمرافقة المجتمعية.<br />
          • <strong>المرسوم التنفيذي رقم 07-229</strong> (30 يوليو 2007) المحدد لشروط وكيفيات تطبيق المادة 6 (العلاج المزيل للتسمم).
        </p>
        <div className="pt-1 flex items-center justify-between">
          <span className="text-[11px] text-[#A64842] font-bold">
            ⚠️ تنبيه قانوني: هذه المعلومات توعوية وتثقيفية ولا تشكل استشارة قانونية فردية نهائية.
          </span>
          {onNavigateToLegalAssistance && (
            <button
              onClick={onNavigateToLegalAssistance}
              className="text-xs font-bold text-[#1766A6] underline hover:opacity-80"
            >
              طلب استشارة مع محامٍ معتمد ←
            </button>
          )}
        </div>
      </div>

      {/* Unified Legal Topics List (Requirement 25) */}
      <div className="space-y-4">
        {initialLegalTopics.map((topic) => (
          <div
            key={topic.id}
            className="bg-[#FBFDFC] rounded-[20px] border border-[#E5ECE9] p-5 sm:p-6 shadow-xs space-y-3.5 hover:border-[#1766A6]/40 transition-colors"
          >
            {/* 1. عنوان الموضوع */}
            <div className="flex items-start justify-between gap-3 border-b border-[#E5ECE9] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-[8px] bg-[#EAF3F8] text-[#1766A6] flex items-center justify-center shrink-0">
                  <Scale className="w-4 h-4" />
                </div>
                <h3 className="font-black text-[16px] sm:text-[17px] text-[#203945]">
                  ⚖️ {topic.title}
                </h3>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-[6px] bg-[#E8F4EF] text-[#1A5E4D] shrink-0">
                {topic.status === 'ACTIVE' ? 'ساري المفعول' : 'مؤرشف'}
              </span>
            </div>

            {/* 2. ملخص مبسط */}
            <div className="text-[13px] text-[#203945]/85 leading-relaxed bg-[#F3F7F6] p-3 rounded-[12px]">
              <strong className="text-[#203945] block font-bold text-[12px] mb-1">
                ملخص مبسط:
              </strong>
              {topic.plainSummary}
            </div>

            {/* 3. المرجع القانوني */}
            <div className="space-y-1 text-xs">
              <span className="font-bold text-[#1766A6] block">
                📜 المرجع القانوني:
              </span>
              <p className="text-[#203945] font-medium leading-relaxed">
                {topic.legalReference} ({topic.lawDate})
              </p>
            </div>

            {/* 4. المادة ذات الصلة والنص الرسمي */}
            <div className="bg-[#EAF3F8] p-3.5 rounded-[14px] border border-[#DCEBF4] space-y-1.5">
              <div className="flex items-center gap-1.5 text-[#1766A6] font-bold text-xs">
                <FileText className="w-3.5 h-3.5" />
                <span>📝 {topic.relevantArticle} — النص الرسمي:</span>
              </div>
              <p className="text-[12px] sm:text-[13px] font-semibold text-[#104A78] leading-relaxed italic pr-2 border-r-2 border-[#1766A6]">
                {topic.officialText}
              </p>
            </div>

            {/* 5. التعديلات */}
            <div className="space-y-1 text-xs">
              <span className="font-bold text-[#25866D] block">
                🔎 التعديلات التشريعية:
              </span>
              <ul className="list-disc list-inside space-y-0.5 text-[#203945]/80 text-[11px]">
                {topic.amendments.map((amend, i) => (
                  <li key={i}>{amend}</li>
                ))}
              </ul>
            </div>

            {/* 6. شرح مبسط */}
            <div className="space-y-1 text-xs">
              <span className="font-bold text-[#203945] block">
                📋 الشرح الإجرائي المبسط:
              </span>
              <p className="text-[12px] text-[#203945]/80 leading-relaxed">
                {topic.plainExplanation}
              </p>
            </div>

            {/* 7. المرسوم التطبيقي & 8. المصدر الرسمي */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1 border-t border-[#E5ECE9]">
              <div>
                <span className="font-bold text-[#1766A6] block text-[11px]">
                  📚 المرسوم التطبيقي:
                </span>
                <p className="text-[11px] text-[#203945]/80">{topic.executiveDecree}</p>
              </div>

              <div>
                <span className="font-bold text-[#1766A6] block text-[11px]">
                  🔗 المصدر الرسمي:
                </span>
                <p className="text-[11px] text-[#203945]/80">{topic.officialSource}</p>
              </div>
            </div>

            {/* 9. آخر مراجعة & 10. التنبيه القانوني */}
            <div className="pt-2 border-t border-[#E5ECE9] flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px]">
              <span className="text-[#203945]/60 font-medium">
                🕐 آخر مراجعة وتحقق: {topic.lastReviewedDate}
              </span>
              <span className="text-[#A64842] font-bold">
                ⚠️ المعلومات توعوية ولا تشكل استشارة قانونية.
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
