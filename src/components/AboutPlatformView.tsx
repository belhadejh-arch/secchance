import React from 'react';
import { ArrowRight, ShieldCheck, HeartHandshake, Award, Lock, Users, PhoneCall, Sparkles } from 'lucide-react';
import { PlatformLogo } from './PlatformLogo';

interface AboutPlatformViewProps {
  onBack: () => void;
  onOpenEmergency: () => void;
  onOpenAiTriage: () => void;
}

export const AboutPlatformView: React.FC<AboutPlatformViewProps> = ({
  onBack,
  onOpenEmergency,
  onOpenAiTriage
}) => {
  return (
    <div className="max-w-xl mx-auto px-4 py-4 space-y-5 pb-24" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-slate-600 hover:text-slate-900 text-xs font-bold"
        >
          <ArrowRight className="w-4 h-4" />
          <span>رجوع</span>
        </button>
        <h1 className="text-base font-black text-slate-900">عن المنصة</h1>
        <div className="w-8" />
      </div>

      {/* Main Brand Card (Matching Screen 15 in Mockup) */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs text-center space-y-4">
        {/* Transparent Logo without background */}
        <div className="flex justify-center">
          <PlatformLogo size={74} />
        </div>

        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">الفرصة الثانية</h2>
          <p className="text-xs font-mono font-bold text-[#1565C0]">Second Chance Platform (SCP)</p>
        </div>

        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-md mx-auto">
          منصة رقمية وطنية تهدف إلى تقديم الدعم النفسي والقانوني والاجتماعي للأفراد والأسر، من خلال ربطهم بالمختصين والجهات الداعمة في بيئة آمنة ومشفرة تماماً.
        </p>
      </div>

      {/* Vision, Mission, Values (Matching Screen 15) */}
      <div className="space-y-3">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-1.5">
          <div className="flex items-center gap-2 text-[#1565C0]">
            <Sparkles className="w-4 h-4" />
            <h3 className="font-black text-xs sm:text-sm text-slate-900">رؤيتنا</h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            مجتمع أكثر صحة وأماناً، حيث يحظى كل فرد متعثر بفرصة حقيقية للعلاج والتعافي والاندماج دون وصمة أو عقوبة.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-1.5">
          <div className="flex items-center gap-2 text-[#2E7D32]">
            <HeartHandshake className="w-4 h-4" />
            <h3 className="font-black text-xs sm:text-sm text-slate-900">رسالتنا</h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            توفير خدمات دعم متكاملة وسهلة الوصول، مبنية على التكفل الطبي النفسي، الحماية القانونية، والمرافقة الاجتماعية المستمرة.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-purple-700">
            <Award className="w-4 h-4" />
            <h3 className="font-black text-xs sm:text-sm text-slate-900">قيمنا الأساسية</h3>
          </div>
          
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-100">
              <Lock className="w-4 h-4 text-[#1565C0] mx-auto mb-1" />
              <span className="font-bold text-slate-800 block text-xs">السرية التامة</span>
              <span className="text-[10px] text-slate-400">حماية الهوية</span>
            </div>

            <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-100">
              <ShieldCheck className="w-4 h-4 text-[#2E7D32] mx-auto mb-1" />
              <span className="font-bold text-slate-800 block text-xs">الاحترافية</span>
              <span className="text-[10px] text-slate-400">كوادر معتمدة</span>
            </div>

            <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-100">
              <Users className="w-4 h-4 text-amber-700 mx-auto mb-1" />
              <span className="font-bold text-slate-800 block text-xs">التضامن</span>
              <span className="text-[10px] text-slate-400">مرافقة مجتمعية</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Helpline Section */}
      <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-md flex items-center justify-between gap-3">
        <div className="space-y-0.5">
          <span className="text-xs font-bold text-slate-300 block">خط النجدة الوطني المباشر:</span>
          <span className="text-base font-black text-cyan-400 font-mono">1099 (مجاني وسري 24/7)</span>
        </div>
        <button
          onClick={onOpenEmergency}
          className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <PhoneCall className="w-3.5 h-3.5" />
          <span>دليل الطوارئ</span>
        </button>
      </div>
    </div>
  );
};
