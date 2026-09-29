import React, { useState } from 'react';
import { AccountType, User, ALGERIA_WILAYAS } from '../types';
import {
  User as UserIcon,
  Brain,
  Scale,
  Stethoscope,
  Building2,
  Hotel,
  Users,
  ArrowRight,
  Upload,
  CheckCircle2,
  Clock,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';

interface RegistrationFlowProps {
  onSuccess: (user: User, isAutoLogin: boolean) => void;
  onSwitchToLogin: () => void;
}

export const RegistrationFlow: React.FC<RegistrationFlowProps> = ({
  onSuccess,
  onSwitchToLogin,
}) => {
  const [selectedType, setSelectedType] = useState<AccountType | null>(null);
  const [submittedUser, setSubmittedUser] = useState<User | null>(null);

  // Common Fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [wilaya, setWilaya] = useState(ALGERIA_WILAYAS[15]); // الجزائر العاصمة
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Beneficiary specific
  const [birthDate, setBirthDate] = useState('');

  // Specialists specific (Psychologist, Lawyer, Doctor)
  const [specialty, setSpecialty] = useState('');
  const [address, setAddress] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [docFileName, setDocFileName] = useState('');

  // Institutions specific (Clinic, Hospital, Association)
  const [institutionName, setInstitutionName] = useState('');
  const [managerName, setManagerName] = useState('');
  const [servicesOffered, setServicesOffered] = useState('');
  const [activityField, setActivityField] = useState('');

  const accountTypesList = [
    {
      id: 'beneficiary' as AccountType,
      title: 'مستفيد / مستخدم',
      icon: '👤',
      desc: 'مواطن، متعافٍ، أو عائلة تبحث عن مرافقة، استشارات، أو مراكز علاج',
      isInstant: true,
    },
    {
      id: 'psychologist' as AccountType,
      title: 'أخصائي نفسي',
      icon: '🧠',
      desc: 'أخصائي نفسي عيادي معتمد لتقديم الاستشارات والمتابعة',
      isInstant: false,
    },
    {
      id: 'lawyer' as AccountType,
      title: 'محامي',
      icon: '⚖️',
      desc: 'محامٍ ومستشار قانوني معتمد لتقديم المرافقة والاستشارات (القانون 04-18)',
      isInstant: false,
    },
    {
      id: 'doctor' as AccountType,
      title: 'طبيب',
      icon: '🩺',
      desc: 'طبيب ممارس، طبيب عام، أو أخصائي في علاج السموم والطب النفسي',
      isInstant: false,
    },
    {
      id: 'clinic' as AccountType,
      title: 'عيادة خاصة',
      icon: '🏥',
      desc: 'مؤسسة صحية خاصة، عيادة طب نفسي، أو مركز علاج متخصص',
      isInstant: false,
    },
    {
      id: 'hospital' as AccountType,
      title: 'مستشفى خاص',
      icon: '🏨',
      desc: 'مستشفى استشفائي خاص، مصلحة إزالة السموم، طوارئ 24/24',
      isInstant: false,
    },
    {
      id: 'association' as AccountType,
      title: 'جمعية',
      icon: '🤝',
      desc: 'جمعية خيرية أو اجتماعية ناشطة في مكافحة الإدمان والمرافقة الأسرية',
      isInstant: false,
    },
  ];

  const handleFileUploadSim = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setDocFileName(e.target.files[0].name);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (password !== confirmPassword) {
      setErrorMsg('كلمة المرور وتأكيد كلمة المرور غير متطابقين!');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('يجب أن تتكون كلمة المرور من 6 أحرف أو أرقام على الأقل.');
      return;
    }

    if (selectedType === 'beneficiary' && !termsAgreed) {
      setErrorMsg('يرجى الموافقة على شروط الاستخدام وسياسة الخصوصية للمتابعة.');
      return;
    }

    const newId = Date.now();
    const isDirectActive = selectedType === 'beneficiary';

    let roleSlug: User['roleSlug'] = 'family';
    if (selectedType === 'beneficiary') roleSlug = 'family';
    else if (selectedType === 'psychologist') roleSlug = 'psychologist';
    else if (selectedType === 'lawyer') roleSlug = 'lawyer';
    else if (selectedType === 'doctor') roleSlug = 'doctor';
    else if (selectedType === 'clinic') roleSlug = 'clinic';
    else if (selectedType === 'hospital') roleSlug = 'hospital';
    else if (selectedType === 'association') roleSlug = 'association';

    const newUser: User = {
      id: newId,
      firstName:
        selectedType === 'clinic' ||
        selectedType === 'hospital' ||
        selectedType === 'association'
          ? institutionName
          : firstName,
      lastName:
        selectedType === 'clinic' ||
        selectedType === 'hospital' ||
        selectedType === 'association'
          ? `(مسؤول: ${managerName})`
          : lastName,
      email,
      phone,
      roleSlug,
      accountType: selectedType,
      wilayaName: wilaya,
      status: isDirectActive ? 'ACTIVE' : 'PENDING_REVIEW',
      birthDate: selectedType === 'beneficiary' ? birthDate : undefined,
      specialty:
        selectedType === 'psychologist' || selectedType === 'doctor'
          ? specialty
          : undefined,
      address:
        selectedType !== 'beneficiary' ? address : undefined,
      licenseNumber:
        selectedType === 'psychologist' ||
        selectedType === 'lawyer' ||
        selectedType === 'doctor'
          ? licenseNumber
          : undefined,
      uploadedDocuments: docFileName ? [docFileName] : ['الوثائق_المهنية_المرفقة.pdf'],
      institutionName:
        selectedType === 'clinic' ||
        selectedType === 'hospital' ||
        selectedType === 'association'
          ? institutionName
          : undefined,
      managerName:
        selectedType === 'clinic' ||
        selectedType === 'hospital' ||
        selectedType === 'association'
          ? managerName
          : undefined,
      servicesOffered:
        selectedType === 'clinic' || selectedType === 'hospital'
          ? servicesOffered
          : undefined,
      activityField:
        selectedType === 'association' ? activityField : undefined,
      createdAt: 'اليوم',
    };

    if (isDirectActive) {
      onSuccess(newUser, true);
    } else {
      setSubmittedUser(newUser);
      onSuccess(newUser, false);
    }
  };

  // Submission confirmation for pending review accounts
  if (submittedUser) {
    return (
      <div className="text-center py-6 px-4 space-y-4">
        <div className="w-16 h-16 bg-[#FFF3E0] text-[#E65100] rounded-full flex items-center justify-center mx-auto shadow-xs border border-[#FFE0B2]">
          <Clock className="w-8 h-8 animate-pulse" />
        </div>

        <div className="space-y-1">
          <h3 className="text-[20px] font-black text-[#203945]">
            تم إرسال طلب التسجيل بنجاح!
          </h3>
          <p className="text-[13px] font-bold text-[#E65100]">
            الحالة: «قيد المراجعة»
          </p>
        </div>

        <div className="bg-[#FBFDFC] p-4 rounded-[16px] border border-[#E5ECE9] text-xs text-[#203945]/80 space-y-2 text-right">
          <p className="leading-relaxed">
            مرحباً بك، <strong>{submittedUser.firstName} {submittedUser.lastName}</strong>.
          </p>
          <p className="leading-relaxed">
            تم استلام ملف تسجيلك كـ (
            <span className="font-bold text-[#1766A6]">
              {accountTypesList.find((t) => t.id === submittedUser.accountType)?.title}
            </span>
            ) بنجاح.
          </p>
          <p className="leading-relaxed text-[#104A78] bg-[#EAF3F8] p-2.5 rounded-[10px] border border-[#DCEBF4]">
            🛡️ <strong>إشعار المراجعة والاعتماد:</strong> تخضع حسابات المختصين والمؤسسات الصحية والقانونية لمراجعة وتدقيق الإدارة للتأكد من صحة أرقام الاعتماد والوثائق المهنية لضمان معايير الجودة والسلامة.
          </p>
          <p className="leading-relaxed">
            سيتم تفعيل حسابك فور الانتهاء من المراجعة والمصادقة عليه من قبل المشرف العام.
          </p>
        </div>

        <div className="pt-2">
          <button
            onClick={onSwitchToLogin}
            className="w-full py-3 rounded-[12px] bg-[#1766A6] text-white font-bold text-xs hover:bg-[#125386] transition-colors shadow-xs"
          >
            العودة إلى شاشة تسجيل الدخول
          </button>
        </div>
      </div>
    );
  }

  // STEP 1: اختيار نوع المسجل («المسجل كـ؟»)
  if (!selectedType) {
    return (
      <div className="space-y-4">
        <div className="text-center space-y-1">
          <h3 className="text-[20px] font-black text-[#203945]">
            إنشاء حساب جديد
          </h3>
          <p className="text-[14px] font-black text-[#1766A6]">
            «المسجل كـ؟»
          </p>
          <p className="text-[11px] text-[#203945]/70">
            حدد صفة الحساب لعرض استمارة التسجيل المناسبة
          </p>
        </div>

        {/* Cards Grid as requested by user */}
        <div className="space-y-2 max-h-[55vh] overflow-y-auto px-0.5">
          {accountTypesList.map((type) => (
            <button
              key={type.id}
              type="button"
              onClick={() => setSelectedType(type.id)}
              className="w-full p-3.5 rounded-[14px] border border-[#CCD8D5] bg-[#FBFDFC] hover:bg-[#EAF3F8] hover:border-[#1766A6] transition-all flex items-center justify-between gap-3 text-right group shadow-2xs hover:shadow-xs"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl p-2 rounded-xl bg-white shadow-2xs border border-[#CCD8D5]/50 group-hover:scale-105 transition-transform">
                  {type.icon}
                </span>
                <div>
                  <h4 className="font-black text-[14px] sm:text-[15px] text-[#203945] group-hover:text-[#1766A6] transition-colors">
                    {type.title}
                  </h4>
                  <p className="text-[11px] text-[#203945]/70 leading-normal">
                    {type.desc}
                  </p>
                </div>
              </div>

              <div className="shrink-0 flex items-center gap-1.5">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-[6px] hidden sm:inline-block ${
                    type.isInstant
                      ? 'bg-[#E8F4EF] text-[#1A5E4D]'
                      : 'bg-[#FFF3E0] text-[#E65100]'
                  }`}
                >
                  {type.isInstant ? 'تفعيل مباشر' : 'مراجعة واعتماد'}
                </span>
                <span className="text-[#1766A6] font-bold text-sm">←</span>
              </div>
            </button>
          ))}
        </div>

        <div className="pt-2 border-t border-[#E5ECE9] flex items-center justify-between text-xs">
          <span className="text-[#203945]/70">لديك حساب مسجل بالفعل؟</span>
          <button
            onClick={onSwitchToLogin}
            className="font-bold text-[#1766A6] underline hover:opacity-85"
          >
            تسجيل الدخول ←
          </button>
        </div>
      </div>
    );
  }

  // STEP 2: استمارة التسجيل الديناميكية حسب النوع المختار
  const currentTypeInfo = accountTypesList.find((t) => t.id === selectedType);

  return (
    <div className="space-y-4">
      {/* Step Header & Change Type Button */}
      <div className="flex items-center justify-between border-b border-[#E5ECE9] pb-3">
        <button
          type="button"
          onClick={() => {
            setSelectedType(null);
            setErrorMsg('');
          }}
          className="flex items-center gap-1 text-xs font-bold text-[#1766A6] hover:underline"
        >
          <ArrowRight className="w-3.5 h-3.5" />
          <span>تغيير نوع الحساب</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-lg">{currentTypeInfo?.icon}</span>
          <span className="text-xs font-black text-[#203945] bg-[#EAF3F8] px-2.5 py-1 rounded-[8px]">
            {currentTypeInfo?.title}
          </span>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-[#FBECEB] border border-[#F5D4D2] text-[#5F1D1A] p-2.5 rounded-[10px] text-xs font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-[#A64842]" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Dynamic Form based on selectedType */}
      <form onSubmit={handleSubmit} className="space-y-3 max-h-[55vh] overflow-y-auto px-0.5">
        {/* ========================================================================= */}
        {/* 1. 👤 مستفيد / مستخدم */}
        {/* ========================================================================= */}
        {selectedType === 'beneficiary' && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-bold text-[#203945] mb-1">
                  الاسم <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="محمد"
                  className="w-full p-2.5 text-xs bg-white border border-[#CCD8D5] rounded-[10px] focus:border-[#1766A6]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#203945] mb-1">
                  اللقب <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="بن خالد"
                  className="w-full p-2.5 text-xs bg-white border border-[#CCD8D5] rounded-[10px] focus:border-[#1766A6]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#203945] mb-1">
                تاريخ الميلاد (عند الحاجة)
              </label>
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="w-full p-2.5 text-xs bg-white border border-[#CCD8D5] rounded-[10px] focus:border-[#1766A6]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-bold text-[#203945] mb-1">
                  رقم الهاتف <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="tel"
                  dir="ltr"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0555123456"
                  className="w-full p-2.5 text-xs bg-white border border-[#CCD8D5] rounded-[10px] text-right focus:border-[#1766A6]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#203945] mb-1">
                  البريد الإلكتروني <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="email"
                  dir="ltr"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@mail.com"
                  className="w-full p-2.5 text-xs bg-white border border-[#CCD8D5] rounded-[10px] text-right focus:border-[#1766A6]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#203945] mb-1">
                الولاية <span className="text-red-500">*</span>
              </label>
              <select
                value={wilaya}
                onChange={(e) => setWilaya(e.target.value)}
                className="w-full p-2.5 text-xs bg-white border border-[#CCD8D5] rounded-[10px] focus:border-[#1766A6]"
              >
                {ALGERIA_WILAYAS.map((w) => (
                  <option key={w} value={w}>
                    {w}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-bold text-[#203945] mb-1">
                  كلمة المرور <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full p-2.5 text-xs bg-white border border-[#CCD8D5] rounded-[10px] focus:border-[#1766A6]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#203945] mb-1">
                  تأكيد كلمة المرور <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full p-2.5 text-xs bg-white border border-[#CCD8D5] rounded-[10px] focus:border-[#1766A6]"
                />
              </div>
            </div>

            <label className="flex items-start gap-2 pt-1 cursor-pointer">
              <input
                required
                type="checkbox"
                checked={termsAgreed}
                onChange={(e) => setTermsAgreed(e.target.checked)}
                className="accent-[#1766A6] w-4 h-4 mt-0.5 shrink-0"
              />
              <span className="text-[11px] text-[#203945]/80 leading-snug">
                أوافق على <strong>شروط الاستخدام وسياسة الخصوصية</strong> وحماية البيانات الشخصية، وأؤكد دقة المعلومات المدخلة.
              </span>
            </label>
          </>
        )}

        {/* ========================================================================= */}
        {/* 2. 🧠 أخصائي نفسي */}
        {/* ========================================================================= */}
        {selectedType === 'psychologist' && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-bold text-[#203945] mb-1">
                  الاسم <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="د. أمين"
                  className="w-full p-2.5 text-xs bg-white border border-[#CCD8D5] rounded-[10px]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#203945] mb-1">
                  اللقب <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="منصوري"
                  className="w-full p-2.5 text-xs bg-white border border-[#CCD8D5] rounded-[10px]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#203945] mb-1">
                التخصص الدقيق <span className="text-red-500">*</span>
              </label>
              <input
                required
                type="text"
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                placeholder="أخصائي نفسي عيادي - علاج الإدمان والصدمات النفسية"
                className="w-full p-2.5 text-xs bg-white border border-[#CCD8D5] rounded-[10px]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-bold text-[#203945] mb-1">
                  رقم الهاتف <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="tel"
                  dir="ltr"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0666987654"
                  className="w-full p-2.5 text-xs bg-white border border-[#CCD8D5] rounded-[10px] text-right"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#203945] mb-1">
                  البريد الإلكتروني المهني <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="email"
                  dir="ltr"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="psy.mansouri@dz.com"
                  className="w-full p-2.5 text-xs bg-white border border-[#CCD8D5] rounded-[10px] text-right"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-bold text-[#203945] mb-1">
                  الولاية <span className="text-red-500">*</span>
                </label>
                <select
                  value={wilaya}
                  onChange={(e) => setWilaya(e.target.value)}
                  className="w-full p-2.5 text-xs bg-white border border-[#CCD8D5] rounded-[10px]"
                >
                  {ALGERIA_WILAYAS.map((w) => (
                    <option key={w} value={w}>
                      {w}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#203945] mb-1">
                  العنوان المهني (العيادة / المكتب) <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="حي العقيد لطفي، وهران"
                  className="w-full p-2.5 text-xs bg-white border border-[#CCD8D5] rounded-[10px]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#203945] mb-1">
                رقم الاعتماد / الوثيقة المهنية (عند الحاجة)
              </label>
              <input
                type="text"
                value={licenseNumber}
                onChange={(e) => setLicenseNumber(e.target.value)}
                placeholder="PSY-DZ-2024-XXXX"
                className="w-full p-2.5 text-xs bg-white border border-[#CCD8D5] rounded-[10px]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#203945] mb-1">
                رفع الوثائق المهنية (شهادة التخرج / رخصة الممارسة) <span className="text-red-500">*</span>
              </label>
              <div className="border border-dashed border-[#CCD8D5] rounded-[10px] p-3 text-center bg-[#FBFDFC] hover:bg-[#EAF3F8] transition-colors relative">
                <input
                  type="file"
                  onChange={handleFileUploadSim}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <Upload className="w-5 h-5 text-[#1766A6] mx-auto mb-1" />
                <span className="text-xs text-[#203945] font-semibold block">
                  {docFileName ? `الملف المختار: ${docFileName}` : 'انقر لرفع ملف PDF أو صورة الوثيقة'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-bold text-[#203945] mb-1">
                  كلمة المرور <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full p-2.5 text-xs bg-white border border-[#CCD8D5] rounded-[10px]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#203945] mb-1">
                  تأكيد كلمة المرور <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full p-2.5 text-xs bg-white border border-[#CCD8D5] rounded-[10px]"
                />
              </div>
            </div>

            <div className="bg-[#FFF3E0] p-2.5 rounded-[10px] border border-[#FFE0B2] text-[11px] text-[#E65100] font-semibold flex items-center gap-2">
              <Clock className="w-4 h-4 shrink-0" />
              <span>الحساب يكون «قيد المراجعة» إلى أن يعتمد الأدمن الحساب بعد التحقق من الوثائق.</span>
            </div>
          </>
        )}

        {/* ========================================================================= */}
        {/* 3. ⚖️ محامي */}
        {/* ========================================================================= */}
        {selectedType === 'lawyer' && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-bold text-[#203945] mb-1">
                  الاسم <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="أستاذ ياسين"
                  className="w-full p-2.5 text-xs bg-white border border-[#CCD8D5] rounded-[10px]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#203945] mb-1">
                  اللقب <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="بوعلام"
                  className="w-full p-2.5 text-xs bg-white border border-[#CCD8D5] rounded-[10px]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-bold text-[#203945] mb-1">
                  رقم الهاتف <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="tel"
                  dir="ltr"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0771122334"
                  className="w-full p-2.5 text-xs bg-white border border-[#CCD8D5] rounded-[10px] text-right"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#203945] mb-1">
                  البريد الإلكتروني المهني <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="email"
                  dir="ltr"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="avocat.boualam@dz.com"
                  className="w-full p-2.5 text-xs bg-white border border-[#CCD8D5] rounded-[10px] text-right"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-bold text-[#203945] mb-1">
                  الولاية / منظمة المحامين <span className="text-red-500">*</span>
                </label>
                <select
                  value={wilaya}
                  onChange={(e) => setWilaya(e.target.value)}
                  className="w-full p-2.5 text-xs bg-white border border-[#CCD8D5] rounded-[10px]"
                >
                  {ALGERIA_WILAYAS.map((w) => (
                    <option key={w} value={w}>
                      {w}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#203945] mb-1">
                  العنوان المهني (مكتب المحاماة) <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="شارع العربي بن مهيدي، قسنطينة"
                  className="w-full p-2.5 text-xs bg-white border border-[#CCD8D5] rounded-[10px]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#203945] mb-1">
                رقم التسجيل / الاعتماد المهني (منظمة المحامين) <span className="text-red-500">*</span>
              </label>
              <input
                required
                type="text"
                value={licenseNumber}
                onChange={(e) => setLicenseNumber(e.target.value)}
                placeholder="LAW-CONST-2018-091"
                className="w-full p-2.5 text-xs bg-white border border-[#CCD8D5] rounded-[10px]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#203945] mb-1">
                رفع الوثائق المطلوبة (بطاقة المحامي / شهادة التسجيل) <span className="text-red-500">*</span>
              </label>
              <div className="border border-dashed border-[#CCD8D5] rounded-[10px] p-3 text-center bg-[#FBFDFC] relative">
                <input
                  type="file"
                  onChange={handleFileUploadSim}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <Upload className="w-5 h-5 text-[#1766A6] mx-auto mb-1" />
                <span className="text-xs text-[#203945] font-semibold block">
                  {docFileName ? `الملف المختار: ${docFileName}` : 'انقر لرفع ملف الوثائق المطلوبة'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-bold text-[#203945] mb-1">
                  كلمة المرور <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full p-2.5 text-xs bg-white border border-[#CCD8D5] rounded-[10px]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#203945] mb-1">
                  تأكيد كلمة المرور <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full p-2.5 text-xs bg-white border border-[#CCD8D5] rounded-[10px]"
                />
              </div>
            </div>

            <div className="bg-[#EAF3F8] p-2.5 rounded-[10px] border border-[#DCEBF4] text-[11px] text-[#104A78] font-bold flex items-center justify-between">
              <span>مسار التفعيل:</span>
              <span>قيد المراجعة → معتمد → نشط</span>
            </div>
          </>
        )}

        {/* ========================================================================= */}
        {/* 4. 🩺 طبيب */}
        {/* ========================================================================= */}
        {selectedType === 'doctor' && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-bold text-[#203945] mb-1">
                  الاسم <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="د. سارة"
                  className="w-full p-2.5 text-xs bg-white border border-[#CCD8D5] rounded-[10px]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#203945] mb-1">
                  اللقب <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="لعموري"
                  className="w-full p-2.5 text-xs bg-white border border-[#CCD8D5] rounded-[10px]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#203945] mb-1">
                التخصص الطبي <span className="text-red-500">*</span>
              </label>
              <input
                required
                type="text"
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                placeholder="طب عام / طب نفسي / علاج السموم والإدمان"
                className="w-full p-2.5 text-xs bg-white border border-[#CCD8D5] rounded-[10px]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-bold text-[#203945] mb-1">
                  رقم الهاتف <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="tel"
                  dir="ltr"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0558112233"
                  className="w-full p-2.5 text-xs bg-white border border-[#CCD8D5] rounded-[10px] text-right"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#203945] mb-1">
                  البريد الإلكتروني <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="email"
                  dir="ltr"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="dr.laamouri@dz.com"
                  className="w-full p-2.5 text-xs bg-white border border-[#CCD8D5] rounded-[10px] text-right"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-bold text-[#203945] mb-1">
                  الولاية <span className="text-red-500">*</span>
                </label>
                <select
                  value={wilaya}
                  onChange={(e) => setWilaya(e.target.value)}
                  className="w-full p-2.5 text-xs bg-white border border-[#CCD8D5] rounded-[10px]"
                >
                  {ALGERIA_WILAYAS.map((w) => (
                    <option key={w} value={w}>
                      {w}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#203945] mb-1">
                  العنوان المهني <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="نهج أول نوفمبر، سطيف"
                  className="w-full p-2.5 text-xs bg-white border border-[#CCD8D5] rounded-[10px]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#203945] mb-1">
                رقم الاعتماد المهني (عمادة الأطباء) <span className="text-red-500">*</span>
              </label>
              <input
                required
                type="text"
                value={licenseNumber}
                onChange={(e) => setLicenseNumber(e.target.value)}
                placeholder="DOC-SETIF-2016-340"
                className="w-full p-2.5 text-xs bg-white border border-[#CCD8D5] rounded-[10px]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#203945] mb-1">
                الوثائق المهنية (ترخيص الممارسة / شهادة التخصص) <span className="text-red-500">*</span>
              </label>
              <div className="border border-dashed border-[#CCD8D5] rounded-[10px] p-3 text-center bg-[#FBFDFC] relative">
                <input
                  type="file"
                  onChange={handleFileUploadSim}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <Upload className="w-5 h-5 text-[#1766A6] mx-auto mb-1" />
                <span className="text-xs text-[#203945] font-semibold block">
                  {docFileName ? `الملف: ${docFileName}` : 'رفع ملف الوثائق المهنية'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-bold text-[#203945] mb-1">
                  كلمة المرور <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full p-2.5 text-xs bg-white border border-[#CCD8D5] rounded-[10px]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#203945] mb-1">
                  تأكيد كلمة المرور <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full p-2.5 text-xs bg-white border border-[#CCD8D5] rounded-[10px]"
                />
              </div>
            </div>

            <div className="bg-[#FFF3E0] p-2 rounded-[8px] border border-[#FFE0B2] text-[11px] text-[#E65100] font-bold text-center">
              حالة الحساب: قيد المراجعة من الإدارة قبل التفعيل
            </div>
          </>
        )}

        {/* ========================================================================= */}
        {/* 5. 🏥 عيادة خاصة */}
        {/* ========================================================================= */}
        {selectedType === 'clinic' && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-bold text-[#203945] mb-1">
                  اسم العيادة الخاصة <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="text"
                  value={institutionName}
                  onChange={(e) => setInstitutionName(e.target.value)}
                  placeholder="العيادة الطبية المتخصصة الشفاء"
                  className="w-full p-2.5 text-xs bg-white border border-[#CCD8D5] rounded-[10px]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#203945] mb-1">
                  اسم المسؤول / المدير الطبي <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="text"
                  value={managerName}
                  onChange={(e) => setManagerName(e.target.value)}
                  placeholder="د. نادية فرحاتي"
                  className="w-full p-2.5 text-xs bg-white border border-[#CCD8D5] rounded-[10px]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-bold text-[#203945] mb-1">
                  الهاتف <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="tel"
                  dir="ltr"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="021445566"
                  className="w-full p-2.5 text-xs bg-white border border-[#CCD8D5] rounded-[10px] text-right"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#203945] mb-1">
                  البريد الإلكتروني الرسمي <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="email"
                  dir="ltr"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contact@clinique-chifa.dz"
                  className="w-full p-2.5 text-xs bg-white border border-[#CCD8D5] rounded-[10px] text-right"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-bold text-[#203945] mb-1">
                  الولاية <span className="text-red-500">*</span>
                </label>
                <select
                  value={wilaya}
                  onChange={(e) => setWilaya(e.target.value)}
                  className="w-full p-2.5 text-xs bg-white border border-[#CCD8D5] rounded-[10px]"
                >
                  {ALGERIA_WILAYAS.map((w) => (
                    <option key={w} value={w}>
                      {w}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#203945] mb-1">
                  العنوان التفصيلي <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="حي حيدرة، الجزائر العاصمة"
                  className="w-full p-2.5 text-xs bg-white border border-[#CCD8D5] rounded-[10px]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#203945] mb-1">
                التخصصات والخدمات المقدمة <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                rows={2}
                value={servicesOffered}
                onChange={(e) => setServicesOffered(e.target.value)}
                placeholder="إزالة السموم، استشفاء نهاري، متابعة نفسية وعلاجية مكثفة..."
                className="w-full p-2.5 text-xs bg-white border border-[#CCD8D5] rounded-[10px]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#203945] mb-1">
                الوثائق القانونية / المهنية (الترخيص الوزاري لفتح المؤسسة الصحية) <span className="text-red-500">*</span>
              </label>
              <div className="border border-dashed border-[#CCD8D5] rounded-[10px] p-3 text-center bg-[#FBFDFC] relative">
                <input
                  type="file"
                  onChange={handleFileUploadSim}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <Upload className="w-5 h-5 text-[#1766A6] mx-auto mb-1" />
                <span className="text-xs text-[#203945] font-semibold block">
                  {docFileName ? `الملف: ${docFileName}` : 'رفع وثائق الترخيص والاعتماد'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-bold text-[#203945] mb-1">
                  كلمة المرور <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full p-2.5 text-xs bg-white border border-[#CCD8D5] rounded-[10px]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#203945] mb-1">
                  تأكيد كلمة المرور <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full p-2.5 text-xs bg-white border border-[#CCD8D5] rounded-[10px]"
                />
              </div>
            </div>

            <div className="bg-[#FFF3E0] p-2 rounded-[8px] border border-[#FFE0B2] text-[11px] text-[#E65100] font-bold text-center">
              حالة الحساب: قيد المراجعة الإدارية
            </div>
          </>
        )}

        {/* ========================================================================= */}
        {/* 6. 🏨 مستشفى خاص */}
        {/* ========================================================================= */}
        {selectedType === 'hospital' && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-bold text-[#203945] mb-1">
                  اسم المستشفى الخاص <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="text"
                  value={institutionName}
                  onChange={(e) => setInstitutionName(e.target.value)}
                  placeholder="مستشفى النور الطبي الاستشفائي الخاص"
                  className="w-full p-2.5 text-xs bg-white border border-[#CCD8D5] rounded-[10px]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#203945] mb-1">
                  اسم المسؤول / المدير العام <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="text"
                  value={managerName}
                  onChange={(e) => setManagerName(e.target.value)}
                  placeholder="د. بلال مراد"
                  className="w-full p-2.5 text-xs bg-white border border-[#CCD8D5] rounded-[10px]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-bold text-[#203945] mb-1">
                  الهاتف <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="tel"
                  dir="ltr"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="041223344"
                  className="w-full p-2.5 text-xs bg-white border border-[#CCD8D5] rounded-[10px] text-right"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#203945] mb-1">
                  البريد الإلكتروني <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="email"
                  dir="ltr"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="direction@hopital-nour.dz"
                  className="w-full p-2.5 text-xs bg-white border border-[#CCD8D5] rounded-[10px] text-right"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-bold text-[#203945] mb-1">
                  الولاية <span className="text-red-500">*</span>
                </label>
                <select
                  value={wilaya}
                  onChange={(e) => setWilaya(e.target.value)}
                  className="w-full p-2.5 text-xs bg-white border border-[#CCD8D5] rounded-[10px]"
                >
                  {ALGERIA_WILAYAS.map((w) => (
                    <option key={w} value={w}>
                      {w}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#203945] mb-1">
                  العنوان <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="حي الصديقية، وهران"
                  className="w-full p-2.5 text-xs bg-white border border-[#CCD8D5] rounded-[10px]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#203945] mb-1">
                الخدمات والتخصصات الاستشفائية <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                rows={2}
                value={servicesOffered}
                onChange={(e) => setServicesOffered(e.target.value)}
                placeholder="طوارئ سموم 24/24، أسرة إنعاش، جناح إزالة السموم، فريق طبي متخصص..."
                className="w-full p-2.5 text-xs bg-white border border-[#CCD8D5] rounded-[10px]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#203945] mb-1">
                الوثائق والاعتمادات الوزارية <span className="text-red-500">*</span>
              </label>
              <div className="border border-dashed border-[#CCD8D5] rounded-[10px] p-3 text-center bg-[#FBFDFC] relative">
                <input
                  type="file"
                  onChange={handleFileUploadSim}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <Upload className="w-5 h-5 text-[#1766A6] mx-auto mb-1" />
                <span className="text-xs text-[#203945] font-semibold block">
                  {docFileName ? `الملف: ${docFileName}` : 'رفع وثائق الاعتماد الاستشفائي'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-bold text-[#203945] mb-1">
                  كلمة المرور <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full p-2.5 text-xs bg-white border border-[#CCD8D5] rounded-[10px]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#203945] mb-1">
                  تأكيد كلمة المرور <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full p-2.5 text-xs bg-white border border-[#CCD8D5] rounded-[10px]"
                />
              </div>
            </div>

            <div className="bg-[#FFF3E0] p-2 rounded-[8px] border border-[#FFE0B2] text-[11px] text-[#E65100] font-bold text-center">
              حالة الحساب: قيد المراجعة الإدارية
            </div>
          </>
        )}

        {/* ========================================================================= */}
        {/* 7. 🤝 جمعية */}
        {/* ========================================================================= */}
        {selectedType === 'association' && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-bold text-[#203945] mb-1">
                  اسم الجمعية <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="text"
                  value={institutionName}
                  onChange={(e) => setInstitutionName(e.target.value)}
                  placeholder="جمعية النجاة لمكافحة الآفات الاجتماعية"
                  className="w-full p-2.5 text-xs bg-white border border-[#CCD8D5] rounded-[10px]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#203945] mb-1">
                  اسم المسؤول / رئيس الجمعية <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="text"
                  value={managerName}
                  onChange={(e) => setManagerName(e.target.value)}
                  placeholder="السيد عبد القادر بن عيسى"
                  className="w-full p-2.5 text-xs bg-white border border-[#CCD8D5] rounded-[10px]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-bold text-[#203945] mb-1">
                  رقم الهاتف <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="tel"
                  dir="ltr"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="031445566"
                  className="w-full p-2.5 text-xs bg-white border border-[#CCD8D5] rounded-[10px] text-right"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#203945] mb-1">
                  البريد الإلكتروني للجمعية <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="email"
                  dir="ltr"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contact@najat-assoc.dz"
                  className="w-full p-2.5 text-xs bg-white border border-[#CCD8D5] rounded-[10px] text-right"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-bold text-[#203945] mb-1">
                  الولاية <span className="text-red-500">*</span>
                </label>
                <select
                  value={wilaya}
                  onChange={(e) => setWilaya(e.target.value)}
                  className="w-full p-2.5 text-xs bg-white border border-[#CCD8D5] rounded-[10px]"
                >
                  {ALGERIA_WILAYAS.map((w) => (
                    <option key={w} value={w}>
                      {w}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#203945] mb-1">
                  العنوان ومقر الجمعية <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="وسط المدينة، عنابة"
                  className="w-full p-2.5 text-xs bg-white border border-[#CCD8D5] rounded-[10px]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#203945] mb-1">
                مجال نشاط الجمعية <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                rows={2}
                value={activityField}
                onChange={(e) => setActivityField(e.target.value)}
                placeholder="المرافقة الأسرية، الحملات التوعوية بالمدارس والجامعات، إرشاد وإدماج الشباب..."
                className="w-full p-2.5 text-xs bg-white border border-[#CCD8D5] rounded-[10px]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#203945] mb-1">
                الوثائق القانونية (وصل إيداع التأسيس / الاعتماد الولائي أو الوطني) <span className="text-red-500">*</span>
              </label>
              <div className="border border-dashed border-[#CCD8D5] rounded-[10px] p-3 text-center bg-[#FBFDFC] relative">
                <input
                  type="file"
                  onChange={handleFileUploadSim}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <Upload className="w-5 h-5 text-[#1766A6] mx-auto mb-1" />
                <span className="text-xs text-[#203945] font-semibold block">
                  {docFileName ? `الملف: ${docFileName}` : 'رفع وصل الاعتماد القانوني للجمعية'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-bold text-[#203945] mb-1">
                  كلمة المرور <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full p-2.5 text-xs bg-white border border-[#CCD8D5] rounded-[10px]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#203945] mb-1">
                  تأكيد كلمة المرور <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full p-2.5 text-xs bg-white border border-[#CCD8D5] rounded-[10px]"
                />
              </div>
            </div>

            <div className="bg-[#FFF3E0] p-2 rounded-[8px] border border-[#FFE0B2] text-[11px] text-[#E65100] font-bold text-center">
              حالة الحساب: قيد المراجعة الإدارية
            </div>
          </>
        )}

        <div className="pt-2">
          <button
            type="submit"
            className="w-full py-3 rounded-[12px] bg-[#1766A6] hover:bg-[#125386] text-white font-bold text-[14px] transition-colors shadow-xs"
          >
            {selectedType === 'beneficiary'
              ? 'إنشاء الحساب وبدء الاستخدام مباشرة'
              : 'إرسال طلب التسجيل والاعتماد للمراجعة'}
          </button>
        </div>
      </form>
    </div>
  );
};
