import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { Chat } from '../types';
import { ProfileAvatar } from './ProfileAvatar';

interface ChatListProps {
  chats: Chat[];
  selectedChatId: string | null;
  onSelectChat: (chat: Chat) => void;
}

export const ChatList: React.FC<ChatListProps> = ({
  chats,
  selectedChatId,
  onSelectChat,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredChats = chats.filter((c) => {
    const name = c.other_participant?.nombre || '';
    return name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const getAvatarBg = (index: number) => {
    const colors = ['bg-[#0d9488]', 'bg-[#1E3A8A]', 'bg-[#0f766e]', 'bg-[#1e40af]'];
    return colors[index % colors.length];
  };

  return (
    <div className="w-full md:w-80 lg:w-96 border-r border-slate-200 bg-white flex flex-col h-full">
      {/* Buscador de conversaciones */}
      <div className="p-4 border-b border-slate-100">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar conversaciones..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* Lista de chats */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
        {filteredChats.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            No se encontraron conversaciones
          </div>
        ) : (
          filteredChats.map((chat, idx) => {
            const isSelected = selectedChatId === chat.id;
            const name = chat.other_participant?.nombre || 'Contacto Deportivo';
            const lastMsg = chat.last_message?.contenido || 'Conversación iniciada';
            const time = chat.last_message?.created_at?.includes('T')
              ? new Date(chat.last_message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : chat.last_message?.created_at || '10:30';

            return (
              <div
                key={chat.id}
                onClick={() => onSelectChat(chat)}
                className={`p-4 flex items-center gap-3.5 cursor-pointer transition-colors relative ${
                  isSelected
                    ? 'bg-blue-50/70 border-l-4 border-[#1E3A8A]'
                    : 'hover:bg-slate-50'
                }`}
              >
                <ProfileAvatar
                  profile={chat.other_participant}
                  sizeClassName="w-11 h-11"
                  textClassName="text-xs"
                  backgroundClassName={getAvatarBg(idx)}
                  statusClassName="w-3 h-3"
                />

                {/* Contenido info y snippet */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-sm font-bold text-slate-900 truncate">{name}</h4>
                    <span className="text-[11px] text-slate-400 font-medium">{time}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-500 truncate pr-2">{lastMsg}</p>
                    {/* Badge verde de no leídos */}
                    {Boolean(chat.unread_count && chat.unread_count > 0) && (
                      <span className="bg-[#10B981] text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                        {chat.unread_count}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
