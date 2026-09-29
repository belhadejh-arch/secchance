import React, { useState } from 'react';
import { initialLegalTopics } from '../data/initialData';
import {
  Scale,
  BookOpen,
  FileText,
  Download,
  Eye,
  FileDown,
  X,
  ShieldCheck,
  CheckCircle2,
  Printer,
  ExternalLink,
} from 'lucide-react';

interface AwarenessViewProps {
  onNavigateToLegalAssistance?: () => void;
}

export const AwarenessView: React.FC<AwarenessViewProps> = ({
  onNavigateToLegalAssistance,
}) => {
  const [selectedPdfToRead, setSelectedPdfToRead] = useState<{
    title: string;
    url: string;
    htmlUrl?: string;
  } | null>(null);

  const [downloadSuccessMessage, setDownloadSuccessMessage] = useState<string | null>(null);

  // Strictly only the 3 specified laws
  const officialPdfDocuments = [
    {
      id: '18-04',
      lawNumber: 'القانون رقم 04-18',
      title: 'القانون رقم 04-18 المؤرخ في 25 ديسمبر 2004',
      subtitle: 'الوقاية من المخدرات والمؤثرات العقلية وقمع الاستعمال والاتجار غير المشروعين بها (المادة 6 وإسقاط المتابعة الجزائية للعلاج الطوعي)',
      file: '/18-04.pdf',
      htmlFile: '/laws/loi_04-18.html',
      pages: 'الجريدة الرسمية عدد 83',
      badge: 'القانون الأساسي المعتمد',
      size: '2.1 KB',
    },
    {
      id: '25-03',
      lawNumber: 'القانون رقم 25-03',
      title: 'القانون رقم 25-03 المؤرخ في 1 يوليو 2025',
      subtitle: 'المعدل والمتمم للقانون رقم 04-18 (الفحوصات الطبية المسبقة، تعزيز تدابير الوقاية، وإعادة الإدماج الاجتماعي)',
      file: '/25-03.pdf',
      htmlFile: '/laws/loi_25-03.html',
      pages: 'الجريدة الرسمية عدد 43',
      badge: 'التعديل التشريعي 2025',
      size: '1.8 KB',
    },
    {
      id: '76-26',
      lawNumber: 'المرسوم التنفيذي رقم 26-76',
      title: 'المرسوم التنفيذي رقم 26-76 المؤرخ في 14 جانفي 2026',
      subtitle: 'تحديد شروط وكيفيات الوقاية من تعاطي المخدرات و/أو المؤثرات العقلية عند التوظيف في القطاعين العام والخاص وضمانات السر المهني',
      file: '/76-26-ar-1.pdf',
      htmlFile: '/laws/decret_executif_26-76.html',
      pages: 'الجريدة الرسمية عدد 08',
      badge: 'المرسوم التطبيقي الملزم',
      size: '1.9 KB',
    },
  ];

  const handleDownloadAll = () => {
    officialPdfDocuments.forEach((doc, idx) => {
      setTimeout(() => {
        const link = document.createElement('a');
        link.href = doc.file;
        link.download = doc.file.replace('/', '');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }, idx * 400);
    });

    setDownloadSuccessMessage('تم بدء تحميل القوانين الثلاثة الرسمية بنجاح بصيغة PDF.');
    setTimeout(() => setDownloadSuccessMessage(null), 4000);
  };

  const handleDownloadSingle = (fileName: string, title: string) => {
    setDownloadSuccessMessage(`جاري تحميل: ${title}`);
    setTimeout(() => setDownloadSuccessMessage(null), 3000);
  };

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-[20px] font-black text-[#203945]">
          المراجع القانونية الموحدة والتوعية التشريعية ⚖️
        </h1>
        <p className="text-[12px] text-[#203945]/70 mt-0.5">
          الأطر التشريعية الرسمية الوطنية المعتمدة حصراً (القانون 04-18، تعديلاته بالقانون 25-03، والمرسوم التنفيذي 26-76)
        </p>
      </div>

      {/* Download Alert Notification */}
      {downloadSuccessMessage && (
        <div className="bg-[#E8F4EF] border border-[#25866D]/30 p-3 rounded-[12px] flex items-center gap-2 text-xs font-bold text-[#1A5E4D] animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-[#25866D] shrink-0" />
          <span>{downloadSuccessMessage}</span>
        </div>
      )}

      {/* Official Legal Framework Banner */}
      <div className="bg-[#EAF3F8] rounded-[18px] p-4.5 space-y-2 border border-[#DCEBF4] shadow-xs">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-[#1766A6]" />
          <h2 className="font-bold text-[14px] text-[#1766A6]">
            📜 المراجع التشريعية الوطنية المعتمدة حصراً
          </h2>
        </div>
        <p className="text-[12px] text-[#104A78] leading-[22px] font-normal">
          • <strong>القانون رقم 04-18</strong> (25 ديسمبر 2004) المتعلق بالوقاية من المخدرات والمؤثرات العقلية وقمع الاستعمال والاتجار غير المشروعين بها — المادة 6 الخاصة بإسقاط الدعوى العمومية للعلاج الطوعي (الجريدة الرسمية عدد 83).<br />
          • <strong>القانون رقم 25-03</strong> (1 يوليو 2025) المعدل والمتمم للقانون 04-18 — إدراج الفحوصات الطبية المسبقة، تعزيز حماية القصر وإعادة الإدماج الاجتماعي (الجريدة الرسمية عدد 43).<br />
          • <strong>المرسوم التنفيذي رقم 26-76</strong> (14 جانفي 2026) المحدد لشروط وكيفيات الفحوصات الطبية عند التوظيف في القطاعين العام والخاص والسر المهني (الجريدة الرسمية عدد 08).
        </p>
        <div className="pt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span className="text-[11px] text-[#A64842] font-bold">
            ⚠️ تنبيه قانوني: هذه المعلومات توعوية وتثقيفية ولا تشكل استشارة قانونية فردية نهائية.
          </span>
          {onNavigateToLegalAssistance && (
            <button
              onClick={onNavigateToLegalAssistance}
              className="text-xs font-bold text-[#1766A6] underline hover:opacity-80 shrink-0"
            >
              طلب استشارة مع محامٍ معتمد ←
            </button>
          )}
        </div>
      </div>

      {/* DIRECT PDF DOWNLOAD & READING SECTION */}
      <div className="bg-[#FBFDFC] border-2 border-[#1766A6]/30 rounded-[20px] p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E0E8E6] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-[12px] bg-[#1766A6] text-white flex items-center justify-center shrink-0 shadow-xs">
              <FileDown className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-[15px] font-black text-[#203945]">
                📥 تحميل وقراءة القوانين الرسمية المعتمدة (PDF)
              </h2>
              <p className="text-[11px] text-[#203945]/70">
                تحميل مباشر لملفات القوانين الثلاثة بصيغة PDF المعتمدة بالجريدة الرسمية الجزائرية
              </p>
            </div>
          </div>
          <button
            onClick={handleDownloadAll}
            className="bg-[#25866D] hover:bg-[#1E6F5A] text-white font-bold text-xs py-2 px-3.5 rounded-[10px] flex items-center justify-center gap-2 transition-colors shadow-2xs shrink-0 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>تحميل جميع القوانين (3 ملفات PDF)</span>
          </button>
        </div>

        {/* 3 Law Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {officialPdfDocuments.map((doc) => (
            <div
              key={doc.id}
              className="bg-white rounded-[16px] border border-[#CCD8D5] p-4 flex flex-col justify-between space-y-3 hover:border-[#1766A6] hover:shadow-xs transition-all"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-[6px] bg-[#EAF3F8] text-[#1766A6]">
                    {doc.badge}
                  </span>
                  <span className="text-[10px] text-[#203945]/60 font-semibold font-mono">
                    {doc.pages}
                  </span>
                </div>
                <h3 className="font-bold text-[13px] text-[#203945] leading-snug">
                  {doc.title}
                </h3>
                <p className="text-[11px] text-[#203945]/75 leading-relaxed line-clamp-3">
                  {doc.subtitle}
                </p>
              </div>

              <div className="pt-2 border-t border-[#F0F4F2] space-y-2">
                <a
                  href={doc.file}
                  download={doc.file.replace('/', '')}
                  onClick={() => handleDownloadSingle(doc.file, doc.title)}
                  className="w-full bg-[#1766A6] hover:bg-[#125386] text-white font-bold text-xs py-2 px-3 rounded-[10px] flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>تحميل PDF ({doc.file.replace('/', '')})</span>
                </a>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() =>
                      setSelectedPdfToRead({
                        title: doc.title,
                        url: doc.file,
                        htmlUrl: doc.htmlFile,
                      })
                    }
                    className="flex-1 bg-[#F3F7F6] hover:bg-[#E5ECE9] text-[#203945] font-bold text-[11px] py-1.5 px-2 rounded-[8px] flex items-center justify-center gap-1 transition-colors border border-[#DCE4E1]"
                  >
                    <Eye className="w-3 h-3 text-[#1766A6]" />
                    <span>قراءة وتصفح</span>
                  </button>

                  {doc.htmlFile && (
                    <a
                      href={doc.htmlFile}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-[#EAF3F8] hover:bg-[#DCEBF4] text-[#104A78] font-bold text-[11px] py-1.5 px-2.5 rounded-[8px] flex items-center justify-center gap-1 transition-colors"
                      title="فتح النص الكامل في صفحة جديدة للطباعة"
                    >
                      <Printer className="w-3 h-3" />
                      <span>طباعة</span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* PDF Reading Modal Viewer */}
      {selectedPdfToRead && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-3 sm:p-5 backdrop-blur-xs">
          <div className="bg-white rounded-[22px] max-w-4xl w-full h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-white/20 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-[#203945] text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#25866D]" />
                <h3 className="font-bold text-sm sm:text-base line-clamp-1">
                  قراءة الوثيقة الرسمية: {selectedPdfToRead.title}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                {selectedPdfToRead.htmlUrl && (
                  <a
                    href={selectedPdfToRead.htmlUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-2.5 py-1.5 rounded-[8px] flex items-center gap-1 transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>طباعة</span>
                  </a>
                )}
                <a
                  href={selectedPdfToRead.url}
                  download={selectedPdfToRead.url.replace('/', '')}
                  className="bg-[#25866D] hover:bg-[#1E6F5A] text-white text-xs font-bold px-3 py-1.5 rounded-[8px] flex items-center gap-1 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>تحميل PDF</span>
                </a>
                <button
                  onClick={() => setSelectedPdfToRead(null)}
                  className="p-1.5 rounded-[8px] bg-white/10 hover:bg-white/20 text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Embedded PDF iframe / HTML viewer fallback */}
            <div className="flex-1 w-full bg-[#E5ECE9] relative">
              <iframe
                src={selectedPdfToRead.htmlUrl ? selectedPdfToRead.htmlUrl : `${selectedPdfToRead.url}#toolbar=1&navpanes=0`}
                title={selectedPdfToRead.title}
                className="w-full h-full border-0 bg-white"
              />
            </div>

            {/* Modal Footer Note */}
            <div className="bg-[#F8FAF9] p-3 border-t border-[#E0E8E6] flex items-center justify-between text-[11px] text-[#203945]/70">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#25866D]" />
                <span>وثيقة قانونية رسمية معتمدة ومحفوظة بمنصة الفرصة الثانية ({selectedPdfToRead.url.replace('/', '')})</span>
              </span>
              <button
                onClick={() => setSelectedPdfToRead(null)}
                className="font-bold text-[#1766A6] hover:underline"
              >
                إغلاق القارئ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unified Legal Topics Detailed Cards (Exclusively the 3 laws) */}
      <div className="space-y-4">
        {initialLegalTopics.map((topic) => (
          <div
            key={topic.id}
            className="bg-[#FBFDFC] rounded-[20px] border border-[#E5ECE9] p-5 sm:p-6 shadow-xs space-y-3.5 hover:border-[#1766A6]/40 transition-colors"
          >
            {/* 1. عنوان الموضوع */}
            <div className="flex items-start justify-between gap-3 border-b border-[#E5ECE9] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-[8px] bg-[#EAF3F8] text-[#1766A6] flex items-center justify-center shrink-0">
                  <Scale className="w-4 h-4" />
                </div>
                <h3 className="font-black text-[16px] sm:text-[17px] text-[#203945]">
                  ⚖️ {topic.title}
                </h3>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-[6px] bg-[#E8F4EF] text-[#1A5E4D] shrink-0">
                {topic.status === 'ACTIVE' ? 'ساري المفعول' : 'مؤرشف'}
              </span>
            </div>

            {/* 2. ملخص مبسط */}
            <div className="text-[13px] text-[#203945]/85 leading-relaxed bg-[#F3F7F6] p-3 rounded-[12px]">
              <strong className="text-[#203945] block font-bold text-[12px] mb-1">
                ملخص مبسط:
              </strong>
              {topic.plainSummary}
            </div>

            {/* 3. المرجع القانوني */}
            <div className="space-y-1 text-xs">
              <span className="font-bold text-[#1766A6] block">
                📜 المرجع القانوني:
              </span>
              <p className="text-[#203945] font-medium leading-relaxed">
                {topic.legalReference} ({topic.lawDate})
              </p>
            </div>

            {/* 4. المادة ذات الصلة والنص الرسمي */}
            <div className="bg-[#EAF3F8] p-3.5 rounded-[14px] border border-[#DCEBF4] space-y-1.5">
              <div className="flex items-center gap-1.5 text-[#1766A6] font-bold text-xs">
                <FileText className="w-3.5 h-3.5" />
                <span>📝 {topic.relevantArticle} — النص الرسمي:</span>
              </div>
              <p className="text-[12px] sm:text-[13px] font-semibold text-[#104A78] leading-relaxed italic pr-2 border-r-2 border-[#1766A6] whitespace-pre-line">
                {topic.officialText}
              </p>
            </div>

            {/* 5. التعديلات */}
            <div className="space-y-1 text-xs">
              <span className="font-bold text-[#25866D] block">
                🔎 التعديلات التشريعية:
              </span>
              <ul className="list-disc list-inside space-y-0.5 text-[#203945]/80 text-[11px]">
                {topic.amendments.map((amend, i) => (
                  <li key={i}>{amend}</li>
                ))}
              </ul>
            </div>

            {/* 6. شرح مبسط */}
            <div className="space-y-1 text-xs">
              <span className="font-bold text-[#203945] block">
                📋 الشرح الإجرائي المبسط:
              </span>
              <p className="text-[12px] text-[#203945]/80 leading-relaxed">
                {topic.plainExplanation}
              </p>
            </div>

            {/* 7. المرسوم التطبيقي & 8. المصدر الرسمي */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1 border-t border-[#E5ECE9]">
              <div>
                <span className="font-bold text-[#1766A6] block text-[11px]">
                  📚 المرسوم التطبيقي:
                </span>
                <p className="text-[11px] text-[#203945]/80">{topic.executiveDecree}</p>
              </div>

              <div>
                <span className="font-bold text-[#1766A6] block text-[11px]">
                  🔗 المصدر الرسمي:
                </span>
                <p className="text-[11px] text-[#203945]/80">{topic.officialSource}</p>
              </div>
            </div>

            {/* Direct PDF actions on the topic card */}
            {topic.pdfUrl && (
              <div className="bg-[#F0F7F4] p-3 rounded-[12px] border border-[#D5EAE2] flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
                <span className="text-[#1A5E4D] font-bold flex items-center gap-1.5">
                  <FileText className="w-4 h-4" />
                  <span>النسخة الرسمية الكاملة لهذا القانون متاحة للتحميل المباشر ({topic.pdfFileName})</span>
                </span>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <a
                    href={topic.pdfUrl}
                    download={topic.pdfFileName || topic.pdfUrl.replace('/', '')}
                    onClick={() => handleDownloadSingle(topic.pdfUrl!, topic.title)}
                    className="flex-1 sm:flex-none px-3.5 py-1.5 bg-[#25866D] hover:bg-[#1E6F5A] text-white font-bold rounded-[8px] flex items-center justify-center gap-1.5 transition-colors shadow-2xs text-[11px]"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>تحميل القانون ({topic.pdfFileName})</span>
                  </a>
                  <button
                    onClick={() =>
                      setSelectedPdfToRead({
                        title: topic.title,
                        url: topic.pdfUrl!,
                      })
                    }
                    className="flex-1 sm:flex-none px-3 py-1.5 bg-white hover:bg-[#E8F4EF] text-[#1A5E4D] border border-[#25866D]/40 font-bold rounded-[8px] flex items-center justify-center gap-1 transition-colors text-[11px]"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>قراءة فورية</span>
                  </button>
                </div>
              </div>
            )}

            {/* 9. آخر مراجعة & 10. التنبيه القانوني */}
            <div className="pt-2 border-t border-[#E5ECE9] flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px]">
              <span className="text-[#203945]/60 font-medium">
                🕐 آخر مراجعة وتحقق: {topic.lastReviewedDate}
              </span>
              <span className="text-[#A64842] font-bold">
                ⚠️ المعلومات توعوية ولا تشكل استشارة قانونية.
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
