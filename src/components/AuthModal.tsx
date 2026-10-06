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
  Brain,
  Scale,
  Stethoscope,
  Building,
  Building2,
  Users2,
  Upload,
  FileCheck,
  Calendar,
  Briefcase,
  Award,
  Sparkles,
  Check,
} from 'lucide-react';
import { User, ALGERIA_WILAYAS, UserRole } from '../types';
import {
  authenticateUser,
  createUserInDb,
  requestPasswordReset,
  verifyAndResetPassword,
  DEFAULT_ADMIN_EMAIL,
  DEFAULT_ADMIN_PASSWORD,
} from '../services/dbService';

export type AccountTypeOption =
  | 'user'
  | 'psychologist'
  | 'lawyer'
  | 'doctor'
  | 'clinic'
  | 'hospital'
  | 'association';

interface AccountTypeConfig {
  id: AccountTypeOption;
  role: UserRole;
  title: string;
  badge: string;
  icon: string;
  description: string;
  isProvider: boolean;
}

const ACCOUNT_TYPES: AccountTypeConfig[] = [
  {
    id: 'user',
    role: 'user',
    title: 'مستفيد / مستخدم',
    badge: '👤 فرد / أسرة',
    icon: '👤',
    description: 'تسجيل مباشر للأفراد والأسر لطلب الاستشارات والمرافقة ومتابعة الحالة',
    isProvider: false,
  },
  {
    id: 'psychologist',
    role: 'psychologist',
    title: 'أخصائي نفسي',
    badge: '🧠 مختص معتمد',
    icon: '🧠',
    description: 'جلسات الدعم والتوجيه النفسي، العلاج السلوكي المعرفي، ومرافقة التعافي',
    isProvider: true,
  },
  {
    id: 'lawyer',
    role: 'lawyer',
    title: 'محامي',
    badge: '⚖️ مستشار قانوني',
    icon: '⚖️',
    description: 'استشارات قانونية مع محامين معتمدين ومستشارين قانونيين',
    isProvider: true,
  },
  {
    id: 'doctor',
    role: 'doctor',
    title: 'طبيب',
    badge: '🩺 طبيب متخصص',
    icon: '🩺',
    description: 'أطباء مختصون في طب الإدمان والطب العقلي والنفسي والفحوصات الطبية',
    isProvider: true,
  },
  {
    id: 'clinic',
    role: 'clinic',
    title: 'عيادة خاصة',
    badge: '🏥 مؤسسة صحية',
    icon: '🏥',
    description: 'عيادات ومراكز طبية خاصة معتمدة للتكفل الخارجي وإزالة السموم',
    isProvider: true,
  },
  {
    id: 'hospital',
    role: 'hospital',
    title: 'مستشفى خاص',
    badge: '🏨 مؤسسة استشفائية',
    icon: '🏨',
    description: 'مستشفيات ومصحات خاصة للتكفل الداخلي، الإقامة الطبية، وإعادة التأهيل',
    isProvider: true,
  },
  {
    id: 'association',
    role: 'association',
    title: 'جمعية',
    badge: '🤝 مجتمع مدني',
    icon: '🤝',
    description: 'جمعيات الوقاية والتوعية والمرافقة الاجتماعية وإعادة إدماج المتعافين',
    isProvider: true,
  },
];

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
  const [selectedType, setSelectedType] = useState<AccountTypeOption | null>(null);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Shared registration fields
  const [regFirstName, setRegFirstName] = useState('');
  const [regLastName, setRegLastName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regWilaya, setRegWilaya] = useState(ALGERIA_WILAYAS[15]); // الجزائر العاصمة
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);

  // Beneficiary specific
  const [regBirthDate, setRegBirthDate] = useState('');

  // Professional / Organization specific fields
  const [regSpecialty, setRegSpecialty] = useState('');
  const [regAddress, setRegAddress] = useState('');
  const [regLicenseNumber, setRegLicenseNumber] = useState('');
  const [regOrgName, setRegOrgName] = useState('');
  const [regManagerName, setRegManagerName] = useState('');
  const [regServicesOffered, setRegServicesOffered] = useState('');
  const [regActivityField, setRegActivityField] = useState('');
  const [regUploadedDocName, setRegUploadedDocName] = useState<string | null>(null);

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

  const handleDocumentSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setRegUploadedDocName(e.target.files[0].name);
    }
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

  // 2. Handle Dynamic Multi-Type Registration
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();

    if (!selectedType) {
      setErrorMsg('يرجى اختيار نوع الحساب أولاً.');
      return;
    }

    // Common password validation
    if (regPassword.length < 6) {
      setErrorMsg('يجب أن تتكون كلمة المرور من 6 أحرف على الأقل.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setErrorMsg('كلمتا المرور غير متطابقتين.');
      return;
    }

    const typeConfig = ACCOUNT_TYPES.find((t) => t.id === selectedType)!;
    const isDirectActive = selectedType === 'user';

    // Validate type specific fields
    if (selectedType === 'user') {
      if (!regFirstName.trim() || !regLastName.trim() || !regEmail.trim() || !regPhone.trim()) {
        setErrorMsg('يرجى استكمال بيانات الاسم والهاتف والبريد الإلكتروني.');
        return;
      }
      if (!agreeTerms) {
        setErrorMsg('يجب الموافقة على الشروط وسياسة الخصوصية للمتابعة.');
        return;
      }
    } else if (selectedType === 'clinic' || selectedType === 'hospital') {
      if (!regOrgName.trim() || !regManagerName.trim() || !regEmail.trim() || !regPhone.trim() || !regAddress.trim()) {
        setErrorMsg('يرجى استكمال اسم المؤسسة، اسم المسؤول، الهاتف، البريد، والعنوان.');
        return;
      }
    } else if (selectedType === 'association') {
      if (!regOrgName.trim() || !regManagerName.trim() || !regEmail.trim() || !regPhone.trim() || !regAddress.trim()) {
        setErrorMsg('يرجى استكمال اسم الجمعية، اسم المسؤول، الهاتف، البريد، والعنوان.');
        return;
      }
    } else {
      // psychologist, lawyer, doctor
      if (!regFirstName.trim() || !regLastName.trim() || !regEmail.trim() || !regPhone.trim() || !regAddress.trim()) {
        setErrorMsg('يرجى استكمال الاسم واللقب ورقم الهاتف والبريد والعنوان المهني.');
        return;
      }
    }

    setLoading(true);
    try {
      const newUser = await createUserInDb({
        firstName:
          selectedType === 'clinic' || selectedType === 'hospital' || selectedType === 'association'
            ? regOrgName.trim()
            : regFirstName.trim(),
        lastName:
          selectedType === 'clinic' || selectedType === 'hospital' || selectedType === 'association'
            ? `(المسؤول: ${regManagerName.trim()})`
            : regLastName.trim(),
        email: regEmail.trim().toLowerCase(),
        phone: regPhone.trim(),
        wilayaName: regWilaya,
        roleSlug: typeConfig.role,
        accountType: selectedType,
        status: isDirectActive ? 'active' : 'pending',
        password: regPassword,
        birthDate: regBirthDate.trim() || undefined,
        specialty:
          selectedType === 'psychologist' || selectedType === 'doctor'
            ? regSpecialty.trim() || (selectedType === 'doctor' ? 'طب الإدمان والطب العقلي' : 'أخصائي نفسي عيادي')
            : selectedType === 'lawyer'
            ? 'محامٍ ومستشار قانوني معتمد'
            : regServicesOffered.trim() || undefined,
        address: regAddress.trim() || undefined,
        licenseNumber: regLicenseNumber.trim() || undefined,
        organizationName: regOrgName.trim() || undefined,
        managerName: regManagerName.trim() || undefined,
        activityField: regActivityField.trim() || undefined,
        documents: regUploadedDocName ? [regUploadedDocName] : undefined,
      });

      if (isDirectActive) {
        setSuccessMsg('تم إنشاء الحساب بنجاح! جاري تسجيل الدخول...');
        setTimeout(() => {
          onLogin(newUser);
          onClose();
        }, 1000);
      } else {
        setSuccessMsg(
          `تم تسجيل طلب إنشاء حسابك كـ «${typeConfig.title}» بنجاح! حسابك الآن في حالة «قيد المراجعة والتدقيق» من قبل إدارة المنصة وسيتم تفعيله فور التحقق من الاعتمادات.`
        );
        setTimeout(() => {
          setMode('login');
          setLoginEmail(regEmail.trim().toLowerCase());
          setSelectedType(null);
          resetMessages();
        }, 3500);
      }
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

  const selectedTypeConfig = selectedType ? ACCOUNT_TYPES.find((t) => t.id === selectedType) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-[#FBFDFC] rounded-[24px] max-w-xl w-full shadow-2xl border border-[#E0E8E6] overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-gradient-to-l from-[#1766A6]/10 to-transparent p-5 border-b border-[#E0E8E6] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="Logo"
              className="w-11 h-11 object-contain rounded-full border border-[#CCD8D5] bg-white p-0.5 shadow-xs shrink-0"
            />
            <div>
              <h3 className="text-[17px] sm:text-[19px] font-black text-[#203945]">
                {mode === 'login' && 'تسجيل الدخول إلى المنصة'}
                {mode === 'register' && !selectedType && 'إنشاء حساب جديد'}
                {mode === 'register' && selectedType && `إنشاء حساب — ${selectedTypeConfig?.title}`}
                {mode === 'forgot' && 'استعادة كلمة المرور'}
                {mode === 'reset-code' && 'تعيين كلمة المرور الجديدة'}
              </h3>
              <p className="text-[11px] text-[#1766A6] font-semibold mt-0.5">
                منصة الفرصة الثانية — نظام رقمي آمن للدعم والاستشارات والمرافقة
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white hover:bg-slate-100 border border-[#CCD8D5] flex items-center justify-center text-[#203945] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Global Notifications */}
        {errorMsg && (
          <div className="m-5 mb-0 p-3 bg-red-50 border border-red-200 rounded-[12px] flex items-start gap-2 text-xs text-red-800">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span className="font-medium leading-relaxed">{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="m-5 mb-0 p-3 bg-emerald-50 border border-emerald-200 rounded-[12px] flex items-start gap-2 text-xs text-emerald-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span className="font-medium leading-relaxed">{successMsg}</span>
          </div>
        )}

        {/* 1. LOGIN MODE */}
        {mode === 'login' && (
          <form onSubmit={handleLoginSubmit} className="p-5 sm:p-6 space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#203945]">
                البريد الإلكتروني أو اسم المستخدم
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="name@example.com أو اسم المستخدم"
                  className="w-full h-11 pr-10 pl-3 text-xs sm:text-sm bg-white border border-[#CCD8D5] rounded-[12px] outline-hidden focus:border-[#1766A6] text-[#203945]"
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
                  className="w-full h-11 pr-10 pl-10 text-xs sm:text-sm bg-white border border-[#CCD8D5] rounded-[12px] outline-hidden focus:border-[#1766A6] text-[#203945]"
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

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-[#203945]">
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
                className="text-[10px] text-[#1766A6] hover:underline bg-[#EAF3F8] px-2 py-1 rounded-[6px] font-bold"
              >
                تجربة بحساب الأدمن ⚡
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-[12px] bg-[#1766A6] hover:bg-[#125386] disabled:opacity-50 text-white font-bold text-sm shadow-xs transition-colors flex items-center justify-center gap-2"
            >
              {loading ? 'جاري التحقق...' : 'تسجيل الدخول'}
            </button>

            <div className="text-center pt-3 border-t border-[#E0E8E6]">
              <p className="text-xs text-[#203945]">
                ليس لديك حساب بعد؟{' '}
                <button
                  type="button"
                  onClick={() => {
                    resetMessages();
                    setMode('register');
                    setSelectedType(null);
                  }}
                  className="font-bold text-[#1766A6] hover:underline"
                >
                  إنشاء حساب جديد
                </button>
              </p>
            </div>
          </form>
        )}

        {/* 2. REGISTER MODE — STEP 1: CHOOSE REGISTRATION TYPE («المسجل كـ؟») */}
        {mode === 'register' && !selectedType && (
          <div className="p-5 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
            <div className="text-center space-y-1 pb-1">
              <h4 className="text-base sm:text-lg font-black text-[#203945]">
                المسجل كـ؟
              </h4>
              <p className="text-xs text-[#203945]/70">
                اختر نوع الحساب الذي ترغب في إنشائه للحصول على النموذج المخصص وصلاحيات لوحة التحكم المناسبة
              </p>
            </div>

            {/* Account Type Selection Cards (Requirement 1) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {ACCOUNT_TYPES.map((type) => (
                <div
                  key={type.id}
                  onClick={() => {
                    resetMessages();
                    setSelectedType(type.id);
                  }}
                  className={`p-3.5 rounded-[16px] border cursor-pointer transition-all flex flex-col justify-between space-y-2 hover:shadow-xs ${
                    type.id === 'user'
                      ? 'bg-gradient-to-br from-[#EAF3F8] to-white border-[#1766A6]/40 hover:border-[#1766A6]'
                      : 'bg-white border-[#CCD8D5] hover:border-[#1766A6]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl">{type.icon}</span>
                      <div>
                        <h5 className="font-black text-sm text-[#203945]">{type.title}</h5>
                        <span className="text-[10px] font-bold text-[#1766A6]">{type.badge}</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-[11px] text-[#203945]/70 leading-relaxed font-medium">
                    {type.description}
                  </p>
                  <div className="pt-1.5 border-t border-[#F0F4F2] flex items-center justify-between text-[10px]">
                    <span className={type.isProvider ? 'text-amber-800 font-bold' : 'text-emerald-800 font-bold'}>
                      {type.isProvider ? '⏳ قيد المراجعة قبل التفعيل' : '⚡ تفعيل مباشر فوري'}
                    </span>
                    <span className="text-[#1766A6] font-bold flex items-center gap-0.5">
                      اختيار ←
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center pt-3 border-t border-[#E0E8E6]">
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
          </div>
        )}

        {/* 2. REGISTER MODE — STEP 2: DYNAMIC FORM PER SELECTED TYPE */}
        {mode === 'register' && selectedType && (
          <form onSubmit={handleRegisterSubmit} className="p-5 sm:p-6 space-y-3.5 max-h-[75vh] overflow-y-auto">
            {/* Header with Type Badge and Back Button */}
            <div className="flex items-center justify-between p-3 rounded-[12px] bg-[#EAF3F8] border border-[#DCEBF4]">
              <div className="flex items-center gap-2">
                <span className="text-xl">{selectedTypeConfig?.icon}</span>
                <div>
                  <span className="text-[11px] text-[#1766A6] font-bold block">المسجل كـ:</span>
                  <strong className="text-xs sm:text-sm font-black text-[#203945]">
                    {selectedTypeConfig?.title}
                  </strong>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  resetMessages();
                  setSelectedType(null);
                }}
                className="text-[11px] font-bold text-[#1766A6] hover:underline bg-white px-2.5 py-1 rounded-[8px] border border-[#CCD8D5] flex items-center gap-1"
              >
                <span>تغيير النوع</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {selectedTypeConfig?.isProvider && (
              <div className="p-2.5 rounded-[10px] bg-amber-50 border border-amber-200 text-[11px] text-amber-900 flex items-start gap-2">
                <Shield className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <span>
                  ملاحظة: حسابات المهنيين والجهات المعتمدة تخضع لتدقيق الإدارة (الحالة: «قيد المراجعة» ← اعتماد الأدمن ← تفعيل الحساب).
                </span>
              </div>
            )}

            {/* ================= TYPE 1: مستفيد / مستخدم ================= */}
            {selectedType === 'user' && (
              <>
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-[#203945]">الاسم</label>
                    <input
                      type="text"
                      required
                      value={regFirstName}
                      onChange={(e) => setRegFirstName(e.target.value)}
                      placeholder="الاسم الشخصي"
                      className="w-full h-10 px-3 text-xs bg-white border border-[#CCD8D5] rounded-[10px] outline-hidden focus:border-[#1766A6] text-[#203945]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-[#203945]">اللقب</label>
                    <input
                      type="text"
                      required
                      value={regLastName}
                      onChange={(e) => setRegLastName(e.target.value)}
                      placeholder="اللقب العائلي"
                      className="w-full h-10 px-3 text-xs bg-white border border-[#CCD8D5] rounded-[10px] outline-hidden focus:border-[#1766A6] text-[#203945]"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-[#203945]">
                    تاريخ الميلاد (عند الحاجة / اختياري)
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={regBirthDate}
                      onChange={(e) => setRegBirthDate(e.target.value)}
                      className="w-full h-10 pr-9 pl-3 text-xs bg-white border border-[#CCD8D5] rounded-[10px] outline-hidden focus:border-[#1766A6] text-[#203945]"
                    />
                    <Calendar className="w-3.5 h-3.5 text-[#203945]/40 absolute right-3 top-3" />
                  </div>
                </div>
              </>
            )}

            {/* ================= TYPE 2: أخصائي نفسي ================= */}
            {selectedType === 'psychologist' && (
              <>
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-[#203945]">الاسم واللقب</label>
                    <input
                      type="text"
                      required
                      value={regFirstName}
                      onChange={(e) => setRegFirstName(e.target.value)}
                      placeholder="د. / الأخصائي(ة)"
                      className="w-full h-10 px-3 text-xs bg-white border border-[#CCD8D5] rounded-[10px] outline-hidden focus:border-[#1766A6] text-[#203945]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-[#203945]">اللقب</label>
                    <input
                      type="text"
                      required
                      value={regLastName}
                      onChange={(e) => setRegLastName(e.target.value)}
                      placeholder="اللقب"
                      className="w-full h-10 px-3 text-xs bg-white border border-[#CCD8D5] rounded-[10px] outline-hidden focus:border-[#1766A6] text-[#203945]"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-[#203945]">التخصص النفسي</label>
                  <input
                    type="text"
                    required
                    value={regSpecialty}
                    onChange={(e) => setRegSpecialty(e.target.value)}
                    placeholder="مثلاً: علم النفس العيادي / علاج الإدمان / علاج سلوكي معرفي"
                    className="w-full h-10 px-3 text-xs bg-white border border-[#CCD8D5] rounded-[10px] outline-hidden focus:border-[#1766A6] text-[#203945]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-[#203945]">العنوان المهني (العيادة / المكتب)</label>
                  <input
                    type="text"
                    required
                    value={regAddress}
                    onChange={(e) => setRegAddress(e.target.value)}
                    placeholder="العنوان، الشارع، المدينة"
                    className="w-full h-10 px-3 text-xs bg-white border border-[#CCD8D5] rounded-[10px] outline-hidden focus:border-[#1766A6] text-[#203945]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-[#203945]">
                    رقم الاعتماد / الوثيقة المهنية (عند الحاجة)
                  </label>
                  <input
                    type="text"
                    value={regLicenseNumber}
                    onChange={(e) => setRegLicenseNumber(e.target.value)}
                    placeholder="رقم الرخصة أو رخصة الممارسة"
                    className="w-full h-10 px-3 text-xs bg-white border border-[#CCD8D5] rounded-[10px] outline-hidden focus:border-[#1766A6] text-[#203945]"
                  />
                </div>
              </>
            )}

            {/* ================= TYPE 3: محامي ================= */}
            {selectedType === 'lawyer' && (
              <>
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-[#203945]">الاسم</label>
                    <input
                      type="text"
                      required
                      value={regFirstName}
                      onChange={(e) => setRegFirstName(e.target.value)}
                      placeholder="الأستاذ(ة)"
                      className="w-full h-10 px-3 text-xs bg-white border border-[#CCD8D5] rounded-[10px] outline-hidden focus:border-[#1766A6] text-[#203945]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-[#203945]">اللقب</label>
                    <input
                      type="text"
                      required
                      value={regLastName}
                      onChange={(e) => setRegLastName(e.target.value)}
                      placeholder="اللقب"
                      className="w-full h-10 px-3 text-xs bg-white border border-[#CCD8D5] rounded-[10px] outline-hidden focus:border-[#1766A6] text-[#203945]"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-[#203945]">العنوان المهني (مكتب المحاماة)</label>
                  <input
                    type="text"
                    required
                    value={regAddress}
                    onChange={(e) => setRegAddress(e.target.value)}
                    placeholder="مكتب المحاماة، الشارع، المدينة"
                    className="w-full h-10 px-3 text-xs bg-white border border-[#CCD8D5] rounded-[10px] outline-hidden focus:border-[#1766A6] text-[#203945]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-[#203945]">
                    رقم التسجيل / الاعتماد المهني (منظمة المحامين)
                  </label>
                  <input
                    type="text"
                    required
                    value={regLicenseNumber}
                    onChange={(e) => setRegLicenseNumber(e.target.value)}
                    placeholder="رقم القيد في جدول المحامين / المنظمة الجهوية"
                    className="w-full h-10 px-3 text-xs bg-white border border-[#CCD8D5] rounded-[10px] outline-hidden focus:border-[#1766A6] text-[#203945]"
                  />
                </div>
              </>
            )}

            {/* ================= TYPE 4: طبيب ================= */}
            {selectedType === 'doctor' && (
              <>
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-[#203945]">الاسم</label>
                    <input
                      type="text"
                      required
                      value={regFirstName}
                      onChange={(e) => setRegFirstName(e.target.value)}
                      placeholder="د."
                      className="w-full h-10 px-3 text-xs bg-white border border-[#CCD8D5] rounded-[10px] outline-hidden focus:border-[#1766A6] text-[#203945]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-[#203945]">اللقب</label>
                    <input
                      type="text"
                      required
                      value={regLastName}
                      onChange={(e) => setRegLastName(e.target.value)}
                      placeholder="اللقب"
                      className="w-full h-10 px-3 text-xs bg-white border border-[#CCD8D5] rounded-[10px] outline-hidden focus:border-[#1766A6] text-[#203945]"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-[#203945]">التخصص الطبي</label>
                  <input
                    type="text"
                    required
                    value={regSpecialty}
                    onChange={(e) => setRegSpecialty(e.target.value)}
                    placeholder="طب الإدمان / الطب العقلي / طب عام / علم السموم"
                    className="w-full h-10 px-3 text-xs bg-white border border-[#CCD8D5] rounded-[10px] outline-hidden focus:border-[#1766A6] text-[#203945]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-[#203945]">العنوان المهني (العيادة / المركز الطبي)</label>
                  <input
                    type="text"
                    required
                    value={regAddress}
                    onChange={(e) => setRegAddress(e.target.value)}
                    placeholder="العنوان المهني للعيادة"
                    className="w-full h-10 px-3 text-xs bg-white border border-[#CCD8D5] rounded-[10px] outline-hidden focus:border-[#1766A6] text-[#203945]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-[#203945]">رقم الاعتماد المهني (عمادة الأطباء)</label>
                  <input
                    type="text"
                    required
                    value={regLicenseNumber}
                    onChange={(e) => setRegLicenseNumber(e.target.value)}
                    placeholder="رقم التسجيل في عمادة الأطباء"
                    className="w-full h-10 px-3 text-xs bg-white border border-[#CCD8D5] rounded-[10px] outline-hidden focus:border-[#1766A6] text-[#203945]"
                  />
                </div>
              </>
            )}

            {/* ================= TYPE 5: عيادة خاصة ================= */}
            {selectedType === 'clinic' && (
              <>
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-[#203945]">اسم العيادة</label>
                  <input
                    type="text"
                    required
                    value={regOrgName}
                    onChange={(e) => setRegOrgName(e.target.value)}
                    placeholder="عيادة النور / عيادة الأمل لعلاج الإدمان..."
                    className="w-full h-10 px-3 text-xs bg-white border border-[#CCD8D5] rounded-[10px] outline-hidden focus:border-[#1766A6] text-[#203945]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-[#203945]">اسم المدير / المسؤول</label>
                  <input
                    type="text"
                    required
                    value={regManagerName}
                    onChange={(e) => setRegManagerName(e.target.value)}
                    placeholder="د. / المدير الطبي أو الإداري"
                    className="w-full h-10 px-3 text-xs bg-white border border-[#CCD8D5] rounded-[10px] outline-hidden focus:border-[#1766A6] text-[#203945]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-[#203945]">العنوان الكامل</label>
                  <input
                    type="text"
                    required
                    value={regAddress}
                    onChange={(e) => setRegAddress(e.target.value)}
                    placeholder="العنوان والبلدية"
                    className="w-full h-10 px-3 text-xs bg-white border border-[#CCD8D5] rounded-[10px] outline-hidden focus:border-[#1766A6] text-[#203945]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-[#203945]">التخصصات والخدمات</label>
                  <input
                    type="text"
                    required
                    value={regServicesOffered}
                    onChange={(e) => setRegServicesOffered(e.target.value)}
                    placeholder="علاج إدمان، فحص نفسي، إزالة السموم الخارجية، تحاليل..."
                    className="w-full h-10 px-3 text-xs bg-white border border-[#CCD8D5] rounded-[10px] outline-hidden focus:border-[#1766A6] text-[#203945]"
                  />
                </div>
              </>
            )}

            {/* ================= TYPE 6: مستشفى خاص ================= */}
            {selectedType === 'hospital' && (
              <>
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-[#203945]">اسم المستشفى الخاص</label>
                  <input
                    type="text"
                    required
                    value={regOrgName}
                    onChange={(e) => setRegOrgName(e.target.value)}
                    placeholder="مصحة / مستشفى خاص..."
                    className="w-full h-10 px-3 text-xs bg-white border border-[#CCD8D5] rounded-[10px] outline-hidden focus:border-[#1766A6] text-[#203945]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-[#203945]">اسم المسؤول / المدير العام</label>
                  <input
                    type="text"
                    required
                    value={regManagerName}
                    onChange={(e) => setRegManagerName(e.target.value)}
                    placeholder="المدير العام أو الطبي"
                    className="w-full h-10 px-3 text-xs bg-white border border-[#CCD8D5] rounded-[10px] outline-hidden focus:border-[#1766A6] text-[#203945]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-[#203945]">العنوان</label>
                  <input
                    type="text"
                    required
                    value={regAddress}
                    onChange={(e) => setRegAddress(e.target.value)}
                    placeholder="الموقع والعنوان الاستشفائي"
                    className="w-full h-10 px-3 text-xs bg-white border border-[#CCD8D5] rounded-[10px] outline-hidden focus:border-[#1766A6] text-[#203945]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-[#203945]">الخدمات والتخصصات الاستشفائية</label>
                  <input
                    type="text"
                    required
                    value={regServicesOffered}
                    onChange={(e) => setRegServicesOffered(e.target.value)}
                    placeholder="استشفاء داخلي، إزالة سموم، طب نفسي، طوارئ 24/7..."
                    className="w-full h-10 px-3 text-xs bg-white border border-[#CCD8D5] rounded-[10px] outline-hidden focus:border-[#1766A6] text-[#203945]"
                  />
                </div>
              </>
            )}

            {/* ================= TYPE 7: جمعية ================= */}
            {selectedType === 'association' && (
              <>
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-[#203945]">اسم الجمعية</label>
                  <input
                    type="text"
                    required
                    value={regOrgName}
                    onChange={(e) => setRegOrgName(e.target.value)}
                    placeholder="جمعية فرصة أمل / جمعية حماية الشباب..."
                    className="w-full h-10 px-3 text-xs bg-white border border-[#CCD8D5] rounded-[10px] outline-hidden focus:border-[#1766A6] text-[#203945]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-[#203945]">اسم رئيس الجمعية / المسؤول</label>
                  <input
                    type="text"
                    required
                    value={regManagerName}
                    onChange={(e) => setRegManagerName(e.target.value)}
                    placeholder="رئيس الجمعية أو الأمين العام"
                    className="w-full h-10 px-3 text-xs bg-white border border-[#CCD8D5] rounded-[10px] outline-hidden focus:border-[#1766A6] text-[#203945]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-[#203945]">العنوان / المقر الاجتماعي</label>
                  <input
                    type="text"
                    required
                    value={regAddress}
                    onChange={(e) => setRegAddress(e.target.value)}
                    placeholder="مقر الجمعية، البلدية"
                    className="w-full h-10 px-3 text-xs bg-white border border-[#CCD8D5] rounded-[10px] outline-hidden focus:border-[#1766A6] text-[#203945]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-[#203945]">مجال نشاط الجمعية</label>
                  <input
                    type="text"
                    required
                    value={regActivityField}
                    onChange={(e) => setRegActivityField(e.target.value)}
                    placeholder="مكافحة المخدرات، مرافقة الأسر، التوعية الميدانية، إعادة الإدماج"
                    className="w-full h-10 px-3 text-xs bg-white border border-[#CCD8D5] rounded-[10px] outline-hidden focus:border-[#1766A6] text-[#203945]"
                  />
                </div>
              </>
            )}

            {/* ================= COMMON CONTACT & LOCATION FIELDS ================= */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-[#203945]">البريد الإلكتروني</label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="contact@domain.dz"
                    className="w-full h-10 pr-9 pl-3 text-xs bg-white border border-[#CCD8D5] rounded-[10px] outline-hidden focus:border-[#1766A6] text-[#203945]"
                  />
                  <Mail className="w-3.5 h-3.5 text-[#203945]/40 absolute right-3 top-3" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-[#203945]">رقم الهاتف</label>
                <div className="relative">
                  <input
                    type="tel"
                    required
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="05 / 06 / 07 / 02..."
                    className="w-full h-10 pr-9 pl-3 text-xs bg-white border border-[#CCD8D5] rounded-[10px] outline-hidden focus:border-[#1766A6] text-[#203945]"
                  />
                  <Phone className="w-3.5 h-3.5 text-[#203945]/40 absolute right-3 top-3" />
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-[#203945]">الولاية</label>
              <div className="relative">
                <select
                  value={regWilaya}
                  onChange={(e) => setRegWilaya(e.target.value)}
                  className="w-full h-10 pr-9 pl-3 text-xs bg-white border border-[#CCD8D5] rounded-[10px] outline-hidden focus:border-[#1766A6] text-[#203945]"
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

            {/* Document Upload for Providers / Entities */}
            {selectedTypeConfig?.isProvider && (
              <div className="space-y-1.5 p-3 rounded-[12px] bg-[#F7FAF9] border border-[#CCD8D5] border-dashed">
                <label className="block text-[11px] font-bold text-[#203945]">
                  رفع الوثائق المهنية / القانونية (الاعتماد، السجل، أو الشهادة)
                </label>
                <div className="flex items-center gap-3">
                  <label className="cursor-pointer px-3 py-1.5 rounded-[8px] bg-white border border-[#CCD8D5] hover:bg-[#EAF3F8] text-[#1766A6] font-bold text-xs flex items-center gap-1.5 transition-colors shadow-2xs">
                    <Upload className="w-3.5 h-3.5" />
                    <span>اختيار ملف (PDF / صورة)</span>
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg"
                      onChange={handleDocumentSelect}
                      className="hidden"
                    />
                  </label>
                  <span className="text-[11px] text-[#203945]/70 truncate max-w-[200px]">
                    {regUploadedDocName ? (
                      <span className="text-emerald-700 font-bold flex items-center gap-1">
                        <FileCheck className="w-3.5 h-3.5" />
                        {regUploadedDocName}
                      </span>
                    ) : (
                      'لم يتم اختيار ملف بعد'
                    )}
                  </span>
                </div>
              </div>
            )}

            {/* Password and Confirm Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
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
                    className="absolute left-2.5 top-2.5 text-[#203945]/40 hover:text-[#203945]"
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
                    className="w-full h-10 pr-9 pl-3 text-xs bg-white border border-[#CCD8D5] rounded-[10px] outline-hidden focus:border-[#1766A6] text-[#203945]"
                  />
                  <Lock className="w-3.5 h-3.5 text-[#203945]/40 absolute right-3 top-3" />
                </div>
              </div>
            </div>

            {/* Terms checkbox for Beneficiary */}
            {selectedType === 'user' && (
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
                    <span className="font-bold text-[#1766A6]">سياسة الخصوصية وحماية السرية التامة</span>.
                  </span>
                </label>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full h-11 rounded-[12px] disabled:opacity-50 text-white font-bold text-xs sm:text-sm shadow-xs transition-colors mt-2 flex items-center justify-center gap-2 ${
                selectedType === 'user'
                  ? 'bg-[#1766A6] hover:bg-[#125386]'
                  : 'bg-[#25866D] hover:bg-[#1E6F5A]'
              }`}
            >
              {loading ? (
                'جاري إرسال البيانات وحفظ الحساب...'
              ) : selectedType === 'user' ? (
                'إنشاء حساب المستفيد والبدء فوراً'
              ) : (
                'إرسال طلب التسجيل للمراجعة والاعتماد'
              )}
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
