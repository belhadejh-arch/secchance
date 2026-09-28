import React from 'react';
import { initialEmergencyResources } from '../data/initialData';

export const EmergencyView: React.FC = () => {
  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      <div>
        <h1 className="text-[18px] font-black text-[#203945]">
          دليل أرقام الطوارئ والمساعدة الفورية
        </h1>
        <p className="text-[11px] text-[#203945]/70 mt-0.5">
          أرقام مجانية ومؤمنة متاحة للإبلاغ والمساعدة الطارئة
        </p>
      </div>

      <div className="space-y-3">
        {initialEmergencyResources.map((res) => (
          <div
            key={res.id}
            className="bg-[#FBECEB]/60 rounded-[16px] border border-[#F5D4D2] p-4 shadow-xs space-y-2"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-[15px] text-[#A64842]">
                {res.title}
              </h3>
              <a
                href={`tel:${res.phoneNumber}`}
                className="bg-[#A64842] hover:bg-[#8e3c37] text-white font-black text-[14px] px-2.5 py-1 rounded-[8px] transition-colors"
              >
                {res.phoneNumber}
              </a>
            </div>

            <p className="text-[12px] text-[#203945]/80 leading-relaxed">
              {res.description}
            </p>

            {res.is247 && (
              <p className="text-[11px] font-bold text-[#25866D] pt-0.5">
                ✓ متوفر على مدار 24 ساعة طوال أيام الأسبوع
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
