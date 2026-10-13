import React, { useState } from 'react';
import { CalendarPlus, CheckCircle2, FileText, MessageSquare, Printer, X } from 'lucide-react';
import { Appointment, CareRequest, PaymentTransaction } from '../types';

interface BookingConfirmationViewProps {
  request: CareRequest;
  appointment: Appointment;
  transaction: PaymentTransaction;
  onEnterConsultation: () => void;
  onBackToRequests: () => void;
}

function escapeCalendarText(value: string) {
  return value.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
}

function calendarDateTime(date: string, time: string) {
  const dateMatch = date.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const timeMatch = time.match(/(\d{1,2}):(\d{2})/);
  if (!dateMatch || !timeMatch) return null;

  let hour = Number(timeMatch[1]);
  const minute = Number(timeMatch[2]);
  if (hour > 23 || minute > 59) return null;
  if (/مساء|بعد الظهر/.test(time) && hour < 12) hour += 12;
  if (/صباح/.test(time) && hour === 12) hour = 0;

  return {
    year: Number(dateMatch[1]),
    month: Number(dateMatch[2]),
    day: Number(dateMatch[3]),
    hour,
    minute,
  };
}

function formatCalendarDate(value: Date) {
  return [
    value.getUTCFullYear().toString().padStart(4, '0'),
    (value.getUTCMonth() + 1).toString().padStart(2, '0'),
    value.getUTCDate().toString().padStart(2, '0'),
    'T',
    value.getUTCHours().toString().padStart(2, '0'),
    value.getUTCMinutes().toString().padStart(2, '0'),
    '00',
  ].join('');
}

export const BookingConfirmationView: React.FC<BookingConfirmationViewProps> = ({
  request,
  appointment,
  transaction,
  onEnterConsultation,
  onBackToRequests,
}) => {
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const start = calendarDateTime(appointment.date, appointment.time);
  const canAddToCalendar = Boolean(start);

  const downloadCalendarEvent = () => {
    if (!start) return;
    const startDate = new Date(Date.UTC(start.year, start.month - 1, start.day, start.hour, start.minute));
    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//SecChance//Appointment//AR',
      'CALSCALE:GREGORIAN',
      'BEGIN:VEVENT',
      `UID:${escapeCalendarText(transaction.transactionId)}@secchance`,
      `DTSTAMP:${formatCalendarDate(new Date())}`,
      `DTSTART:${formatCalendarDate(startDate)}`,
    ];
    if (request.durationMinutes && request.durationMinutes > 0) {
      lines.push(`DURATION:PT${request.durationMinutes}M`);
    }
    lines.push(
      `SUMMARY:${escapeCalendarText(`استشارة: ${request.serviceTitle}`)}`,
      `DESCRIPTION:${escapeCalendarText(`المستشار: ${appointment.specialistName} | رقم العملية: ${transaction.transactionId}`)}`,
      'END:VEVENT',
      'END:VCALENDAR'
    );

    const file = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = url;
    link.download = `consultation-${request.caseNumber}.ics`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const details = [
    ['الخدمة', request.serviceTitle],
    ['التاريخ', appointment.date],
    ['الساعة', appointment.time],
    ['المستشار', appointment.specialistName],
    ['المبلغ', `${request.amountDzd.toLocaleString('ar-DZ')} دج`],
    ['حالة الدفع', 'مدفوع ومؤكد'],
    ['رقم العملية', transaction.transactionId],
  ];

  return (
    <div className="mx-auto max-w-2xl space-y-5 rounded-[20px] border border-[#E0E8E6] bg-[#FBFDFC] p-6 shadow-xs" dir="rtl">
      <header className="space-y-2 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#E8F4EF] text-[#25866D]">
          <CheckCircle2 className="h-8 w-8" aria-hidden="true" />
        </div>
        <h1 className="text-xl font-black text-[#203945]">تم تأكيد حجزك بنجاح</h1>
        <p className="text-xs text-[#203945]/70">تم تأكيد الموعد والدفع من الأنظمة المسجلة.</p>
      </header>

      <dl className="divide-y divide-[#E0E8E6] rounded-[14px] border border-[#E0E8E6] bg-white px-4">
        {details.map(([label, value]) => (
          <div key={label} className="flex items-start justify-between gap-4 py-3 text-xs">
            <dt className="shrink-0 font-bold text-[#203945]/70">{label}</dt>
            <dd className={`text-left font-semibold text-[#203945] ${label === 'رقم العملية' ? 'font-mono' : ''}`} dir={label === 'رقم العملية' ? 'ltr' : undefined}>
              {value}
            </dd>
          </div>
        ))}
      </dl>

      {!canAddToCalendar && (
        <p role="status" className="rounded-[10px] bg-amber-50 p-3 text-xs text-amber-950">
          تعذر إنشاء ملف التقويم لأن صيغة التاريخ أو الساعة غير مكتملة.
        </p>
      )}

      <div className="grid gap-2 sm:grid-cols-3">
        <button
          type="button"
          onClick={onEnterConsultation}
          className="flex items-center justify-center gap-2 rounded-[11px] bg-[#1766A6] px-3 py-3 text-xs font-bold text-white hover:bg-[#125386]"
        >
          <MessageSquare className="h-4 w-4" />
          الدخول إلى الاستشارة
        </button>
        <button
          type="button"
          onClick={() => setInvoiceOpen(true)}
          className="flex items-center justify-center gap-2 rounded-[11px] border border-[#CCD8D5] bg-white px-3 py-3 text-xs font-bold text-[#203945] hover:bg-[#F3F7F6]"
        >
          <FileText className="h-4 w-4" />
          عرض الفاتورة
        </button>
        <button
          type="button"
          disabled={!canAddToCalendar}
          onClick={downloadCalendarEvent}
          className="flex items-center justify-center gap-2 rounded-[11px] border border-[#CCD8D5] bg-white px-3 py-3 text-xs font-bold text-[#203945] hover:bg-[#F3F7F6] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <CalendarPlus className="h-4 w-4" />
          إضافة الموعد إلى التقويم
        </button>
      </div>

      <button
        type="button"
        onClick={onBackToRequests}
        className="w-full pt-1 text-xs font-bold text-[#1766A6] hover:underline"
      >
        العودة إلى الطلبات
      </button>

      {invoiceOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setInvoiceOpen(false);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="booking-invoice-title"
            className="w-full max-w-md space-y-4 rounded-[18px] bg-white p-5 text-right shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-[#E0E8E6] pb-3">
              <h2 id="booking-invoice-title" className="font-black text-[#203945]">فاتورة الاستشارة</h2>
              <button
                type="button"
                aria-label="إغلاق الفاتورة"
                onClick={() => setInvoiceOpen(false)}
                className="rounded-full p-1 text-[#203945]/70 hover:bg-[#F3F7F6]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <dl className="space-y-3 text-xs">
              {details.map(([label, value]) => (
                <div key={label} className="flex justify-between gap-4">
                  <dt className="font-bold text-[#203945]/70">{label}</dt>
                  <dd className="text-left font-semibold text-[#203945]" dir={label === 'رقم العملية' ? 'ltr' : undefined}>
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
            <button
              type="button"
              onClick={() => window.print()}
              className="flex w-full items-center justify-center gap-2 rounded-[11px] bg-[#1766A6] px-4 py-3 text-xs font-bold text-white"
            >
              <Printer className="h-4 w-4" />
              طباعة الفاتورة
            </button>
          </section>
        </div>
      )}
    </div>
  );
};
