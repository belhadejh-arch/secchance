import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { RoleSlug, NotificationItem } from '../types';
import { api } from '../services/api';
import { PlatformLogo } from './PlatformLogo';
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
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
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

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      {/* Main Nav */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Platform Name */}
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => onNavigate('landing')}>
            <PlatformLogo size={38} />
            <div>
              <div className="font-black text-lg text-slate-900 leading-tight flex items-center gap-2">
                <span>الفرصة الثانية</span>
                <span className="text-[11px] font-extrabold text-[#1565C0] bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full font-sans">
                  SCP
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium hidden sm:block">منظومة التعافي، الدعم النفسي والحماية القانونية</p>
            </div>
          </div>

          {/* Center Links (Desktop) */}
          <nav className="hidden lg:flex items-center gap-1 text-sm font-medium text-slate-600">
            <button
              onClick={() => onNavigate('landing')}
              className={`px-3 py-2 rounded-xl transition-all cursor-pointer ${currentView === 'landing' ? 'text-[#1565C0] bg-blue-50 font-bold' : 'hover:bg-slate-100/60'}`}
            >
              الرئيسية
            </button>
            <button
              onClick={() => onNavigate('services')}
              className={`px-3 py-2 rounded-xl transition-all cursor-pointer ${currentView === 'services' ? 'text-[#1565C0] bg-blue-50 font-bold' : 'hover:bg-slate-100/60'}`}
            >
              الخدمات والتوعية
            </button>
            {user && (
              <>
                <button
                  onClick={() => onNavigate('portal')}
                  className={`px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${currentView === 'portal' ? 'text-[#1565C0] bg-blue-50 font-bold' : 'hover:bg-slate-100/60'}`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  {user.role_slug === 'admin' ? 'لوحة تحكم الأدمن' : 'لوحة المتابعة'}
                </button>
                <button
                  onClick={() => onNavigate('appointments')}
                  className={`px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${currentView === 'appointments' ? 'text-[#1565C0] bg-blue-50 font-bold' : 'hover:bg-slate-100/60'}`}
                >
                  <Calendar className="w-4 h-4" />
                  المواعيد
                </button>
                <button
                  onClick={() => onNavigate('messages')}
                  className={`px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${currentView === 'messages' ? 'text-[#1565C0] bg-blue-50 font-bold' : 'hover:bg-slate-100/60'}`}
                >
                  <MessageSquare className="w-4 h-4" />
                  المحادثات الآمنة
                </button>
              </>
            )}
            <button
              onClick={() => onNavigate('about')}
              className={`px-3 py-2 rounded-xl transition-all cursor-pointer ${currentView === 'about' ? 'text-[#1565C0] bg-blue-50 font-bold' : 'hover:bg-slate-100/60'}`}
            >
              عن المنصة
            </button>
            <button
              onClick={onOpenAiTriage}
              className="px-3 py-2 rounded-xl text-emerald-700 bg-emerald-50 hover:bg-emerald-100/80 flex items-center gap-1.5 transition-all font-semibold cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-emerald-600" />
              التوجيه الذكي
            </button>
            <button
              onClick={() => onNavigate('emergency')}
              className="px-3 py-2 rounded-xl text-red-600 hover:bg-red-50 flex items-center gap-1.5 transition-all font-semibold cursor-pointer"
            >
              دليل الطوارئ
            </button>
          </nav>

          {/* Right Action Items */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Notifications Dropdown (If Logged In) */}
            {user && (
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2.5 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 relative transition-colors cursor-pointer"
                  title="الإشعارات"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 bg-red-600 text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center ring-2 ring-white">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute left-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 py-3 z-50 text-right">
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
                        <div className="p-6 text-center text-xs text-slate-400">لا توجد إشعارات جديدة حالياً</div>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            className={`p-3.5 text-xs transition-colors ${n.is_read ? 'bg-white opacity-75' : 'bg-blue-50/50 font-medium'}`}
                          >
                            <div className="font-semibold text-slate-900 mb-0.5">{n.title}</div>
                            <p className="text-slate-600 text-[11px] leading-relaxed">{n.message}</p>
                            <span className="text-[10px] text-slate-400 mt-1 block font-sans">
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

            {/* User Profile */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => onNavigate('profile')}
                  className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 text-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 transition-all cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                    {user.first_name?.[0] || 'م'}
                  </div>
                  <div className="text-right hidden sm:block">
                    <div className="text-xs font-bold text-slate-900">{user.first_name} {user.last_name}</div>
                    <div className="text-[10px] text-slate-500 font-semibold">{ROLES_INFO[user.role_slug]?.title}</div>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onOpenAuth('login')}
                  className="text-xs sm:text-sm font-bold text-slate-700 hover:text-[#1565C0] px-4 py-2 rounded-xl hover:bg-slate-100 transition-colors"
                >
                  تسجيل الدخول
                </button>
                <button
                  onClick={() => onOpenAuth('register')}
                  className="text-xs sm:text-sm font-bold bg-[#1565C0] text-white hover:bg-blue-700 px-4 py-2 rounded-xl shadow-xs transition-colors"
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
          <button
            onClick={() => { onNavigate('services'); setMobileMenuOpen(false); }}
            className="w-full text-right py-2 text-sm font-medium text-slate-800"
          >
            الخدمات والتوعية ومراكز العلاج
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
            onClick={() => { onNavigate('about'); setMobileMenuOpen(false); }}
            className="w-full text-right py-2 text-sm font-medium text-slate-800"
          >
            عن المنصة وميثاق السرية
          </button>
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
