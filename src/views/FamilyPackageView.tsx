import React from 'react';
import {
  Activity,
  CalendarClock,
  HeartHandshake,
  MapPin,
  Scale,
  UsersRound,
} from 'lucide-react';

const includedServices = [
  {
    title: 'استشارات قانونية',
    detail: '3 استشارات',
    icon: <Scale className="h-5 w-5" />,
  },
  {
    title: 'استشارات نفسية',
    detail: '3 استشارات',
    icon: <Activity className="h-5 w-5" />,
  },
  {
    title: 'خدمات إرشاد أسري',
    detail: '3 خدمات',
    icon: <HeartHandshake className="h-5 w-5" />,
  },
  {
    title: 'البحث عن مركز علاج قريب',
    detail: 'مشمول في الباقة',
    icon: <MapPin className="h-5 w-5" />,
  },
  {
    title: 'البحث عن جمعية مختصة قريبة',
    detail: 'مشمول في الباقة',
    icon: <UsersRound className="h-5 w-5" />,
  },
  {
    title: 'متابعة الطلبات والمواعيد',
    detail: 'داخل حسابك',
    icon: <CalendarClock className="h-5 w-5" />,
  },
];

export const FamilyPackageView: React.FC = () => (
  <div className="mx-auto max-w-4xl space-y-5" dir="rtl">
    <header className="overflow-hidden rounded-[22px] border border-[#DCEBF4] bg-gradient-to-br from-[#EAF3F8] via-[#F8FBFC] to-[#E8F4EF] p-5 sm:p-7">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#1766A6] shadow-xs">
        <UsersRound className="h-6 w-6" />
      </div>
      <p className="text-sm font-bold text-[#25866D]">باقة دعم متكاملة للأسرة</p>
      <h1 className="mt-1 text-2xl font-black text-[#104A78] sm:text-3xl">الباقة الأسرية</h1>
      <p className="mt-2 text-base font-bold leading-relaxed text-[#203945] sm:text-lg">
        لأن الأسرة تحتاج إلى الدعم أيضًا.
      </p>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-[#203945]/75">
        مجموعة خدمات منظمة خلال مدة محددة بدل شراء كل خدمة بشكل منفصل، مع متابعة الطلبات والمواعيد داخل حساب الأسرة.
      </p>
    </header>

    <section className="grid gap-3 sm:grid-cols-[1fr_1fr]">
      <div className="flex items-center gap-3 rounded-[16px] border border-[#E0E8E6] bg-[#FBFDFC] p-4 shadow-xs">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EAF3F8] text-[#1766A6]">
          <CalendarClock className="h-5 w-5" />
        </span>
        <div>
          <p className="text-xs text-[#203945]/65">مدة الباقة</p>
          <p className="font-black text-[#203945]">30 يومًا</p>
        </div>
      </div>
      <div className="flex items-center gap-3 rounded-[16px] border border-[#E0E8E6] bg-[#FBFDFC] p-4 shadow-xs">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EAF3F8] text-[#1766A6]">
          <Scale className="h-5 w-5" />
        </span>
        <div>
          <p className="text-xs text-[#203945]/65">السعر</p>
          <p className="font-black text-[#203945]">يُحدد بعد اختبار السوق</p>
        </div>
      </div>
    </section>

    <section aria-labelledby="family-package-includes" className="space-y-3">
      <div>
        <h2 id="family-package-includes" className="text-lg font-black text-[#203945]">
          ماذا تتضمن الباقة؟
        </h2>
        <p className="mt-1 text-sm text-[#203945]/70">رصيد محدد من الخدمات خلال مدة الاشتراك.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {includedServices.map((service) => (
          <article
            key={service.title}
            className="flex items-center gap-3 rounded-[16px] border border-[#E0E8E6] bg-[#FBFDFC] p-4 shadow-xs"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EAF3F8] text-[#1766A6]">
              {service.icon}
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-bold text-[#203945]">{service.title}</h3>
              <p className="mt-1 text-xs font-bold text-[#25866D]">{service.detail}</p>
            </div>
          </article>
        ))}
      </div>
    </section>

    <section className="space-y-4 rounded-[20px] border border-amber-200 bg-amber-50 p-4 sm:p-5">
      <div>
        <h2 className="font-black text-amber-950">حدود الاشتراك</h2>
        <p className="mt-1 text-sm leading-7 text-amber-950/80">
          الباقة محددة المدة بـ30 يومًا ومحددة العدد: 3 استشارات قانونية و3 استشارات نفسية و3 خدمات إرشاد أسري.
          ليست باقة مفتوحة أو غير محدودة.
        </p>
      </div>
      <div className="flex flex-col gap-3 border-t border-amber-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs leading-relaxed text-amber-950/75">
          الاشتراك غير متاح بعد؛ سيُفتح بعد اعتماد السعر وتجهيز التسجيل الفعلي.
        </p>
        <button
          type="button"
          disabled
          aria-describedby="family-package-signup-note"
          className="w-full shrink-0 cursor-not-allowed rounded-[12px] bg-[#1766A6] px-5 py-3 text-sm font-bold text-white opacity-55 sm:w-auto"
        >
          الاشتراك في الباقة
        </button>
      </div>
      <p id="family-package-signup-note" className="sr-only">
        الاشتراك غير متاح حتى اعتماد السعر وتجهيز نظام تسجيل الاشتراكات.
      </p>
    </section>
  </div>
);
