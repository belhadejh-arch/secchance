import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Appointment, CaseFile } from '../types';
import { useAuth } from '../context/AuthContext';
import { Calendar, Clock, PlusCircle, CheckCircle2, XCircle, AlertCircle, User } from 'lucide-react';

export const AppointmentsView: React.FC = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [cases, setCases] = useState<CaseFile[]>([]);
  const [specialists, setSpecialists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New Appointment Modal
  const [showModal, setShowModal] = useState(false);
  const [caseId, setCaseId] = useState<number | ''>('');
  const [specialistId, setSpecialistId] = useState<number | ''>('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('11:00');
  const [type, setType] = useState<'psychological' | 'legal'>('psychological');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const res = await api.getAppointments();
      setAppointments(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
    api.getCases().then(res => setCases(res.data || [])).catch(() => {});
    api.getSpecialistsList().then(res => setSpecialists(res.data || [])).catch(() => {});
  }, []);

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caseId || !specialistId) {
      setError('يرجى اختيار ملف الحالة والمختص');
      return;
    }
    setError(null);
    try {
      await api.createAppointment({
        case_file_id: Number(caseId),
        specialist_id: Number(specialistId),
        appointment_date: date,
        start_time: startTime,
        end_time: endTime,
        type,
        notes
      });
      setShowModal(false);
      fetchAppointments();
    } catch (err: any) {
      setError(err.message || 'فشل حجز الموعد. قد يوجد تضارب في المواعيد.');
    }
  };

  const handleUpdateStatus = async (id: number, status: 'confirmed' | 'completed' | 'cancelled') => {
    try {
      await api.updateAppointment(id, { status });
      fetchAppointments();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[#1565C0] font-bold text-xs">
            <Calendar className="w-4 h-4" />
            <span>نظام المواعيد والاستشارات السريرية والقانونية</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 mt-1">جدول المواعيد ({appointments.length})</h1>
        </div>

        <button
          onClick={() => { setShowModal(true); setError(null); }}
          className="px-5 py-2.5 bg-[#1565C0] hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-xs cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>حجز موعد جديد</span>
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400 text-xs">جاري تحميل جدول المواعيد...</div>
      ) : appointments.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center space-y-3">
          <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="text-xs text-slate-500 font-medium">لا توجد مواعيد مجدولة حالياً.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {appointments.map((a: any) => (
            <div key={a.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-sans font-bold text-xs text-[#1565C0]">
                  {a.number_case ? `الحالة #${a.number_case}` : `الموعد #${a.id}`}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${a.status === 'confirmed' ? 'bg-emerald-100 text-emerald-800' : a.status === 'cancelled' ? 'bg-red-100 text-red-800' : a.status === 'completed' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'}`}>
                  {a.status === 'pending' ? 'قيد الانتظار' : a.status === 'confirmed' ? 'مؤكد' : a.status === 'completed' ? 'مكتمل' : 'ملغى'}
                </span>
              </div>

              <div className="space-y-1 text-xs">
                <div className="font-bold text-slate-800">
                  {a.type === 'psychological' ? 'جلسة دعم نفسي عيادي' : 'استشارة قانونية وتكييف وضع'}
                </div>
                <div className="text-slate-600 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>المختص: د. {a.specialist_first_name} {a.specialist_last_name}</span>
                </div>
                <div className="text-slate-500 flex items-center gap-1.5 pt-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{a.appointment_date} من {a.start_time} إلى {a.end_time}</span>
                </div>
                {a.notes && <p className="text-[11px] text-slate-400 pt-1">ملاحظة: {a.notes}</p>}
              </div>

              {/* Status Actions (for specialist / admin) */}
              {(user?.role_slug === 'admin' || user?.role_slug === 'psychologist' || user?.role_slug === 'lawyer') && a.status === 'pending' && (
                <div className="flex gap-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => handleUpdateStatus(a.id, 'confirmed')}
                    className="flex-1 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-bold transition-colors"
                  >
                    تأكيد الموعد
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(a.id, 'cancelled')}
                    className="flex-1 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg text-xs font-bold transition-colors"
                  >
                    إلغاء
                  </button>
                </div>
              )}

              {a.status === 'confirmed' && (user?.role_slug === 'psychologist' || user?.role_slug === 'lawyer') && (
                <button
                  onClick={() => handleUpdateStatus(a.id, 'completed')}
                  className="w-full py-1.5 bg-blue-50 text-[#1565C0] hover:bg-blue-100 rounded-lg text-xs font-bold transition-colors"
                >
                  تم إنجاز الجلسة بنجاح
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Book Appointment Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200 text-right">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
              <h3 className="font-bold text-base text-slate-900">حجز موعد استشارة جديدة</h3>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleCreateAppointment} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">اختر ملف الحالة:</label>
                <select
                  required
                  value={caseId}
                  onChange={(e) => setCaseId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full p-2.5 border border-slate-300 rounded-xl font-bold"
                >
                  <option value="">-- اختر الحالة المعنية --</option>
                  {cases.map(c => (
                    <option key={c.id} value={c.id}>{c.number_case} - {c.addiction_type_name || 'حالة مسجلة'}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">المختص المعالج أو المستشار:</label>
                <select
                  required
                  value={specialistId}
                  onChange={(e) => setSpecialistId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full p-2.5 border border-slate-300 rounded-xl font-bold"
                >
                  <option value="">-- اختر المختص المطلوب --</option>
                  {specialists.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.role_slug === 'psychologist' ? 'د.' : 'أ.'} {s.first_name} {s.last_name} ({s.role_slug === 'psychologist' ? 'أخصائي نفسي' : 'محامٍ'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">نوع الموعد:</label>
                  <select
                    value={type}
                    onChange={(e: any) => setType(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl font-bold"
                  >
                    <option value="psychological">دعم نفسي عيادي</option>
                    <option value="legal">استشارة وتكييف قانوني</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">تاريخ الموعد:</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">وقت البدء:</label>
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">وقت الانتهاء:</label>
                  <input
                    type="time"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">ملاحظات إضافية:</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="ملاحظات تمهيدية للموعد..."
                  className="w-full p-2.5 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#1565C0] hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs"
                >
                  تأكيد الحجز
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
