import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Search, MapPin, ChevronLeft, RefreshCw, AlertCircle, FileSearch } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import type { CaseFile } from '../types';
import { wilayas } from '../data/wilayas';

interface SmartSearchViewProps {
  onBack: () => void;
  onSelectCase: (code: string) => void;
}

const statusLabels: Record<string, string> = {
  NEW: 'جديد',
  UNDER_REVIEW: 'قيد المراجعة',
  ASSIGNED: 'تم إسناد المختص',
  FIRST_SESSION: 'الجلسة الأولى',
  FOLLOW_UP: 'متابعة',
  REFERRED: 'تمت الإحالة',
  COMPLETED: 'مكتمل',
  ARCHIVED: 'مؤرشف'
};

const getCaseArray = (value: any): CaseFile[] => Array.isArray(value?.data) ? value.data : [];

export const SmartSearchView: React.FC<SmartSearchViewProps> = ({ onBack, onSelectCase }) => {
  const { user, isLoading: authLoading } = useAuth();
  const [cases, setCases] = useState<CaseFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [selectedProblem, setSelectedProblem] = useState('all');
  const [selectedWilaya, setSelectedWilaya] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  const loadCases = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.getCases();
      setCases(getCaseArray(response));
    } catch (err: any) {
      setCases([]);
      setError(err?.status === 401 || err?.status === 403
        ? 'سجّل الدخول لعرض الملفات التي يتيحها حسابك.'
        : err?.message || 'تعذر تحميل الملفات المتاحة لحسابك.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setCases([]);
      setError('سجّل الدخول لعرض الملفات التي يتيحها حسابك.');
      setLoading(false);
      return;
    }
    void loadCases();
  }, [authLoading, user?.id]);

  const statuses = useMemo(() => Array.from(new Set(cases.map(item => item.status).filter(Boolean))), [cases]);
  const filtered = useMemo(() => cases.filter(item => {
    const extended = item as CaseFile & { wilaya_name?: string };
    const person = `${item.patient_first_name || ''} ${item.patient_last_name || ''}`.trim();
    const wilaya = extended.wilaya_name || '';
    const problem = item.addiction_type_name || '';
    const specialist = `${item.psy_first_name || ''} ${item.psy_last_name || ''} ${item.lawyer_first_name || ''} ${item.lawyer_last_name || ''} ${item.center_name || ''}`;
    const searchTarget = `${person} ${item.number_case || ''} ${problem} ${wilaya} ${specialist}`.toLocaleLowerCase();
    const matchesQuery = !query.trim() || searchTarget.includes(query.trim().toLocaleLowerCase());
    const matchesWilaya = selectedWilaya === 'all' || wilaya.includes(selectedWilaya);
    const normalizedProblem = problem.toLocaleLowerCase();
    const matchesProblem = selectedProblem === 'all'
      || (selectedProblem === 'drugs' && /مخدر|مواد/.test(normalizedProblem))
      || (selectedProblem === 'alcohol' && /كحول/.test(normalizedProblem))
      || (selectedProblem === 'psychotropics' && /مؤثرات|أدوية|دواء/.test(normalizedProblem));
    const matchesStatus = selectedStatus === 'all' || item.status === selectedStatus;
    return matchesQuery && matchesWilaya && matchesProblem && matchesStatus;
  }), [cases, query, selectedProblem, selectedWilaya, selectedStatus]);

  const filterClass = 'px-2.5 py-2 bg-white border border-slate-200 rounded-xl font-medium text-slate-700 outline-none text-[11px]';

  return (
    <main className="max-w-xl mx-auto px-4 py-4 space-y-4 pb-24" dir="rtl">
      <header className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-1.5 text-slate-600 hover:text-slate-900 text-xs font-bold">
          <ArrowRight className="w-4 h-4" /><span>رجوع</span>
        </button>
        <h1 className="text-base font-black text-slate-900">البحث والتصفية الذكية</h1>
        <button onClick={() => void loadCases()} className="p-2 rounded-xl text-slate-500 hover:bg-slate-100" aria-label="إعادة تحميل الملفات">
          <RefreshCw className="w-4 h-4" />
        </button>
      </header>

      <div className="relative">
        <input
          type="search"
          value={query}
          onChange={event => setQuery(event.target.value)}
          placeholder="ابحث برقم الملف أو الاسم أو النوع أو الولاية..."
          className="w-full pl-4 pr-10 py-3 bg-white border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1565C0]/20 focus:border-[#1565C0] shadow-xs"
        />
        <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
        <select value={selectedProblem} onChange={event => setSelectedProblem(event.target.value)} className={filterClass}>
          <option value="all">نوع المشكلة: الكل</option>
          <option value="drugs">مخدرات ومواد</option>
          <option value="alcohol">كحول</option>
          <option value="psychotropics">مؤثرات عقلية وأدوية</option>
        </select>
        <select value={selectedWilaya} onChange={event => setSelectedWilaya(event.target.value)} className={filterClass}>
          <option value="all">الولاية: الكل</option>
          {wilayas.map(item => <option key={item.code} value={item.name_ar}>{item.code} - {item.name_ar}</option>)}
        </select>
        <select value={selectedStatus} onChange={event => setSelectedStatus(event.target.value)} className={filterClass}>
          <option value="all">الحالة: الكل</option>
          {statuses.map(status => <option key={status} value={status}>{statusLabels[status] || status}</option>)}
        </select>
      </div>

      <div className="flex items-center justify-between pt-1">
        <span className="text-xs font-bold text-slate-700">النتائج ({loading ? '—' : filtered.length})</span>
        <span className="text-[11px] text-slate-400">الملفات المتاحة لحسابك</span>
      </div>

      {loading ? (
        <div className="space-y-2.5" aria-label="جارٍ تحميل الملفات">
          <div className="h-20 rounded-2xl bg-slate-100 animate-pulse" />
          <div className="h-20 rounded-2xl bg-slate-100 animate-pulse" />
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-center space-y-3">
          <AlertCircle className="w-6 h-6 mx-auto text-amber-700" />
          <p className="m-0 text-xs text-amber-900">{error}</p>
          {user && <button onClick={() => void loadCases()} className="text-xs font-bold text-[#1565C0]">إعادة المحاولة</button>}
        </div>
      ) : filtered.length ? (
        <div className="space-y-2.5">
          {filtered.map(item => {
            const extended = item as CaseFile & { wilaya_name?: string };
            const person = `${item.patient_first_name || ''} ${item.patient_last_name || ''}`.trim();
            return (
              <button
                type="button"
                key={item.id}
                onClick={() => onSelectCase(item.number_case)}
                className="w-full text-right p-3.5 bg-white rounded-2xl border border-slate-200/80 hover:border-[#1565C0] shadow-xs hover:shadow-md transition-all flex items-center justify-between gap-3 group"
              >
                <span className="min-w-0 space-y-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <strong className="text-xs sm:text-sm text-slate-900 group-hover:text-[#1565C0]">{person || 'اسم المستفيد غير متاح'}</strong>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">{item.number_case}</span>
                  </span>
                  <span className="text-[11px] text-slate-500 flex items-center gap-2">
                    <span>{item.addiction_type_name || 'نوع الحالة غير محدد'}</span>
                    {extended.wilaya_name && <span className="flex items-center gap-0.5 text-slate-400"><MapPin className="w-3 h-3" />{extended.wilaya_name}</span>}
                  </span>
                </span>
                <span className="flex items-center gap-2 shrink-0">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold border border-slate-200 bg-slate-50 text-slate-600">{statusLabels[item.status] || item.status}</span>
                  <ChevronLeft className="w-4 h-4 text-slate-300 group-hover:text-[#1565C0]" />
                </span>
              </button>
            );
          })}
        </div>
      ) : cases.length ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-7 text-center">
          <FileSearch className="w-6 h-6 mx-auto text-slate-400" />
          <h2 className="mt-3 text-sm font-bold text-slate-700">لا توجد نتائج مطابقة</h2>
          <p className="text-xs text-slate-500">جرّب تعديل كلمات البحث أو عوامل التصفية.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-7 text-center">
          <FileSearch className="w-6 h-6 mx-auto text-slate-400" />
          <h2 className="mt-3 text-sm font-bold text-slate-700">لا توجد ملفات متاحة</h2>
          <p className="text-xs text-slate-500">لا توجد حالات مرئية لحسابك حالياً.</p>
        </div>
      )}
    </main>
  );
};