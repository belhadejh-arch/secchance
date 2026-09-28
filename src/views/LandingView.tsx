import React from 'react';
import {
  ShieldCheck,
  PlusCircle,
  Bot,
  PhoneCall,
  HeartPulse,
  Scale,
  Building2,
  CreditCard,
  ArrowLeft,
  CheckCircle,
} from 'lucide-react';

interface LandingViewProps {
  onNavigate: (view: string) => void;
  onOpenAiTriage: () => void;
  onNewCase: () => void;
}

export const LandingView: React.FC<LandingViewProps> = ({
  onNavigate,
  onOpenAiTriage,
  onNewCase,
}) => {
  return (
    <div className="space-y-6">
      {/* Hero Banner Card */}
      <div className="bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        {/* Background decorative pattern */}
        <div className="absolute top-0 -left-10 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 -right-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-blue-100">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>منصة رقمية وطنية متكاملة — التشريع الجزائري والمرافقة العيادية</span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black leading-tight sm:leading-snug">
            منصة الفرصة الثانية للدعم النفسي والاستشارات ومحاربة الإدمان
          </h1>

          <p className="text-sm sm:text-base text-blue-100/90 leading-relaxed font-normal">
            نوفر مرافقة سرية وآمنة عبر الخبراء والأطباء والمحامين ومراكز علاج الإدمان في جميع ولايات الوطن، مع نظام دفع إلكتروني آمن عبر البطاقة الذهبية و CIB ودعم المادة 6 من القانون 04-18.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <button
              onClick={onNewCase}
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-md transition-all active:scale-98"
            >
              <PlusCircle className="w-5 h-5" />
              <span>طلب خدمة أو استشارة</span>
            </button>

            <button
              onClick={onOpenAiTriage}
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/25 font-bold text-sm backdrop-blur-xs transition-all active:scale-98"
            >
              <Bot className="w-5 h-5 text-sky-300" />
              <span>التوجيه الذكي الآلي (AI Triage)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Emergency Hotline Banner */}
      <div className="bg-red-50 border border-red-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3.5 w-full sm:w-auto">
          <div className="w-12 h-12 rounded-xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <PhoneCall className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="font-extrabold text-sm sm:text-base text-red-950">
              خط الطوارئ الوطني 24/24 ساعة
            </h2>
            <p className="text-xs text-red-800/80 leading-normal">
              مركز السموم: 1032 | الدرك الوطني: 1055 | الشرطة: 1548 | الحماية المدنية: 14
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigate('emergency')}
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-bold shadow-xs transition-colors shrink-0 text-center"
        >
          أرقام النجدة والإسعاف
        </button>
      </div>

      {/* Features Grid Header */}
      <div className="flex items-center justify-between pt-2">
        <h2 className="text-lg font-black text-slate-900">
          خدمات المنصة الأساسية
        </h2>
        <button
          onClick={() => onNavigate('services')}
          className="text-xs font-bold text-blue-700 hover:text-blue-800 flex items-center gap-1"
        >
          <span>عرض كافة الخدمات</span>
          <ArrowLeft className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Feature Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div
          onClick={() => onNavigate('services')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-blue-400 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center mb-3.5 group-hover:bg-blue-700 group-hover:text-white transition-colors">
              <HeartPulse className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm mb-1">
              الدعم النفسي العيادي
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              متابعة سرية مع أخصائيين نفسيين عياديين معتمدين وجلسات فردية وأسرية.
            </p>
          </div>
          <span className="text-[11px] font-bold text-blue-700 mt-3 block">
            استكشف الجلسات ←
          </span>
        </div>

        {/* Card 2 */}
        <div
          onClick={() => onNavigate('services')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-blue-400 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-3.5 group-hover:bg-emerald-700 group-hover:text-white transition-colors">
              <Scale className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm mb-1">
              الاستشارة القانونية
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              توجيه قانوني وفق القانون 04-18 والمادة 6 (العلاج الطوعي وإسقاط المتابعة).
            </p>
          </div>
          <span className="text-[11px] font-bold text-emerald-700 mt-3 block">
            استشارات المحامين ←
          </span>
        </div>

        {/* Card 3 */}
        <div
          onClick={() => onNavigate('directory')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-blue-400 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center mb-3.5 group-hover:bg-amber-600 group-hover:text-white transition-colors">
              <Building2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm mb-1">
              مراكز علاج الإدمان
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              دليل المؤسسات الاستشفائية المتخصصة والجمعيات الوطنية عبر الولايات.
            </p>
          </div>
          <span className="text-[11px] font-bold text-amber-700 mt-3 block">
            دليل المراكز المعتمدة ←
          </span>
        </div>

        {/* Card 4 */}
        <div
          onClick={() => onNavigate('services')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-blue-400 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center mb-3.5 group-hover:bg-indigo-700 group-hover:text-white transition-colors">
              <CreditCard className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm mb-1">
              الدفع الإلكتروني الآمن
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              تسديد تكاليف الجلسات والاستشارات عبر البطاقة الذهبية وبطاقات CIB البنكية.
            </p>
          </div>
          <span className="text-[11px] font-bold text-indigo-700 mt-3 block">
            بوابة الدفع الوطنية ←
          </span>
        </div>
      </div>

      {/* Trust & Legal Safeguards */}
      <div className="bg-slate-100/70 border border-slate-200/80 rounded-2xl p-5">
        <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider mb-3">
          ضمانات ومزايا منصة الفرصة الثانية:
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-700">
          <div className="flex items-center gap-2 bg-white p-3 rounded-xl border border-slate-200">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>سرية تامة وتشفير كامل للبيانات</span>
          </div>
          <div className="flex items-center gap-2 bg-white p-3 rounded-xl border border-slate-200">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>خبراء وأطباء معتمدون رسمياً</span>
          </div>
          <div className="flex items-center gap-2 bg-white p-3 rounded-xl border border-slate-200">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>تطبيق كامل للمادة 6 من القانون 04-18</span>
          </div>
        </div>
      </div>
    </div>
  );
};
