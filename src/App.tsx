import React, { useState, useEffect } from 'react';
import {
  User,
  CareRequest,
  PaymentTransaction,
  SpecialistReport,
  Appointment,
  Conversation,
  Message,
  ServiceItem,
  Priority,
  AuditLogEntry,
  PartnerOrganization,
  TreatmentFollowUp,
  PlatformNotification,
} from './types';
import {
  initialUsers,
  initialServices,
  initialConversations,
  initialMessages,
} from './data/initialData';

import {
  initializeDatabase,
  subscribeToUsers,
  subscribeToCareRequests,
  subscribeToAppointments,
  subscribeToSpecialistReports,
  subscribeToPaymentTransactions,
  subscribeToAuditLogs,
  subscribeToPartners,
  subscribeToTreatmentFollowUps,
  subscribeToNotifications,
  createCareRequestInDb,
  updateCareRequestInDb,
  createPaymentTransactionInDb,
  createAppointmentInDb,
  addSpecialistReportInDb,
  initialPartners,
} from './services/dbService';

import { Navbar } from './components/Navbar';
import { BottomNavigator } from './components/BottomNavigator';
import { AuthModal } from './components/AuthModal';
import { AITriageModal } from './components/AITriageModal';
import { RejectionModal } from './components/RejectionModal';

import { LandingView } from './views/LandingView';
import { ServicesView } from './views/ServicesView';
import { NewRequestView } from './views/NewRequestView';
import { PortalView } from './views/PortalView';
import { CaseDetailView } from './views/CaseDetailView';
import { PaymentView } from './views/PaymentView';
import { AppointmentsView } from './views/AppointmentsView';
import { ChatView } from './views/ChatView';
import { DirectoryView } from './views/DirectoryView';
import { AwarenessView } from './views/AwarenessView';
import { EmergencyView } from './views/EmergencyView';
import { LegalAssistanceView } from './views/LegalAssistanceView';
import { AdminDashboardView } from './views/AdminDashboardView';
import { SpecialistDashboardView } from './views/SpecialistDashboardView';

export function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(initialUsers[0]);
  const [currentView, setCurrentView] = useState<string>('landing');

  // Database-backed state
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [services] = useState<ServiceItem[]>(initialServices);
  const [careRequests, setCareRequests] = useState<CareRequest[]>([]);
  const [paymentTransactions, setPaymentTransactions] = useState<PaymentTransaction[]>([]);
  const [specialistReports, setSpecialistReports] = useState<SpecialistReport[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [partners, setPartners] = useState<PartnerOrganization[]>(initialPartners);
  const [followUps, setFollowUps] = useState<TreatmentFollowUp[]>([]);
  const [notifications, setNotifications] = useState<PlatformNotification[]>([]);
  const [conversations] = useState<Conversation[]>(initialConversations);
  const [messagesMap, setMessagesMap] = useState<Record<number, Message[]>>(initialMessages);

  const [selectedRequest, setSelectedRequest] = useState<CareRequest | null>(null);
  const [paymentTargetRequest, setPaymentTargetRequest] = useState<CareRequest | null>(null);
  const [preselectedServiceId, setPreselectedServiceId] = useState<number | undefined>(undefined);

  // Modals
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [rejectionTargetId, setRejectionTargetId] = useState<number | string | null>(null);

  // Real-time Database initialization and subscriptions
  useEffect(() => {
    initializeDatabase().catch(console.error);

    const unsubUsers = subscribeToUsers((data) => {
      if (data.length > 0) setUsers(data);
    });

    const unsubRequests = subscribeToCareRequests((data) => {
      setCareRequests(data);
    });

    const unsubAppts = subscribeToAppointments((data) => {
      setAppointments(data);
    });

    const unsubReports = subscribeToSpecialistReports((data) => {
      setSpecialistReports(data);
    });

    const unsubPayments = subscribeToPaymentTransactions((data) => {
      setPaymentTransactions(data);
    });

    const unsubAudit = subscribeToAuditLogs((data) => {
      setAuditLogs(data);
    });

    const unsubPartners = subscribeToPartners((data) => {
      if (data.length > 0) setPartners(data);
    });

    const unsubFollowUps = subscribeToTreatmentFollowUps((data) => {
      setFollowUps(data);
    });

    const unsubNotifs = subscribeToNotifications((data) => {
      setNotifications(data);
    });

    return () => {
      unsubUsers();
      unsubRequests();
      unsubAppts();
      unsubReports();
      unsubPayments();
      unsubAudit();
      unsubPartners();
      unsubFollowUps();
      unsubNotifs();
    };
  }, []);

  // Restore remember-me user if available
  useEffect(() => {
    const savedUserId = localStorage.getItem('secchance_user_id');
    if (savedUserId && users.length > 0) {
      const found = users.find((u) => String(u.id) === savedUserId);
      if (found) {
        setCurrentUser(found);
      }
    }
  }, [users]);

  // Navigation handlers
  const handleNavigate = (view: string) => {
    // RBAC Security Gate: prevent unauthorized access to dashboards
    if (view === 'admin-dashboard' && currentUser?.roleSlug !== 'admin') {
      setCurrentView('portal');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (
      view === 'specialist-dashboard' &&
      !['psychologist', 'doctor', 'lawyer', 'legal_advisor', 'clinic', 'hospital', 'association', 'treatment_center', 'admin'].includes(
        currentUser?.roleSlug || ''
      )
    ) {
      setCurrentView('portal');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectRequest = (req: CareRequest) => {
    setSelectedRequest(req);
    handleNavigate('case-detail');
  };

  const handleStartPayment = (req: CareRequest) => {
    setPaymentTargetRequest(req);
    handleNavigate('payment');
  };

  const handleRequestService = (service: ServiceItem) => {
    setPreselectedServiceId(service.id);
    if (!currentUser) {
      setIsAuthOpen(true);
    } else {
      handleNavigate('new-request');
    }
  };

  const handleNewCaseCTA = () => {
    if (!currentUser) {
      setIsAuthOpen(true);
    } else {
      handleNavigate('new-request');
    }
  };

  // Login handler with RBAC auto-routing
  const handleLogin = (user: User) => {
    setCurrentUser(user);
    if (user.roleSlug === 'admin') {
      handleNavigate('admin-dashboard');
    } else if (
      ['psychologist', 'doctor', 'lawyer', 'legal_advisor', 'clinic', 'hospital', 'association', 'treatment_center'].includes(
        user.roleSlug
      )
    ) {
      handleNavigate('specialist-dashboard');
    } else {
      handleNavigate('portal');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('secchance_user_id');
    setCurrentUser(null);
    handleNavigate('landing');
  };

  // Request creation in real database
  const handleCreateRequest = async (
    serviceId: number,
    priority: Priority,
    wilaya: string,
    description: string
  ) => {
    if (!currentUser) return;
    const service = services.find((s) => s.id === serviceId) || services[0];
    const newCaseNo = `SC-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const newReqData: Omit<CareRequest, 'id'> = {
      caseNumber: newCaseNo,
      clientId: currentUser.id,
      clientName: `${currentUser.firstName} ${currentUser.lastName}`,
      providerId: service.providerId,
      providerName: service.providerName,
      serviceId: service.id,
      serviceTitle: service.title,
      category: service.category,
      amountDzd: service.amountDzd,
      priority,
      status: 'PENDING_PROVIDER',
      rejectionReason: null,
      paymentStatus: service.amountDzd > 0 ? 'PENDING' : 'NOT_REQUIRED',
      wilayaName: wilaya,
      description,
      createdAt: new Date().toLocaleDateString('ar-DZ'),
    };

    const saved = await createCareRequestInDb(newReqData);
    setSelectedRequest(saved);
    handleNavigate('portal');
  };

  const handleCreateLegalCase = async (data: {
    serviceId: number;
    caseType: string;
    description: string;
    wilaya: string;
    lawyerId: number;
    attachedDocs: string[];
    priority: Priority;
  }) => {
    if (!currentUser) return;
    const lawyer = users.find((u) => u.id === data.lawyerId) || initialUsers[2];
    const service = services.find((s) => s.id === data.serviceId) || services[1];
    const newCaseNo = `SC-LEG-${Math.floor(1000 + Math.random() * 9000)}`;

    const newReqData: Omit<CareRequest, 'id'> = {
      caseNumber: newCaseNo,
      clientId: currentUser.id,
      clientName: `${currentUser.firstName} ${currentUser.lastName}`,
      providerId: lawyer.id,
      providerName: `${lawyer.firstName} ${lawyer.lastName}`,
      serviceId: service.id,
      serviceTitle: `${service.title} (${data.caseType})`,
      category: 'استشارة ومرافقة قانونية',
      amountDzd: service.amountDzd,
      priority: data.priority,
      status: 'PENDING_PROVIDER',
      rejectionReason: null,
      paymentStatus: 'PENDING',
      wilayaName: data.wilaya,
      description: data.description,
      caseType: data.caseType,
      attachedDocuments: data.attachedDocs,
      createdAt: new Date().toLocaleDateString('ar-DZ'),
    };

    const saved = await createCareRequestInDb(newReqData);
    setSelectedRequest(saved);
    handleNavigate('portal');
  };

  // Provider status updates
  const handleAcceptRequest = async (requestId: number | string) => {
    await updateCareRequestInDb(requestId, { status: 'ACCEPTED' }, currentUser?.firstName || 'المختص');
  };

  const handleConfirmReject = async (reason: string) => {
    if (!rejectionTargetId) return;
    await updateCareRequestInDb(
      rejectionTargetId,
      { status: 'REJECTED', rejectionReason: reason },
      currentUser?.firstName || 'المختص'
    );
    setRejectionTargetId(null);
  };

  // Payment processing in database
  const handleProcessPayment = async (requestId: number | string, paymentMethod: 'EDAHABIA' | 'CIB') => {
    const targetReq = careRequests.find((r) => String(r.id) === String(requestId));
    if (!targetReq) return;

    const txnId = `TXN-${Math.floor(100000 + Math.random() * 900000)}`;
    const payId = `PAY-${targetReq.caseNumber.replace('SC-', '')}-DZ`;
    const orderId = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;

    const newTxnData: Omit<PaymentTransaction, 'id'> = {
      paymentId: payId,
      orderId,
      clientId: targetReq.clientId,
      clientName: targetReq.clientName,
      providerId: targetReq.providerId,
      providerName: targetReq.providerName,
      serviceTitle: targetReq.serviceTitle,
      amountDzd: targetReq.amountDzd,
      currency: 'DZD',
      paymentMethod,
      transactionId: txnId,
      status: 'SUCCESSFUL',
      createdAt: new Date().toLocaleDateString('ar-DZ'),
      paidAt: new Date().toLocaleString('ar-DZ'),
    };

    await createPaymentTransactionInDb(newTxnData);

    await updateCareRequestInDb(targetReq.id, {
      status: 'APPOINTMENT_CONFIRMED',
      paymentStatus: 'PAID',
      appointmentDate: '2026-10-05',
      appointmentTime: '11:00 صباحاً',
    });

    await createAppointmentInDb({
      caseNumber: targetReq.caseNumber,
      clientId: targetReq.clientId,
      clientName: targetReq.clientName,
      specialistId: targetReq.providerId,
      specialistName: targetReq.providerName,
      specialty: targetReq.serviceTitle,
      date: '2026-10-05',
      time: '11:00 صباحاً',
      type: 'جلسة مؤكدة عبر الدفع الإلكتروني',
      status: 'CONFIRMED',
    });

    handleNavigate('portal');
  };

  // Add specialist report in database
  const handleAddReport = async (
    caseNumber: string,
    evaluation: string,
    notes: string,
    recommendations: string,
    treatmentPlan: string,
    nextAppointment: string
  ) => {
    if (!currentUser) return;
    await addSpecialistReportInDb({
      caseNumber,
      specialistId: currentUser.id,
      specialistName: `${currentUser.firstName} ${currentUser.lastName}`,
      specialty:
        currentUser.specialty ||
        (currentUser.roleSlug === 'psychologist'
          ? 'أخصائي نفسي عيادي'
          : currentUser.roleSlug === 'lawyer'
          ? 'مستشار قانوني ومحامٍ'
          : 'مختص معتمد بالمنصة'),
      evaluation,
      professionalNotes: notes,
      recommendations,
      treatmentPlan,
      nextAppointment,
      createdAt: new Date().toLocaleDateString('ar-DZ'),
    });
  };

  // Send message in chat
  const handleSendMessage = (convId: number, content: string) => {
    const sender = currentUser
      ? `${currentUser.firstName} ${currentUser.lastName}`
      : 'مستخدم';

    const newMsg: Message = {
      id: (messagesMap[convId]?.length || 0) + 1,
      conversationId: convId,
      senderName: sender,
      content,
      timestamp: 'الآن',
      isFromMe: true,
    };

    setMessagesMap((prev) => ({
      ...prev,
      [convId]: [...(prev[convId] || []), newMsg],
    }));
  };

  return (
    <div className="min-h-screen bg-[#F3F7F6] text-[#203945] flex flex-col justify-between pb-16">
      <div>
        {/* Top Navbar */}
        <Navbar
          currentUser={currentUser}
          onNavigate={handleNavigate}
          onOpenAuth={() => setIsAuthOpen(true)}
          onOpenAiTriage={() => setIsAiOpen(true)}
          onLogout={handleLogout}
        />

        {/* Main Content Area */}
        <main className="max-w-4xl mx-auto px-4 py-4">
          {currentView === 'landing' && (
            <LandingView
              onNavigate={handleNavigate}
              onOpenAiTriage={() => setIsAiOpen(true)}
              onNewCase={handleNewCaseCTA}
              onOpenAuth={(mode) => setIsAuthOpen(true)}
              partners={partners}
              usersCount={users.length}
              completedCasesCount={careRequests.filter((r) => r.status === 'COMPLETED').length || 38}
              specialistsCount={
                users.filter((u) =>
                  ['psychologist', 'doctor', 'lawyer', 'legal_advisor', 'clinic', 'hospital'].includes(u.roleSlug)
                ).length || 24
              }
            />
          )}

          {currentView === 'admin-dashboard' && (
            <AdminDashboardView
              currentUser={currentUser}
              users={users}
              requests={careRequests}
              appointments={appointments}
              reports={specialistReports}
              transactions={paymentTransactions}
              auditLogs={auditLogs}
              partners={partners}
              onOpenRequestDetail={handleSelectRequest}
              onBackToPortal={() => handleNavigate('portal')}
            />
          )}

          {currentView === 'specialist-dashboard' && currentUser && (
            <SpecialistDashboardView
              currentUser={currentUser}
              requests={careRequests}
              appointments={appointments}
              reports={specialistReports}
              followUps={followUps}
              notifications={notifications}
              users={users}
              onOpenChat={() => handleNavigate('messages')}
              onOpenRequestDetail={handleSelectRequest}
            />
          )}

          {currentView === 'services' && (
            <ServicesView
              services={services}
              onRequestService={handleRequestService}
            />
          )}

          {currentView === 'new-request' && (
            <NewRequestView
              services={services}
              preselectedServiceId={preselectedServiceId}
              onSubmit={handleCreateRequest}
              onCancel={() => handleNavigate('portal')}
            />
          )}

          {currentView === 'portal' && currentUser && (
            <PortalView
              currentUser={currentUser}
              requests={careRequests}
              transactions={paymentTransactions}
              appointments={appointments}
              reports={specialistReports}
              notifications={notifications}
              onSelectRequest={handleSelectRequest}
              onStartPayment={handleStartPayment}
              onNewRequest={() => handleNavigate('new-request')}
              onAcceptRequest={handleAcceptRequest}
              onRejectRequestClick={(id) => setRejectionTargetId(id)}
              onOpenChat={() => handleNavigate('messages')}
              onLogout={handleLogout}
            />
          )}

          {currentView === 'portal' && !currentUser && (
            <div className="text-center py-16 space-y-4">
              <p className="text-base font-bold text-[#203945]">
                يرجى تسجيل الدخول للوصول إلى لوحة التحكم الخاصة بك.
              </p>
              <button
                onClick={() => setIsAuthOpen(true)}
                className="px-6 py-2.5 rounded-[12px] bg-[#1766A6] text-white font-bold text-sm shadow-xs hover:bg-[#125386] transition-colors"
              >
                تسجيل الدخول الآن
              </button>
            </div>
          )}

          {currentView === 'case-detail' && (
            <CaseDetailView
              request={selectedRequest}
              currentUser={currentUser}
              reports={specialistReports}
              onStartPayment={handleStartPayment}
              onAddReport={handleAddReport}
              onOpenChat={() => handleNavigate('messages')}
              onBack={() => handleNavigate('portal')}
            />
          )}

          {currentView === 'payment' && (
            <PaymentView
              request={paymentTargetRequest}
              onProcessPayment={handleProcessPayment}
              onCancel={() => handleNavigate('portal')}
            />
          )}

          {currentView === 'appointments' && (
            <AppointmentsView
              appointments={appointments}
              onBookNew={() => handleNavigate('new-request')}
            />
          )}

          {currentView === 'messages' && (
            <ChatView
              conversations={conversations}
              messagesMap={messagesMap}
              onSendMessage={handleSendMessage}
            />
          )}

          {currentView === 'legal-assistance' && (
            <LegalAssistanceView
              currentUser={currentUser}
              onSubmitLegalCase={handleCreateLegalCase}
              onOpenAuth={() => setIsAuthOpen(true)}
              onBack={() => handleNavigate('portal')}
            />
          )}

          {currentView === 'directory' && <DirectoryView />}

          {currentView === 'awareness' && (
            <AwarenessView
              onNavigateToLegalAssistance={() => handleNavigate('legal-assistance')}
            />
          )}

          {currentView === 'emergency' && <EmergencyView />}
        </main>
      </div>

      {/* Modals */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLogin={handleLogin}
        onRegisterUser={(newUser) => {
          setUsers((prev) => [newUser, ...prev]);
        }}
      />

      <AITriageModal
        isOpen={isAiOpen}
        onClose={() => setIsAiOpen(false)}
        onNavigateToRequest={() => handleNavigate('new-request')}
      />

      <RejectionModal
        isOpen={rejectionTargetId !== null}
        onClose={() => setRejectionTargetId(null)}
        onConfirm={handleConfirmReject}
      />

      {/* Persistent Bottom Navigator */}
      <BottomNavigator
        currentView={currentView}
        onNavigate={handleNavigate}
        currentUser={currentUser}
      />
    </div>
  );
}
export default App;
