import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { EmergencyResource, Association, Wilaya, ALGERIA_WILAYAS } from '../types';
import { 
  PhoneCall, 
  Building2, 
  MapPin, 
  ShieldAlert, 
  HeartHandshake, 
  AlertTriangle, 
  Search,
  ArrowRight,
  ExternalLink,
  Info
} from 'lucide-react';
import { ALGERIA_TREATMENT_CENTERS, TREATMENT_CENTERS_NOTICE, TreatmentCenterData } from '../data/treatmentCenters';

interface EmergencyDirectoryProps {
  onBack?: () => void;
}

export const EmergencyDirectory: React.FC<EmergencyDirectoryProps> = ({ onBack }) => {
  const [emergencies, setEmergencies] = useState<EmergencyResource[]>([]);
  const [associations, setAssociations] = useState<Association[]>([]);
  const [wilayas, setWilayas] = useState<Wilaya[]>(ALGERIA_WILAYAS);
  const [selectedWilaya, setSelectedWilaya] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    api.getEmergencyResources().then(res => res.data && setEmergencies(res.data)).catch(() => {});
    api.getAssociations().then(res => res.data && setAssociations(res.data)).catch(() => {});
    api.getWilayas().then(res => res.data && setWilayas(res.data)).catch(() => {});
  }, []);

  // Filter 20 treatment centers based on wilaya selection and text search
  const filteredTreatmentCenters = ALGERIA_TREATMENT_CENTERS.filter((c: TreatmentCenterData) => {
    const matchesWilaya =
      selectedWilaya === 'all' ||
      c.wilayaName.includes(selectedWilaya) ||
      selectedWilaya.includes(c.wilayaName) ||
      c.wilayaCode === selectedWilaya;

    const matchesSearch =
      !searchQuery.trim() ||
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.wilayaName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.wilayaCode.includes(searchQuery) ||
      (c.phone && c.phone.includes(searchQuery));

    return matchesWilaya && matchesSearch;
  });

  const filteredAssocs = selectedWilaya === 'all'
    ? associations
    : associations.filter(a => a.wilaya_name?.includes(selectedWilaya));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8" dir="rtl">
      {/* Navigation Header if onBack provided */}
      {onBack && (
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
          >
            <ArrowRight className="w-4 h-4" />
            <span>العودة للرئيسية</span>
          </button>
        </div>
      )}

      {/* Top Banner - Emergency Lines */}
      <div className="bg-red-50 border border-red-200 rounded-3xl p-6 sm:p-8 space-y-4">
        <div className="flex items-center gap-3 text-red-700 font-extrabold text-xl">
          <ShieldAlert className="w-7 h-7 animate-pulse" />
          <span>الدليل الوطني للطوارئ والاستجابة السريعة</span>
        </div>
        <p className="text-xs sm:text-sm text-red-950 leading-relaxed max-w-3xl">
          هذه الخطوط مجانية وتعمل 24 ساعة يومياً. في حال وجود خطر جسدي حاد، تسمم دوائي، أو اضطراب نفسي يهدد سلامة الشخص أو محيطه، اتصل بالأرقام أدناه مباشرة.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
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

      {/* Filter and Search Bar */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-slate-900 font-extrabold text-base">
            <MapPin className="w-5 h-5 text-[#1565C0]" />
            <span>البحث وتصفية المراكز حسب الولاية</span>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search Box */}
            <div className="relative min-w-[220px]">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث بالاسم أو الولاية..."
                className="w-full pl-3 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1565C0]/20 focus:border-[#1565C0]"
              />
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
            </div>

            {/* Wilaya Dropdown */}
            <select
              value={selectedWilaya}
              onChange={(e) => setSelectedWilaya(e.target.value)}
              className="p-2 bg-slate-50 text-xs font-bold border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1565C0]/20 focus:border-[#1565C0] outline-none cursor-pointer"
            >
              <option value="all">جميع الولايات الوطنية</option>
              {wilayas.map((w) => (
                <option key={w.id} value={w.name_ar}>
                  {w.code} – {w.name_ar}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 🚨 مراكز علاج الإدمان في الجزائر 🇩🇿 (Requested Section) */}
      <div className="space-y-4" id="treatment-centers-section">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 text-slate-900 font-black text-xl">
            <span className="text-2xl">🚨</span>
            <h2>مراكز علاج الإدمان في الجزائر 🇩🇿</h2>
          </div>
          <span className="text-xs font-bold px-3 py-1 bg-emerald-50 text-[#2E7D32] border border-emerald-200 rounded-full w-fit">
            {filteredTreatmentCenters.length} مركزاً معتمداً
          </span>
        </div>

        {/* ⚠️ ملاحظة مهمة (User's Exact Notice) */}
        <div className="bg-amber-50/90 border border-amber-300 rounded-2xl p-4 sm:p-5 flex items-start gap-3 text-amber-950 shadow-xs">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm font-semibold leading-relaxed">
            <span className="font-extrabold text-amber-800">⚠️ ملاحظة مهمة:</span> بعض أرقام ومواقع المراكز المتداولة على الإنترنت قديمة، لذلك اتصل بالمركز قبل ما تتنقل للتأكد من العنوان ورقم الاستقبال والخدمات المتوفرة.
          </div>
        </div>

        {/* Centers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTreatmentCenters.length === 0 ? (
            <div className="col-span-full text-center py-12 bg-white rounded-3xl border border-dashed border-slate-300 text-slate-500 text-xs">
              لا توجد مراكز مطابقة لبحثك في الولاية المحددة. جرب اختيار "جميع الولايات الوطنية".
            </div>
          ) : (
            filteredTreatmentCenters.map((center) => (
              <div
                key={center.id}
                className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md hover:border-[#2E7D32]/40 transition-all flex flex-col justify-between space-y-3"
              >
                <div className="space-y-2">
                  {/* Wilaya Tag */}
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black bg-blue-50 text-[#1565C0] border border-blue-100">
                      <span>📍</span>
                      <span>{center.wilayaCode} – {center.wilayaName}</span>
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      معتمد
                    </span>
                  </div>

                  {/* Center Name */}
                  <h3 className="font-bold text-sm text-slate-900 leading-snug pt-1">
                    {center.name}
                  </h3>

                  {/* Optional Description / Service Notes */}
                  {center.description && (
                    <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      {center.description}
                    </p>
                  )}
                </div>

                {/* Phone Call Section */}
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  {center.phones && center.phones.length > 0 ? (
                    <div className="space-y-1.5">
                      <div className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                        <span>📞 الاتصال المباشر:</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {center.phones.map((phoneNum, idx) => (
                          <a
                            key={idx}
                            href={`tel:${phoneNum.replace(/\s+/g, '')}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-[#2E7D32] text-[#2E7D32] hover:text-white rounded-xl text-xs font-mono font-bold transition-all border border-emerald-200/80 shadow-2xs group"
                          >
                            <PhoneCall className="w-3.5 h-3.5 text-[#2E7D32] group-hover:text-white" />
                            <span dir="ltr">{phoneNum}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-[11px] text-slate-500 flex items-center gap-1.5 bg-slate-50 p-2 rounded-xl">
                      <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>للاستفسار: يرجى مراجعة مصلحة EPSP الولائية أو التنقل المباشر للمركز</span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Accredited Associations Section */}
      <div className="space-y-4 pt-4 border-t border-slate-200">
        <div className="flex items-center gap-2 text-slate-900 font-extrabold text-lg">
          <HeartHandshake className="w-5 h-5 text-teal-700" />
          <span>جمعيات المرافقة الأسرية والدعم وإعادة الإدماج</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAssocs.length === 0 ? (
            <div className="col-span-full text-center py-6 text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">
              لا توجد جمعيات مسجلة في الولاية المحددة
            </div>
          ) : (
            filteredAssocs.map((a) => (
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
                    <span dir="ltr">{a.phone}</span>
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
