import React, { useState } from 'react';
import { 
  ArrowRight, 
  Bell, 
  CheckCircle2, 
  Calendar, 
  MessageSquare, 
  Activity, 
  Clock, 
  Check, 
  Trash2 
} from 'lucide-react';

interface NotificationsViewProps {
  onBack: () => void;
  onNavigateTo: (view: string) => void;
}

export const NotificationsView: React.FC<NotificationsViewProps> = ({ onBack, onNavigateTo }) => {
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: 'تم قبول طلبك',
      desc: 'تم قبول طلب المساعدة الخاص بك وتعيين أخصائي نفسي للمتابعة.',
      time: '10:30 ص',
      unread: true,
      type: 'success',
      icon: CheckCircle2,
      targetView: 'case-detail'
    },
    {
      id: 2,
      title: 'موعد جديد',
      desc: 'تم تحديد موعد جلستك القادمة: الأحد 20 أبريل الساعة 10:00 صباحاً.',
      time: '09:15 ص',
      unread: true,
      type: 'calendar',
      icon: Calendar,
      targetView: 'appointments'
    },
    {
      id: 3,
      title: 'رسالة جديدة',
      desc: 'لديك رسالة جديدة من د. فاطمة الزهراء بن عيسى بخصوص التقرير الطبي.',
      time: 'أمس',
      unread: false,
      type: 'message',
      icon: MessageSquare,
      targetView: 'messages'
    },
    {
      id: 4,
      title: 'تحديث الحالة',
      desc: 'تم تحديث حالة ملفك الطبي إلى "قيد المتابعة والعلاج السريري".',
      time: 'السبت',
      unread: false,
      type: 'status',
      icon: Activity,
      targetView: 'case-detail'
    },
    {
      id: 5,
      title: 'تذكير بالموعد',
      desc: 'موعدك الاستشاري القانوني مجدول غداً الساعة 14:00.',
      time: 'الخميس',
      unread: false,
      type: 'reminder',
      icon: Clock,
      targetView: 'appointments'
    }
  ]);

  const filtered = notifications.filter(n => filter === 'all' || n.unread);

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-4 space-y-4 pb-24" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-slate-600 hover:text-slate-900 text-xs font-bold"
        >
          <ArrowRight className="w-4 h-4" />
          <span>رجوع</span>
        </button>
        <h1 className="text-base font-black text-slate-900">الإشعارات</h1>
        <button
          onClick={markAllRead}
          className="text-[11px] font-bold text-[#1565C0] hover:underline"
        >
          تحديد الكل كمقروء
        </button>
      </div>

      {/* Tabs Row (Matching Screen 9: الكل | غير مقروءة) */}
      <div className="flex rounded-2xl bg-slate-100 p-1 text-xs font-bold">
        <button
          onClick={() => setFilter('all')}
          className={`flex-1 py-2 rounded-xl transition-all ${
            filter === 'all' ? 'bg-white text-[#1565C0] shadow-xs' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          الكل ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`flex-1 py-2 rounded-xl transition-all ${
            filter === 'unread' ? 'bg-white text-[#1565C0] shadow-xs' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          غير مقروءة ({notifications.filter(n => n.unread).length})
        </button>
      </div>

      {/* Notifications List (Matching Screen 9) */}
      <div className="space-y-2.5">
        {filtered.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              onClick={() => onNavigateTo(item.targetView)}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                item.unread
                  ? 'bg-blue-50/50 border-blue-200 shadow-xs'
                  : 'bg-white border-slate-200/80 hover:bg-slate-50'
              }`}
            >
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                item.type === 'success' ? 'bg-emerald-100 text-emerald-700' :
                item.type === 'calendar' ? 'bg-blue-100 text-[#1565C0]' :
                item.type === 'message' ? 'bg-purple-100 text-purple-700' :
                'bg-amber-100 text-amber-700'
              }`}>
                <Icon className="w-5 h-5" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <h4 className={`text-xs sm:text-sm font-bold ${item.unread ? 'text-slate-900' : 'text-slate-700'}`}>
                    {item.title}
                  </h4>
                  <span className="text-[10px] text-slate-400 shrink-0">{item.time}</span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                  {item.desc}
                </p>
              </div>

              {item.unread && (
                <span className="w-2 h-2 rounded-full bg-[#1565C0] shrink-0 mt-2" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
