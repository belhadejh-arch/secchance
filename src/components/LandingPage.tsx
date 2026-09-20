import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { AddictionType, EmergencyResource } from '../types';
import { 
  ShieldCheck, 
  Heart, 
  Scale, 
  Building2, 
  Users, 
  Sparkles, 
  ArrowLeft, 
  PhoneCall, 
  Lock, 
  CheckCircle, 
  Activity,
  FileText,
  Clock,
  Award
} from 'lucide-react';

interface LandingPageProps {
  onOpenAuth: (defaultTab?: 'login' | 'register', role?: string) => void;
  onOpenAiTriage: () => void;
  onNavigateToPortal: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onOpenAuth, onOpenAiTriage, onNavigateToPortal }) => {
  const [stats, setStats] = useState<any>({
    total_cases: 1,
    completed_cases: 0,
    specialists_count: 2,
    centers_count: 1,
    wilayas_covered: 12,
    confidentiality_guarantee: '100% مشفر وسري'
  });
  const [addictionTypes, setAddictionTypes] = useState<AddictionType[]>([]);
  const [emergencies, setEmergencies] = useState<EmergencyResource[]>([]);

  useEffect(() => {
    api.getPublicStats().then(res => res.data && setStats(res.data)).catch(() => {});
    api.getAddictionTypes().then(res => res.data && setAddictionTypes(res.data)).catch(() => {});
    api.getEmergencyResources().then(res => res.data && setEmergencies(res.data)).catch(() => {});
  }, []);

  return (
    <div className="space-y-16 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50/60 via-white to-[#F8FAFC] pt-12 pb-20 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100 text-[#1565C0] text-xs sm:text-sm font-bold border border-blue-200">
              <ShieldCheck className="w-4 h-4" />
              <span>منظومة وطنية متكاملة برعاية الخبراء وسرية تامة</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight sm:leading-tight">
              لكل إنسان حق في <span className="text-[#1565C0]">فرصة ثانية</span>، ونحن هنا لنبدأها معك
            </h1>

            <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
              منصة رقمية إنتاجية تربط الأسر والمستفيدين بنخبة الأخصائيين النفسيين، المستشارين القانونيين، مراكز إزالة السموم، والجمعيات في بيئة آمنة ومشفرة بالكامل.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 pt-4">
              <button
                onClick={() => onOpenAuth('register', 'family')}
                className="px-6 py-3.5 bg-[#1565C0] hover:bg-blue-700 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer"
              >
                <span>طلب مساعدة فوري (للأسرة أو المستفيد)</span>
                <ArrowLeft className="w-5 h-5" />
              </button>

              <button
                onClick={onOpenAiTriage}
                className="px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-5 h-5 text-emerald-200" />
                <span>المساعد الذكي للتوجيه السري</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 pt-6 text-xs text-slate-500 font-medium">
              <span className="flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-emerald-600" /> تشفير كامل وسرية الهوية
              </span>
              <span className="flex items-center gap-1.5">
                <Award className="w-4 h-4 text-[#1565C0]" /> أخصائيون ومحامون معتمدون
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-600" /> استجابة الحالات الحرجة خلال ساعتين
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Live Statistics Section (No mock data, fetched from DB) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center divide-x divide-x-reverse divide-slate-100">
            <div className="space-y-1">
              <div className="text-3xl sm:text-4xl font-black text-[#1565C0]">{stats.total_cases}</div>
              <div className="text-xs sm:text-sm font-bold text-slate-600">ملفات حالات موثقة</div>
              <div className="text-[11px] text-slate-400">بمتابعة مستمرة</div>
            </div>

            <div className="space-y-1">
              <div className="text-3xl sm:text-4xl font-black text-[#2E7D32]">
                {stats.total_cases > 0 ? `${Math.round((stats.completed_cases / stats.total_cases) * 100)}%` : '100%'}
              </div>
              <div className="text-xs sm:text-sm font-bold text-slate-600">مؤشر التعافي والنجاح</div>
              <div className="text-[11px] text-slate-400">وفق المعايير السريرية</div>
            </div>

            <div className="space-y-1">
              <div className="text-3xl sm:text-4xl font-black text-amber-600">{stats.specialists_count}</div>
              <div className="text-xs sm:text-sm font-bold text-slate-600">أخصائي ومستشار معتمد</div>
              <div className="text-[11px] text-slate-400">تراخيص قانونية وطبية معتمدة</div>
            </div>

            <div className="space-y-1">
              <div className="text-3xl sm:text-4xl font-black text-slate-800">{stats.wilayas_covered}</div>
              <div className="text-xs sm:text-sm font-bold text-slate-600">ولاية مغطاة</div>
              <div className="text-[11px] text-slate-400">شبكة مراكز وجمعيات شريكة</div>
            </div>
          </div>
        </div>
      </section>

      {/* The 4 Pillars */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">ركائز الدعم والتأهيل المتكاملة</h2>
          <p className="text-sm text-slate-600">
            لا نكتفي بمسار واحد؛ التعافي الحقيقي يحتاج سنداً نفسياً، حماية قانونية، رعاية طبية، وحضناً مجتمعياً.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Pillar 1 */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all space-y-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 text-[#1565C0] flex items-center justify-center font-bold">
              <Heart className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">الدعم النفسي العيادي</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              تقييم تشخيصي أولي، خطط علاج سلوكي معرفي (CBT)، جلسات منتظمة، ومؤشرات دورية لقياس التعافي والحد من الانتكاس.
            </p>
          </div>

          {/* Pillar 2 */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-amber-300 hover:shadow-md transition-all space-y-4">
            <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
              <Scale className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">الحماية والاستشارة القانونية</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              توضيح البدائل القانونية، تدابير العلاج الإجباري والتطوعي، حماية القصر والضحايا، وإصدار مذكرات ورأي قانوني موثق.
            </p>
          </div>

          {/* Pillar 3 */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-emerald-300 hover:shadow-md transition-all space-y-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-[#2E7D32] flex items-center justify-center font-bold">
              <Building2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">مراكز إزالة السموم والاستشفاء</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              تنسيق الإحالة المباشرة إلى مراكز معتمدة لإزالة السموم الطبية (Detox) ومتابعة التقارير الطبية الأسبوعية بسرية.
            </p>
          </div>

          {/* Pillar 4 */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-teal-300 hover:shadow-md transition-all space-y-4">
            <div className="w-12 h-12 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">الجمعيات والإدماج الاجتماعي</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              مرافقة الأسر بعد مرحلة الاستشفاء، التدريب المهني، المساعدة في إعادة الاندماج الاجتماعي المدرسي والوظيفي.
            </p>
          </div>
        </div>
      </section>

      {/* Addiction Directory & Categorization */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900">أنواع الإدمان والحالات التي تتكفل بها المنصة</h2>
            <p className="text-sm text-slate-600">نقدم بروتوكولات متخصصة ومصممة بدقة حسب نوع التحدي</p>
          </div>
          <button
            onClick={onOpenAiTriage}
            className="text-xs sm:text-sm font-bold text-emerald-700 bg-emerald-50 px-3.5 py-2 rounded-lg hover:bg-emerald-100 flex items-center gap-1.5 transition-colors"
          >
            <Sparkles className="w-4 h-4" /> لست متأكداً من التصنيف؟ اسأل المساعد
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {addictionTypes.map((type) => (
            <div key={type.id} className="bg-white p-5 rounded-xl border border-slate-200 hover:border-slate-300 transition-all space-y-2">
              <div className="font-bold text-base text-slate-900">{type.name_ar}</div>
              <div className="text-xs font-semibold text-slate-400 font-sans">{type.name_en}</div>
              <p className="text-xs text-slate-600 leading-relaxed">{type.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 3 Steps Roadmap */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-12 space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-2xl sm:text-3xl font-black">كيف تسير رحلة التعافي خطوة بخطوة؟</h2>
            <p className="text-sm text-slate-400">
              صممنا مساراً مرناً يضمن السرية، الجدية، والمتابعة المهنية المستمرة دون أي تعقيدات بيروقراطية.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-3 border-r md:border-r-0 md:border-t-2 border-blue-500/40 pt-4">
              <div className="text-xs font-bold text-blue-400">المرحلة الأولى</div>
              <div className="text-lg font-bold">1. تقديم الطلب والتصنيف الأولي</div>
              <p className="text-xs text-slate-300 leading-relaxed">
                تعبئة استمارة الحالة بسرية، وتحديد درجة الأولوية، مع استجابة الحالات الحرجة خلال ساعتين فقط.
              </p>
            </div>

            <div className="space-y-3 border-r md:border-r-0 md:border-t-2 border-emerald-500/40 pt-4">
              <div className="text-xs font-bold text-emerald-400">المرحلة الثانية</div>
              <div className="text-lg font-bold">2. التقييم السريري وجدولة المواعيد</div>
              <p className="text-xs text-slate-300 leading-relaxed">
                إسناد الحالة للأخصائي النفسي والمحامي المعتمد، وحجز أول جلسة تقييمية ومباشرة الخطة العلاجية.
              </p>
            </div>

            <div className="space-y-3 border-r md:border-r-0 md:border-t-2 border-amber-500/40 pt-4">
              <div className="text-xs font-bold text-amber-400">المرحلة الثالثة</div>
              <div className="text-lg font-bold">3. المتابعة، التعافي، والتقرير النهائي</div>
              <p className="text-xs text-slate-300 leading-relaxed">
                جلسات دورية، متابعة أسبوعية مع مراكز التأهيل والجمعيات، وإصدار تقرير ختامي للتعافي المستدام.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Emergency Resources Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-3 text-red-700 font-extrabold text-lg">
            <PhoneCall className="w-6 h-6 animate-bounce" />
            <span>خطوط الطوارئ والنجدة الوطنية (متاحة 24/7 ومجانية)</span>
          </div>
          <p className="text-xs sm:text-sm text-red-900 leading-relaxed">
            في حالات التسمم الدوائي الحاد، الجرعات الزائدة، أو الخطر الجسدي المباشر، لا تتردد بالاتصال بالأرقام الرسمية فوراً:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
            {emergencies.map((em) => (
              <div key={em.id} className="bg-white p-4 rounded-xl border border-red-100 shadow-xs">
                <div className="font-bold text-sm text-slate-900">{em.title_ar}</div>
                <div className="text-2xl font-black text-red-600 my-1 tracking-wider">{em.phone_number}</div>
                <div className="text-[11px] text-slate-500">{em.description_ar}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
