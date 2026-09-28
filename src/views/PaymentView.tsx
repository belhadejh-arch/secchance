import React, { useState } from 'react';
import { CareRequest } from '../types';
import { CreditCard, Landmark, Lock } from 'lucide-react';

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
  const [selectedMethod, setSelectedMethod] = useState<'EDAHABIA' | 'CIB'>('EDAHABIA');
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');

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

  const handlePay = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardNumber.trim()) return;
    onProcessPayment(request.id, selectedMethod);
  };

  return (
    <div className="space-y-4 max-w-lg mx-auto">
      <div>
        <h1 className="text-[18px] font-black text-[#203945]">
          إتمام الدفع الإلكتروني (البطاقة الذهبية / CIB)
        </h1>
        <p className="text-[11px] text-[#203945]/70 mt-0.5">
          بوابة دفع آمنة ومعتمدة في الجزائر. لا يتم تخزين بيانات بطاقتك على الخادم.
        </p>
      </div>

      {/* Invoice Overview Card */}
      <div className="bg-[#EAF3F8] rounded-[16px] p-4 space-y-2 border border-[#DCEBF4]">
        <span className="font-bold text-[13px] text-[#1766A6] block">
          تفاصيل العملية:
        </span>
        <p className="text-[13px] text-[#203945]">الخدمة: {request.serviceTitle}</p>
        <p className="text-[12px] text-[#203945]">مقدم الخدمة: {request.providerName}</p>
        <p className="text-[11px] text-[#203945]/70">رقم الحالة: {request.caseNumber}</p>
        <div className="border-t border-[#DCEBF4] pt-2 flex items-center justify-between">
          <span className="font-bold text-[14px] text-[#203945]">
            المبلغ الإجمالي الواجب دفعه:
          </span>
          <span className="font-black text-[16px] text-[#25866D]">
            {request.amountDzd.toLocaleString()} دج
          </span>
        </div>
      </div>

      {/* Method Selector */}
      <div className="space-y-2">
        <label className="text-[13px] font-bold text-[#203945] block">
          اختر طريقة الدفع الإلكتروني
        </label>
        <div className="grid grid-cols-2 gap-2.5">
          <div
            onClick={() => setSelectedMethod('EDAHABIA')}
            className={`p-3.5 rounded-[12px] cursor-pointer text-center space-y-1 transition-colors border ${
              selectedMethod === 'EDAHABIA'
                ? 'bg-[#E8F4EF] border-[#25866D]'
                : 'bg-[#FBFDFC] border-[#E5ECE9] hover:bg-[#F3F7F6]'
            }`}
          >
            <CreditCard className="w-5 h-5 mx-auto text-[#25866D]" />
            <span className="font-bold text-[12px] text-[#203945] block">
              البطاقة الذهبية
            </span>
          </div>

          <div
            onClick={() => setSelectedMethod('CIB')}
            className={`p-3.5 rounded-[12px] cursor-pointer text-center space-y-1 transition-colors border ${
              selectedMethod === 'CIB'
                ? 'bg-[#E8F4EF] border-[#25866D]'
                : 'bg-[#FBFDFC] border-[#E5ECE9] hover:bg-[#F3F7F6]'
            }`}
          >
            <Landmark className="w-5 h-5 mx-auto text-[#25866D]" />
            <span className="font-bold text-[12px] text-[#203945] block">
              بطاقة CIB
            </span>
          </div>
        </div>
      </div>

      {/* Form Fields */}
      <form onSubmit={handlePay} className="space-y-3">
        <div>
          <label className="text-[12px] text-[#203945]/80 block mb-1">
            رقم البطاقة (16 رقماً)
          </label>
          <input
            required
            type="text"
            value={cardNumber}
            onChange={(e) => setCardNumber(e.target.value)}
            placeholder="6030 XXXX XXXX XXXX"
            className="w-full p-2.5 text-xs sm:text-sm bg-white border border-[#CCD8D5] rounded-[10px] outline-hidden focus:border-[#1766A6]"
          />
        </div>

        <div>
          <label className="text-[12px] text-[#203945]/80 block mb-1">
            اسم صاحب البطاقة
          </label>
          <input
            required
            type="text"
            value={cardHolder}
            onChange={(e) => setCardHolder(e.target.value)}
            placeholder="الاسم واللقب"
            className="w-full p-2.5 text-xs sm:text-sm bg-white border border-[#CCD8D5] rounded-[10px] outline-hidden focus:border-[#1766A6]"
          />
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="text-[12px] text-[#203945]/80 block mb-1">
              تاريخ الصلاحية (MM/YY)
            </label>
            <input
              required
              type="text"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              placeholder="12/28"
              className="w-full p-2.5 text-xs sm:text-sm bg-white border border-[#CCD8D5] rounded-[10px] outline-hidden focus:border-[#1766A6]"
            />
          </div>

          <div>
            <label className="text-[12px] text-[#203945]/80 block mb-1">
              الرمز السري (CVV)
            </label>
            <input
              required
              type="password"
              maxLength={4}
              value={cvv}
              onChange={(e) => setCvv(e.target.value)}
              placeholder="•••"
              className="w-full p-2.5 text-xs sm:text-sm bg-white border border-[#CCD8D5] rounded-[10px] outline-hidden focus:border-[#1766A6]"
            />
          </div>
        </div>

        <div className="pt-2 space-y-2">
          <button
            type="submit"
            className="w-full h-[50px] rounded-[12px] bg-[#25866D] hover:bg-[#1e6c58] text-white font-bold text-[14px] shadow-xs flex items-center justify-center gap-2 transition-colors"
          >
            <Lock className="w-4 h-4" />
            <span>دفع آمن ومؤكد ({request.amountDzd.toLocaleString()} دج)</span>
          </button>

          <button
            type="button"
            onClick={onCancel}
            className="w-full h-[46px] rounded-[12px] border border-[#CCD8D5] text-[#203945] font-semibold text-xs hover:bg-[#FBFDFC] transition-colors"
          >
            إلغاء والعودة للطلبات
          </button>
        </div>
      </form>
    </div>
  );
};
