import React from 'react';
import { ServiceItem } from '../types';
import { CheckCircle } from 'lucide-react';

interface ServicesViewProps {
  services: ServiceItem[];
  onRequestService: (service: ServiceItem) => void;
}

export const ServicesView: React.FC<ServicesViewProps> = ({
  services,
  onRequestService,
}) => {
  const legalServices = services.filter((service) => service.category === 'legal');

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      <section className="bg-[#EAF3F8] rounded-[20px] border border-[#DCEBF4] p-5 sm:p-7 space-y-3">
        <h1 className="text-xl sm:text-2xl font-black text-[#104A78] leading-snug">
          لا تترك المشكلة تتفاقم وحدك
        </h1>

        <p className="text-sm text-[#203945]/80 leading-relaxed">
          قد تبدأ المشكلة مع فرد واحد… لكن آثارها قد تمتد لتطال الأسرة بأكملها.
        </p>

        <p className="text-sm text-[#203945]/80 leading-relaxed">
          مع «الفرصة الثانية» ستجد من ينصت إليك ويوجهك لمساعدتك على فهم وضعك واتخاذ الخطوة الصحيحة، عبر الاستشارات القانونية، والمرافقة الاجتماعية، والتوجيه نحو العلاج وإعادة الإدماج.
        </p>

        <p className="text-sm font-bold text-[#104A78] leading-relaxed">
          ابدأ اليوم، فطلب المساعدة ليس ضعفًا، بل هو بداية التغيير.
        </p>
      </section>

      <div className="space-y-3">
        {legalServices.map((service) => (
          <div
            key={service.id}
            className="bg-[#FBFDFC] rounded-[16px] border border-[#E5ECE9] p-4 shadow-xs space-y-2.5"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#1766A6]">
                {service.category}
              </span>
              <span className="text-[13px] font-black text-[#25866D]">
                {service.amountDzd.toLocaleString()} دج
              </span>
            </div>

            <h3 className="font-bold text-[16px] text-[#203945]">
              {service.title}
            </h3>

            <p className="text-[12px] text-[#203945]/80 leading-relaxed">
              {service.description}
            </p>

            <p className="text-[11px] text-[#203945]/60">
              المزود: {service.providerName}
            </p>

            <button
              onClick={() => onRequestService(service)}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-[10px] bg-[#1766A6] hover:bg-[#125386] text-white font-bold text-xs transition-colors"
            >
              <CheckCircle className="w-4 h-4" />
              <span>أحتاج إلى مساعدة</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
