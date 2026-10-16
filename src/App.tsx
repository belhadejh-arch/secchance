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
import { HelpOptionsView } from './views/HelpOptionsView';
import { NeedsAssessmentView, AssessmentAnswers } from './views/NeedsAssessmentView';
import { GuidanceResultsView } from './views/GuidanceResultsView';
import { NewRequestView } from './views/NewRequestView';
import { PortalView } from './views/PortalView';
import { CaseDetailView } from './views/CaseDetailView';
import { PaymentView } from './views/PaymentView';
import { BookingConfirmationView } from './views/BookingConfirmationView';
import { AppointmentsView } from './views/AppointmentsView';
import { ChatView } from './views/ChatView';
import { DirectoryView } from './views/DirectoryView';
import { AwarenessView } from './views/AwarenessView';
import { EmergencyView } from './views/EmergencyView';
import { LegalAssistanceView } from './views/LegalAssistanceView';
import { FamilyGuidanceView } from './views/FamilyGuidanceView';
import { AdminDashboardView } from './views/AdminDashboardView';
import { SpecialistDashboardView } from './views/SpecialistDashboardView';

function findProviderConfirmedBooking(
  request: CareRequest | null,
  transactions: PaymentTransaction[],
  appointments: Appointment[]
) {
  if (
    !request ||
    request.status !== 'APPOINTMENT_CONFIRMED' ||
    request.paymentStatus !== 'PAID' ||
    !request.appointmentDate ||
    !request.appointmentTime
  ) {
    return null;
  }

  const transaction = transactions.find(
    (item) =>
      item.caseNumber === request.caseNumber &&
      item.status === 'SUCCESSFUL' &&
      Boolean(item.transactionId.trim()) &&
      item.currency === 'DZD' &&
      item.amountDzd === request.amountDzd &&
      String(item.clientId) === String(request.clientId) &&
      String(item.providerId) === String(request.providerId)
  );
  const appointment = appointments.find(
    (item) =>
      item.caseNumber === request.caseNumber &&
      item.status === 'CONFIRMED' &&
      item.date === request.appointmentDate &&
      item.time === request.appointmentTime &&
      String(item.clientId) === String(request.clientId) &&
      String(item.specialistId) === String(request.providerId)
  );

  return transaction && appointment ? { request, transaction, appointment } : null;
}

export function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<string>('landing');
  const [directoryTab, setDirectoryTab] = useState<'centers' | 'associations'>('centers');
  const [directorySearch, setDirectorySearch] = useState('');
  const [requestTargetPerson, setRequestTargetPerson] = useState<'self' | 'family'>('self');
  const [familyGuidanceReturnView, setFamilyGuidanceReturnView] = useState('help-options');
  const [assessmentAnswers, setAssessmentAnswers] = useState<AssessmentAnswers | null>(null);

  // Database-backed state
  const [users, setUsers] = useState<User[]>([]);
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
  const [pendingAuthServiceId, setPendingAuthServiceId] = useState<number | undefined>(undefined);

  // Modals
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [rejectionTargetId, setRejectionTargetId] = useState<number | string | null>(null);

  // Real-time Database initialization and subscriptions
  useEffect(() => {
    if (currentUser) {
      initializeDatabase().catch(console.error);
    }

    const unsubUsers = subscribeToUsers((data) => setUsers(data));

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
  }, [currentUser]);

  // Restore remember-me user if available
  useEffect(() => {
    const savedUserId = localStorage.getItem('secchance_user_id');
    if (savedUserId && users.length > 0) {
      const found = users.find((u) => String(u.id) === savedUserId);
      if (found && String(currentUser?.id) !== savedUserId) {
        setCurrentUser(found);
      }
    }
  }, [users, currentUser]);

  useEffect(() => {
    if (currentView !== 'payment' || !paymentTargetRequest || !currentUser) return;
    const latestRequest = careRequests.find(
      (request) => String(request.id) === String(paymentTargetRequest.id)
    );
    if (!latestRequest || String(latestRequest.clientId) !== String(currentUser.id)) return;

    const confirmed = findProviderConfirmedBooking(latestRequest, paymentTransactions, appointments);
    if (!confirmed) return;

    setSelectedRequest(latestRequest);
    setCurrentView('booking-confirmation');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentView, paymentTargetRequest, currentUser, careRequests, paymentTransactions, appointments]);

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
    if (!currentUser) {
      setPendingAuthServiceId(service.id);
      setIsAuthOpen(true);
    } else {
      setPreselectedServiceId(service.id);
      handleNavigate('new-request');
    }
  };

  const handleNewCaseCTA = () => {
    setPreselectedServiceId(undefined);
    setRequestTargetPerson('self');
    handleNavigate('help-options');
  };

  const handleFamilyHelpCTA = () => {
    setPreselectedServiceId(undefined);
    setRequestTargetPerson('family');
    handleNavigate('help-options');
  };

  const handleStartNeedsAssessment = () => {
    setAssessmentAnswers(null);
    handleNavigate('needs-assessment');
  };

  const handleContinueAssessment = (answers: AssessmentAnswers) => {
    setAssessmentAnswers(answers);
    setRequestTargetPerson(answers.targetPerson);
    handleNavigate('guidance-results');
  };

  const handleOpenDirectory = (tab: 'centers' | 'associations', search = '') => {
    setDirectoryTab(tab);
    setDirectorySearch(search);
    handleNavigate('directory');
  };

  const handleOpenAwareness = () => {
    handleNavigate('awareness');
  };

  const handleOpenFamilyGuidance = () => {
    setFamilyGuidanceReturnView(currentView);
    setRequestTargetPerson('family');
    handleNavigate('family-guidance');
  };

  // Login handler with RBAC auto-routing
  const handleLogin = (user: User) => {
    setCurrentUser(user);
    const requestedServiceId = pendingAuthServiceId;
    setPendingAuthServiceId(undefined);
    if (user.roleSlug === 'admin') {
      handleNavigate('admin-dashboard');
    } else if (
      ['psychologist', 'doctor', 'lawyer', 'legal_advisor', 'clinic', 'hospital', 'association', 'treatment_center'].includes(
        user.roleSlug
      )
    ) {
      handleNavigate('specialist-dashboard');
    } else if (requestedServiceId !== undefined) {
      setPreselectedServiceId(requestedServiceId);
      handleNavigate('new-request');
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
    description: string,
    extraData?: {
      consultationTopic?: string;
      attachedDocs?: string[];
      specialistId?: number | string;
      specialistName?: string;
      appointmentDate?: string;
      appointmentTime?: string;
      durationMinutes?: number;
      appointmentHoldExpiresAt?: string;
    }
  ) => {
    if (!currentUser) return;
    const service = services.find((s) => s.id === serviceId) || services[0];
    const selectedSpecialist = users.find(
      (user) => String(user.id) === String(extraData?.specialistId)
    );
    const newCaseNo = `SC-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const newReqData: Omit<CareRequest, 'id'> = {
      caseNumber: newCaseNo,
      clientId: currentUser.id,
      clientName: `${currentUser.firstName} ${currentUser.lastName}`,
      providerId: selectedSpecialist?.id ?? service.providerId,
      providerName: selectedSpecialist
        ? `${selectedSpecialist.firstName} ${selectedSpecialist.lastName}`.trim()
        : service.providerName,
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
      caseType: extraData?.consultationTopic,
      attachedDocuments: extraData?.attachedDocs ?? [],
      appointmentDate: extraData?.appointmentDate ?? null,
      appointmentTime: extraData?.appointmentTime ?? null,
      durationMinutes: extraData?.durationMinutes,
      appointmentHoldExpiresAt: extraData?.appointmentHoldExpiresAt,
      createdAt: new Date().toLocaleDateString('ar-DZ'),
    };

    const saved = await createCareRequestInDb(newReqData);
    setPreselectedServiceId(undefined);
    setSelectedRequest(saved);
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
      description: `${requestTargetPerson === 'family' ? '[لمن الحالة: أحد أفراد الأسرة] ' : ''}${data.description}`,
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

  // No local payment simulation: only a verified provider callback may mark a request paid.
  const handleProcessPayment = async (_requestId: number | string, _paymentMethod: 'EDAHABIA' | 'CIB') => {
    throw new Error('بوابة الدفع غير مهيأة؛ لم يتم تحصيل أي مبلغ.');
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

  const handleSubmitServiceRating = async (
    requestId: number | string,
    rating: 1 | 2 | 3 | 4 | 5
  ) => {
    if (!currentUser) throw new Error('يجب تسجيل الدخول لتقييم الخدمة.');
    const request = careRequests.find((item) => String(item.id) === String(requestId));
    const completedAppointment = appointments.some(
      (appointment) =>
        appointment.caseNumber === request?.caseNumber && appointment.status === 'COMPLETED'
    );

    if (!request || String(request.clientId) !== String(currentUser.id)) {
      throw new Error('لا يمكن تقييم هذا الطلب من الحساب الحالي.');
    }
    if (request.status !== 'COMPLETED' && !completedAppointment) {
      throw new Error('يمكن تقييم الخدمة بعد تأكيد اكتمال الاستشارة فقط.');
    }
    if (request.serviceRating) {
      throw new Error('تم تسجيل تقييم لهذا الطلب مسبقًا.');
    }

    await updateCareRequestInDb(
      request.id,
      { serviceRating: rating, serviceRatingSubmittedAt: new Date().toISOString() },
      `${currentUser.firstName} ${currentUser.lastName}`
    );
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

  const latestSelectedRequest = selectedRequest
    ? careRequests.find((request) => String(request.id) === String(selectedRequest.id)) ?? selectedRequest
    : null;
  const confirmedBooking = findProviderConfirmedBooking(
    latestSelectedRequest,
    paymentTransactions,
    appointments
  );

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
        <main className="w-full max-w-[1280px] mx-auto px-4 py-4">
          {currentView === 'landing' && (
            <LandingView
              onNavigate={handleNavigate}
              onNewCase={handleNewCaseCTA}
              onFamilyHelp={handleFamilyHelpCTA}
              onRequestService={handleRequestService}
              onOpenDirectory={handleOpenDirectory}
              services={services}
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
              onOpenDirectory={handleOpenDirectory}
              onOpenLegalInformation={handleOpenAwareness}
              onOpenFamilyGuidance={handleOpenFamilyGuidance}
            />
          )}

          {currentView === 'help-options' && (
            <HelpOptionsView
              services={services}
              onRequestService={handleRequestService}
              onOpenDirectory={handleOpenDirectory}
              onOpenLegalInformation={handleOpenAwareness}
              onOpenFamilyGuidance={handleOpenFamilyGuidance}
              onStartNeedsAssessment={handleStartNeedsAssessment}
            />
          )}

          {currentView === 'needs-assessment' && (
            <NeedsAssessmentView
              initialAnswers={assessmentAnswers}
              initialTargetPerson={requestTargetPerson}
              onContinue={handleContinueAssessment}
              onBack={() => handleNavigate('help-options')}
            />
          )}

          {currentView === 'guidance-results' && assessmentAnswers && (
            <GuidanceResultsView
              answers={assessmentAnswers}
              services={services}
              onReserveService={handleRequestService}
              onOpenDirectory={handleOpenDirectory}
              onOpenLegalInformation={handleOpenAwareness}
              onOpenFamilyGuidance={handleOpenFamilyGuidance}
              onOpenEmergency={() => handleNavigate('emergency')}
              onBack={() => handleNavigate('needs-assessment')}
            />
          )}

          {currentView === 'family-guidance' && (
            <FamilyGuidanceView
              services={services}
              onRequestService={handleRequestService}
              onOpenDirectory={() => handleOpenDirectory('centers')}
              onBack={() => handleNavigate(familyGuidanceReturnView)}
            />
          )}

          {currentView === 'new-request' && (
            <NewRequestView
              services={services}
              specialists={users}
              appointments={appointments}
              requests={careRequests}
              preselectedServiceId={preselectedServiceId}
              initialTargetPerson={requestTargetPerson}
              currentUser={currentUser}
              onSubmit={handleCreateRequest}
              onNavigateToPortal={() => handleNavigate('portal')}
              onCancel={() => {
                setPreselectedServiceId(undefined);
                handleNavigate('portal');
              }}
            />
          )}

          {currentView === 'portal' && currentUser && (
            <PortalView
              currentUser={currentUser}
              services={services}
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
              onRequestService={handleRequestService}
              onOpenDirectory={handleOpenDirectory}
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
              request={
                selectedRequest
                  ? careRequests.find((request) => String(request.id) === String(selectedRequest.id)) ||
                    selectedRequest
                  : null
              }
              currentUser={currentUser}
              reports={specialistReports}
              appointments={appointments}
              transactions={paymentTransactions}
              onStartPayment={handleStartPayment}
              onSubmitRating={handleSubmitServiceRating}
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

          {currentView === 'booking-confirmation' && confirmedBooking && (
            <BookingConfirmationView
              request={confirmedBooking.request}
              appointment={confirmedBooking.appointment}
              transaction={confirmedBooking.transaction}
              onEnterConsultation={() => {
                setSelectedRequest(confirmedBooking.request);
                handleNavigate('case-detail');
              }}
              onBackToRequests={() => handleNavigate('portal')}
            />
          )}

          {currentView === 'booking-confirmation' && !confirmedBooking && (
            <div role="status" className="mx-auto max-w-lg space-y-3 rounded-[16px] border border-amber-200 bg-amber-50 p-5 text-center text-sm text-amber-950">
              <p className="font-bold">لم يصل بعد تأكيد الدفع والحجز.</p>
              <p className="text-xs">لن نعرض تأكيداً ناجحاً قبل مطابقة تأكيد مزود الدفع مع الموعد المؤكد.</p>
              <button
                type="button"
                onClick={() => handleNavigate('portal')}
                className="rounded-[10px] bg-[#1766A6] px-4 py-2 text-xs font-bold text-white"
              >
                العودة إلى الطلبات
              </button>
            </div>
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

          {currentView === 'directory' && (
            <DirectoryView
              key={directoryTab}
              initialTab={directoryTab}
              initialSearch={directorySearch}
            />
          )}

          {currentView === 'awareness' && (
            <AwarenessView
              onRequestLegalConsultation={() => {
                const legalService = services.find((service) => service.category === 'legal');
                if (legalService) handleRequestService(legalService);
              }}
            />
          )}

          {currentView === 'emergency' && <EmergencyView />}
        </main>
      </div>

      {/* Modals */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => {
          setIsAuthOpen(false);
          setPendingAuthServiceId(undefined);
        }}
        onLogin={handleLogin}
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
