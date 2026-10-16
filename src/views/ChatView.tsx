import React, { useEffect, useState } from 'react';
import { Conversation, Message } from '../types';
import { Send } from 'lucide-react';

interface ChatViewProps {
  conversations: Conversation[];
  messagesMap: Record<number, Message[]>;
  onSendMessage: (convId: number, content: string) => void | Promise<void>;
}

export const ChatView: React.FC<ChatViewProps> = ({
  conversations,
  messagesMap,
  onSendMessage,
}) => {
  const [selectedConvId, setSelectedConvId] = useState<number | null>(
    conversations[0]?.id ?? null
  );
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');

  useEffect(() => {
    if (!conversations.some((conversation) => conversation.id === selectedConvId)) {
      setSelectedConvId(conversations[0]?.id ?? null);
    }
  }, [conversations, selectedConvId]);

  const currentMessages = selectedConvId === null ? [] : messagesMap[selectedConvId] || [];

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || selectedConvId === null || sending) return;
    setSending(true);
    setSendError('');
    try {
      await onSendMessage(selectedConvId, text);
      setText('');
    } catch (error) {
      setSendError(error instanceof Error ? error.message : 'تعذر إرسال الرسالة.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-[#FBFDFC] rounded-[16px] border border-[#E5ECE9] shadow-xs overflow-hidden h-[75vh] flex flex-col md:flex-row max-w-4xl mx-auto">
      {/* Conversations Sidebar */}
      <div className="w-full md:w-[240px] border-b md:border-b-0 md:border-l border-[#E5ECE9] bg-[#FBFDFC] p-3 flex flex-col shrink-0">
        <h2 className="font-bold text-[14px] text-[#203945] mb-2.5">
          غرف المحادثة والمتابعة
        </h2>
        <div className="space-y-2 overflow-y-auto flex-1">
          {conversations.map((conv) => {
            const isSelected = conv.id === selectedConvId;
            return (
              <div
                key={conv.id}
                onClick={() => setSelectedConvId(conv.id)}
                className={`p-2.5 rounded-[12px] cursor-pointer transition-colors border ${
                  isSelected
                    ? 'bg-[#EAF3F8] border-[#1766A6]'
                    : 'bg-[#E5ECE9]/60 border-transparent hover:bg-[#E5ECE9]'
                }`}
              >
                <h4 className="font-bold text-[12px] text-[#203945] truncate">
                  {conv.title}
                </h4>
                <p className="text-[10px] text-[#1766A6] mt-0.5">
                  {conv.caseNumber}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Message Room */}
      <div className="flex-1 flex flex-col bg-[#F3F7F6] p-3">
        {/* Messages List */}
        <div className="flex-1 overflow-y-auto space-y-2.5 p-2">
          {conversations.length === 0 && (
            <p className="rounded-xl border border-[#DCEBF4] bg-white p-4 text-center text-xs leading-6 text-[#203945]/70">
              لا توجد محادثات مرتبطة بطلباتك بعد.
            </p>
          )}
          {currentMessages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${
                msg.isFromMe ? 'items-end' : 'items-start'
              }`}
            >
              <div
                className={`max-w-[280px] sm:max-w-md p-3 rounded-[14px] shadow-xs text-xs sm:text-sm ${
                  msg.isFromMe
                    ? 'bg-[#1766A6] text-white'
                    : 'bg-[#FBFDFC] text-[#203945] border border-[#E5ECE9]'
                }`}
              >
                <span
                  className={`font-bold text-[10px] block mb-1 ${
                    msg.isFromMe ? 'text-white/80' : 'text-[#1766A6]'
                  }`}
                >
                  {msg.senderName}
                </span>
                <p className="text-[12px] leading-relaxed">{msg.content}</p>
              </div>
              <span className="text-[9px] text-[#203945]/50 px-1 mt-0.5">
                {msg.timestamp}
              </span>
            </div>
          ))}
        </div>

        {/* Input Bar */}
        {sendError && (
          <p role="alert" className="mb-2 rounded-lg border border-red-200 bg-red-50 p-2 text-xs text-red-800">
            {sendError}
          </p>
        )}
        <form
          onSubmit={handleSend}
          className="flex items-center gap-2 pt-2 border-t border-[#E5ECE9]"
        >
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="اكتب رسالتك السرية هنا..."
            disabled={selectedConvId === null || sending}
            className="flex-1 p-2.5 px-3 text-xs bg-white border border-[#CCD8D5] rounded-[12px] outline-hidden focus:border-[#1766A6]"
          />
          <button
            type="submit"
            disabled={!text.trim() || selectedConvId === null || sending}
            className="w-11 h-11 rounded-[12px] bg-[#1766A6] hover:bg-[#125386] disabled:opacity-50 text-white flex items-center justify-center transition-colors shrink-0 shadow-xs"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
