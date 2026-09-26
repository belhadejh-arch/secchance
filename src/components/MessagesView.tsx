import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../services/api';
import type { Conversation, Message } from '../types';
import { useAuth } from '../context/AuthContext';
import { MessageSquare, Send, UserRound, Search, ArrowRight, CheckCheck, RefreshCw, AlertCircle } from 'lucide-react';

interface MessagesViewProps {
  initialConversationId?: number | null;
  onBack?: () => void;
}

type ConversationView = Conversation & {
  contact_name?: string;
  contact_role?: string;
  role_title?: string;
  other_user_name?: string;
  specialist_first_name?: string;
  specialist_last_name?: string;
  creator_role?: string;
  created_at?: string;
};

type MessageView = Message & { body?: string };

const responseList = <T,>(response: any, key: string): T[] => {
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.[key])) return response.data[key];
  return [];
};

const displayName = (conversation: ConversationView) => {
  const name = conversation.contact_name
    || conversation.other_user_name
    || [conversation.specialist_first_name, conversation.specialist_last_name].filter(Boolean).join(' ')
    || [conversation.creator_first_name, conversation.creator_last_name].filter(Boolean).join(' ');
  return name || conversation.title || conversation.number_case || `محادثة رقم ${conversation.id}`;
};

const initials = (name: string) => name.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join('') || '…';
const formatTime = (value?: string) => value
  ? new Date(value).toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit' })
  : '';

export const MessagesView: React.FC<MessagesViewProps> = ({ initialConversationId, onBack }) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ConversationView[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<number | null>(initialConversationId || null);
  const [messages, setMessages] = useState<MessageView[]>([]);
  const [newText, setNewText] = useState('');
  const [sending, setSending] = useState(false);
  const [searchChat, setSearchChat] = useState('');
  const [conversationLoading, setConversationLoading] = useState(true);
  const [conversationError, setConversationError] = useState('');
  const [messageLoading, setMessageLoading] = useState(false);
  const [messageError, setMessageError] = useState('');
  const [sendError, setSendError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageRequestRef = useRef(0);
  const selectedConvRef = useRef(selectedConvId);
  selectedConvRef.current = selectedConvId;

  const loadConversations = useCallback(async () => {
    setConversationLoading(true);
    setConversationError('');
    try {
      const response = await api.getConversations();
      const list = responseList<ConversationView>(response, 'conversations');
      setConversations(list);
      if (initialConversationId) {
        if (list.some(item => item.id === initialConversationId)) {
          setSelectedConvId(initialConversationId);
        } else {
          setSelectedConvId(null);
          setConversationError('هذه المحادثة غير متاحة لحسابك أو لم تعد موجودة.');
        }
      } else if (selectedConvRef.current && !list.some(item => item.id === selectedConvRef.current)) {
        setSelectedConvId(null);
      }
    } catch (err: any) {
      setConversations([]);
      setConversationError(err?.status === 401 || err?.status === 403
        ? 'سجّل الدخول لعرض المحادثات المسموح بها لحسابك.'
        : err?.message || 'تعذر تحميل المحادثات.');
    } finally {
      setConversationLoading(false);
    }
  }, [initialConversationId]);

  const loadMessages = useCallback(async (conversationId: number) => {
    const requestKey = ++messageRequestRef.current;
    setMessageLoading(true);
    setMessageError('');
    setMessages([]);
    try {
      const response = await api.getMessages(conversationId);
      const list = responseList<MessageView>(response, 'messages');
      if (requestKey === messageRequestRef.current) setMessages(list);
    } catch (err: any) {
      if (requestKey === messageRequestRef.current) {
        setMessages([]);
        setMessageError(err?.status === 403
          ? 'لا تملك صلاحية الوصول إلى رسائل هذه المحادثة.'
          : err?.message || 'تعذر تحميل الرسائل.');
      }
    } finally {
      if (requestKey === messageRequestRef.current) setMessageLoading(false);
    }
  }, []);

  useEffect(() => { void loadConversations(); }, [loadConversations]);

  useEffect(() => {
    if (selectedConvId) void loadMessages(selectedConvId);
    else {
      messageRequestRef.current += 1;
      setMessages([]);
      setMessageLoading(false);
      setMessageError('');
    }
  }, [selectedConvId, loadMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (event: React.FormEvent) => {
    event.preventDefault();
    const text = newText.trim();
    if (!text || !selectedConvId || sending) return;
    setSending(true);
    setMessageError('');
    setSendError('');
    try {
      await api.sendMessage(selectedConvId, text);
      setNewText('');
      await Promise.all([loadMessages(selectedConvId), loadConversations()]);
    } catch (err: any) {
      setSendError(err?.message || 'تعذر إرسال الرسالة. لم تُضف إلى سجل المحادثة.');
    } finally {
      setSending(false);
    }
  };

  const activeConv = conversations.find(conversation => conversation.id === selectedConvId);
  const filteredConversations = useMemo(() => {
    const term = searchChat.trim().toLocaleLowerCase();
    if (!term) return conversations;
    return conversations.filter(conversation => {
      const name = displayName(conversation);
      return `${name} ${conversation.number_case || ''} ${conversation.last_message || ''}`.toLocaleLowerCase().includes(term);
    });
  }, [conversations, searchChat]);

  return (
    <main className="max-w-xl mx-auto px-4 py-4 space-y-4 pb-24" dir="rtl">
      {selectedConvId && activeConv ? (
        <section className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden flex flex-col min-h-[68dvh] max-h-[78dvh]">
          <header className="p-3.5 border-b border-slate-100 flex items-center justify-between gap-2 bg-slate-50/70">
            <div className="flex items-center gap-2.5 min-w-0">
              <button onClick={() => setSelectedConvId(null)} className="p-1 text-slate-500 hover:text-slate-900 rounded-lg" aria-label="العودة إلى المحادثات">
                <ArrowRight className="w-5 h-5" />
              </button>
              <div className="w-10 h-10 rounded-full bg-[#e8f0ef] text-[#4a7475] flex items-center justify-center font-bold text-xs shrink-0">
                {initials(displayName(activeConv))}
              </div>
              <div className="min-w-0">
                <h1 className="font-bold text-xs sm:text-sm text-slate-900 leading-tight truncate">{displayName(activeConv)}</h1>
                {(activeConv.contact_role || activeConv.role_title || activeConv.creator_role) && (
                  <span className="text-[10px] text-slate-500">{activeConv.contact_role || activeConv.role_title || activeConv.creator_role}</span>
                )}
              </div>
            </div>
            <button onClick={() => void loadMessages(activeConv.id)} className="p-2 rounded-xl text-slate-500 hover:bg-slate-100" aria-label="تحديث الرسائل">
              <RefreshCw className="w-4 h-4" />
            </button>
          </header>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#fefefa]">
            {messageLoading ? (
              <div className="space-y-3" aria-label="جارٍ تحميل الرسائل">
                <div className="h-12 w-2/3 rounded-2xl bg-slate-100 animate-pulse" />
                <div className="h-14 w-3/4 mr-auto rounded-2xl bg-slate-100 animate-pulse" />
              </div>
            ) : messageError ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-center space-y-3">
                <AlertCircle className="w-5 h-5 mx-auto text-amber-700" />
                <p className="m-0 text-xs text-amber-900">{messageError}</p>
                <button onClick={() => void loadMessages(activeConv.id)} className="text-xs font-bold text-[#1565C0]">إعادة المحاولة</button>
              </div>
            ) : messages.length ? messages.map(message => {
              const isMe = message.sender_id === user?.id;
              const body = message.content || message.body || '';
              return (
                <div key={message.id} className={`flex flex-col ${isMe ? 'items-start' : 'items-end'}`}>
                  <div className={`max-w-[82%] p-3 rounded-2xl text-xs leading-relaxed ${isMe ? 'bg-[#1565C0] text-white rounded-br-xs shadow-xs' : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-xs shadow-xs'}`}>
                    <p className="m-0 whitespace-pre-wrap">{body}</p>
                    <div className={`flex items-center justify-end gap-1 mt-1 text-[9px] ${isMe ? 'text-blue-100' : 'text-slate-400'}`}>
                      <time>{formatTime(message.created_at)}</time>
                      {isMe && <CheckCheck className="w-3 h-3" />}
                    </div>
                  </div>
                </div>
              );
            }) : (
              <div className="h-full min-h-48 grid place-content-center text-center gap-2 text-slate-500">
                <MessageSquare className="w-6 h-6 mx-auto text-slate-400" />
                <strong className="text-xs">لا توجد رسائل في هذه المحادثة</strong>
                <span className="text-[10px]">ستظهر هنا الرسائل التي تُحمّل من الخادم.</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {sendError && <div className="px-3 py-2 text-[10px] text-rose-700 bg-rose-50 border-t border-rose-100">{sendError}</div>}
          <form onSubmit={handleSend} className="p-3 border-t border-slate-100 bg-white flex items-center gap-2">
            <input
              type="text"
              value={newText}
              onChange={event => setNewText(event.target.value)}
              placeholder="اكتب رسالتك..."
              className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs outline-none focus:bg-white focus:ring-2 focus:ring-[#1565C0]/20"
            />
            <button type="submit" disabled={sending || !newText.trim()} className="p-2.5 bg-[#1565C0] hover:bg-blue-700 disabled:opacity-50 text-white rounded-2xl transition-colors shadow-xs shrink-0" aria-label="إرسال الرسالة">
              <Send className="w-4 h-4 transform rotate-180" />
            </button>
          </form>
        </section>
      ) : (
        <section className="space-y-3.5">
          <header className="flex items-center justify-between gap-2">
            {onBack ? (
              <button onClick={onBack} className="flex items-center gap-1 text-slate-600 hover:text-slate-900 text-xs font-bold">
                <ArrowRight className="w-4 h-4" /><span>رجوع</span>
              </button>
            ) : <span />}
            <h1 className="text-base font-black text-slate-900">الرسائل والمحادثات</h1>
            <button onClick={() => void loadConversations()} className="p-2 rounded-xl text-slate-500 hover:bg-slate-100" aria-label="تحديث المحادثات">
              <RefreshCw className="w-4 h-4" />
            </button>
          </header>
          <div className="relative">
            <input
              type="search"
              value={searchChat}
              onChange={event => setSearchChat(event.target.value)}
              placeholder="ابحث في المحادثات..."
              className="w-full pl-4 pr-10 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1565C0]/20 shadow-xs"
            />
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
          </div>
          {conversationError && <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900"><AlertCircle size={16} />{conversationError}</div>}
          {conversationLoading ? (
            <div className="space-y-2" aria-label="جارٍ تحميل المحادثات">
              <div className="h-16 rounded-2xl bg-slate-100 animate-pulse" /><div className="h-16 rounded-2xl bg-slate-100 animate-pulse" />
            </div>
          ) : filteredConversations.length ? (
            <div className="bg-white rounded-3xl border border-slate-200/80 divide-y divide-slate-100 overflow-hidden shadow-xs">
              {filteredConversations.map(conversation => {
                const name = displayName(conversation);
                const count = Number(conversation.unread_count || 0);
                const time = formatTime(conversation.last_message_at || conversation.last_message_time || conversation.created_at);
                return (
                  <button type="button" key={conversation.id} onClick={() => setSelectedConvId(conversation.id)} className="w-full p-3.5 hover:bg-slate-50/80 transition-colors flex items-center justify-between gap-3 text-right">
                    <span className="flex items-center gap-3 min-w-0">
                      <span className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-xs shrink-0 bg-[#e8f0ef] text-[#4a7475]">{initials(name)}</span>
                      <span className="min-w-0 text-right">
                        <strong className="block font-bold text-xs sm:text-sm text-slate-900 truncate">{name}</strong>
                        <span className="block text-[11px] text-slate-500 truncate mt-0.5">{conversation.last_message || conversation.title || conversation.number_case || 'لا توجد معاينة للرسالة'}</span>
                      </span>
                    </span>
                    <span className="text-left shrink-0 space-y-1">
                      {time && <time className="text-[10px] text-slate-400 block">{time}</time>}
                      {count > 0 && <span className="inline-flex items-center justify-center min-w-5 h-5 px-1 rounded-full bg-[#1565C0] text-white font-bold text-[10px]">{count}</span>}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : conversationError ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-7 text-center space-y-3">
              <MessageSquare className="w-6 h-6 mx-auto text-slate-400" />
              <p className="m-0 text-xs text-slate-600">تعذر تحميل قائمة المحادثات.</p>
              <button onClick={() => void loadConversations()} className="text-xs font-bold text-[#1565C0]">إعادة المحاولة</button>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
              <UserRound className="w-6 h-6 mx-auto text-slate-400" />
              <h2 className="mt-3 text-sm font-bold text-slate-700">{searchChat ? 'لا توجد محادثات مطابقة' : 'لا توجد محادثات بعد'}</h2>
              <p className="text-xs text-slate-500">ستظهر هنا المحادثات المتاحة لحسابك عند تسجيلها.</p>
            </div>
          )}
        </section>
      )}
    </main>
  );
};