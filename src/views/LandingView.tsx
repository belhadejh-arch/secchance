import React from 'react';
import {
  ShieldCheck,
  PlusCircle,
  Bot,
  PhoneCall,
  Scale,
  CreditCard,
  Users,
  CheckCircle2,
  Calendar,
  Building,
  HeartHandshake,
  ArrowRight,
  ExternalLink,
  Mail,
  Phone,
  MapPin,
  Lock,
  Activity,
  FileCheck,
  Award,
} from 'lucide-react';
import { PartnerOrganization, ServiceItem, User } from '../types';

interface LandingViewProps {
  onNavigate: (view: string) => void;
  onOpenAiTriage: () => void;
  onNewCase: () => void;
  onOpenAuth?: (mode?: 'login' | 'register') => void;
  partners?: PartnerOrganization[];
  servicesCount?: number;
  usersCount?: number;
  completedCasesCount?: number;
  specialistsCount?: number;
}

export const LandingView: React.FC<LandingViewProps> = ({
  onNavigate,
  onOpenAiTriage,
  onNewCase,
  onOpenAuth,
  partners = [],
  servicesCount = 6,
  usersCount = 120,
  completedCasesCount = 38,
  specialistsCount = 24,
}) => {
  const visiblePartners = partners.filter((p) => p.isVisible);

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* 1. Hero Section (Requirement 16) */}
      <section className="bg-[#EAF3F8] rounded-[24px] p-6 sm:p-8 shadow-xs border border-[#DCEBF4]">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <img
            src="/logo.png"
            alt="شعار منصة الفرصة الثانية"
            className="w-24 h-24 sm:w-32 sm:h-32 object-contain rounded-2xl bg-white p-2 shadow-xs border border-[#CCD8D5] shrink-0"
          />

          <div className="space-y-3 text-center sm:text-right flex-1">
            <div className="inline-flex items-center gap-1.5 bg-white/80 px-3 py-1 rounded-full text-[11px] font-bold text-[#1766A6] shadow-2xs border border-[#DCEBF4]">
              <ShieldCheck className="w-4 h-4" />
              <span>المنصة الرقمية الوطنية المتكاملة للدعم والمرافقة</span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-[#104A78] leading-snug">
              نؤمن بأن كل شخص يستحق فرصة ثانية
            </h1>

            <p className="text-xs sm:text-sm text-[#104A78]/80 leading-relaxed font-medium">
              منصة رقمية متخصصة في دعم الأفراد وأسرهم لمواجهة آثار المخدرات والمؤثرات العقلية، عبر تقديم الاستشارات والمرافقة القانونية والنفسية والاجتماعية، وتوجيههم نحو العلاج وإعادة الإدماج، مع توفير نظام دفع إلكتروني عبر بطاقتي "الذهبية" و"CIB".
            </p>

            {/* CTAs */}
            <div className="pt-2 flex flex-wrap gap-2.5 justify-center sm:justify-start">
              <button
                onClick={onNewCase}
                className="flex items-center justify-center gap-2 py-2.5 px-5 rounded-[12px] bg-[#1766A6] hover:bg-[#125386] text-white font-bold text-xs sm:text-sm shadow-xs transition-colors"
              >
                <PlusCircle className="w-4 h-4" />
                <span>طلب المساعدة الآن</span>
              </button>

              <button
                onClick={() => onNavigate('legal-assistance')}
                className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-[12px] bg-[#25866D] hover:bg-[#1E6F5A] text-white font-bold text-xs sm:text-sm shadow-xs transition-colors"
              >
                <Scale className="w-4 h-4" />
                <span>المساعدة القانونية (المادة 6)</span>
              </button>

              {onOpenAuth && (
                <button
                  onClick={() => onOpenAuth('login')}
                  className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-[12px] bg-white border border-[#1766A6] text-[#1766A6] hover:bg-[#EAF3F8] font-bold text-xs sm:text-sm transition-colors shadow-2xs"
                >
                  <Lock className="w-4 h-4" />
                  <span>تسجيل الدخول</span>
                </button>
              )}

              {onOpenAuth && (
                <button
                  onClick={() => onOpenAuth('register')}
                  className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-[12px] bg-white/70 hover:bg-white text-[#203945] font-bold text-xs sm:text-sm transition-colors border border-[#CCD8D5]"
                >
                  <span>إنشاء حساب مستفيد</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Emergency Hotline Bar */}
      <section className="bg-[#FBECEB] rounded-[18px] p-4 border border-[#F5D4D2] flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[12px] bg-[#A64842] text-white flex items-center justify-center shrink-0">
            <PhoneCall className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xs sm:text-sm font-bold text-[#5F1D1A]">
              طوارئ وإسعاف طبي: مركز معالجة الإدمان (020 39 59 59)
            </h2>
            <p className="text-[11px] text-[#5F1D1A]/80">
              الدرك الوطني: 1055 • الشرطة: 1548 • الحماية المدنية: 14 • المساعدة الفورية السرية
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigate('emergency')}
          className="w-full sm:w-auto px-4 py-2 rounded-[10px] bg-[#A64842] hover:bg-[#8A3A35] text-white text-xs font-bold shadow-xs transition-colors shrink-0"
        >
          دليل الطوارئ ومراكز علاج الإدمان
        </button>
      </section>

      {/* 2. Real-time Live Statistics Bar (Requirement 16 & 19) */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
        <div className="bg-[#FBFDFC] border border-[#E0E8E6] p-4 rounded-[16px] shadow-xs space-y-1">
          <Users className="w-5 h-5 text-[#1766A6] mx-auto" />
          <p className="text-xl sm:text-2xl font-black text-[#203945]">+{usersCount}</p>
          <p className="text-[11px] text-[#203945]/70 font-bold">مستفيد ومواطن مسجل</p>
        </div>

        <div className="bg-[#FBFDFC] border border-[#E0E8E6] p-4 rounded-[16px] shadow-xs space-y-1">
          <Award className="w-5 h-5 text-[#25866D] mx-auto" />
          <p className="text-xl sm:text-2xl font-black text-[#203945]">+{specialistsCount}</p>
          <p className="text-[11px] text-[#203945]/70 font-bold">مختص وطبيب ومحامٍ معتمد</p>
        </div>

        <div className="bg-[#FBFDFC] border border-[#E0E8E6] p-4 rounded-[16px] shadow-xs space-y-1">
          <CheckCircle2 className="w-5 h-5 text-[#25866D] mx-auto" />
          <p className="text-xl sm:text-2xl font-black text-[#203945]">+{completedCasesCount}</p>
          <p className="text-[11px] text-[#203945]/70 font-bold">حالة تمت مرافقتها بنجاح</p>
        </div>

        <div className="bg-[#FBFDFC] border border-[#E0E8E6] p-4 rounded-[16px] shadow-xs space-y-1">
          <MapPin className="w-5 h-5 text-[#1766A6] mx-auto" />
          <p className="text-xl sm:text-2xl font-black text-[#203945]">58</p>
          <p className="text-[11px] text-[#203945]/70 font-bold">ولاية عبر التراب الوطني</p>
        </div>
      </section>

      {/* 3. Services Cards (Requirement 16) */}
      <section className="space-y-3">
        <h2 className="text-base font-bold text-[#203945]">المساعدة القانونية</h2>
        <div className="grid grid-cols-1 gap-3">
          <div
            onClick={() => onNavigate('legal-assistance')}
            className="bg-[#FBFDFC] p-5 rounded-[18px] border border-[#E0E8E6] shadow-xs hover:border-[#1766A6] transition-all cursor-pointer space-y-2.5"
          >
            <div className="w-10 h-10 rounded-[12px] bg-[#EAF3F8] text-[#1766A6] flex items-center justify-center">
              <Scale className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-[#203945]">المساعدة القانونية والمادة 6</h3>
            <p className="text-xs text-[#203945]/75 leading-relaxed">
              استشارات قضائية مع محامين معتمدين للاستفادة من الإعفاء القانوني والعلاج الطوعي البديل.
            </p>
          </div>
        </div>
      </section>

      {/* 4. How the platform works (Requirement 16) */}
      <section className="bg-[#FBFDFC] border border-[#E0E8E6] rounded-[22px] p-6 shadow-xs space-y-4">
        <div className="text-center space-y-1">
          <h2 className="text-base sm:text-lg font-black text-[#203945]">كيفية عمل منصة الفرصة الثانية</h2>
          <p className="text-xs text-[#203945]/70">أربع خطوات مبسطة وسرية تبدأ بها رحلة التعافي والمرافقة</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-center">
          <div className="p-4 rounded-[14px] bg-[#F3F7F6] space-y-2">
            <div className="w-8 h-8 rounded-full bg-[#1766A6] text-white font-bold text-xs flex items-center justify-center mx-auto">
              1
            </div>
            <h3 className="font-bold text-xs text-[#203945]">إنشاء الحساب</h3>
            <p className="text-[11px] text-[#203945]/70">تسجيل سريع وسري كمستفيد أو أحد أفراد الأسرة</p>
          </div>

          <div className="p-4 rounded-[14px] bg-[#F3F7F6] space-y-2">
            <div className="w-8 h-8 rounded-full bg-[#1766A6] text-white font-bold text-xs flex items-center justify-center mx-auto">
              2
            </div>
            <h3 className="font-bold text-xs text-[#203945]">اختيار الخدمة أو المختص</h3>
            <p className="text-[11px] text-[#203945]/70">تحديد نوع الاستشارة أو المحامي في ولايتك</p>
          </div>

          <div className="p-4 rounded-[14px] bg-[#F3F7F6] space-y-2">
            <div className="w-8 h-8 rounded-full bg-[#1766A6] text-white font-bold text-xs flex items-center justify-center mx-auto">
              3
            </div>
            <h3 className="font-bold text-xs text-[#203945]">الدفع وتأكيد الموعد</h3>
            <p className="text-[11px] text-[#203945]/70">دفع إلكتروني آمن بالبطاقة الذهبية وتحديد موعد الجلسة</p>
          </div>

          <div className="p-4 rounded-[14px] bg-[#F3F7F6] space-y-2">
            <div className="w-8 h-8 rounded-full bg-[#25866D] text-white font-bold text-xs flex items-center justify-center mx-auto">
              4
            </div>
            <h3 className="font-bold text-xs text-[#25866D]">المتابعة والتقارير</h3>
            <p className="text-[11px] text-[#203945]/70">جلسات دورية، متابعة سريرية، وتقارير رسمية معتمدة</p>
          </div>
        </div>
      </section>

      {/* 5. Official Partners Section (Requirement 15 & 16) */}
      <section className="bg-[#FBFDFC] border border-[#E0E8E6] rounded-[22px] p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#E0E8E6] pb-3">
          <div>
            <h2 className="text-base font-black text-[#203945] flex items-center gap-2">
              <HeartHandshake className="w-5 h-5 text-[#25866D]" />
              <span>الشركاء والجهات الرسمية المعتمدة</span>
            </h2>
            <p className="text-xs text-[#203945]/70 mt-0.5">
              تعاون مؤسساتي مع الوزارات المعنية، المستشفيات الجامعية، ومنظمات المحامين والجمعيات
            </p>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-[#E8F4EF] text-[#25866D] text-[11px] font-bold">
            شراكات رسمية
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {visiblePartners.map((partner) => (
            <div
              key={partner.id}
              className="p-4 rounded-[16px] bg-[#F3F7F6] border border-[#CCD8D5] flex flex-col justify-between space-y-2.5 hover:bg-white hover:border-[#1766A6] transition-all"
            >
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded-md bg-[#EAF3F8] text-[#1766A6] text-[10px] font-bold">
                    {partner.category}
                  </span>
                  {partner.websiteUrl && (
                    <a
                      href={partner.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#203945]/40 hover:text-[#1766A6]"
                      title="الموقع الرسمي"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
                <h4 className="font-bold text-xs text-[#203945]">{partner.name}</h4>
                <p className="text-[11px] text-[#203945]/70 leading-normal line-clamp-2">
                  {partner.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. Static Structured Footer (Requirement 17) */}
      <footer className="bg-[#203945] text-white rounded-[24px] p-7 sm:p-8 space-y-6 shadow-sm mt-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 text-xs border-b border-white/10 pb-6">
          {/* Col 1: Brand */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2">
              <img
                src="/logo.png"
                alt="Logo"
                className="w-10 h-10 object-contain rounded-full bg-white p-0.5"
              />
              <span className="font-black text-sm text-white">منصة الفرصة الثانية</span>
            </div>
            <p className="text-white/70 leading-relaxed text-[11px]">
              المنصة الرقمية الوطنية المتكاملة للدعم النفسي، الاستشارات القانونية ومرافقة الأسر وعلاج الإدمان وفق التشريع الجزائري.
            </p>
          </div>

          {/* Col 2: Navigation Links */}
          <div className="space-y-2">
            <h4 className="font-bold text-sm text-[#EAF3F8]">روابط المنصة</h4>
            <ul className="space-y-1.5 text-white/70">
              <li>
                <button onClick={() => onNavigate('landing')} className="hover:text-white transition-colors">
                  الرئيسية
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('services')} className="hover:text-white transition-colors">
                  الخدمات المتاحة
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('legal-assistance')} className="hover:text-white transition-colors">
                  طلب مساعدة قانونية
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('directory')} className="hover:text-white transition-colors">
                  دليل مراكز علاج الإدمان
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('awareness')} className="hover:text-white transition-colors">
                  المراجع والمواد القانونية (PDF)
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('emergency')} className="hover:text-white transition-colors">
                  دليل الطوارئ ومراكز علاج الإدمان
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Legal Links */}
          <div className="space-y-2">
            <h4 className="font-bold text-sm text-[#EAF3F8]">الجانب التشريعي والسرية</h4>
            <ul className="space-y-1.5 text-white/70">
              <li>
                <button onClick={() => onNavigate('awareness')} className="hover:text-white text-right">
                  قانون حماية المعطيات الشخصية (القانون 18-07)
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('awareness')} className="hover:text-white text-right">
                  قانون مكافحة المخدرات 04-18 والمادة 6
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('awareness')} className="hover:text-white text-right">
                  تعديلات القانون 25-03 والمرسوم التنفيذي 26-76
                </button>
              </li>
              <li>
                <a href="/18-04.pdf" download className="hover:text-white block text-right">
                  تحميل قانون 04-18 مباشرة (PDF)
                </a>
              </li>
              <li>
                <a href="/18-07.pdf" download className="hover:text-white block text-right">
                  تحميل قانون حماية المعطيات 18-07 (PDF)
                </a>
              </li>
            </ul>
          </div>

          {/* Col 4: Contact & Social */}
          <div className="space-y-2">
            <h4 className="font-bold text-sm text-[#EAF3F8]">تواصل معنا</h4>
            <div className="space-y-2 text-white/70 text-[11px]">
              <p className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-[#25866D]" />
                <span>contact@secchance.dz</span>
              </p>
              <p className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-[#25866D]" />
                <span dir="ltr">0673362606</span>
              </p>
              <p className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#25866D]" />
                <span>قسنطينة</span>
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-white/60">
          <p>جميع الحقوق محفوظة لمنصة فرصة ثانية</p>
          <p>نظام رقمي وطني آمن ومحمي بأعلى معايير التشفير والسرية.</p>
        </div>
      </footer>
    </div>
  );
};
