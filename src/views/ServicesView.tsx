import React from 'react';
import { ServiceItem } from '../types';
import { Activity, BookOpen, Building, CheckCircle, HeartHandshake, Scale, Users } from 'lucide-react';

interface ServicesViewProps {
  services: ServiceItem[];
  onRequestService: (service: ServiceItem) => void;
  onOpenDirectory: (tab: 'centers' | 'associations') => void;
  onOpenLegalInformation: () => void;
  onOpenFamilyGuidance: () => void;
  onOpenTriage: () => void;
}

export const ServicesView: React.FC<ServicesViewProps> = ({
  services,
  onRequestService,
  onOpenDirectory,
  onOpenLegalInformation,
  onOpenFamilyGuidance,
  onOpenTriage,
}) => {
  const psychologicalService = services.find((service) => service.category === 'psychological');
  const legalService = services.find((service) => service.category === 'legal');

  const options = [
    {
      title: 'أحتاج إلى استشارة قانونية',
      price: '500 دج',
      description: 'قدّم طلب استشارة إلى محامٍ أو مستشار قانوني مختص.',
      icon: <Scale className="w-5 h-5" />,
      action: () => legalService && onRequestService(legalService),
      disabled: !legalService,
    },
    {
      title: 'أحتاج إلى استشارة نفسية',
      price: '500 دج',
      description: 'ابدأ طلب جلسة دعم نفسي مع مختص.',
      icon: <Activity className="w-5 h-5" />,
      action: () => psychologicalService && onRequestService(psychologicalService),
      disabled: !psychologicalService,
    },
    {
      title: 'أبحث عن مركز لعلاج الإدمان',
      price: 'مجاني',
      description: 'اعثر على مراكز العلاج القريبة منك في دليل الجهات.',
      icon: <Building className="w-5 h-5" />,
      action: () => onOpenDirectory('centers'),
      disabled: false,
    },
    {
      title: 'أبحث عن جمعية مختصة',
      price: 'مجاني',
      description: 'تصفح الجمعيات المختصة واختر الولاية المناسبة.',
      icon: <HeartHandshake className="w-5 h-5" />,
      action: () => onOpenDirectory('associations'),
      disabled: false,
    },
    {
      title: 'أريد معلومات قانونية',
      price: 'مجاني',
      description: 'اطّلع على المراجع والمواد القانونية المتاحة.',
      icon: <BookOpen className="w-5 h-5" />,
      action: onOpenLegalInformation,
      disabled: false,
    },
    {
      title: 'أحتاج إلى إرشاد أسري',
      price: 'مجاني',
      description: 'احصل على توجيه أولي يساعدك على دعم أحد أفراد الأسرة.',
      icon: <Users className="w-5 h-5" />,
      action: onOpenFamilyGuidance,
      disabled: false,
    },
  ];

  const handleOptionClick = (action: () => void, disabled = false) => {
    if (!disabled) action();
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      <section className="bg-[#EAF3F8] rounded-[20px] border border-[#DCEBF4] p-5 sm:p-7 space-y-3">
        <h1 className="text-xl sm:text-2xl font-black text-[#104A78] leading-snug">
          «لا تترك المشكلة تتفاقم وحدها؛ فقد تبدأ مع فرد واحد، لكن آثارها قد تمتد لتطال الأسرة بأكملها».
        </h1>

        <p className="text-sm text-[#203945]/80 leading-relaxed">
          تساعدك منصة «الفرصة الثانية» أنت وأسرتك على الوصول إلى الاستشارة القانونية أو النفسية، والعثور على مركز علاج أو جمعية مختصة، والحصول على المعلومات والإرشاد المناسبين. اختر احتياجك لفتح المسار الملائم.
        </p>

        <p className="text-sm font-bold text-[#104A78] leading-relaxed">
          اختر الخدمة المناسبة لك أو لأحد أفراد أسرتك.
        </p>
      </section>

      <div className="space-y-3">
        {options.map((option) => (
          <div
            key={option.title}
            className="bg-[#FBFDFC] rounded-[16px] border border-[#E5ECE9] p-4 shadow-xs space-y-2.5"
          >
            <div className="flex items-center justify-between">
              <span className="w-10 h-10 rounded-[12px] bg-[#EAF3F8] text-[#1766A6] flex items-center justify-center">
                {option.icon}
              </span>
              <span className="text-[13px] font-black text-[#25866D]">
                {option.price}
              </span>
            </div>

            <h3 className="font-bold text-[16px] text-[#203945]">
              {option.title}
            </h3>

            <p className="text-[12px] text-[#203945]/80 leading-relaxed">
              {option.description}
            </p>

            <button
              onClick={() => handleOptionClick(option.action, option.disabled)}
              disabled={option.disabled}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-[10px] bg-[#1766A6] hover:bg-[#125386] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs transition-colors"
            >
              <CheckCircle className="w-4 h-4" />
              <span>اختيار هذه الخدمة</span>
            </button>
          </div>
        ))}
      </div>

      <section className="bg-[#FBFDFC] rounded-[16px] border border-[#E5ECE9] p-4 shadow-xs space-y-2.5 text-center">
        <h2 className="font-bold text-[16px] text-[#203945]">لا أعرف ماذا أحتاج</h2>
        <button
          onClick={onOpenTriage}
          className="w-full flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-[10px] bg-[#1766A6] hover:bg-[#125386] text-white font-bold text-xs transition-colors"
        >
          <CheckCircle className="w-4 h-4" />
          <span>ساعدني على تحديد احتياجي</span>
        </button>
      </section>
    </div>
  );
};
