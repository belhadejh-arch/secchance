import React, { useState } from 'react';
import { initialLegalTopics } from '../data/initialData';
import {
  Scale,
  BookOpen,
  AlertTriangle,
  FileText,
  CheckCircle2,
  Download,
  Eye,
  FileDown,
  X,
  ShieldCheck,
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
  } | null>(null);

  const officialPdfDocuments = [
    {
      id: '18-04',
      title: 'القانون رقم 04-18 المؤرخ في 25 ديسمبر 2004',
      subtitle: 'الوقاية من المخدرات والمؤثرات العقلية وقمع الاستعمال والاتجار غير المشروعين بها (المادة 6 وإسقاط المتابعة)',
      file: '/18-04.pdf',
      pages: 'الجريدة الرسمية عدد 83',
      badge: 'القانون الأساسي المعتمد',
    },
    {
      id: '25-03',
      title: 'القانون رقم 25-03 المؤرخ في 1 يوليو 2025',
      subtitle: 'المعدل والمتمم للقانون رقم 04-18 (الفحوصات الطبية، الوقاية، وإعادة الإدماج الاجتماعي)',
      file: '/25-03.pdf',
      pages: 'الجريدة الرسمية عدد 43',
      badge: 'التعديل التشريعي 2025',
    },
    {
      id: '76-26',
      title: 'المرسوم التنفيذي رقم 26-76 / 07-229',
      subtitle: 'شروط وكيفيات الفحوصات الطبية عند التوظيف وضمانات السر المهني والتكفل بالعلاج',
      file: '/76-26-ar-1.pdf',
      pages: 'الجريدة الرسمية عدد 08',
      badge: 'مرسوم تطبيقي ملزم',
    },
    {
      id: '18-07',
      title: 'القانون رقم 18-07 المؤرخ في 10 يونيو 2018',
      subtitle: 'حماية الأشخاص الطبيعيين في مجال معالجة المعطيات ذات الطابع الشخصي (حماية البيانات الصحية والسرية)',
      file: '/18-07.pdf',
      pages: 'الجريدة الرسمية عدد 34',
      badge: 'حماية الخصوصية والمعطيات',
    },
  ];

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-[20px] font-black text-[#203945]">
          المراجع القانونية الموحدة والتوعية التشريعية ⚖️
        </h1>
        <p className="text-[12px] text-[#203945]/70 mt-0.5">
          الأطر التشريعية الرسمية الموثقة في الجزائر (القانون 04-18، تعديلاته بالقانون 25-03، المرسوم التنفيذي 26-76، وقانون حماية المعطيات الشخصية 18-07)
        </p>
      </div>

      {/* Official Legal Framework Banner */}
      <div className="bg-[#EAF3F8] rounded-[18px] p-4.5 space-y-2 border border-[#DCEBF4] shadow-xs">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-[#1766A6]" />
          <h2 className="font-bold text-[14px] text-[#1766A6]">
            📜 المراجع التشريعية الوطنية المعتمدة
          </h2>
        </div>
        <p className="text-[12px] text-[#104A78] leading-[22px] font-normal">
          • <strong>القانون رقم 04-18</strong> (25 ديسمبر 2004) المتعلق بالوقاية من المخدرات والمؤثرات العقلية وقمع الاستعمال والاتجار غير المشروعين بها (الجريدة الرسمية عدد 83).<br />
          • <strong>القانون رقم 25-03</strong> (1 يوليو 2025) المعدل والمتمم للقانون 04-18 (إدراج الفحوصات الطبية، تعزيز الوقاية وإعادة الإدماج، الجريدة الرسمية عدد 43).<br />
          • <strong>المرسوم التنفيذي رقم 26-76</strong> (14 جانفي 2026) المحدد لشروط وكيفيات الوقاية عند التوظيف في القطاعين العام والخاص والسر المهني (الجريدة الرسمية عدد 08).<br />
          • <strong>القانون رقم 18-07</strong> (10 يونيو 2018) المتعلق بحماية الأشخاص الطبيعيين في مجال معالجة المعطيات ذات الطابع الشخصي، المعدل والمتمم (الجريدة الرسمية عدد 34).
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

      {/* DIRECT PDF DOWNLOAD & READING SECTION (New Requirement) */}
      <div className="bg-[#FBFDFC] border-2 border-[#1766A6]/30 rounded-[20px] p-5 shadow-xs space-y-3.5">
        <div className="flex items-center justify-between border-b border-[#E0E8E6] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-[10px] bg-[#1766A6] text-white flex items-center justify-center">
              <FileDown className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-[15px] font-black text-[#203945]">
                📥 تحميل وقراءة القوانين والمراسيم الرسمية مباشرة (PDF)
              </h2>
              <p className="text-[11px] text-[#203945]/70">
                يمكن لجميع الزوار والمستفيدين تصفح وتحميل النصوص التشريعية الرسمية المعتمدة مجاناً
              </p>
            </div>
          </div>
          <span className="text-[11px] font-bold bg-[#E8F4EF] text-[#1A5E4D] px-2.5 py-1 rounded-[8px] hidden sm:inline-block">
            نصوص رسمية معتمدة ⚖️
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {officialPdfDocuments.map((doc) => (
            <div
              key={doc.id}
              className="bg-white rounded-[14px] border border-[#E0E8E6] p-4 flex flex-col justify-between space-y-3 hover:border-[#1766A6] transition-colors shadow-2xs"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-[6px] bg-[#EAF3F8] text-[#1766A6]">
                    {doc.badge}
                  </span>
                  <span className="text-[10px] text-[#203945]/60 font-medium">
                    {doc.pages}
                  </span>
                </div>
                <h3 className="font-bold text-[13px] text-[#203945] leading-snug">
                  {doc.title}
                </h3>
                <p className="text-[11px] text-[#203945]/70 leading-relaxed">
                  {doc.subtitle}
                </p>
              </div>

              <div className="pt-2 border-t border-[#F0F4F2] flex items-center gap-2">
                <a
                  href={doc.file}
                  download
                  className="flex-1 bg-[#1766A6] hover:bg-[#125386] text-white font-bold text-xs py-2 px-3 rounded-[10px] flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>تحميل PDF</span>
                </a>

                <button
                  onClick={() =>
                    setSelectedPdfToRead({ title: doc.title, url: doc.file })
                  }
                  className="flex-1 bg-[#F3F7F6] hover:bg-[#E5ECE9] text-[#203945] font-bold text-xs py-2 px-3 rounded-[10px] flex items-center justify-center gap-1.5 transition-colors border border-[#DCE4E1]"
                >
                  <Eye className="w-3.5 h-3.5 text-[#1766A6]" />
                  <span>قراءة مباشرة</span>
                </button>
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
                <a
                  href={selectedPdfToRead.url}
                  download
                  className="bg-[#25866D] hover:bg-[#1E6F5A] text-white text-xs font-bold px-3 py-1.5 rounded-[8px] flex items-center gap-1 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>تحميل</span>
                </a>
                <button
                  onClick={() => setSelectedPdfToRead(null)}
                  className="p-1.5 rounded-[8px] bg-white/10 hover:bg-white/20 text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Embedded PDF iframe */}
            <div className="flex-1 w-full bg-[#E5ECE9] relative">
              <iframe
                src={`${selectedPdfToRead.url}#toolbar=1&navpanes=0`}
                title={selectedPdfToRead.title}
                className="w-full h-full border-0"
              />
            </div>

            {/* Modal Footer Note */}
            <div className="bg-[#F8FAF9] p-3 border-t border-[#E0E8E6] flex items-center justify-between text-[11px] text-[#203945]/70">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#25866D]" />
                <span>وثيقة قانونية رسمية معتمدة ومحفوظة بمنصة الفرصة الثانية</span>
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

      {/* Unified Legal Topics Detailed Cards */}
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
              <p className="text-[12px] sm:text-[13px] font-semibold text-[#104A78] leading-relaxed italic pr-2 border-r-2 border-[#1766A6]">
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
                  <span>النسخة الرسمية الكاملة المعتمدة لهذا القانون متاحة بصيغة PDF</span>
                </span>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <a
                    href={topic.pdfUrl}
                    download
                    className="flex-1 sm:flex-none px-3 py-1.5 bg-[#25866D] hover:bg-[#1E6F5A] text-white font-bold rounded-[8px] flex items-center justify-center gap-1 transition-colors shadow-2xs text-[11px]"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>تحميل النص الكامل (PDF)</span>
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
