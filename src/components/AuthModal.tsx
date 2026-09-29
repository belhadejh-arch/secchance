import React, { useState } from 'react';
import {
  X,
  Eye,
  EyeOff,
  Lock,
  Mail,
  User as UserIcon,
  Phone,
  MapPin,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Shield,
  ArrowRight,
} from 'lucide-react';
import { User, ALGERIA_WILAYAS } from '../types';
import {
  authenticateUser,
  createUserInDb,
  requestPasswordReset,
  verifyAndResetPassword,
  DEFAULT_ADMIN_EMAIL,
  DEFAULT_ADMIN_PASSWORD,
} from '../services/dbService';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (user: User) => void;
  initialMode?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLogin,
  initialMode = 'login',
}) => {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot' | 'reset-code'>(initialMode);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Register form state
  const [regFirstName, setRegFirstName] = useState('');
  const [regLastName, setRegLastName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regWilaya, setRegWilaya] = useState(ALGERIA_WILAYAS[15]); // الجزائر العاصمة
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);

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

  // 2. Handle Register (Beneficiary / User)
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();

    if (!regFirstName.trim() || !regLastName.trim() || !regEmail.trim() || !regPhone.trim()) {
      setErrorMsg('يرجى استكمال جميع بيانات الحساب.');
      return;
    }

    if (regPassword.length < 6) {
      setErrorMsg('يجب أن تتكون كلمة المرور من 6 أحرف على الأقل.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setErrorMsg('كلمتا المرور غير متطابقتين.');
      return;
    }

    if (!agreeTerms) {
      setErrorMsg('يجب الموافقة على الشروط وسياسة الخصوصية للمتابعة.');
      return;
    }

    setLoading(true);
    try {
      const newUser = await createUserInDb({
        firstName: regFirstName.trim(),
        lastName: regLastName.trim(),
        email: regEmail.trim().toLowerCase(),
        phone: regPhone.trim(),
        wilayaName: regWilaya,
        roleSlug: 'user', // Public registration is strictly for beneficiaries
        status: 'active',
        password: regPassword,
      });

      setSuccessMsg('تم إنشاء الحساب بنجاح! جاري تسجيل الدخول...');
      setTimeout(() => {
        onLogin(newUser);
        onClose();
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message || 'حدث خطأ أثناء حفظ البيانات في قاعدة البيانات.');
    } finally {
      setLoading(false);
    }
  };

  // 3. Handle Request Reset Code
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
        setGeneratedCodeHint(res.resetCode || null);
        setMode('reset-code');
      } else {
        setErrorMsg(res.message);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'فشلت عملية إرسال رمز الاستعادة.');
    } finally {
      setLoading(false);
    }
  };

  // 4. Handle Verify & Reset Password
  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();

    if (!resetCode.trim() || !newPassword.trim()) {
      setErrorMsg('يرجى إدخال رمز التحقق وكلمة المرور الجديدة.');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMsg('كلمة المرور يجب أن لا تقل عن 6 أحرف.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setErrorMsg('كلمة المرور وتأكيدها غير متطابقين.');
      return;
    }

    setLoading(true);
    try {
      const res = await verifyAndResetPassword(forgotEmail, resetCode, newPassword);
      if (res.success) {
        setSuccessMsg(res.message);
        setTimeout(() => {
          setMode('login');
          setLoginEmail(forgotEmail);
          setLoginPassword('');
          resetMessages();
        }, 1500);
      } else {
        setErrorMsg(res.message);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'فشل التحقق من الرمز.');
    } finally {
      setLoading(false);
    }
  };

  // Quick fill helper for testing/evaluation
  const fillQuickAdmin = () => {
    setLoginEmail(DEFAULT_ADMIN_EMAIL);
    setLoginPassword(DEFAULT_ADMIN_PASSWORD);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-[#FBFDFC] rounded-[24px] max-w-lg w-full shadow-2xl border border-[#E0E8E6] overflow-hidden my-6">
        {/* Header */}
        <div className="bg-gradient-to-l from-[#1766A6]/10 to-transparent p-5 border-b border-[#E0E8E6] flex items-center justify-between">
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
                  {mode === 'register' && 'حساب مستفيد جديد'}
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
            className="text-[#203945]/60 hover:text-[#203945] p-1.5 rounded-full hover:bg-slate-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Alerts */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 bg-[#FBECEB] border border-[#F5D4D2] text-[#5F1D1A] rounded-[12px] text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-[#A64842]" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mx-6 mt-4 p-3 bg-[#E8F4EF] border border-[#C5E4D8] text-[#1A5E4D] rounded-[12px] text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-[#25866D]" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* 1. LOGIN FORM */}
        {mode === 'login' && (
          <form onSubmit={handleLoginSubmit} className="p-6 space-y-4">
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
                  placeholder="name@example.com أو اسم المستخدم"
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
                  className="text-[11px] font-bold text-[#1766A6] hover:underline"
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
                  className="absolute left-3 top-3 text-[#203945]/40 hover:text-[#203945]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none text-[#203945]">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded-sm border-[#CCD8D5] text-[#1766A6] focus:ring-0"
                />
                <span>تذكرني على هذا الجهاز</span>
              </label>

              <button
                type="button"
                onClick={fillQuickAdmin}
                className="text-[10px] text-[#1766A6] font-bold hover:underline bg-[#EAF3F8] px-2 py-0.5 rounded-md"
                title="تعبئة حساب الأدمن العام للتجربة السريعة"
              >
                حساب الأدمن التجريبي
              </button>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-[12px] bg-[#1766A6] hover:bg-[#125386] disabled:opacity-50 text-white font-bold text-sm shadow-xs transition-colors flex items-center justify-center gap-2 mt-2"
            >
              {loading ? 'جاري التحقق...' : 'تسجيل الدخول'}
            </button>

            {/* Switch to Register */}
            <div className="text-center pt-3 border-t border-[#E0E8E6]">
              <p className="text-xs text-[#203945]">
                ليس لديك حساب؟{' '}
                <button
                  type="button"
                  onClick={() => {
                    resetMessages();
                    setMode('register');
                  }}
                  className="font-bold text-[#1766A6] hover:underline"
                >
                  إنشاء حساب مستفيد
                </button>
              </p>
            </div>
          </form>
        )}

        {/* 2. REGISTER FORM */}
        {mode === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="p-6 space-y-3.5 max-h-[75vh] overflow-y-auto">
            {/* Notice regarding specialist accounts */}
            <div className="bg-[#EAF3F8] border border-[#DCEBF4] p-3 rounded-[12px] text-[11px] text-[#104A78] flex items-start gap-2">
              <Shield className="w-4 h-4 text-[#1766A6] shrink-0 mt-0.5" />
              <p>
                <strong>ملاحظة للمهنيين والمختصين:</strong> التسجيل العام مخصص للمستفيدين وأسرهم. حسابات الأخصائيين النفسيين، الأطباء، المحامين، الجمعيات والمستشفيات يتم إنشاؤها واعتمادها حصرياً من قبل إدارة المنصة.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-[#203945]">الاسم الأول</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={regFirstName}
                    onChange={(e) => setRegFirstName(e.target.value)}
                    placeholder="مثال: يوسف"
                    className="w-full h-10 pr-9 pl-2 text-xs bg-white border border-[#CCD8D5] rounded-[10px] outline-hidden focus:border-[#1766A6] text-[#203945]"
                  />
                  <UserIcon className="w-3.5 h-3.5 text-[#203945]/40 absolute right-3 top-3" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-[#203945]">اللقب</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={regLastName}
                    onChange={(e) => setRegLastName(e.target.value)}
                    placeholder="مثال: منصوري"
                    className="w-full h-10 pr-9 pl-2 text-xs bg-white border border-[#CCD8D5] rounded-[10px] outline-hidden focus:border-[#1766A6] text-[#203945]"
                  />
                  <UserIcon className="w-3.5 h-3.5 text-[#203945]/40 absolute right-3 top-3" />
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-[#203945]">البريد الإلكتروني</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="w-full h-10 pr-9 pl-2 text-xs bg-white border border-[#CCD8D5] rounded-[10px] outline-hidden focus:border-[#1766A6] text-[#203945]"
                />
                <Mail className="w-3.5 h-3.5 text-[#203945]/40 absolute right-3 top-3" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-[#203945]">رقم الهاتف</label>
                <div className="relative">
                  <input
                    type="tel"
                    required
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="05 / 06 / 07..."
                    className="w-full h-10 pr-9 pl-2 text-xs bg-white border border-[#CCD8D5] rounded-[10px] outline-hidden focus:border-[#1766A6] text-[#203945]"
                  />
                  <Phone className="w-3.5 h-3.5 text-[#203945]/40 absolute right-3 top-3" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-[#203945]">الولاية</label>
                <div className="relative">
                  <select
                    value={regWilaya}
                    onChange={(e) => setRegWilaya(e.target.value)}
                    className="w-full h-10 pr-9 pl-2 text-xs bg-white border border-[#CCD8D5] rounded-[10px] outline-hidden focus:border-[#1766A6] text-[#203945]"
                  >
                    {ALGERIA_WILAYAS.map((w) => (
                      <option key={w} value={w}>
                        {w}
                      </option>
                    ))}
                  </select>
                  <MapPin className="w-3.5 h-3.5 text-[#203945]/40 absolute right-3 top-3" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-[#203945]">كلمة المرور</label>
                <div className="relative">
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-10 pr-9 pl-8 text-xs bg-white border border-[#CCD8D5] rounded-[10px] outline-hidden focus:border-[#1766A6] text-[#203945]"
                  />
                  <Lock className="w-3.5 h-3.5 text-[#203945]/40 absolute right-3 top-3" />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="absolute left-2 top-2.5 text-[#203945]/40 hover:text-[#203945]"
                  >
                    {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-[#203945]">تأكيد كلمة المرور</label>
                <div className="relative">
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    required
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-10 pr-9 pl-2 text-xs bg-white border border-[#CCD8D5] rounded-[10px] outline-hidden focus:border-[#1766A6] text-[#203945]"
                  />
                  <Lock className="w-3.5 h-3.5 text-[#203945]/40 absolute right-3 top-3" />
                </div>
              </div>
            </div>

            {/* Terms checkbox */}
            <div className="pt-1">
              <label className="flex items-start gap-2 cursor-pointer select-none text-[11px] text-[#203945]">
                <input
                  type="checkbox"
                  required
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded-sm border-[#CCD8D5] text-[#1766A6] focus:ring-0"
                />
                <span>
                  أوافق على{' '}
                  <span className="font-bold text-[#1766A6]">شروط الاستخدام</span> و{' '}
                  <span className="font-bold text-[#1766A6]">سياسة الخصوصية وحماية السرية الطبية</span>.
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-[12px] bg-[#1766A6] hover:bg-[#125386] disabled:opacity-50 text-white font-bold text-sm shadow-xs transition-colors mt-2"
            >
              {loading ? 'جاري إنشاء الحساب...' : 'إنشاء الحساب الآن'}
            </button>

            <div className="text-center pt-2 border-t border-[#E0E8E6]">
              <p className="text-xs text-[#203945]">
                لديك حساب بالفعل؟{' '}
                <button
                  type="button"
                  onClick={() => {
                    resetMessages();
                    setMode('login');
                  }}
                  className="font-bold text-[#1766A6] hover:underline"
                >
                  تسجيل الدخول
                </button>
              </p>
            </div>
          </form>
        )}

        {/* 3. FORGOT PASSWORD (STEP 1: REQUEST CODE) */}
        {mode === 'forgot' && (
          <form onSubmit={handleForgotSubmit} className="p-6 space-y-4">
            <p className="text-xs text-[#203945] leading-relaxed">
              أدخل بريدك الإلكتروني المسجل في المنصة لإرسال رمز تحقق آمن وموثق لإعادة تعيين كلمة المرور الخاصة بك.
            </p>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#203945]">البريد الإلكتروني</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full h-11 pr-10 pl-3 text-xs sm:text-sm bg-white border border-[#CCD8D5] rounded-[12px] outline-hidden focus:border-[#1766A6] text-[#203945]"
                />
                <Mail className="w-4 h-4 text-[#203945]/40 absolute right-3.5 top-3.5" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-[12px] bg-[#1766A6] hover:bg-[#125386] disabled:opacity-50 text-white font-bold text-sm shadow-xs transition-colors flex items-center justify-center gap-2"
            >
              {loading ? 'جاري التحقق وإصدار الرمز...' : 'إرسال رمز استعادة كلمة المرور'}
            </button>

            <div className="text-center pt-2 border-t border-[#E0E8E6]">
              <button
                type="button"
                onClick={() => {
                  resetMessages();
                  setMode('login');
                }}
                className="text-xs font-bold text-[#1766A6] hover:underline flex items-center justify-center gap-1 mx-auto"
              >
                <ArrowRight className="w-3.5 h-3.5" />
                <span>العودة لصفحة تسجيل الدخول</span>
              </button>
            </div>
          </form>
        )}

        {/* 4. FORGOT PASSWORD (STEP 2: ENTER CODE & SET NEW PASSWORD) */}
        {mode === 'reset-code' && (
          <form onSubmit={handleResetSubmit} className="p-6 space-y-4">
            <div className="bg-[#EAF3F8] p-3 rounded-[12px] text-xs text-[#104A78] space-y-1">
              <p>تم إرسال رمز التحقق إلى: <strong>{forgotEmail}</strong></p>
              {generatedCodeHint && (
                <p className="font-mono bg-white/80 p-1.5 rounded border border-[#CCD8D5] text-center font-bold text-sm text-[#1766A6]">
                  رمز التحقق السحابي: {generatedCodeHint}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#203945]">رمز التحقق (6 أرقام)</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value)}
                  placeholder="123456"
                  className="w-full h-11 pr-10 pl-3 text-center tracking-widest font-mono text-base font-bold bg-white border border-[#CCD8D5] rounded-[12px] outline-hidden focus:border-[#1766A6] text-[#203945]"
                />
                <KeyRound className="w-4 h-4 text-[#203945]/40 absolute right-3.5 top-3.5" />
              </div>
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
                  className="w-full h-11 pr-10 pl-10 text-xs sm:text-sm bg-white border border-[#CCD8D5] rounded-[12px] outline-hidden focus:border-[#1766A6] text-[#203945]"
                />
                <Lock className="w-4 h-4 text-[#203945]/40 absolute right-3.5 top-3.5" />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute left-3 top-3 text-[#203945]/40 hover:text-[#203945]"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#203945]">تأكيد كلمة المرور الجديدة</label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-11 pr-10 pl-3 text-xs sm:text-sm bg-white border border-[#CCD8D5] rounded-[12px] outline-hidden focus:border-[#1766A6] text-[#203945]"
                />
                <Lock className="w-4 h-4 text-[#203945]/40 absolute right-3.5 top-3.5" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-[12px] bg-[#25866D] hover:bg-[#1E6F5A] disabled:opacity-50 text-white font-bold text-sm shadow-xs transition-colors"
            >
              {loading ? 'جاري التحديث...' : 'تأكيد وحفظ كلمة المرور الجديدة'}
            </button>

            <div className="text-center pt-2 border-t border-[#E0E8E6]">
              <button
                type="button"
                onClick={() => {
                  resetMessages();
                  setMode('login');
                }}
                className="text-xs font-bold text-[#1766A6] hover:underline"
              >
                العودة لصفحة تسجيل الدخول
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
