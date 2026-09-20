import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { Conversation, Message } from '../types';
import { useAuth } from '../context/AuthContext';
import { MessageSquare, Send, Paperclip, Shield, User, Clock } from 'lucide-react';

interface MessagesViewProps {
  initialConversationId?: number | null;
}

export const MessagesView: React.FC<MessagesViewProps> = ({ initialConversationId }) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<number | null>(initialConversationId || null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newText, setNewText] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchConversations = async () => {
    try {
      const res = await api.getConversations();
      setConversations(res.data || []);
      if (res.data?.length > 0 && !selectedConvId) {
        setSelectedConvId(res.data[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMessages = async (convId: number) => {
    try {
      const res = await api.getMessages(convId);
      setMessages(res.data.messages || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (initialConversationId) {
      setSelectedConvId(initialConversationId);
    }
  }, [initialConversationId]);

  useEffect(() => {
    if (selectedConvId) {
      fetchMessages(selectedConvId);
      const interval = setInterval(() => fetchMessages(selectedConvId), 4000);
      return () => clearInterval(interval);
    }
  }, [selectedConvId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConvId || !newText.trim() || sending) return;
    const text = newText;
    setNewText('');
    setSending(true);

    try {
      await api.sendMessage(selectedConvId, text);
      await fetchMessages(selectedConvId);
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  const activeConv = conversations.find(c => c.id === selectedConvId);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden grid grid-cols-1 md:grid-cols-3 h-[700px]">
        {/* Conversations List */}
        <div className="border-l border-slate-200 flex flex-col h-full bg-slate-50/50">
          <div className="p-4 border-b border-slate-200 bg-white flex items-center justify-between">
            <span className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[#1565C0]" />
              <span>المحادثات الآمنة ({conversations.length})</span>
            </span>
          </div>

          <div className="overflow-y-auto flex-1 divide-y divide-slate-100">
            {conversations.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">لا توجد محادثات نشطة حالياً</div>
            ) : (
              conversations.map(c => {
                const isSelected = selectedConvId === c.id;
                return (
                  <div
                    key={c.id}
                    onClick={() => setSelectedConvId(c.id)}
                    className={`p-4 cursor-pointer transition-all text-right space-y-1 ${isSelected ? 'bg-blue-50 border-r-4 border-r-[#1565C0]' : 'hover:bg-slate-100/60'}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-black text-xs text-slate-900 font-sans">{c.number_case}</span>
                      <span className="text-[10px] text-slate-400">
                        {c.last_message_at ? new Date(c.last_message_at).toLocaleDateString('ar-DZ') : ''}
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-slate-700 truncate">
                      {c.creator_first_name} {c.creator_last_name}
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-1">
                      {c.last_message || 'محادثة آمنة مشفرة للحالة'}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="md:col-span-2 flex flex-col h-full bg-white">
          {!selectedConvId || !activeConv ? (
            <div className="flex-1 flex items-center justify-center text-slate-400 text-xs">
              حدد محادثة من القائمة للبدء
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-white">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-[#1565C0] flex items-center justify-center font-bold">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">
                      قناة التواصل للحالة: <span className="font-sans text-[#1565C0]">{activeConv.number_case}</span>
                    </h3>
                    <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                      <Shield className="w-3 h-3 text-emerald-600" />
                      <span>تشفير نقطة-لنقطة وسرية مهنية تامة</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Messages Scroll Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/40">
                {messages.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-xs">
                    بداية المحادثة. يمكنك توجيه الأسئلة واستلام الإرشادات والملاحظات هنا.
                  </div>
                ) : (
                  messages.map(m => {
                    const isMe = m.sender_id === user?.id;
                    return (
                      <div
                        key={m.id}
                        className={`flex flex-col ${isMe ? 'items-start' : 'items-end'}`}
                      >
                        <div className="text-[10px] font-semibold text-slate-400 mb-1 px-1">
                          {isMe ? 'أنت' : `${m.first_name} ${m.last_name}`}
                        </div>
                        <div
                          className={`max-w-[80%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed ${isMe ? 'bg-[#1565C0] text-white rounded-tr-xs shadow-xs' : 'bg-white text-slate-800 border border-slate-200 rounded-tl-xs shadow-xs'}`}
                        >
                          <p>{m.content}</p>
                          <span className={`text-[9px] mt-1 block font-sans ${isMe ? 'text-blue-200 text-left' : 'text-slate-400 text-right'}`}>
                            {new Date(m.created_at).toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-200 bg-white flex items-center gap-2">
                <input
                  type="text"
                  value={newText}
                  onChange={(e) => setNewText(e.target.value)}
                  placeholder="اكتب رسالتك وسؤالك بسرية..."
                  className="flex-1 p-3 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#1565C0] outline-none"
                />
                <button
                  type="submit"
                  disabled={!newText.trim() || sending}
                  className="px-5 py-3 bg-[#1565C0] hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Send className="w-4 h-4 rtl:rotate-180" />
                  <span className="hidden sm:inline">إرسال</span>
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
