import React from 'react';
import {
  Brain,
  ArrowLeft,
  Hospital,
  CalendarDays,
  Check,
  Circle,
  CreditCard,
  FolderOpen,
  Handshake,
  Scale,
  Users,
} from 'lucide-react';
import { Appointment, CareRequest, PaymentTransaction, ServiceItem, SpecialistReport, User } from '../types';
import { getCustomerRequestProgress } from '../lib/requestProgress';

interface AccountDashboardViewProps {
  currentUser: User;
  requests: CareRequest[];
  appointments: Appointment[];
  transactions: PaymentTransaction[];
  reports: SpecialistReport[];
  services: ServiceItem[];
  onNewRequest: () => void;
  onRequestService: (service: ServiceItem) => void;
  onOpenDirectory: (tab: 'centers' | 'associations') => void;
  onSelectRequest: (request: CareRequest) => void;
  onStartPayment: (request: CareRequest) => void;
}

function dateValue(value: string | undefined) {
  if (!value) return 0;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function formatAmount(amount: number) {
  return `${amount.toLocaleString('ar-DZ')} دج`;
}

function formatDate(value: string) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? value
    : parsed.toLocaleDateString('ar-DZ', { year: 'numeric', month: 'short', day: 'numeric' });
}

export const AccountDashboardView: React.FC<AccountDashboardViewProps> = ({
  currentUser,
  requests,
  appointments,
  transactions,
  reports,
  services,
  onNewRequest,
  onRequestService,
  onOpenDirectory,
  onSelectRequest,
  onStartPayment,
}) => {
  const latestRequest = [...requests].sort((a, b) => dateValue(b.createdAt) - dateValue(a.createdAt))[0];
  const latestRequestProgress = latestRequest
    ? getCustomerRequestProgress(latestRequest, appointments, transactions, reports)
    : undefined;
  const legalService = services.find((service) => service.category === 'legal');
  const psychologicalService = services.find((service) => service.category === 'psychological');
  const successfulTransactions = transactions.filter((transaction) => transaction.status === 'SUCCESSFUL');
  const packageStart = dateValue(currentUser.familyPackage?.startsAt);
  const packageEnd = dateValue(currentUser.familyPackage?.endsAt);
  const familyPackageActive =
    currentUser.familyPackage?.status === 'ACTIVE' &&
    packageStart > 0 &&
    packageEnd > Date.now() &&
    packageStart <= Date.now();

  const serviceActions = [
    {
      title: 'استشارة قانونية',
      price: legalService ? formatAmount(legalService.amountDzd) : 'غير متاحة',
      icon: <Scale className="h-5 w-5" />,
      action: () => legalService && onRequestService(legalService),
      disabled: !legalService,
    },
    {
      title: 'استشارة نفسية',
      price: psychologicalService ? formatAmount(psychologicalService.amountDzd) : 'غير متاحة',
      icon: <Brain className="h-5 w-5" />,
      action: () => psychologicalService && onRequestService(psychologicalService),
      disabled: !psychologicalService,
    },
    {
      title: 'العثور على مركز قريب',
      price: 'مجاني',
      icon: <Hospital className="h-5 w-5" />,
      action: () => onOpenDirectory('centers'),
      disabled: false,
    },
    {
      title: 'العثور على جمعية قريبة',
      price: 'مجاني',
      icon: <Handshake className="h-5 w-5" />,
      action: () => onOpenDirectory('associations'),
      disabled: false,
    },
  ];

  const appointment = latestRequest
    ? appointments.find(
        (item) =>
          item.caseNumber === latestRequest.caseNumber &&
          item.status !== 'CANCELLED'
      )
    : undefined;
  const isPaid =
    latestRequest?.paymentStatus === 'PAID' ||
    transactions.some(
      (transaction) =>
        transaction.caseNumber === latestRequest?.caseNumber &&
        transaction.status === 'SUCCESSFUL'
    );
  const paymentNotRequired = latestRequest?.paymentStatus === 'NOT_REQUIRED';
  const hasConsultationStarted =
    latestRequest?.status === 'IN_PROGRESS' ||
    latestRequest?.status === 'COMPLETED' ||
    reports.some((report) => report.caseNumber === latestRequest?.caseNumber);
  const paymentLabel = paymentNotRequired
    ? 'غير مطلوبة'
    : isPaid
      ? 'تم الدفع'
      : latestRequest?.paymentStatus === 'FAILED'
        ? 'فشل الدفع'
        : 'بانتظار الدفع';
  const appointmentLabel = appointment
    ? `${appointment.status === 'COMPLETED' ? 'اكتمل' : appointment.status === 'PENDING' ? 'بانتظار التأكيد' : 'مؤكد'} — ${formatDate(appointment.date)} ${appointment.time}`
    : 'لا يوجد موعد مسجل';
  const consultationLabel =
    latestRequest?.status === 'COMPLETED'
      ? 'اكتملت الاستشارة'
      : hasConsultationStarted
        ? 'بدأت الاستشارة'
        : 'لم تبدأ بعد';

  const journey = [
    { title: 'تم إرسال الطلب', done: Boolean(latestRequest), detail: latestRequest ? formatDate(latestRequest.createdAt) : '—' },
    { title: paymentLabel, done: isPaid || paymentNotRequired, detail: latestRequest ? latestRequest.paymentStatus : '—' },
    { title: appointment ? 'الموعد' : 'الموعد', done: Boolean(appointment), detail: appointmentLabel },
    { title: 'الاستشارة', done: hasConsultationStarted, detail: consultationLabel },
  ];

  const summaryCards = [
    { title: 'طلباتي', value: requests.length, icon: <FolderOpen className="h-5 w-5" />, note: 'طلبات مسجلة' },
    { title: 'مواعيدي', value: appointments.length, icon: <CalendarDays className="h-5 w-5" />, note: 'مواعيد مسجلة' },
    {
      title: 'مدفوعاتي',
      value: transactions.length,
      icon: <CreditCard className="h-5 w-5" />,
      note: `${successfulTransactions.length} دفعة ناجحة`,
    },
    {
      title: 'حالة الباقة',
      value: familyPackageActive ? 'نشطة' : 'غير نشطة',
      icon: <Users className="h-5 w-5" />,
      note: familyPackageActive
        ? `سارية حتى ${formatDate(currentUser.familyPackage!.endsAt)}`
        : 'لا يوجد اشتراك فعّال في الحساب',
    },
  ];

  return (
    <div className="space-y-5" dir="rtl">
      <header>
        <p className="text-sm font-bold text-[#25866D]">
          مرحبًا، {currentUser.firstName} {currentUser.lastName}
        </p>
        <h1 className="mt-1 text-2xl font-black text-[#203945] sm:text-3xl">
          مرحبًا بك — ماذا تحتاج اليوم؟
        </h1>
      </header>

      <section aria-labelledby="account-quick-actions" className="space-y-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 id="account-quick-actions" className="text-lg font-black text-[#203945]">
              الإجراءات السريعة
            </h2>
            <p className="mt-1 text-sm text-[#203945]/65">اختر خدمة لبدء طلب جديد.</p>
          </div>
          <button
            type="button"
            onClick={onNewRequest}
            className="hidden items-center gap-1 text-xs font-bold text-[#1766A6] hover:underline sm:flex"
          >
            طلب آخر
            <ArrowLeft className="h-4 w-4" />
          </button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {serviceActions.map((item) => (
            <button
              key={item.title}
              type="button"
              disabled={item.disabled}
              onClick={item.action}
              className="flex min-h-[76px] items-center gap-3 rounded-[16px] border border-[#E0E8E6] bg-[#FBFDFC] p-5 text-right shadow-xs transition-colors hover:border-[#AFCFE0] hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EAF3F8] text-[#1766A6]">
                {item.icon}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold text-[#203945]">{item.title}</span>
                <span className={`mt-1 block text-xs font-black ${item.price === 'مجاني' ? 'text-[#25866D]' : 'text-[#1766A6]'}`}>
                  {item.price}
                </span>
              </span>
              <ArrowLeft className="h-4 w-4 shrink-0 text-[#1766A6]" />
            </button>
          ))}
        </div>
      </section>

      <section aria-labelledby="account-summary" className="space-y-3">
        <h2 id="account-summary" className="text-lg font-black text-[#203945]">
          إحصاءات الحساب
        </h2>
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          {summaryCards.map((card) => (
            <article key={card.title} className="rounded-[16px] border border-[#E0E8E6] bg-[#FBFDFC] p-5 shadow-xs">
              <div className="flex items-center justify-between gap-2 text-[#1766A6]">
                {card.icon}
                <span className="text-xs font-bold text-[#203945]/65">{card.title}</span>
              </div>
              <p className="mt-3 text-xl font-black text-[#203945]">{card.value}</p>
              <p className="mt-1 text-[11px] text-[#203945]/60">{card.note}</p>
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="account-current-status" className="space-y-3 rounded-[20px] border border-[#E0E8E6] bg-[#FBFDFC] p-5 shadow-xs sm:p-6">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 id="account-current-status" className="text-lg font-black text-[#203945]">
              الحالة الحالية
            </h2>
            <p className="mt-1 text-sm text-[#203945]/65">الخدمة الأحدث في حسابك ومسار طلبها.</p>
          </div>
          {latestRequest && (
            <span className={`w-fit rounded-full px-3 py-1 text-xs font-bold ${
              latestRequestProgress?.tone === 'success'
                ? 'bg-green-50 text-[#16A34A]'
                : latestRequestProgress?.tone === 'action'
                  ? 'bg-amber-50 text-[#D97706]'
                  : latestRequestProgress?.tone === 'progress'
                    ? 'bg-teal-50 text-[#0F766E]'
                    : 'bg-slate-100 text-[#64748B]'
            }`}>
              {latestRequestProgress?.label}
            </span>
          )}
        </div>

        {!latestRequest ? (
          <div className="rounded-[14px] border border-dashed border-[#CCD8D5] bg-white p-6 text-center">
            <Circle className="mx-auto h-8 w-8 text-[#9AABA6]" />
            <p className="mt-2 text-sm font-bold text-[#203945]">لا توجد خدمة أو طلب مسجل حاليًا.</p>
            <p className="mt-1 text-xs text-[#203945]/65">ستظهر هنا حالة طلبك ومساره عند تسجيل طلب جديد.</p>
          </div>
        ) : (
          <>
            <div className="rounded-[14px] bg-[#F3F7F6] p-3">
              <p className="text-[11px] text-[#203945]/60">الخدمة الحالية</p>
              <p className="mt-1 font-bold text-[#203945]">{latestRequest.serviceTitle}</p>
              <p className="mt-1 text-xs text-[#203945]/65" dir="ltr">{latestRequest.caseNumber}</p>
              <p className={`mt-2 text-xs font-semibold ${
                latestRequestProgress?.tone === 'action' ? 'text-[#D97706]' : 'text-[#64748B]'
              }`}>
                {latestRequestProgress?.detail}
              </p>
            </div>
            {latestRequestProgress?.status === 'ACTION_REQUIRED' && (
              <div className="flex flex-wrap gap-2">
                {(latestRequest.status === 'ACCEPTED' || latestRequest.status === 'WAITING_PAYMENT') &&
                ['PENDING', 'FAILED', 'CANCELLED'].includes(latestRequest.paymentStatus) ? (
                  <button
                    type="button"
                    onClick={() => onStartPayment(latestRequest)}
                    className="min-h-[44px] rounded-[12px] bg-[#0F766E] px-4 py-2 text-sm font-bold text-white"
                  >
                    إعادة محاولة الدفع
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => onSelectRequest(latestRequest)}
                    className="min-h-[44px] rounded-[12px] border border-[#E2E8F0] bg-white px-4 py-2 text-sm font-bold text-[#1E40AF]"
                  >
                    عرض تفاصيل الطلب
                  </button>
                )}
              </div>
            )}

            <ol className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              {journey.map((step, index) => (
                <li
                  key={`${step.title}-${index}`}
                  className={`rounded-[12px] border p-3 ${
                    step.done ? 'border-[#CFE5DA] bg-[#F3FAF6]' : 'border-[#E5ECE9] bg-white'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {step.done ? (
                      <Check className="h-4 w-4 shrink-0 text-[#25866D]" />
                    ) : (
                      <Circle className="h-4 w-4 shrink-0 text-[#9AABA6]" />
                    )}
                    <span className="text-xs font-bold text-[#203945]">{step.title}</span>
                  </div>
                  <p className="mt-2 text-[11px] leading-relaxed text-[#203945]/65">{step.detail}</p>
                </li>
              ))}
            </ol>
          </>
        )}
      </section>
    </div>
  );
};
