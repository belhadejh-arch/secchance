import React from 'react';
import {
  Activity,
  ArrowRight,
  Brain,
  ChevronDown,
  HeartHandshake,
  MapPin,
  MessageCircle,
  Scale,
  ShieldCheck,
  TriangleAlert,
} from 'lucide-react';
import { ServiceItem } from '../types';

interface FamilyGuidanceViewProps {
  services: ServiceItem[];
  onRequestService: (service: ServiceItem) => void;
  onOpenDirectory: () => void;
  onBack: () => void;
}

const guidanceTopics = [
  {
    title: 'كيف أتحدث مع أحد أفراد الأسرة؟',
    icon: <MessageCircle className="h-5 w-5" />,
    advice:
      'اختر وقتًا هادئًا ومكانًا آمنًا، وابدأ بالتعبير عن اهتمامك دون لوم أو تهديد. استمع أكثر مما تتحدث، واسأل عمّا يحتاجه الآن، واتفقا على خطوة صغيرة ممكنة.',
  },
  {
    title: 'متى أطلب مساعدة متخصصة؟',
    icon: <HeartHandshake className="h-5 w-5" />,
    advice:
      'اطلب الدعم عندما تتكرر المشكلة، أو تؤثر في الصحة أو الدراسة أو العمل أو علاقات الأسرة، أو عندما تشعر أنكم لا تستطيعون التعامل معها وحدكم. لا يلزم انتظار تفاقم الوضع لطلب استشارة.',
  },
  {
    title: 'كيف أبحث عن مركز علاج قريب؟',
    icon: <MapPin className="h-5 w-5" />,
    advice:
      'ابدأ بالبحث حسب الولاية أو البلدية في دليل المراكز، ثم تواصل مع المركز مباشرة للتأكد من الخدمات المتاحة وشروط الاستقبال والمواعيد قبل التوجه إليه.',
  },
  {
    title: 'كيف أتعامل مع الضغط النفسي؟',
    icon: <Brain className="h-5 w-5" />,
    advice:
      'حاول الحفاظ على النوم والوجبات والراحة، واطلب مساندة شخص تثق به، وخذ وقتًا قصيرًا لنفسك دون الشعور بالذنب. إذا استمر الضغط أو أثّر في حياتك اليومية، تحدث مع مختص.',
  },
  {
    title: 'ما الأخطاء التي ينبغي تجنبها؟',
    icon: <TriangleAlert className="h-5 w-5" />,
    advice:
      'تجنب الإهانة واللوم والتهديد والوعود التي لا تستطيع الوفاء بها. لا تتحمل المشكلة وحدك ولا تخفِ سلوكًا يعرّض أحدًا للخطر؛ اطلب المساعدة وضع حدودًا واضحة ومحترمة.',
  },
  {
    title: 'كيف أحمي باقي أفراد الأسرة؟',
    icon: <ShieldCheck className="h-5 w-5" />,
    advice:
      'حافظ على حوار مناسب لأعمار أفراد الأسرة واحترم خصوصية الشخص المعني. اتفقوا على حدود منزلية واضحة، واطلبوا دعمًا للكبار والأطفال المتأثرين، وابتعدوا عن أي موقف غير آمن.',
  },
  {
    title: 'متى أحتاج إلى استشارة قانونية؟',
    icon: <Scale className="h-5 w-5" />,
    advice:
      'اطلب رأيًا قانونيًا عند وجود أسئلة عن الحقوق أو الإجراءات أو التعامل مع جهة رسمية. الاستشارة تساعد على فهم الخيارات، لكنها لا تعني تلقائيًا التمثيل أمام القضاء أو صدور قرار رسمي.',
  },
];

export const FamilyGuidanceView: React.FC<FamilyGuidanceViewProps> = ({
  services,
  onRequestService,
  onOpenDirectory,
  onBack,
}) => {
  const legalService = services.find((service) => service.category === 'legal');
  const psychologicalService = services.find((service) => service.category === 'psychological');

  const directHelp = [
    {
      title: 'استشارة قانونية',
      price: '500 دج',
      description: 'تحدث مع مستشار قانوني حول الحقوق والإجراءات.',
      icon: <Scale className="h-5 w-5" />,
      service: legalService,
    },
    {
      title: 'استشارة نفسية',
      price: '500 دج',
      description: 'اطلب دعمًا نفسيًا من مختص.',
      icon: <Activity className="h-5 w-5" />,
      service: psychologicalService,
    },
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-5" dir="rtl">
      <header className="space-y-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-bold text-[#1766A6] transition-colors hover:bg-[#EAF3F8]"
        >
          <ArrowRight className="h-4 w-4" />
          العودة
        </button>

        <section className="overflow-hidden rounded-[22px] border border-[#DCEBF4] bg-gradient-to-br from-[#EAF3F8] via-[#F8FBFC] to-[#E8F4EF] p-5 sm:p-7">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#1766A6] shadow-xs">
            <HeartHandshake className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-black text-[#104A78] sm:text-3xl">الإرشاد الأسري</h1>
          <p className="mt-2 text-base font-bold leading-relaxed text-[#203945] sm:text-lg">
            لست وحدك. الأسرة تحتاج أيضًا إلى الدعم.
          </p>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-[#203945]/75">
            معلومات أولية تساعد الأسرة على فهم الوضع واختيار خطوة مناسبة. يمكنك فتح أي موضوع للاطلاع على إرشاد عملي.
          </p>
        </section>
      </header>

      <section aria-labelledby="family-guidance-topics" className="space-y-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 id="family-guidance-topics" className="text-lg font-black text-[#203945]">
              موضوعات الإرشاد
            </h2>
            <p className="mt-1 text-xs text-[#203945]/65">اختر موضوعًا لعرض إرشاد موجز.</p>
          </div>
          <span className="shrink-0 rounded-full bg-[#EAF3F8] px-3 py-1 text-xs font-bold text-[#104A78]">
            {guidanceTopics.length} موضوعات
          </span>
        </div>

        <div className="space-y-2.5">
          {guidanceTopics.map((topic) => (
            <details
              key={topic.title}
              className="group rounded-[16px] border border-[#E0E8E6] bg-[#FBFDFC] shadow-xs open:border-[#C5DDEB]"
            >
              <summary className="flex cursor-pointer list-none items-center gap-3 rounded-[16px] p-4 outline-none focus-visible:ring-2 focus-visible:ring-[#1766A6] [&::-webkit-details-marker]:hidden">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EAF3F8] text-[#1766A6]">
                  {topic.icon}
                </span>
                <span className="flex-1 text-sm font-bold leading-6 text-[#203945] sm:text-base">
                  {topic.title}
                </span>
                <ChevronDown className="h-5 w-5 shrink-0 text-[#1766A6] transition-transform group-open:rotate-180" />
              </summary>
              <p className="border-t border-[#E7EFEC] px-4 pb-4 pt-3 text-sm leading-7 text-[#203945]/80">
                {topic.advice}
              </p>
            </details>
          ))}
        </div>
      </section>

      <section
        aria-labelledby="family-direct-help"
        className="space-y-3 rounded-[20px] border border-[#DCE8E4] bg-[#FBFDFC] p-4 shadow-xs sm:p-5"
      >
        <div>
          <h2 id="family-direct-help" className="text-lg font-black text-[#203945]">
            تحتاج إلى مساعدة مباشرة؟
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-[#203945]/70">
            اختر خدمة للانتقال إلى خطوات تقديم الطلب، أو ابحث عن مركز قريب مجانًا.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {directHelp.map((item) => (
            <article
              key={item.title}
              className="flex flex-col gap-3 rounded-[16px] border border-[#E5ECE9] bg-white p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EAF3F8] text-[#1766A6]">
                  {item.icon}
                </span>
                <span className="rounded-full bg-[#E8F4EF] px-3 py-1 text-xs font-black text-[#1A5E4D]">
                  {item.price}
                </span>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-[#203945]">{item.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-[#203945]/70">{item.description}</p>
              </div>
              <button
                type="button"
                disabled={!item.service}
                onClick={() => item.service && onRequestService(item.service)}
                className="w-full rounded-[10px] bg-[#1766A6] px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#125386] disabled:cursor-not-allowed disabled:opacity-50"
              >
                طلب الاستشارة
              </button>
            </article>
          ))}

          <article className="flex flex-col gap-3 rounded-[16px] border border-[#CFE5DA] bg-[#F3FAF6] p-4 sm:col-span-2 sm:flex-row sm:items-center">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#25866D]">
              <MapPin className="h-5 w-5" />
            </span>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-bold text-[#203945]">العثور على مركز قريب</h3>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-[#1A5E4D]">
                  مجاني
                </span>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-[#203945]/70">
                استكشف دليل مراكز العلاج واختر الولاية المناسبة.
              </p>
            </div>
            <button
              type="button"
              onClick={onOpenDirectory}
              className="w-full shrink-0 rounded-[10px] border border-[#25866D] bg-white px-4 py-2.5 text-sm font-bold text-[#1A5E4D] transition-colors hover:bg-[#E8F4EF] sm:w-auto"
            >
              استكشف المراكز
            </button>
          </article>
        </div>

        <p className="rounded-xl bg-[#F3F7F6] p-3 text-xs leading-relaxed text-[#203945]/70">
          إذا كان أحد أفراد الأسرة في خطر فوري، تواصل مباشرة مع الطوارئ أو جهة صحية مختصة؛ لا تنتظر موعدًا عبر المنصة.
        </p>
      </section>
    </div>
  );
};
