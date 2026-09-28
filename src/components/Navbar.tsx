import React from 'react';
import {
  Shield,
  Bot,
  PhoneCall,
  User as UserIcon,
  Home,
  Briefcase,
  Building2,
  BookOpen,
  AlertTriangle,
} from 'lucide-react';
import { User } from '../types';

interface NavbarProps {
  currentUser: User | null;
  onNavigate: (view: string) => void;
  onOpenAuth: () => void;
  onOpenAiTriage: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onNavigate,
  onOpenAuth,
  onOpenAiTriage,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
      {/* Main Top Bar */}
      <div className="max-w-6xl mx-auto px-4 py-2.5 flex items-center justify-between">
        {/* Brand */}
        <div
          onClick={() => onNavigate('landing')}
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-700 text-white flex items-center justify-center shadow-sm group-hover:bg-blue-800 transition-colors">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-base text-slate-900 leading-tight">
              منصة الفرصة الثانية
            </span>
            <span className="text-xs font-semibold text-blue-700">
              الدعم النفسي والقانوني ومحاربة الإدمان
            </span>
          </div>
        </div>

        {/* Top Actions */}
        <div className="flex items-center gap-2">
          {/* AI Triage Button */}
          <button
            onClick={onOpenAiTriage}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors border border-blue-200"
            title="المساعد الذكي والتوجيه العيادي"
          >
            <Bot className="w-4 h-4 text-blue-700" />
            <span className="hidden sm:inline">التوجيه الذكي</span>
          </button>

          {/* Emergency Hotline Button */}
          <button
            onClick={() => onNavigate('emergency')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 transition-colors border border-red-200"
            title="طوارئ 24/24"
          >
            <PhoneCall className="w-4 h-4 text-red-600 animate-pulse" />
            <span className="hidden sm:inline">الطوارئ (1032 / 1055)</span>
          </button>

          {/* Auth State Button */}
          {currentUser ? (
            <button
              onClick={() => onNavigate('portal')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-700 text-white hover:bg-blue-800 text-xs font-bold transition-colors shadow-xs"
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span>{currentUser.firstName}</span>
            </button>
          ) : (
            <button
              onClick={onOpenAuth}
              className="px-3.5 py-1.5 rounded-lg bg-blue-700 text-white hover:bg-blue-800 text-xs font-bold transition-colors shadow-xs"
            >
              دخول الحساب
            </button>
          )}
        </div>
      </div>

      {/* Sub Navigation Bar */}
      <div className="bg-blue-50/70 border-t border-blue-100/60 px-4 py-1.5">
        <div className="max-w-6xl mx-auto flex items-center justify-between sm:justify-start sm:gap-6 overflow-x-auto text-xs font-semibold text-slate-700">
          <button
            onClick={() => onNavigate('landing')}
            className="flex items-center gap-1 hover:text-blue-700 transition-colors py-1 px-1.5 rounded-sm"
          >
            <Home className="w-3.5 h-3.5 text-blue-700" />
            <span>الرئيسية</span>
          </button>
          <button
            onClick={() => onNavigate('services')}
            className="flex items-center gap-1 hover:text-blue-700 transition-colors py-1 px-1.5 rounded-sm"
          >
            <Briefcase className="w-3.5 h-3.5 text-blue-700" />
            <span>الخدمات</span>
          </button>
          <button
            onClick={() => onNavigate('directory')}
            className="flex items-center gap-1 hover:text-blue-700 transition-colors py-1 px-1.5 rounded-sm"
          >
            <Building2 className="w-3.5 h-3.5 text-blue-700" />
            <span>المراكز والجمعيات</span>
          </button>
          <button
            onClick={() => onNavigate('awareness')}
            className="flex items-center gap-1 hover:text-blue-700 transition-colors py-1 px-1.5 rounded-sm"
          >
            <BookOpen className="w-3.5 h-3.5 text-blue-700" />
            <span>التوعية والتشريع</span>
          </button>
          <button
            onClick={() => onNavigate('emergency')}
            className="flex items-center gap-1 text-red-600 hover:text-red-700 transition-colors py-1 px-1.5 rounded-sm"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
            <span>أرقام النجدة</span>
          </button>
        </div>
      </div>
    </header>
  );
};
