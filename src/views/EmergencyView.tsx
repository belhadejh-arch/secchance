import React from 'react';
import { initialEmergencyResources } from '../data/initialData';
import { AlertOctagon, PhoneCall, ShieldAlert } from 'lucide-react';

export const EmergencyView: React.FC = () => {
  const poisonCenter = initialEmergencyResources.find((r) => r.isPoisonCenter);
  const otherResources = initialEmergencyResources.filter((r) => !r.isPoisonCenter);

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-[20px] font-black text-[#203945]">
          دليل أرقام الطوارئ والمساعدة الفورية 🚨
        </h1>
        <p className="text-[12px] text-[#203945]/70 mt-0.5">
          أرقام النجدة والإسعاف الرسمية في الجزائر والمراكز الوطنية المعتمدة للسموم
        </p>
      </div>

      {/* Mandatory Emergency Alert (Requirement 19) */}
      <div className="bg-[#FBECEB] border-2 border-[#A64842] rounded-[18px] p-4 sm:p-5 shadow-sm space-y-2">
        <div className="flex items-center gap-2 text-[#A64842]">
          <AlertOctagon className="w-6 h-6 shrink-0" />
          <h2 className="text-[15px] sm:text-[16px] font-black">
            🚨 تنبيه عاجل وإلزامي للحالات الحرجة
          </h2>
        </div>
        <p className="text-[12px] sm:text-[13px] text-[#5F1D1A] font-bold leading-[22px]">
          إذا كانت هناك حالة تهدد الحياة أو تسمم حاد أو فقدان وعي أو صعوبة شديدة في التنفس، لا تنتظر رد المنصة، وتوجه فوراً إلى خدمات الطوارئ أو أقرب مؤسسة صحية.
        </p>
        <p className="text-[11px] text-[#5F1D1A]/80 font-medium">
          المنصة ليست بديلاً عن الطوارئ الطبية أو الإسعاف الفوري للحالات الخطرة.
        </p>
      </div>

      {/* Dedicated Poison Control Center Card (Requirement 18) */}
      {poisonCenter && (
        <div className="bg-[#FFF3E0] border border-[#FFB74D] rounded-[18px] p-5 shadow-xs space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xl">☠️</span>
                <h3 className="font-black text-[16px] sm:text-[17px] text-[#E65100]">
                  {poisonCenter.title}
                </h3>
              </div>
              <p className="text-[12px] text-[#E65100]/90 leading-relaxed font-medium">
                {poisonCenter.description}
              </p>
            </div>

            <div className="text-left shrink-0">
              <span className="block text-[10px] font-bold text-[#E65100]/80 mb-1">
                الرقم الرسمي المعروض حالياً:
              </span>
              <a
                href={`tel:${poisonCenter.phoneNumber.replace(/\s+/g, '')}`}
                className="inline-flex items-center gap-2 bg-[#E65100] hover:bg-[#d84315] text-white font-black text-[15px] px-4 py-2 rounded-[10px] transition-colors shadow-xs"
              >
                <PhoneCall className="w-4 h-4" />
                <span dir="ltr">{poisonCenter.phoneNumber}</span>
              </a>
            </div>
          </div>

          <div className="pt-2 border-t border-[#FFE0B2] flex items-center justify-between text-[11px] text-[#E65100]">
            <span>✓ التكفل بحالات التسمم الدوائي والكيميائي والجرعات الزائدة</span>
            <a
              href={`tel:${poisonCenter.phoneNumber.replace(/\s+/g, '')}`}
              className="font-bold underline hover:opacity-80"
            >
              اتصال مباشر الآن 📞
            </a>
          </div>
        </div>
      )}

      {/* Other National Emergency Numbers */}
      <div className="space-y-3 pt-2">
        <h3 className="text-[15px] font-bold text-[#203945] flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-[#1766A6]" />
          <span>أرقام النجدة والإنقاذ الوطنية المعتمدة</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {otherResources.map((res) => (
            <div
              key={res.id}
              className="bg-[#FBFDFC] rounded-[16px] border border-[#E5ECE9] p-4 shadow-xs flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-[14px] text-[#203945]">
                    {res.title}
                  </h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-[6px] bg-[#E8F4EF] text-[#1A5E4D]">
                    24/24 ساعة
                  </span>
                </div>
                <p className="text-[11px] text-[#203945]/70 mt-1 leading-normal">
                  {res.description}
                </p>
              </div>

              <div className="pt-2 border-t border-[#E5ECE9] flex items-center justify-between">
                <span className="font-black text-[18px] text-[#A64842]" dir="ltr">
                  {res.phoneNumber}
                </span>
                <a
                  href={`tel:${res.phoneNumber}`}
                  className="px-3 py-1.5 rounded-[8px] bg-[#A64842] hover:bg-[#8e3c37] text-white text-[11px] font-bold flex items-center gap-1 transition-colors"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>اتصال</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
