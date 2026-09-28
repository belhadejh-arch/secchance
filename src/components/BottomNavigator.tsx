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
  const isPortalActive = currentView === 'portal' || currentView === 'case-detail';

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 shadow-md">
      <div className="max-w-md mx-auto grid grid-cols-5 py-1.5 px-2 text-center">
        <button
          onClick={() => onNavigate('landing')}
          className={`flex flex-col items-center justify-center py-1 transition-colors ${
            currentView === 'landing' ? 'text-blue-700 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Home className={`w-5 h-5 mb-0.5 ${currentView === 'landing' ? 'stroke-[2.5]' : ''}`} />
          <span className="text-[11px]">الرئيسية</span>
        </button>

        <button
          onClick={() => onNavigate('services')}
          className={`flex flex-col items-center justify-center py-1 transition-colors ${
            currentView === 'services' ? 'text-blue-700 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Briefcase className={`w-5 h-5 mb-0.5 ${currentView === 'services' ? 'stroke-[2.5]' : ''}`} />
          <span className="text-[11px]">الخدمات</span>
        </button>

        <button
          onClick={() => onNavigate('portal')}
          className={`flex flex-col items-center justify-center py-1 transition-colors ${
            isPortalActive ? 'text-blue-700 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <FolderOpen className={`w-5 h-5 mb-0.5 ${isPortalActive ? 'stroke-[2.5]' : ''}`} />
          <span className="text-[11px]">طلباتي</span>
        </button>

        <button
          onClick={() => onNavigate('appointments')}
          className={`flex flex-col items-center justify-center py-1 transition-colors ${
            currentView === 'appointments' ? 'text-blue-700 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Calendar className={`w-5 h-5 mb-0.5 ${currentView === 'appointments' ? 'stroke-[2.5]' : ''}`} />
          <span className="text-[11px]">المواعيد</span>
        </button>

        <button
          onClick={() => onNavigate('messages')}
          className={`flex flex-col items-center justify-center py-1 transition-colors ${
            currentView === 'messages' ? 'text-blue-700 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <MessageSquare className={`w-5 h-5 mb-0.5 ${currentView === 'messages' ? 'stroke-[2.5]' : ''}`} />
          <span className="text-[11px]">الرسائل</span>
        </button>
      </div>
    </nav>
  );
};
