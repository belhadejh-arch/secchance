import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { ServicesView } from './components/ServicesView';
import { NewCaseWizard } from './components/NewCaseWizard';
import { CaseDetailsView } from './components/CaseDetailsView';
import { NotificationsView } from './components/NotificationsView';
import { ProfileView } from './components/ProfileView';
import { SmartSearchView } from './components/SmartSearchView';
import { AboutPlatformView } from './components/AboutPlatformView';
import { FamilyPortal } from './components/FamilyPortal';
import { PsychologistPortal } from './components/PsychologistPortal';
import { LawyerPortal } from './components/LawyerPortal';
import { CenterAssociationPortal } from './components/CenterAssociationPortal';
import { AdminPortal } from './components/AdminPortal';
import { AppointmentsView } from './components/AppointmentsView';
import { MessagesView } from './components/MessagesView';
import { EmergencyDirectory } from './components/EmergencyDirectory';
import { AuthModal } from './components/AuthModal';
import { AITriageModal } from './components/AITriageModal';
import { BottomNavigator } from './components/BottomNavigator';
import { PlatformLogo } from './components/PlatformLogo';
import { Shield } from 'lucide-react';

const AppContent: React.FC = () => {
  const { user } = useAuth();
  const [currentView, setCurrentView] = useState<string>('landing');
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');
  const [authRole, setAuthRole] = useState<string>('family');
  const [isAiOpen, setIsAiOpen] = useState(false);

  // Cross-component states
  const [activeConvId, setActiveConvId] = useState<number | null>(null);
  const [selectedCaseCode, setSelectedCaseCode] = useState<string>('#SC-2025-0012');
  const [prefillCaseData, setPrefillCaseData] = useState<{
    description: string;
    addiction_type_id: number;
    priority: string;
  } | null>(null);

  const handleOpenAuth = (tab: 'login' | 'register' = 'login', role: string = 'family') => {
    setAuthTab(tab);
    setAuthRole(role);
    setIsAuthOpen(true);
  };

  const handleStartCaseWithData = (data: { description: string; addiction_type_id: number; priority: string }) => {
    setPrefillCaseData(data);
    setCurrentView('new-case');
  };

  const handleOpenChat = (convId: number) => {
    setActiveConvId(convId);
    setCurrentView('messages');
  };

  const handleOpenBookAppointment = () => {
    setCurrentView('appointments');
  };

  const handleSelectCase = (code: string) => {
    setSelectedCaseCode(code);
    setCurrentView('case-detail');
  };

  // Render Role-specific Portal
  const renderPortal = () => {
    if (!user) {
      return (
        <div className="max-w-md mx-auto my-12 p-6 bg-white rounded-3xl border border-slate-200 text-center space-y-4 shadow-sm" dir="rtl">
          <div className="w-14 h-14 rounded-full bg-blue-50 text-[#1565C0] mx-auto flex items-center justify-center">
            <Shield className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-black text-slate-900">تسجيل الدخول مطلوب</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
             للوصول إلى ملفاتك ومتابعاتك الآمنة، يرجى تسجيل الدخول بحسابك المعتمد.
          </p>
          <button
            onClick={() => handleOpenAuth('login')}
            className="w-full py-3 bg-[#1565C0] hover:bg-blue-700 text-white rounded-2xl text-xs sm:text-sm font-bold shadow-md transition-colors cursor-pointer"
          >
            تسجيل الدخول الآن
          </button>
        </div>
      );
    }

    switch (user.role_slug) {
      case 'admin':
        return <AdminPortal />;
      case 'psychologist':
        return (
          <PsychologistPortal
            onOpenChat={handleOpenChat}
            onOpenBookAppointment={handleOpenBookAppointment}
          />
        );
      case 'lawyer':
        return (
          <LawyerPortal
            onOpenChat={handleOpenChat}
            onOpenBookAppointment={handleOpenBookAppointment}
          />
        );
      case 'treatment_center':
      case 'association':
        return <CenterAssociationPortal onOpenChat={handleOpenChat} />;
      case 'family':
      case 'patient':
      default:
        return (
          <FamilyPortal
            onOpenChat={handleOpenChat}
            onOpenBookAppointment={handleOpenBookAppointment}
            prefillData={prefillCaseData}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans text-slate-900 selection:bg-blue-100 selection:text-[#1565C0]" dir="rtl">
      {/* Global Navigation Header with transparent logo */}
      <Navbar
        onOpenAuth={handleOpenAuth}
        onOpenAiTriage={() => setIsAiOpen(true)}
        currentView={currentView}
        onNavigate={setCurrentView}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-24">
        {currentView === 'landing' && (
          <LandingPage
            onOpenAuth={handleOpenAuth}
            onOpenAiTriage={() => setIsAiOpen(true)}
            onNavigateToPortal={() => setCurrentView('portal')}
            onNavigateTo={setCurrentView}
            onNewCase={() => setCurrentView('new-case')}
          />
        )}

        {currentView === 'services' && (
          <ServicesView
            onBack={() => setCurrentView('landing')}
            onSelectService={(serviceId) => {
              setCurrentView('new-case');
            }}
          />
        )}

        {currentView === 'new-case' && (
          <NewCaseWizard
            onBack={() => setCurrentView('landing')}
            onComplete={(caseCode) => {
              setSelectedCaseCode(caseCode);
              setCurrentView('case-detail');
            }}
          />
        )}

        {currentView === 'case-detail' && (
          <CaseDetailsView
            caseCode={selectedCaseCode}
            onBack={() => setCurrentView('portal')}
            onOpenChat={handleOpenChat}
            onBookAppointment={handleOpenBookAppointment}
          />
        )}

        {currentView === 'notifications' && (
          <NotificationsView
            onBack={() => setCurrentView('landing')}
            onNavigateTo={setCurrentView}
          />
        )}

        {currentView === 'profile' && (
          <ProfileView
            onBack={() => setCurrentView('landing')}
            onNavigateTo={setCurrentView}
            onOpenAuth={handleOpenAuth}
          />
        )}

        {currentView === 'search' && (
          <SmartSearchView
            onBack={() => setCurrentView('landing')}
            onSelectCase={handleSelectCase}
          />
        )}

        {currentView === 'about' && (
          <AboutPlatformView
            onBack={() => setCurrentView('landing')}
            onOpenEmergency={() => setCurrentView('emergency')}
            onOpenAiTriage={() => setIsAiOpen(true)}
          />
        )}

        {currentView === 'portal' && renderPortal()}

        {currentView === 'appointments' && (
          <AppointmentsView onBack={() => setCurrentView('landing')} />
        )}

        {currentView === 'messages' && (
          <MessagesView 
            initialConversationId={activeConvId} 
            onBack={() => setCurrentView('landing')} 
          />
        )}

        {currentView === 'emergency' && <EmergencyDirectory />}
      </main>

      {/* Floating Bottom Navigator matching UI reference mockup */}
      <BottomNavigator
        currentView={currentView}
        onNavigate={setCurrentView}
        onOpenAiTriage={() => setIsAiOpen(true)}
        onNewCase={() => setCurrentView('new-case')}
      />

      {/* Modals */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        defaultTab={authTab}
        defaultRole={authRole}
      />

      <AITriageModal
        isOpen={isAiOpen}
        onClose={() => setIsAiOpen(false)}
        onStartCaseWithData={handleStartCaseWithData}
      />
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
