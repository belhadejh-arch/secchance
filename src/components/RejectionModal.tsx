import React, { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="px-5 py-4 bg-red-50 border-b border-red-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-red-700">
            <AlertTriangle className="w-5 h-5" />
            <h3 className="font-extrabold text-base">سبب رفض الطلب</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-3">
          <p className="text-xs text-slate-600">
            يرجى تحديد سبب الرفض ليتم إشعار صاحب الطلب وحفظه في سجل الحالة:
          </p>

          <div className="space-y-2">
            {reasons.map((r) => (
              <label
                key={r}
                className="flex items-center gap-2.5 p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer text-xs"
              >
                <input
                  type="radio"
                  name="rejectionReason"
                  checked={selectedReason === r}
                  onChange={() => setSelectedReason(r)}
                  className="text-red-600 focus:ring-red-500"
                />
                <span className="font-medium text-slate-800">{r}</span>
              </label>
            ))}
          </div>

          {selectedReason === 'سبب آخر' && (
            <textarea
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              placeholder="اكتب التوضيح هنا..."
              className="w-full h-20 p-2.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-hidden"
            />
          )}
        </div>

        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/60 rounded-xl"
          >
            إلغاء
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-xs"
          >
            تأكيد الرفض
          </button>
        </div>
      </div>
    </div>
  );
};
