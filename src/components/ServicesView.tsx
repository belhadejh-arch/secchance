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
  Filter,
  AlertTriangle,
  Info,
  GraduationCap
} from 'lucide-react';
import { ALGERIA_TREATMENT_CENTERS, TREATMENT_CENTERS_NOTICE, TreatmentCenterData } from '../data/treatmentCenters';
import { AwarenessStudiesView } from './AwarenessStudiesView';

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
  const [selectedCenterWilaya, setSelectedCenterWilaya] = useState<string>('all');

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
      stats: `${ALGERIA_TREATMENT_CENTERS.length} مركزاً وطنياً`,
      actionText: `استعراض المراكز الـ ${ALGERIA_TREATMENT_CENTERS.length}`
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

  const filteredTreatmentCenters = ALGERIA_TREATMENT_CENTERS.filter((c: TreatmentCenterData) => {
    const matchesWilaya =
      selectedCenterWilaya === 'all' ||
      c.wilayaName.includes(selectedCenterWilaya) ||
      c.wilayaCode === selectedCenterWilaya;

    const matchesSearch =
      !searchTerm.trim() ||
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.wilayaName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.wilayaCode.includes(searchTerm) ||
      (c.phone && c.phone.includes(searchTerm));

    return matchesWilaya && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-6 pb-24 lg:pb-12 font-sans" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-b border-slate-200/60 pb-3">
        <div className="flex items-center gap-2">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 transform rotate-180" />
            </button>
          )}
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900">دليل الخدمات والتوعية ومراكز العلاج</h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">رعاية متكاملة: نفسية، قانونية، طبية وتأهيلية عبر 58 ولاية جزائرية</p>
          </div>
        </div>
        {onNewCase && (
          <button
            onClick={() => onNewCase()}
            className="px-4 py-2 bg-[#1565C0] text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs hover:bg-blue-700 transition-colors flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
          >
            <span>طلب مساعدة فورية</span>
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Search Input & Filter Row */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ابحث عن خدمة، مركز علاج بالولاية، استشارة، أو دراسة علمية..."
            className="w-full pl-4 pr-10 py-3 bg-white border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1565C0]/20 focus:border-[#1565C0] shadow-xs"
          />
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
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
          onClick={() => setActiveCategory('treatment')}
          className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-1 ${
            activeCategory === 'treatment'
              ? 'bg-[#2E7D32] text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>مراكز العلاج ({ALGERIA_TREATMENT_CENTERS.length})</span>
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
          onClick={() => setActiveCategory('associations')}
          className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
            activeCategory === 'associations'
              ? 'bg-[#1565C0] text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          الجمعيات
        </button>
        <button
          onClick={() => setActiveCategory('awareness')}
          className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
            activeCategory === 'awareness'
              ? 'bg-purple-700 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <GraduationCap className="w-3.5 h-3.5" />
          <span>التوعية والأبحاث العلمية</span>
        </button>
      </div>

      {/* When activeCategory === 'treatment': Show Full Treatment Centers Section */}
      {activeCategory === 'treatment' ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">🚨</span>
              <h2 className="text-base sm:text-lg font-black text-slate-900">
                مراكز علاج الإدمان في الجزائر 🇩🇿
              </h2>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 bg-emerald-50 text-[#2E7D32] border border-emerald-200 rounded-full">
              {filteredTreatmentCenters.length} مركزاً
            </span>
          </div>

          {/* ⚠️ ملاحظة مهمة (User's Exact Notice) */}
          <div className="bg-amber-50/90 border border-amber-300 rounded-2xl p-4 flex items-start gap-2.5 text-amber-950 shadow-xs">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs font-semibold leading-relaxed">
              <strong className="text-amber-800 font-extrabold">⚠️ ملاحظة مهمة:</strong> بعض أرقام ومواقع المراكز المتداولة على الإنترنت قديمة، لذلك اتصل بالمركز قبل ما تتنقل للتأكد من العنوان ورقم الاستقبال والخدمات المتوفرة.
            </div>
          </div>

          {/* Wilaya Filter Dropdown */}
          <div className="flex items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs font-bold text-slate-700">تصفية حسب الولاية:</span>
            <select
              value={selectedCenterWilaya}
              onChange={(e) => setSelectedCenterWilaya(e.target.value)}
              className="p-1.5 bg-slate-50 text-xs font-bold border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1565C0] outline-none"
            >
              <option value="all">جميع الولايات المتاحة</option>
              {ALGERIA_TREATMENT_CENTERS.map((c) => (
                <option key={c.id} value={c.wilayaName}>
                  {c.wilayaCode} – {c.wilayaName}
                </option>
              ))}
            </select>
          </div>

          {/* Treatment Centers List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTreatmentCenters.map((center) => (
              <div
                key={center.id}
                className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs hover:border-[#2E7D32]/50 hover:shadow-md transition-all flex flex-col justify-between space-y-3"
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-black bg-blue-50 text-[#1565C0] border border-blue-100">
                        <span>📍</span>
                        <span>{center.wilayaCode} – {center.wilayaName}</span>
                      </span>
                      <h3 className="font-bold text-sm sm:text-base text-slate-900 leading-snug pt-1">
                        {center.name}
                      </h3>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 shrink-0">
                      معتمد
                    </span>
                  </div>

                  {center.description && (
                    <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 leading-relaxed">
                      {center.description}
                    </p>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100">
                  {center.phones && center.phones.length > 0 ? (
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-bold text-slate-500 block">الاتصال الهاتفي المباشر:</span>
                      <div className="flex flex-wrap gap-2">
                        {center.phones.map((phoneNum, idx) => (
                          <a
                            key={idx}
                            href={`tel:${phoneNum.replace(/\s+/g, '')}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-[#2E7D32] text-[#2E7D32] hover:text-white rounded-xl text-xs font-mono font-bold transition-all border border-emerald-200 group"
                          >
                            <PhoneCall className="w-3.5 h-3.5 text-[#2E7D32] group-hover:text-white" />
                            <span dir="ltr">{phoneNum}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-[11px] text-slate-500 flex items-center gap-1.5 bg-slate-50 p-2 rounded-xl">
                      <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>يرجى مراجعة مصلحة EPSP بالولاية أو التنقل المباشر للمركز</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : activeCategory === 'awareness' ? (
        /* Awareness & Scientific Studies Public View */
        <AwarenessStudiesView />
      ) : (
        /* Regular Services List Cards (Matching Screen 4) */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredServices.map((service) => {
            const Icon = service.icon;
            return (
              <div
                key={service.id}
                className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs hover:shadow-md hover:border-blue-200 transition-all flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-3">
                  <div className="flex items-start gap-3.5">
                    <div className={`w-12 h-12 rounded-2xl ${service.bgColor} flex items-center justify-center shrink-0 shadow-xs ring-1 ring-black/5`}>
                      <Icon className={`w-6 h-6 ${service.iconColor}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h3 className="font-bold text-slate-900 text-sm sm:text-base group-hover:text-[#1565C0] transition-colors">
                          {service.title}
                        </h3>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 shrink-0">
                          {service.badge}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        {service.desc}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Bottom Meta & Action */}
                <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-emerald-600" />
                    {service.stats}
                  </span>

                  <button
                    onClick={() => {
                      if (service.id === 'treatment') {
                        setActiveCategory('treatment');
                      } else if (service.id === 'awareness') {
                        setActiveCategory('awareness');
                      } else if (onOpenBooking) {
                        onOpenBooking(service.title);
                      } else if (onSelectService) {
                        onSelectService(service.id);
                      }
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
      )}

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
