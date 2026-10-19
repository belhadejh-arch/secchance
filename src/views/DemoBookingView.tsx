import React, { useState } from 'react';
import { ServiceItem } from '../types';

interface Props {
  service: ServiceItem;
  onBook: (description: string, date: string, time: string) => Promise<void>;
  onBack: () => void;
}

export function DemoBookingView({ service, onBook, onBack }: Props) {
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  const [date, setDate] = useState(tomorrow);
  const [time, setTime] = useState('10:00');
  const [description, setDescription] = useState('');
  const [consent, setConsent] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setError('');
    try {
      await onBook(description.trim(), date, time);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'تعذر تسجيل الحجز.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="mx-auto max-w-xl space-y-4 rounded-2xl border border-[#CCD8D5] bg-white p-6" dir="rtl">
      <h1 className="text-xl font-black text-[#203945]">{service.title}</h1>
      <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-950">
        هذا المسار لتجربة الحجز والدفع الوهمي فقط. لا تُخصم أموال، ولا يُعيّن مختص حقيقي أو تُقدّم استشارة فعلية.
        يُحفظ الحجز في حسابك ويظهر في لوحة الإدارة.
      </p>
      <label className="block space-y-1 text-sm font-bold">
        <span>موضوع الحجز التجريبي</span>
        <textarea required minLength={5} maxLength={5000} value={description} onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded-lg border border-[#CCD8D5] p-3" placeholder="اكتب وصفًا مختصرًا دون معلومات حساسة" />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="block space-y-1 text-sm font-bold">
          <span>تاريخ الموعد التجريبي</span>
          <input type="date" required min={tomorrow} value={date} onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-lg border border-[#CCD8D5] p-3" />
        </label>
        <label className="block space-y-1 text-sm font-bold">
          <span>الساعة</span>
          <input type="time" required min="08:00" max="20:00" value={time} onChange={(e) => setTime(e.target.value)}
            className="w-full rounded-lg border border-[#CCD8D5] p-3" />
        </label>
      </div>
      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" required checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1" />
        أوافق على حفظ بيانات هذا الحجز وأفهم أن الدفع والموعد تجريبيان فقط.
      </label>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      <button disabled={saving || !consent} className="w-full rounded-xl bg-[#1766A6] p-3 font-bold text-white disabled:opacity-50">
        {saving ? 'جارٍ تسجيل الحجز…' : `متابعة إلى الدفع الوهمي — ${service.amountDzd} دج`}
      </button>
      <button type="button" onClick={onBack} className="w-full p-2 text-sm">العودة إلى الخدمات</button>
    </form>
  );
}
