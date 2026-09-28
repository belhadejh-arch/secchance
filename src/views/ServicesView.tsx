import React from 'react';
import { ServiceItem } from '../types';
import { HeartPulse, Scale, Building2, Stethoscope, Users, CheckCircle2 } from 'lucide-react';

interface ServicesViewProps {
  services: ServiceItem[];
  onRequestService: (service: ServiceItem) => void;
}

export const ServicesView: React.FC<ServicesViewProps> = ({
  services,
  onRequestService,
}) => {
  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case 'psychological':
        return {
          label: 'دعم نفسي عيادي',
          icon: HeartPulse,
          color: 'bg-blue-100 text-blue-800 border-blue-200',
        };
      case 'legal':
        return {
          label: 'استشارة قانونية',
          icon: Scale,
          color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        };
      case 'treatment':
        return {
          label: 'إيداع وعلاج إدمان',
          icon: Building2,
          color: 'bg-purple-100 text-purple-800 border-purple-200',
        };
      case 'medical':
        return {
          label: 'استشارة طبية وعيادية',
          icon: Stethoscope,
          color: 'bg-cyan-100 text-cyan-800 border-cyan-200',
        };
      default:
        return {
          label: 'مرافقة أسرية واجتماعية',
          icon: Users,
          color: 'bg-amber-100 text-amber-800 border-amber-200',
        };
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900">
          خدمات منصة الفرصة الثانية
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-1">
          خدمات احترافية معتمدة للدعم النفسي، الاستشارات القانونية، والمرافقة العلاجية بإشراف أخصائيين
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {services.map((service) => {
          const badge = getCategoryBadge(service.category);
          const Icon = badge.icon;

          return (
            <div
              key={service.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-blue-400 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${badge.color}`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{badge.label}</span>
                  </span>

                  <span className="text-base font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                    {service.amountDzd.toLocaleString()} دج
                  </span>
                </div>

                <h3 className="font-bold text-base text-slate-900 leading-snug">
                  {service.title}
                </h3>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {service.description}
                </p>

                <div className="pt-1 text-xs text-slate-500 font-medium">
                  مقدم الخدمة المعتمد: <span className="text-slate-800 font-bold">{service.providerName}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 mt-4">
                <button
                  onClick={() => onRequestService(service)}
                  className="w-full py-2.5 px-4 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs sm:text-sm shadow-xs transition-colors flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>طلب هذه الخدمة الآن</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
