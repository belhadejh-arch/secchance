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
    <div className="min-h-screen bg-[#fefefa] flex flex-col font-sans text-slate-900 selection:bg-blue-100 selection:text-[#1565C0]" dir="rtl">
      {/* Global Navigation Header with transparent logo */}
      <Navbar
        onOpenAuth={handleOpenAuth}
        onOpenAiTriage={() => setIsAiOpen(true)}
        currentView={currentView}
        onNavigate={setCurrentView}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-24 lg:pb-0">
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

        {currentView === 'emergency' && (
          <EmergencyDirectory onBack={() => setCurrentView('landing')} />
        )}

        {/* Dedicated Desktop Footer (Visible on Lg Screens) */}
        <footer className="hidden lg:block bg-slate-900 text-slate-300 border-t border-slate-800 mt-16 py-12" dir="rtl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              
              {/* Col 1: Platform Overview */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="font-black text-lg text-white">الفرصة الثانية 🇩🇿</div>
                  <span className="text-[10px] bg-blue-600 text-white font-bold px-2 py-0.5 rounded-full font-mono">SCP</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  منظومة وطنية متكاملة للمرافقة والتكفل بحالات الإدمان، الدعم النفسي المتخصص، والحماية والتكييف القانوني الآمن في الجزائر.
                </p>
                <div className="text-xs text-emerald-400 font-bold flex items-center gap-1.5 pt-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>سرية تامة وتشفير كامل للبيانات</span>
                </div>
              </div>

              {/* Col 2: Fast Services */}
              <div className="space-y-3 text-xs">
                <h4 className="font-black text-sm text-white border-b border-slate-800 pb-2">الخدمات والرعاية</h4>
                <ul className="space-y-2 text-slate-400 font-medium">
                  <li>
                    <button onClick={() => setCurrentView('services')} className="hover:text-white transition-colors cursor-pointer">
                      • دليل مراكز علاج الإدمان (53 مركزاً بالجزائر)
                    </button>
                  </li>
                  <li>
                    <button onClick={() => setCurrentView('services')} className="hover:text-white transition-colors cursor-pointer">
                      • مكتبة الأبحاث والدراسات العلمية
                    </button>
                  </li>
                  <li>
                    <button onClick={() => setCurrentView('appointments')} className="hover:text-white transition-colors cursor-pointer">
                      • استشارات الدعم النفسي والسلوكي
                    </button>
                  </li>
                  <li>
                    <button onClick={() => setCurrentView('appointments')} className="hover:text-white transition-colors cursor-pointer">
                      • التكييف والمساعدة القانونية
                    </button>
                  </li>
                </ul>
              </div>

              {/* Col 3: Safe Guidance */}
              <div className="space-y-3 text-xs">
                <h4 className="font-black text-sm text-white border-b border-slate-800 pb-2">التوجيه والأمان</h4>
                <ul className="space-y-2 text-slate-400 font-medium">
                  <li>
                    <button onClick={() => setIsAiOpen(true)} className="hover:text-emerald-400 transition-colors cursor-pointer">
                      • المساعد الذكي للتوجيه السري
                    </button>
                  </li>
                  <li>
                    <button onClick={() => setCurrentView('about')} className="hover:text-white transition-colors cursor-pointer">
                      • ميثاق السرية وحماية الهوية
                    </button>
                  </li>
                  <li>
                    <button onClick={() => setCurrentView('emergency')} className="hover:text-red-400 transition-colors cursor-pointer">
                      • أرقام النجدة والسموم الوطنية
                    </button>
                  </li>
                </ul>
              </div>

              {/* Col 4: National Hotlines */}
              <div className="space-y-3 text-xs">
                <h4 className="font-black text-sm text-white border-b border-slate-800 pb-2">الخطوط الوطنية للطوارئ</h4>
                <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700 space-y-2">
                  <div className="text-[11px] text-slate-400">الرقم الأخضر لطوارئ الإدمان:</div>
                  <div className="text-xl font-black text-red-400 font-mono">1099</div>
                  <div className="text-[10px] text-slate-400">متاح 24 ساعة يومياً لكل ولايات الوطن</div>
                </div>
              </div>

            </div>

            {/* Bottom Disclaimer */}
            <div className="pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
              <div>
                © {new Date().getFullYear()} منصة الفرصة الثانية. جميع الحقوق محفوظة.
              </div>
              <div className="flex items-center gap-4 text-[11px]">
                <span>حماية البيانات والسر المهني مكفول</span>
                <span>•</span>
                <span>تغطية 58 ولاية</span>
              </div>
            </div>
          </div>
        </footer>
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
