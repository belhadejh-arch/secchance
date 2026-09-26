import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../services/api';
import type { Association, EmergencyResource, TreatmentCenter, Wilaya } from '../types';
import { ALGERIA_WILAYAS } from '../types';
import {
  PhoneCall, Building2, MapPin, ShieldAlert, HeartHandshake,
  Search, ArrowRight, Info, RefreshCw, AlertCircle
} from 'lucide-react';

interface EmergencyDirectoryProps {
  onBack?: () => void;
}

const responseArray = <T,>(response: any, key: string): T[] => {
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.[key])) return response.data[key];
  return [];
};

export const EmergencyDirectory: React.FC<EmergencyDirectoryProps> = ({ onBack }) => {
  const [emergencies, setEmergencies] = useState<EmergencyResource[]>([]);
  const [centers, setCenters] = useState<TreatmentCenter[]>([]);
  const [associations, setAssociations] = useState<Association[]>([]);
  const [wilayas, setWilayas] = useState<Wilaya[]>(ALGERIA_WILAYAS);
  const [selectedWilaya, setSelectedWilaya] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<{ emergencies: string; centers: string; associations: string }>({
    emergencies: '', centers: '', associations: ''
  });

  const loadDirectory = useCallback(async () => {
    setLoading(true);
    setErrors({ emergencies: '', centers: '', associations: '' });
    const [emergencyResult, centerResult, associationResult, wilayaResult] = await Promise.all([
      api.getEmergencyResources().then(response => ({ ok: true as const, data: responseArray<EmergencyResource>(response, 'resources') })).catch((error: any) => ({ ok: false as const, error })),
      api.getCenters().then(response => ({ ok: true as const, data: responseArray<TreatmentCenter>(response, 'centers') })).catch((error: any) => ({ ok: false as const, error })),
      api.getAssociations().then(response => ({ ok: true as const, data: responseArray<Association>(response, 'associations') })).catch((error: any) => ({ ok: false as const, error })),
      api.getWilayas().then(response => ({ ok: true as const, data: responseArray<Wilaya>(response, 'wilayas') })).catch(() => ({ ok: false as const }))
    ]);

    if (emergencyResult.ok) setEmergencies(emergencyResult.data);
    else {
      setEmergencies([]);
      setErrors(current => ({ ...current, emergencies: emergencyResult.error?.message || 'تعذر تحميل موارد الطوارئ.' }));
    }
    if (centerResult.ok) setCenters(centerResult.data);
    else {
      setCenters([]);
      setErrors(current => ({ ...current, centers: centerResult.error?.message || 'تعذر تحميل المراكز من الدليل.' }));
    }
    if (associationResult.ok) setAssociations(associationResult.data);
    else {
      setAssociations([]);
      setErrors(current => ({ ...current, associations: associationResult.error?.message || 'تعذر تحميل الجمعيات.' }));
    }
    if (wilayaResult.ok && wilayaResult.data.length) setWilayas(wilayaResult.data);
    setLoading(false);
  }, []);

  useEffect(() => { void loadDirectory(); }, [loadDirectory]);

  const filteredCenters = useMemo(() => centers.filter(center => {
    const matchesWilaya = selectedWilaya === 'all' || String(center.wilaya_id) === selectedWilaya;
    const search = searchQuery.trim().toLocaleLowerCase();
    const target = `${center.name || ''} ${center.wilaya_name || ''} ${center.address || ''} ${center.phone || ''} ${center.services || ''}`.toLocaleLowerCase();
    return matchesWilaya && (!search || target.includes(search));
  }), [centers, searchQuery, selectedWilaya]);

  const filteredAssociations = useMemo(() => associations.filter(association => {
    const matchesWilaya = selectedWilaya === 'all' || String(association.wilaya_id) === selectedWilaya;
    const search = searchQuery.trim().toLocaleLowerCase();
    const target = `${association.name || ''} ${association.wilaya_name || ''} ${association.address || ''} ${association.phone || ''} ${association.services || ''}`.toLocaleLowerCase();
    return matchesWilaya && (!search || target.includes(search));
  }), [associations, searchQuery, selectedWilaya]);

  const retryButton = <button onClick={() => void loadDirectory()} className="inline-flex items-center gap-1 text-xs font-bold text-[#1565C0]"><RefreshCw size={14} /> إعادة المحاولة</button>;

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8 pb-24" dir="rtl">
      {onBack && (
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-xs">
            <ArrowRight className="w-4 h-4" /><span>العودة للرئيسية</span>
          </button>
        </div>
      )}

      <section className="bg-red-50 border border-red-200 rounded-3xl p-6 sm:p-8 space-y-4">
        <div className="flex items-center gap-3 text-red-800 font-extrabold text-xl">
          <ShieldAlert className="w-7 h-7" /><span>دليل الطوارئ والموارد المتاحة</span>
        </div>
        <p className="text-xs sm:text-sm text-red-950 leading-relaxed max-w-3xl">
          تعرض هذه الصفحة موارد الطوارئ الواردة من دليل المنصة. راجع بيانات كل مورد للتأكد من ملاءمتها لحالتك، واتصل بخدمات الطوارئ المحلية عند وجود خطر مباشر.
        </p>
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
            <div className="h-28 rounded-2xl bg-white/70 animate-pulse" /><div className="h-28 rounded-2xl bg-white/70 animate-pulse" />
          </div>
        ) : errors.emergencies ? (
          <div className="rounded-2xl border border-red-200 bg-white/70 p-4 text-xs text-red-800 flex items-center justify-between gap-3">
            <span className="flex items-center gap-2"><AlertCircle size={16} />{errors.emergencies}</span>{retryButton}
          </div>
        ) : emergencies.length ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
            {emergencies.map(resource => (
              <article key={resource.id} className="bg-white p-5 rounded-2xl border border-red-100 shadow-xs">
                <div className="text-xs font-bold text-slate-600">{resource.title_ar}</div>
                {resource.phone_number ? (
                  <a href={`tel:${resource.phone_number}`} className="text-2xl font-black text-red-700 my-1 font-mono tracking-wider flex items-center justify-between">
                    <span dir="ltr">{resource.phone_number}</span><PhoneCall className="w-5 h-5 text-red-400" />
                  </a>
                ) : <div className="my-2 text-xs text-slate-500">رقم الاتصال غير متاح</div>}
                {resource.description_ar && <div className="text-[11px] text-slate-500">{resource.description_ar}</div>}
                {Boolean(resource.is_24_7) && <span className="mt-2 inline-block rounded-full bg-emerald-50 text-emerald-800 px-2 py-1 text-[9px] font-bold">متاح على مدار الساعة بحسب بيانات الدليل</span>}
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-red-200 bg-white/70 p-6 text-center text-xs text-red-800">
            لا توجد موارد طوارئ مسجلة حالياً في الدليل.
          </div>
        )}
      </section>

      <section className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-slate-900 font-extrabold text-base">
            <MapPin className="w-5 h-5 text-[#1565C0]" /><span>البحث حسب الولاية أو الخدمة</span>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative min-w-[220px]">
              <input type="search" value={searchQuery} onChange={event => setSearchQuery(event.target.value)} placeholder="ابحث بالاسم أو العنوان أو الخدمة..." className="w-full pl-3 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1565C0]/20 focus:border-[#1565C0]" />
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
            </div>
            <select value={selectedWilaya} onChange={event => setSelectedWilaya(event.target.value)} className="p-2 bg-slate-50 text-xs font-bold border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1565C0]/20 focus:border-[#1565C0] outline-none">
              <option value="all">جميع الولايات</option>
              {wilayas.map(wilaya => <option key={wilaya.id} value={String(wilaya.id)}>{wilaya.code} – {wilaya.name_ar}</option>)}
            </select>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 text-slate-900 font-black text-xl"><Building2 /><h2>مراكز العلاج المسجلة</h2></div>
          {!loading && !errors.centers && <span className="text-xs font-bold px-3 py-1 bg-slate-100 text-slate-700 rounded-full w-fit">{filteredCenters.length} مركز</span>}
        </div>
        {errors.centers && <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 flex items-center justify-between gap-3 text-xs text-amber-900"><span className="flex items-center gap-2"><AlertCircle size={16} />{errors.centers}</span>{retryButton}</div>}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"><div className="h-40 rounded-2xl bg-slate-100 animate-pulse" /><div className="h-40 rounded-2xl bg-slate-100 animate-pulse" /></div>
        ) : !errors.centers && filteredCenters.length ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCenters.map(center => (
              <article key={center.id} className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between gap-3">
                <div className="space-y-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-[#1565C0] border border-blue-100">
                    {center.wilaya_name || wilayas.find(wilaya => wilaya.id === center.wilaya_id)?.name_ar || 'الولاية غير محددة'}
                  </span>
                  <h3 className="font-bold text-sm text-slate-900 leading-snug">{center.name}</h3>
                  {center.address && <p className="m-0 text-xs text-slate-600 leading-relaxed">{center.address}</p>}
                  {center.services && <p className="m-0 text-xs text-slate-500 leading-relaxed"><strong>الخدمات المسجلة:</strong> {center.services}</p>}
                </div>
                {center.phone ? (
                  <div className="pt-3 border-t border-slate-100">
                    <a href={`tel:${center.phone}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-[#2E7D32] rounded-xl text-xs font-mono font-bold border border-emerald-200/80">
                      <PhoneCall className="w-3.5 h-3.5" /><span dir="ltr">{center.phone}</span>
                    </a>
                  </div>
                ) : <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex gap-1.5"><Info size={14} />رقم الاتصال غير مدرج.</div>}
              </article>
            ))}
          </div>
        ) : !errors.centers ? (
          <div className="text-center py-10 bg-white rounded-3xl border border-dashed border-slate-300 text-slate-500 text-xs">
            {centers.length ? 'لا توجد مراكز مطابقة للبحث والولاية المحددين.' : 'لا توجد مراكز علاج مدرجة حالياً في الدليل.'}
          </div>
        ) : null}
      </section>

      <section className="space-y-4 pt-4 border-t border-slate-200">
        <div className="flex items-center gap-2 text-slate-900 font-extrabold text-lg">
          <HeartHandshake className="w-5 h-5 text-teal-700" /><span>الجمعيات المسجلة</span>
        </div>
        {errors.associations && <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 flex items-center justify-between gap-3 text-xs text-amber-900"><span>{errors.associations}</span>{retryButton}</div>}
        {loading ? <div className="h-28 rounded-2xl bg-slate-100 animate-pulse" /> : !errors.associations && filteredAssociations.length ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAssociations.map(association => (
              <article key={association.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <div>
                  <h3 className="font-bold text-sm text-slate-900">{association.name}</h3>
                  <div className="text-xs text-teal-700 font-semibold mt-0.5">{association.wilaya_name || 'الولاية غير محددة'}</div>
                </div>
                {association.services && <div className="text-xs text-slate-600"><span className="font-bold">الخدمات المسجلة:</span> {association.services}</div>}
                {association.address && <div className="text-xs text-slate-500">{association.address}</div>}
                {association.phone && <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-bold"><span className="text-slate-500">للتواصل:</span><a href={`tel:${association.phone}`} className="text-[#1565C0] font-black hover:underline flex items-center gap-1"><PhoneCall className="w-3.5 h-3.5" /><span dir="ltr">{association.phone}</span></a></div>}
              </article>
            ))}
          </div>
        ) : !errors.associations ? (
          <div className="text-center py-7 text-xs text-slate-500 bg-white rounded-2xl border border-slate-200">
            {associations.length ? 'لا توجد جمعيات مطابقة للولاية المحددة.' : 'لا توجد جمعيات مدرجة حالياً.'}
          </div>
        ) : null}
      </section>
    </main>
  );
};