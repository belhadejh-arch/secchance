import React from 'react';
import {
  Bot,
  PhoneCall,
  Home,
  Briefcase,
  Building2,
  BookOpen,
  AlertTriangle,
  Scale,
  ShieldCheck,
  Stethoscope,
  LogOut,
  User as UserIcon,
} from 'lucide-react';
import { User } from '../types';

interface NavbarProps {
  currentUser: User | null;
  onNavigate: (view: string) => void;
  onOpenAuth: () => void;
  onOpenAiTriage: () => void;
  onLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onNavigate,
  onOpenAuth,
  onOpenAiTriage,
  onLogout,
}) => {
  const isAdmin = currentUser?.roleSlug === 'admin';
  const isSpecialist =
    currentUser &&
    ['psychologist', 'doctor', 'lawyer', 'legal_advisor', 'clinic', 'hospital', 'association', 'treatment_center'].includes(
      currentUser.roleSlug
    );

  const handleDashboardClick = () => {
    if (isAdmin) {
      onNavigate('admin-dashboard');
    } else if (isSpecialist) {
      onNavigate('specialist-dashboard');
    } else {
      onNavigate('portal');
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#FBFDFC] border-b border-[#E0E8E6] shadow-xs">
      {/* Top AppBar */}
      <div className="max-w-4xl mx-auto px-4 py-2 flex items-center justify-between">
        {/* Brand with Official Logo */}
        <div
          onClick={() => onNavigate('landing')}
          className="flex items-center gap-2.5 cursor-pointer select-none"
        >
          <img
            src="/logo.png"
            alt="شعار منصة الفرصة الثانية"
            className="w-10 h-10 object-contain rounded-full shadow-xs bg-white border border-[#E0E8E6] shrink-0"
          />
          <div className="flex flex-col">
            <span className="font-bold text-[15px] sm:text-[16px] text-[#203945] leading-tight">
              منصة الفرصة الثانية
            </span>
            <span className="text-[10px] font-semibold text-[#1766A6]">
              الدعم النفسي والقانوني ومحاربة الإدمان
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* AI Triage */}
          <button
            onClick={onOpenAiTriage}
            className="p-2 rounded-lg text-[#1766A6] hover:bg-[#EAF3F8] transition-colors"
            title="المساعد الذكي والتوجيه المعتمد"
          >
            <Bot className="w-5 h-5" />
          </button>

          {/* Emergency Hotline */}
          <button
            onClick={() => onNavigate('emergency')}
            className="p-2 rounded-lg text-[#A64842] hover:bg-[#FBECEB] transition-colors"
            title="الطوارئ ومركز معالجة الإدمان"
          >
            <PhoneCall className="w-5 h-5" />
          </button>

          {/* Auth State Button */}
          {currentUser ? (
            <div className="flex items-center gap-1">
              <button
                onClick={handleDashboardClick}
                className={`px-3 py-1.5 rounded-[10px] text-xs font-bold transition-colors flex items-center gap-1.5 ${
                  isAdmin
                    ? 'bg-[#1766A6] text-white hover:bg-[#125386] shadow-xs'
                    : isSpecialist
                    ? 'bg-[#25866D] text-white hover:bg-[#1E6F5A] shadow-xs'
                    : 'bg-[#EAF3F8] text-[#104A78] hover:bg-[#DCEBF4]'
                }`}
                title={isAdmin ? 'لوحة التحكم الإدارية' : isSpecialist ? 'لوحة تحكم المختص' : 'لوحة طلباتي'}
              >
                {isAdmin ? (
                  <ShieldCheck className="w-3.5 h-3.5" />
                ) : isSpecialist ? (
                  <Stethoscope className="w-3.5 h-3.5" />
                ) : (
                  <UserIcon className="w-3.5 h-3.5" />
                )}
                <span>
                  {isAdmin ? 'لوحة الإدارة' : isSpecialist ? 'لوحة المختص' : currentUser.firstName}
                </span>
              </button>

              {onLogout && (
                <button
                  onClick={onLogout}
                  className="p-1.5 rounded-lg text-[#203945]/50 hover:text-[#A64842] hover:bg-[#FBECEB] transition-colors"
                  title="تسجيل الخروج"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="px-3.5 py-1.5 rounded-[8px] bg-[#1766A6] text-white hover:bg-[#125386] text-xs font-bold transition-colors shadow-xs"
            >
              تسجيل الدخول
            </button>
          )}
        </div>
      </div>

      {/* Sub Navigation Bar */}
      <div className="bg-[#EAF3F8]/70 border-t border-[#DCEBF4] px-4 py-1.5">
        <div className="max-w-4xl mx-auto flex items-center justify-between sm:justify-start sm:gap-4 overflow-x-auto text-[11px] font-semibold text-[#203945] no-scrollbar">
          <button
            onClick={() => onNavigate('landing')}
            className="flex items-center gap-1 hover:text-[#1766A6] transition-colors py-1 px-1 rounded-sm shrink-0"
          >
            <Home className="w-3.5 h-3.5 text-[#1766A6]" />
            <span>الرئيسية</span>
          </button>

          {isAdmin && (
            <button
              onClick={() => onNavigate('admin-dashboard')}
              className="flex items-center gap-1 text-[#1766A6] bg-[#1766A6]/10 px-2 py-0.5 rounded-md shrink-0 font-bold"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>لوحة الإدارة العامة</span>
            </button>
          )}

          {isSpecialist && (
            <button
              onClick={() => onNavigate('specialist-dashboard')}
              className="flex items-center gap-1 text-[#25866D] bg-[#25866D]/10 px-2 py-0.5 rounded-md shrink-0 font-bold"
            >
              <Stethoscope className="w-3.5 h-3.5" />
              <span>لوحة المختص</span>
            </button>
          )}

          <button
            onClick={() => onNavigate('legal-assistance')}
            className="flex items-center gap-1 hover:text-[#1766A6] transition-colors py-1 px-1 rounded-sm shrink-0 font-bold text-[#104A78]"
          >
            <Scale className="w-3.5 h-3.5 text-[#1766A6]" />
            <span>المساعدة القانونية</span>
          </button>

          <button
            onClick={() => onNavigate('services')}
            className="flex items-center gap-1 hover:text-[#1766A6] transition-colors py-1 px-1 rounded-sm shrink-0"
          >
            <Briefcase className="w-3.5 h-3.5 text-[#1766A6]" />
            <span>الخدمات</span>
          </button>

          <button
            onClick={() => onNavigate('directory')}
            className="flex items-center gap-1 hover:text-[#1766A6] transition-colors py-1 px-1 rounded-sm shrink-0"
          >
            <Building2 className="w-3.5 h-3.5 text-[#1766A6]" />
            <span>المراكز (40)</span>
          </button>

          <button
            onClick={() => onNavigate('awareness')}
            className="flex items-center gap-1 hover:text-[#1766A6] transition-colors py-1 px-1 rounded-sm shrink-0"
          >
            <BookOpen className="w-3.5 h-3.5 text-[#1766A6]" />
            <span>المراجع القانونية</span>
          </button>

          <button
            onClick={() => onNavigate('emergency')}
            className="flex items-center gap-1 text-[#A64842] hover:opacity-80 transition-colors py-1 px-1 rounded-sm shrink-0 font-bold"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-[#A64842]" />
            <span>الطوارئ</span>
          </button>
        </div>
      </div>
    </header>
  );
};
