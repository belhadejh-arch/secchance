import React, { useState } from 'react';
import { 
  Home, 
  Layers, 
  FolderKanban, 
  Calendar, 
  MoreHorizontal, 
  Sparkles,
  Plus,
  User,
  Bell,
  Search,
  MessageSquare,
  Info,
  PhoneCall,
  X,
  ChevronLeft,
  LogOut,
  Activity,
  ShieldAlert
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface BottomNavigatorProps {
  currentView: string;
  onNavigate: (view: string) => void;
  onOpenAiTriage: () => void;
  onNewCase?: () => void;
}

export const BottomNavigator: React.FC<BottomNavigatorProps> = ({
  currentView,
  onNavigate,
  onOpenAiTriage,
  onNewCase
}) => {
  const { user, logout } = useAuth();
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const handleSelectMore = (view: string) => {
    setIsMoreOpen(false);
    onNavigate(view);
  };

  return (
    <>
      {/* Bottom Sheet for 'المزيد' (More Menu) */}
      {isMoreOpen && (
        <div 
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-end justify-center p-0 sm:p-4" 
          dir="rtl"
          onClick={() => setIsMoreOpen(false)}
        >
          <div 
            className="bg-white rounded-t-3xl sm:rounded-3xl max-w-md w-full p-5 space-y-4 shadow-2xl border border-slate-200 animate-in slide-in-from-bottom duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#1565C0]" />
                <h3 className="font-black text-slate-900 text-sm">خيارات إضافية</h3>
              </div>
              <button 
                onClick={() => setIsMoreOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => handleSelectMore('profile')}
                className="p-3 rounded-2xl border border-slate-200/80 hover:border-[#1565C0] hover:bg-blue-50/50 flex items-center gap-2.5 transition-all text-right"
              >
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-[#1565C0] flex items-center justify-center shrink-0">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-slate-800 block text-xs">الملف الشخصي</span>
                  <span className="text-[10px] text-slate-400">بياناتك وحسابك</span>
                </div>
              </button>

              <button
                onClick={() => handleSelectMore('notifications')}
                className="p-3 rounded-2xl border border-slate-200/80 hover:border-[#1565C0] hover:bg-blue-50/50 flex items-center gap-2.5 transition-all text-right"
              >
                <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-slate-800 block text-xs">الإشعارات</span>
                  <span className="text-[10px] text-slate-400">تنبيهات المتابعة</span>
                </div>
              </button>

              <button
                onClick={() => handleSelectMore('search')}
                className="p-3 rounded-2xl border border-slate-200/80 hover:border-[#1565C0] hover:bg-blue-50/50 flex items-center gap-2.5 transition-all text-right"
              >
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <Search className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-slate-800 block text-xs">البحث الذكي</span>
                  <span className="text-[10px] text-slate-400">تصفية الحالات والكوادر</span>
                </div>
              </button>

              <button
                onClick={() => handleSelectMore('messages')}
                className="p-3 rounded-2xl border border-slate-200/80 hover:border-[#1565C0] hover:bg-blue-50/50 flex items-center gap-2.5 transition-all text-right"
              >
                <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-slate-800 block text-xs">المحادثات</span>
                  <span className="text-[10px] text-slate-400">تواصل مشفر وسري</span>
                </div>
              </button>

              <button
                onClick={() => handleSelectMore('about')}
                className="p-3 rounded-2xl border border-slate-200/80 hover:border-[#1565C0] hover:bg-blue-50/50 flex items-center gap-2.5 transition-all text-right"
              >
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                  <Info className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-slate-800 block text-xs">عن المنصة</span>
                  <span className="text-[10px] text-slate-400">الرؤية والقيم</span>
                </div>
              </button>

              <button
                onClick={() => handleSelectMore('emergency')}
                className="p-3 rounded-2xl border border-red-200/80 hover:border-red-400 hover:bg-red-50/50 flex items-center gap-2.5 transition-all text-right"
              >
                <div className="w-8 h-8 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                  <PhoneCall className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-slate-800 block text-xs">دليل الطوارئ</span>
                  <span className="text-[10px] text-red-500">1099 خط مباشر</span>
                </div>
              </button>
            </div>

            {user && (
              <button
                onClick={() => {
                  setIsMoreOpen(false);
                  logout();
                }}
                className="w-full py-2.5 bg-slate-50 hover:bg-red-50 text-slate-600 hover:text-red-600 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                <span>تسجيل الخروج ({user.first_name})</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Bottom Bar (100% Matching Reference Mobile Design from Image 1 - Visible on Mobile and Tablets, hidden on Desktop Lg) */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 flex justify-center bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] px-2 sm:px-6">
        <div className="w-full max-w-md sm:max-w-lg flex items-center justify-between py-1.5 px-1 relative" dir="rtl">
          
          {/* Tab 1: الرئيسية (Home) */}
          <button
            onClick={() => onNavigate('landing')}
            className={`flex flex-col items-center justify-center flex-1 py-1 rounded-2xl transition-all cursor-pointer ${
              currentView === 'landing'
                ? 'text-[#1565C0] font-bold'
                : 'text-slate-400 hover:text-slate-700'
            }`}
          >
            <Home className={`w-5 h-5 mb-0.5 ${currentView === 'landing' ? 'stroke-[2.5]' : 'stroke-2'}`} />
            <span className="text-[10px] tracking-tight">الرئيسية</span>
          </button>

          {/* Tab 2: الخدمات (Services) */}
          <button
            onClick={() => onNavigate('services')}
            className={`flex flex-col items-center justify-center flex-1 py-1 rounded-2xl transition-all cursor-pointer ${
              currentView === 'services'
                ? 'text-[#1565C0] font-bold'
                : 'text-slate-400 hover:text-slate-700'
            }`}
          >
            <Layers className={`w-5 h-5 mb-0.5 ${currentView === 'services' ? 'stroke-[2.5]' : 'stroke-2'}`} />
            <span className="text-[10px] tracking-tight">الخدمات</span>
          </button>

          {/* Center Cutout Floating Action Button (Quick Case or AI Triage) */}
          <div className="relative -top-4 flex flex-col items-center px-1">
            <button
              onClick={onNewCase ? onNewCase : onOpenAiTriage}
              className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#1565C0] via-[#0284C7] to-[#2E7D32] text-white flex items-center justify-center shadow-lg shadow-blue-600/30 hover:scale-105 active:scale-95 transition-all cursor-pointer group ring-4 ring-white"
              title="طلب مساعدة سريعة"
            >
              <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform stroke-[2.5]" />
            </button>
            <span className="text-[9px] font-bold text-[#1565C0] -mt-0.5">طلب مساعدة</span>
          </div>

          {/* Tab 3: الحالات (Cases / Portal) */}
          <button
            onClick={() => onNavigate('portal')}
            className={`flex flex-col items-center justify-center flex-1 py-1 rounded-2xl transition-all cursor-pointer ${
              currentView === 'portal' || currentView === 'case-detail'
                ? 'text-[#1565C0] font-bold'
                : 'text-slate-400 hover:text-slate-700'
            }`}
          >
            <FolderKanban className={`w-5 h-5 mb-0.5 ${currentView === 'portal' ? 'stroke-[2.5]' : 'stroke-2'}`} />
            <span className="text-[10px] tracking-tight">الحالات</span>
          </button>

          {/* Tab 4: المواعيد (Appointments) */}
          <button
            onClick={() => onNavigate('appointments')}
            className={`flex flex-col items-center justify-center flex-1 py-1 rounded-2xl transition-all cursor-pointer ${
              currentView === 'appointments'
                ? 'text-[#1565C0] font-bold'
                : 'text-slate-400 hover:text-slate-700'
            }`}
          >
            <Calendar className={`w-5 h-5 mb-0.5 ${currentView === 'appointments' ? 'stroke-[2.5]' : 'stroke-2'}`} />
            <span className="text-[10px] tracking-tight">المواعيد</span>
          </button>

          {/* Tab 5: المزيد (More) */}
          <button
            onClick={() => setIsMoreOpen(true)}
            className={`flex flex-col items-center justify-center flex-1 py-1 rounded-2xl transition-all cursor-pointer ${
              isMoreOpen || ['profile', 'notifications', 'search', 'about', 'emergency'].includes(currentView)
                ? 'text-[#1565C0] font-bold'
                : 'text-slate-400 hover:text-slate-700'
            }`}
          >
            <MoreHorizontal className={`w-5 h-5 mb-0.5 ${isMoreOpen ? 'stroke-[2.5]' : 'stroke-2'}`} />
            <span className="text-[10px] tracking-tight">المزيد</span>
          </button>

        </div>
      </div>
    </>
  );
};
