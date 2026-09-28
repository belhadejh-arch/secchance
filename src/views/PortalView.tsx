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
  Check,
  X,
  FolderOpen,
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

  const getPriorityText = (prio: Priority) => {
    switch (prio) {
      case 'Critical':
        return '🔴 عاجلة جداً';
      case 'High':
        return '🟠 عاجلة';
      case 'Medium':
        return '🟡 متوسطة';
      default:
        return '🟢 عادية';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'NEW':
      case 'PENDING_PROVIDER':
        return 'في انتظار مقدم الخدمة';
      case 'ACCEPTED':
      case 'WAITING_PAYMENT':
        return 'مقبول - بانتظار الدفع';
      case 'PAID':
      case 'APPOINTMENT_CONFIRMED':
        return 'مدفوع وموعد مؤكد';
      case 'IN_PROGRESS':
        return 'المتابعة جارية';
      case 'COMPLETED':
        return 'مكتملة';
      case 'REJECTED':
        return 'مرفوض';
      default:
        return status;
    }
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* Profile Header */}
      <div className="bg-[#FBFDFC] rounded-[20px] p-5 border border-[#E5ECE9] shadow-xs flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-[54px] h-[54px] rounded-[16px] bg-[#EAF3F8] text-[#1766A6] flex items-center justify-center shrink-0">
            <UserIcon className="w-7 h-7" />
          </div>
          <div>
            <h2 className="font-black text-[18px] text-[#203945]">
              {currentUser.firstName} {currentUser.lastName}
            </h2>
            <p className="text-[12px] font-semibold text-[#1766A6]">
              {getRoleTitle(currentUser.roleSlug)}
            </p>
            <p className="text-[11px] text-[#203945]/60">
              الولاية: {currentUser.wilayaName || 'الجزائر العاصمة'}
            </p>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="p-2.5 rounded-xl text-[#A64842] hover:bg-[#FBECEB] transition-colors"
          title="خروج"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>

      {/* ROLE 1: FAMILY / PATIENT */}
      {(currentUser.roleSlug === 'family' || currentUser.roleSlug === 'patient') && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-[16px] font-bold text-[#203945]">
              طلباتي ومتابعاتي (My Requests)
            </h3>
            <button
              onClick={onNewRequest}
              className="flex items-center gap-1 px-3 py-1.5 rounded-[10px] bg-[#1766A6] text-white text-[11px] font-bold shadow-xs transition-colors hover:bg-[#125386]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>طلب خدمة جديد</span>
            </button>
          </div>

          {requests.filter((r) => r.clientId === currentUser.id).length === 0 ? (
            <div className="bg-[#FBFDFC] rounded-[16px] border border-[#E5ECE9] p-7 text-center space-y-2">
              <FolderOpen className="w-9 h-9 text-[#1766A6] mx-auto" />
              <p className="font-bold text-sm text-[#203945]">ليس لديك أي طلبات حالية</p>
              <button
                onClick={onNewRequest}
                className="px-4 py-2 rounded-xl bg-[#1766A6] text-white text-xs font-bold shadow-xs"
              >
                ابدأ بطلب استشارة أو خدمة
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {requests
                .filter((r) => r.clientId === currentUser.id)
                .map((req) => {
                  const canPay =
                    (req.status === 'ACCEPTED' || req.status === 'WAITING_PAYMENT') &&
                    req.paymentStatus === 'PENDING';

                  return (
                    <div
                      key={req.id}
                      onClick={() => onSelectRequest(req)}
                      className="bg-[#FBFDFC] rounded-[16px] border border-[#E5ECE9] p-4 shadow-xs hover:border-[#1766A6]/40 cursor-pointer transition-all space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[11px] text-[#1766A6]">
                          {req.caseNumber}
                        </span>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-[8px] ${
                            req.priority === 'Critical' || req.priority === 'High'
                              ? 'bg-[#FBECEB] text-[#5F1D1A]'
                              : 'bg-[#E8F4EF] text-[#1A5E4D]'
                          }`}
                        >
                          الأولوية: {getPriorityText(req.priority)}
                        </span>
                      </div>

                      <h4 className="font-bold text-[15px] text-[#203945]">
                        {req.serviceTitle}
                      </h4>

                      <p className="text-[12px] text-[#203945]/70">
                        مقدم الخدمة: {req.providerName} | الولاية: {req.wilayaName}
                      </p>

                      <div className="flex items-center justify-between pt-1">
                        <span
                          className={`text-[11px] font-bold px-2 py-1 rounded-[8px] ${
                            req.status === 'ACCEPTED' || req.status === 'WAITING_PAYMENT'
                              ? 'bg-[#EAF3F8] text-[#104A78]'
                              : req.status === 'PAID' || req.status === 'APPOINTMENT_CONFIRMED'
                              ? 'bg-[#E8F4EF] text-[#1A5E4D]'
                              : req.status === 'REJECTED'
                              ? 'bg-[#FBECEB] text-[#5F1D1A]'
                              : 'bg-[#E5ECE9] text-[#203945]'
                          }`}
                        >
                          الحالة: {getStatusText(req.status)}
                        </span>

                        <span className="font-black text-[14px] text-[#25866D]">
                          {req.amountDzd.toLocaleString()} دج
                        </span>
                      </div>

                      {canPay && (
                        <div className="pt-1.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => onStartPayment(req)}
                            className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-[10px] bg-[#25866D] hover:bg-[#1e6c58] text-white font-bold text-[12px] shadow-xs transition-colors"
                          >
                            <CreditCard className="w-4 h-4" />
                            <span>الدفع الآن (البطاقة الذهبية / CIB)</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* ROLE 2: PROVIDERS */}
      {currentUser.roleSlug in
        { psychologist: 1, lawyer: 1, treatment_center: 1, clinic: 1, association: 1 } && (
        <div className="space-y-3">
          {/* Tabs */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setProviderTab('waiting')}
              className={`py-2 px-3 rounded-[10px] text-[11px] font-bold transition-colors ${
                providerTab === 'waiting'
                  ? 'bg-[#1766A6] text-white'
                  : 'bg-[#E5ECE9] text-[#203945] hover:bg-[#d8e1de]'
              }`}
            >
              الطلبات في انتظارك (
              {
                requests.filter(
                  (r) =>
                    r.providerId === currentUser.id &&
                    (r.status === 'PENDING_PROVIDER' || r.status === 'NEW')
                ).length
              }
              )
            </button>
            <button
              onClick={() => setProviderTab('active')}
              className={`py-2 px-3 rounded-[10px] text-[11px] font-bold transition-colors ${
                providerTab === 'active'
                  ? 'bg-[#1766A6] text-white'
                  : 'bg-[#E5ECE9] text-[#203945] hover:bg-[#d8e1de]'
              }`}
            >
              الحالات الجارية (
              {
                requests.filter(
                  (r) =>
                    r.providerId === currentUser.id &&
                    r.status !== 'PENDING_PROVIDER' &&
                    r.status !== 'NEW' &&
                    r.status !== 'REJECTED'
                ).length
              }
              )
            </button>
          </div>

          {providerTab === 'waiting' ? (
            <div className="space-y-3">
              <h3 className="text-[15px] font-bold text-[#A64842]">
                الطلبات في انتظارك ⑥
              </h3>

              {requests.filter(
                (r) =>
                  r.providerId === currentUser.id &&
                  (r.status === 'PENDING_PROVIDER' || r.status === 'NEW')
              ).length === 0 ? (
                <p className="text-[12px] text-[#203945]/60 py-4 text-center">
                  لا توجد طلبات جديدة في الانتظار حالياً.
                </p>
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
                      className="bg-[#FBFDFC] rounded-[16px] border border-[#E5ECE9] p-4 shadow-xs space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[11px] text-[#1766A6]">
                          {req.caseNumber}
                        </span>
                        <span className="font-bold text-[12px] text-[#203945]">
                          العميل: {req.clientName}
                        </span>
                      </div>

                      <h4 className="font-bold text-[15px] text-[#203945]">
                        {req.serviceTitle}
                      </h4>

                      <p className="text-[12px] text-[#203945]/80 line-clamp-2 leading-relaxed">
                        {req.description}
                      </p>

                      <div className="flex items-center gap-2 pt-2 border-t border-[#E5ECE9]">
                        <button
                          onClick={() => onAcceptRequest(req.id, req.priority)}
                          className="flex-1 flex items-center justify-center gap-1 py-2 px-3 rounded-[10px] bg-[#1766A6] text-white font-bold text-[12px] hover:bg-[#125386] transition-colors"
                        >
                          <Check className="w-4 h-4" />
                          <span>قبول الطلب</span>
                        </button>
                        <button
                          onClick={() => onRejectRequestClick(req.id)}
                          className="flex-1 flex items-center justify-center gap-1 py-2 px-3 rounded-[10px] border border-[#A64842] text-[#A64842] hover:bg-[#FBECEB] font-bold text-[12px] transition-colors"
                        >
                          <X className="w-4 h-4" />
                          <span>رفض الطلب</span>
                        </button>
                      </div>
                    </div>
                  ))
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <h3 className="text-[15px] font-bold text-[#203945]">
                الحالات والمتابعات المقبولة والجارية
              </h3>

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
                    className="bg-[#FBFDFC] rounded-[16px] border border-[#E5ECE9] p-4 shadow-xs hover:border-[#1766A6]/40 cursor-pointer transition-all space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[11px] text-[#1766A6]">
                        {req.caseNumber}
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-[8px] bg-[#EAF3F8] text-[#104A78]">
                        {req.status}
                      </span>
                    </div>
                    <h4 className="font-bold text-[14px] text-[#203945]">
                      {req.serviceTitle}
                    </h4>
                    <p className="text-[12px] text-[#203945]/70">
                      العميل: {req.clientName} | الموعد: {req.appointmentDate || 'لم يحدد بعد'}
                    </p>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* ROLE 3: ADMIN */}
      {currentUser.roleSlug === 'admin' && (
        <div className="space-y-3">
          <h3 className="text-[18px] font-black text-[#203945]">
            لوحة الإدارة والتحكم الشامل
          </h3>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-[#FBFDFC] p-3 rounded-[14px] border border-[#E5ECE9] text-center">
              <span className="text-[10px] text-[#203945]/70 block">إجمالي المستخدمين</span>
              <span className="text-[16px] font-black text-[#1766A6]">
                {initialUsers.length}
              </span>
            </div>
            <div className="bg-[#FBFDFC] p-3 rounded-[14px] border border-[#E5ECE9] text-center">
              <span className="text-[10px] text-[#203945]/70 block">الطلبات</span>
              <span className="text-[16px] font-black text-[#1766A6]">
                {requests.length}
              </span>
            </div>
            <div className="bg-[#FBFDFC] p-3 rounded-[14px] border border-[#E5ECE9] text-center">
              <span className="text-[10px] text-[#203945]/70 block">المدفوعات</span>
              <span className="text-[16px] font-black text-[#1766A6]">
                {transactions.length}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="bg-[#FBFDFC] p-3 rounded-[14px] border border-[#E5ECE9] text-center">
              <span className="text-[10px] text-[#203945]/70 block">إجمالي الإيرادات</span>
              <span className="text-[16px] font-black text-[#1766A6]">
                {transactions
                  .filter((t) => t.status === 'SUCCESSFUL')
                  .reduce((acc, curr) => acc + curr.amountDzd, 0)
                  .toLocaleString()}{' '}
                دج
              </span>
            </div>
            <div className="bg-[#FBFDFC] p-3 rounded-[14px] border border-[#E5ECE9] text-center">
              <span className="text-[10px] text-[#203945]/70 block">المواعيد المؤكدة</span>
              <span className="text-[16px] font-black text-[#1766A6]">
                {requests.filter((r) => r.status === 'APPOINTMENT_CONFIRMED').length}
              </span>
            </div>
          </div>

          {/* Admin Tabs */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={() => setAdminTab('requests')}
              className={`py-2 px-3 rounded-[10px] text-[11px] font-bold transition-colors ${
                adminTab === 'requests'
                  ? 'bg-[#1766A6] text-white'
                  : 'bg-[#E5ECE9] text-[#203945]'
              }`}
            >
              إدارة الطلبات
            </button>
            <button
              onClick={() => setAdminTab('payments')}
              className={`py-2 px-3 rounded-[10px] text-[11px] font-bold transition-colors ${
                adminTab === 'payments'
                  ? 'bg-[#1766A6] text-white'
                  : 'bg-[#E5ECE9] text-[#203945]'
              }`}
            >
              إدارة المدفوعات
            </button>
          </div>

          {adminTab === 'requests' ? (
            <div className="space-y-2 pt-1">
              <h4 className="text-[14px] font-bold text-[#203945]">جميع طلبات المنصة</h4>
              {requests.map((req) => (
                <div
                  key={req.id}
                  onClick={() => onSelectRequest(req)}
                  className="bg-[#FBFDFC] p-3 rounded-[14px] border border-[#E5ECE9] cursor-pointer space-y-1"
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-[#1766A6]">{req.caseNumber}</span>
                    <span className="text-[#203945] font-semibold">{req.status}</span>
                  </div>
                  <p className="font-bold text-[13px] text-[#203945]">{req.serviceTitle}</p>
                  <p className="text-[11px] text-[#203945]/70">
                    العميل: {req.clientName} | مقدم الخدمة: {req.providerName}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2 pt-1">
              <h4 className="text-[14px] font-bold text-[#203945]">
                سجل المعاملات والمدفوعات الإلكترونية
              </h4>
              {transactions.map((txn) => (
                <div
                  key={txn.id}
                  className="bg-[#FBFDFC] p-3 rounded-[12px] border border-[#E5ECE9] space-y-1"
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-[#1766A6]">{txn.paymentId}</span>
                    <span className="bg-[#E8F4EF] text-[#1A5E4D] px-2 py-0.5 rounded-[6px] font-bold text-[10px]">
                      {txn.status}
                    </span>
                  </div>
                  <p className="text-[12px] font-semibold text-[#203945]">{txn.serviceTitle}</p>
                  <p className="text-[11px] text-[#203945]/70">
                    العميل: {txn.clientName} | مقدم الخدمة: {txn.providerName}
                  </p>
                  <div className="flex items-center justify-between text-[11px] pt-1">
                    <span className="font-bold text-[#25866D]">
                      المبلغ: {txn.amountDzd} دج ({txn.paymentMethod})
                    </span>
                    <span className="text-[#203945]/50 text-[10px]">{txn.createdAt}</span>
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
