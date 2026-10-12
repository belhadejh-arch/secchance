import React, { useState } from 'react';
import { User, Priority } from '../types';
import { initialUsers, initialServices } from '../data/initialData';
import { Scale, Lock, CheckCircle, ArrowRight, AlertTriangle, FileText } from 'lucide-react';

interface LegalAssistanceViewProps {
  currentUser: User | null;
  onSubmitLegalCase: (data: {
    serviceId: number;
    caseType: string;
    description: string;
    wilaya: string;
    lawyerId: number | string;
    attachedDocs: string[];
    priority: Priority;
  }) => void | Promise<void>;
  onOpenAuth: () => void;
  onBack: () => void;
}

export const LegalAssistanceView: React.FC<LegalAssistanceViewProps> = ({
  currentUser,
  onSubmitLegalCase,
  onOpenAuth,
  onBack,
}) => {
  const consultationTopics = [
    'استفسار قانوني.',
    'وضعية أحد أفراد الأسرة.',
    'وضعية مرتبطة بالمخدرات أو المؤثرات العقلية.',
    'إجراء قانوني.',
    'وضعية قضائية.',
    'حقوق والتزامات.',
    'أخرى.',
  ];

  const lawyers = initialUsers.filter((u) => u.roleSlug === 'lawyer');
  const legalService = initialServices.find((s) => s.category.includes('قانون')) || initialServices[1];

  const [description, setDescription] = useState('');
  const [caseType, setCaseType] = useState(consultationTopics[0]);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onOpenAuth();
      return;
    }
    if (!description.trim() || !privacyAccepted || isSubmitting) return;

    setIsSubmitting(true);
    setSubmissionError('');
    try {
      await onSubmitLegalCase({
        serviceId: legalService.id,
        caseType,
        description,
        wilaya: currentUser.wilayaName || '16. الجزائر العاصمة',
        lawyerId: Number(legalService.providerId ?? lawyers[0]?.id ?? 3),
        attachedDocs: attachedFile ? [attachedFile.name] : [],
        priority: 'High',
      });

      setIsSuccess(true);
    } catch {
      setSubmissionError('تعذر إرسال طلب الاستشارة الآن. يرجى المحاولة مجدداً.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="max-w-xl mx-auto bg-[#FBFDFC] rounded-[22px] border border-[#E5ECE9] p-6 text-center space-y-4 shadow-sm">
        <div className="w-14 h-14 bg-[#E8F4EF] text-[#25866D] rounded-full flex items-center justify-center mx-auto">
          <CheckCircle className="w-8 h-8" />
        </div>
        <h2 className="text-[20px] font-black text-[#203945]">
          تم إرسال طلب الاستشارة القانونية بنجاح
        </h2>
        <p className="text-[13px] text-[#203945]/80 leading-relaxed">
          تم تسجيل طلبك لدى المستشار القانوني. ستصلك إشعارات عند متابعة الطلب.
        </p>
        <div className="bg-[#EAF3F8] p-3 rounded-[12px] text-xs font-bold text-[#104A78]">
          يرجى مشاركة المعلومات والوثائق اللازمة للاستشارة فقط.
        </div>
        <button
          onClick={onBack}
          className="px-6 py-2.5 rounded-[12px] bg-[#1766A6] text-white font-bold text-xs shadow-xs hover:bg-[#125386] transition-colors"
        >
          الانتقال لمتابعة طلباتي
        </button>
      </div>
    );
  }

  return (
      <div className="space-y-4 max-w-2xl mx-auto" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-xs font-bold text-[#1766A6] hover:underline mb-1"
          >
            <ArrowRight className="w-3.5 h-3.5" />
            <span>العودة</span>
          </button>
          <div className="flex items-center gap-2.5">
            <img
              src="/logo.png"
              alt="شعار منصة الفرصة الثانية"
              className="w-10 h-10 object-contain rounded-full border border-[#DCEBF4] bg-white p-0.5 shrink-0"
            />
            <div>
              <h1 className="text-[20px] font-black text-[#203945]">
                ⚖️ الاستشارة القانونية
              </h1>
              <p className="text-[11px] text-[#203945]/70">
                استشارة مباشرة مع مستشار قانوني مؤهل لفهم الوضعية القانونية والإجراءات والمسارات الممكنة ضمن اختصاصه.
              </p>
            </div>
          </div>
          <p className="mt-2 text-sm font-black text-[#25866D]">السعر: 500 دج</p>
        </div>
      </div>

      <div className="bg-[#EAF3F8] border border-[#DCEBF4] rounded-[16px] p-3.5 flex items-start gap-3 shadow-xs">
        <Lock className="w-5 h-5 text-[#1766A6] shrink-0 mt-0.5" />
        <div className="text-[11px] text-[#104A78] leading-relaxed">
          <strong className="font-bold block text-[12px] mb-0.5">
            تنبيه الخصوصية
          </strong>
          شارك المعلومات والوثائق الضرورية لطلبك فقط. تُستخدم التفاصيل التي تقدمها لمعالجة طلب الاستشارة.
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-[#FBFDFC] rounded-[20px] border border-[#E5ECE9] p-5 sm:p-6 space-y-5 shadow-xs">
        <div className="flex items-center justify-between rounded-[14px] bg-[#F3F7F6] border border-[#E5ECE9] p-4">
          <div>
            <p className="text-xs font-bold text-[#203945]">سعر الاستشارة</p>
            <p className="text-[11px] text-[#203945]/65 mt-1">استشارة قانونية مباشرة</p>
          </div>
          <strong className="text-lg font-black text-[#25866D]">500 دج</strong>
        </div>

        <div className="space-y-1.5">
          <label className="text-[13px] font-bold text-[#203945] block">
            ما موضوع استشارتك؟
          </label>
          <select
            value={caseType}
            onChange={(e) => setCaseType(e.target.value)}
            required
            className="w-full p-2.5 text-xs sm:text-sm bg-white border border-[#CCD8D5] rounded-[12px] outline-hidden focus:border-[#1766A6] text-[#203945]"
          >
            {consultationTopics.map((topic) => <option key={topic} value={topic}>{topic}</option>)}
          </select>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="legal-consultation-description" className="text-[13px] font-bold text-[#203945] block">
            اشرح لنا سؤالك أو وضعيتك
          </label>
          <textarea
            id="legal-consultation-description"
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="اكتب التفاصيل التي تساعد المستشار على فهم سؤالك..."
            rows={6}
            className="w-full p-3 text-xs sm:text-sm bg-white border border-[#CCD8D5] rounded-[12px] outline-hidden focus:border-[#1766A6] text-[#203945] resize-none shadow-xs"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="legal-consultation-document" className="text-[13px] font-bold text-[#203945] block">
            إرفاق وثيقة (اختياري)
          </label>
          <div className="flex items-center gap-3 rounded-[12px] border border-dashed border-[#CCD8D5] bg-white p-3">
            <FileText className="w-5 h-5 text-[#1766A6] shrink-0" />
            <input
              id="legal-consultation-document"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              onChange={(e) => setAttachedFile(e.target.files?.[0] ?? null)}
              className="min-w-0 flex-1 text-xs text-[#203945] file:ml-3 file:rounded-lg file:border-0 file:bg-[#EAF3F8] file:px-3 file:py-2 file:text-xs file:font-bold file:text-[#1766A6]"
            />
          </div>
          {attachedFile && (
            <div className="flex items-center justify-between gap-2 text-xs text-[#203945]/75">
              <span className="truncate">{attachedFile.name}</span>
              <button type="button" onClick={() => setAttachedFile(null)} className="shrink-0 font-bold text-[#A64842] hover:underline">
                إزالة
              </button>
            </div>
          )}
        </div>

        <div className="rounded-[14px] border border-amber-200 bg-amber-50 p-4 text-xs leading-relaxed text-amber-950">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
            <div>
              <strong className="mb-1 block">تنبيه مهم قبل المتابعة</strong>
              الاستشارة لا تعني صدور حكم قضائي أو قرار رسمي، ولا تعني تلقائيًا تمثيلك أمام الجهات القضائية.
            </div>
          </div>
          <label className="mt-3 flex cursor-pointer items-start gap-2 border-t border-amber-200 pt-3">
            <input
              type="checkbox"
              required
              checked={privacyAccepted}
              onChange={(e) => setPrivacyAccepted(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-[#1766A6]"
            />
            <span>أؤكد اطلاعي على تنبيه الخصوصية والتنبيه المهم قبل المتابعة.</span>
          </label>
        </div>

        {submissionError && (
          <p role="alert" className="rounded-lg bg-red-50 p-3 text-xs font-bold text-red-700">{submissionError}</p>
        )}

        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-[50px] rounded-[14px] bg-[#1766A6] hover:bg-[#125386] disabled:cursor-not-allowed disabled:opacity-60 text-white font-bold text-[14px] shadow-xs flex items-center justify-center gap-2 transition-colors"
          >
            {isSubmitting ? <span>جارٍ إرسال الطلب...</span> : <><Scale className="w-4 h-4" /><span>متابعة طلب الاستشارة</span></>}
          </button>
          <p className="text-[11px] text-center text-[#203945]/60 mt-2">
            500 دج — سيتم تسجيل طلب الاستشارة وإشعار المستشار القانوني.
          </p>
        </div>
      </form>
    </div>
  );
};
