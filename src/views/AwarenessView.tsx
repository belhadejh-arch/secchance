import React, { useMemo, useState } from 'react';
import {
  BookOpen,
  CalendarDays,
  Clock3,
  Download,
  Eye,
  ExternalLink,
  FileDown,
  FileText,
  Search,
  ShieldCheck,
  X,
} from 'lucide-react';
import { initialAwarenessArticles, initialLegalTopics } from '../data/initialData';

interface AwarenessViewProps {
  onNavigateToLegalAssistance?: () => void;
}

interface AwarenessMaterial {
  id: string;
  title: string;
  summary: string;
  source: string;
  publishedAt: string;
  lastUpdated: string;
  categories: string[];
  sections: { title: string; content: string }[];
  pdfUrl?: string;
}

const categories = [
  'الكل',
  'القوانين',
  'الأسئلة الشائعة',
  'الإجراءات',
  'حقوق الفرد والأسرة',
  'آخر التحديثات',
];

const pdfDocuments = [
  {
    id: '18-04',
    title: 'القانون رقم 04-18 المؤرخ في 25 ديسمبر 2004',
    subtitle: 'الوقاية من المخدرات والمؤثرات العقلية وقمع الاستعمال والاتجار غير المشروعين بها',
    file: '/18-04.pdf',
    pages: 'الجريدة الرسمية عدد 83',
    badge: 'القانون الأساسي',
    categories: ['القوانين'],
  },
  {
    id: '25-03',
    title: 'القانون رقم 25-03 المؤرخ في 1 يوليو 2025',
    subtitle: 'المعدل والمتمم للقانون رقم 04-18',
    file: '/25-03.pdf',
    pages: 'الجريدة الرسمية عدد 43',
    badge: 'آخر التعديلات',
    categories: ['القوانين', 'آخر التحديثات'],
  },
  {
    id: '76-26',
    title: 'المرسوم التنفيذي رقم 26-76',
    subtitle: 'شروط وكيفيات الوقاية من تعاطي المخدرات والمؤثرات العقلية عند التوظيف',
    file: '/76-26-ar-1.pdf',
    pages: 'الجريدة الرسمية عدد 08',
    badge: 'مرسوم تطبيقي',
    categories: ['الإجراءات', 'آخر التحديثات'],
  },
  {
    id: '18-07',
    title: 'القانون رقم 18-07 المؤرخ في 10 يونيو 2018',
    subtitle: 'حماية الأشخاص الطبيعيين في مجال معالجة المعطيات ذات الطابع الشخصي',
    file: '/18-07.pdf',
    pages: 'الجريدة الرسمية عدد 34',
    badge: 'حماية المعطيات',
    categories: ['القوانين', 'حقوق الفرد والأسرة'],
  },
];

const topicCategories: Record<number, string[]> = {
  1: ['القوانين', 'حقوق الفرد والأسرة'],
  2: ['القوانين', 'آخر التحديثات'],
  3: ['الإجراءات', 'آخر التحديثات'],
  4: ['القوانين', 'حقوق الفرد والأسرة'],
};

const legalMaterials: AwarenessMaterial[] = [
  ...initialLegalTopics.map((topic) => ({
    id: `law-${topic.id}`,
    title: topic.title,
    summary: topic.plainSummary,
    source: `${topic.legalReference}. ${topic.officialSource}`,
    publishedAt: topic.officialSource.match(/\(([^()]+)\)/)?.[1] ?? topic.lawDate,
    lastUpdated: topic.lastReviewedDate,
    categories: topicCategories[topic.id] ?? ['القوانين'],
    sections: [
      { title: 'شرح مبسط', content: topic.plainExplanation },
      { title: topic.relevantArticle, content: topic.officialText },
      { title: 'التعديلات التشريعية', content: topic.amendments.join('\n') },
      { title: 'المرسوم أو التنظيم المرتبط', content: topic.executiveDecree },
    ],
    pdfUrl: topic.pdfUrl,
  })),
  ...initialAwarenessArticles.map((article) => ({
    id: `article-${article.id}`,
    title: article.title,
    summary: article.summary,
    source: article.legalSource ?? article.category,
    publishedAt: article.date,
    lastUpdated: article.lastUpdated ?? article.date,
    categories: [article.category],
    sections: [{ title: 'معلومة قانونية مبسطة', content: article.content }],
  })),
];

function normalizeSearch(value: string) {
  return value
    .toLocaleLowerCase('ar')
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .trim();
}

function displayDate(value: string) {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : value;
}

export const AwarenessView: React.FC<AwarenessViewProps> = ({
  onNavigateToLegalAssistance,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('الكل');
  const [selectedMaterial, setSelectedMaterial] = useState<AwarenessMaterial | null>(null);
  const [selectedPdfToRead, setSelectedPdfToRead] = useState<{ title: string; url: string } | null>(
    null
  );

  const filteredMaterials = useMemo(() => {
    const query = normalizeSearch(searchQuery);
    const matches = legalMaterials.filter((material) => {
      const matchesCategory =
        selectedCategory === 'الكل' || material.categories.includes(selectedCategory);
      const searchableText = normalizeSearch(
        [
          material.title,
          material.summary,
          material.source,
          material.publishedAt,
          material.lastUpdated,
          ...material.sections.map((section) => `${section.title} ${section.content}`),
        ].join(' ')
      );
      return matchesCategory && (!query || searchableText.includes(query));
    });
    return selectedCategory === 'آخر التحديثات'
      ? matches.sort((a, b) => b.lastUpdated.localeCompare(a.lastUpdated))
      : matches;
  }, [searchQuery, selectedCategory]);

  const visiblePdfs = pdfDocuments.filter((document) => {
    const matchesCategory =
      selectedCategory === 'الكل' || document.categories.includes(selectedCategory);
    const query = normalizeSearch(searchQuery);
    const matchesSearch =
      !query ||
      normalizeSearch(`${document.title} ${document.subtitle} ${document.pages}`).includes(query);
    return matchesCategory && matchesSearch;
  });

  return (
    <main className="mx-auto max-w-4xl space-y-5" dir="rtl">
      <header>
        <h1 className="text-xl font-black text-[#203945]">مركز التوعية القانونية</h1>
        <p className="mt-1 text-sm leading-relaxed text-[#203945]/70">
          معلومات مبسطة ومراجع قانونية رسمية حول القوانين والإجراءات وحقوق الفرد والأسرة.
        </p>
      </header>

      <aside
        role="note"
        className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-950"
      >
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
        <div className="flex-1">
          <strong>تنبيه:</strong> مواد التوعية لا تحل محل الاستشارة القانونية الفردية؛ تختلف
          الإجراءات باختلاف تفاصيل كل حالة.
        </div>
        {onNavigateToLegalAssistance && (
          <button
            type="button"
            onClick={onNavigateToLegalAssistance}
            className="shrink-0 text-xs font-bold text-[#1766A6] underline"
          >
            طلب استشارة
          </button>
        )}
      </aside>

      <section className="space-y-3 rounded-2xl border border-[#E0E8E6] bg-white p-4">
        <label htmlFor="legal-awareness-search" className="text-sm font-bold text-[#203945]">
          البحث في المحتوى
        </label>
        <div className="relative">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#1766A6]" />
          <input
            id="legal-awareness-search"
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="ابحث عن قانون أو إجراء أو حق…"
            className="w-full rounded-xl border border-[#CCD8D5] py-3 pl-3 pr-10 text-sm outline-none focus:border-[#1766A6]"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1" role="group" aria-label="تصنيف المواد">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              aria-pressed={selectedCategory === category}
              onClick={() => setSelectedCategory(category)}
              className={`shrink-0 rounded-full px-3 py-2 text-xs font-bold transition-colors ${
                selectedCategory === category
                  ? 'bg-[#1766A6] text-white'
                  : 'border border-[#CCD8D5] bg-white text-[#203945] hover:bg-[#F3F7F6]'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </section>

      <section aria-live="polite" className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-black text-[#203945]">
            المواد التوعوية ({filteredMaterials.length})
          </h2>
          {selectedCategory === 'آخر التحديثات' && (
            <span className="flex items-center gap-1 text-xs text-[#203945]/60">
              <Clock3 className="h-3.5 w-3.5" />
              الأحدث أولاً
            </span>
          )}
        </div>
        {filteredMaterials.length === 0 ? (
          <p className="rounded-2xl border border-[#E0E8E6] bg-white p-6 text-sm text-[#203945]/70">
            لا توجد مواد مطابقة. جرّب كلمات بحث أخرى أو اختر تصنيفاً مختلفاً.
          </p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {filteredMaterials.map((material) => (
              <article
                key={material.id}
                className="flex flex-col justify-between gap-4 rounded-2xl border border-[#E0E8E6] bg-white p-4"
              >
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-1.5">
                    {material.categories.map((category) => (
                      <span
                        key={category}
                        className="rounded-full bg-[#EAF3F8] px-2.5 py-1 text-[11px] font-bold text-[#104A78]"
                      >
                        {category}
                      </span>
                    ))}
                  </div>
                  <h3 className="font-black leading-relaxed text-[#203945]">{material.title}</h3>
                  <p className="text-sm leading-relaxed text-[#203945]/80">{material.summary}</p>
                  <dl className="space-y-2 border-t border-[#E0E8E6] pt-3 text-xs">
                    <div>
                      <dt className="font-bold text-[#203945]">المصدر القانوني</dt>
                      <dd className="mt-0.5 leading-relaxed text-[#203945]/70">{material.source}</dd>
                    </div>
                    <div className="flex flex-wrap gap-x-5 gap-y-1 text-[#203945]/60">
                      <div className="flex items-center gap-1">
                        <CalendarDays className="h-3.5 w-3.5" />
                        <dt>تاريخ النشر:</dt>
                        <dd>{displayDate(material.publishedAt)}</dd>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock3 className="h-3.5 w-3.5" />
                        <dt>آخر تحديث:</dt>
                        <dd>{displayDate(material.lastUpdated)}</dd>
                      </div>
                    </div>
                  </dl>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedMaterial(material)}
                  className="w-full rounded-xl bg-[#1766A6] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#125386]"
                >
                  اقرأ المزيد
                </button>
              </article>
            ))}
          </div>
        )}
      </section>

      {visiblePdfs.length > 0 && (
        <section className="space-y-3 rounded-2xl border border-[#DCEBF4] bg-[#EAF3F8] p-4">
          <div className="flex items-center gap-2">
            <FileDown className="h-5 w-5 text-[#1766A6]" />
            <div>
              <h2 className="font-black text-[#203945]">النصوص القانونية الرسمية</h2>
              <p className="text-xs text-[#203945]/70">قراءة النصوص أو تحميلها بصيغة PDF</p>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {visiblePdfs.map((document) => (
              <article
                key={document.id}
                className="flex flex-col justify-between gap-3 rounded-xl border border-[#E0E8E6] bg-white p-4"
              >
                <div className="space-y-1.5">
                  <span className="rounded-md bg-[#E8F4EF] px-2 py-1 text-[11px] font-bold text-[#1A5E4D]">
                    {document.badge}
                  </span>
                  <h3 className="pt-1 text-sm font-bold text-[#203945]">{document.title}</h3>
                  <p className="text-xs leading-relaxed text-[#203945]/70">{document.subtitle}</p>
                  <p className="text-[11px] text-[#203945]/55">{document.pages}</p>
                </div>
                <div className="flex gap-2">
                  <a
                    href={document.file}
                    download
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#1766A6] px-3 py-2 text-xs font-bold text-white"
                  >
                    <Download className="h-3.5 w-3.5" />
                    تحميل PDF
                  </a>
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedPdfToRead({ title: document.title, url: document.file })
                    }
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-[#CCD8D5] px-3 py-2 text-xs font-bold text-[#203945]"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    قراءة مباشرة
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {selectedMaterial && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelectedMaterial(null);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="awareness-material-title"
            className="max-h-[90vh] w-full max-w-2xl space-y-4 overflow-y-auto rounded-2xl bg-white p-5"
          >
            <div className="flex items-start justify-between gap-3 border-b border-[#E0E8E6] pb-3">
              <div className="space-y-2">
                <div className="flex flex-wrap gap-1.5">
                  {selectedMaterial.categories.map((category) => (
                    <span key={category} className="rounded-full bg-[#EAF3F8] px-2.5 py-1 text-xs font-bold text-[#104A78]">
                      {category}
                    </span>
                  ))}
                </div>
                <h2 id="awareness-material-title" className="font-black leading-relaxed text-[#203945]">
                  {selectedMaterial.title}
                </h2>
              </div>
              <button
                type="button"
                aria-label="إغلاق المادة"
                onClick={() => setSelectedMaterial(null)}
                className="rounded-lg p-1 text-[#203945]/70 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="rounded-xl bg-[#F3F7F6] p-3 text-sm leading-relaxed text-[#203945]">
              {selectedMaterial.summary}
            </p>
            {selectedMaterial.sections.map((section) => (
              <section key={section.title} className="space-y-1">
                <h3 className="text-sm font-bold text-[#1766A6]">{section.title}</h3>
                <p className="whitespace-pre-line text-sm leading-relaxed text-[#203945]/80">
                  {section.content}
                </p>
              </section>
            ))}
            <dl className="space-y-2 border-t border-[#E0E8E6] pt-3 text-xs">
              <div>
                <dt className="font-bold text-[#203945]">المصدر القانوني</dt>
                <dd className="mt-0.5 leading-relaxed text-[#203945]/70">{selectedMaterial.source}</dd>
              </div>
              <div className="flex flex-wrap gap-x-5 gap-y-1 text-[#203945]/60">
                <div><dt className="inline font-bold">تاريخ النشر: </dt><dd className="inline">{displayDate(selectedMaterial.publishedAt)}</dd></div>
                <div><dt className="inline font-bold">آخر تحديث: </dt><dd className="inline">{displayDate(selectedMaterial.lastUpdated)}</dd></div>
              </div>
            </dl>
            {selectedMaterial.pdfUrl && (
              <div className="flex flex-wrap gap-2">
                <a
                  href={selectedMaterial.pdfUrl}
                  download
                  className="inline-flex items-center gap-2 rounded-lg bg-[#25866D] px-3 py-2 text-xs font-bold text-white"
                >
                  <Download className="h-4 w-4" />
                  تحميل النص الرسمي
                </a>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPdfToRead({
                      title: selectedMaterial.title,
                      url: selectedMaterial.pdfUrl!,
                    });
                    setSelectedMaterial(null);
                  }}
                  className="inline-flex items-center gap-2 rounded-lg border border-[#CCD8D5] px-3 py-2 text-xs font-bold text-[#203945]"
                >
                  <ExternalLink className="h-4 w-4" />
                  قراءة النص الرسمي
                </button>
              </div>
            )}
            <p className="border-t border-[#E0E8E6] pt-3 text-xs font-bold leading-relaxed text-[#A64842]">
              مواد التوعية لا تحل محل الاستشارة القانونية الفردية.
            </p>
          </section>
        </div>
      )}

      {selectedPdfToRead && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/70 p-3 sm:p-5"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelectedPdfToRead(null);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-label={`قراءة الوثيقة: ${selectedPdfToRead.title}`}
            className="flex h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white"
          >
            <header className="flex items-center justify-between gap-3 bg-[#203945] p-4 text-white">
              <h2 className="line-clamp-1 text-sm font-bold">{selectedPdfToRead.title}</h2>
              <button
                type="button"
                aria-label="إغلاق قارئ النص"
                onClick={() => setSelectedPdfToRead(null)}
                className="rounded-lg bg-white/10 p-2 hover:bg-white/20"
              >
                <X className="h-4 w-4" />
              </button>
            </header>
            <iframe
              src={`${selectedPdfToRead.url}#toolbar=1&navpanes=0`}
              title={selectedPdfToRead.title}
              className="min-h-0 flex-1 border-0 bg-[#E5ECE9]"
            />
            <footer className="flex items-center gap-2 border-t border-[#E0E8E6] p-3 text-xs text-[#203945]/70">
              <ShieldCheck className="h-4 w-4 text-[#25866D]" />
              النصوص الرسمية متاحة للقراءة والتحميل.
            </footer>
          </section>
        </div>
      )}
    </main>
  );
};
