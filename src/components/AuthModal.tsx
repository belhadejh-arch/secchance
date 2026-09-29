import React, { useState } from 'react';
import {
  X,
  Eye,
  EyeOff,
  Lock,
  Mail,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Shield,
  ArrowRight,
  UserPlus,
  LogIn,
  Crown,
  Brain,
  Scale,
  Stethoscope,
  Building2,
  Hotel,
  Users,
} from 'lucide-react';
import { User } from '../types';
import {
  authenticateUser,
  createUserInDb,
  requestPasswordReset,
  verifyAndResetPassword,
  DEFAULT_ADMIN_EMAIL,
  DEFAULT_ADMIN_PASSWORD,
  OWNER_ADMIN_EMAIL,
} from '../services/dbService';
import { RegistrationFlow } from './RegistrationFlow';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (user: User) => void;
  onRegisterUser?: (user: User) => void;
  initialMode?: 'login' | 'register';
  availableUsers?: User[];
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLogin,
  onRegisterUser,
  initialMode = 'login',
}) => {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot' | 'reset-code'>(initialMode);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Forgot password state
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [generatedCodeHint, setGeneratedCodeHint] = useState<string | null>(null);

  // Feedback states
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const resetMessages = () => {
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  // 1. Handle Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();

    if (!loginEmail.trim() || !loginPassword.trim()) {
      setErrorMsg('يرجى ملء جميع حقول تسجيل الدخول.');
      return;
    }

    setLoading(true);
    try {
      const result = await authenticateUser(loginEmail, loginPassword);
      if ('error' in result) {
        setErrorMsg(result.error);
      } else {
        if (rememberMe) {
          localStorage.setItem('secchance_user_id', String(result.user.id));
        }
        onLogin(result.user);
        onClose();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'فشل الاتصال بقاعدة البيانات.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Direct Quick Login Role Selector
  const handleQuickRoleLogin = async (email: string, password = 'password123') => {
    resetMessages();
    setLoginEmail(email);
    setLoginPassword(password);
    setLoading(true);
    try {
      const result = await authenticateUser(email, password);
      if ('error' in result) {
        setErrorMsg(result.error);
      } else {
        if (rememberMe) {
          localStorage.setItem('secchance_user_id', String(result.user.id));
        }
        onLogin(result.user);
        onClose();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'حدث خطأ أثناء الدخول السريع.');
    } finally {
      setLoading(false);
    }
  };

  // 3. Handle Registration Success from RegistrationFlow
  const handleRegistrationFlowSuccess = async (newUser: User, isDirectActive: boolean) => {
    resetMessages();
    setLoading(true);
    try {
      const savedUser = await createUserInDb({
        ...newUser,
        password: loginPassword || 'password123',
      });

      if (onRegisterUser) {
        onRegisterUser(savedUser);
      }

      if (isDirectActive) {
        setSuccessMsg('تم إنشاء حسابك بنجاح! جاري تسجيل الدخول...');
        setTimeout(() => {
          onLogin(savedUser);
          onClose();
        }, 800);
      } else {
        setSuccessMsg('تم إرسال ملف التسجيل بنجاح، وهو قيد مراجعة واعتماد الإدارة.');
      }
    } catch (err: any) {
      setErrorMsg('تعذر حفظ الحساب. يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  // 4. Handle Password Reset Request
  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();

    if (!forgotEmail.trim()) {
      setErrorMsg('يرجى إدخال البريد الإلكتروني المسجل.');
      return;
    }

    setLoading(true);
    try {
      const res = await requestPasswordReset(forgotEmail);
      if (res.success) {
        setSuccessMsg(res.message);
        if (res.resetCode) {
          setGeneratedCodeHint(res.resetCode);
        }
        setMode('reset-code');
      } else {
        setErrorMsg(res.message);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'حدث خطأ أثناء معالجة الطلب.');
    } finally {
      setLoading(false);
    }
  };

  // 5. Handle Reset Password Confirmation
  const handleResetCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();

    if (!resetCode.trim() || !newPassword.trim()) {
      setErrorMsg('يرجى ملء جميع الحقول.');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMsg('يجب أن تتكون كلمة المرور من 6 أحرف على الأقل.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setErrorMsg('كلمتا المرور غير متطابقتين.');
      return;
    }

    setLoading(true);
    try {
      const res = await verifyAndResetPassword(forgotEmail, resetCode, newPassword);
      if (res.success) {
        setSuccessMsg(res.message);
        setTimeout(() => {
          resetMessages();
          setLoginEmail(forgotEmail);
          setLoginPassword(newPassword);
          setMode('login');
        }, 1200);
      } else {
        setErrorMsg(res.message);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'فشلت عملية تعيين كلمة المرور.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3 sm:p-4 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-[24px] max-w-xl w-full shadow-2xl overflow-hidden border border-[#E0E8E6] my-6 animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-l from-[#1766A6]/10 to-transparent p-5 border-b border-[#E0E8E6] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="Logo"
              className="w-11 h-11 object-contain rounded-full border border-[#CCD8D5] bg-white p-0.5 shadow-xs shrink-0"
            />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-[17px] sm:text-[19px] font-black text-[#203945]">
                  الفرصة الثانية
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EAF3F8] text-[#1766A6]">
                  {mode === 'login' && 'تسجيل الدخول'}
                  {mode === 'register' && 'إنشاء حساب جديد'}
                  {mode === 'forgot' && 'استعادة المرور'}
                  {mode === 'reset-code' && 'تعيين كلمة المرور'}
                </span>
              </div>
              <p className="text-[11px] text-[#1766A6] font-semibold mt-0.5">
                منصة رقمية موحدة للمرافقة القانونية والاجتماعية والعلاجية واعادة الادماج
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#203945]/60 hover:text-[#203945] p-1.5 rounded-full hover:bg-slate-200/50 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switcher Tabs */}
        {(mode === 'login' || mode === 'register') && (
          <div className="flex border-b border-[#E0E8E6] bg-[#F8FAF9] shrink-0">
            <button
              onClick={() => {
                resetMessages();
                setMode('login');
              }}
              className={`flex-1 py-3 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-colors cursor-pointer ${
                mode === 'login'
                  ? 'border-[#1766A6] text-[#1766A6] bg-white'
                  : 'border-transparent text-[#203945]/60 hover:text-[#203945]'
              }`}
            >
              <LogIn className="w-4 h-4" />
              <span>تسجيل الدخول</span>
            </button>
            <button
              onClick={() => {
                resetMessages();
                setMode('register');
              }}
              className={`flex-1 py-3 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-colors cursor-pointer ${
                mode === 'register'
                  ? 'border-[#1766A6] text-[#1766A6] bg-white'
                  : 'border-transparent text-[#203945]/60 hover:text-[#203945]'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>إنشاء حساب جديد (المسجل كـ؟)</span>
            </button>
          </div>
        )}

        {/* Scrollable Container */}
        <div className="overflow-y-auto flex-1">
          {/* Alerts */}
          {errorMsg && (
            <div className="mx-6 mt-4 p-3 bg-[#FBECEB] border border-[#F5D4D2] text-[#5F1D1A] rounded-[12px] text-xs flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-[#A64842]" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mx-6 mt-4 p-3 bg-[#E8F4EF] border border-[#C5E4D8] text-[#1A5E4D] rounded-[12px] text-xs flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-[#25866D]" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* 1. LOGIN FORM */}
          {mode === 'login' && (
            <div className="p-6 space-y-5">
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#203945]">
                    البريد الإلكتروني / اسم المستخدم
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="adramatv@gmail.com أو admin@secchance.dz"
                      className="w-full h-11 pr-10 pl-3 text-xs sm:text-sm bg-white border border-[#CCD8D5] rounded-[12px] outline-hidden focus:border-[#1766A6] shadow-xs text-[#203945]"
                    />
                    <Mail className="w-4 h-4 text-[#203945]/40 absolute right-3.5 top-3.5" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-[#203945]">كلمة المرور</label>
                    <button
                      type="button"
                      onClick={() => {
                        resetMessages();
                        setForgotEmail(loginEmail);
                        setMode('forgot');
                      }}
                      className="text-[11px] font-bold text-[#1766A6] hover:underline cursor-pointer"
                    >
                      نسيت كلمة المرور؟
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full h-11 pr-10 pl-10 text-xs sm:text-sm bg-white border border-[#CCD8D5] rounded-[12px] outline-hidden focus:border-[#1766A6] shadow-xs text-[#203945]"
                    />
                    <Lock className="w-4 h-4 text-[#203945]/40 absolute right-3.5 top-3.5" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-3.5 top-3.5 text-[#203945]/50 hover:text-[#203945] cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-[#203945]">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded-sm text-[#1766A6] focus:ring-[#1766A6]"
                    />
                    <span>تذكرني على هذا الجهاز</span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 rounded-[12px] bg-[#1766A6] hover:bg-[#125386] text-white font-bold text-xs sm:text-sm shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  <LogIn className="w-4 h-4" />
                  <span>{loading ? 'جاري التحقق...' : 'تسجيل الدخول'}</span>
                </button>
              </form>

              {/* Direct Quick Demo Role Selector */}
              <div className="pt-3 border-t border-[#E0E8E6] space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#203945]/70">
                    ⚡ الدخول السريع المعتمد (اختر حساباً للتجربة المباشرة):
                  </span>
                </div>

                {/* Primary Admin Button */}
                <button
                  type="button"
                  onClick={() => handleQuickRoleLogin(OWNER_ADMIN_EMAIL, DEFAULT_ADMIN_PASSWORD)}
                  className="w-full p-2.5 rounded-[12px] bg-[#FDF7E7] border-2 border-[#D4A373] text-[#78350F] hover:bg-[#FBEED1] transition-all flex items-center justify-between text-xs font-bold shadow-2xs cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Crown className="w-4 h-4 text-[#D97706]" />
                    <span>👑 حساب الأدمن العام ({OWNER_ADMIN_EMAIL})</span>
                  </div>
                  <span className="text-[10px] bg-white/80 px-2 py-0.5 rounded-md border border-[#D4A373]/30">
                    دخول فوري كمدير للنظام ←
                  </span>
                </button>

                {/* Other Specialist Roles Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => handleQuickRoleLogin('admin@secchance.dz', DEFAULT_ADMIN_PASSWORD)}
                    className="p-2 rounded-[10px] bg-[#F0F7F4] hover:bg-[#E2F0EB] text-[#1A5E4D] border border-[#CCD8D5] flex items-center gap-1.5 font-bold transition-colors cursor-pointer"
                  >
                    <Crown className="w-3.5 h-3.5" />
                    <span>أدمن النظام</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickRoleLogin('psy@secchance.dz', 'password123')}
                    className="p-2 rounded-[10px] bg-white hover:bg-[#EAF3F8] text-[#1766A6] border border-[#CCD8D5] flex items-center gap-1.5 font-bold transition-colors cursor-pointer"
                  >
                    <Brain className="w-3.5 h-3.5" />
                    <span>أخصائي نفسي</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickRoleLogin('lawyer@secchance.dz', 'password123')}
                    className="p-2 rounded-[10px] bg-white hover:bg-[#EAF3F8] text-[#1766A6] border border-[#CCD8D5] flex items-center gap-1.5 font-bold transition-colors cursor-pointer"
                  >
                    <Scale className="w-3.5 h-3.5" />
                    <span>محامٍ معتمد</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickRoleLogin('doctor@secchance.dz', 'password123')}
                    className="p-2 rounded-[10px] bg-white hover:bg-[#EAF3F8] text-[#1766A6] border border-[#CCD8D5] flex items-center gap-1.5 font-bold transition-colors cursor-pointer"
                  >
                    <Stethoscope className="w-3.5 h-3.5" />
                    <span>طبيب سموم</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickRoleLogin('clinic@secchance.dz', 'password123')}
                    className="p-2 rounded-[10px] bg-white hover:bg-[#EAF3F8] text-[#1766A6] border border-[#CCD8D5] flex items-center gap-1.5 font-bold transition-colors cursor-pointer"
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    <span>عيادة خاصة</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickRoleLogin('hospital@secchance.dz', 'password123')}
                    className="p-2 rounded-[10px] bg-white hover:bg-[#EAF3F8] text-[#1766A6] border border-[#CCD8D5] flex items-center gap-1.5 font-bold transition-colors cursor-pointer"
                  >
                    <Hotel className="w-3.5 h-3.5" />
                    <span>مستشفى خاص</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickRoleLogin('assoc@secchance.dz', 'password123')}
                    className="p-2 rounded-[10px] bg-white hover:bg-[#EAF3F8] text-[#1766A6] border border-[#CCD8D5] flex items-center gap-1.5 font-bold transition-colors cursor-pointer"
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>جمعية ناشطة</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickRoleLogin('family@secchance.dz', 'password123')}
                    className="p-2 rounded-[10px] bg-white hover:bg-[#EAF3F8] text-[#1766A6] border border-[#CCD8D5] flex items-center gap-1.5 font-bold transition-colors cursor-pointer col-span-2 sm:col-span-2"
                  >
                    <span>👤 مستفيد / أسرة (محمد بن خالد)</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 2. REGISTRATION FLOW (All 7 Roles) */}
          {mode === 'register' && (
            <div className="p-4 sm:p-6">
              <RegistrationFlow
                onSuccess={handleRegistrationFlowSuccess}
                onCancel={() => setMode('login')}
              />
            </div>
          )}

          {/* 3. FORGOT PASSWORD */}
          {mode === 'forgot' && (
            <form onSubmit={handleForgotSubmit} className="p-6 space-y-4">
              <div className="bg-[#EAF3F8] p-3.5 rounded-[14px] border border-[#DCEBF4] flex items-start gap-2.5">
                <Shield className="w-5 h-5 text-[#1766A6] shrink-0 mt-0.5" />
                <p className="text-xs text-[#104A78] leading-relaxed">
                  أدخل بريدك الإلكتروني المسجل وسنقوم بإصدار رمز تحقق آمن ومؤقت لإعادة تعيين كلمة المرور فوراً.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#203945]">البريد الإلكتروني</label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full h-11 pr-10 pl-3 text-xs sm:text-sm bg-white border border-[#CCD8D5] rounded-[12px] outline-hidden focus:border-[#1766A6] shadow-xs text-[#203945]"
                  />
                  <Mail className="w-4 h-4 text-[#203945]/40 absolute right-3.5 top-3.5" />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 rounded-[12px] bg-[#1766A6] hover:bg-[#125386] text-white font-bold text-xs sm:text-sm shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <KeyRound className="w-4 h-4" />
                <span>{loading ? 'جاري المعالجة...' : 'إرسال رمز التحقق'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  resetMessages();
                  setMode('login');
                }}
                className="w-full text-xs font-bold text-[#203945]/70 hover:text-[#203945] flex items-center justify-center gap-1.5 pt-2 cursor-pointer"
              >
                <ArrowRight className="w-3.5 h-3.5" />
                <span>العودة لتسجيل الدخول</span>
              </button>
            </form>
          )}

          {/* 4. RESET PASSWORD WITH CODE */}
          {mode === 'reset-code' && (
            <form onSubmit={handleResetCodeSubmit} className="p-6 space-y-4">
              {generatedCodeHint && (
                <div className="p-3 bg-[#EAF3F8] border border-[#DCEBF4] rounded-[12px] text-xs text-[#104A78] flex items-center justify-between">
                  <span>رمز التحقق المستلم:</span>
                  <span className="font-mono font-bold text-sm bg-white px-2 py-0.5 rounded-sm border border-[#1766A6]/30">
                    {generatedCodeHint}
                  </span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#203945]">
                  رمز التحقق (6 أرقام)
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value)}
                  placeholder="123456"
                  className="w-full h-11 px-3 text-center tracking-widest text-base font-mono font-bold bg-white border border-[#CCD8D5] rounded-[12px] outline-hidden focus:border-[#1766A6]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#203945]">كلمة المرور الجديدة</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-11 pr-10 pl-10 text-xs sm:text-sm bg-white border border-[#CCD8D5] rounded-[12px] outline-hidden focus:border-[#1766A6]"
                  />
                  <Lock className="w-4 h-4 text-[#203945]/40 absolute right-3.5 top-3.5" />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute left-3.5 top-3.5 text-[#203945]/50 hover:text-[#203945] cursor-pointer"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#203945]">تأكيد كلمة المرور</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-11 pr-10 pl-3 text-xs sm:text-sm bg-white border border-[#CCD8D5] rounded-[12px] outline-hidden focus:border-[#1766A6]"
                  />
                  <Lock className="w-4 h-4 text-[#203945]/40 absolute right-3.5 top-3.5" />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 rounded-[12px] bg-[#25866D] hover:bg-[#1E6F5A] text-white font-bold text-xs sm:text-sm shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{loading ? 'جاري الحفظ...' : 'تأكيد كلمة المرور الجديدة'}</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
