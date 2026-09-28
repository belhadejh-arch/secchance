import React, { useState } from 'react';
import {
  User,
  CareRequest,
  PaymentTransaction,
  Priority,
} from '../types';
import {
  User as UserIcon,
  LogOut,
  Plus,
  CreditCard,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  FolderOpen,
  ArrowUpRight,
  ShieldCheck,
  Check,
  X,
} from 'lucide-react';
import { initialUsers } from '../data/initialData';

interface PortalViewProps {
  currentUser: User;
  requests: CareRequest[];
  transactions: PaymentTransaction[];
  onSelectRequest: (request: CareRequest) => void;
  onStartPayment: (request: CareRequest) => void;
  onNewRequest: () => void;
  onAcceptRequest: (requestId: number, priority: Priority) => void;
  onRejectRequestClick: (requestId: number) => void;
  onOpenChat: (convId: number) => void;
  onLogout: () => void;
}

export const PortalView: React.FC<PortalViewProps> = ({
  currentUser,
  requests,
  transactions,
  onSelectRequest,
  onStartPayment,
  onNewRequest,
  onAcceptRequest,
  onRejectRequestClick,
  onLogout,
}) => {
  const [providerTab, setProviderTab] = useState<'waiting' | 'active'>('waiting');
  const [adminTab, setAdminTab] = useState<'requests' | 'payments'>('requests');

  const getRoleTitle = (slug: string) => {
    switch (slug) {
      case 'family':
        return 'ولي أمر / باحث عن مرافقة وخدمات';
      case 'patient':
        return 'مستفيد / متعافٍ';
      case 'psychologist':
        return 'أخصائي نفسي عيادي معتمد';
      case 'lawyer':
        return 'مستشار قانوني ومحامٍ';
      case 'treatment_center':
        return 'مركز علاج الإدمان';
      case 'clinic':
        return 'العيادة الطبية المتخصصة الشفاء';
      case 'association':
        return 'جمعية خيرية ومرافقة اجتماعية';
      case 'admin':
        return 'إدارة المنصة المركزية';
      default:
        return 'مستخدم مسجل';
    }
  };

  const getPriorityBadge = (prio: Priority) => {
    switch (prio) {
      case 'Critical':
        return { text: 'عاجلة جداً', color: 'bg-red-100 text-red-800 border-red-200' };
      case 'High':
        return { text: 'عاجلة', color: 'bg-amber-100 text-amber-800 border-amber-200' };
      case 'Medium':
        return { text: 'متوسطة', color: 'bg-blue-100 text-blue-800 border-blue-200' };
      default:
        return { text: 'عادية', color: 'bg-slate-100 text-slate-800 border-slate-200' };
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'NEW':
      case 'PENDING_PROVIDER':
        return { text: 'في انتظار مقدم الخدمة', color: 'bg-amber-100 text-amber-900 border-amber-200' };
      case 'ACCEPTED':
      case 'WAITING_PAYMENT':
        return { text: 'مقبول — بانتظار الدفع', color: 'bg-blue-100 text-blue-900 border-blue-200' };
      case 'PAID':
      case 'APPOINTMENT_CONFIRMED':
        return { text: 'مدفوع وموعد مؤكد', color: 'bg-emerald-100 text-emerald-900 border-emerald-200' };
      case 'IN_PROGRESS':
        return { text: 'المتابعة جارية', color: 'bg-indigo-100 text-indigo-900 border-indigo-200' };
      case 'COMPLETED':
        return { text: 'مكتملة', color: 'bg-emerald-100 text-emerald-900 border-emerald-200' };
      case 'REJECTED':
        return { text: 'مرفوض', color: 'bg-red-100 text-red-900 border-red-200' };
      default:
        return { text: status, color: 'bg-slate-100 text-slate-800 border-slate-200' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-13 h-13 rounded-2xl bg-blue-100 text-blue-800 flex items-center justify-center shrink-0">
            <UserIcon className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-extrabold text-slate-900 text-base sm:text-lg">
              {currentUser.firstName} {currentUser.lastName}
            </h2>
            <p className="text-xs font-bold text-blue-700">
              {getRoleTitle(currentUser.roleSlug)}
            </p>
            <p className="text-[11px] text-slate-500">
              الولاية: {currentUser.wilayaName || 'الجزائر العاصمة'}
            </p>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="p-2.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 transition-colors flex items-center gap-1.5 text-xs font-bold"
          title="تسجيل الخروج"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">خروج</span>
        </button>
      </div>

      {/* VIEW FOR FAMILY / PATIENT */}
      {(currentUser.roleSlug === 'family' || currentUser.roleSlug === 'patient') && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-black text-slate-900 text-base">
                طلباتي ومتابعاتي (My Requests)
              </h3>
              <p className="text-xs text-slate-500">
                متابعة حالة استشاراتك، إتمام الدفع بالذهبية، وتأكيد المواعيد
              </p>
            </div>
            <button
              onClick={onNewRequest}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>طلب خدمة جديد</span>
            </button>
          </div>

          {requests.filter((r) => r.clientId === currentUser.id).length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3">
              <FolderOpen className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-700">ليس لديك أي طلبات حالية</p>
              <button
                onClick={onNewRequest}
                className="px-4 py-2 rounded-xl bg-blue-700 text-white text-xs font-bold shadow-xs"
              >
                ابدأ بطلب استشارة أو خدمة
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {requests
                .filter((r) => r.clientId === currentUser.id)
                .map((req) => {
                  const prioBadge = getPriorityBadge(req.priority);
                  const statusBadge = getStatusBadge(req.status);
                  const canPay =
                    (req.status === 'ACCEPTED' || req.status === 'WAITING_PAYMENT') &&
                    req.paymentStatus === 'PENDING';

                  return (
                    <div
                      key={req.id}
                      className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-blue-300 transition-all space-y-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-extrabold text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                          {req.caseNumber}
                        </span>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[11px] font-bold px-2.5 py-0.5 rounded-md border ${prioBadge.color}`}
                          >
                            الأولوية: {prioBadge.text}
                          </span>
                          <span
                            className={`text-[11px] font-bold px-2.5 py-0.5 rounded-md border ${statusBadge.color}`}
                          >
                            {statusBadge.text}
                          </span>
                        </div>
                      </div>

                      <div
                        onClick={() => onSelectRequest(req)}
                        className="cursor-pointer group"
                      >
                        <h4 className="font-bold text-sm sm:text-base text-slate-900 group-hover:text-blue-700 transition-colors">
                          {req.serviceTitle}
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          مقدم الخدمة: {req.providerName} | الولاية: {req.wilayaName}
                        </p>
                        <p className="text-xs text-slate-600 line-clamp-2 mt-2 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          {req.description}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center justify-between pt-2 border-t border-slate-100 gap-2">
                        <div className="text-xs font-semibold text-slate-600">
                          المبلغ:{' '}
                          <span className="font-black text-emerald-700 text-sm">
                            {req.amountDzd.toLocaleString()} دج
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {canPay && (
                            <button
                              onClick={() => onStartPayment(req)}
                              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                              <span>الدفع الآن (الذهبية / CIB)</span>
                            </button>
                          )}
                          <button
                            onClick={() => onSelectRequest(req)}
                            className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors"
                          >
                            عرض التفاصيل والتقارير
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* VIEW FOR PROVIDERS */}
      {currentUser.roleSlug in
        { psychologist: 1, lawyer: 1, treatment_center: 1, clinic: 1, association: 1 } && (
        <div className="space-y-4">
          {/* Provider Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
            <button
              onClick={() => setProviderTab('waiting')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 ${
                providerTab === 'waiting'
                  ? 'bg-blue-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <span>الطلبات في انتظارك</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">
                {
                  requests.filter(
                    (r) =>
                      r.providerId === currentUser.id &&
                      (r.status === 'PENDING_PROVIDER' || r.status === 'NEW')
                  ).length
                }
              </span>
            </button>

            <button
              onClick={() => setProviderTab('active')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 ${
                providerTab === 'active'
                  ? 'bg-blue-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <span>الحالات والمتابعات الجارية</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">
                {
                  requests.filter(
                    (r) =>
                      r.providerId === currentUser.id &&
                      r.status !== 'PENDING_PROVIDER' &&
                      r.status !== 'NEW' &&
                      r.status !== 'REJECTED'
                  ).length
                }
              </span>
            </button>
          </div>

          {/* Tab 1: Waiting for Acceptance */}
          {providerTab === 'waiting' && (
            <div className="space-y-3">
              {requests.filter(
                (r) =>
                  r.providerId === currentUser.id &&
                  (r.status === 'PENDING_PROVIDER' || r.status === 'NEW')
              ).length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-xs text-slate-500 font-medium">
                  لا توجد طلبات جديدة في الانتظار حالياً.
                </div>
              ) : (
                requests
                  .filter(
                    (r) =>
                      r.providerId === currentUser.id &&
                      (r.status === 'PENDING_PROVIDER' || r.status === 'NEW')
                  )
                  .map((req) => (
                    <div
                      key={req.id}
                      className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                          {req.caseNumber}
                        </span>
                        <span className="text-xs font-bold text-slate-800">
                          العميل: {req.clientName}
                        </span>
                      </div>

                      <h4 className="font-bold text-sm sm:text-base text-slate-900">
                        {req.serviceTitle}
                      </h4>

                      <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                        {req.description}
                      </p>

                      <div className="flex items-center justify-between text-xs pt-1">
                        <span className="text-slate-500">
                          الولاية: {req.wilayaName} | الأولوية:{' '}
                          <span className="font-bold">{req.priority}</span>
                        </span>
                        <span className="font-bold text-emerald-700">
                          {req.amountDzd.toLocaleString()} دج
                        </span>
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                        <button
                          onClick={() => onAcceptRequest(req.id, req.priority)}
                          className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5"
                        >
                          <Check className="w-4 h-4" />
                          <span>قبول الطلب</span>
                        </button>
                        <button
                          onClick={() => onRejectRequestClick(req.id)}
                          className="flex-1 py-2 px-3 rounded-xl border border-red-300 text-red-600 hover:bg-red-50 font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
                        >
                          <X className="w-4 h-4" />
                          <span>رفض الطلب</span>
                        </button>
                      </div>
                    </div>
                  ))
              )}
            </div>
          )}

          {/* Tab 2: Active Cases */}
          {providerTab === 'active' && (
            <div className="space-y-3">
              {requests
                .filter(
                  (r) =>
                    r.providerId === currentUser.id &&
                    r.status !== 'PENDING_PROVIDER' &&
                    r.status !== 'NEW' &&
                    r.status !== 'REJECTED'
                )
                .map((req) => (
                  <div
                    key={req.id}
                    onClick={() => onSelectRequest(req)}
                    className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-blue-300 cursor-pointer space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-blue-700">
                        {req.caseNumber}
                      </span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-blue-50 text-blue-800">
                        الحالة: {req.status}
                      </span>
                    </div>

                    <h4 className="font-bold text-sm text-slate-900">
                      {req.serviceTitle}
                    </h4>

                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>العميل: {req.clientName}</span>
                      <span>موعد الجلسة: {req.appointmentDate || 'لم يحدد بعد'}</span>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* VIEW FOR ADMIN */}
      {currentUser.roleSlug === 'admin' && (
        <div className="space-y-5">
          <div>
            <h3 className="font-black text-slate-900 text-base sm:text-lg">
              لوحة الإدارة والتحكم الشامل
            </h3>
            <p className="text-xs text-slate-500">
              إحصائيات المنصة، سجل الطلبات، ومتابعة المعاملات المالية المعتمدة
            </p>
          </div>

          {/* Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 text-center shadow-xs">
              <span className="text-xs text-slate-500 font-medium">المستخدمون</span>
              <p className="text-xl font-black text-blue-700 mt-1">
                {initialUsers.length}
              </p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 text-center shadow-xs">
              <span className="text-xs text-slate-500 font-medium">إجمالي الطلبات</span>
              <p className="text-xl font-black text-blue-700 mt-1">
                {requests.length}
              </p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 text-center shadow-xs">
              <span className="text-xs text-slate-500 font-medium">المدفوعات الناجحة</span>
              <p className="text-xl font-black text-emerald-700 mt-1">
                {transactions.filter((t) => t.status === 'SUCCESSFUL').length}
              </p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 text-center shadow-xs">
              <span className="text-xs text-slate-500 font-medium">إجمالي الإيرادات</span>
              <p className="text-xl font-black text-emerald-700 mt-1">
                {transactions
                  .filter((t) => t.status === 'SUCCESSFUL')
                  .reduce((acc, curr) => acc + curr.amountDzd, 0)
                  .toLocaleString()}{' '}
                دج
              </p>
            </div>
          </div>

          {/* Admin Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
            <button
              onClick={() => setAdminTab('requests')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
                adminTab === 'requests'
                  ? 'bg-blue-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              إدارة الطلبات ({requests.length})
            </button>
            <button
              onClick={() => setAdminTab('payments')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
                adminTab === 'payments'
                  ? 'bg-blue-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              إدارة المدفوعات والبطاقات ({transactions.length})
            </button>
          </div>

          {adminTab === 'requests' ? (
            <div className="space-y-3">
              {requests.map((req) => (
                <div
                  key={req.id}
                  onClick={() => onSelectRequest(req)}
                  className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:border-blue-300 cursor-pointer space-y-1.5"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-extrabold text-blue-700">{req.caseNumber}</span>
                    <span className="font-bold text-slate-700">الحالة: {req.status}</span>
                  </div>
                  <h4 className="font-bold text-sm text-slate-900">{req.serviceTitle}</h4>
                  <p className="text-xs text-slate-500">
                    العميل: {req.clientName} | المزود: {req.providerName} | المبلغ: {req.amountDzd} دج
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((txn) => (
                <div
                  key={txn.id}
                  className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-extrabold text-blue-700">{txn.paymentId}</span>
                    <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                      {txn.status}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-slate-900">{txn.serviceTitle}</p>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>
                      {txn.clientName} ← {txn.providerName} ({txn.paymentMethod})
                    </span>
                    <span className="font-black text-slate-900">
                      {txn.amountDzd.toLocaleString()} دج
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
