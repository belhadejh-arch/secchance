import React from 'react';
import { Appointment } from '../types';
import { Plus, Calendar, Clock } from 'lucide-react';

interface AppointmentsViewProps {
  appointments: Appointment[];
  onBookNew: () => void;
}

export const AppointmentsView: React.FC<AppointmentsViewProps> = ({
  appointments,
  onBookNew,
}) => {
  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[18px] font-black text-[#203945]">
            المواعيد وجلسات المتابعة
          </h1>
          <p className="text-[11px] text-[#203945]/70 mt-0.5">
            إدارة مواعيدك الطبية والقانونية بكل سرية
          </p>
        </div>

        <button
          onClick={onBookNew}
          className="flex items-center gap-1 px-3 py-1.5 rounded-[12px] bg-[#1766A6] text-white text-[11px] font-bold shadow-xs hover:bg-[#125386] transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>موعد جديد</span>
        </button>
      </div>

      <div className="space-y-3">
        {appointments.map((appt) => (
          <div
            key={appt.id}
            className="bg-[#FBFDFC] rounded-[16px] border border-[#E5ECE9] p-4 shadow-xs space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-[11px] text-[#1766A6]">
                {appt.caseNumber}
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-[6px] ${
                  appt.status === 'CONFIRMED'
                    ? 'bg-[#E8F4EF] text-[#1A5E4D]'
                    : 'bg-[#EAF3F8] text-[#104A78]'
                }`}
              >
                {appt.status}
              </span>
            </div>

            <h3 className="font-bold text-[15px] text-[#203945]">
              {appt.type}
            </h3>

            <p className="text-[12px] text-[#203945]/80">
              الأخصائي / المستشار: {appt.specialistName} ({appt.specialty})
            </p>

            <div className="flex items-center gap-4 pt-1 text-[11px] text-[#203945]/80">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#1766A6]" />
                <span>{appt.date}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#25866D]" />
                <span>{appt.time}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
