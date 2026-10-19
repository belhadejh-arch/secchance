import React, { useState } from 'react';
import { CareRequest } from '../types';
import { CreditCard, Landmark, Lock, Shield, Wifi } from 'lucide-react';

interface PaymentViewProps {
  request: CareRequest | null;
  demoMode: boolean;
  onProcessPayment: (requestId: number | string, method: 'EDAHABIA' | 'CIB') => void | Promise<void>;
  onConfirmDemoPayment: (requestId: number | string) => void | Promise<void>;
  onCancel: () => void;
}

export const PaymentView: React.FC<PaymentViewProps> = ({
  request,
  demoMode,
  onProcessPayment,
  onConfirmDemoPayment,
  onCancel,
}) => {
  const [selectedMethod, setSelectedMethod] = useState<'EDAHABIA' | 'CIB'>('EDAHABIA');
  const [paymentError, setPaymentError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [demoCardNumber, setDemoCardNumber] = useState('');
  const [demoCardholder, setDemoCardholder] = useState('');
  const [demoExpiry, setDemoExpiry] = useState('');
  const [demoCvv, setDemoCvv] = useState('');

  if (!request) {
    return (
      <div className="text-center py-12 space-y-3">
        <p className="text-[#203945] font-semibold">لم يتم تحديد طلب للدفع.</p>
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-[#1766A6] text-white rounded-[10px] text-xs font-bold"
        >
          العودة للطلبات
        </button>
      </div>
    );
  }

  const handlePay = async () => {
    setIsProcessing(true);
    setPaymentError('');
    try {
      await onProcessPayment(request.id, selectedMethod);
    } catch (error) {
      setPaymentError(
        error instanceof Error ? error.message : 'تعذر بدء الدفع عبر مزود الدفع المعتمد.'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDemoSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!request) return;

    setIsProcessing(true);
    setPaymentError('');
    setDemoCardNumber('');
    setDemoCardholder('');
    setDemoExpiry('');
    setDemoCvv('');

    try {
      // Card fields are intentionally never sent to the server or persisted.
      await onConfirmDemoPayment(request.id);
    } catch (error) {
      setPaymentError(
        error instanceof Error ? error.message : 'تعذر تأكيد الموعد التجريبي.'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  if (demoMode && request) {
    return (
      <div className="mx-auto max-w-lg space-y-4" dir="rtl">
        <header>
          <h1 className="text-[18px] font-black text-[#203945]">تأكيد الموعد</h1>
          <p className="mt-0.5 text-[11px] text-[#203945]/70">
            أكمل نموذج الدفع الوهمي لتأكيد الحجز. استخدم بيانات وهمية فقط، مثل 0000 0000 0000 0000.
          </p>
        </header>

        <section className="space-y-2 rounded-[16px] border border-[#DCEBF4] bg-[#EAF3F8] p-4">
          <span className="block text-[13px] font-bold text-[#1766A6]">تفاصيل الموعد</span>
          <p className="text-[13px] text-[#203945]">الخدمة: {request.serviceTitle}</p>
          <p className="text-[13px] text-[#203945]">مقدم الخدمة: {request.providerName}</p>
          {request.appointmentDate && request.appointmentTime && (
            <p className="text-[13px] text-[#203945]">
              الموعد: {request.appointmentDate} — {request.appointmentTime}
            </p>
          )}
          <p className="text-[11px] text-[#203945]/70">رقم الطلب: {request.caseNumber}</p>
          <div className="flex items-center justify-between border-t border-[#DCEBF4] pt-2">
            <span className="text-[14px] font-bold text-[#203945]">المبلغ المطلوب</span>
            <span className="text-[16px] font-black text-[#1766A6]">
              {request.amountDzd.toLocaleString('ar-DZ')} دج
            </span>
          </div>
        </section>

        <div
          aria-label="بطاقة ذهبية تجريبية"
          className="relative overflow-hidden rounded-[18px] border border-[#C5A441] bg-gradient-to-br from-[#F7E7A6] via-[#D8B94D] to-[#A98622] p-5 text-[#30250C] shadow-sm"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold">بريد الجزائر</p>
              <p className="text-lg font-black tracking-wide">EDAHABIA</p>
            </div>
            <Wifi className="h-6 w-6 rotate-90" aria-hidden="true" />
          </div>
          <p className="my-5 font-mono text-lg tracking-[0.12em]" dir="ltr">
            {demoCardNumber
              ? demoCardNumber.padEnd(16, '•').replace(/(.{4})/g, '$1 ').trim()
              : '•••• •••• •••• ••••'}
          </p>
          <div className="flex justify-between gap-4 text-[10px] font-bold">
            <span className="truncate">{demoCardholder || 'اسم حامل البطاقة'}</span>
            <span dir="ltr">{demoExpiry || 'MM/YY'}</span>
          </div>
          <span className="pointer-events-none absolute -left-8 -top-10 h-36 w-36 rounded-full border border-white/20" />
        </div>

        <div role="note" className="rounded-[12px] border border-amber-300 bg-amber-50 p-3 text-xs leading-relaxed text-amber-950">
          <strong>دفع تجريبي فقط:</strong> لا تكتب بيانات بطاقتك الحقيقية. لا يُخصم أي مبلغ، ولا تُرسل أو تُحفظ المعلومات المدخلة. تُسجّل عملية دفع تجريبية ناجحة ويُؤكّد موعدك.
        </div>

        <form onSubmit={handleDemoSubmit} className="space-y-3">
          <div>
            <label htmlFor="demo-edahabia-number" className="mb-1 block text-xs font-bold text-[#203945]">
              رقم البطاقة التجريبي
            </label>
            <input
              id="demo-edahabia-number"
              name="demo-edahabia-number"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              dir="ltr"
              required
              minLength={16}
              maxLength={16}
              pattern="[0-9]{16}"
              title="أدخل 16 رقمًا تجريبيًا"
              value={demoCardNumber}
              onChange={(event) => setDemoCardNumber(event.target.value.replace(/\D/g, '').slice(0, 16))}
              placeholder="0000000000000000"
              className="h-11 w-full rounded-[10px] border border-[#CCD8D5] bg-white px-3 text-sm tracking-widest text-[#203945] outline-none focus:border-[#1766A6]"
            />
          </div>

          <div>
            <label htmlFor="demo-edahabia-name" className="mb-1 block text-xs font-bold text-[#203945]">
              اسم حامل البطاقة (تجريبي)
            </label>
            <input
              id="demo-edahabia-name"
              name="demo-edahabia-name"
              type="text"
              autoComplete="off"
              required
              maxLength={60}
              value={demoCardholder}
              onChange={(event) => setDemoCardholder(event.target.value)}
              placeholder="الاسم كما يظهر على البطاقة"
              className="h-11 w-full rounded-[10px] border border-[#CCD8D5] bg-white px-3 text-sm text-[#203945] outline-none focus:border-[#1766A6]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="demo-edahabia-expiry" className="mb-1 block text-xs font-bold text-[#203945]">
                تاريخ الانتهاء
              </label>
              <input
                id="demo-edahabia-expiry"
                name="demo-edahabia-expiry"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                dir="ltr"
                required
                maxLength={5}
                pattern="(0[1-9]|1[0-2])/[0-9]{2}"
                title="اكتب الشهر والسنة بصيغة MM/YY"
                value={demoExpiry}
                onChange={(event) => setDemoExpiry(event.target.value.replace(/[^0-9/]/g, '').slice(0, 5))}
                placeholder="MM/YY"
                className="h-11 w-full rounded-[10px] border border-[#CCD8D5] bg-white px-3 text-sm text-[#203945] outline-none focus:border-[#1766A6]"
              />
            </div>
            <div>
              <label htmlFor="demo-edahabia-cvv" className="mb-1 block text-xs font-bold text-[#203945]">
                رمز الأمان التجريبي
              </label>
              <input
                id="demo-edahabia-cvv"
                name="demo-edahabia-cvv"
                type="password"
                inputMode="numeric"
                autoComplete="off"
                dir="ltr"
                required
                minLength={3}
                maxLength={3}
                pattern="[0-9]{3}"
                title="أدخل ثلاثة أرقام تجريبية"
                value={demoCvv}
                onChange={(event) => setDemoCvv(event.target.value.replace(/\D/g, '').slice(0, 3))}
                placeholder="•••"
                className="h-11 w-full rounded-[10px] border border-[#CCD8D5] bg-white px-3 text-sm tracking-widest text-[#203945] outline-none focus:border-[#1766A6]"
              />
            </div>
          </div>

          {paymentError && (
            <p role="alert" className="rounded-[10px] border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-950">
              {paymentError}
            </p>
          )}

          <button
            type="submit"
            disabled={isProcessing}
            className="flex h-[50px] w-full items-center justify-center gap-2 rounded-[12px] bg-[#1766A6] text-[14px] font-bold text-white shadow-xs transition-colors hover:bg-[#125386] disabled:opacity-50"
          >
            <CreditCard className="h-4 w-4" />
            <span>{isProcessing ? 'جارٍ تأكيد الدفع والموعد...' : 'دفع تجريبي وتأكيد الموعد'}</span>
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="h-[46px] w-full rounded-[12px] border border-[#CCD8D5] text-xs font-semibold text-[#203945] transition-colors hover:bg-[#FBFDFC]"
          >
            إلغاء والعودة للطلبات
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-lg mx-auto">
      <div>
        <h1 className="text-[18px] font-black text-[#203945]">إتمام الدفع</h1>
        <p className="text-[11px] text-[#203945]/70 mt-0.5">
          اختر طريقة الدفع. لن يُسجل الدفع ناجحاً إلا بعد تأكيد مزود الدفع المعتمد.
        </p>
      </div>

      {/* Invoice Overview Card */}
      <div className="bg-[#EAF3F8] rounded-[16px] p-4 space-y-2 border border-[#DCEBF4]">
          <span className="font-bold text-[13px] text-[#1766A6] block">تفاصيل العملية:</span>
        <p className="text-[13px] text-[#203945]">الخدمة: {request.serviceTitle}</p>
        <p className="text-[13px] text-[#203945]">مقدم الخدمة: {request.providerName}</p>
        {request.appointmentDate && request.appointmentTime && (
          <p className="text-[13px] text-[#203945]">
            الموعد: {request.appointmentTime} — {request.appointmentDate}
          </p>
        )}
        <p className="text-[11px] text-[#203945]/70">رقم الطلب: {request.caseNumber}</p>
        <div className="border-t border-[#DCEBF4] pt-2 flex items-center justify-between">
            <span className="font-bold text-[14px] text-[#203945]">المبلغ المستحق:</span>
          <span className="font-black text-[16px] text-[#25866D]">
              {request.amountDzd.toLocaleString('ar-DZ')} دج
          </span>
        </div>
      </div>

      {/* Method Selector */}
      <div className="space-y-2">
        <label className="text-[13px] font-bold text-[#203945] block">
            طريقة الدفع
        </label>
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            aria-pressed={selectedMethod === 'EDAHABIA'}
            onClick={() => setSelectedMethod('EDAHABIA')}
            className={`w-full p-3.5 rounded-[12px] text-center space-y-1 transition-colors border ${
              selectedMethod === 'EDAHABIA'
                ? 'bg-[#E8F4EF] border-[#25866D]'
                : 'bg-[#FBFDFC] border-[#E5ECE9] hover:bg-[#F3F7F6]'
            }`}
          >
              <CreditCard className="w-5 h-5 mx-auto text-[#25866D]" />
            <span className="font-bold text-[12px] text-[#203945] block">
                EDAHABIA — الدفع بواسطة البطاقة الذهبية
            </span>
          </button>

          <button
            type="button"
            aria-pressed={selectedMethod === 'CIB'}
            onClick={() => setSelectedMethod('CIB')}
            className={`w-full p-3.5 rounded-[12px] text-center space-y-1 transition-colors border ${
              selectedMethod === 'CIB'
                ? 'bg-[#E8F4EF] border-[#25866D]'
                : 'bg-[#FBFDFC] border-[#E5ECE9] hover:bg-[#F3F7F6]'
            }`}
          >
              <Landmark className="w-5 h-5 mx-auto text-[#25866D]" />
            <span className="font-bold text-[12px] text-[#203945] block">
                CIB — الدفع بواسطة بطاقة CIB
            </span>
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <div role="note" className="flex items-start gap-2 rounded-[12px] border border-[#DCEBF4] bg-[#EAF3F8] p-3 text-xs leading-relaxed text-[#104A78]">
          <Shield className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            تتم معالجة الدفع عبر مزود الدفع المعتمد. لا تحتفظ المنصة ببيانات البطاقة الحساسة مثل رقم البطاقة الكامل أو رمز CVV أو الرقم السري أو رمز OTP.
          </p>
        </div>

        {paymentError && (
          <p role="alert" className="rounded-[10px] border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-950">
            {paymentError}
          </p>
        )}

        <div className="pt-2 space-y-2">
          <button
            type="button"
            disabled={isProcessing}
            onClick={handlePay}
            className="w-full h-[50px] rounded-[12px] bg-[#25866D] hover:bg-[#1e6c58] disabled:opacity-50 text-white font-bold text-[14px] shadow-xs flex items-center justify-center gap-2 transition-colors"
          >
            <Lock className="w-4 h-4" />
            <span>
              {isProcessing ? 'جارٍ الاتصال بمزود الدفع...' : `الدفع الآن — ${request.amountDzd.toLocaleString('ar-DZ')} دج`}
            </span>
          </button>

          <button
            type="button"
            onClick={onCancel}
            className="w-full h-[46px] rounded-[12px] border border-[#CCD8D5] text-[#203945] font-semibold text-xs hover:bg-[#FBFDFC] transition-colors"
          >
            إلغاء والعودة للطلبات
          </button>
        </div>
      </div>
    </div>
  );
};
