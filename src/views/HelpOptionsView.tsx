import React from 'react';
import { ServiceItem } from '../types';
import { Activity, BookOpen, Building, CheckCircle, HeartHandshake, Scale, Users } from 'lucide-react';

interface HelpOptionsViewProps {
  services: ServiceItem[];
  onRequestService: (service: ServiceItem) => void;
  onOpenDirectory: (tab: 'centers' | 'associations') => void;
  onOpenLegalInformation: () => void;
  onOpenFamilyGuidance: () => void;
  onStartNeedsAssessment: () => void;
}

export const HelpOptionsView: React.FC<HelpOptionsViewProps> = ({
  services,
  onRequestService,
  onOpenDirectory,
  onOpenLegalInformation,
  onOpenFamilyGuidance,
  onStartNeedsAssessment,
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

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <section className="space-y-3 rounded-[20px] border border-[#DCEBF4] bg-[#EAF3F8] p-5 sm:p-7">
        <h1 className="text-xl font-black leading-snug text-[#104A78] sm:text-2xl">
          «لا تترك المشكلة تتفاقم وحدها؛ فقد تبدأ مع فرد واحد، لكن آثارها قد تمتد لتطال الأسرة بأكملها».
        </h1>
        <p className="text-sm leading-relaxed text-[#203945]/80">
          تساعدك منصة «الفرصة الثانية» أنت وأسرتك على الوصول إلى الاستشارة القانونية أو النفسية، والعثور على مركز علاج أو جمعية مختصة، والحصول على المعلومات والإرشاد المناسبين. اختر احتياجك لفتح المسار الملائم.
        </p>
        <p className="text-sm font-bold leading-relaxed text-[#104A78]">
          اختر الخدمة المناسبة لك أو لأحد أفراد أسرتك.
        </p>
      </section>

      <div className="space-y-3">
        {options.map((option) => (
          <div
            key={option.title}
            className="space-y-2.5 rounded-[16px] border border-[#E5ECE9] bg-[#FBFDFC] p-4 shadow-xs"
          >
            <div className="flex items-center justify-between">
              <span className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-[#EAF3F8] text-[#1766A6]">
                {option.icon}
              </span>
              <span className="text-[13px] font-black text-[#25866D]">{option.price}</span>
            </div>
            <h2 className="text-[16px] font-bold text-[#203945]">{option.title}</h2>
            <p className="text-[12px] leading-relaxed text-[#203945]/80">{option.description}</p>
            <button
              onClick={() => !option.disabled && option.action()}
              disabled={option.disabled}
              className="flex w-full items-center justify-center gap-1.5 rounded-[10px] bg-[#1766A6] px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-[#125386] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <CheckCircle className="h-4 w-4" />
              <span>اختيار هذه الخدمة</span>
            </button>
          </div>
        ))}
      </div>

      <section className="space-y-2.5 rounded-[16px] border border-[#E5ECE9] bg-[#FBFDFC] p-4 text-center shadow-xs">
        <h2 className="text-[16px] font-bold text-[#203945]">لا أعرف ماذا أحتاج</h2>
        <button
          onClick={onStartNeedsAssessment}
          className="flex w-full items-center justify-center gap-1.5 rounded-[10px] bg-[#1766A6] px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-[#125386]"
        >
          <CheckCircle className="h-4 w-4" />
          <span>ساعدني على تحديد احتياجي</span>
        </button>
      </section>
    </div>
  );
};
