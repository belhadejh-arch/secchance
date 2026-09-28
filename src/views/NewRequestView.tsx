import React, { useState } from 'react';
import { ServiceItem, Priority } from '../types';
import { Check } from 'lucide-react';

interface NewRequestViewProps {
  services: ServiceItem[];
  preselectedServiceId?: number;
  onSubmit: (serviceId: number, priority: Priority, wilaya: string, description: string) => void;
  onCancel: () => void;
}

export const NewRequestView: React.FC<NewRequestViewProps> = ({
  services,
  preselectedServiceId,
  onSubmit,
  onCancel,
}) => {
  const [selectedServiceId, setSelectedServiceId] = useState<number>(
    preselectedServiceId || services[0]?.id || 1
  );
  const [priority, setPriority] = useState<Priority>('High');
  const [wilaya] = useState<string>('الجزائر العاصمة');
  const [description, setDescription] = useState<string>('');

  const currentService = services.find((s) => s.id === selectedServiceId) || services[0];

  const priorities: { value: Priority; label: string }[] = [
    { value: 'Critical', label: '🔴 عاجلة جداً' },
    { value: 'High', label: '🟠 عاجلة' },
    { value: 'Medium', label: '🟡 متوسطة' },
    { value: 'Low', label: '🟢 عادية' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !currentService) return;
    onSubmit(currentService.id, priority, wilaya, description);
  };

  return (
    <div className="space-y-4 max-w-xl mx-auto">
      <div>
        <h1 className="text-[18px] font-black text-[#203945]">
          طلب خدمة أو استشارة جديدة
        </h1>
        <p className="text-[11px] text-[#203945]/70 mt-0.5">
          يرجى اختيار الخدمة المطلوبة وتحديد الأولوية لضمان سرعة التكفل بالحالة
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Services List */}
        <div className="space-y-2">
          <label className="text-[13px] font-bold text-[#203945] block">
            اختر الخدمة أو الاستشارة
          </label>
          <div className="space-y-1.5">
            {services.map((s) => {
              const isSelected = s.id === selectedServiceId;
              return (
                <div
                  key={s.id}
                  onClick={() => setSelectedServiceId(s.id)}
                  className={`p-3.5 rounded-[12px] cursor-pointer transition-colors border flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-[#EAF3F8] border-[#1766A6]'
                      : 'bg-[#FBFDFC] border-[#E5ECE9] hover:bg-[#F3F7F6]'
                  }`}
                >
                  <div>
                    <h4 className="font-bold text-[13px] text-[#203945]">
                      {s.title}
                    </h4>
                    <p className="text-[11px] text-[#203945]/60">
                      المزود: {s.providerName}
                    </p>
                  </div>
                  <span className="font-black text-[13px] text-[#25866D] shrink-0">
                    {s.amountDzd.toLocaleString()} دج
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Priority */}
        <div className="space-y-1.5">
          <label className="text-[13px] font-bold text-[#203945] block">
            مستوى الأولوية
          </label>
          <div className="space-y-1">
            {priorities.map((p) => (
              <label
                key={p.value}
                className="flex items-center gap-2.5 p-1 cursor-pointer text-[13px] text-[#203945]"
              >
                <input
                  type="radio"
                  name="priority"
                  checked={priority === p.value}
                  onChange={() => setPriority(p.value)}
                  className="accent-[#1766A6] w-4 h-4"
                />
                <span>{p.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="text-[12px] text-[#203945]/80 block mb-1">
            تفاصيل الحالة أو الملاحظات الإضافية
          </label>
          <textarea
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="اشرح باختصار وضع الحالة..."
            rows={4}
            className="w-full p-3 text-xs sm:text-sm bg-white border border-[#CCD8D5] rounded-[12px] outline-hidden focus:border-[#1766A6] resize-none"
          />
        </div>

        {/* Buttons */}
        <div className="space-y-2 pt-2">
          <button
            type="submit"
            disabled={!description.trim()}
            className="w-full h-[48px] rounded-[12px] bg-[#1766A6] hover:bg-[#125386] disabled:opacity-50 text-white font-bold text-[14px] shadow-xs flex items-center justify-center gap-1.5 transition-colors"
          >
            <Check className="w-4 h-4" />
            <span>إرسال الطلب لمقدم الخدمة بأمان</span>
          </button>

          <button
            type="button"
            onClick={onCancel}
            className="w-full h-[46px] rounded-[12px] border border-[#CCD8D5] text-[#203945] font-semibold text-xs hover:bg-[#FBFDFC] transition-colors"
          >
            إلغاء والرجوع
          </button>
        </div>
      </form>
    </div>
  );
};
