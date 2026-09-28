import React, { useState } from 'react';
import { initialTreatmentCenters, initialAssociations } from '../data/initialData';
import { Search, Phone, MapPin, AlertCircle, Building2, HeartHandshake } from 'lucide-react';

export const DirectoryView: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'centers' | 'associations'>('centers');

  const filteredCenters = initialTreatmentCenters.filter((center) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      center.name.toLowerCase().includes(q) ||
      center.wilayaName.toLowerCase().includes(q) ||
      center.address.toLowerCase().includes(q) ||
      center.phone.toLowerCase().includes(q) ||
      center.services.toLowerCase().includes(q)
    );
  });

  const filteredAssociations = initialAssociations.filter((assoc) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      assoc.name.toLowerCase().includes(q) ||
      assoc.wilayaName.toLowerCase().includes(q) ||
      assoc.address.toLowerCase().includes(q) ||
      assoc.phone.toLowerCase().includes(q) ||
      assoc.services.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* Page Header */}
      <div>
        <h1 className="text-[20px] font-black text-[#203945]">
          دليل مراكز علاج الإدمان في الجزائر 🇩🇿
        </h1>
        <p className="text-[12px] text-[#203945]/70 mt-0.5">
          دليل وطني شامل يضم المراكز الوسيطة لعلاج الإدمان (CISA / EPSP) والمصالح الاستشفائية المتخصصة والجمعيات عبر ولايات الوطن
        </p>
      </div>

      {/* Important Advisory Note */}
      <div className="bg-[#FFF8E1] border border-[#FFE082] rounded-[14px] p-3.5 flex items-start gap-3 shadow-xs">
        <AlertCircle className="w-5 h-5 text-[#F57F17] shrink-0 mt-0.5" />
        <p className="text-[12px] text-[#5D4037] leading-[19px] font-medium">
          <strong className="font-bold text-[#E65100]">⚠️ ملاحظة مهمة:</strong> بعض أرقام ومواقع المراكز المتداولة على الإنترنت قديمة، لذلك اتصل بالمركز قبل ما تتنقل للتأكد من العنوان ورقم الاستقبال والخدمات المتوفرة.
        </p>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-[#1766A6] absolute right-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="ابحث باسم المركز، رقم أو اسم الولاية (مثال: وهران، الشراقة، 05، عنابة...)"
          className="w-full pr-10 pl-3 py-2.5 bg-white border border-[#CCD8D5] rounded-[12px] text-xs sm:text-sm text-[#203945] outline-hidden focus:border-[#1766A6] shadow-xs"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#203945]/50 hover:text-[#203945]"
          >
            مسح
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => setActiveTab('centers')}
          className={`py-2 px-3 rounded-[10px] text-[12px] font-bold flex items-center justify-center gap-1.5 transition-colors ${
            activeTab === 'centers'
              ? 'bg-[#1766A6] text-white shadow-xs'
              : 'bg-[#E5ECE9] text-[#203945] hover:bg-[#d8e1de]'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>مراكز علاج الإدمان ({filteredCenters.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('associations')}
          className={`py-2 px-3 rounded-[10px] text-[12px] font-bold flex items-center justify-center gap-1.5 transition-colors ${
            activeTab === 'associations'
              ? 'bg-[#1766A6] text-white shadow-xs'
              : 'bg-[#E5ECE9] text-[#203945] hover:bg-[#d8e1de]'
          }`}
        >
          <HeartHandshake className="w-4 h-4" />
          <span>الجمعيات المعتمدة ({filteredAssociations.length})</span>
        </button>
      </div>

      {/* Content Section */}
      {activeTab === 'centers' ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-[15px] font-bold text-[#1766A6]">
              المراكز الوسيطة والمؤسسات الاستشفائية المتخصصة ({filteredCenters.length})
            </h2>
            {searchQuery && (
              <span className="text-[11px] text-[#203945]/60">
                نتائج البحث عن: «{searchQuery}»
              </span>
            )}
          </div>

          {filteredCenters.length === 0 ? (
            <div className="bg-[#FBFDFC] rounded-[16px] border border-[#E5ECE9] p-8 text-center space-y-2">
              <Building2 className="w-8 h-8 text-[#1766A6]/40 mx-auto" />
              <p className="text-sm font-bold text-[#203945]">لم يتم العثور على أي مركز يطابق بحثك</p>
              <button
                onClick={() => setSearchQuery('')}
                className="text-xs text-[#1766A6] font-bold underline"
              >
                عرض كل المراكز الـ 40
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredCenters.map((center) => {
                const isCallable = center.phone && !center.phone.includes('اتصل');
                const rawPhone = center.phone.split('/')[0].trim();

                return (
                  <div
                    key={center.id}
                    className="bg-[#FBFDFC] rounded-[16px] border border-[#E5ECE9] p-4 shadow-xs hover:border-[#1766A6]/40 transition-all flex flex-col justify-between space-y-2.5"
                  >
                    <div>
                      {/* Wilaya badge & Name */}
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold text-[14px] text-[#203945] leading-snug">
                          {center.name}
                        </h3>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-[6px] bg-[#EAF3F8] text-[#104A78] shrink-0">
                          {center.wilayaName}
                        </span>
                      </div>

                      {/* Address */}
                      <div className="flex items-start gap-1.5 mt-2 text-[11px] text-[#203945]/75">
                        <MapPin className="w-3.5 h-3.5 text-[#1766A6] shrink-0 mt-0.5" />
                        <span>{center.address}</span>
                      </div>

                      {/* Services */}
                      <p className="text-[11px] text-[#25866D] font-medium mt-1.5 leading-normal">
                        الخدمات: {center.services}
                      </p>
                    </div>

                    {/* Phone / Contact */}
                    <div className="pt-2 border-t border-[#E5ECE9] flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-[12px] text-[#203945]">
                        <Phone className="w-3.5 h-3.5 text-[#1766A6]" />
                        <span className="font-bold tracking-wide" dir="ltr">
                          {center.phone}
                        </span>
                      </div>

                      {isCallable ? (
                        <a
                          href={`tel:${rawPhone.replace(/\s+/g, '')}`}
                          className="px-2.5 py-1 rounded-[6px] bg-[#1766A6] hover:bg-[#125386] text-white text-[11px] font-bold flex items-center gap-1 transition-colors"
                        >
                          <Phone className="w-3 h-3" />
                          <span>اتصال</span>
                        </a>
                      ) : (
                        <span className="text-[10px] text-[#203945]/60 bg-[#E5ECE9] px-2 py-0.5 rounded-[4px]">
                          استقبال محلي
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* Associations Tab */
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-[15px] font-bold text-[#1766A6]">
              الجمعيات الوطنية والولائية المعتمدة ({filteredAssociations.length})
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredAssociations.map((assoc) => (
              <div
                key={assoc.id}
                className="bg-[#FBFDFC] rounded-[16px] border border-[#E5ECE9] p-4 shadow-xs space-y-2 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-[14px] text-[#203945]">
                      {assoc.name}
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-[6px] bg-[#E8F4EF] text-[#1A5E4D] shrink-0">
                      {assoc.wilayaName}
                    </span>
                  </div>

                  <div className="flex items-start gap-1.5 mt-2 text-[11px] text-[#203945]/70">
                    <MapPin className="w-3.5 h-3.5 text-[#25866D] shrink-0 mt-0.5" />
                    <span>{assoc.address}</span>
                  </div>

                  <p className="text-[11px] text-[#25866D] font-medium mt-1.5">
                    النشاط: {assoc.services}
                  </p>
                </div>

                <div className="pt-2 border-t border-[#E5ECE9] flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[12px] text-[#203945]">
                    <Phone className="w-3.5 h-3.5 text-[#25866D]" />
                    <span className="font-bold tracking-wide" dir="ltr">
                      {assoc.phone}
                    </span>
                  </div>

                  <a
                    href={`tel:${assoc.phone.replace(/[^0-9]/g, '')}`}
                    className="px-2.5 py-1 rounded-[6px] bg-[#25866D] hover:bg-[#1e6c58] text-white text-[11px] font-bold flex items-center gap-1 transition-colors"
                  >
                    <Phone className="w-3 h-3" />
                    <span>اتصال</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
