import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { CaseFile, AddictionType, PriorityLevel, Appointment } from '../types';
import { 
  PlusCircle, 
  Clock, 
  Calendar, 
  MessageSquare, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  Star, 
  ChevronLeft, 
  Upload, 
  ArrowRight,
  ShieldCheck,
  User,
  Heart
} from 'lucide-react';

interface FamilyPortalProps {
  onOpenChat: (convId: number) => void;
  onOpenBookAppointment: (caseId: number, specId: number) => void;
  prefillData?: { description: string; addiction_type_id: number; priority: string } | null;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  NEW: { label: 'طلب جديد قيد الاستقبال', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  UNDER_REVIEW: { label: 'قيد المراجعة والفرز', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  ASSIGNED: { label: 'تم إسناد المختص', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  FIRST_SESSION: { label: 'الجلسة الأولى / التقييم السريري', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  FOLLOW_UP: { label: 'متابعة الخطة العلاجية', color: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  REFERRED: { label: 'إحالة إلى مركز الاستشفاء / الجمعية', color: 'bg-teal-50 text-teal-700 border-teal-200' },
  COMPLETED: { label: 'اكتمل التعافي والبرنامج', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  ARCHIVED: { label: 'ملف مؤرشف', color: 'bg-slate-50 text-slate-700 border-slate-200' }
};

export const FamilyPortal: React.FC<FamilyPortalProps> = ({ onOpenChat, onOpenBookAppointment, prefillData }) => {
  const { user } = useAuth();
  const [cases, setCases] = useState<CaseFile[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<number | null>(null);
  const [caseDetails, setCaseDetails] = useState<any>(null);
  const [addictionTypes, setAddictionTypes] = useState<AddictionType[]>([]);
  const [loading, setLoading] = useState(true);

  // New Case Wizard states
  const [showWizard, setShowWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [addictionTypeId, setAddictionTypeId] = useState<number>(1);
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<PriorityLevel>('High');
  const [documentName, setDocumentName] = useState('');
  const [wizardSubmitting, setWizardSubmitting] = useState(false);
  const [wizardError, setWizardError] = useState<string | null>(null);

  // Rating state
  const [ratingVal, setRatingVal] = useState(5);
  const [ratingFeedback, setRatingFeedback] = useState('');
  const [showRatingModal, setShowRatingModal] = useState(false);

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
    api.getAddictionTypes().then(res => res.data && setAddictionTypes(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (prefillData) {
      setDescription(prefillData.description);
      setAddictionTypeId(prefillData.addiction_type_id);
      setPriority(prefillData.priority as PriorityLevel);
      setShowWizard(true);
    }
  }, [prefillData]);

  useEffect(() => {
    if (selectedCaseId) {
      api.getCaseById(selectedCaseId)
        .then(res => setCaseDetails(res.data))
        .catch(err => console.error(err));
    }
  }, [selectedCaseId]);

  const handleCreateCase = async () => {
    setWizardError(null);
    setWizardSubmitting(true);
    try {
      const docs = documentName ? [{ file_name: documentName, storage_path: '/uploads/case_docs/' + documentName }] : [];
      await api.createCase({
        addiction_type_id: addictionTypeId,
        description,
        priority,
        documents: docs
      });
      setShowWizard(false);
      setWizardStep(1);
      setDescription('');
      setDocumentName('');
      fetchCases();
    } catch (err: any) {
      setWizardError(err.message || 'فشل تسجيل الحالة');
    } finally {
      setWizardSubmitting(false);
    }
  };

  const handleRate = async () => {
    if (!selectedCaseId) return;
    try {
      await api.rateCase(selectedCaseId, ratingVal, ratingFeedback);
      setShowRatingModal(false);
      setRatingFeedback('');
      alert('شكراً لتقييمك وملاحظاتك!');
      if (selectedCaseId) {
        const res = await api.getCaseById(selectedCaseId);
        setCaseDetails(res.data);
      }
    } catch (err: any) {
      alert(err.message || 'حدث خطأ في إرسال التقييم');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Banner / Welcome */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[#1565C0] font-bold text-xs">
            <Heart className="w-4 h-4" />
            <span>بوابة الرعاية والتكفل الأسري والمستفيدين</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 mt-1">مرحباً بك، {user?.first_name}</h1>
          <p className="text-xs sm:text-sm text-slate-500">
            ملفاتك ومواعيدك ومحادثاتك مع الأخصائيين محمية بسرية تامة ومتابعة على مدار الساعة.
          </p>
        </div>

        <button
          onClick={() => { setShowWizard(true); setWizardStep(1); }}
          className="px-5 py-2.5 bg-[#1565C0] hover:bg-blue-700 text-white text-xs sm:text-sm font-bold rounded-xl flex items-center gap-2 shadow-xs cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>تقديم طلب مساعدة جديد</span>
        </button>
      </div>

      {/* Main Layout: Cases List Sidebar & Detail View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cases List */}
        <div className="lg:col-span-1 space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">ملفات الحالات المسجلة ({cases.length})</span>
          </div>

          {loading ? (
            <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center text-xs text-slate-400">
              جاري تحميل ملفاتك...
            </div>
          ) : cases.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-blue-50 text-[#1565C0] mx-auto flex items-center justify-center">
                <FileText className="w-6 h-6" />
              </div>
              <p className="text-xs text-slate-500 font-medium">ليس لديك أي ملفات حالات مسجلة بعد.</p>
              <button
                onClick={() => setShowWizard(true)}
                className="text-xs font-bold text-[#1565C0] underline"
              >
                افتح ملف حالة الآن
              </button>
            </div>
          ) : (
            cases.map(c => {
              const statusCfg = STATUS_LABELS[c.status] || { label: c.status, color: 'bg-slate-100 text-slate-700' };
              const isSelected = selectedCaseId === c.id;
              return (
                <div
                  key={c.id}
                  onClick={() => setSelectedCaseId(c.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2 ${isSelected ? 'bg-blue-50/50 border-[#1565C0] shadow-xs' : 'bg-white border-slate-200 hover:border-slate-300'}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-900 font-sans tracking-wide">{c.number_case}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusCfg.color}`}>
                      {statusCfg.label}
                    </span>
                  </div>

                  <div className="text-xs font-semibold text-slate-700">{c.addiction_type_name || 'حالة إدمان ومؤثرات'}</div>

                  {/* Progress Bar */}
                  <div className="space-y-1 pt-1">
                    <div className="flex justify-between text-[10px] font-semibold text-slate-500">
                      <span>نسبة التعافي الحالية</span>
                      <span>{c.latest_progress || 0}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-[#2E7D32] h-1.5 rounded-full transition-all duration-500"
                        style={{ width: `${c.latest_progress || 0}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> أولوية {c.priority}
                    </span>
                    <span>{new Date(c.created_at).toLocaleDateString('ar-DZ')}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Selected Case Detail */}
        <div className="lg:col-span-2">
          {!caseDetails ? (
            <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center text-slate-400 text-xs">
              حدد ملف حالة من القائمة الجانبية لعرض مسار الرعاية والتقارير
            </div>
          ) : (
            <div className="space-y-6">
              {/* Case Header Card */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <div className="text-xs text-slate-400 font-bold">ملف حالة رقم:</div>
                    <h2 className="text-xl font-black text-slate-900 font-sans">{caseDetails.case.number_case}</h2>
                  </div>

                  <div className="flex items-center gap-2">
                    {caseDetails.conversation_id && (
                      <button
                        onClick={() => onOpenChat(caseDetails.conversation_id)}
                        className="px-3.5 py-2 bg-blue-50 text-[#1565C0] hover:bg-blue-100 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span>المحادثة الآمنة</span>
                      </button>
                    )}

                    {caseDetails.case.assigned_psychologist_id && (
                      <button
                        onClick={() => onOpenBookAppointment(caseDetails.case.id, caseDetails.case.assigned_psychologist_id)}
                        className="px-3.5 py-2 bg-emerald-50 text-[#2E7D32] hover:bg-emerald-100 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Calendar className="w-4 h-4" />
                        <span>حجز موعد</span>
                      </button>
                    )}

                    <button
                      onClick={() => setShowRatingModal(true)}
                      className="px-3 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold flex items-center gap-1"
                    >
                      <Star className="w-3.5 h-3.5 text-amber-500" />
                      <span>تقييم الخدمة</span>
                    </button>
                  </div>
                </div>

                {/* Team Assigned */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                    <span className="text-slate-400 font-bold block">الأخصائي النفسي المعتمد:</span>
                    <span className="font-bold text-slate-900">
                      {caseDetails.case.psy_first_name ? `د. ${caseDetails.case.psy_first_name} ${caseDetails.case.psy_last_name}` : 'بانتظار التعيين'}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                    <span className="text-slate-400 font-bold block">المستشار القانوني:</span>
                    <span className="font-bold text-slate-900">
                      {caseDetails.case.lawyer_first_name ? `أ. ${caseDetails.case.lawyer_first_name} ${caseDetails.case.lawyer_last_name}` : 'لا يوجد استشارة مطلوبة'}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                    <span className="text-slate-400 font-bold block">مركز الاستشفاء الشريك:</span>
                    <span className="font-bold text-slate-900">{caseDetails.case.center_name || 'متابعة خارجية'}</span>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1 pt-2">
                  <span className="text-xs font-bold text-slate-500">وصف الحالة وتفاصيل الطلب:</span>
                  <p className="text-xs sm:text-sm text-slate-700 bg-slate-50/70 p-3.5 rounded-xl border border-slate-100 leading-relaxed">
                    {caseDetails.case.description}
                  </p>
                </div>
              </div>

              {/* Treatment Plan & Clinical Assessment */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
                <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-[#1565C0]" />
                  <span>الخطة العلاجية والتقييم السريري</span>
                </h3>

                {caseDetails.treatment_plans.length === 0 ? (
                  <p className="text-xs text-slate-400 py-4 text-center">
                    سيقوم الأخصائي المعالج بوضع الخطة العلاجية وجدول الجلسات بعد استكمال الجلسة التقييمية الأولى.
                  </p>
                ) : (
                  caseDetails.treatment_plans.map((p: any) => (
                    <div key={p.id} className="p-4 bg-blue-50/40 border border-blue-100 rounded-xl space-y-2 text-xs">
                      <div className="flex justify-between font-bold text-slate-800">
                        <span>الهدف العلاجي: {p.goal}</span>
                        <span className="text-[#1565C0]">المدة: {p.duration} ({p.sessions_count} جلسات)</span>
                      </div>
                      <p className="text-slate-600 leading-relaxed">
                        <span className="font-semibold">الاستراتيجية المعتمدة:</span> {p.strategy}
                      </p>
                      {p.final_evaluation && (
                        <div className="mt-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900 font-medium">
                          <span className="font-bold block">التقرير الختامي للملف:</span>
                          {p.final_evaluation}
                        </div>
                      )}
                    </div>
                  ))
                )}

                {/* Therapy Sessions Completed */}
                <div className="space-y-2 pt-2">
                  <div className="text-xs font-bold text-slate-700">سجل الجلسات المنجزة ({caseDetails.therapy_sessions.length}):</div>
                  <div className="space-y-2">
                    {caseDetails.therapy_sessions.map((s: any) => (
                      <div key={s.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex justify-between items-center">
                        <div>
                          <span className="font-bold text-slate-900">الجلسة رقم {s.session_number}</span>
                          <span className="text-slate-500 mr-3">بتاريخ {s.date} (المدة: {s.duration} دقيقة)</span>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-100 text-emerald-800 font-bold">
                          منجزة
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Appointments */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-[#2E7D32]" />
                    <span>المواعيد القادمة والسابقة</span>
                  </h3>
                  {caseDetails.case.assigned_psychologist_id && (
                    <button
                      onClick={() => onOpenBookAppointment(caseDetails.case.id, caseDetails.case.assigned_psychologist_id)}
                      className="text-xs font-bold text-[#1565C0] hover:underline"
                    >
                      + حجز موعد جديد
                    </button>
                  )}
                </div>

                {caseDetails.appointments.length === 0 ? (
                  <p className="text-xs text-slate-400 py-2 text-center">لا توجد مواعيد مجدولة حالياً.</p>
                ) : (
                  <div className="space-y-2">
                    {caseDetails.appointments.map((a: any) => (
                      <div key={a.id} className="p-3.5 border border-slate-200 rounded-xl text-xs flex items-center justify-between">
                        <div className="space-y-0.5">
                          <div className="font-bold text-slate-900">موعد {a.type === 'psychological' ? 'نفسي عيادي' : 'استشارة قانونية'}</div>
                          <div className="text-slate-500">
                            التاريخ: {a.appointment_date} من {a.start_time} إلى {a.end_time} مع د. {a.specialist_first_name} {a.specialist_last_name}
                          </div>
                        </div>
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                          {a.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Multi-Step New Case Wizard Modal */}
      {showWizard && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200 text-right animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <button onClick={() => setShowWizard(false)} className="p-1 text-slate-400 hover:text-slate-600">
                ✕
              </button>
              <div className="text-base font-extrabold text-slate-900">
                تسجيل طلب مساعدة جديد — الخطوة {wizardStep} من 3
              </div>
            </div>

            {wizardError && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl font-bold">{wizardError}</div>
            )}

            {/* Step 1: Category & Priority */}
            {wizardStep === 1 && (
              <div className="space-y-4 text-xs sm:text-sm">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">نوع المشكلة أو المادة:</label>
                  <select
                    value={addictionTypeId}
                    onChange={(e) => setAddictionTypeId(Number(e.target.value))}
                    className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#1565C0] outline-none font-bold"
                  >
                    {addictionTypes.map(t => (
                      <option key={t.id} value={t.id}>{t.name_ar}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">درجة الأولوية وزمن الاستجابة المستهدف:</label>
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <label className={`p-3 rounded-xl border cursor-pointer text-xs font-bold transition-all ${priority === 'Critical' ? 'bg-red-50 border-red-500 text-red-800 ring-2 ring-red-400' : 'border-slate-200'}`}>
                      <input type="radio" name="prio" checked={priority === 'Critical'} onChange={() => setPriority('Critical')} className="sr-only" />
                      <div>🚨 حرج جداً (خطر داهم)</div>
                      <div className="text-[10px] text-slate-500 font-normal">استجابة خلال ساعتين</div>
                    </label>

                    <label className={`p-3 rounded-xl border cursor-pointer text-xs font-bold transition-all ${priority === 'High' ? 'bg-amber-50 border-amber-500 text-amber-800 ring-2 ring-amber-400' : 'border-slate-200'}`}>
                      <input type="radio" name="prio" checked={priority === 'High'} onChange={() => setPriority('High')} className="sr-only" />
                      <div>عاجل (تدهور سريع)</div>
                      <div className="text-[10px] text-slate-500 font-normal">استجابة خلال 24 ساعة</div>
                    </label>

                    <label className={`p-3 rounded-xl border cursor-pointer text-xs font-bold transition-all ${priority === 'Medium' ? 'bg-blue-50 border-blue-500 text-blue-800 ring-2 ring-blue-400' : 'border-slate-200'}`}>
                      <input type="radio" name="prio" checked={priority === 'Medium'} onChange={() => setPriority('Medium')} className="sr-only" />
                      <div>متوسط (حاجة لتوجيه)</div>
                      <div className="text-[10px] text-slate-500 font-normal">استجابة خلال 72 ساعة</div>
                    </label>

                    <label className={`p-3 rounded-xl border cursor-pointer text-xs font-bold transition-all ${priority === 'Low' ? 'bg-slate-50 border-slate-400 text-slate-800 ring-2 ring-slate-400' : 'border-slate-200'}`}>
                      <input type="radio" name="prio" checked={priority === 'Low'} onChange={() => setPriority('Low')} className="sr-only" />
                      <div>عادي / استفسار عام</div>
                      <div className="text-[10px] text-slate-500 font-normal">استجابة خلال أسبوع</div>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    type="button"
                    onClick={() => setWizardStep(2)}
                    className="px-5 py-2.5 bg-[#1565C0] text-white rounded-xl font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>التالي: تفاصيل الحالة</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Description */}
            {wizardStep === 2 && (
              <div className="space-y-4 text-xs sm:text-sm">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    اشرح الوضع والأعراض بدقة (سري تماماً بينك وبين الأخصائي):
                  </label>
                  <textarea
                    rows={5}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="اكتب عن بداية المشكلة، التغيرات السلوكية، المواد المتناولة، هل سبق دخول مصحة، وأي صعوبات قانونية أو أسرية..."
                    className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#1565C0] outline-none leading-relaxed"
                  />
                  <span className="text-[11px] text-slate-400">15 حرفاً على الأقل</span>
                </div>

                <div className="flex justify-between pt-4">
                  <button
                    type="button"
                    onClick={() => setWizardStep(1)}
                    className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl font-bold"
                  >
                    السابق
                  </button>
                  <button
                    type="button"
                    disabled={description.trim().length < 15}
                    onClick={() => setWizardStep(3)}
                    className="px-5 py-2.5 bg-[#1565C0] disabled:bg-slate-300 text-white rounded-xl font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>التالي: الوثائق والتأكيد</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Optional Documents & Confirm */}
            {wizardStep === 3 && (
              <div className="space-y-4 text-xs sm:text-sm">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="font-bold text-slate-800">مراجعة بيانات الطلب:</div>
                  <div>الأولوية: <span className="font-bold text-[#1565C0]">{priority}</span></div>
                  <div className="text-slate-600 line-clamp-2">الوصف: {description}</div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">إرفاق تقرير طبي أو وثيقة (اختياري):</label>
                  <input
                    type="text"
                    value={documentName}
                    onChange={(e) => setDocumentName(e.target.value)}
                    placeholder="مثال: تحليل دم أو تقرير نفسي سابق.pdf"
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-xs"
                  />
                </div>

                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 shrink-0 text-[#2E7D32]" />
                  <span>تأكيد الأمان: جميع البيانات خاضعة للسرية المهنية الطبية الصارمة.</span>
                </div>

                <div className="flex justify-between pt-4">
                  <button
                    type="button"
                    onClick={() => setWizardStep(2)}
                    className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl font-bold"
                  >
                    السابق
                  </button>
                  <button
                    type="button"
                    disabled={wizardSubmitting}
                    onClick={handleCreateCase}
                    className="px-6 py-2.5 bg-[#2E7D32] hover:bg-green-700 text-white font-bold rounded-xl shadow-xs flex items-center gap-2 cursor-pointer"
                  >
                    {wizardSubmitting ? 'جاري الإرسال...' : 'تأكيد وإرسال طلب المساعدة'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Rating Modal */}
      {showRatingModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200 text-right">
            <h3 className="font-bold text-base text-slate-900">تقييم الخدمة والتحالف العلاجي</h3>
            <div className="flex items-center justify-center gap-2 py-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRatingVal(star)}
                  className="p-1 text-2xl cursor-pointer"
                >
                  <Star className={`w-8 h-8 ${star <= ratingVal ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
                </button>
              ))}
            </div>
            <textarea
              rows={3}
              value={ratingFeedback}
              onChange={(e) => setRatingFeedback(e.target.value)}
              placeholder="ملاحظاتك واقتراحاتك لتحسين مستوى الرعاية..."
              className="w-full p-3 text-xs border border-slate-300 rounded-xl"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowRatingModal(false)}
                className="px-4 py-2 text-xs border border-slate-200 rounded-xl"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleRate}
                className="px-5 py-2 text-xs bg-[#1565C0] text-white font-bold rounded-xl"
              >
                إرسال التقييم
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
