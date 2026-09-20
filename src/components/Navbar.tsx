import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { RoleSlug, NotificationItem } from '../types';
import { api } from '../services/api';
import { 
  Shield, 
  HeartHandshake, 
  PhoneCall, 
  Bell, 
  User, 
  LogOut, 
  Sparkles, 
  ChevronDown, 
  CheckCircle2, 
  Calendar, 
  MessageSquare, 
  LayoutDashboard,
  Menu,
  X
} from 'lucide-react';

interface NavbarProps {
  onOpenAuth: (defaultTab?: 'login' | 'register') => void;
  onOpenAiTriage: () => void;
  currentView: string;
  onNavigate: (view: string) => void;
}

const ROLES_INFO: Record<RoleSlug, { title: string; color: string }> = {
  admin: { title: 'مدير النظام', color: 'bg-purple-100 text-purple-800 border-purple-300' },
  psychologist: { title: 'أخصائي نفسي', color: 'bg-blue-100 text-blue-800 border-blue-300' },
  lawyer: { title: 'مستشار قانوني', color: 'bg-amber-100 text-amber-800 border-amber-300' },
  treatment_center: { title: 'مركز علاج الإدمان', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  association: { title: 'جمعية مرافقة', color: 'bg-teal-100 text-teal-800 border-teal-300' },
  family: { title: 'ولي أمر / أسرة', color: 'bg-indigo-100 text-indigo-800 border-indigo-300' },
  patient: { title: 'مستفيد / متعافٍ', color: 'bg-green-100 text-green-800 border-green-300' },
  guest: { title: 'زائر', color: 'bg-slate-100 text-slate-700 border-slate-300' }
};

export const Navbar: React.FC<NavbarProps> = ({ onOpenAuth, onOpenAiTriage, currentView, onNavigate }) => {
  const { user, logout, switchRole } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [showRoleMenu, setShowRoleMenu] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const res = await api.getNotifications();
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unread_count || 0);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, [user]);

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setUnreadCount(0);
      setNotifications(notifications.map(n => ({ ...n, is_read: 1 })));
    } catch (err) {
      console.error(err);
    }
  };

  const handleSwitchRole = async (r: RoleSlug) => {
    setShowRoleMenu(false);
    await switchRole(r);
    onNavigate('portal');
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
      {/* Emergency Top Banner */}
      <div className="bg-[#1565C0] text-white px-4 py-1.5 text-xs sm:text-sm font-medium">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>الخط الوطني المباشر للإرشاد وعلاج الإدمان (سرية تامة ومجاني):</span>
            <a href="tel:1099" className="font-bold underline text-amber-300 hover:text-white flex items-center gap-1">
              <PhoneCall className="w-3.5 h-3.5 inline" /> 1099
            </a>
          </div>
          <div className="hidden md:flex items-center gap-4 text-xs text-blue-100">
            <span>الدرك الوطني: 1055</span>
            <span>الشرطة: 1548</span>
            <span>الحماية المدنية: 14</span>
          </div>
        </div>
      </div>

      {/* Main Nav */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Platform Name */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => onNavigate('landing')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#1565C0] to-[#2E7D32] flex items-center justify-center text-white shadow-sm">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <div className="font-extrabold text-lg text-slate-900 leading-tight">
                الفرصة الثانية <span className="text-xs font-semibold text-[#1565C0] font-sans">SCP</span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">منظومة التعافي، الدعم النفسي والحماية القانونية</p>
            </div>
          </div>

          {/* Center Links */}
          <nav className="hidden lg:flex items-center gap-1 text-sm font-medium text-slate-600">
            <button
              onClick={() => onNavigate('landing')}
              className={`px-3 py-2 rounded-lg transition-colors ${currentView === 'landing' ? 'text-[#1565C0] bg-blue-50 font-semibold' : 'hover:bg-slate-50'}`}
            >
              الرئيسية
            </button>
            {user && (
              <>
                <button
                  onClick={() => onNavigate('portal')}
                  className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 ${currentView === 'portal' ? 'text-[#1565C0] bg-blue-50 font-semibold' : 'hover:bg-slate-50'}`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  لوحة المتابعة
                </button>
                <button
                  onClick={() => onNavigate('appointments')}
                  className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 ${currentView === 'appointments' ? 'text-[#1565C0] bg-blue-50 font-semibold' : 'hover:bg-slate-50'}`}
                >
                  <Calendar className="w-4 h-4" />
                  المواعيد
                </button>
                <button
                  onClick={() => onNavigate('messages')}
                  className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 ${currentView === 'messages' ? 'text-[#1565C0] bg-blue-50 font-semibold' : 'hover:bg-slate-50'}`}
                >
                  <MessageSquare className="w-4 h-4" />
                  المحادثات الآمنة
                </button>
              </>
            )}
            <button
              onClick={onOpenAiTriage}
              className="px-3 py-2 rounded-lg text-emerald-700 bg-emerald-50 hover:bg-emerald-100 flex items-center gap-1.5 transition-colors font-medium"
            >
              <Sparkles className="w-4 h-4 text-emerald-600" />
              التوجيه الذكي
            </button>
            <button
              onClick={() => onNavigate('emergency')}
              className="px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 flex items-center gap-1 transition-colors"
            >
              دليل الطوارئ
            </button>
          </nav>

          {/* Right Action Items */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick Demo Role Switcher */}
            <div className="relative">
              <button
                onClick={() => setShowRoleMenu(!showRoleMenu)}
                title="مبدل الأدوار التجريبي السريع"
                className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 bg-slate-50 text-slate-700 transition-all cursor-pointer"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>دور التجربة:</span>
                <span className="font-bold text-[#1565C0]">{user ? ROLES_INFO[user.role_slug]?.title : 'زائر'}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {showRoleMenu && (
                <div className="absolute left-0 sm:right-auto mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-100 text-right">
                  <div className="px-3 py-1.5 border-b border-slate-100 text-xs font-bold text-slate-500">
                    تبديل الحساب التجريبي المعتمد (1-Click Switch):
                  </div>
                  {(Object.keys(ROLES_INFO) as RoleSlug[]).map((r) => (
                    <button
                      key={r}
                      onClick={() => handleSwitchRole(r)}
                      className={`w-full px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 transition-colors ${user?.role_slug === r ? 'bg-blue-50/70 font-bold text-[#1565C0]' : 'text-slate-700'}`}
                    >
                      <span className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${ROLES_INFO[r].color}`}>
                          {ROLES_INFO[r].title}
                        </span>
                      </span>
                      {user?.role_slug === r && <CheckCircle2 className="w-4 h-4 text-[#1565C0]" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Notifications Dropdown (If Logged In) */}
            {user && (
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 relative transition-colors cursor-pointer"
                  title="الإشعارات"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 bg-red-600 text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute left-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 text-right">
                    <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                      <span className="font-bold text-sm text-slate-900">الإشعارات ({unreadCount} غير مقروء)</span>
                      {unreadCount > 0 && (
                        <button onClick={handleMarkAllRead} className="text-xs text-[#1565C0] hover:underline">
                          تحديد الكل كمقروء
                        </button>
                      )}
                    </div>
                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                      {notifications.length === 0 ? (
                        <div className="p-4 text-center text-xs text-slate-400">لا توجد إشعارات حالياً</div>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            className={`p-3 text-xs transition-colors ${n.is_read ? 'bg-white opacity-75' : 'bg-blue-50/50 font-medium'}`}
                          >
                            <div className="font-semibold text-slate-900 mb-0.5">{n.title}</div>
                            <p className="text-slate-600 text-[11px] leading-relaxed">{n.message}</p>
                            <span className="text-[10px] text-slate-400 mt-1 block">
                              {new Date(n.created_at).toLocaleString('ar-DZ', { dateStyle: 'short', timeStyle: 'short' })}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Auth Buttons or User Profile */}
            {user ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onNavigate('portal')}
                  className="hidden sm:flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                >
                  <User className="w-3.5 h-3.5 text-[#1565C0]" />
                  <span>{user.first_name}</span>
                </button>
                <button
                  onClick={logout}
                  className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                  title="تسجيل الخروج"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onOpenAuth('login')}
                  className="text-xs sm:text-sm font-semibold text-slate-700 hover:text-[#1565C0] px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  تسجيل الدخول
                </button>
                <button
                  onClick={() => onOpenAuth('register')}
                  className="text-xs sm:text-sm font-semibold bg-[#1565C0] text-white hover:bg-blue-700 px-3.5 py-1.5 rounded-lg shadow-xs transition-colors"
                >
                  طلب مساعدة / تسجيل
                </button>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-2">
          <button
            onClick={() => { onNavigate('landing'); setMobileMenuOpen(false); }}
            className="w-full text-right py-2 text-sm font-medium text-slate-800"
          >
            الرئيسية
          </button>
          {user && (
            <>
              <button
                onClick={() => { onNavigate('portal'); setMobileMenuOpen(false); }}
                className="w-full text-right py-2 text-sm font-medium text-[#1565C0]"
              >
                بوابتي ({ROLES_INFO[user.role_slug]?.title})
              </button>
              <button
                onClick={() => { onNavigate('appointments'); setMobileMenuOpen(false); }}
                className="w-full text-right py-2 text-sm font-medium text-slate-800"
              >
                جدول المواعيد
              </button>
              <button
                onClick={() => { onNavigate('messages'); setMobileMenuOpen(false); }}
                className="w-full text-right py-2 text-sm font-medium text-slate-800"
              >
                المحادثات والمراسلات
              </button>
            </>
          )}
          <button
            onClick={() => { onOpenAiTriage(); setMobileMenuOpen(false); }}
            className="w-full text-right py-2 text-sm font-semibold text-emerald-700"
          >
            مساعد التوجيه الذكي
          </button>
          <button
            onClick={() => { onNavigate('emergency'); setMobileMenuOpen(false); }}
            className="w-full text-right py-2 text-sm font-medium text-red-600"
          >
            أرقام الطوارئ الساخنة
          </button>
        </div>
      )}
    </header>
  );
};
