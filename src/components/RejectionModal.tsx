import React, { useState } from 'react';

interface RejectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}

export const RejectionModal: React.FC<RejectionModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  const reasons = [
    'لا أستطيع استقبال الحالة',
    'الخدمة غير متوفرة حالياً',
    'الموعد غير مناسب',
    'الحالة خارج اختصاصي',
    'سبب آخر',
  ];

  const [selectedReason, setSelectedReason] = useState(reasons[0]);
  const [customReason, setCustomReason] = useState('');

  if (!isOpen) return null;

  const handleConfirm = () => {
    const finalReason = selectedReason === 'سبب آخر' ? (customReason.trim() || 'سبب آخر') : selectedReason;
    onConfirm(finalReason);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-[#FBFDFC] rounded-[20px] max-w-md w-full shadow-lg border border-[#E5ECE9] p-6 space-y-4">
        <h3 className="font-bold text-[16px] text-[#203945]">
          سبب رفض الطلب
        </h3>

        <div className="space-y-2">
          <p className="text-[12px] text-[#203945]/80">
            يرجى تحديد سبب الرفض ليتم حفظه في سجل الحالة:
          </p>

          <div className="space-y-1.5">
            {reasons.map((r) => (
              <label
                key={r}
                className="flex items-center gap-2 p-1 text-[12px] text-[#203945] cursor-pointer"
              >
                <input
                  type="radio"
                  name="rejectRadio"
                  checked={selectedReason === r}
                  onChange={() => setSelectedReason(r)}
                  className="accent-[#A64842] w-4 h-4"
                />
                <span>{r}</span>
              </label>
            ))}
          </div>

          {selectedReason === 'سبب آخر' && (
            <textarea
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              placeholder="اكتب التوضيح هنا..."
              className="w-full h-20 p-2 text-xs bg-white border border-[#CCD8D5] rounded-[8px] outline-hidden focus:border-[#A64842] mt-1"
            />
          )}
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-[#203945]/70 hover:text-[#203945]"
          >
            إلغاء
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 rounded-[8px] bg-[#A64842] hover:bg-[#8e3c37] text-white font-bold text-xs shadow-xs"
          >
            تأكيد الرفض
          </button>
        </div>
      </div>
    </div>
  );
};
