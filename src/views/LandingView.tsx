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
      {/* Hero Banner Card */}
      <div className="bg-[#EAF3F8] rounded-[24px] p-6 sm:p-7 shadow-xs">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#1766A6]" />
            <span className="text-[12px] font-bold text-[#1766A6]">
              منصة رقمية وطنية متكاملة
            </span>
          </div>

          <h1 className="text-[22px] sm:text-2xl font-black text-[#104A78] leading-snug">
            منصة الفرصة الثانية للدعم النفسي والاستشارات ومحاربة الإدمان
          </h1>

          <p className="text-[13px] text-[#104A78]/80 leading-relaxed font-normal">
            نوفر مرافقة سرية وآمنة عبر الخبراء والأطباء والمحامين ومراكز علاج الإدمان في جميع ولايات الوطن مع نظام دفع إلكتروني آمن.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
            <button
              onClick={onNewCase}
              className="flex-1 flex items-center justify-center gap-1.5 py-3 px-4 rounded-[12px] bg-[#1766A6] hover:bg-[#125386] text-white font-bold text-xs sm:text-sm shadow-xs transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              <span>طلب خدمة أو استشارة</span>
            </button>

            <button
              onClick={onOpenAiTriage}
              className="flex-1 flex items-center justify-center gap-1.5 py-3 px-4 rounded-[12px] border border-[#1766A6] text-[#1766A6] hover:bg-[#1766A6]/10 font-bold text-xs sm:text-sm transition-colors"
            >
              <Bot className="w-4 h-4" />
              <span>التوجيه الذكي الآلي</span>
            </button>
          </div>
        </div>
      </div>

      {/* Emergency Banner Card */}
      <div className="bg-[#FBECEB] rounded-[16px] p-4 flex items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-[12px] bg-[#A64842] text-white flex items-center justify-center shrink-0">
            <PhoneCall className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-[13px] font-bold text-[#5F1D1A]">
              خط الطوارئ الوطني 24/24 ساعة
            </h2>
            <p className="text-[11px] text-[#5F1D1A]/80 leading-normal">
              الدرك الوطني: 1055 | الشرطة: 1548 | الحماية: 14
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigate('emergency')}
          className="px-3 py-1.5 rounded-[8px] bg-[#A64842] hover:bg-[#8e3c37] text-white text-[11px] font-bold shadow-xs transition-colors shrink-0"
        >
          اتصل الآن
        </button>
      </div>

      {/* Features Grid Header */}
      <div className="pt-2">
        <h2 className="text-[16px] font-bold text-[#203945]">
          خدمات المنصة الأساسية
        </h2>
      </div>

      {/* Features Grid: 2x2 */}
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
            متابعة مع أخصائيين نفسيين وجلسات سرية
          </p>
        </div>

        {/* Card 2 */}
        <div
          onClick={() => onNavigate('services')}
          className="bg-[#FBFDFC] p-4 rounded-[16px] border border-[#E5ECE9] shadow-xs hover:border-[#1766A6]/40 transition-all cursor-pointer space-y-2"
        >
          <div className="w-[38px] h-[38px] rounded-[10px] bg-[#E8F4EF] text-[#25866D] flex items-center justify-center">
            <Scale className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-[13px] text-[#203945]">
            الاستشارة القانونية
          </h3>
          <p className="text-[11px] text-[#203945]/70 leading-[16px]">
            حماية أسرية وتوجيه قانوني للمتعافي
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
            مراكز علاج الإدمان
          </h3>
          <p className="text-[11px] text-[#203945]/70 leading-[16px]">
            دليل المراكز والجمعيات عبر 58 ولاية
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
            بطاقة الذهبية و CIB لتأكيد المواعيد
          </p>
        </div>
      </div>
    </div>
  );
};
