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
  initializeDatabase,
  getCurrentUser,
  getPublicServices,
  logoutUser,
  subscribeToUsers,
  subscribeToServices,
  subscribeToCareRequests,
  subscribeToAppointments,
  subscribeToSpecialistReports,
  subscribeToPaymentTransactions,
  subscribeToAuditLogs,
  subscribeToPartners,
  subscribeToTreatmentFollowUps,
  subscribeToNotifications,
  subscribeToConversations,
  subscribeToMessages,
  createCareRequestInDb,
  updateCareRequestInDb,
  addSpecialistReportInDb,
  startPaymentInDb,
  sendMessageInDb,
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
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [careRequests, setCareRequests] = useState<CareRequest[]>([]);
  const [paymentTransactions, setPaymentTransactions] = useState<PaymentTransaction[]>([]);
  const [specialistReports, setSpecialistReports] = useState<SpecialistReport[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [partners, setPartners] = useState<PartnerOrganization[]>([]);
  const [followUps, setFollowUps] = useState<TreatmentFollowUp[]>([]);
  const [notifications, setNotifications] = useState<PlatformNotification[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messagesMap, setMessagesMap] = useState<Record<number, Message[]>>({});

  const [selectedRequest, setSelectedRequest] = useState<CareRequest | null>(null);
  const [paymentTargetRequest, setPaymentTargetRequest] = useState<CareRequest | null>(null);
  const [preselectedServiceId, setPreselectedServiceId] = useState<number | undefined>(undefined);
  const [pendingAuthServiceId, setPendingAuthServiceId] = useState<number | undefined>(undefined);

  // Modals
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [rejectionTargetId, setRejectionTargetId] = useState<number | string | null>(null);

  // Restore the server-owned session and load the public catalogue.
  useEffect(() => {
    let active = true;
    getCurrentUser()
      .then((user) => {
        if (active) setCurrentUser(user);
      })
      .catch((error) => console.error('تعذر استعادة جلسة الدخول:', error));
    getPublicServices()
      .then((data) => {
        if (active) setServices(data as ServiceItem[]);
      })
      .catch((error) => console.error('تعذر تحميل الخدمات المتاحة:', error));
    return () => {
      active = false;
    };
  }, []);

  // Database subscriptions are scoped to the authenticated account.
  useEffect(() => {
    if (!currentUser) return;
    initializeDatabase().catch(console.error);
    const unsubUsers = subscribeToUsers((data) => setUsers(data));
    const unsubServices = subscribeToServices((data) => setServices(data));

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
    const unsubConversations = subscribeToConversations((data) => setConversations(data));
    const unsubMessages = subscribeToMessages((data) => setMessagesMap(data));

    return () => {
      unsubUsers();
      unsubServices();
      unsubRequests();
      unsubAppts();
      unsubReports();
      unsubPayments();
      unsubAudit();
      unsubPartners();
      unsubFollowUps();
      unsubNotifs();
      unsubConversations();
      unsubMessages();
    };
  }, [currentUser]);

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

  // Payment providers return to the app before the signed webhook necessarily arrives.
  // Restore the related request from the server snapshot, never from query-string payment data.
  useEffect(() => {
    if (!currentUser) return;
    const params = new URLSearchParams(window.location.search);
    const outcome = params.get('payment');
    const requestId = params.get('request');
    if (!['success', 'failure'].includes(outcome || '') || !requestId) return;
    const request = careRequests.find((item) => String(item.id) === requestId);
    if (!request || String(request.clientId) !== String(currentUser.id)) return;
    setSelectedRequest(request);
    setPaymentTargetRequest(request);
    setCurrentView(outcome === 'success' ? 'booking-confirmation' : 'case-detail');
  }, [currentUser, careRequests]);

  // Navigation handlers
  const handleNavigate = (view: string) => {
    if (view === 'legal-assistance') {
      const legalService = services.find((service) => service.category === 'legal');
      if (!legalService) {
        setCurrentView('services');
        return;
      }
      setPreselectedServiceId(legalService.id);
      setCurrentView('new-request');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
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
    void logoutUser().catch((error) => console.error('تعذر إنهاء الجلسة:', error));
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
    const service = services.find((s) => s.id === serviceId);
    if (!service) throw new Error('الخدمة المطلوبة غير متاحة الآن.');
    const selectedSpecialist = users.find(
      (user) => String(user.id) === String(extraData?.specialistId)
    );
    const provider = selectedSpecialist || users.find(
      (user) => String(user.id) === String(service.providerId)
    );
    if (!provider) throw new Error('اختر مقدم خدمة معتمدًا قبل إرسال الطلب.');

    const saved = await createCareRequestInDb({
      caseNumber: '',
      clientId: currentUser.id,
      clientName: `${currentUser.firstName} ${currentUser.lastName}`,
      providerId: provider.id,
      providerName: `${provider.firstName} ${provider.lastName}`.trim(),
      serviceId: service.id,
      serviceTitle: service.title,
      category: service.category,
      amountDzd: service.amountDzd,
      priority,
      status: 'PENDING_PROVIDER',
      rejectionReason: null,
      paymentStatus: 'PENDING',
      wilayaName: wilaya,
      description,
      caseType: extraData?.consultationTopic,
      attachedDocuments: [],
      appointmentDate: extraData?.appointmentDate ?? null,
      appointmentTime: extraData?.appointmentTime ?? null,
      durationMinutes: extraData?.durationMinutes,
      appointmentHoldExpiresAt: extraData?.appointmentHoldExpiresAt,
      createdAt: new Date().toISOString(),
    });
    setPreselectedServiceId(undefined);
    setSelectedRequest(saved);
    handleNavigate('portal');
  };

  // Provider status updates
  const handleAcceptRequest = async (requestId: number | string, priority?: Priority) => {
    await updateCareRequestInDb(
      requestId,
      { status: 'ACCEPTED', ...(priority ? { priority } : {}) },
      currentUser?.firstName || 'مقدم الخدمة'
    );
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

  const handleProcessPayment = async (requestId: number | string, paymentMethod: 'EDAHABIA' | 'CIB') => {
    const checkoutUrl = await startPaymentInDb(requestId, paymentMethod);
    if (!/^https:\/\//i.test(checkoutUrl)) {
      throw new Error('رابط الدفع غير صالح. لم يتم تحصيل أي مبلغ.');
    }
    window.location.assign(checkoutUrl);
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
  const handleSendMessage = async (convId: number, content: string) => {
    if (!currentUser) throw new Error('يرجى تسجيل الدخول لإرسال رسالة.');
    await sendMessageInDb(convId, content);
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
              completedCasesCount={careRequests.filter((r) => r.status === 'COMPLETED').length}
              specialistsCount={
                users.filter((u) =>
                  ['psychologist', 'doctor', 'lawyer', 'legal_advisor', 'clinic', 'hospital'].includes(u.roleSlug)
                ).length
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
