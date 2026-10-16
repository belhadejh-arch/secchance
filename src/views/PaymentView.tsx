import React, { useState } from 'react';
import { CareRequest } from '../types';
import { CreditCard, Landmark, Lock, Shield } from 'lucide-react';

interface PaymentViewProps {
  request: CareRequest | null;
  onProcessPayment: (requestId: number | string, method: 'EDAHABIA' | 'CIB') => void | Promise<void>;
  onCancel: () => void;
}

export const PaymentView: React.FC<PaymentViewProps> = ({
  request,
  onProcessPayment,
  onCancel,
}) => {
  const [selectedMethod, setSelectedMethod] = useState<'EDAHABIA' | 'CIB'>('EDAHABIA');
  const [paymentError, setPaymentError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

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
