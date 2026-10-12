import React, { useState } from 'react';
import { AlertTriangle, ArrowLeft, ArrowRight } from 'lucide-react';
import { GuidanceProgress } from '../components/GuidanceProgress';
import { ALGERIA_WILAYAS } from '../types';

export type AssessmentNeed =
  | 'legal'
  | 'psychological'
  | 'center'
  | 'association'
  | 'legal-information'
  | 'family-guidance';

export interface AssessmentAnswers {
  targetPerson: 'self' | 'family';
  need: AssessmentNeed;
  wilaya: string;
  isUrgent: boolean;
}

interface NeedsAssessmentViewProps {
  initialAnswers?: AssessmentAnswers | null;
  initialTargetPerson?: 'self' | 'family';
  onContinue: (answers: AssessmentAnswers) => void;
  onBack: () => void;
}

const needs: { value: AssessmentNeed; label: string }[] = [
  { value: 'legal', label: 'استشارة قانونية' },
  { value: 'psychological', label: 'استشارة نفسية' },
  { value: 'center', label: 'العثور على مركز علاج' },
  { value: 'association', label: 'العثور على جمعية' },
  { value: 'legal-information', label: 'معلومات قانونية' },
  { value: 'family-guidance', label: 'إرشاد أسري' },
];

export const NeedsAssessmentView: React.FC<NeedsAssessmentViewProps> = ({
  initialAnswers,
  initialTargetPerson = 'self',
  onContinue,
  onBack,
}) => {
  const [targetPerson, setTargetPerson] = useState<'self' | 'family'>(
    initialAnswers?.targetPerson ?? initialTargetPerson
  );
  const [need, setNeed] = useState<AssessmentNeed | ''>(initialAnswers?.need ?? '');
  const [wilaya, setWilaya] = useState(initialAnswers?.wilaya ?? '16. الجزائر العاصمة');
  const [isUrgent, setIsUrgent] = useState(initialAnswers?.isUrgent ?? false);
  const [error, setError] = useState('');

  const handleContinue = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!need) {
      setError('يرجى تحديد الخدمة التي تبحث عنها للمتابعة.');
      return;
    }

    onContinue({ targetPerson, need, wilaya, isUrgent });
  };

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <GuidanceProgress activeStep={1} />

      <form
        onSubmit={handleContinue}
        className="space-y-5 rounded-[20px] border border-[#E0E8E6] bg-[#FBFDFC] p-5 shadow-xs sm:p-6"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-black text-[#203945]">تحديد احتياجي</h1>
            <p className="mt-1 text-sm leading-relaxed text-[#203945]/70">
              أجب عن الأسئلة لنرشدك إلى الخدمات التي قد تناسب ما تبحث عنه.
            </p>
          </div>
          <button
            type="button"
            onClick={onBack}
            className="flex shrink-0 items-center gap-1 rounded-[10px] px-2 py-1 text-xs font-bold text-[#1766A6] hover:bg-[#EAF3F8]"
          >
            <ArrowRight className="h-4 w-4" />
            رجوع
          </button>
        </div>

        <fieldset className="space-y-2">
          <legend className="text-sm font-bold text-[#203945]">لمن تطلب المساعدة؟</legend>
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: 'self' as const, label: 'لنفسي' },
              { value: 'family' as const, label: 'لأحد أفراد أسرتي' },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                aria-pressed={targetPerson === option.value}
                onClick={() => setTargetPerson(option.value)}
                className={`rounded-[12px] border p-3 text-sm font-bold transition-colors ${
                  targetPerson === option.value
                    ? 'border-[#1766A6] bg-[#EAF3F8] text-[#104A78]'
                    : 'border-[#E0E8E6] bg-white text-[#203945] hover:border-[#1766A6]'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="space-y-2">
          <legend className="text-sm font-bold text-[#203945]">ما الذي تبحث عنه؟</legend>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {needs.map((option) => (
              <button
                key={option.value}
                type="button"
                aria-pressed={need === option.value}
                onClick={() => {
                  setNeed(option.value);
                  setError('');
                }}
                className={`rounded-[12px] border p-3 text-right text-sm font-bold transition-colors ${
                  need === option.value
                    ? 'border-[#1766A6] bg-[#EAF3F8] text-[#104A78]'
                    : 'border-[#E0E8E6] bg-white text-[#203945] hover:border-[#1766A6]'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="space-y-2">
          <label htmlFor="assessment-wilaya" className="block text-sm font-bold text-[#203945]">
            الولاية
          </label>
          <select
            id="assessment-wilaya"
            value={wilaya}
            onChange={(event) => setWilaya(event.target.value)}
            className="w-full rounded-[12px] border border-[#CCD8D5] bg-white p-3 text-sm text-[#203945] outline-hidden focus:border-[#1766A6]"
          >
            {ALGERIA_WILAYAS.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </div>

        <fieldset className="space-y-2">
          <legend className="text-sm font-bold text-[#203945]">هل توجد حالة عاجلة؟</legend>
          <div className="grid grid-cols-2 gap-2">
            {[false, true].map((value) => (
              <button
                key={String(value)}
                type="button"
                aria-pressed={isUrgent === value}
                onClick={() => setIsUrgent(value)}
                className={`rounded-[12px] border p-3 text-sm font-bold transition-colors ${
                  isUrgent === value
                    ? value
                      ? 'border-[#A64842] bg-[#FBECEB] text-[#8A3A35]'
                      : 'border-[#1766A6] bg-[#EAF3F8] text-[#104A78]'
                    : 'border-[#E0E8E6] bg-white text-[#203945] hover:border-[#1766A6]'
                }`}
              >
                {value ? 'نعم' : 'لا'}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="flex items-start gap-2 rounded-[12px] border border-[#FFE082] bg-[#FFF8E1] p-3 text-xs leading-relaxed text-[#5D4037]">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#E65100]" />
          <p>
            الحالات التي تتطلب تدخلاً صحياً عاجلاً يجب توجيهها مباشرة إلى خدمات الطوارئ أو الجهات الصحية المختصة.
          </p>
        </div>

        {error && <p role="alert" className="text-sm font-bold text-[#A64842]">{error}</p>}

        <button
          type="submit"
          className="flex w-full items-center justify-center gap-2 rounded-[12px] bg-[#1766A6] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-[#125386]"
        >
          متابعة
          <ArrowLeft className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
};
