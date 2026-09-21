import React from 'react';
import { 
  ArrowRight, 
  User, 
  KeyRound, 
  Mail, 
  Phone, 
  ShieldCheck, 
  Info, 
  LogOut, 
  ChevronLeft, 
  BadgeCheck,
  Bell,
  HelpCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ROLE_NAMES: Record<string, string> = {
  admin: 'مدير النظام (Admin)',
  psychologist: 'أخصائي نفسي وعيادي',
  lawyer: 'مستشار ومحامٍ قانوني',
  treatment_center: 'مركز استشفائي وعلاج الإدمان',
  association: 'جمعية مرافقة وتأهيل',
  family: 'ولي أمر / أسرة مستفيدة',
  patient: 'مستفيد مباشر'
};

interface ProfileViewProps {
  onBack: () => void;
  onNavigateTo: (view: string) => void;
  onOpenAuth: (tab: 'login' | 'register') => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ onBack, onNavigateTo, onOpenAuth }) => {
  const { user, logout } = useAuth();

  const roleName = user ? (ROLE_NAMES[user.role_slug] || 'مستخدم معتمد') : 'زائر المنصة';

  const menuItems = [
    { id: 'personal', title: 'البيانات الشخصية', icon: User, desc: 'تعديل الاسم والولاية وبيانات الاتصال' },
    { id: 'password', title: 'تغيير كلمة المرور', icon: KeyRound, desc: 'حماية وتأمين الحساب' },
    { id: 'email', title: 'تغيير البريد الإلكتروني', icon: Mail, desc: 'تحديث عنوان البريد المعتمد' },
    { id: 'phone', title: 'تغيير رقم الهاتف', icon: Phone, desc: 'لتلقي الإشعارات وتأكيدات المواعيد' },
    { id: 'privacy', title: 'الخصوصية والأمان', icon: ShieldCheck, desc: 'إعدادات تشفير البيانات وسجل النشاط' },
    { id: 'about', title: 'عن منصة الفرصة الثانية', icon: Info, desc: 'الرؤية والرسالة والجهات الراعية' },
  ];

  return (
    <div className="max-w-xl mx-auto px-4 py-4 space-y-5 pb-24" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-slate-600 hover:text-slate-900 text-xs font-bold"
        >
          <ArrowRight className="w-4 h-4" />
          <span>رجوع</span>
        </button>
        <h1 className="text-base font-black text-slate-900">الملف الشخصي</h1>
        <div className="w-8" />
      </div>

      {/* User Info Card (Matching Screen 10) */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs text-center space-y-3">
        <div className="relative inline-block">
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-[#1565C0] to-[#00897B] text-white flex items-center justify-center font-black text-2xl shadow-md mx-auto ring-4 ring-blue-50">
            {user ? `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}` : 'أ.م'}
          </div>
          <span className="absolute bottom-0 right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-white" title="نشط الآن">
            <BadgeCheck className="w-3.5 h-3.5" />
          </span>
        </div>

        <div>
          <h2 className="text-lg font-black text-slate-900">
            {user ? `${user.first_name} ${user.last_name}` : 'أحمد محمد'}
          </h2>
          <span className="inline-block mt-1 px-3 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-[#1565C0] border border-blue-100">
            {roleName}
          </span>
        </div>

        <div className="pt-2 text-xs text-slate-500 space-y-1 font-mono" dir="ltr">
          <p>{user?.email || 'ahmed.mohamed@example.dz'}</p>
          <p>{user?.phone || '+213 555 12 34 56'}</p>
        </div>
      </div>

      {/* Settings Menu List (Matching Screen 10) */}
      <div className="bg-white rounded-3xl border border-slate-200/80 divide-y divide-slate-100 overflow-hidden shadow-xs">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => {
                if (item.id === 'about') onNavigateTo('about');
              }}
              className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors text-right cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-100 group-hover:bg-blue-50 text-slate-600 group-hover:text-[#1565C0] flex items-center justify-center transition-colors">
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs sm:text-sm font-bold text-slate-900 block">{item.title}</span>
                  <span className="text-[11px] text-slate-400">{item.desc}</span>
                </div>
              </div>
              <ChevronLeft className="w-4 h-4 text-slate-400 group-hover:text-[#1565C0] transition-colors" />
            </button>
          );
        })}
      </div>

      {/* Logout / Login Action */}
      {user ? (
        <button
          onClick={() => logout()}
          className="w-full py-3 bg-red-50 hover:bg-red-100 text-red-700 font-bold rounded-2xl text-xs sm:text-sm transition-colors flex items-center justify-center gap-2 border border-red-200 cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>تسجيل الخروج من الحساب</span>
        </button>
      ) : (
        <button
          onClick={() => onOpenAuth('login')}
          className="w-full py-3 bg-[#1565C0] hover:bg-blue-700 text-white font-bold rounded-2xl text-xs sm:text-sm transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
        >
          <span>تسجيل الدخول / تبديل الحساب</span>
        </button>
      )}
    </div>
  );
};
