import React from 'react';
import { Message } from '../types';

interface MessageBubbleProps {
  message: Message;
  isSentByMe: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isSentByMe }) => {
  return (
    <div className={`flex flex-col ${isSentByMe ? 'items-end' : 'items-start'} mb-3`}>
      <div
        className={`max-w-[75%] md:max-w-[65%] px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
          isSentByMe
            ? 'bg-[#1E3A8A] text-white rounded-br-xs'
            : 'bg-white text-slate-900 border border-slate-200/80 rounded-bl-xs'
        }`}
      >
        <p>{message.contenido}</p>
      </div>
      <span className="text-[11px] text-slate-400 mt-1 px-1">
        {message.created_at?.includes('T')
          ? new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : message.created_at}
      </span>
    </div>
  );
};
