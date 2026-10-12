import React from 'react';

const steps = ['الاحتياج', 'المعلومات', 'الخدمة', 'الموعد', 'التأكيد'];

interface GuidanceProgressProps {
  activeStep: number;
}

export const GuidanceProgress: React.FC<GuidanceProgressProps> = ({ activeStep }) => (
  <nav
    aria-label="خطوات تحديد الاحتياج وحجز الخدمة"
    className="bg-[#FBFDFC] border border-[#E0E8E6] rounded-[16px] p-3 shadow-xs"
    dir="rtl"
  >
    <ol className="flex items-center justify-between gap-1">
      {steps.map((step, index) => {
        const stepNumber = index + 1;
        const isComplete = stepNumber < activeStep;
        const isActive = stepNumber === activeStep;

        return (
          <React.Fragment key={step}>
            <li
              aria-current={isActive ? 'step' : undefined}
              className={`flex min-w-0 flex-col items-center gap-1 text-center text-[9px] sm:text-[11px] font-bold ${
                isComplete || isActive ? 'text-[#1766A6]' : 'text-[#203945]/50'
              }`}
            >
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full border text-[10px] ${
                  isComplete || isActive
                    ? 'border-[#1766A6] bg-[#1766A6] text-white'
                    : 'border-[#CCD8D5] bg-white'
                }`}
              >
                {stepNumber}
              </span>
              <span>{step}</span>
            </li>
            {index < steps.length - 1 && (
              <li aria-hidden="true" className="pb-4 text-[10px] text-[#203945]/40">
                ←
              </li>
            )}
          </React.Fragment>
        );
      })}
    </ol>
  </nav>
);
