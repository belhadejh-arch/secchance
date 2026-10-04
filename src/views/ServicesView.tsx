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
  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      <div>
        <h1 className="text-[18px] font-black text-[#203945]">
          خدمات منصة الفرصة الثانية
        </h1>
        <p className="text-[11px] text-[#203945]/70 mt-0.5">
          خدمات احترافية معتمدة للدعم النفسي، الاستشارات القانونية، والمرافقة العلاجية
        </p>
      </div>

      <div className="space-y-3">
        {services.map((service) => (
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
              <span>طلب هذه الخدمة الآن</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
