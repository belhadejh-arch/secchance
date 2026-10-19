import React, { useMemo, useState } from "react";
import {
  Activity,
  Bell,
  BriefcaseMedical,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  FileText,
  HandHeart,
  HeartPulse,
  Home,
  Landmark,
  Menu,
  Search,
  ShieldCheck,
  UsersRound,
  Wallet,
  X,
} from "lucide-react";
import type { CareRequest, PaymentTransaction, User } from "../types";

export interface AdminHomeOverviewProps {
  currentUser: User | null;
  users: User[];
  requests: CareRequest[];
  transactions: PaymentTransaction[];
  onSelectSection: (section: AdminSectionKey) => void;
  onOpenRequestDetails: (request: CareRequest) => void;
}

export type AdminSectionKey =
  | "overview"
  | "users"
  | "lawyers"
  | "specialists"
  | "services"
  | "requests"
  | "appointments"
  | "centers"
  | "associations"
  | "family-packages"
  | "payments"
  | "invoices"
  | "content"
  | "reports"
  | "statistics"
  | "data-protection"
  | "audit"
  | "settings";

const navigationItems = [
  { label: "الرئيسية", key: "overview", icon: Home },
  { label: "المستخدمون", key: "users", icon: UsersRound },
  { label: "المستشارون القانونيون", key: "lawyers", icon: Landmark },
  { label: "المختصون النفسيون العياديون", key: "specialists", icon: HeartPulse },
  { label: "الخدمات", key: "services", icon: BriefcaseMedical },
  { label: "الطلبات", key: "requests", icon: FileText },
  { label: "المواعيد", key: "appointments", icon: CalendarDays },
  { label: "مراكز العلاج", key: "centers", icon: Building2 },
  { label: "الجمعيات", key: "associations", icon: HandHeart },
  { label: "الباقات الأسرية", key: "family-packages", icon: UsersRound },
  { label: "المدفوعات", key: "payments", icon: Wallet },
  { label: "الفواتير", key: "invoices", icon: FileText },
  { label: "المحتوى", key: "content", icon: Activity },
  { label: "التقارير", key: "reports", icon: FileText },
  { label: "الإحصائيات", key: "statistics", icon: Activity },
  { label: "حماية البيانات", key: "data-protection", icon: ShieldCheck },
  { label: "سجل العمليات", key: "audit", icon: Activity },
  { label: "الإعدادات", key: "settings", icon: Activity },
] as const;

const isLegalRequest = (request: CareRequest) => {
  const text = `${request.category} ${request.serviceTitle}`.toLocaleLowerCase();
  return /legal|lawyer|law|قانون|محام/.test(text);
};

const isPsychologicalRequest = (request: CareRequest) => {
  const text = `${request.category} ${request.serviceTitle}`.toLocaleLowerCase();
  return /psych|mental|نفس|عياد|أخصائي نفسي|مختص نفسي/.test(text);
};

const parseDate = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatCurrency = (value: number) =>
  `${new Intl.NumberFormat("ar-DZ", { maximumFractionDigits: 0 }).format(value)} دج`;

const formatDate = (value: string) => {
  const date = parseDate(value);
  return date
    ? new Intl.DateTimeFormat("ar-DZ", { day: "numeric", month: "short" }).format(date)
    : "—";
};

const statusLabels: Record<string, string> = {
  NEW: "جديد",
  PENDING_PROVIDER: "بانتظار المختص",
  ACCEPTED: "مقبول",
  WAITING_PAYMENT: "بانتظار الدفع",
  PAID: "مدفوع",
  APPOINTMENT_CONFIRMED: "موعد مؤكد",
  IN_PROGRESS: "قيد التنفيذ",
  COMPLETED: "مكتمل",
  REJECTED: "مرفوض",
  CANCELLED: "ملغى",
};

const statusClassNames: Record<string, string> = {
  NEW: "border-[#d8e9e5] bg-[#edf6f3] text-[#236856]",
  PENDING_PROVIDER: "border-[#f0dfbc] bg-[#fbf4e7] text-[#876321]",
  ACCEPTED: "border-[#d8e9e5] bg-[#edf6f3] text-[#236856]",
  WAITING_PAYMENT: "border-[#f0dfbc] bg-[#fbf4e7] text-[#876321]",
  PAID: "border-[#d8e9e5] bg-[#edf6f3] text-[#236856]",
  APPOINTMENT_CONFIRMED: "border-[#d8e9e5] bg-[#edf6f3] text-[#236856]",
  IN_PROGRESS: "border-[#d9e4eb] bg-[#eff4f7] text-[#496879]",
  COMPLETED: "border-[#d8e9e5] bg-[#edf6f3] text-[#236856]",
  REJECTED: "border-[#efd9d5] bg-[#fbefed] text-[#9a4c40]",
  CANCELLED: "border-[#e4e5e1] bg-[#f3f3ef] text-[#72756e]",
};

interface MetricProps {
  label: string;
  value: string;
  hint: string;
  icon: React.ElementType;
  tone: "teal" | "blue" | "gold" | "rose";
}

const Metric: React.FC<MetricProps> = ({ label, value, hint, icon: Icon, tone }) => {
  const tones = {
    teal: "bg-[#e7f2ee] text-[#387565]",
    blue: "bg-[#e8eff3] text-[#557487]",
    gold: "bg-[#f6efdf] text-[#92783b]",
    rose: "bg-[#f6eae6] text-[#a76355]",
  };

  return (
    <article className="group min-w-0 rounded-[18px] border border-[#e0e7e3] bg-[#fcfdfb] p-4 shadow-[0_3px_12px_rgba(37,65,55,0.035)] transition-transform duration-200 hover:-translate-y-0.5 sm:p-[18px]">
      <div className="flex items-start justify-between gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] ${tones[tone]}`}>
          <Icon aria-hidden="true" size={19} strokeWidth={1.8} />
        </div>
        <span className="mt-1 text-[11px] font-medium leading-5 text-[#89958e]">{hint}</span>
      </div>
      <p className="mt-4 truncate text-[25px] font-bold leading-none tracking-[-0.04em] text-[#233b37] tabular-nums sm:text-[28px]">
        {value}
      </p>
      <h3 className="mt-2 text-[12px] font-semibold text-[#697a73] sm:text-[13px]">{label}</h3>
    </article>
  );
};

interface ChartPoint {
  x: number;
  y: number;
  value: number;
}

const AdminHomeOverview: React.FC<AdminHomeOverviewProps> = ({
  currentUser,
  users,
  requests,
  transactions,
  onSelectSection,
  onOpenRequestDetails,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const metrics = useMemo(() => {
    const legalRequests = requests.filter(isLegalRequest);
    const psychologicalRequests = requests.filter(isPsychologicalRequest);
    const treatmentCenters = users.filter((user) =>
      ["treatment_center", "clinic", "hospital"].includes(user.roleSlug),
    );
    const associations = users.filter((user) => user.roleSlug === "association");
    const revenue = transactions
      .filter((transaction) => transaction.status === "SUCCESSFUL" && transaction.paymentMethod !== "DEMO")
      .reduce((total, transaction) => total + (Number(transaction.amountDzd) || 0), 0);

    return {
      legalRequests,
      psychologicalRequests,
      values: [
        { label: "إجمالي المستخدمين", value: users.length.toLocaleString("ar-DZ"), hint: "كل الحسابات المسجلة", icon: UsersRound, tone: "teal" as const },
        { label: "الاستشارات القانونية", value: legalRequests.length.toLocaleString("ar-DZ"), hint: "طلبات قانونية مسجلة", icon: Landmark, tone: "blue" as const },
        { label: "الاستشارات النفسية", value: psychologicalRequests.length.toLocaleString("ar-DZ"), hint: "طلبات نفسية مسجلة", icon: HeartPulse, tone: "rose" as const },
        { label: "مراكز العلاج", value: treatmentCenters.length.toLocaleString("ar-DZ"), hint: "حسابات المراكز والعيادات", icon: Building2, tone: "gold" as const },
        { label: "الجمعيات", value: associations.length.toLocaleString("ar-DZ"), hint: "حسابات الجمعيات المسجلة", icon: HandHeart, tone: "teal" as const },
        { label: "الإيرادات المحصلة", value: formatCurrency(revenue), hint: "المعاملات الناجحة", icon: Wallet, tone: "blue" as const },
      ],
    };
  }, [users, requests, transactions]);

  const chartData = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const dayCount = new Date(year, month + 1, 0).getDate();
    const legal = Array.from({ length: dayCount }, () => 0);
    const psychological = Array.from({ length: dayCount }, () => 0);

    requests.forEach((request) => {
      const date = parseDate(request.createdAt);
      if (!date || date.getFullYear() !== year || date.getMonth() !== month) return;
      const index = date.getDate() - 1;
      if (isLegalRequest(request)) legal[index] += 1;
      if (isPsychologicalRequest(request)) psychological[index] += 1;
    });

    const hasData = legal.some(Boolean) || psychological.some(Boolean);
    const maxValue = Math.max(1, ...legal, ...psychological);
    const left = 38;
    const right = 620;
    const top = 18;
    const bottom = 177;
    const toPoints = (values: number[]): ChartPoint[] =>
      values.map((value, index) => ({
        x: left + (index / Math.max(1, dayCount - 1)) * (right - left),
        y: bottom - (value / maxValue) * (bottom - top),
        value,
      }));

    return {
      dayCount,
      hasData,
      legal,
      psychological,
      legalTotal: legal.reduce((total, count) => total + count, 0),
      psychologicalTotal: psychological.reduce((total, count) => total + count, 0),
      legalPoints: toPoints(legal),
      psychologicalPoints: toPoints(psychological),
      maxValue,
      left,
      right,
      top,
      bottom,
      monthLabel: new Intl.DateTimeFormat("ar-DZ", { month: "long", year: "numeric" }).format(now),
    };
  }, [requests]);

  const visibleRequests = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase();
    return [...requests]
      .sort((a, b) => {
        const dateA = parseDate(a.createdAt)?.getTime() ?? 0;
        const dateB = parseDate(b.createdAt)?.getTime() ?? 0;
        return dateB - dateA;
      })
      .filter((request) =>
        !query ||
        request.clientName.toLocaleLowerCase().includes(query) ||
        request.serviceTitle.toLocaleLowerCase().includes(query),
      )
      .slice(0, 6);
  }, [requests, searchQuery]);

  const currentName = currentUser
    ? `${currentUser.firstName} ${currentUser.lastName}`.trim()
    : "مسؤول النظام";
  const initials = currentUser
    ? `${currentUser.firstName?.[0] ?? ""}${currentUser.lastName?.[0] ?? ""}`
    : "م";
  const actionableRequests = requests.filter((request) =>
    ["NEW", "PENDING_PROVIDER"].includes(request.status),
  ).length;
  const legalTotal = chartData.legalTotal;
  const psychologicalTotal = chartData.psychologicalTotal;
  const legalPath = chartData.legalPoints.map((point) => `${point.x},${point.y}`).join(" ");
  const psychologicalPath = chartData.psychologicalPoints
    .map((point) => `${point.x},${point.y}`)
    .join(" ");
  const tickDays = [...new Set([
    1,
    Math.ceil(chartData.dayCount * 0.25),
    Math.ceil(chartData.dayCount * 0.5),
    Math.ceil(chartData.dayCount * 0.75),
    chartData.dayCount,
  ])];

  const handleNavigation = (key: AdminSectionKey) => {
    onSelectSection(key);
    setMobileNavOpen(false);
  };

  return (
    <div dir="rtl" className="min-h-[100dvh] w-full bg-[#f2f6f3] text-[#263c37]">
      <div className="mx-auto grid min-h-[100dvh] w-full max-w-[1440px] grid-cols-1 lg:grid-cols-[minmax(0,1fr)_238px]">
        <main className="min-w-0 px-4 pb-8 pt-4 sm:px-6 sm:pt-6 lg:px-8 lg:py-7">
          <header className="mb-6 flex min-h-[54px] items-center gap-3 sm:mb-7">
            <button
              type="button"
              onClick={() => setMobileNavOpen((open) => !open)}
              aria-label={mobileNavOpen ? "إغلاق القائمة" : "فتح القائمة"}
              aria-expanded={mobileNavOpen}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#dce5df] bg-[#fbfdfb] text-[#536c63] transition-colors hover:bg-[#eaf2ee] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4e8877] lg:hidden"
            >
              {mobileNavOpen ? <X size={19} /> : <Menu size={19} />}
            </button>
            <label className="flex h-11 min-w-0 flex-1 items-center gap-2.5 rounded-xl border border-[#dce5df] bg-[#fbfdfb] px-3.5 text-[#7f9088] shadow-[0_2px_7px_rgba(42,69,59,0.025)] focus-within:border-[#8eafa3] focus-within:ring-2 focus-within:ring-[#dcebe4] sm:max-w-[420px]">
              <Search aria-hidden="true" size={17} className="shrink-0" />
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="ابحث باسم العميل أو الخدمة..."
                aria-label="البحث في الطلبات حسب العميل أو الخدمة"
                className="w-full min-w-0 bg-transparent text-[12px] text-[#263c37] outline-none placeholder:text-[#99a69f]"
              />
              <kbd className="hidden rounded-md border border-[#e4e9e5] bg-[#f5f8f5] px-1.5 py-0.5 text-[10px] text-[#96a29b] sm:block">⌕</kbd>
            </label>
            <button
              type="button"
              onClick={() => onSelectSection("requests")}
              aria-label={`التنبيهات، ${actionableRequests} طلبات بحاجة إلى متابعة`}
              title="الانتقال إلى الطلبات"
              className="relative inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#dce5df] bg-[#fbfdfb] text-[#60756c] transition-colors hover:bg-[#eaf2ee] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4e8877]"
            >
              <Bell size={18} strokeWidth={1.8} />
              {actionableRequests > 0 && (
                <span className="absolute -left-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-[#f2f6f3] bg-[#bd725d] px-1 text-[9px] font-bold text-white tabular-nums">
                  {actionableRequests > 99 ? "٩٩+" : actionableRequests.toLocaleString("ar-DZ")}
                </span>
              )}
            </button>
            <div className="hidden items-center gap-2.5 border-r border-[#dce5df] pr-3 sm:flex">
              <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[#cee0d8] bg-[#e5f0eb] text-[12px] font-bold text-[#3e7464]">
                {initials}
              </div>
              <div className="max-w-[150px]">
                <p className="truncate text-[12px] font-bold text-[#354a44]">{currentName}</p>
                <p className="mt-0.5 text-[10px] text-[#89968f]">مسؤول النظام</p>
              </div>
            </div>
          </header>

          <section aria-labelledby="overview-title">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="mb-1.5 text-[11px] font-semibold tracking-[0.04em] text-[#6d8a7e]">
                  منصة فرصة ثانية
                </p>
                <h1 id="overview-title" className="text-[23px] font-bold tracking-[-0.035em] text-[#263d37] sm:text-[27px]">
                  نظرة عامة
                </h1>
                <p className="mt-1.5 text-[12px] leading-5 text-[#829089]">
                  متابعة خدمات الدعم القانوني والنفسي للعائلات
                </p>
              </div>
              <div className="mb-0.5 inline-flex items-center gap-2 rounded-full border border-[#dce8e1] bg-[#f9fcf9] px-3 py-1.5 text-[10px] font-semibold text-[#6d8178]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#5c9a7c]" />
                بيانات المنصة المباشرة
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-3.5">
              {metrics.values.map((metric) => (
                <Metric key={metric.label} {...metric} />
              ))}
            </div>
          </section>

          <section className="mt-6 rounded-[20px] border border-[#e0e7e3] bg-[#fcfdfb] p-4 shadow-[0_4px_18px_rgba(37,65,55,0.035)] sm:mt-7 sm:p-5" aria-labelledby="chart-title">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 id="chart-title" className="text-[14px] font-bold text-[#314943]">الاستشارات خلال الشهر الحالي</h2>
                <p className="mt-1 text-[11px] text-[#8a9891]">{chartData.monthLabel}</p>
              </div>
              <div className="flex items-center gap-4 text-[10px] font-semibold text-[#76867e]">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#548978]" />
                  قانونية <span className="text-[#405c52] tabular-nums">{legalTotal.toLocaleString("ar-DZ")}</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#8b9fb4]" />
                  نفسية <span className="text-[#405c52] tabular-nums">{psychologicalTotal.toLocaleString("ar-DZ")}</span>
                </span>
              </div>
            </div>

            {chartData.hasData ? (
              <div className="w-full overflow-hidden">
                <svg
                  viewBox="0 0 640 218"
                  role="img"
                  aria-label={`مخطط يومي للاستشارات القانونية والنفسية لشهر ${chartData.monthLabel}`}
                  className="h-[190px] w-full overflow-visible sm:h-[220px]"
                  preserveAspectRatio="none"
                >
                  {[0, 1, 2, 3].map((line) => {
                    const y = chartData.top + ((chartData.bottom - chartData.top) / 3) * line;
                    const value = Math.round(chartData.maxValue * (1 - line / 3));
                    return (
                      <g key={line}>
                        <line x1={chartData.left} y1={y} x2={chartData.right} y2={y} stroke="#e9eeea" strokeDasharray="3 5" />
                        <text x="27" y={y + 3} textAnchor="end" fontSize="9" fill="#99a69f">{value.toLocaleString("ar-DZ")}</text>
                      </g>
                    );
                  })}
                  {tickDays.map((day) => {
                    const x = chartData.left + ((day - 1) / Math.max(1, chartData.dayCount - 1)) * (chartData.right - chartData.left);
                    return (
                      <text key={day} x={x} y="205" textAnchor="middle" fontSize="9" fill="#99a69f">
                        {day.toLocaleString("ar-DZ")}
                      </text>
                    );
                  })}
                  <polyline points={legalPath} fill="none" stroke="#548978" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  <polyline points={psychologicalPath} fill="none" stroke="#8b9fb4" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  {chartData.legalPoints.map((point, index) =>
                    point.value > 0 ? (
                      <circle key={`legal-${index}`} cx={point.x} cy={point.y} r="3.2" fill="#548978" stroke="#fcfdfb" strokeWidth="1.5" />
                    ) : null,
                  )}
                  {chartData.psychologicalPoints.map((point, index) =>
                    point.value > 0 ? (
                      <circle key={`psych-${index}`} cx={point.x} cy={point.y} r="3.2" fill="#8b9fb4" stroke="#fcfdfb" strokeWidth="1.5" />
                    ) : null,
                  )}
                </svg>
              </div>
            ) : (
              <div className="flex min-h-[176px] flex-col items-center justify-center rounded-[14px] border border-dashed border-[#dce6e0] bg-[#f7faf7] px-4 text-center">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#eaf2ee] text-[#6d9586]">
                  <Activity size={18} strokeWidth={1.7} />
                </div>
                <p className="text-[12px] font-semibold text-[#50675e]">لا توجد استشارات مسجلة هذا الشهر</p>
                <p className="mt-1 text-[10px] text-[#909d96]">سيظهر النشاط هنا عند تسجيل طلبات قانونية أو نفسية.</p>
              </div>
            )}
          </section>

          <section className="mt-6 overflow-hidden rounded-[20px] border border-[#e0e7e3] bg-[#fcfdfb] shadow-[0_4px_18px_rgba(37,65,55,0.035)] sm:mt-7" aria-labelledby="requests-title">
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 pb-3 pt-4 sm:px-5 sm:pt-5">
              <div>
                <h2 id="requests-title" className="text-[14px] font-bold text-[#314943]">أحدث الطلبات</h2>
                <p className="mt-1 text-[11px] text-[#8a9891]">آخر الطلبات الواردة إلى المنصة</p>
              </div>
              <button
                type="button"
                onClick={() => onSelectSection("requests")}
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-semibold text-[#4b7b6c] transition-colors hover:bg-[#edf5f0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#91b2a4]"
              >
                عرض كل الطلبات <ChevronLeft size={14} aria-hidden="true" />
              </button>
            </div>

            {visibleRequests.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] border-collapse text-right">
                  <thead>
                    <tr className="border-y border-[#edf0ed] bg-[#f7f9f6] text-[10px] font-semibold text-[#89968f]">
                      <th scope="col" className="px-5 py-3">العميل</th>
                      <th scope="col" className="px-4 py-3">الخدمة</th>
                      <th scope="col" className="px-4 py-3">السعر</th>
                      <th scope="col" className="px-4 py-3">الحالة</th>
                      <th scope="col" className="px-4 py-3">تاريخ الطلب</th>
                      <th scope="col" className="w-10 px-3 py-3"><span className="sr-only">التفاصيل</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleRequests.map((request) => (
                      <tr
                        key={request.id}
                        tabIndex={0}
                        role="button"
                        aria-label={`عرض تفاصيل طلب ${request.clientName} لخدمة ${request.serviceTitle}`}
                        onClick={() => onOpenRequestDetails(request)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            onOpenRequestDetails(request);
                          }
                        }}
                        className="cursor-pointer border-b border-[#eef1ed] text-[11px] text-[#485e55] outline-none transition-colors last:border-b-0 hover:bg-[#f5f9f6] focus-visible:bg-[#f0f6f2] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#91b2a4]"
                      >
                        <td className="px-5 py-3.5">
                          <span className="block font-semibold text-[#344b43]">{request.clientName}</span>
                          <span className="mt-1 block text-[9px] text-[#98a39d]">طلب رقم {String(request.caseNumber || request.id)}</span>
                        </td>
                        <td className="max-w-[180px] truncate px-4 py-3.5">{request.serviceTitle}</td>
                        <td className="whitespace-nowrap px-4 py-3.5 font-semibold tabular-nums">{formatCurrency(Number(request.amountDzd) || 0)}</td>
                        <td className="px-4 py-3.5">
                          <span className={`inline-flex whitespace-nowrap rounded-full border px-2 py-1 text-[9px] font-semibold ${statusClassNames[request.status] ?? "border-[#e4e5e1] bg-[#f3f3ef] text-[#72756e]"}`}>
                            {statusLabels[request.status] ?? request.status}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3.5 text-[#819088]">{formatDate(request.createdAt)}</td>
                        <td className="px-3 py-3.5 text-[#a0aba4]"><ChevronLeft size={15} aria-hidden="true" /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="mx-4 mb-4 flex min-h-[154px] flex-col items-center justify-center rounded-[14px] border border-dashed border-[#dce6e0] bg-[#f7faf7] px-4 text-center sm:mx-5 sm:mb-5">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#eaf2ee] text-[#6d9586]">
                  {searchQuery ? <Search size={17} /> : <FileText size={17} />}
                </div>
                <p className="text-[12px] font-semibold text-[#50675e]">
                  {searchQuery ? "لا توجد طلبات مطابقة للبحث" : "لا توجد طلبات حتى الآن"}
                </p>
                <p className="mt-1 text-[10px] text-[#909d96]">
                  {searchQuery ? "جرّب البحث باسم عميل أو خدمة مختلفة." : "ستظهر الطلبات الجديدة هنا عند ورودها."}
                </p>
              </div>
            )}
          </section>
          <p className="mt-5 text-center text-[10px] text-[#9aa69f]">
            منصة فرصة ثانية <span className="mx-1 text-[#c2cdc6]">·</span> إدارة الدعم بمسؤولية
          </p>
        </main>

        <aside className={`fixed inset-y-0 right-0 z-30 flex w-[280px] flex-col border-l border-[#e0e7e3] bg-[#f8faf7] px-3 pb-4 pt-5 shadow-[0_12px_40px_rgba(32,61,50,0.12)] transition-transform duration-200 lg:sticky lg:top-0 lg:z-auto lg:h-[100dvh] lg:w-auto lg:translate-x-0 lg:shadow-none ${mobileNavOpen ? "translate-x-0" : "translate-x-full"}`}>
          <div className="mb-6 flex items-center gap-3 px-2.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-[#477f6e] text-[#f2f7f3] shadow-[0_3px_10px_rgba(71,127,110,0.18)]">
              <HandHeart size={21} strokeWidth={1.8} />
            </div>
            <div className="min-w-0">
              <p className="truncate text-[13px] font-bold tracking-[-0.02em] text-[#334b42]">فرصة ثانية</p>
              <p className="mt-0.5 text-[9px] font-medium tracking-[0.08em] text-[#87968e]">إدارة المنصة</p>
            </div>
          </div>
          <p className="mb-2 px-3 text-[9px] font-bold tracking-[0.1em] text-[#a0aaa3]">القائمة الرئيسية</p>
          <nav aria-label="التنقل الرئيسي" className="flex-1 space-y-0.5 overflow-y-auto pb-3">
            {navigationItems.map(({ label, key, icon: Icon }) => {
              const selected = key === "overview";
              return (
                <button
                  key={key}
                  type="button"
                  aria-current={selected ? "page" : undefined}
                  onClick={() => handleNavigation(key)}
                  className={`group flex w-full items-center gap-2.5 rounded-[10px] px-3 py-[9px] text-right transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8eafa3] ${
                    selected
                      ? "bg-[#e7f0eb] font-bold text-[#3e7665]"
                      : "font-medium text-[#728078] hover:bg-[#edf3ef] hover:text-[#405c51]"
                  }`}
                >
                  <Icon aria-hidden="true" size={16} strokeWidth={selected ? 2 : 1.8} className="shrink-0" />
                  <span className="min-w-0 flex-1 text-[10.5px] leading-4">{label}</span>
                  {selected && <span className="h-1.5 w-1.5 rounded-full bg-[#568c79]" />}
                </button>
              );
            })}
          </nav>
          <div className="mt-2 rounded-[14px] border border-[#e0e9e3] bg-[#f1f6f1] p-3">
            <div className="mb-2 flex items-center gap-2 text-[#5f8676]">
              <CheckCircle2 size={14} aria-hidden="true" />
              <span className="text-[10px] font-bold">مساحة آمنة</span>
            </div>
            <p className="text-[9px] leading-[1.7] text-[#82928a]">
              تُدار بيانات العائلات بسرية واحترام.
            </p>
          </div>
          <div className="mt-3 flex items-center gap-2.5 border-t border-[#e4eae5] px-2 pt-3 lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#e5f0eb] text-[11px] font-bold text-[#3e7464]">{initials}</div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[11px] font-bold text-[#354a44]">{currentName}</p>
              <p className="text-[9px] text-[#89968f]">مسؤول النظام</p>
            </div>
            <button type="button" onClick={() => setMobileNavOpen(false)} aria-label="إغلاق القائمة" className="rounded-lg p-1.5 text-[#74847c] hover:bg-[#eaf2ee] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8eafa3]">
              <X size={15} aria-hidden="true" />
            </button>
          </div>
        </aside>
        {mobileNavOpen && (
          <button
            type="button"
            aria-label="إغلاق القائمة"
            onClick={() => setMobileNavOpen(false)}
            className="fixed inset-0 z-20 bg-[#20372f]/25 backdrop-blur-[1px] lg:hidden"
          />
        )}
      </div>
    </div>
  );
};

export default AdminHomeOverview;
