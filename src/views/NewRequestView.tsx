import React, { useState } from 'react';
import { ServiceItem, Priority, ALGERIA_WILAYAS } from '../types';
import { ArrowRight, Send, AlertCircle, ShieldAlert } from 'lucide-react';

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
  const [wilaya, setWilaya] = useState<string>('16. الجزائر العاصمة');
  const [description, setDescription] = useState<string>('');

  const priorities: { value: Priority; label: string; color: string; dot: string }[] = [
    { value: 'Critical', label: 'عاجلة جداً (حالة خطرة أو اشتباه تسمم/جرعة)', color: 'border-red-500 bg-red-50', dot: 'bg-red-600' },
    { value: 'High', label: 'عاجلة (مرافقة عيادية أو إرشاد فوري)', color: 'border-amber-500 bg-amber-50', dot: 'bg-amber-600' },
    { value: 'Medium', label: 'متوسطة (استشارة روتينية أو متابعة)', color: 'border-blue-500 bg-blue-50', dot: 'bg-blue-600' },
    { value: 'Low', label: 'عادية (استفسار عام أو توجيه وقائي)', color: 'border-slate-300 bg-slate-50', dot: 'bg-slate-400' },
  ];

  const currentService = services.find((s) => s.id === selectedServiceId) || services[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !currentService) return;
    onSubmit(currentService.id, priority, wilaya, description);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900">
            طلب خدمة أو استشارة جديدة
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            يرجى اختيار الخدمة المطلوبة وتحديد الأولوية لضمان سرعة التكفل بالحالة
          </p>
        </div>
        <button
          onClick={onCancel}
          className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 p-2 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <span>إلغاء</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Service Selection */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
          <label className="block text-sm font-bold text-slate-900">
            اختر الخدمة أو الاستشارة
          </label>
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {services.map((s) => {
              const isSelected = s.id === selectedServiceId;
              return (
                <div
                  key={s.id}
                  onClick={() => setSelectedServiceId(s.id)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/70 ring-1 ring-blue-600'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div>
                    <h4 className="font-bold text-xs sm:text-sm text-slate-900">
                      {s.title}
                    </h4>
                    <p className="text-xs text-slate-500">
                      المزود: {s.providerName}
                    </p>
                  </div>
                  <span className="font-black text-xs sm:text-sm text-emerald-700 shrink-0">
                    {s.amountDzd.toLocaleString()} دج
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Priority Level */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
          <label className="block text-sm font-bold text-slate-900">
            مستوى الأولوية والاستعجال
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {priorities.map((p) => {
              const isSelected = priority === p.value;
              return (
                <div
                  key={p.value}
                  onClick={() => setPriority(p.value)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center gap-2.5 ${
                    isSelected
                      ? `${p.color} ring-1 ring-slate-400 font-bold`
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <span className={`w-3 h-3 rounded-full ${p.dot} shrink-0`} />
                  <span className="text-xs text-slate-800 leading-tight">
                    {p.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Wilaya Selection */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-2">
          <label className="block text-sm font-bold text-slate-900">
            الولاية (مكان تواجد الحالة)
          </label>
          <select
            value={wilaya}
            onChange={(e) => setWilaya(e.target.value)}
            className="w-full p-3 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-blue-600 bg-white outline-hidden"
          >
            {ALGERIA_WILAYAS.map((w) => (
              <option key={w} value={w}>
                {w}
              </option>
            ))}
          </select>
        </div>

        {/* Description & Symptoms */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-bold text-slate-900">
              تفاصيل الحالة أو الملاحظات الإضافية
            </label>
            <span className="text-[11px] text-slate-400">سرية تامة ومحمية</span>
          </div>
          <textarea
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="اشرح باختصار وضع الحالة، الأعراض، أو الاستفسار القانوني ليتمكن الأخصائي من الاستعداد للجلسة..."
            rows={4}
            className="w-full p-3 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-blue-600 bg-slate-50/40 resize-none outline-hidden"
          />
        </div>

        {/* Legal Reminder Card */}
        <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-2.5 text-xs text-blue-900">
          <ShieldAlert className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            وفقاً للمادة 6 من القانون 04-18 والمعدل بالقانون 23-05، فإن كل تواصل أو طلب علاج يتم بسرية تامة ومحمي قانونياً تحت بند العلاج والمتابعة الطبية الطوعية.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            type="submit"
            disabled={!description.trim()}
            className="flex-1 py-3 px-5 rounded-xl bg-blue-700 hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm shadow-md transition-colors flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" />
            <span>إرسال الطلب لمقدم الخدمة بأمان</span>
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="py-3 px-5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold text-sm transition-colors"
          >
            رجوع
          </button>
        </div>
      </form>
    </div>
  );
};
