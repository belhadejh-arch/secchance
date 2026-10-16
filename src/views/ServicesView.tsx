import React from 'react';
import { ServiceItem } from '../types';
import { Brain, BookOpen, Hospital, Handshake, Scale, Users } from 'lucide-react';

interface ServicesViewProps {
  services: ServiceItem[];
  onRequestService: (service: ServiceItem) => void;
  onOpenDirectory: (tab: 'centers' | 'associations') => void;
  onOpenLegalInformation: () => void;
  onOpenFamilyGuidance: () => void;
}

export const ServicesView: React.FC<ServicesViewProps> = ({
  services,
  onRequestService,
  onOpenDirectory,
  onOpenLegalInformation,
  onOpenFamilyGuidance,
}) => {
  const psychologicalService = services.find((service) => service.category === 'psychological');
  const legalService = services.find((service) => service.category === 'legal');
  const paidServices = [
    {
      title: 'الاستشارة القانونية',
      category: 'legal',
      description: 'استشارة مباشرة مع مستشار قانوني مؤهل لفهم الوضعية القانونية والإجراءات والمسارات الممكنة ضمن اختصاصه.',
      service: legalService,
      icon: <Scale className="h-5 w-5" />,
    },
    {
      title: 'الاستشارة النفسية',
      category: 'psychological',
      description: 'استشارة مباشرة مع مختص نفسي عيادي مؤهل لتقديم الدعم النفسي والإرشاد ضمن اختصاصه المهني.',
      service: psychologicalService,
      icon: <Brain className="h-5 w-5" />,
    },
  ];
  const freeServices = [
    {
      title: 'العثور على مركز علاج قريب',
      description: 'البحث عن مراكز العلاج والتكفل بالإدمان داخل الولاية أو الولايات المجاورة.',
      icon: <Hospital className="h-5 w-5" />,
      actionLabel: 'استكشف المراكز',
      action: () => onOpenDirectory('centers'),
    },
    {
      title: 'العثور على جمعية مختصة',
      description: 'اكتشاف الجمعيات النشطة في مكافحة الإدمان والتوعية والدعم الأسري وغيرها.',
      icon: <Handshake className="h-5 w-5" />,
      actionLabel: 'استكشف الجمعيات',
      action: () => onOpenDirectory('associations'),
    },
    {
      title: 'التوعية القانونية',
      description: 'معلومات قانونية مبسطة ومحدثة.',
      icon: <BookOpen className="h-5 w-5" />,
      actionLabel: 'عرض المعلومات القانونية',
      action: onOpenLegalInformation,
    },
    {
      title: 'الإرشاد الأسري',
      description: 'محتوى عملي يساعد الأسرة على فهم الوضع والتعامل معه.',
      icon: <Users className="h-5 w-5" />,
      actionLabel: 'عرض الإرشاد الأسري',
      action: onOpenFamilyGuidance,
    },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <header>
        <h1 className="text-xl font-black text-[#203945]">الخدمات</h1>
        <p className="mt-1 text-sm text-[#203945]/70">استشارات مدفوعة وخدمات مجانية حسب احتياجك.</p>
      </header>

      <section className="space-y-3">
        <h2 className="text-base font-black text-[#203945]">الاستشارات المدفوعة</h2>
        {paidServices.map((item) => (
          <article key={item.category} className="space-y-3 rounded-[16px] border border-[#E0E8E6] bg-[#FBFDFC] p-4 shadow-xs">
            <div className="flex items-start justify-between gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-[#EAF3F8] text-[#1766A6]">{item.icon}</span>
              <span className="text-sm font-black text-[#25866D]">{item.title} — {item.service?.amountDzd.toLocaleString() ?? 500} دج</span>
            </div>
            <p className="text-sm leading-relaxed text-[#203945]/80">{item.description}</p>
            <button
              disabled={!item.service}
              onClick={() => item.service && onRequestService(item.service)}
              className="w-full rounded-[10px] bg-[#1766A6] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#125386] disabled:cursor-not-allowed disabled:opacity-50"
            >
              احجز الآن
            </button>
          </article>
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-black text-[#203945]">الخدمات المجانية</h2>
        {freeServices.map((item) => (
          <article key={item.title} className="space-y-3 rounded-[16px] border border-[#E0E8E6] bg-[#FBFDFC] p-4 shadow-xs">
            <div className="flex items-start justify-between gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-[#EAF3F8] text-[#1766A6]">{item.icon}</span>
              <div className="flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-bold text-[#203945]">{item.title}</h3>
                  <span className="shrink-0 text-xs font-black text-[#25866D]">مجاني</span>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-[#203945]/75">{item.description}</p>
              </div>
            </div>
            <button
              onClick={item.action}
              className="w-full rounded-[10px] border border-[#1766A6] bg-white px-4 py-2.5 text-sm font-bold text-[#1766A6] hover:bg-[#EAF3F8]"
            >
              {item.actionLabel}
            </button>
          </article>
        ))}
      </section>
    </div>
  );
};
