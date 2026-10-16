import React, { useState } from 'react';
import {
  Brain,
  CalendarClock,
  CircleHelp,
  Scale,
  Users,
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
    icon: <Brain className="h-5 w-5" />,
  },
  {
    title: 'خدمات إرشاد أسري',
    detail: '3 خدمات',
    icon: <Users className="h-5 w-5" />,
  },
];

export const FamilyPackageView: React.FC = () => {
  const [showSubscriptionNotice, setShowSubscriptionNotice] = useState(false);

  return (
    <div className="mx-auto max-w-4xl space-y-5" dir="rtl">
      <header className="overflow-hidden rounded-[22px] border border-[#DCEBF4] bg-gradient-to-br from-[#EAF3F8] via-[#F8FBFC] to-[#E8F4EF] p-5 sm:p-7">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#1766A6] shadow-xs">
          <Users className="h-6 w-6" />
        </div>
        <p className="text-sm font-bold text-[#25866D]">منتج مدفوع مستقل للأسرة</p>
        <h1 className="mt-1 text-2xl font-black text-[#104A78] sm:text-3xl">الباقة الأسرية</h1>
        <p className="mt-2 text-base font-bold leading-relaxed text-[#203945] sm:text-lg">
          لأن الأسرة تحتاج إلى الدعم أيضًا.
        </p>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-[#203945]/75">
          رصيد محدد من الاستشارات والخدمات الأسرية خلال مدة معلومة. الخدمات المجانية، مثل دليل المراكز والجمعيات، متاحة لجميع المستخدمين ولا تُحتسب ضمن الباقة.
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
            لا تتضمن خدمات غير محدودة ولا تضم الخدمات المجانية المتاحة لجميع المستخدمين.
          </p>
        </div>
        <div className="flex flex-col gap-3 border-t border-amber-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs leading-relaxed text-amber-950/75">
            السعر قيد التحديد بعد اختبار السوق، ولن يتم تفعيل الاشتراك أو تحصيل مبلغ قبل اعتماده.
          </p>
          <button
            type="button"
            onClick={() => setShowSubscriptionNotice(true)}
            aria-haspopup="dialog"
            className="w-full shrink-0 rounded-[12px] bg-[#1766A6] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-[#125386] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1766A6] sm:w-auto"
          >
            الاشتراك في الباقة
          </button>
        </div>
      </section>

      {showSubscriptionNotice && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setShowSubscriptionNotice(false);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="family-package-notice-title"
            className="w-full max-w-md space-y-4 rounded-[20px] border border-[#DCEBF4] bg-white p-5 text-right shadow-2xl"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EAF3F8] text-[#1766A6]">
                <CircleHelp className="h-5 w-5" />
              </span>
              <h2 id="family-package-notice-title" className="font-black text-[#203945]">
                الاشتراك لم يُفتح بعد
              </h2>
            </div>
            <p className="text-sm leading-7 text-[#203945]/80">
              سعر الباقة قيد التحديد بعد اختبار السوق. لم يتم تسجيل اشتراك أو تحصيل أي مبلغ، وستصبح عملية الاشتراك متاحة بعد اعتماد السعر.
            </p>
            <button
              type="button"
              autoFocus
              onClick={() => setShowSubscriptionNotice(false)}
              className="w-full rounded-[12px] bg-[#1766A6] px-4 py-3 text-sm font-bold text-white hover:bg-[#125386]"
            >
              حسنًا
            </button>
          </section>
        </div>
      )}
    </div>
  );
};
