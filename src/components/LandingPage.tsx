import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { AddictionType, EmergencyResource } from '../types';
import { useAuth } from '../context/AuthContext';
import { PlatformLogo } from './PlatformLogo';
import { 
  HeartHandshake, 
  Scale, 
  Building2, 
  Users, 
  Sparkles, 
  ArrowLeft, 
  Bell, 
  PhoneCall, 
  Lock, 
  Calendar, 
  MessageSquare, 
  ChevronLeft,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  BookOpen
} from 'lucide-react';

interface LandingPageProps {
  onOpenAuth: (defaultTab?: 'login' | 'register', role?: string) => void;
  onOpenAiTriage: () => void;
  onNavigateToPortal: () => void;
  onNavigateTo: (view: string) => void;
  onNewCase: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ 
  onOpenAuth, 
  onOpenAiTriage, 
  onNavigateToPortal,
  onNavigateTo,
  onNewCase
}) => {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>({
    total_cases: 142,
    completed_cases: 89,
    specialists_count: 24,
    centers_count: 12
  });

  const userName = user ? `${user.first_name} ${user.last_name}` : 'أحمد محمد';
  const userGreeting = user ? `مرحباً، ${user.first_name}` : 'مرحباً، بك في منصتنا';

  return (
    <div className="max-w-xl mx-auto px-4 py-3 space-y-5 pb-24" dir="rtl">
      
      {/* 1. Header Greeting Section (Matching Screen 3 in Reference Image) */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-3">
          <div 
            onClick={() => onNavigateTo('profile')}
            className="w-11 h-11 rounded-full bg-gradient-to-tr from-[#1565C0] to-[#00897B] text-white flex items-center justify-center font-bold text-sm shadow-xs cursor-pointer ring-2 ring-blue-100"
          >
            {user ? `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}` : 'أ.م'}
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900 leading-tight">
              {userGreeting}
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              نتمنى لك يوماً أفضل مفعماً بالصحة والأمل
            </p>
          </div>
        </div>

        {/* Notifications Bell Icon */}
        <button
          onClick={() => onNavigateTo('notifications')}
          className="relative p-2.5 rounded-2xl bg-white border border-slate-200/80 hover:bg-slate-50 text-slate-600 transition-colors shadow-xs cursor-pointer"
          title="الإشعارات"
        >
          <Bell className="w-5 h-5 text-slate-700" />
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#1565C0] ring-2 ring-white" />
        </button>
      </div>

      {/* 2. Hero Banner Card (100% Matching Screen 3 in Reference Image) */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#E3F2FD] via-[#F0F7FF] to-[#E8F5E9] border border-blue-100/80 p-5 sm:p-6 shadow-sm">
        <div className="relative z-10 space-y-3 max-w-[75%]">
          <span className="inline-block px-2.5 py-1 rounded-full bg-white/90 text-[#1565C0] text-[10px] sm:text-xs font-black shadow-2xs border border-blue-100/80">
            لأن كل أسرة تستحق فرصة جديدة
          </span>

          <h1 className="text-lg sm:text-xl font-black text-slate-900 leading-snug">
            منصة آمنة وسرية تربطك بنخبة المختصين والجهات الداعمة
          </h1>

          <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
            استشارات نفسية متخصصة، حماية وتكييف قانوني، وإحالات فورية لمراكز علاج الإدمان المعتمدة.
          </p>

          <div className="pt-1">
            <button
              onClick={onNewCase}
              className="px-5 py-2.5 bg-[#1565C0] hover:bg-blue-700 text-white font-bold rounded-2xl text-xs sm:text-sm shadow-md shadow-blue-700/20 hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <span>اطلب المساعدة</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Decorative Vector Emblem without background in corner */}
        <div className="absolute left-[-15px] bottom-[-15px] opacity-90 pointer-events-none transform rotate-6">
          <PlatformLogo size={130} />
        </div>
      </div>

      {/* 3. خدماتنا Section (Matching Screen 3 in Reference Image) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-900">خدماتنا</h3>
          <button
            onClick={() => onNavigateTo('services')}
            className="text-xs font-bold text-[#1565C0] hover:underline cursor-pointer"
          >
            عرض الكل
          </button>
        </div>

        {/* 5 Circular Service Cards (Matching Reference Mockup) */}
        <div className="grid grid-cols-5 gap-2 text-center">
          <button
            onClick={() => onNavigateTo('services')}
            className="flex flex-col items-center gap-1.5 p-2 rounded-2xl hover:bg-white transition-all group cursor-pointer"
          >
            <div className="w-13 h-13 rounded-2xl bg-blue-100/70 group-hover:bg-[#1565C0] text-[#1565C0] group-hover:text-white flex items-center justify-center transition-all shadow-xs">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <span className="text-[11px] font-bold text-slate-800 leading-tight">الدعم النفسي</span>
          </button>

          <button
            onClick={() => onNavigateTo('services')}
            className="flex flex-col items-center gap-1.5 p-2 rounded-2xl hover:bg-white transition-all group cursor-pointer"
          >
            <div className="w-13 h-13 rounded-2xl bg-amber-100/70 group-hover:bg-amber-600 text-amber-700 group-hover:text-white flex items-center justify-center transition-all shadow-xs">
              <Scale className="w-6 h-6" />
            </div>
            <span className="text-[11px] font-bold text-slate-800 leading-tight">الاستشارة القانونية</span>
          </button>

          <button
            onClick={() => onNavigateTo('emergency')}
            className="flex flex-col items-center gap-1.5 p-2 rounded-2xl hover:bg-white transition-all group cursor-pointer"
          >
            <div className="w-13 h-13 rounded-2xl bg-emerald-100/70 group-hover:bg-[#2E7D32] text-[#2E7D32] group-hover:text-white flex items-center justify-center transition-all shadow-xs">
              <Building2 className="w-6 h-6" />
            </div>
            <span className="text-[11px] font-bold text-slate-800 leading-tight">مراكز العلاج</span>
          </button>

          <button
            onClick={() => onNavigateTo('services')}
            className="flex flex-col items-center gap-1.5 p-2 rounded-2xl hover:bg-white transition-all group cursor-pointer"
          >
            <div className="w-13 h-13 rounded-2xl bg-teal-100/70 group-hover:bg-teal-700 text-teal-700 group-hover:text-white flex items-center justify-center transition-all shadow-xs">
              <Users className="w-6 h-6" />
            </div>
            <span className="text-[11px] font-bold text-slate-800 leading-tight">الجمعيات</span>
          </button>

          <button
            onClick={() => onNavigateTo('services')}
            className="flex flex-col items-center gap-1.5 p-2 rounded-2xl hover:bg-white transition-all group cursor-pointer"
          >
            <div className="w-13 h-13 rounded-2xl bg-purple-100/70 group-hover:bg-purple-700 text-purple-700 group-hover:text-white flex items-center justify-center transition-all shadow-xs">
              <Sparkles className="w-6 h-6" />
            </div>
            <span className="text-[11px] font-bold text-slate-800 leading-tight">التوعية</span>
          </button>
        </div>
      </div>

      {/* 4. Quick Action Card: AI Smart Triage (المساعد الذكي للتوجيه السري) */}
      <div className="p-4 rounded-3xl bg-gradient-to-r from-[#0b2347] to-[#1565C0] text-white shadow-md flex items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <h4 className="font-extrabold text-xs sm:text-sm">المساعد الذكي للتوجيه السري</h4>
          </div>
          <p className="text-[11px] text-blue-100 leading-relaxed">
            محادثة مجهولة الهوية لتقييم الأعراض والتوجيه لأقرب مختص أو مركز مرخص.
          </p>
        </div>
        <button
          onClick={onOpenAiTriage}
          className="px-3.5 py-2 bg-white text-[#1565C0] font-bold text-xs rounded-xl shrink-0 shadow-sm hover:bg-blue-50 transition-colors cursor-pointer"
        >
          ابدأ المحادثة
        </button>
      </div>

      {/* 5. المختصون المناوبون المتاحون الآن (Specialists On Duty) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-900">المختصون المتاحون للاستشارة</h3>
          <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            مناوبة فورية
          </span>
        </div>

        <div className="space-y-2.5">
          {/* Doctor Card */}
          <div className="p-3.5 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-blue-100 text-[#1565C0] flex items-center justify-center font-bold text-xs shrink-0">
                ف.ز
              </div>
              <div>
                <h4 className="font-bold text-xs sm:text-sm text-slate-900">د. فاطمة الزهراء بن عيسى</h4>
                <p className="text-[11px] text-slate-500">أخصائية نفسية وسلوكية • خبرة 12 سنة</p>
              </div>
            </div>
            <button
              onClick={() => onNavigateTo('appointments')}
              className="px-3 py-1.5 bg-blue-50 hover:bg-[#1565C0] text-[#1565C0] hover:text-white font-bold text-xs rounded-xl transition-all cursor-pointer shrink-0"
            >
              حجز موعد
            </button>
          </div>

          {/* Lawyer Card */}
          <div className="p-3.5 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs shrink-0">
                م.ع
              </div>
              <div>
                <h4 className="font-bold text-xs sm:text-sm text-slate-900">أ. محمد العربي</h4>
                <p className="text-[11px] text-slate-500">محامٍ معتمد لدى المجلس • حماية وتكييف قانوني</p>
              </div>
            </div>
            <button
              onClick={() => onNavigateTo('appointments')}
              className="px-3 py-1.5 bg-amber-50 hover:bg-amber-600 text-amber-800 hover:text-white font-bold text-xs rounded-xl transition-all cursor-pointer shrink-0"
            >
              طلب استشارة
            </button>
          </div>
        </div>
      </div>

      {/* 6. Emergency Direct Helpline Card */}
      <div className="p-4 rounded-3xl bg-red-50/80 border border-red-200/80 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-red-600 text-white flex items-center justify-center shrink-0">
            <PhoneCall className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase text-red-600 block">طوارئ النجدة والسموم</span>
            <span className="text-sm font-black text-slate-900">الخط الأخضر 1099 (مجاني وسري)</span>
          </div>
        </div>
        <button
          onClick={() => onNavigateTo('emergency')}
          className="px-3 py-1.5 bg-white text-red-600 border border-red-200 hover:bg-red-50 font-bold text-xs rounded-xl shadow-xs transition-colors shrink-0"
        >
          عرض الأرقام
        </button>
      </div>

    </div>
  );
};
