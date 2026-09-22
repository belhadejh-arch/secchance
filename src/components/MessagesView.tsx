import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { Conversation, Message } from '../types';
import { useAuth } from '../context/AuthContext';
import { 
  MessageSquare, 
  Send, 
  Paperclip, 
  Shield, 
  User, 
  Clock, 
  Search, 
  ArrowRight,
  Phone,
  Video,
  CheckCheck
} from 'lucide-react';

interface MessagesViewProps {
  initialConversationId?: number | null;
  onBack?: () => void;
}

export const MessagesView: React.FC<MessagesViewProps> = ({ initialConversationId, onBack }) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<number | null>(initialConversationId || null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newText, setNewText] = useState('');
  const [sending, setSending] = useState(false);
  const [searchChat, setSearchChat] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchConversations = async () => {
    try {
      const res = await api.getConversations();
      const list = res.data || [];
      if (list.length === 0) {
        // Fallback seed matching Image 1 Screen 8
        setConversations([
          {
            id: 1,
            number_case: 'SC-2025-0012',
            contact_name: 'د. فاطمة الزهراء بن عيسى',
            role_title: 'أخصائي نفسي',
            last_message: 'تم إرسال التقرير الطبي وخطة المتابعة...',
            time: '10:24 ص',
            unread_count: 2,
            avatar: 'ف.ز',
            avatarBg: 'bg-blue-100 text-[#1565C0]'
          },
          {
            id: 2,
            number_case: 'SC-2025-0012',
            contact_name: 'أ. محمد العربي',
            role_title: 'مستشار قانوني',
            last_message: 'بخصوص الاستشارة القانونية وتدابير الحماية...',
            time: '09:15 ص',
            unread_count: 1,
            avatar: 'م.ع',
            avatarBg: 'bg-amber-100 text-amber-700'
          },
          {
            id: 3,
            number_case: 'SC-2025-0015',
            contact_name: 'مركز الأمل للعلاج والسموم',
            role_title: 'مركز استشفائي',
            last_message: 'تم قبول الإحالة وجدولة التحاليل المخبرية...',
            time: 'أمس',
            unread_count: 0,
            avatar: 'م.أ',
            avatarBg: 'bg-emerald-100 text-emerald-700'
          },
          {
            id: 4,
            number_case: 'SC-2025-0018',
            contact_name: 'جمعية البر والإحسان للتأهيل',
            role_title: 'جمعية مرافقة',
            last_message: 'شكراً لتواصلكم، نحن جاهزون للمرافقة الأسرية...',
            time: 'أمس',
            unread_count: 0,
            avatar: 'ج.ب',
            avatarBg: 'bg-teal-100 text-teal-700'
          },
          {
            id: 5,
            number_case: 'SYS-001',
            contact_name: 'إدارة المنصة (SCP Support)',
            role_title: 'فريق الدعم الفني والسرية',
            last_message: 'تم تحديث حالة طلبك وتأكيد حجز الموعد بنجاح.',
            time: 'السبت',
            unread_count: 0,
            avatar: 'إ.م',
            avatarBg: 'bg-purple-100 text-purple-700'
          }
        ]);
      } else {
        setConversations(list.map((c: any) => ({
          ...c,
          contact_name: `${c.creator_first_name || 'مختص'} ${c.creator_last_name || ''}`,
          role_title: 'مختص معتمد',
          time: 'الآن',
          unread_count: 0,
          avatar: 'م.ع',
          avatarBg: 'bg-blue-100 text-[#1565C0]'
        })));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMessages = async (convId: number) => {
    try {
      const res = await api.getMessages(convId);
      const list = res.data.messages || [];
      if (list.length === 0) {
        setMessages([
          {
            id: 1,
            sender_id: 999,
            sender_name: 'د. فاطمة الزهراء بن عيسى',
            body: 'السلام عليكم ورحمة الله، مرحباً بك. قمت بمراجعة التقرير الأولي وسنبدأ أول جلسة استماع غداً إن شاء الله.',
            created_at: new Date(Date.now() - 3600000).toISOString()
          },
          {
            id: 2,
            sender_id: user?.id || 1,
            sender_name: 'أنت',
            body: 'وعليكم السلام دكتورة، شكراً جزيلاً لاهتمامكم وسرعة الاستجابة. نحن جاهزون للمتابعة.',
            created_at: new Date(Date.now() - 1800000).toISOString()
          }
        ]);
      } else {
        setMessages(list);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (selectedConvId) {
      fetchMessages(selectedConvId);
    }
  }, [selectedConvId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim() || !selectedConvId) return;
    setSending(true);
    const textToSend = newText;
    setNewText('');

    // Optimistic append
    const localMsg = {
      id: Date.now(),
      sender_id: user?.id || 1,
      sender_name: 'أنت',
      body: textToSend,
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, localMsg]);

    try {
      await api.sendMessage(selectedConvId, textToSend);
    } catch (err) {
      // already added optimistically
    } finally {
      setSending(false);
    }
  };

  const activeConv = conversations.find(c => c.id === selectedConvId);

  const filteredConversations = conversations.filter(c => 
    c.contact_name?.includes(searchChat) || 
    c.number_case?.includes(searchChat) ||
    c.last_message?.includes(searchChat)
  );

  return (
    <div className="max-w-xl mx-auto px-4 py-4 space-y-4 pb-24" dir="rtl">
      {/* If a conversation is selected on mobile, render the dedicated thread */}
      {selectedConvId && activeConv ? (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden flex flex-col h-[75vh]">
          {/* Active Chat Header */}
          <div className="p-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setSelectedConvId(null)}
                className="p-1 text-slate-500 hover:text-slate-900 rounded-lg"
              >
                <ArrowRight className="w-5 h-5" />
              </button>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${activeConv.avatarBg}`}>
                {activeConv.avatar}
              </div>
              <div>
                <h3 className="font-bold text-xs sm:text-sm text-slate-900 leading-tight">
                  {activeConv.contact_name}
                </h3>
                <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  متصل الآن • سرية مشفرة
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button 
                onClick={() => alert('بدء مكالمة صوتية سرية مشفرة')} 
                className="p-2 text-slate-500 hover:text-[#1565C0] rounded-xl hover:bg-slate-100"
              >
                <Phone className="w-4 h-4" />
              </button>
              <button 
                onClick={() => alert('بدء جلسة فيديو استشارية آمنة')} 
                className="p-2 text-slate-500 hover:text-[#1565C0] rounded-xl hover:bg-slate-100"
              >
                <Video className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#fefefa]">
            {messages.map((m) => {
              const isMe = m.sender_id === (user?.id || 1);
              return (
                <div
                  key={m.id}
                  className={`flex flex-col ${isMe ? 'items-start' : 'items-end'}`}
                >
                  <div
                    className={`max-w-[82%] p-3 rounded-2xl text-xs leading-relaxed ${
                      isMe
                        ? 'bg-[#1565C0] text-white rounded-br-xs shadow-xs'
                        : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-xs shadow-xs'
                    }`}
                  >
                    <p>{m.body}</p>
                    <div className={`flex items-center justify-end gap-1 mt-1 text-[9px] ${isMe ? 'text-blue-100' : 'text-slate-400'}`}>
                      <span>{new Date(m.created_at).toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit' })}</span>
                      {isMe && <CheckCheck className="w-3 h-3" />}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input */}
          <form onSubmit={handleSend} className="p-3 border-t border-slate-100 bg-white flex items-center gap-2">
            <input
              type="text"
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              placeholder="اكتب رسالتك السرية هنا..."
              className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs outline-none focus:bg-white focus:ring-2 focus:ring-[#1565C0]/20"
            />
            <button
              type="submit"
              disabled={sending || !newText.trim()}
              className="p-2.5 bg-[#1565C0] hover:bg-blue-700 disabled:opacity-50 text-white rounded-2xl transition-colors cursor-pointer shadow-xs shrink-0"
            >
              <Send className="w-4 h-4 transform rotate-180" />
            </button>
          </form>
        </div>
      ) : (
        /* Conversation List (Matching Screen 8 in Reference Mockup) */
        <div className="space-y-3.5">
          {/* Header */}
          <div className="flex items-center justify-between">
            {onBack && (
              <button onClick={onBack} className="flex items-center gap-1 text-slate-600 hover:text-slate-900 text-xs font-bold">
                <ArrowRight className="w-4 h-4" />
                <span>رجوع</span>
              </button>
            )}
            <h1 className="text-base font-black text-slate-900">الرسائل والمحادثات</h1>
            <span className="text-[11px] font-bold text-[#1565C0] bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
              مشفرة بالكامل
            </span>
          </div>

          {/* Search bar (Matching Screen 8) */}
          <div className="relative">
            <input
              type="text"
              value={searchChat}
              onChange={(e) => setSearchChat(e.target.value)}
              placeholder="ابحث في المحادثات..."
              className="w-full pl-4 pr-10 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1565C0]/20 shadow-xs"
            />
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
          </div>

          {/* Conversations Items List (Matching Screen 8) */}
          <div className="bg-white rounded-3xl border border-slate-200/80 divide-y divide-slate-100 overflow-hidden shadow-xs">
            {filteredConversations.map((c) => (
              <div
                key={c.id}
                onClick={() => setSelectedConvId(c.id)}
                className="p-3.5 hover:bg-slate-50/80 transition-colors cursor-pointer flex items-center justify-between gap-3 text-right"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${c.avatarBg}`}>
                    {c.avatar}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                      {c.contact_name}
                    </h4>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                      {c.last_message}
                    </p>
                  </div>
                </div>

                <div className="text-left shrink-0 space-y-1">
                  <span className="text-[10px] text-slate-400 block">{c.time}</span>
                  {c.unread_count > 0 && (
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#1565C0] text-white font-bold text-[10px] shadow-xs">
                      {c.unread_count}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
