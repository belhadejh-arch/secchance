import React, { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Hospital,
  ExternalLink,
  Handshake,
  LocateFixed,
  MapPin,
  Phone,
  Search,
  X,
} from 'lucide-react';
import { ALGERIA_WILAYAS, Association, TreatmentCenter } from '../types';
import { getNeighboringWilayas, getWilayaName } from '../data/wilayaNeighbors';
import { getPublicDirectory } from '../services/dbService';

type DirectoryTab = 'centers' | 'associations';
type CenterRange = 'municipality' | 'wilaya' | 'neighbors' | 'nearest';

interface Coordinates {
  latitude: number;
  longitude: number;
}

interface CenterFilters {
  wilaya: string;
  municipality: string;
  range: CenterRange;
}

interface AssociationFilters {
  wilaya: string;
  municipality: string;
  activity: string;
}

interface DirectoryViewProps {
  initialTab?: DirectoryTab;
  initialSearch?: string;
}

const associationActivities = [
  'مكافحة الإدمان',
  'الوقاية',
  'التوعية',
  'الدعم الأسري',
  'الدعم النفسي',
  'إعادة الإدماج',
];

function normalizeText(value: string) {
  return value
    .toLocaleLowerCase('ar')
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/[^\p{L}\p{N}]/gu, '');
}

function belongsToWilaya(recordWilaya: string, selectedWilaya: string) {
  return normalizeText(getWilayaName(recordWilaya)) === normalizeText(getWilayaName(selectedWilaya));
}

function containsMunicipality(record: { municipality?: string; address: string }, query: string) {
  if (!query.trim()) return true;
  return normalizeText(`${record.municipality ?? ''} ${record.address}`).includes(normalizeText(query));
}

function displayMunicipality(record: { municipality?: string; address: string }, wilayaName: string) {
  if (record.municipality?.trim()) return record.municipality;
  const explicit = record.address.match(/بلدية\s*([^،,–—]+)/);
  if (explicit?.[1]) return explicit[1].trim();
  const addressParts = record.address.split(/[،,]/).map((part) => part.trim()).filter(Boolean);
  const lastPart = addressParts.at(-1);
  return lastPart || getWilayaName(wilayaName);
}

function getDistanceKm(from: Coordinates, to: Coordinates) {
  const radians = (degrees: number) => (degrees * Math.PI) / 180;
  const latitudeDelta = radians(to.latitude - from.latitude);
  const longitudeDelta = radians(to.longitude - from.longitude);
  const value =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(radians(from.latitude)) *
      Math.cos(radians(to.latitude)) *
      Math.sin(longitudeDelta / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

function hasCoordinates(
  record: { latitude?: number; longitude?: number }
): record is { latitude: number; longitude: number } {
  return (
    typeof record.latitude === 'number' &&
    Number.isFinite(record.latitude) &&
    typeof record.longitude === 'number' &&
    Number.isFinite(record.longitude)
  );
}

function getMapUrl(name: string, address: string, wilayaName: string) {
  const query = encodeURIComponent(`${name}، ${address}، ${getWilayaName(wilayaName)}، الجزائر`);
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

function getTelephone(phone: string) {
  const firstNumber = phone.split(/[\/،,]/)[0].trim();
  if (/اتصل|غير متوفر|غير معروف/.test(firstNumber)) return null;
  const normalized = firstNumber.replace(/[^\d+]/g, '');
  return normalized.replace(/\+/g, '').length >= 7 ? normalized : null;
}

function supportsAssociationActivity(association: Association, activity: string) {
  const description = normalizeText(`${association.name} ${association.services}`);
  const keywords: Record<string, string[]> = {
    'مكافحة الإدمان': ['مكافحة', 'المدمن', 'ادمان'],
    'الوقاية': ['وقايه', 'وقائي'],
    'التوعية': ['توعيه', 'تثقيف'],
    'الدعم الأسري': ['اسر', 'عائلات', 'اسري', 'عائله'],
    'الدعم النفسي': ['نفسي', 'نفساني'],
    'إعادة الإدماج': ['ادماج', 'اعاده الادماج'],
  };
  return (keywords[activity] ?? []).some((keyword) => description.includes(normalizeText(keyword)));
}

function wilayaLabel(value: string) {
  return value.replace(/^\d{1,2}\.\s*/, '');
}

export const DirectoryView: React.FC<DirectoryViewProps> = ({
  initialTab = 'centers',
  initialSearch = '',
}) => {
  const initialWilaya =
    ALGERIA_WILAYAS.find((wilaya) => belongsToWilaya(wilaya, initialSearch)) ?? '';
  const [activeTab, setActiveTab] = useState<DirectoryTab>(initialTab);
  const [centerWilaya, setCenterWilaya] = useState(initialWilaya);
  const [centerMunicipality, setCenterMunicipality] = useState(initialWilaya ? '' : initialSearch);
  const [centerRange, setCenterRange] = useState<CenterRange>('wilaya');
  const [associationWilaya, setAssociationWilaya] = useState(initialWilaya);
  const [associationMunicipality, setAssociationMunicipality] = useState(
    initialWilaya ? '' : initialSearch
  );
  const [associationActivity, setAssociationActivity] = useState('');
  const [centerFilters, setCenterFilters] = useState<CenterFilters | null>(null);
  const [associationFilters, setAssociationFilters] = useState<AssociationFilters | null>(null);
  const [userCoordinates, setUserCoordinates] = useState<Coordinates | null>(null);
  const [locationStatus, setLocationStatus] = useState('');
  const [searchError, setSearchError] = useState('');
  const [selectedCenter, setSelectedCenter] = useState<TreatmentCenter | null>(null);
  const [selectedAssociation, setSelectedAssociation] = useState<Association | null>(null);
  const [centers, setCenters] = useState<TreatmentCenter[]>([]);
  const [associations, setAssociations] = useState<Association[]>([]);
  const [directoryLoading, setDirectoryLoading] = useState(true);
  const [directoryError, setDirectoryError] = useState('');

  useEffect(() => {
    let active = true;
    Promise.all([getPublicDirectory('centers'), getPublicDirectory('associations')])
      .then(([centerRows, associationRows]) => {
        if (!active) return;
        setCenters(centerRows as TreatmentCenter[]);
        setAssociations(associationRows as Association[]);
        setDirectoryError('');
      })
      .catch((error) => {
        if (!active) return;
        setDirectoryError(error instanceof Error ? error.message : 'تعذر تحميل الدليل.');
      })
      .finally(() => {
        if (active) setDirectoryLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const filteredCenters = useMemo(() => {
    if (!centerFilters) return [];
    const { wilaya, municipality, range } = centerFilters;
    const selected = wilaya ? getWilayaName(wilaya) : '';
    const neighbors = selected ? getNeighboringWilayas(selected) : [];
    const filtered = centers.filter((center) => {
      if (range === 'municipality') {
        return Boolean(
          municipality &&
            belongsToWilaya(center.wilayaName, selected) &&
            containsMunicipality(center, municipality)
        );
      }
      if (range === 'wilaya') return !selected || belongsToWilaya(center.wilayaName, selected);
      if (range === 'neighbors') {
        return (
          !selected ||
          belongsToWilaya(center.wilayaName, selected) ||
          neighbors.some((neighbor) => belongsToWilaya(center.wilayaName, neighbor))
        );
      }
      return hasCoordinates(center) && Boolean(userCoordinates);
    });

    return filtered.sort((a, b) => {
      if (range === 'nearest' && userCoordinates && hasCoordinates(a) && hasCoordinates(b)) {
        return getDistanceKm(userCoordinates, a) - getDistanceKm(userCoordinates, b);
      }
      const rank = (center: TreatmentCenter) => {
        if (municipality && containsMunicipality(center, municipality)) return 0;
        if (selected && belongsToWilaya(center.wilayaName, selected)) return 1;
        const neighborIndex = neighbors.findIndex((neighbor) =>
          belongsToWilaya(center.wilayaName, neighbor)
        );
        return neighborIndex < 0 ? Number.MAX_SAFE_INTEGER : neighborIndex + 2;
      };
      return rank(a) - rank(b);
    });
  }, [centerFilters, userCoordinates, centers]);

  const filteredAssociations = useMemo(
    () => !associationFilters ? [] :
      associations
        .filter((association) => {
          if (
            associationFilters?.wilaya &&
            !belongsToWilaya(association.wilayaName, associationFilters.wilaya)
          ) {
            return false;
          }
          if (
            associationFilters?.municipality &&
            !containsMunicipality(association, associationFilters.municipality)
          ) {
            return false;
          }
          if (
            associationFilters?.activity &&
            !supportsAssociationActivity(association, associationFilters.activity)
          ) {
            return false;
          }
          return true;
        })
        .sort((a, b) => {
          if (!associationFilters?.wilaya) return 0;
          return Number(!belongsToWilaya(a.wilayaName, associationFilters.wilaya)) -
            Number(!belongsToWilaya(b.wilayaName, associationFilters.wilaya));
        }),
    [associationFilters, associations]
  );

  const handleCenterSearch = (event: FormEvent) => {
    event.preventDefault();
    setSearchError('');
    setLocationStatus('');

    if (centerRange === 'municipality' && !centerMunicipality.trim()) {
      setSearchError('اكتب اسم البلدية للبحث داخلها.');
      return;
    }
    if (centerRange !== 'nearest' && !centerWilaya) {
      setSearchError('اختر الولاية لتحديد نطاق البحث.');
      return;
    }
    if (centerRange === 'nearest') {
      setUserCoordinates(null);
      setCenterFilters({
        wilaya: centerWilaya,
        municipality: centerMunicipality,
        range: centerRange,
      });
      if (!navigator.geolocation) {
        setLocationStatus('المتصفح لا يدعم تحديد الموقع. اختر الولاية أو البلدية للبحث يدوياً.');
        return;
      }
      setLocationStatus('جارٍ تحديد موقعك…');
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => {
          setUserCoordinates({ latitude: coords.latitude, longitude: coords.longitude });
          setCenterFilters({
            wilaya: centerWilaya,
            municipality: centerMunicipality,
            range: centerRange,
          });
          setLocationStatus('');
        },
        () => {
          setLocationStatus('تعذر تحديد موقعك. تحقق من إذن الموقع أو اختر الولاية والبلدية يدوياً.');
        },
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
      );
      return;
    }
    setCenterFilters({
      wilaya: centerWilaya,
      municipality: centerMunicipality,
      range: centerRange,
    });
  };

  const handleAssociationSearch = (event: FormEvent) => {
    event.preventDefault();
    setSearchError('');
    if (!associationWilaya) {
      setSearchError('اختر الولاية لعرض الجمعيات القريبة.');
      return;
    }
    setAssociationFilters({
      wilaya: associationWilaya,
      municipality: associationMunicipality,
      activity: associationActivity,
    });
  };

  const mapDetails = selectedCenter ?? selectedAssociation;
  const detailTelephone = mapDetails ? getTelephone(mapDetails.phone) : null;
  const closeDetails = () => {
    setSelectedCenter(null);
    setSelectedAssociation(null);
  };

  return (
    <section className="mx-auto max-w-4xl space-y-5" dir="rtl">
      <header className="space-y-2">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            aria-pressed={activeTab === 'centers'}
            onClick={() => {
              setActiveTab('centers');
              setSearchError('');
            }}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold ${
              activeTab === 'centers'
                ? 'bg-[#1766A6] text-white'
                : 'border border-[#CCD8D5] bg-white text-[#203945]'
            }`}
          >
            <Hospital className="h-4 w-4" />
            مراكز العلاج
          </button>
          <button
            type="button"
            aria-pressed={activeTab === 'associations'}
            onClick={() => {
              setActiveTab('associations');
              setSearchError('');
            }}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold ${
              activeTab === 'associations'
                ? 'bg-[#25866D] text-white'
                : 'border border-[#CCD8D5] bg-white text-[#203945]'
            }`}
          >
            <Handshake className="h-4 w-4" />
            الجمعيات المختصة
          </button>
        </div>
        <h1 className="text-xl font-black text-[#203945]">
          {activeTab === 'centers'
            ? 'العثور على مركز علاج قريب'
            : 'العثور على جمعية مختصة قريبة'}
        </h1>
        <p className="text-sm leading-relaxed text-[#203945]/70">
          {activeTab === 'centers'
            ? 'ابحث عن مراكز العلاج والتكفل بالإدمان في ولايتك أو الولايات المجاورة. هذه خدمة بحث وتوجيه؛ أنت من يختار المركز ويتواصل معه.'
            : 'استعرض الجمعيات القريبة للاطلاع على معلوماتها والتواصل معها؛ أنت من يختار الجمعية المناسبة.'}
        </p>
      </header>

      {activeTab === 'centers' ? (
        <>
          <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-950">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <p>
              تحقق مباشرةً من أوقات الاستقبال والخدمات المتاحة قبل التنقل. بيانات الموقع الجغرافي
              والمسافة لا تظهر إلا عندما تكون مسجلة للمركز.
            </p>
          </div>

          <form
            onSubmit={handleCenterSearch}
            className="grid gap-3 rounded-2xl border border-[#E0E8E6] bg-white p-4 sm:grid-cols-2"
          >
            <label className="space-y-1.5 text-sm font-bold text-[#203945]">
              الولاية
              <select
                value={centerWilaya}
                onChange={(event) => setCenterWilaya(event.target.value)}
                className="w-full rounded-xl border border-[#CCD8D5] bg-white px-3 py-2.5 font-normal"
              >
                <option value="">اختر الولاية</option>
                {ALGERIA_WILAYAS.map((wilaya) => (
                  <option key={wilaya} value={wilaya}>
                    {wilaya}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1.5 text-sm font-bold text-[#203945]">
              البلدية
              <input
                value={centerMunicipality}
                onChange={(event) => setCenterMunicipality(event.target.value)}
                placeholder="اكتب اسم البلدية"
                className="w-full rounded-xl border border-[#CCD8D5] px-3 py-2.5 font-normal"
              />
            </label>
            <label className="space-y-1.5 text-sm font-bold text-[#203945] sm:col-span-2">
              نطاق البحث
              <select
                value={centerRange}
                onChange={(event) => setCenterRange(event.target.value as CenterRange)}
                className="w-full rounded-xl border border-[#CCD8D5] bg-white px-3 py-2.5 font-normal"
              >
                <option value="municipality">داخل البلدية</option>
                <option value="wilaya">داخل الولاية</option>
                <option value="neighbors">الولايات المجاورة</option>
                <option value="nearest">الأقرب إليّ</option>
              </select>
            </label>
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1766A6] px-4 py-3 text-sm font-bold text-white hover:bg-[#125386] sm:col-span-2"
            >
              {centerRange === 'nearest' ? (
                <LocateFixed className="h-4 w-4" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              بحث
            </button>
          </form>

          {locationStatus && (
            <p role="status" className="rounded-xl bg-[#EAF3F8] p-3 text-sm text-[#104A78]">
              {locationStatus}
            </p>
          )}
          {searchError && (
            <p role="alert" className="rounded-xl bg-amber-50 p-3 text-sm text-amber-950">
              {searchError}
            </p>
          )}

          {centerFilters?.range === 'nearest' && userCoordinates && filteredCenters.length === 0 && (
            <p role="status" className="rounded-xl bg-[#EAF3F8] p-4 text-sm leading-relaxed text-[#104A78]">
              لا تتوفر إحداثيات للمراكز في الدليل حالياً، لذلك تعذر ترتيبها حسب المسافة. استخدم
              البحث بالولاية أو البلدية، وتحقق من الموقع مباشرةً قبل التنقل.
            </p>
          )}

          <div className="space-y-3">
            {!centerFilters ? (
              <p className="rounded-2xl border border-[#E0E8E6] bg-white p-5 text-sm leading-relaxed text-[#203945]/70">
                اختر الولاية والبلدية ونطاق البحث، ثم اضغط «بحث» لعرض المراكز المطابقة.
              </p>
            ) : (
              <>
                <h2 className="text-base font-black text-[#203945]">
                  المراكز المتاحة ({filteredCenters.length})
                </h2>
                {filteredCenters.length === 0 && centerFilters.range !== 'nearest' ? (
              <p className="rounded-2xl border border-[#E0E8E6] bg-white p-6 text-sm text-[#203945]/70">
                لم نعثر على مركز مطابق. جرّب توسيع نطاق البحث أو تحقق من تهجئة البلدية.
              </p>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {filteredCenters.map((center) => {
                  const telephone = getTelephone(center.phone);
                  const distance =
                    userCoordinates && hasCoordinates(center)
                      ? getDistanceKm(userCoordinates, center).toLocaleString('ar-DZ', {
                          maximumFractionDigits: 1,
                        })
                      : null;
                  return (
                    <article
                      key={center.id}
                      className="flex flex-col justify-between gap-4 rounded-2xl border border-[#E0E8E6] bg-white p-4"
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="font-black leading-relaxed text-[#203945]">{center.name}</h3>
                          <span className="shrink-0 rounded-lg bg-[#EAF3F8] px-2 py-1 text-xs font-bold text-[#104A78]">
                            {getWilayaName(center.wilayaName)}
                          </span>
                        </div>
                        <p className="flex items-start gap-2 text-sm text-[#203945]/75">
                          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#1766A6]" />
                          {center.address}
                        </p>
                        {distance && (
                          <p className="text-sm font-bold text-[#1766A6]">يبعد نحو {distance} كم</p>
                        )}
                        <p className="text-sm leading-relaxed text-[#203945]/75">
                          <span className="font-bold">الاستقبال:</span>{' '}
                          {center.receptionInformation ||
                            'يرجى الاتصال بالمركز مباشرةً للتحقق من أوقات الاستقبال.'}
                        </p>
                        <p className="text-sm leading-relaxed text-[#203945]/75">
                          <span className="font-bold">الخدمات:</span> {center.services}
                        </p>
                        <p dir="ltr" className="text-right text-sm font-bold text-[#203945]">
                          {center.phone}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2 border-t border-[#E0E8E6] pt-3">
                        <button
                          type="button"
                          onClick={() => setSelectedCenter(center)}
                          className="rounded-lg border border-[#CCD8D5] px-3 py-2 text-xs font-bold text-[#203945]"
                        >
                          التفاصيل
                        </button>
                        <a
                          href={getMapUrl(center.name, center.address, center.wilayaName)}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 rounded-lg border border-[#CCD8D5] px-3 py-2 text-xs font-bold text-[#203945]"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          فتح الموقع
                        </a>
                        {telephone ? (
                          <a
                            href={`tel:${telephone}`}
                            className="inline-flex items-center gap-1 rounded-lg bg-[#1766A6] px-3 py-2 text-xs font-bold text-white"
                          >
                            <Phone className="h-3.5 w-3.5" />
                            اتصال
                          </a>
                        ) : (
                          <span className="rounded-lg bg-slate-100 px-3 py-2 text-xs text-slate-600">
                            رقم الاتصال غير متوفر
                          </span>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
              </>
            )}
          </div>
        </>
      ) : (
        <>
          <form
            onSubmit={handleAssociationSearch}
            className="grid gap-3 rounded-2xl border border-[#E0E8E6] bg-white p-4 sm:grid-cols-2"
          >
            <label className="space-y-1.5 text-sm font-bold text-[#203945]">
              الولاية
              <select
                value={associationWilaya}
                onChange={(event) => setAssociationWilaya(event.target.value)}
                className="w-full rounded-xl border border-[#CCD8D5] bg-white px-3 py-2.5 font-normal"
              >
                <option value="">اختر الولاية</option>
                {ALGERIA_WILAYAS.map((wilaya) => (
                  <option key={wilaya} value={wilaya}>
                    {wilaya}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1.5 text-sm font-bold text-[#203945]">
              البلدية
              <input
                value={associationMunicipality}
                onChange={(event) => setAssociationMunicipality(event.target.value)}
                placeholder="اكتب اسم البلدية"
                className="w-full rounded-xl border border-[#CCD8D5] px-3 py-2.5 font-normal"
              />
            </label>
            <label className="space-y-1.5 text-sm font-bold text-[#203945] sm:col-span-2">
              مجال النشاط
              <select
                value={associationActivity}
                onChange={(event) => setAssociationActivity(event.target.value)}
                className="w-full rounded-xl border border-[#CCD8D5] bg-white px-3 py-2.5 font-normal"
              >
                <option value="">كل مجالات النشاط</option>
                {associationActivities.map((activity) => (
                  <option key={activity} value={activity}>
                    {activity}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#25866D] px-4 py-3 text-sm font-bold text-white hover:bg-[#1E6F5A] sm:col-span-2"
            >
              <Search className="h-4 w-4" />
              بحث
            </button>
          </form>

          {searchError && (
            <p role="alert" className="rounded-xl bg-amber-50 p-3 text-sm text-amber-950">
              {searchError}
            </p>
          )}

          <div className="space-y-3">
            {!associationFilters ? (
              <p className="rounded-2xl border border-[#E0E8E6] bg-white p-5 text-sm leading-relaxed text-[#203945]/70">
                اختر الولاية ومجال النشاط، ثم اضغط «بحث» لعرض الجمعيات المطابقة.
              </p>
            ) : (
              <>
                <h2 className="text-base font-black text-[#203945]">
                  الجمعيات المتاحة ({filteredAssociations.length})
                </h2>
                {filteredAssociations.length === 0 ? (
              <p className="rounded-2xl border border-[#E0E8E6] bg-white p-6 text-sm leading-relaxed text-[#203945]/70">
                لا توجد جمعية في الدليل تطابق هذه المعايير حالياً. الخيارات القريبة تساعدك في الوصول
                إلى معلومات التواصل؛ اختر بنفسك الجهة التي ترغب في التواصل معها.
              </p>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {filteredAssociations.map((association) => {
                  const telephone = getTelephone(association.phone);
                  const activities = associationActivities.filter((activity) =>
                    supportsAssociationActivity(association, activity)
                  );
                  return (
                    <article
                      key={association.id}
                      className="flex flex-col justify-between gap-4 rounded-2xl border border-[#E0E8E6] bg-white p-4"
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="font-black leading-relaxed text-[#203945]">{association.name}</h3>
                          <span className="shrink-0 rounded-lg bg-[#E8F4EF] px-2 py-1 text-xs font-bold text-[#1A5E4D]">
                            {getWilayaName(association.wilayaName)}
                          </span>
                        </div>
                        <p className="text-sm text-[#203945]/75">
                          البلدية: {displayMunicipality(association, association.wilayaName)}
                        </p>
                        <p className="flex items-start gap-2 text-sm text-[#203945]/75">
                          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#25866D]" />
                          {association.address}
                        </p>
                        <p className="text-sm leading-relaxed text-[#203945]/75">
                          <span className="font-bold">مجالات النشاط:</span>{' '}
                          {activities.length ? activities.join('، ') : association.services}
                        </p>
                        <p dir="ltr" className="text-right text-sm font-bold text-[#203945]">
                          {association.phone}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2 border-t border-[#E0E8E6] pt-3">
                        <button
                          type="button"
                          onClick={() => setSelectedAssociation(association)}
                          className="rounded-lg border border-[#CCD8D5] px-3 py-2 text-xs font-bold text-[#203945]"
                        >
                          عرض التفاصيل
                        </button>
                        <a
                          href={getMapUrl(association.name, association.address, association.wilayaName)}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 rounded-lg border border-[#CCD8D5] px-3 py-2 text-xs font-bold text-[#203945]"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          فتح الموقع
                        </a>
                        {telephone ? (
                          <a
                            href={`tel:${telephone}`}
                            className="inline-flex items-center gap-1 rounded-lg bg-[#25866D] px-3 py-2 text-xs font-bold text-white"
                          >
                            <Phone className="h-3.5 w-3.5" />
                            اتصال
                          </a>
                        ) : (
                          <span className="rounded-lg bg-slate-100 px-3 py-2 text-xs text-slate-600">
                            رقم الاتصال غير متوفر
                          </span>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
              </>
            )}
          </div>
        </>
      )}

      {mapDetails && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeDetails();
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="directory-details-title"
            className="w-full max-w-lg space-y-4 rounded-2xl bg-white p-5"
          >
            <div className="flex items-start justify-between gap-3">
              <h2 id="directory-details-title" className="font-black leading-relaxed text-[#203945]">
                {mapDetails.name}
              </h2>
              <button
                type="button"
                aria-label="إغلاق التفاصيل"
                onClick={closeDetails}
                className="rounded-lg p-1 text-[#203945]/70 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-sm font-bold text-[#1766A6]">{getWilayaName(mapDetails.wilayaName)}</p>
            <p className="text-sm leading-relaxed text-[#203945]/75">{mapDetails.address}</p>
            <p className="text-sm text-[#203945]/75">
              <span className="font-bold">الهاتف:</span> {mapDetails.phone}
            </p>
            <p className="text-sm leading-relaxed text-[#203945]/75">
              <span className="font-bold">
                {selectedCenter ? 'الخدمات ومعلومات الاستقبال:' : 'مجالات النشاط:'}
              </span>{' '}
              {selectedCenter
                ? `${selectedCenter.services}. ${selectedCenter.receptionInformation || 'يرجى الاتصال مباشرةً للتحقق من أوقات الاستقبال والخدمات المتاحة.'}`
                : selectedAssociation
                  ? associationActivities
                      .filter((activity) => supportsAssociationActivity(selectedAssociation, activity))
                      .join('، ') || selectedAssociation.services
                  : ''}
            </p>
            <div className="flex flex-wrap gap-2">
              <a
                href={getMapUrl(mapDetails.name, mapDetails.address, mapDetails.wilayaName)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-[#1766A6] px-4 py-2.5 text-sm font-bold text-white"
              >
                <ExternalLink className="h-4 w-4" />
                فتح الموقع
              </a>
              {detailTelephone ? (
                <a
                  href={`tel:${detailTelephone}`}
                  className="inline-flex items-center gap-2 rounded-xl border border-[#25866D] px-4 py-2.5 text-sm font-bold text-[#1A5E4D]"
                >
                  <Phone className="h-4 w-4" />
                  اتصال
                </a>
              ) : (
                <span className="rounded-xl bg-slate-100 px-4 py-2.5 text-sm text-slate-600">
                  رقم الاتصال غير متوفر
                </span>
              )}
            </div>
          </section>
        </div>
      )}

      <div className="sr-only" aria-live="polite">
        {activeTab === 'centers' ? filteredCenters.length : filteredAssociations.length} نتيجة
        {activeTab === 'centers' ? ' للمراكز' : ' للجمعيات'}
      </div>
    </section>
  );
};
