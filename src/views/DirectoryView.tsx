import React, { useState } from 'react';
import { initialTreatmentCenters, initialAssociations } from '../data/initialData';
import { Building2, Users, MapPin, Phone, Search, Stethoscope } from 'lucide-react';

export const DirectoryView: React.FC = () => {
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'all' | 'centers' | 'associations'>('all');

  const filteredCenters = initialTreatmentCenters.filter(
    (c) =>
      c.name.includes(search) ||
      c.wilayaName.includes(search) ||
      c.services.includes(search)
  );

  const filteredAssociations = initialAssociations.filter(
    (a) =>
      a.name.includes(search) ||
      a.wilayaName.includes(search) ||
      a.services.includes(search)
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900">
          دليل مراكز علاج الإدمان والجمعيات الشريكة
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          قائمة المراكز الاستشفائية المتخصصة والجمعيات المعتمدة عبر ولايات الوطن
        </p>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث بالاسم، الولاية، أو نوع الخدمة..."
            className="w-full pr-10 pl-4 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl outline-hidden focus:ring-2 focus:ring-blue-600 bg-white"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          <button
            onClick={() => setTab('all')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
              tab === 'all'
                ? 'bg-blue-700 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            الكل
          </button>
          <button
            onClick={() => setTab('centers')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
              tab === 'centers'
                ? 'bg-blue-700 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            مراكز العلاج
          </button>
          <button
            onClick={() => setTab('associations')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
              tab === 'associations'
                ? 'bg-blue-700 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            الجمعيات
          </button>
        </div>
      </div>

      {/* Centers Section */}
      {(tab === 'all' || tab === 'centers') && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-700" />
            <h2 className="text-base font-black text-slate-900">
              مراكز علاج الإدمان والمؤسسات الاستشفائية المتخصصة
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCenters.map((center) => (
              <div
                key={center.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-blue-300 transition-all space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-slate-900 leading-snug">
                    {center.name}
                  </h3>
                  <span className="text-[11px] font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded-md shrink-0">
                    {center.wilayaName}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{center.address}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-blue-700 font-bold">
                    <Phone className="w-3.5 h-3.5 shrink-0" />
                    <span dir="ltr">{center.phone}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 text-xs text-slate-600">
                  <span className="font-semibold text-slate-800">الخدمات:</span> {center.services}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Associations Section */}
      {(tab === 'all' || tab === 'associations') && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-700" />
            <h2 className="text-base font-black text-slate-900">
              الجمعيات الوطنية والولائية لمكافحة الإدمان والمرافقة الأسرية
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAssociations.map((assoc) => (
              <div
                key={assoc.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-emerald-300 transition-all space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-slate-900 leading-snug">
                    {assoc.name}
                  </h3>
                  <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md shrink-0">
                    {assoc.wilayaName}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{assoc.address}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
                    <Phone className="w-3.5 h-3.5 shrink-0" />
                    <span dir="ltr">{assoc.phone}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 text-xs text-slate-600">
                  <span className="font-semibold text-slate-800">نشاط الجمعية:</span> {assoc.services}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
