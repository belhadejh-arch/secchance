import React, { useState } from 'react';
import { 
  ArrowRight, 
  ShieldAlert, 
  UserCheck, 
  Calendar, 
  FileText, 
  MessageSquare, 
  PhoneCall, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Share2,
  ChevronLeft,
  Activity
} from 'lucide-react';

interface CaseDetailsViewProps {
  caseCode?: string;
  onBack: () => void;
  onOpenChat?: (convId: number) => void;
  onBookAppointment?: () => void;
}

export const CaseDetailsView: React.FC<CaseDetailsViewProps> = ({
  caseCode = '#SC-2025-0012',
  onBack,
  onOpenChat,
  onBookAppointment
}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'appointments' | 'documents'>('info');

  return (
    <div className="max-w-xl mx-auto px-4 py-4 space-y-4 pb-24" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-slate-600 hover:text-slate-900 text-xs font-bold"
        >
          <ArrowRight className="w-4 h-4" />
          <span>رجوع</span>
        </button>
        <h1 className="text-base font-black text-slate-900">تفاصيل الحالة</h1>
        <span className="text-[11px] font-mono font-bold text-[#1565C0] bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100">
          {caseCode}
        </span>
      </div>

      {/* Main Status & Case Card (Matching Screen 6) */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">نوع المشكلة</span>
            <h2 className="text-lg font-black text-slate-900">إدمان المخدرات</h2>
          </div>
          <span className="px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold rounded-full flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>قيد المراجعة</span>
          </span>
        </div>

        {/* Key Attributes Grid */}
        <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-2xl text-center border border-slate-100">
          <div>
            <span className="text-[10px] text-slate-400 block mb-0.5">المريض / اللقب</span>
            <span className="text-xs font-bold text-slate-800">أحمد علي</span>
          </div>
          <div className="border-x border-slate-200">
            <span className="text-[10px] text-slate-400 block mb-0.5">الولاية</span>
            <span className="text-xs font-bold text-slate-800">الجزائر العاصمة</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block mb-0.5">الأولوية</span>
            <span className="text-xs font-bold text-red-600">عالية جداً</span>
          </div>
        </div>

        {/* Assigned Specialist Card (Matching Screen 6) */}
        <div className="pt-2">
          <span className="text-xs font-bold text-slate-500 mb-2 block">المختص المسند للمتابعة:</span>
          <div className="flex items-center justify-between p-3.5 bg-blue-50/60 rounded-2xl border border-blue-100">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-[#1565C0] text-white flex items-center justify-center font-bold text-sm shadow-xs">
                ف.ز
              </div>
              <div>
                <h4 className="font-bold text-xs sm:text-sm text-slate-900">د. فاطمة الزهراء بن عيسى</h4>
                <p className="text-[11px] text-blue-800 font-medium">أخصائية علاج نفسي وسلوكي معرفي</p>
              </div>
            </div>

            <button
              onClick={() => onOpenChat && onOpenChat(1)}
              className="p-2 bg-white text-[#1565C0] hover:bg-[#1565C0] hover:text-white rounded-xl shadow-xs transition-colors cursor-pointer"
              title="مراسلة الطبيب"
            >
              <MessageSquare className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Row (Matching Screen 6: المعلومات | المواعيد | المستندات) */}
      <div className="flex rounded-2xl bg-slate-100 p-1 text-xs font-bold">
        <button
          onClick={() => setActiveTab('info')}
          className={`flex-1 py-2 rounded-xl transition-all ${
            activeTab === 'info' ? 'bg-white text-[#1565C0] shadow-xs' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          المعلومات
        </button>
        <button
          onClick={() => setActiveTab('appointments')}
          className={`flex-1 py-2 rounded-xl transition-all ${
            activeTab === 'appointments' ? 'bg-white text-[#1565C0] shadow-xs' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          المواعيد (2)
        </button>
        <button
          onClick={() => setActiveTab('documents')}
          className={`flex-1 py-2 rounded-xl transition-all ${
            activeTab === 'documents' ? 'bg-white text-[#1565C0] shadow-xs' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          المستندات (1)
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'info' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 text-xs">
          <h3 className="font-bold text-slate-900 text-sm">التشخيص الأولي وخطة العمل</h3>
          <p className="text-slate-600 leading-relaxed">
            تم تسجيل الحالة كأولوية قصوى بسبب المعاناة المستمرة من المواد الكيميائية. تم إسناد الملف للأخصائية بن عيسى لإجراء مقابلة تحفيزية أولى، وطلب رأي قانوني لتوفير الحماية وفق تدابير المادة 89 للعلاج الطوعي.
          </p>

          <div className="border-t border-slate-100 pt-3 space-y-2">
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-400">تاريخ فتح الملف:</span>
              <span className="font-bold text-slate-700">18 أبريل 2025</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-400">المركز المقترح للتحاليل:</span>
              <span className="font-bold text-slate-700">مركز الأمل لإزالة السموم - زرالدة</span>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'appointments' && (
        <div className="space-y-2.5">
          <div className="bg-white rounded-2xl border border-slate-200 p-3.5 flex items-center justify-between text-xs">
            <div className="space-y-1">
              <span className="font-bold text-slate-900 block">جلسة تقييم نفسي عن بُعد</span>
              <span className="text-[11px] text-slate-500 flex items-center gap-1">
                <Clock className="w-3 h-3 text-blue-600" />
                الأحد، 20 أبريل 2025 • 10:00 - 11:00
              </span>
            </div>
            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 font-bold rounded-lg text-[10px]">
              مؤكد
            </span>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-3.5 flex items-center justify-between text-xs">
            <div className="space-y-1">
              <span className="font-bold text-slate-900 block">استشارة تكييف قانوني</span>
              <span className="text-[11px] text-slate-500 flex items-center gap-1">
                <Clock className="w-3 h-3 text-amber-600" />
                الثلاثاء، 22 أبريل 2025 • 14:00 - 15:00
              </span>
            </div>
            <span className="px-2.5 py-1 bg-blue-50 text-blue-700 font-bold rounded-lg text-[10px]">
              بانتظار التأكيد
            </span>
          </div>
        </div>
      )}

      {activeTab === 'documents' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-2 text-xs">
          <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#1565C0]" />
              <div>
                <span className="font-bold text-slate-800 block">تقرير الفحص السريري الأولي.pdf</span>
                <span className="text-[10px] text-slate-400">1.2 MB • تم الرفع بواسطة الطبيب</span>
              </div>
            </div>
            <button className="text-[11px] text-[#1565C0] font-bold hover:underline">
              تحميل
            </button>
          </div>
        </div>
      )}

      {/* Main Action Button (Matching Screen 6) */}
      <button
        onClick={onBookAppointment}
        className="w-full py-3.5 bg-[#1565C0] hover:bg-blue-700 text-white font-bold rounded-2xl text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
      >
        <span>حجز موعد إضافي أو تعديل المتابعة</span>
        <ChevronLeft className="w-4 h-4" />
      </button>
    </div>
  );
};
