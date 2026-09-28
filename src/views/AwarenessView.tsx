import React from 'react';
import { initialAwarenessArticles } from '../data/initialData';

export const AwarenessView: React.FC = () => {
  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      <div>
        <h1 className="text-[18px] font-black text-[#203945]">
          المراجع القانونية والتوعية والإرشاد (التشريع الجزائري)
        </h1>
        <p className="text-[11px] text-[#203945]/70 mt-0.5">
          أدلة رسمية ومقالات توعوية وفق التشريع الجزائري (القانون 04-18، وتعديلاته 23-05 و25-03، والمرسوم 07-229)
        </p>
      </div>

      {/* Official Legal Framework Card */}
      <div className="bg-[#EAF3F8] rounded-[16px] p-4 space-y-2 border border-[#DCEBF4]">
        <h2 className="font-bold text-[14px] text-[#1766A6]">
          📜 المراجع التشريعية الرسمية المعتمدة
        </h2>
        <p className="text-[11px] text-[#104A78] leading-[18px] whitespace-pre-line font-normal">
          • القانون رقم 04-18 (25 ديسمبر 2004) المتعلق بالوقاية من المخدرات والمؤثرات العقلية.
          • القانون رقم 23-05 (7 مايو 2023) المعدل والمتمم للقانون 04-18.
          • القانون رقم 25-03 (1 يوليو 2025) المعدل والمتمم.
          • المرسوم التنفيذي رقم 07-229 (30 يوليو 2007) المتعلق بكيفيات تطبيق المادة 6 (العلاج والمتابعة الطبية).
        </p>
        <p className="text-[10px] text-[#A64842] font-bold pt-1">
          ⚠️ تنبيه قانوني: هذه المعلومات توعوية وإرشادية ولا تغني عن الاستشارة القانونية الفردية مع محامٍ معتمد.
        </p>
      </div>

      {/* Articles */}
      <div className="space-y-3">
        {initialAwarenessArticles.map((article) => (
          <div
            key={article.id}
            className="bg-[#FBFDFC] rounded-[16px] border border-[#E5ECE9] p-4 shadow-xs space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#1766A6]">
                {article.category}
              </span>
              <span className="text-[10px] text-[#203945]/50">
                آخر مراجعة: {article.date}
              </span>
            </div>

            <h3 className="font-bold text-[16px] text-[#203945]">
              {article.title}
            </h3>

            <p className="text-[12px] text-[#203945]/80 leading-[18px]">
              {article.summary}
            </p>

            <p className="text-[11px] font-semibold text-[#25866D] pt-1">
              الكاتب / المصدر: {article.author}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
