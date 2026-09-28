import React from 'react';
import { Home, Briefcase, FolderOpen, Calendar, MessageSquare } from 'lucide-react';

interface BottomNavigatorProps {
  currentView: string;
  onNavigate: (view: string) => void;
}

export const BottomNavigator: React.FC<BottomNavigatorProps> = ({
  currentView,
  onNavigate,
}) => {
  const isPortalActive = currentView === 'portal' || currentView === 'case-detail' || currentView === 'legal-assistance';

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#FBFDFC] border-t border-[#E0E8E6] shadow-xs">
      <div className="max-w-md mx-auto grid grid-cols-5 py-2 px-1 text-center">
        {/* الرئيسية */}
        <button
          onClick={() => onNavigate('landing')}
          className={`flex flex-col items-center justify-center py-1 transition-all ${
            currentView === 'landing' ? 'text-[#1766A6]' : 'text-[#5B707B] hover:text-[#203945]'
          }`}
        >
          <div
            className={`px-3 py-1 rounded-full transition-all ${
              currentView === 'landing' ? 'bg-[#EAF3F8]' : ''
            }`}
          >
            <Home className="w-5 h-5 stroke-[2]" />
          </div>
          <span className={`text-[11px] mt-0.5 ${currentView === 'landing' ? 'font-bold' : 'font-medium'}`}>
            الرئيسية
          </span>
        </button>

        {/* الخدمات */}
        <button
          onClick={() => onNavigate('services')}
          className={`flex flex-col items-center justify-center py-1 transition-all ${
            currentView === 'services' ? 'text-[#1766A6]' : 'text-[#5B707B] hover:text-[#203945]'
          }`}
        >
          <div
            className={`px-3 py-1 rounded-full transition-all ${
              currentView === 'services' ? 'bg-[#EAF3F8]' : ''
            }`}
          >
            <Briefcase className="w-5 h-5 stroke-[2]" />
          </div>
          <span className={`text-[11px] mt-0.5 ${currentView === 'services' ? 'font-bold' : 'font-medium'}`}>
            الخدمات
          </span>
        </button>

        {/* طلباتي */}
        <button
          onClick={() => onNavigate('portal')}
          className={`flex flex-col items-center justify-center py-1 transition-all ${
            isPortalActive ? 'text-[#1766A6]' : 'text-[#5B707B] hover:text-[#203945]'
          }`}
        >
          <div
            className={`px-3 py-1 rounded-full transition-all ${
              isPortalActive ? 'bg-[#EAF3F8]' : ''
            }`}
          >
            <FolderOpen className="w-5 h-5 stroke-[2]" />
          </div>
          <span className={`text-[11px] mt-0.5 ${isPortalActive ? 'font-bold' : 'font-medium'}`}>
            طلباتي
          </span>
        </button>

        {/* المواعيد */}
        <button
          onClick={() => onNavigate('appointments')}
          className={`flex flex-col items-center justify-center py-1 transition-all ${
            currentView === 'appointments' ? 'text-[#1766A6]' : 'text-[#5B707B] hover:text-[#203945]'
          }`}
        >
          <div
            className={`px-3 py-1 rounded-full transition-all ${
              currentView === 'appointments' ? 'bg-[#EAF3F8]' : ''
            }`}
          >
            <Calendar className="w-5 h-5 stroke-[2]" />
          </div>
          <span className={`text-[11px] mt-0.5 ${currentView === 'appointments' ? 'font-bold' : 'font-medium'}`}>
            المواعيد
          </span>
        </button>

        {/* الرسائل */}
        <button
          onClick={() => onNavigate('messages')}
          className={`flex flex-col items-center justify-center py-1 transition-all ${
            currentView === 'messages' ? 'text-[#1766A6]' : 'text-[#5B707B] hover:text-[#203945]'
          }`}
        >
          <div
            className={`px-3 py-1 rounded-full transition-all ${
              currentView === 'messages' ? 'bg-[#EAF3F8]' : ''
            }`}
          >
            <MessageSquare className="w-5 h-5 stroke-[2]" />
          </div>
          <span className={`text-[11px] mt-0.5 ${currentView === 'messages' ? 'font-bold' : 'font-medium'}`}>
            الرسائل
          </span>
        </button>
      </div>
    </nav>
  );
};
