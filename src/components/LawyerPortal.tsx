import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { CaseFile } from '../types';
import { Scale, MessageSquare, Calendar, FileText, CheckCircle2, ShieldAlert } from 'lucide-react';

interface LawyerPortalProps {
  onOpenChat: (convId: number) => void;
  onOpenBookAppointment: (caseId: number, specId: number) => void;
}

export const LawyerPortal: React.FC<LawyerPortalProps> = ({ onOpenChat, onOpenBookAppointment }) => {
  const [cases, setCases] = useState<CaseFile[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<number | null>(null);
  const [caseDetails, setCaseDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [legalOpinion, setLegalOpinion] = useState('');
  const [recommendation, setRecommendation] = useState('');
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchCases = async () => {
    setLoading(true);
    try {
      const res = await api.getCases();
      setCases(res.data || []);
      if (res.data?.length > 0 && !selectedCaseId) {
        setSelectedCaseId(res.data[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
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

  const handleSubmitOpinion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCaseId) return;
    setStatusMsg(null);
    try {
      await api.submitLegalOpinion({
        case_file_id: selectedCaseId,
        legal_opinion: legalOpinion,
        recommendation,
        status: 'COMPLETED'
      });
      setStatusMsg({ type: 'success', text: 'تم إصدار الرأي والتكييف القانوني وإرساله للأسرة بنجاح.' });
      setLegalOpinion('');
      setRecommendation('');
      const res = await api.getCaseById(selectedCaseId);
      setCaseDetails(res.data);
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'فشل إرسال الاستشارة' });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-amber-700 font-bold text-xs">
            <Scale className="w-4 h-4" />
            <span>بوابة المستشار القانوني والمحامي — الحماية، البدائل القانونية، والتكييف القضائي</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 mt-1">القضايا والاستشارات المحالة ({cases.length})</h1>
        </div>
      </div>

      {statusMsg && (
        <div className={`p-4 rounded-xl text-xs font-bold flex items-center gap-2 ${statusMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Isolation Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5 flex items-center gap-3 text-xs text-blue-900">
        <ShieldAlert className="w-5 h-5 text-blue-600 shrink-0" />
        <span>
          نظام العزل والسرية: يتم حجب الملاحظات الطبية النفسية العيادية الدقيقة احتراماً لقانون أخلاقيات مهنة الطب وسرية المريض. تتاح لك الوثائق القانونية والبيانات اللازمة للتكييف القانوني فقط.
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cases List */}
        <div className="lg:col-span-1 space-y-3">
          <div className="text-xs font-bold text-slate-500 uppercase px-1">الملفات المحالة للاستشارة:</div>
          {cases.map(c => (
            <div
              key={c.id}
              onClick={() => setSelectedCaseId(c.id)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2 ${selectedCaseId === c.id ? 'bg-amber-50/50 border-amber-400 shadow-xs' : 'bg-white border-slate-200 hover:border-slate-300'}`}
            >
              <div className="flex items-center justify-between">
                <span className="font-sans font-black text-xs text-slate-900">{c.number_case}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                  {c.priority}
                </span>
              </div>
              <div className="text-xs font-bold text-slate-800">
                مقدم الطلب: {c.creator_first_name} {c.creator_last_name}
              </div>
              <div className="text-[11px] text-slate-500 line-clamp-2">{c.description}</div>
            </div>
          ))}
        </div>

        {/* Legal Opinion Workspace */}
        <div className="lg:col-span-2 space-y-6">
          {!caseDetails ? (
            <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center text-xs text-slate-400">
              اختر ملفاً من القائمة الجانبية لدراسة الوضع القانوني
            </div>
          ) : (
            <div className="space-y-6">
              {/* Header */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-xs text-slate-400 font-bold">ملف رقم:</span>
                    <h2 className="text-lg font-black text-slate-900 font-sans">{caseDetails.case.number_case}</h2>
                  </div>

                  <div className="flex items-center gap-2">
                    {caseDetails.conversation_id && (
                      <button
                        onClick={() => onOpenChat(caseDetails.conversation_id)}
                        className="px-3.5 py-1.5 bg-blue-50 text-[#1565C0] hover:bg-blue-100 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span>محادثة الأسرة</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="text-xs text-slate-700 bg-slate-50 p-3.5 rounded-xl space-y-1">
                  <span className="font-bold block">عرض الوقائع وشكوى الأسرة:</span>
                  <p className="leading-relaxed">{caseDetails.case.description}</p>
                </div>
              </div>

              {/* Form to submit opinion */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
                <h3 className="text-sm font-bold text-slate-900">إصدار الرأي والتكييف القانوني</h3>
                <form onSubmit={handleSubmitOpinion} className="space-y-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      الرأي القانوني المعتمد وتكييف الوضع وفق القانون والتشريعات السارية:
                    </label>
                    <textarea
                      rows={4}
                      required
                      value={legalOpinion}
                      onChange={(e) => setLegalOpinion(e.target.value)}
                      placeholder="مثال: استناداً للمادة المتعلقة بتدابير العلاج الإجباري والتطوعي، فإن مبادرة الشخص أو وليه بطلب العلاج قبل تحريك الدعوى العمومية تعفيه من المتابعة الجزائية وفق الضوابط..."
                      className="w-full p-3 border border-slate-300 rounded-xl leading-relaxed outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      التوصيات والإجراءات القانونية العاجلة الموجهة للأسرة:
                    </label>
                    <textarea
                      rows={3}
                      value={recommendation}
                      onChange={(e) => setRecommendation(e.target.value)}
                      placeholder="1. استخراج شهادة متابعة طبية من مركز الاستشفاء. 2. إيداع طلب الرعاية البديلة..."
                      className="w-full p-3 border border-slate-300 rounded-xl leading-relaxed outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-xs"
                  >
                    إصدار وإرسال الرأي القانوني
                  </button>
                </form>
              </div>

              {/* Past Legal Consultations for this case */}
              {caseDetails.legal_consultations.length > 0 && (
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-3">
                  <h4 className="text-xs font-bold text-slate-700">الاستشارات السابقة الصادرة في هذا الملف:</h4>
                  <div className="space-y-3">
                    {caseDetails.legal_consultations.map((lc: any) => (
                      <div key={lc.id} className="p-4 bg-amber-50/50 border border-amber-200 rounded-xl text-xs space-y-2">
                        <div className="flex justify-between font-bold text-amber-900">
                          <span>بواسطة: أ. {lc.lawyer_first_name} {lc.lawyer_last_name}</span>
                          <span>{new Date(lc.created_at).toLocaleDateString('ar-DZ')}</span>
                        </div>
                        <p className="text-slate-700 leading-relaxed font-medium">{lc.legal_opinion}</p>
                        {lc.recommendation && (
                          <div className="text-slate-600 border-t border-amber-200/60 pt-1">
                            <span className="font-bold">التوصيات:</span> {lc.recommendation}
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
