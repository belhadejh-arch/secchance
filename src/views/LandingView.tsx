import React from 'react';
import {
  ShieldCheck,
  PlusCircle,
  Bot,
  PhoneCall,
  Brain,
  Scale,
  Hospital,
  CreditCard,
  AlertTriangle,
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
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* Hero Banner Card with Official Logo */}
      <div className="bg-[#EAF3F8] rounded-[24px] p-5 sm:p-7 shadow-xs border border-[#DCEBF4]">
        <div className="flex flex-col sm:flex-row items-center gap-5 sm:gap-6">
          <img
            src="/logo.png"
            alt="شعار منصة الفرصة الثانية"
            className="w-24 h-24 sm:w-28 sm:h-28 object-contain rounded-2xl bg-white p-2 shadow-xs border border-[#CCD8D5] shrink-0"
          />

          <div className="space-y-2.5 text-center sm:text-right flex-1">
            <div className="inline-flex items-center gap-1.5 bg-white/70 px-2.5 py-1 rounded-full text-[11px] font-bold text-[#1766A6] shadow-2xs">
              <ShieldCheck className="w-4 h-4" />
              <span>المنصة الرقمية الوطنية الأولى للدعم النفسي والقانوني</span>
            </div>

            <h1 className="text-[20px] sm:text-2xl font-black text-[#104A78] leading-snug">
              منصة الفرصة الثانية — معاً من أجل حياة أفضل
            </h1>

            <p className="text-[12px] sm:text-[13px] text-[#104A78]/80 leading-relaxed font-normal">
              نوفر مرافقة سرية وآمنة عبر الخبراء والأطباء والمحامين ومراكز علاج الإدمان في جميع ولايات الوطن مع نظام دفع إلكتروني آمن بالبطاقة الذهبية و CIB.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row gap-2">
              <button
                onClick={onNewCase}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-[12px] bg-[#1766A6] hover:bg-[#125386] text-white font-bold text-xs sm:text-sm shadow-xs transition-colors"
              >
                <PlusCircle className="w-4 h-4" />
                <span>طلب خدمة أو استشارة</span>
              </button>

              <button
                onClick={() => onNavigate('legal-assistance')}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-[12px] bg-[#25866D] hover:bg-[#1e6c58] text-white font-bold text-xs sm:text-sm shadow-xs transition-colors"
              >
                <Scale className="w-4 h-4" />
                <span>المساعدة القانونية</span>
              </button>

              <button
                onClick={onOpenAiTriage}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-[12px] border border-[#1766A6] text-[#1766A6] hover:bg-[#1766A6]/10 font-bold text-xs sm:text-sm transition-colors"
              >
                <Bot className="w-4 h-4" />
                <span>التوجيه الذكي الآلي</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Emergency Banner Card (Requirement 18 & 19) */}
      <div className="bg-[#FBECEB] rounded-[18px] p-4 border border-[#F5D4D2] flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-[12px] bg-[#A64842] text-white flex items-center justify-center shrink-0">
            <PhoneCall className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-[13px] sm:text-[14px] font-bold text-[#5F1D1A]">
              طوارئ السموم والإسعاف: مركز مكافحة السموم (020 39 59 59)
            </h2>
            <p className="text-[11px] text-[#5F1D1A]/80 leading-normal">
              الدرك الوطني: 1055 | الشرطة: 1548 | الحماية المدنية: 14
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigate('emergency')}
          className="w-full sm:w-auto px-4 py-2 rounded-[10px] bg-[#A64842] hover:bg-[#8e3c37] text-white text-[12px] font-bold shadow-xs transition-colors shrink-0 flex items-center justify-center gap-1.5"
        >
          <span>دليل الطوارئ والسموم</span>
        </button>
      </div>

      {/* Features Grid Header */}
      <div className="pt-2">
        <h2 className="text-[16px] font-bold text-[#203945]">
          خدمات المنصة الأساسية
        </h2>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Card 1 */}
        <div
          onClick={() => onNavigate('services')}
          className="bg-[#FBFDFC] p-4 rounded-[16px] border border-[#E5ECE9] shadow-xs hover:border-[#1766A6]/40 transition-all cursor-pointer space-y-2"
        >
          <div className="w-[38px] h-[38px] rounded-[10px] bg-[#E8F4EF] text-[#25866D] flex items-center justify-center">
            <Brain className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-[13px] text-[#203945]">
            الدعم النفسي العيادي
          </h3>
          <p className="text-[11px] text-[#203945]/70 leading-[16px]">
            متابعة مع أخصائيين نفسيين وجلسات سرية وتقارير متابعة معتمدة
          </p>
        </div>

        {/* Card 2 */}
        <div
          onClick={() => onNavigate('legal-assistance')}
          className="bg-[#FBFDFC] p-4 rounded-[16px] border border-[#E5ECE9] shadow-xs hover:border-[#1766A6]/40 transition-all cursor-pointer space-y-2"
        >
          <div className="w-[38px] h-[38px] rounded-[10px] bg-[#EAF3F8] text-[#1766A6] flex items-center justify-center">
            <Scale className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-[13px] text-[#203945]">
            المساعدة القانونية (القانون 04-18)
          </h3>
          <p className="text-[11px] text-[#203945]/70 leading-[16px]">
            حماية أسرية وتوجيه قانوني واستفادة من العلاج الطوعي بالمادة 6
          </p>
        </div>

        {/* Card 3 */}
        <div
          onClick={() => onNavigate('directory')}
          className="bg-[#FBFDFC] p-4 rounded-[16px] border border-[#E5ECE9] shadow-xs hover:border-[#1766A6]/40 transition-all cursor-pointer space-y-2"
        >
          <div className="w-[38px] h-[38px] rounded-[10px] bg-[#E8F4EF] text-[#25866D] flex items-center justify-center">
            <Hospital className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-[13px] text-[#203945]">
            مراكز علاج الإدمان (40 مركزاً)
          </h3>
          <p className="text-[11px] text-[#203945]/70 leading-[16px]">
            دليل المراكز الوسيطة (CISA / EPSP) والمصالح الاستشفائية
          </p>
        </div>

        {/* Card 4 */}
        <div
          onClick={() => onNavigate('services')}
          className="bg-[#FBFDFC] p-4 rounded-[16px] border border-[#E5ECE9] shadow-xs hover:border-[#1766A6]/40 transition-all cursor-pointer space-y-2"
        >
          <div className="w-[38px] h-[38px] rounded-[10px] bg-[#E8F4EF] text-[#25866D] flex items-center justify-center">
            <CreditCard className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-[13px] text-[#203945]">
            الدفع الإلكتروني الآمن
          </h3>
          <p className="text-[11px] text-[#203945]/70 leading-[16px]">
            بطاقة الذهبية و CIB لتأكيد المواعيد والخدمات
          </p>
        </div>
      </div>
    </div>
  );
};
