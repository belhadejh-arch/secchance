import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Bell, Calendar, MessageSquare, Activity, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';
import type { NotificationItem } from '../types';

interface NotificationsViewProps {
  onBack: () => void;
  onNavigateTo: (view: string) => void;
}

const notificationIcon = (type: string) => {
  const normalized = type.toLowerCase();
  if (normalized.includes('appointment') || normalized.includes('calendar')) return Calendar;
  if (normalized.includes('message') || normalized.includes('conversation')) return MessageSquare;
  if (normalized.includes('status') || normalized.includes('case') || normalized.includes('request')) return Activity;
  if (normalized.includes('success') || normalized.includes('accepted')) return CheckCircle2;
  return Bell;
};

const navigationTarget = (notification: NotificationItem): string | null => {
  const validViews = ['appointments', 'messages', 'portal', 'case-detail'];
  const link = notification.link?.replace(/^\/+|\/+$/g, '').toLowerCase();
  if (link && validViews.includes(link)) return link;
  const type = notification.type.toLowerCase();
  if (type.includes('appointment') || type.includes('calendar')) return 'appointments';
  if (type.includes('message') || type.includes('conversation')) return 'messages';
  if (type.includes('case') || type.includes('request') || type.includes('status')) return 'portal';
  return null;
};

const isUnread = (item: NotificationItem) => !Boolean(item.is_read);
const dateTime = (value: string) => new Date(value).toLocaleString('ar-DZ', { dateStyle: 'medium', timeStyle: 'short' });

export const NotificationsView: React.FC<NotificationsViewProps> = ({ onBack, onNavigateTo }) => {
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<number | null>(null);
  const [markingAll, setMarkingAll] = useState(false);

  const loadNotifications = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.getNotifications();
      setNotifications(Array.isArray(response.data) ? response.data : []);
    } catch (err: any) {
      setNotifications([]);
      setError(err?.message || 'تعذر تحميل الإشعارات.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadNotifications(); }, []);

  const unreadCount = useMemo(() => notifications.filter(isUnread).length, [notifications]);
  const filtered = useMemo(
    () => filter === 'unread' ? notifications.filter(isUnread) : notifications,
    [filter, notifications]
  );

  const openNotification = async (item: NotificationItem) => {
    setError('');
    if (isUnread(item)) {
      setBusyId(item.id);
      try {
        await api.markNotificationRead(item.id);
        setNotifications(current => current.map(notification => notification.id === item.id ? { ...notification, is_read: 1 } : notification));
      } catch (err: any) {
        setError(err?.message || 'تعذر تحديث حالة الإشعار.');
        setBusyId(null);
        return;
      }
      setBusyId(null);
    }
    const target = navigationTarget(item);
    if (target) onNavigateTo(target);
  };

  const markAllRead = async () => {
    if (!unreadCount) return;
    setMarkingAll(true);
    setError('');
    try {
      await api.markAllNotificationsRead();
      setNotifications(current => current.map(item => ({ ...item, is_read: 1 })));
    } catch (err: any) {
      setError(err?.message || 'تعذر تحديد الإشعارات كمقروءة.');
    } finally {
      setMarkingAll(false);
    }
  };

  return (
    <main className="max-w-xl mx-auto px-4 py-4 space-y-4 pb-24" dir="rtl">
      <header className="flex items-center justify-between gap-3">
        <button onClick={onBack} className="flex items-center gap-1.5 text-slate-600 hover:text-slate-900 text-xs font-bold">
          <ArrowRight className="w-4 h-4" /><span>رجوع</span>
        </button>
        <h1 className="text-base font-black text-slate-900">الإشعارات</h1>
        <button onClick={() => void loadNotifications()} className="p-2 rounded-xl text-slate-500 hover:bg-slate-100" aria-label="تحديث الإشعارات">
          <RefreshCw className="w-4 h-4" />
        </button>
      </header>

      {error && <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800"><AlertCircle size={16} />{error}</div>}

      <div className="flex items-center justify-between gap-3">
        <div className="flex rounded-2xl bg-slate-100 p-1 text-xs font-bold flex-1">
          <button onClick={() => setFilter('all')} className={`flex-1 py-2 rounded-xl transition-all ${filter === 'all' ? 'bg-white text-[#1565C0] shadow-xs' : 'text-slate-500'}`}>
            الكل ({loading ? '—' : notifications.length})
          </button>
          <button onClick={() => setFilter('unread')} className={`flex-1 py-2 rounded-xl transition-all ${filter === 'unread' ? 'bg-white text-[#1565C0] shadow-xs' : 'text-slate-500'}`}>
            غير مقروءة ({loading ? '—' : unreadCount})
          </button>
        </div>
        <button onClick={() => void markAllRead()} disabled={markingAll || !unreadCount} className="text-[10px] font-bold text-[#1565C0] hover:underline disabled:text-slate-400 disabled:no-underline">
          {markingAll ? 'جارٍ التحديث…' : 'تحديد الكل كمقروء'}
        </button>
      </div>

      {loading ? (
        <div className="space-y-2.5" aria-label="جارٍ تحميل الإشعارات">
          <div className="h-20 rounded-2xl bg-slate-100 animate-pulse" />
          <div className="h-20 rounded-2xl bg-slate-100 animate-pulse" />
        </div>
      ) : error && notifications.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-7 text-center space-y-3">
          <Bell className="w-6 h-6 mx-auto text-slate-400" />
          <p className="m-0 text-xs text-slate-600">تعذر تحميل الإشعارات من الخادم.</p>
          <button onClick={() => void loadNotifications()} className="text-xs font-bold text-[#1565C0]">إعادة المحاولة</button>
        </div>
      ) : filtered.length ? (
        <div className="space-y-2.5">
          {filtered.map(item => {
            const Icon = notificationIcon(item.type || '');
            const unread = isUnread(item);
            const target = navigationTarget(item);
            return (
              <article key={item.id} className={`p-3.5 rounded-2xl border transition-all flex items-start gap-3 ${unread ? 'bg-blue-50/50 border-blue-200 shadow-xs' : 'bg-white border-slate-200/80'}`}>
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${unread ? 'bg-blue-100 text-[#1565C0]' : 'bg-slate-100 text-slate-500'}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h2 className={`m-0 text-xs sm:text-sm font-bold ${unread ? 'text-slate-900' : 'text-slate-700'}`}>{item.title}</h2>
                    <time className="text-[10px] text-slate-400 shrink-0">{dateTime(item.created_at)}</time>
                  </div>
                  <p className="m-0 text-xs text-slate-500 leading-relaxed">{item.message}</p>
                  <button onClick={() => void openNotification(item)} disabled={busyId === item.id || (!unread && !target)} className="mt-2 text-[10px] font-bold text-[#1565C0] disabled:text-slate-400">
                    {busyId === item.id ? 'جارٍ التحديث…' : target ? 'فتح المرتبط بالإشعار' : unread ? 'تحديد كمقروء' : 'تمت القراءة'}
                  </button>
                </div>
                {unread && <span className="w-2 h-2 rounded-full bg-[#1565C0] shrink-0 mt-2" aria-label="غير مقروء" />}
              </article>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
          <Bell className="w-6 h-6 mx-auto text-slate-400" />
          <h2 className="mt-3 text-sm font-bold text-slate-700">{filter === 'unread' ? 'لا توجد إشعارات غير مقروءة' : 'لا توجد إشعارات'}</h2>
          <p className="text-xs text-slate-500">ستظهر هنا الإشعارات التي يرسلها النظام إلى حسابك.</p>
        </div>
      )}
    </main>
  );
};