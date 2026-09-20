import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { CaseFile } from '../types';
import { 
  Heart, 
  ClipboardCheck, 
  Calendar, 
  MessageSquare, 
  Clock, 
  Activity, 
  FileCheck2, 
  PlusCircle, 
  AlertCircle,
  CheckCircle2
} from 'lucide-react';

interface PsychologistPortalProps {
  onOpenChat: (convId: number) => void;
  onOpenBookAppointment: (caseId: number, specId: number) => void;
}

export const PsychologistPortal: React.FC<PsychologistPortalProps> = ({ onOpenChat, onOpenBookAppointment }) => {
  const [cases, setCases] = useState<CaseFile[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<number | null>(null);
  const [caseDetails, setCaseDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'assess' | 'plan' | 'session' | 'progress' | 'close'>('assess');

  // Form states
  const [severity, setSeverity] = useState<'Mild' | 'Moderate' | 'Severe' | 'Extreme'>('Moderate');
  const [recommendation, setRecommendation] = useState('');
  const [mentalHealthNotes, setMentalHealthNotes] = useState('');

  const [planGoal, setPlanGoal] = useState('');
  const [planStrategy, setPlanStrategy] = useState('');
  const [planDuration, setPlanDuration] = useState('3 أشهر');
  const [planSessionsCount, setPlanSessionsCount] = useState(10);

  const [sessionNum, setSessionNum] = useState(1);
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split('T')[0]);
  const [sessionDuration, setSessionDuration] = useState(50);
  const [sessionNotes, setSessionNotes] = useState('');
  const [sessionNext, setSessionNext] = useState('');

  const [progressVal, setProgressVal] = useState<number>(25);
  const [progressNotes, setProgressNotes] = useState('');

  const [finalEval, setFinalEval] = useState('');

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
        .then(res => {
          setCaseDetails(res.data);
          if (res.data?.therapy_sessions) {
            setSessionNum(res.data.therapy_sessions.length + 1);
          }
        })
        .catch(err => console.error(err));
    }
  }, [selectedCaseId]);

  const handleSaveAssessment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCaseId) return;
    setStatusMsg(null);
    try {
      await api.addAssessment({
        case_file_id: selectedCaseId,
        severity,
        recommendation,
        mental_health_notes: mentalHealthNotes
      });
      setStatusMsg({ type: 'success', text: 'تم حفظ التقييم السريري وتحديث حالة الملف بنجاح.' });
      const res = await api.getCaseById(selectedCaseId);
      setCaseDetails(res.data);
      setRecommendation('');
      setMentalHealthNotes('');
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'فشل حفظ التقييم' });
    }
  };

  const handleSaveTreatmentPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCaseId) return;
    setStatusMsg(null);
    try {
      await api.createTreatmentPlan({
        case_file_id: selectedCaseId,
        goal: planGoal,
        strategy: planStrategy,
        duration: planDuration,
        sessions_count: planSessionsCount
      });
      setStatusMsg({ type: 'success', text: 'تم اعتماد الخطة العلاجية بنجاح.' });
      const res = await api.getCaseById(selectedCaseId);
      setCaseDetails(res.data);
      setPlanGoal('');
      setPlanStrategy('');
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'فشل إنشاء الخطة العلاجية' });
    }
  };

  const handleLogSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCaseId) return;
    setStatusMsg(null);
    try {
      await api.logTherapySession({
        case_file_id: selectedCaseId,
        session_number: sessionNum,
        date: sessionDate,
        duration: sessionDuration,
        notes: sessionNotes,
        session_next: sessionNext
      });
      setStatusMsg({ type: 'success', text: `تم تسجيل الجلسة رقم ${sessionNum} بنجاح.` });
      const res = await api.getCaseById(selectedCaseId);
      setCaseDetails(res.data);
      setSessionNotes('');
      setSessionNum(prev => prev + 1);
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'فشل تسجيل الجلسة' });
    }
  };

  const handleUpdateProgress = async () => {
    if (!selectedCaseId) return;
    setStatusMsg(null);
    try {
      await api.updateCaseProgress({
        case_file_id: selectedCaseId,
        progress_percentage: progressVal,
        notes: progressNotes
      });
      setStatusMsg({ type: 'success', text: `تم تحديث مؤشر التعافي إلى ${progressVal}%.` });
      fetchCases();
      const res = await api.getCaseById(selectedCaseId);
      setCaseDetails(res.data);
      setProgressNotes('');
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'فشل تحديث التقدم' });
    }
  };

  const handleCloseCase = async () => {
    if (!selectedCaseId || !caseDetails?.treatment_plans?.[0]) {
      setStatusMsg({ type: 'error', text: 'يجب أن تحتوي الحالة على خطة علاجية أولاً.' });
      return;
    }
    setStatusMsg(null);
    try {
      // 1. Submit final evaluation
      await api.updateFinalEvaluation(caseDetails.treatment_plans[0].id, finalEval);
      // 2. Change status to COMPLETED
      await api.updateCaseStatus(selectedCaseId, 'COMPLETED', 'تم إغلاق الملف بعد اكتمال الخطة والتقرير الختامي المعتمد');
      setStatusMsg({ type: 'success', text: 'تم إغلاق الملف بنجاح وفق المعايير السريرية المعتمدة.' });
      fetchCases();
      const res = await api.getCaseById(selectedCaseId);
      setCaseDetails(res.data);
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'فشل إغلاق الحالة' });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-blue-700 font-bold text-xs">
            <Heart className="w-4 h-4" />
            <span>بوابة الأخصائي النفسي العيادي — إدارة الحالات والبروتوكولات السريرية</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 mt-1">الحالات الموكلة إليك ({cases.length})</h1>
        </div>
      </div>

      {statusMsg && (
        <div className={`p-4 rounded-xl text-xs font-bold flex items-center gap-2 ${statusMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
          {statusMsg.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
          <span>{statusMsg.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cases Sidebar */}
        <div className="lg:col-span-1 space-y-3">
          <div className="text-xs font-bold text-slate-500 uppercase px-1">قائمة الملفات:</div>
          {cases.map(c => (
            <div
              key={c.id}
              onClick={() => setSelectedCaseId(c.id)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2 ${selectedCaseId === c.id ? 'bg-blue-50/60 border-[#1565C0] shadow-xs' : 'bg-white border-slate-200 hover:border-slate-300'}`}
            >
              <div className="flex items-center justify-between">
                <span className="font-sans font-black text-xs text-slate-900">{c.number_case}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${c.priority === 'Critical' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
                  {c.priority}
                </span>
              </div>
              <div className="text-xs font-bold text-slate-800">
                العميل: {c.creator_first_name} {c.creator_last_name}
              </div>
              <div className="text-[11px] text-slate-500 line-clamp-1">{c.description}</div>
              <div className="flex justify-between items-center text-[10px] text-slate-400 pt-1">
                <span>الحالة: {c.status}</span>
                <span>التقدم: {c.latest_progress || 0}%</span>
              </div>
            </div>
          ))}
        </div>

        {/* Clinical Workspace */}
        <div className="lg:col-span-2 space-y-6">
          {!caseDetails ? (
            <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center text-xs text-slate-400">
              اختر ملف حالة من القائمة لمباشرة العمل السريري
            </div>
          ) : (
            <>
              {/* Summary Card */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-xs text-slate-400 font-bold">ملف المريض:</span>
                    <h2 className="text-lg font-black text-slate-900 font-sans">{caseDetails.case.number_case}</h2>
                  </div>

                  <div className="flex items-center gap-2">
                    {caseDetails.conversation_id && (
                      <button
                        onClick={() => onOpenChat(caseDetails.conversation_id)}
                        className="px-3.5 py-1.5 bg-blue-50 text-[#1565C0] hover:bg-blue-100 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span>محادثة الحالة</span>
                      </button>
                    )}
                    <button
                      onClick={() => onOpenBookAppointment(caseDetails.case.id, caseDetails.case.assigned_psychologist_id)}
                      className="px-3.5 py-1.5 bg-emerald-50 text-[#2E7D32] hover:bg-emerald-100 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Calendar className="w-4 h-4" />
                      <span>جدولة موعد</span>
                    </button>
                  </div>
                </div>

                <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl">
                  <span className="font-bold block mb-1">وصف الحالة المدخل من المريض / الأسرة:</span>
                  {caseDetails.case.description}
                </div>
              </div>

              {/* Sub-Tabs */}
              <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-bold">
                <button
                  onClick={() => setActiveTab('assess')}
                  className={`flex-1 py-2 rounded-lg transition-all ${activeTab === 'assess' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-500'}`}
                >
                  1. التقييم السريري
                </button>
                <button
                  onClick={() => setActiveTab('plan')}
                  className={`flex-1 py-2 rounded-lg transition-all ${activeTab === 'plan' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-500'}`}
                >
                  2. الخطة العلاجية
                </button>
                <button
                  onClick={() => setActiveTab('session')}
                  className={`flex-1 py-2 rounded-lg transition-all ${activeTab === 'session' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-500'}`}
                >
                  3. تسجيل جلسة
                </button>
                <button
                  onClick={() => setActiveTab('progress')}
                  className={`flex-1 py-2 rounded-lg transition-all ${activeTab === 'progress' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-500'}`}
                >
                  4. مؤشر التعافي
                </button>
                <button
                  onClick={() => setActiveTab('close')}
                  className={`flex-1 py-2 rounded-lg transition-all ${activeTab === 'close' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-500'}`}
                >
                  5. التقرير الختامي والإغلاق
                </button>
              </div>

              {/* Tab 1: Assessment */}
              {activeTab === 'assess' && (
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
                  <h3 className="text-sm font-bold text-slate-900">التقييم التشخيصي السريري الأولي</h3>
                  <form onSubmit={handleSaveAssessment} className="space-y-4 text-xs">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">مستوى الشدة والاعتماد السلوكي:</label>
                      <select
                        value={severity}
                        onChange={(e: any) => setSeverity(e.target.value)}
                        className="w-full p-2.5 border border-slate-300 rounded-xl"
                      >
                        <option value="Mild">خفيف (Mild) — في المراحل الأولى</option>
                        <option value="Moderate">معتدل (Moderate) — وجود اعتماد نفسي متكرر</option>
                        <option value="Severe">شديد (Severe) — أعراض انسحابية وتأثير على الوظائف الحيوية</option>
                        <option value="Extreme">حرج جداً (Extreme) — خطر تدهور فوري</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">التوصية العلاجية ومسار الرعاية:</label>
                      <textarea
                        rows={3}
                        required
                        value={recommendation}
                        onChange={(e) => setRecommendation(e.target.value)}
                        placeholder="يوصى ببدء علاج سلوكي معرفي CBT بمعدل جلستين أسبوعياً مع متابعة طبية..."
                        className="w-full p-3 border border-slate-300 rounded-xl outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">ملاحظات نفسية خاصة (سرية ولا تظهر لغير الأطباء):</label>
                      <textarea
                        rows={2}
                        value={mentalHealthNotes}
                        onChange={(e) => setMentalHealthNotes(e.target.value)}
                        placeholder="ملاحظات حول التحالف العلاجي وتاريخ الصدمات..."
                        className="w-full p-3 border border-slate-300 rounded-xl outline-none"
                      />
                    </div>

                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-[#1565C0] text-white font-bold rounded-xl shadow-xs"
                    >
                      حفظ التقييم الأولي
                    </button>
                  </form>
                </div>
              )}

              {/* Tab 2: Treatment Plan */}
              {activeTab === 'plan' && (
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
                  <h3 className="text-sm font-bold text-slate-900">بناء الخطة العلاجية المخصصة</h3>
                  <form onSubmit={handleSaveTreatmentPlan} className="space-y-4 text-xs">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">الهدف العلاجي الرئيسي:</label>
                      <input
                        type="text"
                        required
                        value={planGoal}
                        onChange={(e) => setPlanGoal(e.target.value)}
                        placeholder="الوصول إلى الامتناع التام ومنع الانتكاسة واستعادة التوازن السلوكي"
                        className="w-full p-2.5 border border-slate-300 rounded-xl"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">استراتيجية التدخل والعلاج:</label>
                      <textarea
                        rows={3}
                        required
                        value={planStrategy}
                        onChange={(e) => setPlanStrategy(e.target.value)}
                        placeholder="علاج معرفي سلوكي (CBT)، إعادة الهيكلة المعرفية، مهارات حل المشكلات، تدريب الأسرة..."
                        className="w-full p-3 border border-slate-300 rounded-xl"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">المدة التقديرية:</label>
                        <input
                          type="text"
                          value={planDuration}
                          onChange={(e) => setPlanDuration(e.target.value)}
                          className="w-full p-2.5 border border-slate-300 rounded-xl"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">عدد الجلسات المخططة:</label>
                        <input
                          type="number"
                          value={planSessionsCount}
                          onChange={(e) => setPlanSessionsCount(Number(e.target.value))}
                          className="w-full p-2.5 border border-slate-300 rounded-xl"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-[#1565C0] text-white font-bold rounded-xl shadow-xs"
                    >
                      اعتماد الخطة العلاجية
                    </button>
                  </form>
                </div>
              )}

              {/* Tab 3: Session Logging */}
              {activeTab === 'session' && (
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
                  <h3 className="text-sm font-bold text-slate-900">تسجيل وتوثيق جلسة نفسية عيادية</h3>
                  <form onSubmit={handleLogSession} className="space-y-4 text-xs">
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">رقم الجلسة:</label>
                        <input
                          type="number"
                          value={sessionNum}
                          onChange={(e) => setSessionNum(Number(e.target.value))}
                          className="w-full p-2.5 border border-slate-300 rounded-xl"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">تاريخ الانعقاد:</label>
                        <input
                          type="date"
                          value={sessionDate}
                          onChange={(e) => setSessionDate(e.target.value)}
                          className="w-full p-2.5 border border-slate-300 rounded-xl"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">المدة (بالدقائق):</label>
                        <input
                          type="number"
                          value={sessionDuration}
                          onChange={(e) => setSessionDuration(Number(e.target.value))}
                          className="w-full p-2.5 border border-slate-300 rounded-xl"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">الملاحظات السريرية وما تم إنجازه في الجلسة:</label>
                      <textarea
                        rows={4}
                        required
                        value={sessionNotes}
                        onChange={(e) => setSessionNotes(e.target.value)}
                        placeholder="تمت مناقشة المحفزات، تفكيك نوبات الرغبة الملحة، استجابة المريض للتمارين المنزلية..."
                        className="w-full p-3 border border-slate-300 rounded-xl"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">الموعد المقترح للجلسة القادمة:</label>
                      <input
                        type="date"
                        value={sessionNext}
                        onChange={(e) => setSessionNext(e.target.value)}
                        className="w-full p-2.5 border border-slate-300 rounded-xl"
                      />
                    </div>

                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-[#1565C0] text-white font-bold rounded-xl shadow-xs"
                    >
                      تسجيل وحفظ الجلسة
                    </button>
                  </form>
                </div>
              )}

              {/* Tab 4: Progress Indicator */}
              {activeTab === 'progress' && (
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
                  <h3 className="text-sm font-bold text-slate-900">تحديث مؤشر التعافي والتقدم السريري</h3>
                  <div className="space-y-4 text-xs">
                    <div>
                      <label className="block font-bold text-slate-700 mb-2">اختر النسبة المعيارية:</label>
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                        {[0, 10, 25, 50, 75, 100].map((pct) => (
                          <button
                            key={pct}
                            type="button"
                            onClick={() => setProgressVal(pct)}
                            className={`py-3 rounded-xl border font-bold text-sm transition-all ${progressVal === pct ? 'bg-[#2E7D32] text-white border-[#2E7D32]' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'}`}
                          >
                            {pct}%
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">ملاحظات التحديث المرحلي:</label>
                      <textarea
                        rows={3}
                        value={progressNotes}
                        onChange={(e) => setProgressNotes(e.target.value)}
                        placeholder="اجتياز مرحلة الانسحاب بنجاح، تحسن ملحوظ في التواصل الأسري..."
                        className="w-full p-3 border border-slate-300 rounded-xl"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleUpdateProgress}
                      className="px-5 py-2.5 bg-[#2E7D32] hover:bg-green-700 text-white font-bold rounded-xl shadow-xs"
                    >
                      تحديث نسبة التعافي
                    </button>
                  </div>
                </div>
              )}

              {/* Tab 5: Final Evaluation & Case Close */}
              {activeTab === 'close' && (
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-slate-900">التقرير النهائي وإغلاق ملف الحالة</h3>
                    <p className="text-xs text-slate-500">
                      قاعدة المنصة الإلزامية: لا يمكن نقل الحالة إلى "COMPLETED" إلا بعد إدراج تقرير ختامي شامل يوضح نتائج البروتوكول العلاجي.
                    </p>
                  </div>

                  <div className="space-y-3 text-xs">
                    <textarea
                      rows={5}
                      value={finalEval}
                      onChange={(e) => setFinalEval(e.target.value)}
                      placeholder="اكتب التقرير الختامي: مدى استجابة الحالة، المهارات المكتسبة لمنع الانتكاسة، التوصية بالمتابعة الدورية اللاحقة..."
                      className="w-full p-3.5 border border-slate-300 rounded-xl leading-relaxed"
                    />

                    <div className="flex justify-end">
                      <button
                        type="button"
                        disabled={finalEval.trim().length < 20}
                        onClick={handleCloseCase}
                        className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold rounded-xl shadow-xs flex items-center gap-2"
                      >
                        <FileCheck2 className="w-4 h-4" />
                        <span>اعتماد التقرير النهائي وإغلاق الحالة</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
