import React, { useState } from 'react';
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
  Edit3,
  Lock,
  CheckCircle2,
  AlertCircle,
  X,
  Eye,
  EyeOff,
  Save,
  MapPin,
  Loader2,
  Check
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { wilayas } from '../data/wilayas';

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

type ActiveModalType = 'personal' | 'password' | 'email' | 'phone' | 'privacy' | null;

export const ProfileView: React.FC<ProfileViewProps> = ({ onBack, onNavigateTo, onOpenAuth }) => {
  const { user, logout, updateUser, refreshMe } = useAuth();

  const [activeModal, setActiveModal] = useState<ActiveModalType>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form states for Personal Info
  const [firstName, setFirstName] = useState(user?.first_name || '');
  const [lastName, setLastName] = useState(user?.last_name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [wilayaId, setWilayaId] = useState<number | string>(user?.wilaya_id || 16);

  // Form states for Password Change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const roleName = user ? (ROLE_NAMES[user.role_slug] || 'مستخدم معتمد') : 'زائر المنصة';

  const openModal = (type: ActiveModalType) => {
    if (!user && type !== 'privacy') {
      onOpenAuth('login');
      return;
    }
    setErrorMessage(null);
    setSuccessMessage(null);
    if (user) {
      setFirstName(user.first_name || '');
      setLastName(user.last_name || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
      setWilayaId(user.wilaya_id || 16);
    }
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setActiveModal(type);
  };

  const closeModal = () => {
    setActiveModal(null);
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  // Handle Personal Info / Email / Phone Update
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!firstName.trim() || !lastName.trim()) {
      setErrorMessage('الاسم الأول واللقب مطلوبان');
      return;
    }

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErrorMessage('يرجى إدخال عنوان بريد إلكتروني صالح');
      return;
    }

    if (!phone.trim() || phone.trim().length < 8) {
      setErrorMessage('يرجى إدخال رقم هاتف صالح (مثال: 0555123456)');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.updateProfile({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        wilaya_id: Number(wilayaId)
      });

      if (res.data?.user) {
        updateUser(res.data.user);
      } else {
        updateUser({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          wilaya_id: Number(wilayaId)
        });
      }

      await refreshMe();
      setSuccessMessage('تم تحديث البيانات الشخصية بنجاح!');
      setTimeout(() => {
        closeModal();
      }, 1400);
    } catch (err: any) {
      setErrorMessage(err.message || 'تعذر تحديث البيانات، يرجى المحاولة مرة أخرى');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Password Update
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!currentPassword) {
      setErrorMessage('يرجى إدخال كلمة المرور الحالية');
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setErrorMessage('كلمة المرور الجديدة يجب ألا تقل عن 6 أحرف أو أرقام');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('كلمة المرور الجديدة غير متطابقة مع تأكيد كلمة المرور');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.changePassword({
        current_password: currentPassword,
        new_password: newPassword
      });

      setSuccessMessage('تم تغيير وتأمين كلمة المرور بنجاح!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        closeModal();
      }, 1500);
    } catch (err: any) {
      setErrorMessage(err.message || 'فشل تغيير كلمة المرور، تأكد من صحة كلمة المرور الحالية');
    } finally {
      setIsSubmitting(false);
    }
  };

  const menuItems = [
    { 
      id: 'personal', 
      title: 'البيانات الشخصية', 
      icon: User, 
      desc: 'تعديل الاسم والولاية والبيانات العامة',
      action: () => openModal('personal')
    },
    { 
      id: 'email', 
      title: 'تغيير البريد الإلكتروني', 
      icon: Mail, 
      desc: user?.email ? `الحالي: ${user.email}` : 'تحديث عنوان البريد المعتمد',
      action: () => openModal('email')
    },
    { 
      id: 'phone', 
      title: 'تغيير رقم الهاتف', 
      icon: Phone, 
      desc: user?.phone ? `الحالي: ${user.phone}` : 'لتلقي الإشعارات وتأكيدات المواعيد',
      action: () => openModal('phone')
    },
    { 
      id: 'password', 
      title: 'تغيير كلمة المرور', 
      icon: KeyRound, 
      desc: 'حماية وتأمين الحساب برمز مرور قوي',
      action: () => openModal('password')
    },
    { 
      id: 'privacy', 
      title: 'الخصوصية والأمان', 
      icon: ShieldCheck, 
      desc: 'إعدادات تشفير البيانات وسرية الهوية',
      action: () => openModal('privacy')
    },
    { 
      id: 'about', 
      title: 'عن منصة الفرصة الثانية', 
      icon: Info, 
      desc: 'الرؤية والرسالة والجهات الراعية',
      action: () => onNavigateTo('about')
    },
  ];

  const currentWilayaName = wilayas.find(w => Number(w.code) === Number(user?.wilaya_id))?.name_ar || 'الجزائر العاصمة';

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6 pb-24" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-slate-600 hover:text-slate-900 text-xs font-bold transition-colors cursor-pointer"
        >
          <ArrowRight className="w-4 h-4" />
          <span>رجوع</span>
        </button>
        <h1 className="text-base font-black text-slate-900">الملف الشخصي والحساب</h1>
        <div className="w-8" />
      </div>

      {/* Global Success Notification */}
      {successMessage && !activeModal && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* User Info Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs text-center space-y-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-blue-600 via-emerald-500 to-blue-600" />
        
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
          <div className="flex items-center justify-center gap-2 mt-1">
            <span className="inline-block px-3 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-[#1565C0] border border-blue-100">
              {roleName}
            </span>
            {user?.wilaya_id && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600">
                <MapPin className="w-3 h-3 text-slate-400" />
                <span>{currentWilayaName}</span>
              </span>
            )}
          </div>
        </div>

        {/* Contact details */}
        <div className="pt-2 text-xs text-slate-600 flex flex-col sm:flex-row items-center justify-center gap-3 font-mono">
          <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
            <Mail className="w-3.5 h-3.5 text-blue-600" />
            <span dir="ltr">{user?.email || 'ahmed.mohamed@example.dz'}</span>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
            <Phone className="w-3.5 h-3.5 text-emerald-600" />
            <span dir="ltr">{user?.phone || '+213 555 12 34 56'}</span>
          </div>
        </div>

        {/* Quick Edit Action Buttons */}
        {user && (
          <div className="pt-2 grid grid-cols-2 gap-2 max-w-sm mx-auto">
            <button
              onClick={() => openModal('personal')}
              className="py-2.5 px-3 bg-blue-50 hover:bg-blue-100 text-[#1565C0] rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-blue-100"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>تعديل البيانات</span>
            </button>
            <button
              onClick={() => openModal('password')}
              className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-slate-200"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>كلمة المرور</span>
            </button>
          </div>
        )}
      </div>

      {/* Settings Menu List */}
      <div className="bg-white rounded-3xl border border-slate-200/90 divide-y divide-slate-100 overflow-hidden shadow-xs">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={item.action}
              className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors text-right cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-100 group-hover:bg-blue-50 text-slate-600 group-hover:text-[#1565C0] flex items-center justify-center transition-colors shrink-0">
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs sm:text-sm font-bold text-slate-900 block">{item.title}</span>
                  <span className="text-[11px] text-slate-400">{item.desc}</span>
                </div>
              </div>
              <ChevronLeft className="w-4 h-4 text-slate-400 group-hover:text-[#1565C0] transition-colors shrink-0" />
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
          <span>تسجيل الدخول إلى الحساب</span>
        </button>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: Edit Personal Information (الاسم، البريد، الهاتف، الولاية) */}
      {/* ========================================================================= */}
      {(activeModal === 'personal' || activeModal === 'email' || activeModal === 'phone') && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto" dir="rtl">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl max-w-lg w-full p-6 space-y-5 animate-in zoom-in-95">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#1565C0] flex items-center justify-center">
                  {activeModal === 'email' ? <Mail className="w-4 h-4" /> : activeModal === 'phone' ? <Phone className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-slate-900">
                    {activeModal === 'email' ? 'تعديل البريد الإلكتروني' : activeModal === 'phone' ? 'تعديل رقم الهاتف' : 'تعديل المعلومات الشخصية'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {activeModal === 'email' ? 'تحديث البريد المعتمد لتلقي الإشعارات واسترجاع الحساب' : activeModal === 'phone' ? 'تحديث رقم الهاتف للتواصل والمواعيد المؤكدة' : 'تحديث بيانات الاتصال والاسم المعتمد في المنصة'}
                  </p>
                </div>
              </div>
              <button 
                onClick={closeModal}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Error & Success alerts */}
            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}
            {successMessage && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              {/* If in full personal mode, show name and wilaya fields */}
              {activeModal === 'personal' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      الاسم الأول <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        required
                        placeholder="مثال: أحمد"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none transition-colors"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      اللقب (اسم العائلة) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        required
                        placeholder="مثال: محمد"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none transition-colors"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Email field */}
              {(activeModal === 'personal' || activeModal === 'email') && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    البريد الإلكتروني <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      dir="ltr"
                      placeholder="name@example.dz"
                      className="w-full pl-3.5 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none transition-colors text-right"
                    />
                    <Mail className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">يستخدم لتسجيل الدخول، استعادة كلمة المرور وتلقي التقارير</p>
                </div>
              )}

              {/* Phone field */}
              {(activeModal === 'personal' || activeModal === 'phone') && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    رقم الهاتف <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                      dir="ltr"
                      placeholder="0555 12 34 56"
                      className="w-full pl-3.5 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none transition-colors text-right"
                    />
                    <Phone className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">رقم هاتف جزائري (موبيليس، جيزي، أوريدو أو هاتف ثابت)</p>
                </div>
              )}

              {/* Wilaya Selection (in personal mode) */}
              {activeModal === 'personal' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    الولاية (مقر الإقامة / النشاط)
                  </label>
                  <div className="relative">
                    <select
                      value={wilayaId}
                      onChange={(e) => setWilayaId(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none transition-colors cursor-pointer"
                    >
                      {wilayas.map((w) => (
                        <option key={w.code} value={Number(w.code)}>
                          {w.code} - {w.name_ar} ({w.name_fr})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={isSubmitting}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-[#1565C0] hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>جارٍ الحفظ...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>حفظ التعديلات</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: Change Password (تغيير كلمة المرور) */}
      {/* ========================================================================= */}
      {activeModal === 'password' && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto" dir="rtl">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-5 animate-in zoom-in-95">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-slate-900">تغيير كلمة المرور</h3>
                  <p className="text-[11px] text-slate-400">احرص على استخدام كلمة مرور قوية وغير مكررة</p>
                </div>
              </div>
              <button 
                onClick={closeModal}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Error & Success alerts */}
            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}
            {successMessage && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleChangePassword} className="space-y-4">
              {/* Current Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  كلمة المرور الحالية <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPass ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    placeholder="أدخل كلمة المرور الحالية"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                    className="absolute left-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  كلمة المرور الجديدة <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                    placeholder="6 أحرف أو أرقام على الأقل"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute left-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  تأكيد كلمة المرور الجديدة <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPass ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                    placeholder="أعد إدخال كلمة المرور الجديدة"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                    className="absolute left-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={isSubmitting}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>جارٍ التحديث...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-3.5 h-3.5" />
                      <span>تحديث كلمة المرور</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: Privacy & Security (الخصوصية والأمان) */}
      {/* ========================================================================= */}
      {activeModal === 'privacy' && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto" dir="rtl">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-5 animate-in zoom-in-95">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-slate-900">الخصوصية وحماية البيانات</h3>
                  <p className="text-[11px] text-slate-400">ميثاق الأمان والسر المهني في المنصة</p>
                </div>
              </div>
              <button 
                onClick={closeModal}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>تشفير كامل لكافة البيانات (E2EE)</span>
                </div>
                <p className="text-slate-500 text-[11px]">
                  كافة المحادثات والاستشارات والمواعيد مشفرة ومحمية بقواعد بيانات معزولة ومحمية بصلاحيات صارمة.
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>السر المهني الطبي والقانوني</span>
                </div>
                <p className="text-slate-500 text-[11px]">
                  يلتزم كافة الأطباء والمحامين والأخصائيين المعتمدين بالسر المهني التام المكفول بموجب القانون الجزائري (المادة 301).
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>الحق في التعديل والحذف</span>
                </div>
                <p className="text-slate-500 text-[11px]">
                  يمكنك في أي وقت تحديث بياناتك الشخصية، تعديل بريدك أو رقمك أو طلب مسح سجل النشاط من خلال فريق الدعم.
                </p>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={closeModal}
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                فهمت ذلك، إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
