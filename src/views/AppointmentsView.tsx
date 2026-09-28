import React from 'react';
import { Appointment } from '../types';
import { Calendar, Clock, Plus, CheckCircle2, AlertCircle } from 'lucide-react';

interface AppointmentsViewProps {
  appointments: Appointment[];
  onBookNew: () => void;
}

export const AppointmentsView: React.FC<AppointmentsViewProps> = ({
  appointments,
  onBookNew,
}) => {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900">
            المواعيد وجلسات المتابعة
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            إدارة مواعيدك الطبية والقانونية بكل سرية وانتظام
          </p>
        </div>

        <button
          onClick={onBookNew}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>حجز موعد جديد</span>
        </button>
      </div>

      {appointments.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-xs text-slate-500">
          لا توجد مواعيد مبرمجة حالياً.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {appointments.map((appt) => {
            const isConfirmed = appt.status === 'CONFIRMED';
            return (
              <div
                key={appt.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                    {appt.caseNumber}
                  </span>
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                      isConfirmed
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'bg-amber-100 text-amber-800 border border-amber-200'
                    }`}
                  >
                    {isConfirmed ? 'موعد مؤكد ومثبت' : 'بانتظار التأكيد'}
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-sm sm:text-base text-slate-900">
                    {appt.type}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    الأخصائي / المستشار: <span className="font-semibold text-slate-800">{appt.specialistName}</span> ({appt.specialty})
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-700">
                  <div className="flex items-center gap-1.5 text-blue-700 font-bold">
                    <Calendar className="w-4 h-4" />
                    <span>{appt.date}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <Clock className="w-4 h-4" />
                    <span>{appt.time}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
