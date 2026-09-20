import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
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
import { Shield, HeartHandshake, PhoneCall } from 'lucide-react';

const AppContent: React.FC = () => {
  const { user } = useAuth();
  const [currentView, setCurrentView] = useState<string>('landing');
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');
  const [authRole, setAuthRole] = useState<string>('family');
  const [isAiOpen, setIsAiOpen] = useState(false);

  // Cross-component states
  const [activeConvId, setActiveConvId] = useState<number | null>(null);
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
    if (!user) {
      handleOpenAuth('register', 'family');
    } else {
      setCurrentView('portal');
    }
  };

  const handleOpenChat = (convId: number) => {
    setActiveConvId(convId);
    setCurrentView('messages');
  };

  const handleOpenBookAppointment = () => {
    setCurrentView('appointments');
  };

  // Render Portal View by User Role
  const renderPortal = () => {
    if (!user) {
      return (
        <div className="max-w-xl mx-auto my-16 p-8 bg-white rounded-2xl border border-slate-200 text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-blue-50 text-[#1565C0] mx-auto flex items-center justify-center">
            <Shield className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">تسجيل الدخول مطلوب</h2>
          <p className="text-xs sm:text-sm text-slate-500">
            للوصول إلى ملفاتك ومتابعاتك الآمنة، يرجى تسجيل الدخول أو استخدام أحد الحسابات التجريبية المعتمدة.
          </p>
          <button
            onClick={() => handleOpenAuth('login')}
            className="px-6 py-2.5 bg-[#1565C0] text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs hover:bg-blue-700 transition-colors"
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
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans text-slate-900" dir="rtl">
      {/* Global Navigation Header */}
      <Navbar
        onOpenAuth={handleOpenAuth}
        onOpenAiTriage={() => setIsAiOpen(true)}
        currentView={currentView}
        onNavigate={setCurrentView}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {currentView === 'landing' && (
          <LandingPage
            onOpenAuth={handleOpenAuth}
            onOpenAiTriage={() => setIsAiOpen(true)}
            onNavigateToPortal={() => setCurrentView('portal')}
          />
        )}

        {currentView === 'portal' && renderPortal()}

        {currentView === 'appointments' && <AppointmentsView />}

        {currentView === 'messages' && <MessagesView initialConversationId={activeConvId} />}

        {currentView === 'emergency' && <EmergencyDirectory />}
      </main>

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

      {/* Official Footer */}
      <footer className="bg-white border-t border-slate-200 py-10 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#1565C0] to-[#2E7D32] flex items-center justify-center text-white font-bold">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <span className="font-extrabold text-slate-900 text-sm">منصة الفرصة الثانية (SCP)</span>
                <span className="text-slate-400 block text-[11px]">Second Chance Platform — نظام التعافي والتأهيل المتكامل</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-6 text-[11px] font-medium">
              <button onClick={() => setCurrentView('emergency')} className="text-red-600 hover:underline">
                أرقام الطوارئ الساخنة
              </button>
              <button onClick={() => setIsAiOpen(true)} className="text-emerald-700 hover:underline">
                المساعد الذكي للتوجيه السري
              </button>
              <span>الخط الأخضر: 1099</span>
              <span>الدرك: 1055</span>
              <span>الشرطة: 1548</span>
              <span>الحماية: 14</span>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-6 flex flex-wrap items-center justify-between gap-4 text-[11px]">
            <p>© {new Date().getFullYear()} Second Chance Platform (SCP). جميع الحقوق محفوظة. تخضع جميع التعاملات للسرية المهنية الطبية وحماية البيانات.</p>
            <div className="flex items-center gap-2 text-slate-400">
              <HeartHandshake className="w-4 h-4 text-[#2E7D32]" />
              <span>معاً من أجل حياة جديدة ومستقبل آمن</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
