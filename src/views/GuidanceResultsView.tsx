import React from 'react';
import { AlertTriangle, ArrowRight, BookOpen, Building, HeartHandshake, Scale, Users } from 'lucide-react';
import { GuidanceProgress } from '../components/GuidanceProgress';
import { AssessmentAnswers } from './NeedsAssessmentView';
import { ServiceItem } from '../types';

interface GuidanceResultsViewProps {
  answers: AssessmentAnswers;
  services: ServiceItem[];
  onReserveService: (service: ServiceItem) => void;
  onOpenDirectory: (tab: 'centers' | 'associations', search?: string) => void;
  onOpenLegalInformation: () => void;
  onOpenFamilyGuidance: () => void;
  onOpenEmergency: () => void;
  onBack: () => void;
}

const needDetails: Record<AssessmentAnswers['need'], { title: string; description: string }> = {
  legal: {
    title: 'الاستشارة القانونية',
    description: 'استشارة مباشرة مع مستشار قانوني مؤهل لمساعدتك على فهم وضعك القانوني والمسارات الممكنة.',
  },
  psychological: {
    title: 'الاستشارة النفسية',
    description: 'استشارة مباشرة مع مختص نفسي عيادي مؤهل لتقديم الدعم والإرشاد ضمن اختصاصه المهني.',
  },
  center: {
    title: 'العثور على مركز علاج قريب',
    description: 'تصفح مراكز العلاج والتكفل حسب الولاية التي اخترتها.',
  },
  association: {
    title: 'العثور على جمعية مختصة قريبة',
    description: 'اكتشف الجمعيات المختصة والنشطة في ولايتك.',
  },
  'legal-information': {
    title: 'التوعية القانونية',
    description: 'معلومات ومراجع قانونية مبسطة للاطلاع والتوعية.',
  },
  'family-guidance': {
    title: 'الإرشاد الأسري',
    description: 'توجيه يساعد الأسرة على فهم الوضع والتعامل معه.',
  },
};

export const GuidanceResultsView: React.FC<GuidanceResultsViewProps> = ({
  answers,
  services,
  onReserveService,
  onOpenDirectory,
  onOpenLegalInformation,
  onOpenFamilyGuidance,
  onOpenEmergency,
  onBack,
}) => {
  const result = needDetails[answers.need];
  const wilayaSearch = answers.wilaya.replace(/^\d{1,2}\.\s*/, '');
  const paidService = answers.need === 'legal'
    ? services.find((service) => service.category === 'legal')
    : answers.need === 'psychological'
      ? services.find((service) => service.category === 'psychological')
      : undefined;
  const freeSuggestions = [
    {
      title: 'العثور على مركز علاج قريب',
      description: 'البحث عن مراكز العلاج والتكفل بالإدمان داخل الولاية أو الولايات المجاورة.',
      icon: <Building className="h-4 w-4" />,
      action: () => onOpenDirectory('centers', wilayaSearch),
    },
    {
      title: 'العثور على جمعية مختصة قريبة',
      description: 'اكتشاف الجمعيات النشطة في مكافحة الإدمان والتوعية والدعم الأسري.',
      icon: <HeartHandshake className="h-4 w-4" />,
      action: () => onOpenDirectory('associations', wilayaSearch),
    },
    {
      title: 'التوعية القانونية',
      description: 'معلومات قانونية مبسطة ومراجع للاطلاع.',
      icon: <BookOpen className="h-4 w-4" />,
      action: onOpenLegalInformation,
    },
    {
      title: 'الإرشاد الأسري',
      description: 'توجيه ومعلومات أولية تساعد الأسرة.',
      icon: <Users className="h-4 w-4" />,
      action: onOpenFamilyGuidance,
    },
  ];
  const freeAction = answers.need === 'center'
    ? () => onOpenDirectory('centers', wilayaSearch)
    : answers.need === 'association'
      ? () => onOpenDirectory('associations', wilayaSearch)
      : answers.need === 'legal-information'
        ? onOpenLegalInformation
        : answers.need === 'family-guidance'
          ? onOpenFamilyGuidance
          : undefined;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <GuidanceProgress activeStep={3} />

      <section className="rounded-[20px] border border-[#E0E8E6] bg-[#FBFDFC] p-5 shadow-xs sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h1 className="text-xl font-black text-[#203945]">الخدمة الأنسب لاحتياجك</h1>
          <button
            onClick={onBack}
            className="flex shrink-0 items-center gap-1 rounded-[10px] px-2 py-1 text-xs font-bold text-[#1766A6] hover:bg-[#EAF3F8]"
          >
            <ArrowRight className="h-4 w-4" />
            تعديل الإجابات
          </button>
        </div>

        <p className="mb-4 text-sm leading-relaxed text-[#203945]/75">
          هذه اقتراحات للخدمات التي قد تناسب المعلومات التي أدخلتها، وليست تشخيصًا طبيًا أو قرارًا قانونيًا.
        </p>

        <dl className="mb-4 grid grid-cols-1 gap-2 rounded-[12px] bg-[#F3F7F6] p-3 text-xs sm:grid-cols-3">
          <div><dt className="text-[#203945]/60">لمن؟</dt><dd className="font-bold">{answers.targetPerson === 'self' ? 'لنفسي' : 'لأحد أفراد أسرتي'}</dd></div>
          <div><dt className="text-[#203945]/60">الولاية</dt><dd className="font-bold">{answers.wilaya}</dd></div>
          <div><dt className="text-[#203945]/60">الاحتياج</dt><dd className="font-bold">{result.title}</dd></div>
        </dl>

        {answers.isUrgent ? (
          <div className="space-y-3 rounded-[14px] border border-[#F5D4D2] bg-[#FBECEB] p-4">
            <div className="flex items-start gap-2 text-[#5F1D1A]">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <h2 className="font-black">توجّه مباشرة إلى المساعدة الصحية العاجلة</h2>
                <p className="mt-1 text-sm leading-relaxed">
                  لا تنتظر حجز خدمة عبر المنصة إذا كانت الحالة تتطلب تدخلاً عاجلاً. تواصل فورًا مع الطوارئ أو جهة صحية مختصة.
                </p>
              </div>
            </div>
            <button
              onClick={onOpenEmergency}
              className="w-full rounded-[10px] bg-[#A64842] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#8A3A35]"
            >
              فتح دليل الطوارئ
            </button>
          </div>
        ) : (
          <div className="space-y-3 rounded-[14px] border border-[#E0E8E6] bg-white p-4">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-[#EAF3F8] text-[#1766A6]">
                {answers.need === 'legal' ? <Scale className="h-5 w-5" /> : answers.need === 'psychological' ? <Users className="h-5 w-5" /> : <BookOpen className="h-5 w-5" />}
              </span>
              <div className="space-y-1">
                <h2 className="font-black text-[#203945]">{result.title}</h2>
                <p className="text-sm leading-relaxed text-[#203945]/75">{result.description}</p>
                <p className="text-sm font-black text-[#25866D]">
                  السعر: {paidService ? `${paidService.amountDzd.toLocaleString()} دج` : 'مجاني'}
                </p>
              </div>
            </div>
            {paidService ? (
              <button
                onClick={() => onReserveService(paidService)}
                className="w-full rounded-[10px] bg-[#1766A6] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#125386]"
              >
                حجز الاستشارة
              </button>
            ) : (
              <button
                onClick={freeAction}
                className="w-full rounded-[10px] bg-[#1766A6] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#125386]"
              >
                استكشاف الخدمة
              </button>
            )}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-black text-[#203945]">قد تحتاج أيضًا إلى</h2>
        <div className="space-y-2">
          {freeSuggestions.map((suggestion) => (
            <button
              key={suggestion.title}
              onClick={suggestion.action}
              className="flex w-full items-start gap-3 rounded-[14px] border border-[#E0E8E6] bg-[#FBFDFC] p-4 text-right hover:border-[#1766A6]"
            >
              <span className="mt-0.5 text-[#1766A6]">{suggestion.icon}</span>
              <span className="flex-1">
                <span className="flex items-center justify-between gap-2">
                  <span className="font-bold text-[#203945]">{suggestion.title}</span>
                  <span className="shrink-0 text-xs font-black text-[#25866D]">مجاني</span>
                </span>
                <span className="mt-1 block text-xs leading-relaxed text-[#203945]/70">{suggestion.description}</span>
              </span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
};
