import React, { useState } from 'react';
import { ArrowRight, CheckCircle2, KeyRound, Mail, Phone, ShieldCheck } from 'lucide-react';
import { AccountSettingsUpdate } from '../services/dbService';
import { User } from '../types';

interface AccountSettingsViewProps {
  currentUser: User;
  onSave: (updates: AccountSettingsUpdate) => Promise<User>;
  onBack?: () => void;
}

export const AccountSettingsView: React.FC<AccountSettingsViewProps> = ({
  currentUser,
  onSave,
  onBack,
}) => {
  const [email, setEmail] = useState(currentUser.email || '');
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    const wantsEmailChange = email.trim().toLowerCase() !== currentUser.email.trim().toLowerCase();
    const wantsPasswordChange = Boolean(newPassword || confirmPassword);
    const requiresCurrentPassword = wantsEmailChange || wantsPasswordChange;
    if (!phone.trim()) {
      setError('رقم الهاتف مطلوب.');
      return;
    }
    if (requiresCurrentPassword && !currentPassword) {
      setError('أدخل كلمة المرور الحالية لتغيير البريد الإلكتروني أو كلمة المرور.');
      return;
    }
    if (wantsPasswordChange) {
      if (!newPassword) {
        setError('أدخل كلمة المرور الجديدة.');
        return;
      }
      if (newPassword.length < 10) {
        setError('يجب أن تتكون كلمة المرور الجديدة من 10 أحرف على الأقل.');
        return;
      }
      if (newPassword !== confirmPassword) {
        setError('تأكيد كلمة المرور الجديدة غير متطابق.');
        return;
      }
    }

    setBusy(true);
    try {
      const updates: AccountSettingsUpdate = {
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        ...(requiresCurrentPassword ? { currentPassword } : {}),
        ...(wantsPasswordChange ? { newPassword } : {}),
      };
      const updatedUser = await onSave(updates);
      setEmail(updatedUser.email);
      setPhone(updatedUser.phone || phone.trim());
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSuccess('تم حفظ إعدادات الحساب بنجاح.');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'تعذر حفظ إعدادات الحساب.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="mx-auto w-full max-w-3xl space-y-5" dir="rtl">
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-[#25866D]">إدارة بيانات الدخول والتواصل</p>
          <h1 className="mt-1 text-2xl font-black text-[#203945]">إعدادات الحساب</h1>
          <p className="mt-1 text-sm text-[#203945]/65">
            حدّث بريدك الإلكتروني أو رقم هاتفك أو كلمة المرور. يتطلب تغيير البريد أو كلمة المرور تأكيد كلمة المرور الحالية.
          </p>
        </div>
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="flex min-h-11 shrink-0 items-center gap-1 rounded-xl border border-[#CCD8D5] bg-white px-3 text-sm font-bold text-[#203945] hover:bg-[#F3F7F6]"
          >
            <ArrowRight className="h-4 w-4" />
            رجوع
          </button>
        )}
      </header>

      <div className="flex items-start gap-3 rounded-2xl border border-[#DCEBF4] bg-[#EAF3F8] p-4 text-sm leading-relaxed text-[#104A78]">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
        <p>
          الحساب: <strong>{currentUser.email}</strong>. لا تُعرض كلمة المرور الحالية ولا تُحفظ إلا بعد
          التحقق منها على الخادم.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-[#E0E8E6] bg-white p-5 shadow-xs sm:p-6">
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-[#1766A6]" />
            <h2 className="font-black text-[#203945]">البريد الإلكتروني</h2>
          </div>
          <label htmlFor="account-email" className="block text-sm font-bold text-[#203945]">
            البريد الإلكتروني المسجل
          </label>
          <input
            id="account-email"
            name="email"
            type="email"
            required
            maxLength={254}
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="min-h-12 w-full rounded-xl border border-[#CCD8D5] px-3 text-base outline-none focus:border-[#1766A6] focus:ring-2 focus:ring-[#1766A6]/15"
          />
        </section>

        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Phone className="h-5 w-5 text-[#1766A6]" />
            <h2 className="font-black text-[#203945]">رقم الهاتف</h2>
          </div>
          <label htmlFor="account-phone" className="block text-sm font-bold text-[#203945]">
            رقم الهاتف المسجل
          </label>
          <input
            id="account-phone"
            name="phone"
            type="tel"
            required
            maxLength={30}
            autoComplete="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="مثال: 0550 12 34 56"
            className="min-h-12 w-full rounded-xl border border-[#CCD8D5] px-3 text-base outline-none focus:border-[#1766A6] focus:ring-2 focus:ring-[#1766A6]/15"
          />
          <p className="text-xs text-[#203945]/60">أدخل رقمًا صالحًا يتضمن من 7 إلى 15 رقمًا.</p>
        </section>

        <section className="space-y-3 border-t border-[#E0E8E6] pt-5">
          <div className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-[#1766A6]" />
            <h2 className="font-black text-[#203945]">تغيير كلمة المرور</h2>
          </div>
          <p className="text-sm text-[#203945]/65">
            أدخل كلمة المرور الحالية لتغيير البريد الإلكتروني أو كلمة المرور، واترك حقلي كلمة المرور الجديدة فارغين إذا كنت لا تريد تغييرها.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1.5 text-sm font-bold text-[#203945]">
              كلمة المرور الحالية
              <input
                type="password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                className="min-h-12 w-full rounded-xl border border-[#CCD8D5] px-3 font-normal outline-none focus:border-[#1766A6] focus:ring-2 focus:ring-[#1766A6]/15"
              />
            </label>
            <label className="space-y-1.5 text-sm font-bold text-[#203945]">
              كلمة المرور الجديدة
              <input
                type="password"
                autoComplete="new-password"
                minLength={10}
                maxLength={128}
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                className="min-h-12 w-full rounded-xl border border-[#CCD8D5] px-3 font-normal outline-none focus:border-[#1766A6] focus:ring-2 focus:ring-[#1766A6]/15"
              />
            </label>
            <label className="space-y-1.5 text-sm font-bold text-[#203945] sm:col-span-2">
              تأكيد كلمة المرور الجديدة
              <input
                type="password"
                autoComplete="new-password"
                minLength={10}
                maxLength={128}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="min-h-12 w-full rounded-xl border border-[#CCD8D5] px-3 font-normal outline-none focus:border-[#1766A6] focus:ring-2 focus:ring-[#1766A6]/15"
              />
            </label>
          </div>
        </section>

        {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-800">{error}</p>}
        {success && (
          <p role="status" className="flex items-center gap-2 rounded-xl bg-green-50 p-3 text-sm font-semibold text-green-800">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            {success}
          </p>
        )}
        <button
          type="submit"
          disabled={busy}
          className="min-h-12 w-full rounded-xl bg-[#1766A6] px-5 text-sm font-black text-white transition-colors hover:bg-[#125386] disabled:cursor-wait disabled:opacity-60 sm:w-auto"
        >
          {busy ? 'جارٍ الحفظ…' : 'حفظ التغييرات'}
        </button>
      </form>
    </section>
  );
};
