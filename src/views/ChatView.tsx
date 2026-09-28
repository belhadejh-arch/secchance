import React, { useState } from 'react';
import { Conversation, Message } from '../types';
import { Send, MessageSquare, Shield, User as UserIcon } from 'lucide-react';

interface ChatViewProps {
  conversations: Conversation[];
  messagesMap: Record<number, Message[]>;
  onSendMessage: (convId: number, content: string) => void;
}

export const ChatView: React.FC<ChatViewProps> = ({
  conversations,
  messagesMap,
  onSendMessage,
}) => {
  const [selectedConvId, setSelectedConvId] = useState<number>(
    conversations[0]?.id || 1
  );
  const [text, setText] = useState('');

  const currentMessages = messagesMap[selectedConvId] || [];
  const currentConv = conversations.find((c) => c.id === selectedConvId);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSendMessage(selectedConvId, text);
    setText('');
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden h-[75vh] flex flex-col md:flex-row">
      {/* Sidebar */}
      <div className="w-full md:w-80 border-b md:border-b-0 md:border-l border-slate-200 bg-slate-50/50 flex flex-col">
        <div className="p-4 border-b border-slate-200 bg-white">
          <h2 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-blue-700" />
            <span>غرف المحادثة والمتابعة</span>
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5">محادثات مشفرة وسرية مع المختصين</p>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
          {conversations.map((conv) => {
            const isSelected = conv.id === selectedConvId;
            return (
              <div
                key={conv.id}
                onClick={() => setSelectedConvId(conv.id)}
                className={`p-3 rounded-xl cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-blue-100/80 border border-blue-200'
                    : 'bg-white hover:bg-slate-100/80 border border-slate-200/70'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-extrabold text-xs text-blue-700">
                    {conv.caseNumber}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {conv.lastMessageTime}
                  </span>
                </div>
                <h4 className="font-bold text-xs text-slate-900 truncate">
                  {conv.title}
                </h4>
                <p className="text-[11px] text-slate-500 truncate mt-0.5">
                  {conv.lastMessage}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Chat Room */}
      <div className="flex-1 flex flex-col bg-slate-50/30">
        {/* Chat Header */}
        <div className="p-3.5 px-5 border-b border-slate-200 bg-white flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-sm text-slate-900">
              {currentConv?.title || 'غرفة المتابعة'}
            </h3>
            <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
              <Shield className="w-3 h-3" />
              <span>محادثة مشفرة — رقم الحالة: {currentConv?.caseNumber}</span>
            </span>
          </div>
        </div>

        {/* Messages List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {currentMessages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${
                msg.isFromMe ? 'items-end' : 'items-start'
              }`}
            >
              <span className="text-[10px] font-bold text-slate-500 px-1 mb-1">
                {msg.senderName}
              </span>
              <div
                className={`max-w-xs sm:max-w-md p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-xs ${
                  msg.isFromMe
                    ? 'bg-blue-700 text-white rounded-br-xs'
                    : 'bg-white text-slate-800 border border-slate-200 rounded-bl-xs'
                }`}
              >
                {msg.content}
              </div>
              <span className="text-[9px] text-slate-400 mt-1 px-1">
                {msg.timestamp}
              </span>
            </div>
          ))}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={handleSend}
          className="p-3 border-t border-slate-200 bg-white flex items-center gap-2"
        >
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="اكتب رسالتك السرية هنا..."
            className="flex-1 p-2.5 px-4 text-xs sm:text-sm border border-slate-300 rounded-xl outline-hidden focus:ring-2 focus:ring-blue-600 bg-slate-50"
          />
          <button
            type="submit"
            disabled={!text.trim()}
            className="w-11 h-11 rounded-xl bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white flex items-center justify-center transition-colors shrink-0 shadow-xs"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
