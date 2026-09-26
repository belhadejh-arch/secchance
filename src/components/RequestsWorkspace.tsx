import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity, AlertCircle, ArrowLeft, BadgeCheck, Banknote, CalendarDays,
  Check, ChevronLeft, CircleAlert, Clock3, CreditCard, FileText, HeartHandshake,
  ListFilter, Plus, RefreshCw, Search, ShieldCheck, Stethoscope, UserPlus,
  UserRound, UserRoundX, UsersRound, X
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import type { AddictionType, CareRequest, CareRequestDetail, PaymentRecord, Provider, ProviderStaff, RequestStats, Service } from '../types';

type Props = {
  role?: string;
  initialServiceCategory?: string;
  onInitialServiceHandled?: () => void;
};
type FormService = { title: string; description: string; amount_dzd: string; category: string; is_active: boolean };

const blankService: FormService = { title: '', description: '', amount_dzd: '', category: 'psychological', is_active: true };
const priorityText: Record<string, string> = { Critical: 'عاجلة جداً', High: 'عاجلة', Medium: 'متوسطة', Low: 'عادية' };
const statusText: Record<string, string> = {
  NEW: 'طلب جديد', WAITING_PROVIDER: 'بانتظار مقدم الخدمة', PENDING: 'بانتظار مقدم الخدمة',
  ACCEPTED: 'مقبول', ASSIGNED: 'تم إسناد الموظف', REJECTED: 'مرفوض',
  AWAITING_PAYMENT: 'بانتظار الدفع', PENDING_PAYMENT: 'بانتظار الدفع', PAID: 'تم الدفع', CONFIRMED: 'موعد مؤكد',
  IN_PROGRESS: 'الخدمة جارية', COMPLETED: 'مكتمل', CANCELED: 'ملغي', CANCELLED: 'ملغي'
};
const paymentText: Record<string, string> = {
  PENDING: 'في انتظار الدفع', PROCESSING: 'قيد المعالجة', PAID: 'تم الدفع',
  FAILED: 'فشل الدفع', CANCELLED: 'أُلغي الدفع', REFUNDED: 'تم رد المبلغ',
  REQUESTED: 'طلب الاسترداد قيد المراجعة', REFUND_REQUESTED: 'طلب الاسترداد قيد المراجعة',
  NOT_REQUIRED: 'الدفع غير مطلوب'
};
const cancellableRequestStatuses = ['WAITING_PROVIDER', 'ACCEPTED', 'AWAITING_PAYMENT', 'CONFIRMED'];
const getArray = <T,>(response: any): T[] => Array.isArray(response?.data) ? response.data : [];
const money = (value?: number) => `${Number(value || 0).toLocaleString('ar-DZ')} دج`;
const dateLabel = (value?: string) => value ? new Date(value).toLocaleDateString('ar-DZ', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';
const priorityClass = (priority?: string) => priority === 'Critical' ? 'priority-critical' : priority === 'High' ? 'priority-high' : priority === 'Medium' ? 'priority-medium' : 'priority-low';
const requestTone = (status?: string) => ['REJECTED', 'CANCELED', 'CANCELLED'].includes(status || '') ? 'red' : ['COMPLETED', 'CONFIRMED'].includes(status || '') ? 'green' : 'blue';

const Badge = ({ children, tone = 'blue' }: { children: React.ReactNode; tone?: string }) => (
  <span className={`rw-badge rw-badge-${tone}`}>{children}</span>
);

function RequestCard({ item, onOpen, client = false }: { item: CareRequest; onOpen: () => void; client?: boolean }) {
  return (
    <button type="button" onClick={onOpen} className="rw-request-card">
      <div className="rw-card-top">
        <div>
          <span className="rw-case-no">{item.number_case || `#${item.id}`}</span>
          <h3>{item.service_title || 'طلب خدمة'}</h3>
        </div>
        <ChevronLeft size={18} aria-hidden="true" />
      </div>
      <div className="rw-badges">
        <Badge tone={priorityClass(item.priority)}>{priorityText[item.priority] || item.priority || 'أولوية عادية'}</Badge>
        <Badge tone={requestTone(item.status)}>{statusText[item.status] || item.status}</Badge>
      </div>
      <div className="rw-card-meta">
        <span><Clock3 size={14} /> {dateLabel(item.created_at)}</span>
        <span>{client ? item.provider_name || 'بانتظار تعيين مقدم الخدمة' : item.client_name || 'مستفيد'}</span>
      </div>
      <div className="rw-card-bottom">
        <span>{item.amount_dzd > 0 ? money(item.amount_dzd) : 'دون مقابل'}</span>
        <Badge tone={item.payment_status === 'PAID' ? 'green' : item.payment_status === 'FAILED' ? 'red' : 'sand'}>{paymentText[item.payment_status] || item.payment_status || 'الدفع غير مطلوب'}</Badge>
      </div>
      {item.description && <p className="rw-snippet">{item.description}</p>}
    </button>
  );
}

export const RequestsWorkspace: React.FC<Props> = ({ role: roleProp, initialServiceCategory, onInitialServiceHandled }) => {
  const { user } = useAuth();
  const role = roleProp || user?.role_slug || 'family';
  const isAdmin = role === 'admin';
  const isClient = role === 'family' || role === 'patient' || role === 'guest';
  const isFacilityManager = role === 'treatment_center' || role === 'association';
  const managerProviderId = isFacilityManager ? user?.id : undefined;
  const [requests, setRequests] = useState<CareRequest[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [addictionTypes, setAddictionTypes] = useState<AddictionType[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [staff, setStaff] = useState<ProviderStaff[]>([]);
  const [staffLoading, setStaffLoading] = useState(false);
  const [staffError, setStaffError] = useState('');
  const [newStaffUserId, setNewStaffUserId] = useState('');
  const [assignStaffId, setAssignStaffId] = useState<number | ''>('');
  const [stats, setStats] = useState<RequestStats | null>(null);
  const [detail, setDetail] = useState<CareRequestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [view, setView] = useState<'requests' | 'services' | 'payments' | 'team'>('requests');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [serviceFilter, setServiceFilter] = useState('all');
  const [providerFilter, setProviderFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [serviceId, setServiceId] = useState<number | ''>('');
  const [providerId, setProviderId] = useState<number | ''>('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [addictionTypeId, setAddictionTypeId] = useState<number | ''>('');
  const [requestFormOpen, setRequestFormOpen] = useState(false);
  const [serviceForm, setServiceForm] = useState<FormService>(blankService);
  const [editingService, setEditingService] = useState<number | null>(null);
  const [reason, setReason] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [refundReviewIds, setRefundReviewIds] = useState<number[]>([]);
  const [decisionMode, setDecisionMode] = useState<'accept' | 'reject' | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'edahabia' | 'cib'>('edahabia');
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleStart, setScheduleStart] = useState('');
  const [scheduleEnd, setScheduleEnd] = useState('');
  const [report, setReport] = useState({ assessment: '', professional_notes: '', recommendations: '', treatment_plan: '', next_appointment: '', client_summary: '', final_evaluation: '' });
  const [message, setMessage] = useState('');
  const [gatewayReturn, setGatewayReturn] = useState<{ paymentId: number; requestId?: number; status: string; loading: boolean } | null>(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentId = Number(params.get('payment_id') || params.get('paymentId'));
    const requestId = Number(params.get('request_id') || params.get('requestId'));
    return Number.isFinite(paymentId) && paymentId > 0
      ? { paymentId, requestId: Number.isFinite(requestId) && requestId > 0 ? requestId : undefined, status: 'PENDING', loading: true }
      : null;
  });
  const handledCategory = useRef<string | null>(null);
  const handledCallback = useRef(onInitialServiceHandled);
  handledCallback.current = onInitialServiceHandled;

  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [requestRes, serviceRes] = await Promise.all([
        api.getRequests(),
        isAdmin ? Promise.resolve({ data: [] }) : isClient ? api.getServices() : api.getMyServices()
      ]);
      setRequests(getArray<CareRequest>(requestRes));
      setServices(getArray<Service>(serviceRes));
      if (isClient) {
        const typesRes = await api.getAddictionTypes();
        setAddictionTypes(getArray<AddictionType>(typesRes));
      }
      if (!isClient) {
        try {
          const statsRes = await api.getRequestStats();
          setStats(statsRes.data || null);
        } catch {
          setStats(null);
        }
      }
      if (isAdmin) {
        try {
          const paymentRes = await api.getPayments();
          setPayments(getArray<PaymentRecord>(paymentRes));
        } catch {
          setPayments([]);
        }
      }
      if (isFacilityManager) {
        setStaffLoading(true);
        setStaffError('');
        if (!managerProviderId) {
          setStaff([]);
          setStaffError('تعذر تحديد حساب مدير المنشأة.');
        } else {
          try {
            const staffRes = await api.getProviderStaff(managerProviderId);
            setStaff(getArray<ProviderStaff>(staffRes));
          } catch (err: any) {
            setStaff([]);
            setStaffError(err?.message || 'تعذر تحميل أعضاء الفريق.');
          }
        }
        setStaffLoading(false);
      }
    } catch (err: any) {
      setError(err?.message || 'تعذر تحميل البيانات الآن.');
    } finally {
      setLoading(false);
    }
  }, [isAdmin, isClient, isFacilityManager, managerProviderId]);

  useEffect(() => { void refresh(); }, [refresh]);

  useEffect(() => {
    if (!initialServiceCategory || !isClient || loading || handledCategory.current === initialServiceCategory) return;
    handledCategory.current = initialServiceCategory;
    const categoryAliases: Record<string, string[]> = {
      psychological: ['psychological', 'psychology', 'mental_health', 'نفسي', 'psych'],
      legal: ['legal', 'law', 'قانوني'],
      social: ['social', 'association', 'associations', 'اجتماعي'],
      treatment: ['treatment', 'medical', 'clinic', 'center', 'علاج', 'مصحة']
    };
    const accepted = categoryAliases[initialServiceCategory] || [initialServiceCategory];
    const matchingService = services.find(item => {
      if (!item.is_active) return false;
      const searchable = `${item.category || ''} ${item.title || ''}`.toLowerCase().replace(/[\s_-]+/g, '');
      return accepted.some(alias => searchable.includes(alias.toLowerCase().replace(/[\s_-]+/g, '')));
    });
    setServiceId(matchingService?.id || '');
    setRequestFormOpen(true);
    if (!matchingService && services.length && initialServiceCategory !== 'all') setMessage('اختر الخدمة المناسبة من القائمة؛ لا يوجد تطابق مباشر للتصنيف المحدد.');
    handledCallback.current?.();
  }, [initialServiceCategory, isClient, loading, services]);

  useEffect(() => {
    if (!serviceId || !isClient) { setProviders([]); setProviderId(''); return; }
    api.getProviders(Number(serviceId)).then(res => setProviders(getArray<Provider>(res))).catch(() => setProviders([]));
  }, [serviceId, isClient]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const returnedPayment = Number(params.get('payment_id') || params.get('paymentId'));
    const returnedRequest = Number(params.get('request_id') || params.get('requestId'));
    if (Number.isFinite(returnedRequest) && returnedRequest > 0) {
      api.getRequest(returnedRequest)
        .then(res => setDetail(res.data))
        .catch((err: any) => setError(err?.message || 'تعذر فتح الطلب المرتبط بعودة الدفع.'));
    }
    if (!Number.isFinite(returnedPayment) || returnedPayment <= 0) return;
    const requestId = Number.isFinite(returnedRequest) && returnedRequest > 0 ? returnedRequest : undefined;
    setGatewayReturn({ paymentId: returnedPayment, requestId, status: 'PENDING', loading: true });
    api.getPayment(returnedPayment)
      .then(async res => {
        const payment = res.data?.payment || res.data;
        setGatewayReturn({
          paymentId: returnedPayment,
          requestId,
          status: payment?.status || 'PENDING',
          loading: false
        });
        await refresh();
      })
      .catch((err: any) => {
        setGatewayReturn(current => current ? { ...current, status: 'PENDING', loading: false } : current);
        setError(err?.message || 'تعذر تحديث حالة الدفع من الخادم.');
      });
  }, [refresh]);

  const openRequest = async (item: CareRequest) => {
    setDetail(null);
    setAssignStaffId(item.assigned_staff_id || '');
    setError('');
    try {
      const res = await api.getRequest(item.id);
      setDetail(res.data);
      setAssignStaffId(res.data?.request?.assigned_staff_id || '');
      setScheduleDate(res.data?.request?.appointment_date?.slice(0, 10) || '');
      setScheduleStart(res.data?.request?.start_time || '');
      setScheduleEnd(res.data?.request?.end_time || '');
    } catch (err: any) { setError(err?.message || 'تعذر فتح تفاصيل الطلب.'); }
  };

  const downloadClientSummary = () => {
    if (!detail) return;
    const summaries = detail.reports?.map(item => item.client_summary?.trim()).filter(Boolean) || [];
    if (!summaries.length) return;
    const content = [`ملخص طلب الخدمة ${detail.request.number_case || detail.request.id}`, ...summaries].join('\n\n');
    const url = URL.createObjectURL(new Blob([content], { type: 'text/plain;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `service-summary-${String(detail.request.number_case || detail.request.id).replace(/[^a-zA-Z0-9_-]/g, '-')}.txt`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const submitRequest = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!serviceId || !providerId || !description.trim() || !addictionTypeId) return;
    setBusy(true); setError('');
    try {
      await api.createRequest({ service_id: Number(serviceId), provider_id: Number(providerId), addiction_type_id: Number(addictionTypeId), description: description.trim(), priority });
      setRequestFormOpen(false); setDescription(''); setServiceId(''); setProviderId(''); setAddictionTypeId('');
      setMessage('تم إرسال طلبك. ستظهر التحديثات هنا عند معالجة مقدم الخدمة.');
      await refresh();
    } catch (err: any) { setError(err?.message || 'تعذر إرسال الطلب.'); }
    finally { setBusy(false); }
  };

  const saveDecision = async () => {
    if (!detail || !decisionMode || (decisionMode === 'reject' && !reason.trim())) return;
    setBusy(true); setError('');
    try {
      await api.decideRequest(detail.request.id, decisionMode, decisionMode === 'reject' ? reason.trim() : undefined);
      setDecisionMode(null); setReason(''); await openRequest(detail.request); await refresh();
    } catch (err: any) { setError(err?.message || 'تعذر تحديث قرار الطلب.'); }
    finally { setBusy(false); }
  };

  const setPriorityOnRequest = async (value: string) => {
    if (!detail) return;
    setBusy(true);
    try { await api.setRequestPriority(detail.request.id, value); await openRequest(detail.request); await refresh(); }
    catch (err: any) { setError(err?.message || 'تعذر تحديث الأولوية.'); }
    finally { setBusy(false); }
  };

  const saveSchedule = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!detail || !scheduleDate || !scheduleStart || !scheduleEnd) return;
    setBusy(true);
    try { await api.scheduleRequest(detail.request.id, scheduleDate, scheduleStart, scheduleEnd); await openRequest(detail.request); await refresh(); setMessage('تم حفظ الموعد.'); }
    catch (err: any) { setError(err?.message || 'تعذر حفظ الموعد.'); }
    finally { setBusy(false); }
  };

  const saveReport = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!detail) return;
    setBusy(true);
    try { await api.createRequestReport(detail.request.id, report); await openRequest(detail.request); setReport({ assessment: '', professional_notes: '', recommendations: '', treatment_plan: '', next_appointment: '', client_summary: '', final_evaluation: '' }); setMessage('تم حفظ التقرير.'); }
    catch (err: any) { setError(err?.message || 'تعذر حفظ التقرير.'); }
    finally { setBusy(false); }
  };

  const updateStatus = async (status: 'IN_PROGRESS' | 'COMPLETED') => {
    if (!detail) return;
    setBusy(true);
    try { await api.setRequestStatus(detail.request.id, status); await openRequest(detail.request); await refresh(); }
    catch (err: any) { setError(err?.message || 'تعذر تحديث حالة الطلب.'); }
    finally { setBusy(false); }
  };

  const saveService = async (event: React.FormEvent) => {
    event.preventDefault();
    const data = { ...serviceForm, amount_dzd: Number(serviceForm.amount_dzd || 0) };
    setBusy(true);
    try {
      if (editingService) await api.updateService(editingService, data);
      else await api.createService(data);
      setServiceForm(blankService); setEditingService(null); await refresh(); setMessage('تم حفظ الخدمة.');
    } catch (err: any) { setError(err?.message || 'تعذر حفظ الخدمة.'); }
    finally { setBusy(false); }
  };

  const addStaffMember = async (event: React.FormEvent) => {
    event.preventDefault();
    const staffUserId = Number(newStaffUserId.trim());
    if (!managerProviderId || !Number.isInteger(staffUserId) || staffUserId < 1) {
      setStaffError('أدخل رقم حساب موظف صحيحاً.');
      return;
    }
    setBusy(true);
    setStaffError('');
    try {
      await api.addProviderStaff(managerProviderId, staffUserId);
      setNewStaffUserId('');
      setMessage('تم ربط الموظف بحساب المنشأة.');
      await refresh();
    } catch (err: any) {
      setStaffError(err?.message || 'تعذر إضافة الموظف. تأكد من رقم الحساب ومن اعتماد الحساب مهنياً.');
    } finally {
      setBusy(false);
    }
  };

  const removeStaffMember = async (staffId: number) => {
    if (!managerProviderId || !window.confirm('هل تريد إزالة هذا الموظف من فريق المنشأة؟')) return;
    setBusy(true);
    setStaffError('');
    try {
      await api.removeProviderStaff(managerProviderId, staffId);
      setMessage('تمت إزالة الموظف من الفريق.');
      await refresh();
    } catch (err: any) {
      setStaffError(err?.status === 409
        ? 'لا يمكن إزالة هذا الموظف لوجود طلبات مفتوحة مسندة إليه. أعد إسناد الطلبات أولاً.'
        : err?.message || 'تعذر إزالة الموظف من الفريق.');
    } finally {
      setBusy(false);
    }
  };

  const assignStaffMember = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!detail || !Number.isInteger(Number(assignStaffId)) || !assignStaffId) return;
    setBusy(true);
    setError('');
    try {
      await api.assignRequestStaff(detail.request.id, Number(assignStaffId));
      await openRequest(detail.request);
      await refresh();
      setMessage('تم إسناد الطلب إلى عضو الفريق.');
    } catch (err: any) {
      setError(err?.message || 'تعذر إسناد الطلب إلى عضو الفريق.');
    } finally {
      setBusy(false);
    }
  };

  const cancelCurrentRequest = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!detail || !cancellableRequestStatuses.includes(detail.request.status)) return;
    setBusy(true);
    setError('');
    try {
      const request = detail.request;
      const paid = request.payment_status === 'PAID';
      await api.cancelRequest(request.id, cancelReason);
      setCancelDialogOpen(false);
      setCancelReason('');
      if (paid) {
        setRefundReviewIds(current => current.includes(request.id) ? current : [...current, request.id]);
      }
      await refresh();
      await openRequest(request);
      setMessage(paid
        ? 'تم إلغاء الطلب. أُرسل طلب استرداد المبلغ للمراجعة؛ لم يتم تأكيد إعادة الأموال.'
        : 'تم إلغاء الطلب.');
    } catch (err: any) {
      const failureText = err?.status === 409
        ? 'تعذر إلغاء الطلب لأن حالته تغيّرت أو لم تعد تسمح بالإلغاء. حدّث البيانات وحاول مجدداً.'
        : err?.status === 403 || err?.status === 401
          ? 'لا تملك صلاحية إلغاء هذا الطلب.'
          : err?.status === 404
            ? 'لم يعد الطلب متاحاً. حدّث القائمة للتحقق من حالته.'
            : err?.message || 'تعذر إلغاء الطلب. حاول مجدداً.';
      setError(failureText);
    } finally {
      setBusy(false);
    }
  };

  const startCheckout = async () => {
    if (!detail) return;
    setBusy(true); setError('');
    try {
      const res = await api.createCheckout(detail.request.id, paymentMethod);
      if (!res.data?.checkout_url) throw new Error('لم يُرجع الخادم رابط الدفع.');
      window.location.assign(res.data.checkout_url);
    } catch (err: any) { setError(err?.message || 'تعذر بدء عملية الدفع.'); setBusy(false); }
  };

  const filtered = useMemo(() => requests.filter(item => {
    const term = query.toLocaleLowerCase();
    const searchOk = !term || [item.number_case, item.client_name, item.provider_name, item.service_title].some(v => (v || '').toLocaleLowerCase().includes(term));
    const filterOk = filter === 'all' || item.status === filter;
    const priorityOk = priorityFilter === 'all' || item.priority === priorityFilter;
    const paymentOk = paymentFilter === 'all' || item.payment_status === paymentFilter;
    const serviceOk = serviceFilter === 'all' || item.service_title === serviceFilter;
    const providerOk = providerFilter === 'all' || item.provider_name === providerFilter;
    const dateOk = !dateFilter || item.created_at?.slice(0, 10) === dateFilter;
    return searchOk && filterOk && priorityOk && paymentOk && serviceOk && providerOk && dateOk;
  }).sort((a, b) => ['Critical', 'High', 'Medium', 'Low'].indexOf(a.priority) - ['Critical', 'High', 'Medium', 'Low'].indexOf(b.priority)), [requests, query, filter, priorityFilter, paymentFilter, serviceFilter, providerFilter, dateFilter]);

  const awaiting = requests.filter(item => ['NEW', 'WAITING_PROVIDER', 'PENDING'].includes(item.status));
  const title = isAdmin ? 'مركز الطلبات والمدفوعات' : isClient ? 'طلباتي وخدمات الدعم' : 'الطلبات في انتظارك';
  const isOwnerClient = role === 'family' || role === 'patient';
  const canCancelCurrent = Boolean(detail && (isOwnerClient || isAdmin) && cancellableRequestStatuses.includes(detail.request.status));
  const refundStatus = String(
    detail?.request?.refund_status ||
    detail?.request?.refund_request_status ||
    ''
  ).toUpperCase();
  const refundReviewRequested = Boolean(
    detail &&
    ['CANCELED', 'CANCELLED'].includes(detail.request.status) &&
    ((detail.request.payment_status === 'PAID' && refundStatus === 'REQUESTED') || refundReviewIds.includes(detail.request.id))
  );

  return (
    <section className="rw-wrap care-enter" dir="rtl">
      <header className="rw-header">
        <div className="rw-brand-mark"><HeartHandshake size={22} /></div>
        <div className="rw-header-copy">
          <div className="rw-eyebrow">الفرصة الثانية <span>•</span> رعاية متصلة وواضحة</div>
          <h1>{title}</h1>
          <p>{isClient ? 'اختر خدمة موثوقة، أرسل طلبك، وتابع كل تحديث من مكان واحد.' : isAdmin ? 'متابعة الطلبات ومؤشرات الأداء وسجل المدفوعات من بيانات المنصة.' : 'تابع الطلبات الموجهة إليك واتخذ القرار وسجل خطوات الرعاية.'}</p>
        </div>
        {!isClient && !isAdmin && <div className="rw-inbox-count"><span>{awaiting.length}</span><small>بانتظارك</small></div>}
      </header>

      {message && <div className="rw-feedback success"><Check size={17} />{message}<button onClick={() => setMessage('')} aria-label="إغلاق"><X size={16} /></button></div>}
      {error && <div className="rw-feedback error"><CircleAlert size={17} />{error}<button onClick={() => setError('')} aria-label="إغلاق"><X size={16} /></button></div>}
      {gatewayReturn && (
        <div className={`rw-gateway-status ${gatewayReturn.status.toUpperCase() === 'PAID' ? 'paid' : gatewayReturn.status.toUpperCase() === 'FAILED' ? 'failed' : ''}`}>
          <div><CreditCard size={18} /><strong>حالة الدفع للعملية #{gatewayReturn.paymentId}</strong></div>
          <span>{gatewayReturn.loading ? 'قيد التحقق من الخادم…' : paymentText[gatewayReturn.status.toUpperCase()] || 'في انتظار تأكيد الدفع'}</span>
          <small>تُحدّث الحالة من سجل الدفع بعد إشعار البوابة الموثّق، ولا يُعد الرجوع إلى المنصة تأكيداً للدفع.</small>
        </div>
      )}

      {!isClient && stats && (
        <div className="rw-stats" aria-label="إحصائيات الطلبات">
          {[
            ['بانتظار الرد', stats.pending, Clock3], ['مقبولة', stats.accepted, BadgeCheck],
            ['قيد التنفيذ', stats.in_progress, Activity], ['مواعيد قادمة', stats.upcoming, CalendarDays],
            ['عمليات مدفوعة', stats.paid, CreditCard], ['الإيرادات المسجلة', money(stats.revenue_dzd), Banknote]
          ].map(([label, value, Icon]: any) => <div className="rw-stat" key={label}><Icon size={18} /><span>{label}</span><strong>{value}</strong></div>)}
        </div>
      )}

      <nav className="rw-tabs" aria-label="أقسام الطلبات">
        <button className={view === 'requests' ? 'selected' : ''} onClick={() => { setView('requests'); setDetail(null); }}><FileText size={16} />{isClient ? 'طلباتي' : 'الطلبات'} <span>{requests.length}</span></button>
        {!isAdmin && !isClient && <button className={view === 'services' ? 'selected' : ''} onClick={() => { setView('services'); setDetail(null); }}><Stethoscope size={16} />خدماتي <span>{services.length}</span></button>}
        {isFacilityManager && <button className={view === 'team' ? 'selected' : ''} onClick={() => { setView('team'); setDetail(null); }}><UsersRound size={16} />فريق المنشأة <span>{staff.length}</span></button>}
        {isAdmin && <button className={view === 'payments' ? 'selected' : ''} onClick={() => { setView('payments'); setDetail(null); }}><CreditCard size={16} />المدفوعات <span>{payments.length}</span></button>}
        <button className="rw-refresh" onClick={() => {
          void (async () => {
            await refresh();
            if (!gatewayReturn) return;
            try {
              const res = await api.getPayment(gatewayReturn.paymentId);
              const payment = res.data?.payment || res.data;
              setGatewayReturn(current => current ? { ...current, status: payment?.status || 'PENDING', loading: false } : current);
            } catch {
              setGatewayReturn(current => current ? { ...current, status: 'PENDING', loading: false } : current);
            }
          })();
        }} aria-label="تحديث"><RefreshCw size={15} /> تحديث</button>
      </nav>

      {view === 'requests' && !detail && (
        <>
          {isClient && <div className="rw-action-bar"><div><strong>هل تحتاج إلى مساعدة؟</strong><span>ابدأ باختيار نوع الخدمة ومقدمها.</span></div><button className="rw-primary" onClick={() => setRequestFormOpen(true)}><Plus size={17} /> طلب خدمة</button></div>}
          <div className="rw-filterbar">
            <label className="rw-search"><Search size={16} /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="ابحث برقم الطلب أو الخدمة أو الاسم" /></label>
            <label className="rw-select"><ListFilter size={16} /><select value={filter} onChange={e => setFilter(e.target.value)}>
              <option value="all">كل الحالات</option><option value="NEW">طلب جديد</option><option value="WAITING_PROVIDER">بانتظار مقدم الخدمة</option><option value="PENDING">بانتظار مقدم الخدمة (حالة قديمة)</option><option value="ACCEPTED">مقبول</option><option value="ASSIGNED">تم إسناد الموظف</option><option value="AWAITING_PAYMENT">بانتظار الدفع</option><option value="PENDING_PAYMENT">بانتظار الدفع (حالة قديمة)</option><option value="PAID">تم الدفع</option><option value="CONFIRMED">موعد مؤكد</option><option value="IN_PROGRESS">قيد التنفيذ</option><option value="COMPLETED">مكتمل</option><option value="REJECTED">مرفوض</option><option value="CANCELED">ملغي</option><option value="CANCELLED">ملغي (حالة قديمة)</option>
            </select></label>
            {isAdmin && <>
              <label className="rw-select"><select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}><option value="all">كل الأولويات</option><option value="Critical">عاجلة جداً</option><option value="High">عاجلة</option><option value="Medium">متوسطة</option><option value="Low">عادية</option></select></label>
              <label className="rw-select"><select value={paymentFilter} onChange={e => setPaymentFilter(e.target.value)}><option value="all">كل حالات الدفع</option><option value="PENDING">في انتظار الدفع</option><option value="PROCESSING">قيد المعالجة</option><option value="PAID">مدفوع</option><option value="FAILED">فشل</option><option value="CANCELLED">ملغي</option><option value="REFUNDED">مسترجع</option><option value="NOT_REQUIRED">غير مطلوب</option></select></label>
              <label className="rw-select"><select value={serviceFilter} onChange={e => setServiceFilter(e.target.value)}><option value="all">كل الخدمات</option>{Array.from(new Set(requests.map(item => item.service_title).filter(Boolean))).map(title => <option key={title} value={title}>{title}</option>)}</select></label>
              <label className="rw-select"><select value={providerFilter} onChange={e => setProviderFilter(e.target.value)}><option value="all">كل مقدمي الخدمة</option>{Array.from(new Set(requests.map(item => item.provider_name).filter(Boolean))).map(name => <option key={name} value={name}>{name}</option>)}</select></label>
              <label className="rw-select"><span>التاريخ</span><input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)} /></label>
            </>}
          </div>
          {loading ? <div className="rw-skeletons"><i /><i /><i /></div> : filtered.length ? <div className="rw-request-grid">{filtered.map(item => <RequestCard key={item.id} item={item} client={isClient} onOpen={() => void openRequest(item)} />)}</div> :
            <div className="rw-empty"><div><FileText size={22} /></div><h3>{error ? 'تعذر تحميل الطلبات' : 'لا توجد طلبات بعد'}</h3><p>{error ? 'تحقق من الاتصال ثم أعد المحاولة.' : isClient ? 'ستظهر طلبات الخدمة التي ترسلها هنا مع كل تحديث.' : 'ستظهر هنا الطلبات التي أُحيلت إلى حسابك.'}</p>{error && <button onClick={() => void refresh()} className="rw-secondary">إعادة المحاولة</button>}</div>}
        </>
      )}

      {detail && view === 'requests' && (
        <div className="rw-detail">
          <button className="rw-back" onClick={() => setDetail(null)}><ArrowLeft size={16} /> العودة إلى القائمة</button>
          <article className="care-panel rw-detail-main">
            <div className="rw-detail-head">
              <div><span className="rw-eyebrow">طلب رقم {detail.request.number_case || detail.request.id}</span><h2>{detail.request.service_title}</h2><p>{isClient ? `مقدم الخدمة: ${detail.request.provider_name || 'قيد التعيين'}` : `مقدم الطلب: ${detail.request.client_name || 'مستفيد'}`}</p></div>
              <Badge tone={requestTone(detail.request.status)}>{statusText[detail.request.status] || detail.request.status}</Badge>
            </div>
            <div className="rw-detail-facts">
              <div><small>الأولوية</small><Badge tone={priorityClass(detail.request.priority)}>{priorityText[detail.request.priority] || detail.request.priority}</Badge></div>
              <div><small>الدفع</small><Badge tone={detail.request.payment_status === 'PAID' ? 'green' : 'sand'}>{paymentText[detail.request.payment_status] || detail.request.payment_status}</Badge></div>
              <div><small>المبلغ</small><strong>{detail.request.amount_dzd > 0 ? money(detail.request.amount_dzd) : 'دون مقابل'}</strong></div>
              <div><small>تاريخ الطلب</small><strong>{dateLabel(detail.request.created_at)}</strong></div>
            </div>
            {refundReviewRequested && (
              <div className="rw-refund-review">
                <div><CreditCard size={18} /><strong>طلب استرداد قيد المراجعة</strong></div>
                <Badge tone="sand">REQUESTED</Badge>
                <p>تم تسجيل طلب مراجعة الاسترداد بعد إلغاء طلب مدفوع. لم يتم تأكيد إعادة الأموال.</p>
              </div>
            )}
            {canCancelCurrent && (
              <div className="rw-client-actions">
                <div><strong>لم تعد بحاجة إلى هذه الخدمة؟</strong><span>يمكن إلغاء الطلب ما دامت حالته تسمح بذلك.</span></div>
                <button className="rw-danger" onClick={() => { setCancelReason(''); setCancelDialogOpen(true); }}>إلغاء الطلب</button>
              </div>
            )}
            {isFacilityManager && (
              <section className="rw-assigned-person">
                <div className="rw-staff-avatar"><UserRound size={17} /></div>
                <div><small>الموظف المكلّف بهذا الطلب</small><strong>{detail.request.assigned_staff_id ? `${detail.request.assigned_staff_first_name || ''} ${detail.request.assigned_staff_last_name || ''}`.trim() || `حساب #${detail.request.assigned_staff_id}` : 'لم يُسند إلى موظف بعد'}</strong></div>
                {detail.request.assigned_staff_role_slug && <Badge tone="green">{detail.request.assigned_staff_role_slug}</Badge>}
              </section>
            )}
            <div className="rw-description"><h3>تفاصيل الطلب</h3><p>{detail.request.description || 'لا يوجد وصف مرفق.'}</p></div>
            {detail.request.rejection_reason && <div className="rw-reason"><AlertCircle size={17} /><span>سبب الرفض: {detail.request.rejection_reason}</span></div>}
            {detail.request.appointment_date && <div className="rw-appointment"><CalendarDays size={18} /><div><strong>موعد الخدمة</strong><span>{dateLabel(detail.request.appointment_date)} — {detail.request.start_time} إلى {detail.request.end_time}</span></div></div>}

            {isClient && detail.reports?.some(item => item.client_summary) && (
              <section className="rw-report-client">
                <div className="flex items-center justify-between gap-3"><h3>ملخص مقدم الخدمة</h3><button type="button" className="rw-secondary" onClick={downloadClientSummary}>تنزيل الملخص</button></div>
                {detail.reports.filter(item => item.client_summary).map((item, index) => <p key={item.id || index}>{item.client_summary}</p>)}
              </section>
            )}
            {isClient && ['ACCEPTED', 'AWAITING_PAYMENT', 'PENDING_PAYMENT'].includes(detail.request.status) && detail.request.amount_dzd > 0 && detail.request.payment_status !== 'PAID' && (
              <div className="rw-checkout">
                <h3>إتمام الدفع عبر بوابة آمنة</h3>
                <p>لن تُدخل بيانات البطاقة في المنصة. ستنتقل إلى صفحة الدفع المستضافة لدى Chargily.</p>
                <div className="rw-methods">
                  <label className={paymentMethod === 'edahabia' ? 'active' : ''}><input type="radio" checked={paymentMethod === 'edahabia'} onChange={() => setPaymentMethod('edahabia')} /> البطاقة الذهبية</label>
                  <label className={paymentMethod === 'cib' ? 'active' : ''}><input type="radio" checked={paymentMethod === 'cib'} onChange={() => setPaymentMethod('cib')} /> CIB</label>
                </div>
                <button className="rw-primary" disabled={busy} onClick={() => void startCheckout()}><CreditCard size={17} />{busy ? 'جارٍ تجهيز الدفع…' : 'المتابعة إلى الدفع'}</button>
              </div>
            )}

            {isAdmin && (
              <div className="rw-tool-box" style={{ marginTop: 16 }}>
                <h3>أولوية الطلب</h3>
                <div className="rw-priority-select"><label>تعديل الأولوية</label><select value={detail.request.priority} onChange={e => void setPriorityOnRequest(e.target.value)}><option value="Critical">عاجلة جداً</option><option value="High">عاجلة</option><option value="Medium">متوسطة</option><option value="Low">عادية</option></select></div>
              </div>
            )}
            {!isClient && !isAdmin && (
              <div className="rw-provider-tools">
                {isFacilityManager && (
                  <form className="rw-tool-box rw-assignment-form" onSubmit={assignStaffMember}>
                    <h3>إسناد الطلب إلى موظف</h3>
                    <p>اختر عضواً نشطاً مرتبطاً بحساب منشأتك. يمكن تغيير الإسناد لاحقاً.</p>
                    <label>عضو الفريق
                      <select className="care-field" required value={assignStaffId} onChange={e => setAssignStaffId(Number(e.target.value) || '')}>
                        <option value="">اختر موظفاً</option>
                        {staff.filter(member => member.is_active).map(member => (
                          <option key={member.staff_user_id} value={member.staff_user_id}>
                            {member.first_name} {member.last_name} · {member.role_slug}
                          </option>
                        ))}
                      </select>
                    </label>
                    {!staff.filter(member => member.is_active).length && <p className="rw-form-note">لا يوجد موظفون نشطون في الفريق. أضف موظفاً من تبويب فريق المنشأة أولاً.</p>}
                    <button className="rw-primary" disabled={busy || !staff.filter(member => member.is_active).length}>حفظ الإسناد</button>
                  </form>
                )}
                <div className="rw-tool-box">
                  <h3>قرار الطلب والأولوية</h3>
                  <div className="rw-priority-select"><label>تحديث الأولوية</label><select value={detail.request.priority} onChange={e => void setPriorityOnRequest(e.target.value)}><option value="Critical">عاجلة جداً</option><option value="High">عاجلة</option><option value="Medium">متوسطة</option><option value="Low">عادية</option></select></div>
                  {['NEW', 'WAITING_PROVIDER', 'PENDING'].includes(detail.request.status) && <div className="rw-buttons"><button className="rw-primary" onClick={() => { setDecisionMode('accept'); setReason(''); }}><Check size={16} /> قبول الطلب</button><button className="rw-danger" onClick={() => { setDecisionMode('reject'); setReason(''); }}>رفض الطلب</button></div>}
                  {decisionMode && <div className="rw-decision">
                    <label>{decisionMode === 'reject' ? 'سبب الرفض مطلوب' : 'تأكيد قبول الطلب'}</label>
                    {decisionMode === 'reject' && <><select value={reason} onChange={e => setReason(e.target.value)}><option value="">اختر سبباً</option><option>لا أستطيع استقبال الحالة</option><option>الخدمة غير متوفرة</option><option>الموعد غير مناسب</option><option>الحالة خارج الاختصاص</option><option>سبب آخر</option></select>{reason === 'سبب آخر' && <textarea className="care-field" rows={2} placeholder="اكتب سبب الرفض" onChange={e => setReason(e.target.value)} />}</>}
                    <div className="rw-buttons"><button className="rw-primary" disabled={busy || (decisionMode === 'reject' && !reason.trim())} onClick={() => void saveDecision()}>{busy ? 'جارٍ الحفظ…' : 'تأكيد القرار'}</button><button className="rw-secondary" onClick={() => setDecisionMode(null)}>إلغاء</button></div>
                  </div>}
                </div>
                <form className="rw-tool-box" onSubmit={saveSchedule}>
                  <h3>تحديد موعد</h3>
                  <div className="rw-schedule"><label>التاريخ<input className="care-field" type="date" required value={scheduleDate} onChange={e => setScheduleDate(e.target.value)} /></label><label>من<input className="care-field" type="time" required value={scheduleStart} onChange={e => setScheduleStart(e.target.value)} /></label><label>إلى<input className="care-field" type="time" required value={scheduleEnd} onChange={e => setScheduleEnd(e.target.value)} /></label></div>
                  <button className="rw-secondary" disabled={busy}>حفظ الموعد</button>
                </form>
                <form className="rw-tool-box" onSubmit={saveReport}>
                  <h3>تقرير مهني</h3>
                  <label>التقييم<textarea className="care-field" rows={2} value={report.assessment} onChange={e => setReport({ ...report, assessment: e.target.value })} /></label>
                  <label>الملاحظات المهنية<textarea className="care-field" rows={2} value={report.professional_notes} onChange={e => setReport({ ...report, professional_notes: e.target.value })} /></label>
                  <label>التوصيات<textarea className="care-field" rows={2} value={report.recommendations} onChange={e => setReport({ ...report, recommendations: e.target.value })} /></label>
                  <label>الخطة العلاجية<textarea className="care-field" rows={2} value={report.treatment_plan} onChange={e => setReport({ ...report, treatment_plan: e.target.value })} /></label>
                  <label>ملخص يظهر للعميل<textarea className="care-field" rows={2} value={report.client_summary} onChange={e => setReport({ ...report, client_summary: e.target.value })} /></label>
                  <label>التقرير الختامي<textarea className="care-field" rows={2} value={report.final_evaluation} onChange={e => setReport({ ...report, final_evaluation: e.target.value })} /></label>
                  <label>الموعد القادم<input className="care-field" type="date" value={report.next_appointment} onChange={e => setReport({ ...report, next_appointment: e.target.value })} /></label>
                  <div className="rw-buttons"><button className="rw-primary" disabled={busy}>حفظ التقرير</button>
                    {detail.request.status === 'ACCEPTED' && <button type="button" className="rw-secondary" disabled={busy} onClick={() => void updateStatus('IN_PROGRESS')}>بدء الخدمة</button>}
                    {detail.request.status === 'IN_PROGRESS' && <button type="button" className="rw-secondary" disabled={busy} onClick={() => void updateStatus('COMPLETED')}>إنهاء الخدمة</button>}
                  </div>
                </form>
              </div>
            )}
          </article>
          {!!detail.history?.length && <section className="care-panel rw-history"><h3>سجل التحديثات</h3>{detail.history.map((item, index) => <div key={item.id || index}><span className="rw-history-dot" /><p><strong>{item.status ? statusText[item.status] || item.status : 'تحديث'}</strong>{item.note && <span> — {item.note}</span>}</p><time>{dateLabel(item.created_at)}</time></div>)}</section>}
        </div>
      )}

      {requestFormOpen && isClient && (
        <div className="rw-modal-backdrop" role="presentation">
          <form className="rw-modal care-enter" onSubmit={submitRequest}>
            <div className="rw-modal-head"><div><span className="rw-eyebrow">خطوة آمنة وواضحة</span><h2>طلب خدمة جديدة</h2></div><button type="button" onClick={() => setRequestFormOpen(false)} aria-label="إغلاق"><X size={19} /></button></div>
            <label>الخدمة المطلوبة<select required className="care-field" value={serviceId} onChange={e => setServiceId(Number(e.target.value) || '')}><option value="">اختر الخدمة</option>{services.filter(item => item.is_active).map(item => <option key={item.id} value={item.id}>{item.title}{item.amount_dzd > 0 ? ` — ${money(item.amount_dzd)}` : ''}</option>)}</select></label>
            {services.length === 0 && <p className="rw-form-note">لا توجد خدمات متاحة حالياً.</p>}
            <label>مقدم الخدمة<select required disabled={!serviceId} className="care-field" value={providerId} onChange={e => setProviderId(Number(e.target.value) || '')}><option value="">اختر مقدم الخدمة</option>{providers.map(item => <option key={item.id} value={item.id}>{item.first_name} {item.last_name} — {item.wilaya_name || item.role_slug}</option>)}</select></label>
            <label>نوع الحالة<select required className="care-field" value={addictionTypeId} onChange={e => setAddictionTypeId(Number(e.target.value) || '')}><option value="">اختر نوع الحالة</option>{addictionTypes.map(item => <option key={item.id} value={item.id}>{item.name_ar}</option>)}</select></label>
            <label>درجة الأولوية<select className="care-field" value={priority} onChange={e => setPriority(e.target.value)}><option value="Critical">عاجلة جداً</option><option value="High">عاجلة</option><option value="Medium">متوسطة</option><option value="Low">عادية</option></select></label>
            <label>وصف مختصر للحاجة<textarea className="care-field" required rows={4} value={description} onChange={e => setDescription(e.target.value)} placeholder="اكتب المعلومات الضرورية لمقدم الخدمة فقط." /></label>
            <p className="rw-form-note"><ShieldCheck size={15} /> لن يتم تحصيل أي مبلغ هنا. عند قبول طلب مدفوع، ستنتقل إلى بوابة الدفع المستضافة.</p>
            <div className="rw-buttons"><button className="rw-primary" disabled={busy || !services.length}>{busy ? 'جارٍ الإرسال…' : 'إرسال الطلب'}</button><button type="button" className="rw-secondary" onClick={() => setRequestFormOpen(false)}>إلغاء</button></div>
          </form>
        </div>
      )}

      {view === 'services' && !detail && (
        <div className="rw-services">
          <form className="care-panel rw-tool-box" onSubmit={saveService}>
            <h2>{editingService ? 'تعديل الخدمة' : 'إضافة خدمة'}</h2>
            <label>اسم الخدمة<input required className="care-field" value={serviceForm.title} onChange={e => setServiceForm({ ...serviceForm, title: e.target.value })} /></label>
            <label>الوصف<textarea className="care-field" rows={3} value={serviceForm.description} onChange={e => setServiceForm({ ...serviceForm, description: e.target.value })} /></label>
            <div className="rw-schedule"><label>السعر بالدينار<input className="care-field" type="number" min="0" value={serviceForm.amount_dzd} onChange={e => setServiceForm({ ...serviceForm, amount_dzd: e.target.value })} /></label><label>التصنيف<select className="care-field" value={serviceForm.category} onChange={e => setServiceForm({ ...serviceForm, category: e.target.value })}><option value="psychological">نفسي</option><option value="legal">قانوني</option><option value="social">اجتماعي</option><option value="treatment">علاجي</option></select></label></div>
            <label className="rw-check"><input type="checkbox" checked={serviceForm.is_active} onChange={e => setServiceForm({ ...serviceForm, is_active: e.target.checked })} /> خدمة متاحة لاستقبال الطلبات</label>
            <div className="rw-buttons"><button className="rw-primary" disabled={busy}>{editingService ? 'حفظ التعديلات' : 'إضافة الخدمة'}</button>{editingService && <button type="button" className="rw-secondary" onClick={() => { setEditingService(null); setServiceForm(blankService); }}>إلغاء التعديل</button>}</div>
          </form>
          <div className="rw-service-list">{loading ? <div className="rw-skeletons"><i /><i /></div> : services.length ? services.map(item => <article className="care-panel rw-service-card" key={item.id}><div className="rw-service-icon"><Stethoscope size={19} /></div><div className="rw-service-info"><h3>{item.title}</h3><p>{item.description || 'لا يوجد وصف.'}</p><div><strong>{item.amount_dzd > 0 ? money(item.amount_dzd) : 'دون مقابل'}</strong><Badge tone={item.is_active ? 'green' : 'sand'}>{item.is_active ? 'متاحة' : 'غير متاحة'}</Badge></div></div><button className="rw-secondary" onClick={() => { setEditingService(item.id); setServiceForm({ title: item.title, description: item.description || '', amount_dzd: String(item.amount_dzd), category: item.category, is_active: item.is_active }); }}>تعديل</button></article>) : <div className="rw-empty"><div><Stethoscope size={22} /></div><h3>لا توجد خدمات مسجلة</h3><p>أضف الخدمات والأسعار التي تقدمها.</p></div>}</div>
        </div>
      )}

      {view === 'team' && isFacilityManager && !detail && (
        <div className="rw-team-layout">
          <form className="care-panel rw-tool-box rw-team-add" onSubmit={addStaffMember}>
            <div className="rw-team-title"><div className="rw-service-icon"><UserPlus size={19} /></div><div><h2>ربط موظف بالمنشأة</h2><p>يجب أن يكون الحساب موجوداً ومعتمداً ضمن الكوادر المؤهلة.</p></div></div>
            <label>رقم حساب الموظف
              <input
                className="care-field"
                type="number"
                min="1"
                step="1"
                required
                inputMode="numeric"
                value={newStaffUserId}
                onChange={e => setNewStaffUserId(e.target.value)}
                placeholder="أدخل رقم الحساب"
              />
            </label>
            <p className="rw-form-note">لا توجد قائمة حسابات تجريبية. يتحقق الخادم من صلاحية الحساب قبل ربطه.</p>
            {staffError && <div className="rw-feedback error"><CircleAlert size={16} />{staffError}</div>}
            <button className="rw-primary" disabled={busy}>{busy ? 'جارٍ الربط…' : 'إضافة إلى الفريق'}</button>
          </form>

          <section className="care-panel rw-team-list">
            <div className="rw-team-list-head">
              <div><h2>الفريق المرتبط</h2><p>أعضاء هذا الحساب فقط.</p></div>
              <Badge tone="blue">{staff.length} أعضاء</Badge>
            </div>
            {staffLoading ? <div className="rw-skeletons"><i /><i /></div> : staffError && staff.length === 0 ? (
              <div className="rw-empty"><div><UsersRound size={22} /></div><h3>تعذر تحميل الفريق</h3><p>{staffError}</p><button type="button" className="rw-secondary" onClick={() => void refresh()}>إعادة المحاولة</button></div>
            ) : staff.length ? (
              <div className="rw-staff-list">
                {staff.map(member => (
                  <article className="rw-staff-row" key={member.staff_user_id}>
                    <div className="rw-staff-avatar"><UserRound size={18} /></div>
                    <div className="rw-staff-info">
                      <strong>{member.first_name} {member.last_name}</strong>
                      <span>{member.email || 'البريد غير متاح'}</span>
                      <small>{member.role_slug}</small>
                    </div>
                    <Badge tone={member.is_active ? 'green' : 'sand'}>{member.is_active ? 'نشط' : 'غير نشط'}</Badge>
                    <button type="button" className="rw-remove-staff" disabled={busy} onClick={() => void removeStaffMember(member.staff_user_id)} aria-label={`إزالة ${member.first_name} ${member.last_name}`} title="إزالة من الفريق">
                      <UserRoundX size={17} />
                    </button>
                  </article>
                ))}
              </div>
            ) : (
              <div className="rw-empty"><div><UsersRound size={22} /></div><h3>لا يوجد أعضاء مرتبطون</h3><p>أضف حساب موظف معتمداً للبدء بإسناد الطلبات إلى فريقك.</p></div>
            )}
          </section>
        </div>
      )}

      {view === 'payments' && isAdmin && !detail && (
        <section className="care-panel rw-ledger">
          <div className="rw-ledger-head"><div><h2>سجل المدفوعات</h2><p>العمليات التي أعادها النظام فقط؛ لا توجد بيانات توضيحية.</p></div><Badge tone="blue">{payments.length} عملية</Badge></div>
          {loading ? <div className="rw-skeletons"><i /><i /></div> : payments.length ? <div className="rw-table-scroll"><table><thead><tr><th>رقم العملية</th><th>العميل</th><th>مقدم الخدمة</th><th>الخدمة</th><th>المبلغ</th><th>الطريقة</th><th>Transaction ID</th><th>الحالة</th><th>الاسترداد</th><th>التاريخ</th></tr></thead><tbody>{payments.map(payment => <tr key={payment.id}><td>#{payment.id}</td><td>{payment.client_name || '—'}</td><td>{payment.provider_name || '—'}</td><td>{payment.service_title || `طلب ${payment.request_id}`}</td><td>{money(payment.amount_dzd ?? payment.amount)}</td><td>{payment.payment_method || '—'}</td><td>{payment.transaction_id || '—'}</td><td><Badge tone={payment.status === 'PAID' ? 'green' : payment.status === 'FAILED' ? 'red' : 'sand'}>{paymentText[payment.status] || payment.status}</Badge></td><td>{payment.refund_status ? <Badge tone={payment.refund_status === 'REFUNDED' ? 'green' : 'sand'}>{paymentText[payment.refund_status] || payment.refund_status}</Badge> : '—'}</td><td>{dateLabel(payment.created_at)}</td></tr>)}</tbody></table></div> : <div className="rw-empty"><div><CreditCard size={22} /></div><h3>لا توجد عمليات مدفوعات</h3><p>ستظهر العمليات الحقيقية بعد تسجيلها من بوابة الدفع.</p></div>}
        </section>
      )}

      {cancelDialogOpen && detail && (
        <div className="rw-modal-backdrop" role="presentation">
          <form className="rw-modal care-enter rw-cancel-modal" role="dialog" aria-modal="true" aria-labelledby="cancel-request-title" onSubmit={cancelCurrentRequest}>
            <div className="rw-modal-head">
              <div><span className="rw-eyebrow">تأكيد الإجراء</span><h2 id="cancel-request-title">إلغاء الطلب {detail.request.number_case || `#${detail.request.id}`}</h2></div>
              <button type="button" onClick={() => setCancelDialogOpen(false)} aria-label="إغلاق" disabled={busy}><X size={19} /></button>
            </div>
            <p className="rw-cancel-copy">سيتم إرسال طلب الإلغاء إلى الخادم. لا يمكن التراجع عن الإلغاء بعد اعتماده.</p>
            {detail.request.payment_status === 'PAID' && (
              <div className="rw-refund-note"><CreditCard size={17} /><span>سيُسجّل طلب مراجعة للاسترداد. هذه الخطوة لا تعني أن الأموال قد أُعيدت.</span></div>
            )}
            <label>سبب الإلغاء <span className="rw-optional">(اختياري)</span>
              <textarea className="care-field" rows={3} maxLength={500} value={cancelReason} onChange={e => setCancelReason(e.target.value)} placeholder="أضف سبباً يساعد فريق الدعم على معالجة الطلب." />
            </label>
            <div className="rw-buttons">
              <button className="rw-danger" disabled={busy}>{busy ? 'جارٍ إلغاء الطلب…' : 'تأكيد الإلغاء'}</button>
              <button type="button" className="rw-secondary" disabled={busy} onClick={() => setCancelDialogOpen(false)}>الاحتفاظ بالطلب</button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
};
