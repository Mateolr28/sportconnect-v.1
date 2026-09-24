import React, { useState, useEffect } from 'react';
import { Chat } from '../types';
import { ChatList } from '../components/ChatList';
import { ChatWindow } from '../components/ChatWindow';
import { supabaseService } from '../services/supabaseService';
import { useAuth } from '../contexts/AuthContext';

interface MessagesPageProps {
  initialChatId?: string | null;
}

export const MessagesPage: React.FC<MessagesPageProps> = ({ initialChatId }) => {
  const { profile } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchChats = async () => {
    if (!profile) return;
    try {
      const data = await supabaseService.getChats(profile.id);
      setChats(data);

      if (initialChatId) {
        const found = data.find((c) => c.id === initialChatId);
        if (found) {
          setSelectedChat(found);
          return;
        }
      }

      if (!selectedChat && data.length > 0) {
        setSelectedChat(data[0]);
      }
    } catch (err) {
      console.error('Error cargando chats:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchChats();
  }, [profile?.id, initialChatId]);

  return (
    <div className="h-screen flex flex-col bg-white overflow-hidden">
      {/* Encabezado superior */}
      <div className="px-6 py-4 border-b border-slate-200">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Mensajes</h1>
      </div>

      {/* Contenedor de dos columnas */}
      <div className="flex-1 flex overflow-hidden">
        {/* Columna Izquierda: Lista de chats */}
        <ChatList
          chats={chats}
          selectedChatId={selectedChat?.id || null}
          onSelectChat={(c) => setSelectedChat(c)}
        />

        {/* Columna Derecha: Ventana del chat activo */}
        <ChatWindow chat={selectedChat} onMessageSent={fetchChats} />
      </div>
    </div>
  );
};
