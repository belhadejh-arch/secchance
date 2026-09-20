import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { EmergencyResource, TreatmentCenter, Association, Wilaya } from '../types';
import { PhoneCall, Building2, Users, MapPin, ShieldAlert, HeartHandshake } from 'lucide-react';

export const EmergencyDirectory: React.FC = () => {
  const [emergencies, setEmergencies] = useState<EmergencyResource[]>([]);
  const [centers, setCenters] = useState<TreatmentCenter[]>([]);
  const [associations, setAssociations] = useState<Association[]>([]);
  const [wilayas, setWilayas] = useState<Wilaya[]>([]);
  const [selectedWilaya, setSelectedWilaya] = useState<string>('all');

  useEffect(() => {
    api.getEmergencyResources().then(res => res.data && setEmergencies(res.data)).catch(() => {});
    api.getCenters().then(res => res.data && setCenters(res.data)).catch(() => {});
    api.getAssociations().then(res => res.data && setAssociations(res.data)).catch(() => {});
    api.getWilayas().then(res => res.data && setWilayas(res.data)).catch(() => {});
  }, []);

  const filteredCenters = selectedWilaya === 'all'
    ? centers
    : centers.filter(c => c.wilaya_name?.includes(selectedWilaya));

  const filteredAssocs = selectedWilaya === 'all'
    ? associations
    : associations.filter(a => a.wilaya_name?.includes(selectedWilaya));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner */}
      <div className="bg-red-50 border border-red-200 rounded-3xl p-6 sm:p-8 space-y-4">
        <div className="flex items-center gap-3 text-red-700 font-extrabold text-xl">
          <ShieldAlert className="w-7 h-7 animate-pulse" />
          <span>الدليل الوطني للطوارئ والاستجابة السريعة</span>
        </div>
        <p className="text-xs sm:text-sm text-red-950 leading-relaxed max-w-3xl">
          هذه الخطوط مجانية وتعمل 24 ساعة يومياً. في حال وجود خطر جسدي حاد، تسمم دوائي، أو اضطراب نفسي يهدد سلامة الشخص أو محيطه، اتصل بالأرقام أدناه مباشرة.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
          {emergencies.map((em) => (
            <a
              key={em.id}
              href={`tel:${em.phone_number}`}
              className="bg-white p-5 rounded-2xl border border-red-100 shadow-xs hover:border-red-300 hover:shadow-md transition-all group block"
            >
              <div className="text-xs font-bold text-slate-600 group-hover:text-red-600 transition-colors">
                {em.title_ar}
              </div>
              <div className="text-3xl font-black text-red-600 my-1 font-mono tracking-wider flex items-center justify-between">
                <span>{em.phone_number}</span>
                <PhoneCall className="w-5 h-5 text-red-400 group-hover:text-red-600" />
              </div>
              <div className="text-[11px] text-slate-500">{em.description_ar}</div>
            </a>
          ))}
        </div>
      </div>

      {/* Filter by Wilaya */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="font-bold text-sm text-slate-800 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-[#1565C0]" />
          <span>تصفية المراكز والجمعيات حسب الولاية:</span>
        </div>
        <select
          value={selectedWilaya}
          onChange={(e) => setSelectedWilaya(e.target.value)}
          className="p-2.5 text-xs font-bold border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#1565C0] outline-none"
        >
          <option value="all">جميع الولايات الوطنية</option>
          {wilayas.map(w => (
            <option key={w.id} value={w.name_ar}>{w.code} - {w.name_ar}</option>
          ))}
        </select>
      </div>

      {/* Accredited Treatment Centers */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-slate-900 font-extrabold text-lg">
          <Building2 className="w-5 h-5 text-[#2E7D32]" />
          <span>مراكز علاج وتأهيل الإدمان المعتمدة (الاستشفاء وإزالة السموم)</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCenters.length === 0 ? (
            <div className="col-span-3 text-center py-8 text-xs text-slate-400">لا توجد مراكز مسجلة في الولاية المحددة</div>
          ) : (
            filteredCenters.map(c => (
              <div key={c.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">{c.name}</h3>
                    <div className="text-xs text-[#2E7D32] font-semibold mt-0.5">{c.wilaya_name}</div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    معتمد
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">{c.address}</p>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-500">الهاتف المباشر:</span>
                  <a href={`tel:${c.phone}`} className="text-[#1565C0] font-sans font-black hover:underline flex items-center gap-1">
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>{c.phone}</span>
                  </a>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Accredited Associations */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-slate-900 font-extrabold text-lg">
          <HeartHandshake className="w-5 h-5 text-teal-700" />
          <span>جمعيات المرافقة الأسرية والدعم وإعادة الإدماج</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAssocs.length === 0 ? (
            <div className="col-span-3 text-center py-8 text-xs text-slate-400">لا توجد جمعيات مسجلة في الولاية المحددة</div>
          ) : (
            filteredAssocs.map(a => (
              <div key={a.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">{a.name}</h3>
                    <div className="text-xs text-teal-700 font-semibold mt-0.5">{a.wilaya_name}</div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800">
                    شريك مجتمعي
                  </span>
                </div>

                <div className="text-xs text-slate-600">
                  <span className="font-bold">خدمات المرافقة:</span> {a.services}
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-500">للتواصل المباشر:</span>
                  <a href={`tel:${a.phone}`} className="text-[#1565C0] font-sans font-black hover:underline flex items-center gap-1">
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>{a.phone}</span>
                  </a>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
