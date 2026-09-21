import React, { useState } from 'react';
import { 
  Search, 
  HeartHandshake, 
  Scale, 
  Building2, 
  Users, 
  Sparkles, 
  ChevronLeft, 
  ShieldCheck, 
  ArrowLeft,
  Calendar,
  PhoneCall,
  Clock,
  Filter
} from 'lucide-react';

interface ServicesViewProps {
  onBack?: () => void;
  onSelectService?: (serviceKey: string) => void;
  onOpenBooking?: (serviceName: string) => void;
  onOpenAiTriage?: () => void;
  onNewCase?: () => void;
}

export const ServicesView: React.FC<ServicesViewProps> = ({
  onBack,
  onSelectService,
  onOpenBooking,
  onOpenAiTriage,
  onNewCase
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const services = [
    {
      id: 'psychological',
      title: 'الدعم النفسي',
      desc: 'جلسات استماع واستشارات فردية وأسرية مع نخبة من الأخصائيين النفسيين المعتمدين.',
      icon: HeartHandshake,
      badge: 'جلسات معتمدة',
      bgColor: 'bg-blue-50',
      iconColor: 'text-[#1565C0]',
      stats: '24 أخصائي مناوب',
      actionText: 'حجز جلسة نفسية'
    },
    {
      id: 'legal',
      title: 'الاستشارة القانونية',
      desc: 'إرشاد قانوني متخصص في قضايا الإدمان، الحماية من المتابعة الجنائية، والتدابير العلاجية البديلة.',
      icon: Scale,
      badge: 'سرية تامة',
      bgColor: 'bg-amber-50',
      iconColor: 'text-amber-700',
      stats: '15 محامٍ متخصص',
      actionText: 'طلب استشارة قانونية'
    },
    {
      id: 'treatment',
      title: 'مراكز العلاج والسموم',
      desc: 'ربط مباشر بمراكز الاستشفاء المتخصصة وإزالة السموم (Cure de désintoxication) مع متابعة الأسرة.',
      icon: Building2,
      badge: 'إحالات سريعة',
      bgColor: 'bg-emerald-50',
      iconColor: 'text-[#2E7D32]',
      stats: '12 مركزاً وطنياً',
      actionText: 'استعراض المراكز والإحالة'
    },
    {
      id: 'associations',
      title: 'الجمعيات والمرافقة',
      desc: 'دعم اجتماعي متواصل وإعادة إدماج مهني وأسري بالتعاون مع كبرى الجمعيات الفاعلة في الميدان.',
      icon: Users,
      badge: 'تأهيل مجتمعي',
      bgColor: 'bg-teal-50',
      iconColor: 'text-teal-700',
      stats: '34 جمعية شريكة',
      actionText: 'التواصل مع الجمعيات'
    },
    {
      id: 'awareness',
      title: 'التوعية والإرشاد الأسري',
      desc: 'حقائب معرفية وإرشادات علمية للتعامل مع بدايات التعاطي، العلامات التحذيرية، والوقاية من الانتكاسة.',
      icon: Sparkles,
      badge: 'محتوى موثوق',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-700',
      stats: '50+ دليلاً إرشادياً',
      actionText: 'تصفح الدلائل التوعوية'
    }
  ];

  const filteredServices = services.filter(s => {
    const matchesSearch = s.title.includes(searchTerm) || s.desc.includes(searchTerm);
    if (activeCategory === 'all') return matchesSearch;
    return matchesSearch && s.id === activeCategory;
  });

  return (
    <div className="max-w-xl mx-auto px-4 py-4 space-y-5 pb-24" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2">
          {onBack && (
            <button
              onClick={onBack}
              className="p-1.5 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100"
            >
              <ArrowLeft className="w-4 h-4 transform rotate-180" />
            </button>
          )}
          <div>
            <h1 className="text-xl font-black text-slate-900">خدمات المنصة</h1>
            <p className="text-xs text-slate-500 mt-0.5">رعاية متكاملة: نفسية، قانونية، طبية وتأهيلية</p>
          </div>
        </div>
        {onNewCase && (
          <button
            onClick={() => onNewCase()}
            className="px-3.5 py-1.5 bg-[#1565C0] text-white text-xs font-bold rounded-xl shadow-xs hover:bg-blue-700 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <span>طلب مساعدة</span>
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Search Input (Inspired by Screen 4 in Mockup) */}
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="ابحث عن خدمة، مركز، أو استشارة..."
          className="w-full pl-4 pr-10 py-3 bg-white border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1565C0]/20 focus:border-[#1565C0] shadow-xs"
        />
        <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
        <button
          onClick={() => setActiveCategory('all')}
          className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
            activeCategory === 'all'
              ? 'bg-[#1565C0] text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          جميع الخدمات
        </button>
        <button
          onClick={() => setActiveCategory('psychological')}
          className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
            activeCategory === 'psychological'
              ? 'bg-[#1565C0] text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          الدعم النفسي
        </button>
        <button
          onClick={() => setActiveCategory('legal')}
          className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
            activeCategory === 'legal'
              ? 'bg-[#1565C0] text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          الاستشارة القانونية
        </button>
        <button
          onClick={() => setActiveCategory('treatment')}
          className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
            activeCategory === 'treatment'
              ? 'bg-[#1565C0] text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          مراكز العلاج
        </button>
      </div>

      {/* Services List Cards (Matching Screen 4) */}
      <div className="space-y-3">
        {filteredServices.map((service) => {
          const Icon = service.icon;
          return (
            <div
              key={service.id}
              className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs hover:shadow-md transition-all space-y-3 group"
            >
              <div className="flex items-start gap-3.5">
                <div className={`w-12 h-12 rounded-2xl ${service.bgColor} flex items-center justify-center shrink-0 shadow-xs ring-1 ring-black/5`}>
                  <Icon className={`w-6 h-6 ${service.iconColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base group-hover:text-[#1565C0] transition-colors">
                      {service.title}
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      {service.badge}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                    {service.desc}
                  </p>
                </div>
              </div>

              {/* Bottom Meta & Action */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-emerald-600" />
                  {service.stats}
                </span>

                <button
                  onClick={() => {
                    if (onOpenBooking) onOpenBooking(service.title);
                    else if (onSelectService) onSelectService(service.id);
                  }}
                  className="px-3.5 py-1.5 bg-[#F0F7FF] text-[#1565C0] hover:bg-[#1565C0] hover:text-white font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer text-xs"
                >
                  <span>{service.actionText}</span>
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* AI Triage Banner Box */}
      <div className="bg-gradient-to-r from-blue-900 to-[#1565C0] text-white rounded-2xl p-4 shadow-md flex items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-cyan-300" />
            <span className="font-extrabold text-xs sm:text-sm">لست متأكداً من الخدمة المناسبة؟</span>
          </div>
          <p className="text-[11px] text-blue-100 leading-normal">
            استشر المساعد الذكي المعتمد للحصول على توجيه فوري وسري دون الإفصاح عن هويتك.
          </p>
        </div>
        <button
          onClick={() => onOpenAiTriage && onOpenAiTriage()}
          className="px-3 py-2 bg-white text-[#1565C0] font-bold text-xs rounded-xl shrink-0 shadow-sm hover:bg-blue-50 transition-colors cursor-pointer"
        >
          توجيه فوري
        </button>
      </div>
    </div>
  );
};
