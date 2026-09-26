import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { CaseFile } from '../types';
import { Building2, Users, MessageSquare, CheckCircle2, AlertCircle, FileText, PlusCircle } from 'lucide-react';

interface CenterAssociationPortalProps {
  onOpenChat: (convId: number) => void;
}

export const CenterAssociationPortal: React.FC<CenterAssociationPortalProps> = ({ onOpenChat }) => {
  const { user } = useAuth();
  const isCenter = user?.role_slug === 'treatment_center';
  const [cases, setCases] = useState<CaseFile[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<number | null>(null);
  const [caseDetails, setCaseDetails] = useState<any>(null);

  // Form
  const [admissionDate, setAdmissionDate] = useState(new Date().toISOString().split('T')[0]);
  const [dischargeDate, setDischargeDate] = useState('');
  const [detoxStatus, setDetoxStatus] = useState<'ongoing' | 'completed' | 'relapsed'>('ongoing');
  const [weeklyReport, setWeeklyReport] = useState('');
  const [socialNotes, setSocialNotes] = useState('');
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchCases = async () => {
    try {
      const res = await api.getCases();
      setCases(res.data || []);
      if (res.data?.length > 0 && !selectedCaseId) {
        setSelectedCaseId(res.data[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchCases();
  }, []);

  useEffect(() => {
    if (selectedCaseId) {
      api.getCaseById(selectedCaseId)
        .then(res => setCaseDetails(res.data))
        .catch(err => console.error(err));
    }
  }, [selectedCaseId]);

  const handleSubmitFollowup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCaseId) return;
    setStatusMsg(null);
    try {
      await api.addCenterFollowup({
        case_file_id: selectedCaseId,
        admission_date: admissionDate,
        discharge_date: dischargeDate || undefined,
        detox_status: detoxStatus,
        weekly_report: weeklyReport,
        social_notes: socialNotes
      });
      setStatusMsg({ type: 'success', text: 'تم تسجيل تقرير المتابعة الاستشفائية والاجتماعية بنجاح.' });
      setWeeklyReport('');
      setSocialNotes('');
      const res = await api.getCaseById(selectedCaseId);
      setCaseDetails(res.data);
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'فشل إرسال التقرير' });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-teal-700 font-bold text-xs">
            {isCenter ? <Building2 className="w-4 h-4" /> : <Users className="w-4 h-4" />}
            <span>{isCenter ? 'بوابة مركز علاج وتأهيل الإدمان' : 'بوابة الجمعية والمرافقة الاجتماعية'}</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 mt-1">الحالات المحالة للمتابعة الميدانية ({cases.length})</h1>
        </div>
      </div>

      {statusMsg && (
        <div className={`p-4 rounded-xl text-xs font-bold flex items-center gap-2 ${statusMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{statusMsg.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cases List */}
        <div className="lg:col-span-1 space-y-3">
          <div className="text-xs font-bold text-slate-500 uppercase px-1">الملفات المسندة:</div>
          {cases.map(c => (
            <div
              key={c.id}
              onClick={() => setSelectedCaseId(c.id)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2 ${selectedCaseId === c.id ? 'bg-teal-50/50 border-teal-500 shadow-xs' : 'bg-white border-slate-200 hover:border-slate-300'}`}
            >
              <div className="flex items-center justify-between">
                <span className="font-sans font-black text-xs text-slate-900">{c.number_case}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
                  {c.status}
                </span>
              </div>
              <div className="text-xs font-bold text-slate-800">المريض: {c.creator_first_name} {c.creator_last_name}</div>
              <div className="text-[11px] text-slate-500 line-clamp-1">{c.description}</div>
            </div>
          ))}
        </div>

        {/* Workspace */}
        <div className="lg:col-span-2 space-y-6">
          {!caseDetails ? (
            <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center text-xs text-slate-400">
              اختر ملف حالة من القائمة لإدخال تقارير الإقامة والاستشفاء
            </div>
          ) : (
            <div className="space-y-6">
              {/* Header */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-xs text-slate-400 font-bold">ملف إقامة ومتابعة رقم:</span>
                    <h2 className="text-lg font-black text-slate-900 font-sans">{caseDetails.case.number_case}</h2>
                  </div>

                  {caseDetails.conversation_id && (
                    <button
                      onClick={() => onOpenChat(caseDetails.conversation_id)}
                      className="px-3.5 py-1.5 bg-blue-50 text-[#1565C0] hover:bg-blue-100 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>المحادثة الآمنة مع الأخصائي والأسرة</span>
                    </button>
                  )}
                </div>

                <div className="text-xs text-slate-700 bg-slate-50 p-3.5 rounded-xl">
                  <span className="font-bold block mb-1">وصف الحالة وتاريخ الإحالة:</span>
                  {caseDetails.case.description}
                </div>
              </div>

              {/* Form to submit Follow-up / Inpatient Report */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
                <h3 className="text-sm font-bold text-slate-900">
                  {isCenter ? 'تسجيل تقرير إزالة السموم والمتابعة السريرية (Detox)' : 'تسجيل تقرير المتابعة الاجتماعية والإدماج'}
                </h3>
                <form onSubmit={handleSubmitFollowup} className="space-y-4 text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">تاريخ الدخول / بدء المتابعة:</label>
                      <input
                        type="date"
                        value={admissionDate}
                        onChange={(e) => setAdmissionDate(e.target.value)}
                        className="w-full p-2.5 border border-slate-300 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">حالة التعافي / الديتوكس:</label>
                      <select
                        value={detoxStatus}
                        onChange={(e: any) => setDetoxStatus(e.target.value)}
                        className="w-full p-2.5 border border-slate-300 rounded-xl font-bold"
                      >
                        <option value="ongoing">قيد الإقامة والعلاج (Ongoing)</option>
                        <option value="completed">اكتمل برنامج الديتوكس بنجاح (Completed)</option>
                        <option value="relapsed">انتكاس أثناء العلاج (Relapsed)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">التقرير الدوري الأسبوعي:</label>
                    <textarea
                      rows={4}
                      required
                      value={weeklyReport}
                      onChange={(e) => setWeeklyReport(e.target.value)}
                      placeholder="استقرار العلامات الحيوية، النوم المنتظم، الاستجابة للعلاج الطبي والدوائي، المشاركة في الورشات..."
                      className="w-full p-3 border border-slate-300 rounded-xl leading-relaxed outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">ملاحظات الدمج الاجتماعي والأسري:</label>
                    <textarea
                      rows={2}
                      value={socialNotes}
                      onChange={(e) => setSocialNotes(e.target.value)}
                      placeholder="استعداد الأسرة للزيارات، التنسيق للتدريب المهني بعد الخروج..."
                      className="w-full p-3 border border-slate-300 rounded-xl leading-relaxed outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-xs"
                  >
                    حفظ وتوثيق التقرير
                  </button>
                </form>
              </div>

              {/* Past follow-ups list */}
              {caseDetails.center_followups.length > 0 && (
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-3">
                  <h4 className="text-xs font-bold text-slate-700">تقارير الإقامة السابقة ({caseDetails.center_followups.length}):</h4>
                  <div className="space-y-3">
                    {caseDetails.center_followups.map((cf: any) => (
                      <div key={cf.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-2">
                        <div className="flex justify-between font-bold text-slate-800">
                          <span>مركز: {cf.center_name || '—'}</span>
                          <span>الحالة: {cf.detox_status}</span>
                        </div>
                        <p className="text-slate-600 leading-relaxed font-medium">{cf.weekly_report}</p>
                        {cf.social_notes && (
                          <div className="text-[11px] text-teal-800 pt-1 border-t border-slate-200">
                            <span className="font-bold">ملاحظات اجتماعية:</span> {cf.social_notes}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
