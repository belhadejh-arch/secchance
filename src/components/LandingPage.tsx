import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Service } from '../types';
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
  BookOpen,
  GraduationCap,
  Shield,
  Activity
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
  const [stats, setStats] = useState<{
    total_cases: number | string;
    completed_cases: number | string;
    specialists_count: number | string;
    centers_count: number | string;
  } | null>(null);
  const [statsError, setStatsError] = useState(false);
  const [featuredServices, setFeaturedServices] = useState<Service[]>([]);
  const [servicesError, setServicesError] = useState(false);

  useEffect(() => {
    let active = true;
    api.getPublicStats()
      .then(response => { if (active) setStats(response.data); })
      .catch(() => { if (active) setStatsError(true); });
    api.getServices()
      .then(response => { if (active) setFeaturedServices(Array.isArray(response.data) ? response.data.slice(0, 2) : []); })
      .catch(() => { if (active) setServicesError(true); });
    return () => { active = false; };
  }, []);

  const userGreeting = user ? `مرحباً بك، ${user.first_name}` : 'مرحباً بك في منصة الفرصة الثانية';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6 sm:space-y-8 font-sans" dir="rtl">
      
      {/* 1. Header Greeting Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-b border-slate-200/60 pb-3 sm:pb-4">
        <div className="flex items-center gap-3">
          <div 
            onClick={() => onNavigateTo('profile')}
            className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-gradient-to-tr from-[#1565C0] to-[#00897B] text-white flex items-center justify-center font-bold text-sm shadow-xs cursor-pointer ring-2 ring-blue-100 shrink-0"
          >
            {user ? `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}` : 'ز'}
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
              {userGreeting}
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              نتمنى لك يوماً مفعماً بالصحة والأمل
            </p>
          </div>
        </div>

        {/* Quick action badges & Notifications on Desktop/Mobile */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={() => onNavigateTo('notifications')}
            className="relative p-2 sm:p-2.5 rounded-2xl bg-white border border-slate-200/80 hover:bg-slate-50 text-slate-600 transition-colors shadow-xs cursor-pointer"
            title="الإشعارات"
          >
            <Bell className="w-5 h-5 text-slate-700" />
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#1565C0] ring-2 ring-white" />
          </button>
        </div>
      </div>

      {/* 2. Hero Banner Card - Fully responsive across PC (wide 2-column) and Mobile (stacked) */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#E3F2FD] via-[#F0F7FF] to-[#E8F5E9] border border-blue-100/80 p-5 sm:p-8 lg:p-10 shadow-sm">
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          
          <div className="lg:col-span-8 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-block px-3 py-1 rounded-full bg-white/90 text-[#1565C0] text-[11px] sm:text-xs font-black shadow-2xs border border-blue-100/80">
                لأن كل أسرة تستحق فرصة جديدة
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100/80 text-[#2E7D32] text-[10px] sm:text-xs font-bold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>حماية الهوية والسر المهني</span>
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 leading-snug lg:leading-tight">
              منصة آمنة وسرية تربطك بنخبة المختصين والجهات الداعمة لعلاج الإدمان
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-2xl">
              اطلب استشارة نفسية أو قانونية، وتعرّف على خدمات مراكز العلاج والجمعيات المتاحة في الجزائر.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                onClick={onNewCase}
                className="px-5 sm:px-6 py-2.5 sm:py-3 bg-[#1565C0] hover:bg-blue-700 text-white font-bold rounded-2xl text-xs sm:text-sm shadow-md shadow-blue-700/20 hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <span>طلب مساعدة فورية</span>
                <ArrowLeft className="w-4 h-4" />
              </button>

              <button
                onClick={onOpenAiTriage}
                className="px-4 sm:px-5 py-2.5 sm:py-3 bg-white hover:bg-blue-50 text-[#1565C0] border border-blue-200 font-bold rounded-2xl text-xs sm:text-sm shadow-xs transition-all flex items-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>المساعد الذكي للتوجيه</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics highlight on PC / Tablet */}
          <div className="lg:col-span-4 bg-white/80 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-blue-100/80 shadow-xs space-y-3">
            <h4 className="font-black text-xs sm:text-sm text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
              <Activity className="w-4 h-4 text-[#1565C0]" />
              <span>مؤشرات الرعاية والشبكة الوطنية</span>
            </h4>

            {stats ? <div className="grid grid-cols-2 gap-3 text-center">
              <div className="bg-blue-50/70 p-2.5 rounded-xl border border-blue-100">
                <span className="block text-lg sm:text-xl font-black text-[#1565C0] font-mono">{Number(stats.total_cases).toLocaleString('ar-DZ')}</span>
                <span className="text-[10px] sm:text-[11px] text-slate-600 font-medium">ملف مسجل</span>
              </div>
              <div className="bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-100">
                <span className="block text-lg sm:text-xl font-black text-[#2E7D32] font-mono">{Number(stats.centers_count).toLocaleString('ar-DZ')}</span>
                <span className="text-[10px] sm:text-[11px] text-slate-600 font-medium">مركز معتمد</span>
              </div>
              <div className="bg-purple-50/70 p-2.5 rounded-xl border border-purple-100">
                <span className="block text-lg sm:text-xl font-black text-purple-700 font-mono">{Number(stats.specialists_count).toLocaleString('ar-DZ')}</span>
                <span className="text-[10px] sm:text-[11px] text-slate-600 font-medium">مختص معتمد</span>
              </div>
              <div className="bg-amber-50/70 p-2.5 rounded-xl border border-amber-100">
                <span className="block text-lg sm:text-xl font-black text-amber-700 font-mono">{Number(stats.completed_cases).toLocaleString('ar-DZ')}</span>
                <span className="text-[10px] sm:text-[11px] text-slate-600 font-medium">ملف مكتمل</span>
              </div>
            </div> : <p className="text-xs text-slate-500 py-5 text-center">{statsError ? 'تعذر تحميل المؤشرات حالياً.' : 'جارٍ تحميل المؤشرات الفعلية...'}</p>}
          </div>

        </div>

        {/* Decorative Vector Emblem */}
        <div className="hidden lg:block absolute left-[-20px] bottom-[-20px] opacity-20 pointer-events-none transform rotate-6">
          <PlatformLogo size={200} />
        </div>
      </div>

      {/* 3. خدماتنا Section - Responsive 5 columns on PC, flexible scroll/grid on mobile */}
      <div className="space-y-3 sm:space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm sm:text-base font-black text-slate-900">أقسام الرعاية والخدمات</h3>
            <p className="text-xs text-slate-500 hidden sm:block">خدمات متخصصة ومصممة لدعم المريض والأسرة خطوة بخطوة</p>
          </div>
          <button
            onClick={() => onNavigateTo('services')}
            className="text-xs font-bold text-[#1565C0] hover:underline cursor-pointer"
          >
            عرض جميع المراكز والخدمات ←
          </button>
        </div>

        {/* 5 Service Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          <button
            onClick={() => onNavigateTo('services')}
            className="flex flex-col items-center sm:items-start text-center sm:text-right gap-2 p-3 sm:p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-blue-300 hover:shadow-md transition-all group cursor-pointer"
          >
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-blue-100/70 group-hover:bg-[#1565C0] text-[#1565C0] group-hover:text-white flex items-center justify-center transition-all shadow-xs shrink-0">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs sm:text-sm font-bold text-slate-800 leading-tight block">الدعم النفسي</span>
              <span className="text-[11px] text-slate-400 hidden sm:block mt-0.5">جلسات علاج نفسي وسلوكي</span>
            </div>
          </button>

          <button
            onClick={() => onNavigateTo('services')}
            className="flex flex-col items-center sm:items-start text-center sm:text-right gap-2 p-3 sm:p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-amber-300 hover:shadow-md transition-all group cursor-pointer"
          >
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-amber-100/70 group-hover:bg-amber-600 text-amber-700 group-hover:text-white flex items-center justify-center transition-all shadow-xs shrink-0">
              <Scale className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs sm:text-sm font-bold text-slate-800 leading-tight block">الاستشارة القانونية</span>
              <span className="text-[11px] text-slate-400 hidden sm:block mt-0.5">تكييف وحماية قضائية</span>
            </div>
          </button>

          <button
            onClick={() => onNavigateTo('emergency')}
            className="flex flex-col items-center sm:items-start text-center sm:text-right gap-2 p-3 sm:p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-emerald-300 hover:shadow-md transition-all group cursor-pointer"
          >
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-emerald-100/70 group-hover:bg-[#2E7D32] text-[#2E7D32] group-hover:text-white flex items-center justify-center transition-all shadow-xs shrink-0">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs sm:text-sm font-bold text-slate-800 leading-tight block">مراكز العلاج</span>
              <span className="text-[11px] text-slate-400 hidden sm:block mt-0.5">دليل المراكز المسجلة</span>
            </div>
          </button>

          <button
            onClick={() => onNavigateTo('services')}
            className="flex flex-col items-center sm:items-start text-center sm:text-right gap-2 p-3 sm:p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-teal-300 hover:shadow-md transition-all group cursor-pointer"
          >
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-teal-100/70 group-hover:bg-teal-700 text-teal-700 group-hover:text-white flex items-center justify-center transition-all shadow-xs shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs sm:text-sm font-bold text-slate-800 leading-tight block">الجمعيات والمرافقة</span>
              <span className="text-[11px] text-slate-400 hidden sm:block mt-0.5">إعادة الإدماج المجتمعي</span>
            </div>
          </button>

          <button
            onClick={() => onNavigateTo('services')}
            className="flex flex-col items-center sm:items-start text-center sm:text-right gap-2 p-3 sm:p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-purple-300 hover:shadow-md transition-all group cursor-pointer col-span-2 sm:col-span-1"
          >
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-purple-100/70 group-hover:bg-purple-700 text-purple-700 group-hover:text-white flex items-center justify-center transition-all shadow-xs shrink-0">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs sm:text-sm font-bold text-slate-800 leading-tight block">الأبحاث والتوعية</span>
              <span className="text-[11px] text-slate-400 hidden sm:block mt-0.5">دراسات علمية موثقة</span>
            </div>
          </button>
        </div>
      </div>

      {/* 4. Desktop 2-Column Split: Left (AI Triage & Emergency) + Right (Specialists on Duty) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Right side on Desktop (7 cols): AI Triage Card + Direct Hotline */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* AI Smart Triage Banner */}
          <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-[#091E3A] to-[#1565C0] text-white shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1.5 max-w-lg">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
                <h4 className="font-extrabold text-sm sm:text-base">المساعد الذكي للتوجيه والفرز الأولي</h4>
              </div>
              <p className="text-xs text-blue-100 leading-relaxed">
                محادثة للتوجيه الأولي تساعدك في التعرف على الخيارات المتاحة. لا تُغني عن استشارة مختص أو خدمات الطوارئ.
              </p>
            </div>
            <button
              onClick={onOpenAiTriage}
              className="px-4 py-2.5 bg-white text-[#1565C0] font-bold text-xs sm:text-sm rounded-xl shrink-0 shadow-sm hover:bg-blue-50 transition-colors cursor-pointer"
            >
              بدء المحادثة السرية
            </button>
          </div>

          {/* Emergency Direct Helpline Card */}
          <div className="p-5 rounded-3xl bg-red-50/90 border border-red-200/90 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <PhoneCall className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase text-red-700 block">طوارئ النجدة والسموم الوطنية</span>
                 <span className="text-base sm:text-lg font-black text-slate-900">اطّلع على أرقام الطوارئ</span>
                 <p className="text-[11px] text-slate-600">تحقق من أرقام الجهات المحلية وساعات عملها قبل الاتصال.</p>
              </div>
            </div>
            <button
              onClick={() => onNavigateTo('emergency')}
              className="px-4 py-2 bg-white text-red-600 border border-red-200 hover:bg-red-50 font-bold text-xs rounded-xl shadow-xs transition-colors shrink-0"
            >
              عرض دليل الطوارئ
            </button>
          </div>

        </div>

          {/* Approved services, loaded from the live catalog */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between">
              <h3 className="text-sm sm:text-base font-black text-slate-900">الخدمات المعتمدة</h3>
          </div>

          <div className="space-y-3">
              {featuredServices.map(service => (
                <button key={service.id} type="button" onClick={() => onNavigateTo('services')}
                  className="w-full p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:border-blue-200 transition-all text-right">
                  <h4 className="font-bold text-xs sm:text-sm text-slate-900">{service.title}</h4>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{service.description}</p>
                </button>
              ))}
              {!featuredServices.length && <div className="p-4 bg-white rounded-2xl border border-slate-200/80 text-xs text-slate-600">
                {servicesError ? 'تعذر تحميل الخدمات حالياً.' : 'لا توجد خدمات معتمدة متاحة حالياً. تظهر هنا بعد اعتماد مقدمي الخدمات وإضافة خدماتهم.'}
              </div>}

            {/* Scientific Studies Quick Callout */}
            <div 
              onClick={() => onNavigateTo('services')}
              className="p-3.5 bg-purple-50/70 border border-purple-100 rounded-2xl flex items-center justify-between cursor-pointer hover:bg-purple-100/70 transition-all"
            >
              <div className="flex items-center gap-2.5">
                <GraduationCap className="w-5 h-5 text-purple-700 shrink-0" />
                <div>
                  <span className="text-xs font-bold text-purple-950 block">مكتبة الأبحاث العلمية المنشورة</span>
                  <span className="text-[10px] text-purple-700">اطلع على دراسات طبية ووبائية محكّمة</span>
                </div>
              </div>
              <ChevronLeft className="w-4 h-4 text-purple-700" />
            </div>

          </div>
        </div>

      </div>

    </div>
  );
};

export default LandingPage;
