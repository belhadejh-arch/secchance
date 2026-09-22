import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Appointment } from '../types';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Video, 
  Plus, 
  ChevronRight, 
  ChevronLeft, 
  HeartHandshake, 
  Scale, 
  Building2, 
  X,
  ArrowRight,
  UserCheck,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface AppointmentsViewProps {
  onBack?: () => void;
}

export const AppointmentsView: React.FC<AppointmentsViewProps> = ({ onBack }) => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');
  const [selectedDay, setSelectedDay] = useState<number>(20);
  const [showModal, setShowModal] = useState<boolean>(false);

  // Form states for booking
  const [type, setType] = useState<'psychological' | 'legal'>('psychological');
  const [date, setDate] = useState<string>('2026-09-20');
  const [startTime, setStartTime] = useState<string>('10:00');
  const [endTime, setEndTime] = useState<string>('11:00');

  const fetchAppointments = async () => {
    try {
      const res = await api.getAppointments();
      setAppointments(res.data.appointments || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createAppointment({
        case_id: 1,
        specialist_id: 2,
        appointment_date: date,
        start_time: startTime,
        end_time: endTime,
        type: type,
        title: type === 'psychological' ? 'جلسة دعم نفسي سلوكي' : 'استشارة قانونية وتكييف وضعية'
      });
      setShowModal(false);
      fetchAppointments();
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء حجز الموعد');
    }
  };

  const daysList = [
    { dayName: 'السبت', dayNum: 19 },
    { dayName: 'الأحد', dayNum: 20 },
    { dayName: 'الاثنين', dayNum: 21 },
    { dayName: 'الثلاثاء', dayNum: 22 },
    { dayName: 'الأربعاء', dayNum: 23 },
    { dayName: 'الخميس', dayNum: 24 },
    { dayName: 'الجمعة', dayNum: 25 },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6 pb-28 lg:pb-12 font-sans relative" dir="rtl">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/60 pb-3">
        <div className="flex items-center gap-3">
          {onBack && (
            <button 
              onClick={onBack} 
              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900">جدول المواعيد والاستشارات</h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">جلسات دعم نفسي واستشارات قانونية مرئية ومشفرة</p>
          </div>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="hidden sm:flex items-center gap-2 px-4 py-2 bg-[#1565C0] hover:bg-blue-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>حجز موعد استشاري جديد</span>
        </button>
      </div>

      {/* Desktop 2-Column Layout / Mobile Stacked */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Main Column (8 cols on desktop): Tabs and Appointments List */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* Tabs Row: قادمة / السابقة */}
          <div className="flex rounded-2xl bg-slate-100 p-1 text-xs font-bold max-w-sm">
            <button
              onClick={() => setTab('upcoming')}
              className={`flex-1 py-2 rounded-xl transition-all cursor-pointer ${
                tab === 'upcoming' ? 'bg-[#1565C0] text-white shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              المواعيد القادمة
            </button>
            <button
              onClick={() => setTab('past')}
              className={`flex-1 py-2 rounded-xl transition-all cursor-pointer ${
                tab === 'past' ? 'bg-[#1565C0] text-white shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              المواعيد السابقة
            </button>
          </div>

          {/* Appointment Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {appointments.length === 0 ? (
              <div className="col-span-2 bg-white rounded-2xl p-8 border border-dashed border-slate-300 text-center space-y-2 text-slate-500 text-xs">
                <CalendarIcon className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="font-bold">لا توجد مواعيد مسجلة في هذا القسم حالياً.</p>
              </div>
            ) : (
              appointments.map((apt) => {
                const isPsych = apt.type === 'psychological';
                const isLaw = apt.type === 'legal';
                const title = apt.title || (isPsych ? 'جلسة دعم نفسي' : isLaw ? 'استشارة قانونية' : 'متابعة علاجية');
                const docName = `د. ${apt.specialist_first_name} ${apt.specialist_last_name}`;

                return (
                  <div
                    key={apt.id}
                    className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs hover:shadow-md hover:border-blue-200 transition-all flex flex-col justify-between space-y-3"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                            isPsych ? 'bg-blue-100 text-[#1565C0]' : isLaw ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                          }`}>
                            {isPsych ? <HeartHandshake className="w-5 h-5" /> : isLaw ? <Scale className="w-5 h-5" /> : <Building2 className="w-5 h-5" />}
                          </div>
                          <div>
                            <h3 className="font-bold text-xs sm:text-sm text-slate-900">{title}</h3>
                            <p className="text-[11px] text-slate-500 font-medium">{docName}</p>
                          </div>
                        </div>

                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                          apt.status === 'confirmed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {apt.status === 'confirmed' ? 'مؤكد' : 'معلق'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 text-xs text-slate-500">
                      <span className="flex items-center gap-1 font-mono text-[11px]">
                        <Clock className="w-3.5 h-3.5 text-[#1565C0]" />
                        <span>{apt.start_time || '10:00'} - {apt.end_time || '11:00'}</span>
                      </span>

                      <button
                        onClick={() => alert(`بدء الاتصال المرئي الآمن للموعد #${apt.id}`)}
                        className="px-3 py-1.5 bg-[#F0F7FF] text-[#1565C0] hover:bg-[#1565C0] hover:text-white font-bold rounded-xl text-[11px] transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Video className="w-3.5 h-3.5" />
                        <span>انضمام للجلسة</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

        </div>

        {/* Side Column (4 cols on desktop): Calendar Day Picker & Quick Info */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* Calendar Header & Day Picker */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-4 sm:p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <button className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer">
                <ChevronRight className="w-4 h-4" />
              </button>
              <span className="font-black text-xs sm:text-sm text-slate-900">المواعيد 2026 / 2027</span>
              <button className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer">
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>

            {/* Days Row */}
            <div className="flex items-center justify-between gap-1 overflow-x-auto pb-1 text-center">
              {daysList.map((d) => {
                const isSelected = selectedDay === d.dayNum;
                return (
                  <button
                    key={d.dayNum}
                    onClick={() => setSelectedDay(d.dayNum)}
                    className={`flex-1 min-w-[38px] py-2 rounded-2xl transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#1565C0] text-white shadow-xs'
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span className={`text-[10px] block font-medium ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                      {d.dayName}
                    </span>
                    <span className="text-xs sm:text-sm font-black block mt-0.5">
                      {d.dayNum}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Info Box */}
          <div className="bg-blue-50/70 rounded-2xl p-4 border border-blue-100 space-y-2 text-xs">
            <div className="flex items-center gap-2 text-[#1565C0] font-bold">
              <UserCheck className="w-4 h-4" />
              <span>ملاحظة حول الجلسات والاستشارات</span>
            </div>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              جميع المقابلات والاستشارات المرئية مشفرة من طرف لطرف وتتم تحت مظلة السر المهني الطبي والقضائي. يمكنك اختيار إخفاء الكاميرا أو التحدث صوتياً فقط.
            </p>
          </div>

        </div>

      </div>

      {/* Floating Action Button (+) for New Appointment on Mobile */}
      <button
        onClick={() => setShowModal(true)}
        className="sm:hidden fixed bottom-20 left-6 z-30 w-12 h-12 rounded-full bg-[#1565C0] text-white flex items-center justify-center shadow-lg shadow-blue-600/30 hover:scale-105 active:scale-95 transition-all cursor-pointer"
        title="حجز موعد جديد"
      >
        <Plus className="w-6 h-6 stroke-[2.5]" />
      </button>

      {/* Modal for Booking New Appointment */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl border border-slate-200 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">حجز موعد استشاري جديد</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateAppointment} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">نوع الموعد:</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setType('psychological')}
                    className={`flex-1 py-2 rounded-xl border font-bold cursor-pointer transition-colors ${type === 'psychological' ? 'border-[#1565C0] bg-blue-50 text-[#1565C0]' : 'border-slate-200 hover:bg-slate-50'}`}
                  >
                    دعم نفسي
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('legal')}
                    className={`flex-1 py-2 rounded-xl border font-bold cursor-pointer transition-colors ${type === 'legal' ? 'border-[#1565C0] bg-blue-50 text-[#1565C0]' : 'border-slate-200 hover:bg-slate-50'}`}
                  >
                    استشارة قانونية
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">تاريخ الموعد:</label>
                <input
                  type="date"
                  value={date}
                  min="2026-01-01"
                  max="2027-12-31"
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#1565C0]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">من:</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#1565C0]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">إلى:</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#1565C0]"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-[#1565C0] text-white font-bold rounded-xl text-xs hover:bg-blue-700 transition-colors cursor-pointer shadow-xs"
              >
                تأكيد حجز الموعد
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentsView;
