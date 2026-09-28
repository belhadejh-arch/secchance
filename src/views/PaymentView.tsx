import React, { useState } from 'react';
import { CareRequest } from '../types';
import {
  CreditCard,
  Building,
  ShieldCheck,
  Lock,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';

interface PaymentViewProps {
  request: CareRequest | null;
  onProcessPayment: (requestId: number, method: 'EDAHABIA' | 'CIB') => void;
  onCancel: () => void;
}

export const PaymentView: React.FC<PaymentViewProps> = ({
  request,
  onProcessPayment,
  onCancel,
}) => {
  const [method, setMethod] = useState<'EDAHABIA' | 'CIB'>('EDAHABIA');
  const [cardNumber, setCardNumber] = useState('6030 0000 1234 5678');
  const [cardHolder, setCardHolder] = useState('BENKHALED MOHAMMED');
  const [expiry, setExpiry] = useState('12/28');
  const [cvv, setCvv] = useState('123');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!request) {
    return (
      <div className="text-center py-12 space-y-3">
        <p className="text-slate-600 font-semibold">لم يتم تحديد طلب للدفع.</p>
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-blue-700 text-white rounded-xl text-xs font-bold"
        >
          العودة للطلبات
        </button>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardNumber.trim()) return;
    setIsProcessing(true);
    setTimeout(() => {
      onProcessPayment(request.id, method);
      setIsProcessing(false);
    }, 800);
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900">
            إتمام الدفع الإلكتروني (البطاقة الذهبية / CIB)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            بوابة دفع آمنة ومعتمدة في الجزائر لتأكيد المواعيد وتفعيل المتابعة
          </p>
        </div>
        <button
          onClick={onCancel}
          className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1"
        >
          <span>إلغاء</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Invoice Overview Card */}
      <div className="bg-gradient-to-br from-blue-700 to-indigo-800 text-white rounded-2xl p-5 shadow-md space-y-3">
        <div className="flex items-center justify-between text-xs text-blue-200 border-b border-white/15 pb-2.5">
          <span>رقم الحالة: {request.caseNumber}</span>
          <span className="bg-white/20 px-2 py-0.5 rounded-md font-semibold">دفع فوري</span>
        </div>

        <div>
          <h3 className="font-extrabold text-base sm:text-lg">{request.serviceTitle}</h3>
          <p className="text-xs text-blue-100 mt-0.5">مقدم الخدمة: {request.providerName}</p>
        </div>

        <div className="pt-2 border-t border-white/15 flex items-center justify-between">
          <span className="text-xs text-blue-200">المبلغ الإجمالي الواجب دفعه:</span>
          <span className="text-xl sm:text-2xl font-black text-white">
            {request.amountDzd.toLocaleString()} دج
          </span>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
        {/* Method selection */}
        <div>
          <label className="block text-xs font-bold text-slate-900 mb-2">
            اختر وسيلة الدفع الإلكتروني:
          </label>
          <div className="grid grid-cols-2 gap-3">
            <div
              onClick={() => setMethod('EDAHABIA')}
              className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center gap-3 ${
                method === 'EDAHABIA'
                  ? 'border-amber-500 bg-amber-50/70 ring-2 ring-amber-500/20'
                  : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold text-xs shrink-0">
                <CreditCard className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-xs sm:text-sm text-slate-900 block">
                  البطاقة الذهبية
                </span>
                <span className="text-[10px] text-slate-500">بريد الجزائر</span>
              </div>
            </div>

            <div
              onClick={() => setMethod('CIB')}
              className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center gap-3 ${
                method === 'CIB'
                  ? 'border-blue-600 bg-blue-50/70 ring-2 ring-blue-600/20'
                  : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                <Building className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-xs sm:text-sm text-slate-900 block">
                  بطاقة CIB
                </span>
                <span className="text-[10px] text-slate-500">البنوك الجزائرية</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card Number */}
        <div>
          <label className="block text-xs font-bold text-slate-800 mb-1">
            رقم البطاقة (16 رقماً)
          </label>
          <input
            required
            type="text"
            value={cardNumber}
            onChange={(e) => setCardNumber(e.target.value)}
            placeholder="XXXX XXXX XXXX XXXX"
            className="w-full p-3 text-xs sm:text-sm border border-slate-300 rounded-xl outline-hidden focus:ring-2 focus:ring-blue-600 font-mono"
          />
        </div>

        {/* Cardholder name */}
        <div>
          <label className="block text-xs font-bold text-slate-800 mb-1">
            اسم صاحب البطاقة
          </label>
          <input
            required
            type="text"
            value={cardHolder}
            onChange={(e) => setCardHolder(e.target.value)}
            placeholder="الاسم واللقب كما هو مدون على البطاقة"
            className="w-full p-3 text-xs sm:text-sm border border-slate-300 rounded-xl outline-hidden focus:ring-2 focus:ring-blue-600 uppercase"
          />
        </div>

        {/* Expiry & CVV */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              تاريخ الصلاحية
            </label>
            <input
              required
              type="text"
              value={expiry}
              onChange={(e) => setExpiry(e.target.value)}
              placeholder="MM/YY"
              className="w-full p-3 text-xs sm:text-sm border border-slate-300 rounded-xl outline-hidden focus:ring-2 focus:ring-blue-600 font-mono text-center"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              الرمز السري (CVV2)
            </label>
            <input
              required
              type="password"
              maxLength={4}
              value={cvv}
              onChange={(e) => setCvv(e.target.value)}
              placeholder="•••"
              className="w-full p-3 text-xs sm:text-sm border border-slate-300 rounded-xl outline-hidden focus:ring-2 focus:ring-blue-600 font-mono text-center"
            />
          </div>
        </div>

        {/* Security badge */}
        <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>الدفع مؤمن بتشفير SSL عالي الحماية ومتصل بالشبكة البنكية الوطنية SATIM.</span>
        </div>

        {/* Action Button */}
        <button
          type="submit"
          disabled={isProcessing}
          className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-sm shadow-md transition-colors flex items-center justify-center gap-2"
        >
          <Lock className="w-4 h-4" />
          <span>
            {isProcessing
              ? 'جاري تأكيد المعاملة واقتطاع المبلغ...'
              : `تأكيد الدفع الآن (${request.amountDzd.toLocaleString()} دج)`}
          </span>
        </button>
      </form>
    </div>
  );
};
