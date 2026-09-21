import React, { useState } from 'react';
import { 
  ArrowRight, 
  Search, 
  Filter, 
  MapPin, 
  Activity, 
  Calendar, 
  ChevronLeft,
  Clock,
  ShieldCheck,
  UserCheck
} from 'lucide-react';

interface SmartSearchViewProps {
  onBack: () => void;
  onSelectCase: (code: string) => void;
}

export const SmartSearchView: React.FC<SmartSearchViewProps> = ({ onBack, onSelectCase }) => {
  const [query, setQuery] = useState('');
  const [selectedProblem, setSelectedProblem] = useState('all');
  const [selectedWilaya, setSelectedWilaya] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  const cases = [
    {
      code: '#SC-2025-0012',
      patient: 'أحمد علي',
      problem: 'إدمان المخدرات',
      wilaya: 'الجزائر العاصمة',
      specialist: 'د. فاطمة الزهراء بن عيسى',
      status: 'نشط',
      statusColor: 'bg-emerald-50 text-emerald-700 border-emerald-200'
    },
    {
      code: '#SC-2025-0015',
      patient: 'سارة بن جدو',
      problem: 'كحول وإدمان سلوكي',
      wilaya: 'وهران',
      specialist: 'د. كريم بوعلام',
      status: 'نشط',
      statusColor: 'bg-emerald-50 text-emerald-700 border-emerald-200'
    },
    {
      code: '#SC-2025-0018',
      patient: 'محمد العربي',
      problem: 'مؤثرات عقلية وأدوية',
      wilaya: 'قسنطينة',
      specialist: 'أ. محمد العربي (قانوني)',
      status: 'معلق',
      statusColor: 'bg-amber-50 text-amber-700 border-amber-200'
    },
    {
      code: '#SC-2025-0021',
      patient: 'ياسين م.',
      problem: 'إدمان رقمي وقمار',
      wilaya: 'عنابة',
      specialist: 'د. نادية س.',
      status: 'مكتمل',
      statusColor: 'bg-blue-50 text-blue-700 border-blue-200'
    },
    {
      code: '#SC-2025-0024',
      patient: 'عمر ب.',
      problem: 'إدمان المخدرات',
      wilaya: 'البليدة',
      specialist: 'مركز الأمل للسموم',
      status: 'نشط',
      statusColor: 'bg-emerald-50 text-emerald-700 border-emerald-200'
    }
  ];

  const filtered = cases.filter(c => {
    const matchesQ = c.patient.includes(query) || c.code.includes(query) || c.problem.includes(query) || c.wilaya.includes(query);
    const matchesWilaya = selectedWilaya === 'all' || c.wilaya.includes(selectedWilaya);
    const matchesStatus = selectedStatus === 'all' || c.status === selectedStatus;
    return matchesQ && matchesWilaya && matchesStatus;
  });

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
        <h1 className="text-base font-black text-slate-900">البحث والتصفية الذكية</h1>
        <div className="w-8" />
      </div>

      {/* Search Input (Matching Screen 11) */}
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ابحث عن اسم، رقم ملف، ولاية، أو تخصص..."
          className="w-full pl-4 pr-10 py-3 bg-white border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1565C0]/20 focus:border-[#1565C0] shadow-xs"
        />
        <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
      </div>

      {/* Filter Selectors Row (Matching Screen 11) */}
      <div className="grid grid-cols-3 gap-2 text-xs">
        <select
          value={selectedProblem}
          onChange={(e) => setSelectedProblem(e.target.value)}
          className="px-2.5 py-2 bg-white border border-slate-200 rounded-xl font-medium text-slate-700 outline-none text-[11px]"
        >
          <option value="all">نوع المشكلة: الكل</option>
          <option value="drugs">مخدرات</option>
          <option value="alcohol">كحول</option>
          <option value="psychotropics">مؤثرات عقلية</option>
        </select>

        <select
          value={selectedWilaya}
          onChange={(e) => setSelectedWilaya(e.target.value)}
          className="px-2.5 py-2 bg-white border border-slate-200 rounded-xl font-medium text-slate-700 outline-none text-[11px]"
        >
          <option value="all">الولاية: الكل</option>
          <option value="الجزائر">الجزائر العاصمة</option>
          <option value="وهران">وهران</option>
          <option value="قسنطينة">قسنطينة</option>
          <option value="عنابة">عنابة</option>
        </select>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-2.5 py-2 bg-white border border-slate-200 rounded-xl font-medium text-slate-700 outline-none text-[11px]"
        >
          <option value="all">الحالة: الكل</option>
          <option value="نشط">نشط</option>
          <option value="معلق">معلق</option>
          <option value="مكتمل">مكتمل</option>
        </select>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between pt-1">
        <span className="text-xs font-bold text-slate-700">النتائج ({filtered.length})</span>
        <span className="text-[11px] text-slate-400">تحديث فوري من قاعدة البيانات</span>
      </div>

      {/* Results List (Matching Screen 11) */}
      <div className="space-y-2.5">
        {filtered.map((item) => (
          <div
            key={item.code}
            onClick={() => onSelectCase(item.code)}
            className="p-3.5 bg-white rounded-2xl border border-slate-200/80 hover:border-[#1565C0] shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center justify-between group"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-xs sm:text-sm text-slate-900 group-hover:text-[#1565C0] transition-colors">
                  {item.patient}
                </h4>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                  {item.code}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 flex items-center gap-2">
                <span>{item.problem}</span>
                <span>•</span>
                <span className="flex items-center gap-0.5 text-slate-400">
                  <MapPin className="w-3 h-3" />
                  {item.wilaya}
                </span>
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${item.statusColor}`}>
                {item.status}
              </span>
              <ChevronLeft className="w-4 h-4 text-slate-300 group-hover:text-[#1565C0] transition-colors" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
