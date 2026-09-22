import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Wilaya, RoleSlug, ALGERIA_WILAYAS } from '../types';
import { X, Shield, Lock, Mail, Phone, User, CheckCircle, AlertCircle } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'login' | 'register';
  defaultRole?: string;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'login',
  defaultRole = 'family'
}) => {
  const { login, register } = useAuth();
  const [tab, setTab] = useState<'login' | 'register'>(defaultTab);
  const [wilayas, setWilayas] = useState<Wilaya[]>(ALGERIA_WILAYAS);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [roleSlug, setRoleSlug] = useState<RoleSlug>((defaultRole as RoleSlug) || 'family');
  const [wilayaId, setWilayaId] = useState<number>(1);
  const [specialty, setSpecialty] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [entityName, setEntityName] = useState('');
  const [services, setServices] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setTab(defaultTab);
    if (defaultRole) setRoleSlug(defaultRole as RoleSlug);
  }, [defaultTab, defaultRole, isOpen]);

  useEffect(() => {
    api.getWilayas().then(res => res.data && setWilayas(res.data)).catch(() => {});
  }, []);

  if (!isOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      onClose();
    } catch (err: any) {
      setError(err.message || 'فشل تسجيل الدخول. يرجى التحقق من البيانات.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const msg = await register({
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
        password,
        role_slug: roleSlug,
        wilaya_id: wilayaId,
        specialty,
        license_number: licenseNumber,
        center_name: entityName,
        association_name: entityName,
        services
      });
      setSuccessMsg(msg);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'فشل التسجيل. يرجى مراجعة البيانات المدخلة.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200 text-right animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#1565C0] text-white flex items-center justify-center">
              <Shield className="w-4 h-4" />
            </div>
            <span className="font-extrabold text-slate-900 text-lg">منصة الفرصة الثانية</span>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex rounded-xl bg-slate-100 p-1 text-xs sm:text-sm font-bold">
          <button
            type="button"
            onClick={() => { setTab('login'); setError(null); }}
            className={`flex-1 py-2 rounded-lg transition-all ${tab === 'login' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'}`}
          >
            تسجيل الدخول
          </button>
          <button
            type="button"
            onClick={() => { setTab('register'); setError(null); }}
            className={`flex-1 py-2 rounded-lg transition-all ${tab === 'register' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'}`}
          >
            إنشاء حساب جديد
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-xs flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl text-xs flex items-center gap-2 font-bold">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Login Form */}
        {tab === 'login' ? (
          <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs sm:text-sm">
            <div>
              <label className="block font-bold text-slate-700 mb-1">البريد الإلكتروني:</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-3 pr-9 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#1565C0] outline-none text-left font-sans"
                  dir="ltr"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">كلمة المرور:</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-3 pr-9 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#1565C0] outline-none text-left font-sans"
                  dir="ltr"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#1565C0] hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold rounded-xl shadow-xs transition-all cursor-pointer"
            >
              {loading ? 'جاري التحقق...' : 'دخول إلى حسابي'}
            </button>

          </form>
        ) : (
          /* Register Form */
          <form onSubmit={handleRegisterSubmit} className="space-y-4 text-xs sm:text-sm">
            <div>
              <label className="block font-bold text-slate-700 mb-1">نوع الحساب:</label>
              <select
                value={roleSlug}
                onChange={(e) => setRoleSlug(e.target.value as RoleSlug)}
                className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#1565C0] outline-none font-bold"
              >
                <option value="family">ولي أمر / فرد من أسرة المريض</option>
                <option value="patient">مستفيد / طالب مساعدة مباشر</option>
                <option value="psychologist">أخصائي نفسي عيادي</option>
                <option value="lawyer">محامٍ ومستشار قانوني</option>
                <option value="treatment_center">مركز علاج وتأهيل الإدمان</option>
                <option value="association">جمعية مرافقة ودعم اجتماعي</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">الاسم الأول:</label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="محمد"
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#1565C0] outline-none"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">اسم العائلة:</label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="بن علي"
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#1565C0] outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">البريد الإلكتروني:</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#1565C0] outline-none text-left font-sans"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">رقم الهاتف:</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0550112233"
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#1565C0] outline-none text-left font-sans"
                  dir="ltr"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">الولاية:</label>
                <select
                  value={wilayaId}
                  onChange={(e) => setWilayaId(Number(e.target.value))}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#1565C0] outline-none"
                >
                  {wilayas.map(w => (
                    <option key={w.id} value={w.id}>{w.code} - {w.name_ar}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">كلمة المرور:</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="6 أحرف على الأقل"
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#1565C0] outline-none text-left font-sans"
                  dir="ltr"
                />
              </div>
            </div>

            {/* Conditional Specialist Fields */}
            {(roleSlug === 'psychologist' || roleSlug === 'lawyer') && (
              <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 space-y-3">
                <div className="font-bold text-xs text-[#1565C0]">بيانات الاعتماد المهني:</div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">التخصص الدقيق:</label>
                    <input
                      type="text"
                      value={specialty}
                      onChange={(e) => setSpecialty(e.target.value)}
                      placeholder="علاج سلوكي معرفي / جنائي"
                      className="w-full p-2 text-xs border border-slate-300 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">رقم الترخيص / القيد:</label>
                    <input
                      type="text"
                      value={licenseNumber}
                      onChange={(e) => setLicenseNumber(e.target.value)}
                      placeholder="DZ-PSY-1234"
                      className="w-full p-2 text-xs border border-slate-300 rounded-lg bg-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Conditional Center/Association Fields */}
            {(roleSlug === 'treatment_center' || roleSlug === 'association') && (
              <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100 space-y-3">
                <div className="font-bold text-xs text-[#2E7D32]">بيانات المؤسسة أو الجمعية:</div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">الاسم الرسمي للمؤسسة:</label>
                  <input
                    type="text"
                    value={entityName}
                    onChange={(e) => setEntityName(e.target.value)}
                    placeholder="مركز الأمل / جمعية الغد"
                    className="w-full p-2 text-xs border border-slate-300 rounded-lg bg-white"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#2E7D32] hover:bg-green-700 disabled:bg-slate-300 text-white font-bold rounded-xl shadow-xs transition-all cursor-pointer"
            >
              {loading ? 'جاري إنشاء الحساب...' : 'إتمام التسجيل'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
