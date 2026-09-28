import React, { useState } from 'react';
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
} from './types';
import {
  initialUsers,
  initialServices,
  initialCareRequests,
  initialPaymentTransactions,
  initialSpecialistReports,
  initialAppointments,
  initialConversations,
  initialMessages,
  initialNotifications,
} from './data/initialData';

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

export function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(initialUsers[0]);
  const [currentView, setCurrentView] = useState<string>('landing');

  const [services] = useState<ServiceItem[]>(initialServices);
  const [careRequests, setCareRequests] = useState<CareRequest[]>(initialCareRequests);
  const [paymentTransactions, setPaymentTransactions] = useState<PaymentTransaction[]>(initialPaymentTransactions);
  const [specialistReports, setSpecialistReports] = useState<SpecialistReport[]>(initialSpecialistReports);
  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments);
  const [conversations] = useState<Conversation[]>(initialConversations);
  const [messagesMap, setMessagesMap] = useState<Record<number, Message[]>>(initialMessages);

  const [selectedRequest, setSelectedRequest] = useState<CareRequest | null>(null);
  const [paymentTargetRequest, setPaymentTargetRequest] = useState<CareRequest | null>(null);
  const [preselectedServiceId, setPreselectedServiceId] = useState<number | undefined>(undefined);

  // Modals
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [rejectionTargetId, setRejectionTargetId] = useState<number | null>(null);

  // Navigation handlers
  const handleNavigate = (view: string) => {
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

  // Request creation
  const handleCreateRequest = (
    serviceId: number,
    priority: Priority,
    wilaya: string,
    description: string
  ) => {
    if (!currentUser) return;
    const service = services.find((s) => s.id === serviceId) || services[0];
    const newCaseNo = `SC-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const newReq: CareRequest = {
      id: careRequests.length + 1,
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
      createdAt: 'الآن',
    };

    setCareRequests([newReq, ...careRequests]);
    setSelectedRequest(newReq);
    handleNavigate('portal');
  };

  const handleCreateLegalCase = (data: {
    serviceId: number;
    caseType: string;
    description: string;
    wilaya: string;
    lawyerId: number;
    attachedDocs: string[];
    priority: Priority;
  }) => {
    if (!currentUser) return;
    const lawyer = initialUsers.find((u) => u.id === data.lawyerId) || initialUsers[2];
    const service = services.find((s) => s.id === data.serviceId) || services[1];
    const newCaseNo = `SC-LEG-${Math.floor(1000 + Math.random() * 9000)}`;

    const newReq: CareRequest = {
      id: careRequests.length + 1,
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
      createdAt: 'الآن',
    };

    setCareRequests([newReq, ...careRequests]);
    setSelectedRequest(newReq);
  };

  // Provider status updates
  const handleAcceptRequest = (requestId: number) => {
    setCareRequests((prev) =>
      prev.map((r) =>
        r.id === requestId ? { ...r, status: 'ACCEPTED' as const } : r
      )
    );
  };

  const handleConfirmReject = (reason: string) => {
    if (!rejectionTargetId) return;
    setCareRequests((prev) =>
      prev.map((r) =>
        r.id === rejectionTargetId
          ? { ...r, status: 'REJECTED' as const, rejectionReason: reason }
          : r
      )
    );
    setRejectionTargetId(null);
  };

  // Payment processing
  const handleProcessPayment = (requestId: number, paymentMethod: 'EDAHABIA' | 'CIB') => {
    const targetReq = careRequests.find((r) => r.id === requestId);
    if (!targetReq) return;

    const txnId = `TXN-${Math.floor(100000 + Math.random() * 900000)}`;
    const payId = `PAY-${targetReq.caseNumber.replace('SC-', '')}-DZ`;
    const orderId = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;

    const newTxn: PaymentTransaction = {
      id: paymentTransactions.length + 1,
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
      createdAt: 'الآن',
      paidAt: 'الآن',
    };

    setPaymentTransactions([newTxn, ...paymentTransactions]);

    setCareRequests((prev) =>
      prev.map((r) =>
        r.id === requestId
          ? {
              ...r,
              status: 'APPOINTMENT_CONFIRMED' as const,
              paymentStatus: 'PAID' as const,
              appointmentDate: '2026-10-05',
              appointmentTime: '11:00 صباحاً',
            }
          : r
      )
    );

    const newAppt: Appointment = {
      id: appointments.length + 1,
      caseNumber: targetReq.caseNumber,
      specialistName: targetReq.providerName,
      specialty: targetReq.serviceTitle,
      date: '2026-10-05',
      time: '11:00 صباحاً',
      type: 'جلسة مؤكدة عبر الدفع الإلكتروني',
      status: 'CONFIRMED',
    };

    setAppointments([...appointments, newAppt]);
    handleNavigate('portal');
  };

  // Add specialist report
  const handleAddReport = (
    caseNumber: string,
    evaluation: string,
    notes: string,
    recommendations: string,
    treatmentPlan: string,
    nextAppointment: string
  ) => {
    if (!currentUser) return;
    const newReport: SpecialistReport = {
      id: specialistReports.length + 1,
      caseNumber,
      specialistName: `${currentUser.firstName} ${currentUser.lastName}`,
      specialty:
        currentUser.roleSlug === 'psychologist'
          ? 'أخصائي نفسي عيادي'
          : currentUser.roleSlug === 'lawyer'
          ? 'مستشار قانوني ومحامٍ'
          : 'مختص معتمد بالمنصة',
      evaluation,
      professionalNotes: notes,
      recommendations,
      treatmentPlan,
      nextAppointment,
      createdAt: 'الآن',
    };

    setSpecialistReports([newReport, ...specialistReports]);
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
        />

        {/* Main Content Area */}
        <main className="max-w-4xl mx-auto px-4 py-4">
          {currentView === 'landing' && (
            <LandingView
              onNavigate={handleNavigate}
              onOpenAiTriage={() => setIsAiOpen(true)}
              onNewCase={handleNewCaseCTA}
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
              onSelectRequest={handleSelectRequest}
              onStartPayment={handleStartPayment}
              onNewRequest={() => handleNavigate('new-request')}
              onAcceptRequest={handleAcceptRequest}
              onRejectRequestClick={(id) => setRejectionTargetId(id)}
              onOpenChat={() => handleNavigate('messages')}
              onLogout={() => {
                setCurrentUser(null);
                handleNavigate('landing');
              }}
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
        onLogin={(user) => {
          setCurrentUser(user);
          handleNavigate('portal');
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
      />
    </div>
  );
}
export default App;
