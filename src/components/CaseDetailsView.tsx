import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity, AlertCircle, ArrowRight, CalendarDays, CheckCircle2, Clock3,
  FileText, MessageSquare, RefreshCw, ShieldCheck, UserRound
} from 'lucide-react';
import { api } from '../services/api';
import type { Appointment, CaseDocument, CaseFile, CaseProgress } from '../types';

interface CaseDetailsViewProps {
  caseCode?: string;
  onBack: () => void;
  onOpenChat?: (convId: number) => void;
  onBookAppointment?: () => void;
}

type DetailPayload = {
  case?: CaseFile;
  appointments?: Appointment[];
  documents?: CaseDocument[];
  case_progress?: CaseProgress[];
  progress?: CaseProgress[] | number;
  progress_history?: CaseProgress[];
  conversation_id?: number;
  [key: string]: any;
};

const CASE_STATUS: Record<string, string> = {
  NEW: 'طلب جديد',
  UNDER_REVIEW: 'قيد المراجعة',
  WAITING_PROVIDER: 'بانتظار مقدم الخدمة',
  ASSIGNED: 'تم إسناد المختص',
  FIRST_SESSION: 'الجلسة الأولى',
  FOLLOW_UP: 'متابعة مستمرة',
  REFERRED: 'تمت الإحالة',
  IN_PROGRESS: 'قيد التنفيذ',
  AWAITING_PAYMENT: 'بانتظار الدفع',
  CONFIRMED: 'موعد مؤكد',
  COMPLETED: 'مكتمل',
  ARCHIVED: 'مؤرشف',
  REJECTED: 'مرفوض'
};

const APPOINTMENT_STATUS: Record<string, string> = {
  PENDING: 'بانتظار التأكيد', pending: 'بانتظار التأكيد',
  CONFIRMED: 'مؤكد', confirmed: 'مؤكد',
  COMPLETED: 'منجز', completed: 'منجز',
  CANCELLED: 'ملغي', cancelled: 'ملغي',
  RESCHEDULED: 'أعيدت جدولته', NO_SHOW: 'لم يحضر'
};

const fmtDate = (value?: string) => value
  ? new Date(value).toLocaleDateString('ar-DZ', { year: 'numeric', month: 'long', day: 'numeric' })
  : '—';

const listFrom = <T,>(value: unknown): T[] => Array.isArray(value) ? value as T[] : [];

export const CaseDetailsView: React.FC<CaseDetailsViewProps> = ({
  caseCode,
  onBack,
  onOpenChat,
  onBookAppointment
}) => {
  const [caseFile, setCaseFile] = useState<CaseFile | null>(null);
  const [detail, setDetail] = useState<DetailPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'appointments' | 'documents' | 'progress'>('overview');

  const loadCase = useCallback(async () => {
    if (!caseCode) {
      setError('لم يتم تحديد رقم ملف لعرض تفاصيله.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const listRes = await api.getCases();
      const cases = listFrom<CaseFile>(listRes.data);
      const found = cases.find(item => item.number_case === caseCode);
      if (!found) {
        setCaseFile(null);
        setDetail(null);
        setError('لم يُعثر على ملف بهذا الرقم ضمن الملفات المتاحة لحسابك.');
        return;
      }
      setCaseFile(found);
      const detailRes = await api.getCaseById(found.id);
      setDetail(detailRes.data || {});
    } catch (err: any) {
      setError(err?.message || 'تعذر تحميل تفاصيل الملف من الخادم.');
    } finally {
      setLoading(false);
    }
  }, [caseCode]);

  useEffect(() => {
    void loadCase();
  }, [loadCase]);

  const record = detail?.case || caseFile;
  const appointments = listFrom<Appointment>(detail?.appointments);
  const documents = listFrom<CaseDocument>(detail?.documents);
  const progressEntries = listFrom<CaseProgress>(detail?.case_progress || detail?.progress_history || (Array.isArray(detail?.progress) ? detail.progress : []));
  const progressValue = typeof record?.latest_progress === 'number'
    ? record.latest_progress
    : typeof detail?.progress === 'number'
      ? detail.progress
      : progressEntries[0]?.progress_percentage;
  const conversationId = detail?.conversation_id;
  const detailLoaded = detail !== null;
  const statusText = CASE_STATUS[record?.status || ''] || record?.status || 'غير متاح';
  const sortedAppointments = useMemo(
    () => [...appointments].sort((a, b) => `${a.appointment_date} ${a.start_time}`.localeCompare(`${b.appointment_date} ${b.start_time}`)),
    [appointments]
  );

  return (
    <main className="case-detail-wrap care-enter" dir="rtl">
      <button onClick={onBack} className="case-back">
        <ArrowRight size={17} />
        <span>العودة إلى بوابة المتابعة</span>
      </button>

      <header className="case-detail-header">
        <div>
          <span className="rw-eyebrow">الفرصة الثانية · ملف رعاية</span>
          <h1>تفاصيل الحالة</h1>
          <p>رقم الملف <strong dir="ltr">{caseCode || '—'}</strong></p>
        </div>
        <div className="case-actions">
          {conversationId && onOpenChat && <button className="rw-secondary" onClick={() => onOpenChat(conversationId)}><MessageSquare size={16} /> المحادثة الآمنة</button>}
          {record?.assigned_psychologist_id && onBookAppointment && <button className="rw-primary" onClick={onBookAppointment}><CalendarDays size={16} /> المواعيد</button>}
        </div>
      </header>

      {error && (
        <div className="rw-feedback error">
          <AlertCircle size={17} />
          <span>{error}</span>
          <button onClick={() => void loadCase()} aria-label="إعادة المحاولة"><RefreshCw size={15} /></button>
        </div>
      )}

      {loading ? (
        <div className="case-detail-skeleton"><i /><i /><i /></div>
      ) : record ? (
        <>
          <section className="case-summary care-panel">
            <div className="case-summary-top">
              <div>
                <span className="case-label">نوع الحالة</span>
                <h2>{record.addiction_type_name || 'نوع الحالة غير محدد'}</h2>
              </div>
              <span className={`case-status-pill ${record.status === 'COMPLETED' ? 'done' : ''}`}><Clock3 size={14} />{statusText}</span>
            </div>
            <div className="case-summary-facts">
              <div><small>المستفيد</small><strong>{[record.patient_first_name, record.patient_last_name].filter(Boolean).join(' ') || 'غير محدد'}</strong></div>
              <div><small>الأولوية</small><strong>{record.priority === 'Critical' ? 'عاجلة جداً' : record.priority === 'High' ? 'عاجلة' : record.priority === 'Medium' ? 'متوسطة' : record.priority === 'Low' ? 'عادية' : 'غير محددة'}</strong></div>
              <div><small>تاريخ التسجيل</small><strong>{fmtDate(record.created_at)}</strong></div>
            </div>
            <div className="case-description">
              <h3>وصف الحالة</h3>
              <p>{record.description || 'لا يوجد وصف مسجل لهذا الملف.'}</p>
            </div>
            <div className="case-team">
              <div><UserRound size={16} /><span>الأخصائي النفسي</span><strong>{record.psy_first_name ? `${record.psy_first_name} ${record.psy_last_name || ''}` : 'لم يُسند بعد'}</strong></div>
              <div><UserRound size={16} /><span>المستشار القانوني</span><strong>{record.lawyer_first_name ? `${record.lawyer_first_name} ${record.lawyer_last_name || ''}` : 'لا يوجد إسناد مسجل'}</strong></div>
              <div><ShieldCheck size={16} /><span>المركز / الجهة</span><strong>{record.center_name || 'لا يوجد إسناد مسجل'}</strong></div>
            </div>
            <div className="case-progress">
              <div><span><Activity size={16} /> التقدم المسجل</span><strong>{typeof progressValue === 'number' ? `${progressValue}%` : 'لا توجد نسبة مسجلة'}</strong></div>
              {typeof progressValue === 'number' && <div className="case-progress-track"><span style={{ width: `${Math.max(0, Math.min(100, progressValue))}%` }} /></div>}
            </div>
          </section>

          <nav className="case-detail-tabs">
            {([
              ['overview', 'ملخص الملف', FileText],
              ['appointments', `المواعيد (${detailLoaded ? appointments.length : '—'})`, CalendarDays],
              ['documents', `المستندات (${detailLoaded ? documents.length : '—'})`, ShieldCheck],
              ['progress', 'سجل التقدم', Activity]
            ] as const).map(([tab, label, Icon]) => (
              <button key={tab} className={activeTab === tab ? 'selected' : ''} onClick={() => setActiveTab(tab)}>
                <Icon size={15} />{label}
              </button>
            ))}
          </nav>

          {activeTab === 'overview' && (
            <section className="care-panel case-tab-content">
              <h2>معلومات الملف</h2>
              <p>تُعرض هنا البيانات التي أعادها الخادم لهذا الملف فقط. لا تُظهر هذه الشاشة معلومات غير مسجلة أو مستندات غير مرفوعة.</p>
              <div className="case-overview-row"><span>حالة الملف</span><strong>{statusText}</strong></div>
              <div className="case-overview-row"><span>رقم الملف</span><strong dir="ltr">{record.number_case}</strong></div>
              {appointments[0] && <div className="case-overview-row"><span>أقرب موعد مسجل</span><strong>{fmtDate(appointments[0].appointment_date)} · {appointments[0].start_time}</strong></div>}
            </section>
          )}

          {activeTab === 'appointments' && (
            <section className="case-tab-content case-record-list">
              {sortedAppointments.length ? sortedAppointments.map(item => (
                <article className="care-panel case-record" key={item.id}>
                  <div className="case-record-icon"><CalendarDays size={18} /></div>
                  <div className="case-record-main">
                    <strong>{item.title || (item.type === 'legal' ? 'استشارة قانونية' : item.type === 'treatment' ? 'موعد علاجي' : 'موعد متابعة')}</strong>
                    <span>{fmtDate(item.appointment_date)} · {item.start_time} – {item.end_time}</span>
                    <small>{item.specialist_first_name ? `مع ${item.specialist_first_name} ${item.specialist_last_name || ''}` : item.specialty || 'المختص غير محدد'}</small>
                    {item.notes && <p>{item.notes}</p>}
                  </div>
                  <span className="case-record-status">{APPOINTMENT_STATUS[item.status] || item.status}</span>
                </article>
              )) : <div className="case-empty"><CalendarDays size={22} /><strong>{detailLoaded ? 'لا توجد مواعيد مسجلة لهذا الملف' : 'تعذر تحميل سجل المواعيد'}</strong><span>{detailLoaded ? 'ستظهر هنا المواعيد التي يعيدها الخادم.' : 'أعد المحاولة لتحميل السجلات المرتبطة بالملف.'}</span></div>}
            </section>
          )}

          {activeTab === 'documents' && (
            <section className="case-tab-content case-record-list">
              {documents.length ? documents.map(document => (
                <article className="care-panel case-record" key={document.id}>
                  <div className="case-record-icon"><FileText size={18} /></div>
                  <div className="case-record-main">
                    <strong>{document.file_name}</strong>
                    <span>{document.file_type || 'نوع الملف غير محدد'}{document.file_size ? ` · ${(document.file_size / (1024 * 1024)).toFixed(2)} MB` : ''}</span>
                    <small>{document.uploader_name ? `رفع بواسطة ${document.uploader_name} · ` : ''}{fmtDate(document.created_at)}</small>
                  </div>
                </article>
              )) : <div className="case-empty"><FileText size={22} /><strong>{detailLoaded ? 'لا توجد مستندات مرفوعة' : 'تعذر تحميل سجل المستندات'}</strong><span>{detailLoaded ? 'لا يظهر هنا إلا سجل المستندات الذي أرسله الخادم.' : 'أعد المحاولة لتحميل السجلات المرتبطة بالملف.'}</span></div>}
            </section>
          )}

          {activeTab === 'progress' && (
            <section className="case-tab-content case-record-list">
              {progressEntries.length ? progressEntries.map((entry, index) => (
                <article className="care-panel case-progress-entry" key={entry.id || `${entry.created_at}-${index}`}>
                  <div className="case-progress-entry-mark"><CheckCircle2 size={17} /></div>
                  <div><strong>{entry.progress_percentage}%</strong><span>{entry.notes || 'تحديث تقدم مسجل'}</span><small>{fmtDate(entry.created_at)}{entry.first_name ? ` · ${entry.first_name} ${entry.last_name || ''}` : ''}</small></div>
                </article>
              )) : typeof progressValue === 'number' ? (
                <article className="care-panel case-progress-entry"><div className="case-progress-entry-mark"><Activity size={17} /></div><div><strong>{progressValue}%</strong><span>آخر نسبة تقدم ظاهرة في سجل الملف</span><small>{fmtDate(record.created_at)}</small></div></article>
              ) : <div className="case-empty"><Activity size={22} /><strong>لا توجد تحديثات تقدم مسجلة</strong><span>ستظهر التحديثات بعد أن يضيفها الفريق المعالج.</span></div>}
            </section>
          )}
        </>
      ) : !error ? (
        <div className="case-empty"><AlertCircle size={22} /><strong>لا تتوفر تفاصيل لهذا الملف</strong></div>
      ) : null}
    </main>
  );
};