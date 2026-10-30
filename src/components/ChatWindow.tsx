import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, MoreVertical, Send } from 'lucide-react';
import { Chat, Message } from '../types';
import { MessageBubble } from './MessageBubble';
import { supabaseService } from '../services/supabaseService';
import { useAuth } from '../contexts/AuthContext';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { ProfileAvatar } from './ProfileAvatar';

interface ChatWindowProps {
  chat: Chat | null;
  onMessageSent?: () => void;
  onBack?: () => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ chat, onMessageSent, onBack }) => {
  const { profile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const otherUser = chat?.other_participant;
  const otherName = otherUser?.nombre || 'Contacto';
  // Cargar mensajes iniciales y marcar como leídos
  useEffect(() => {
    if (!chat) return;
    const activeId = chat.id;

    let isMounted = true;
    async function fetchMessages() {
      setIsLoading(true);
      try {
        const msgs = await supabaseService.getMessages(activeId);
        if (isMounted) setMessages(msgs);
        if (profile) {
          await supabaseService.markAsRead(activeId, profile.id);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    fetchMessages();

    // Suscripción en Tiempo Real con Supabase Realtime
    let channel: any = null;
    if (isSupabaseConfigured()) {
      channel = supabase
        .channel(`chat:${activeId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `chat_id=eq.${activeId}`,
          },
          (payload) => {
            const newMsg = payload.new as Message;
            setMessages((prev) => [...prev, newMsg]);
          }
        )
        .subscribe();
    }

    return () => {
      isMounted = false;
      if (channel) supabase.removeChannel(channel);
    };
  }, [chat?.id, profile?.id]);

  // Scroll automático hacia el final del chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !chat || !profile) return;

    const text = inputText.trim();
    setInputText('');

    try {
      const newMsg = await supabaseService.sendMessage(chat.id, profile.id, text);
      // Actualizar mensajes localmente de forma inmediata
      setMessages((prev) => [...prev, newMsg]);
      if (onMessageSent) onMessageSent();
    } catch (err) {
      console.error('Error enviando mensaje:', err);
    }
  };

  if (!chat) {
    return (
      <div className="flex-1 bg-[#F9FAFB] flex items-center justify-center p-8 text-slate-400 text-sm">
        Selecciona una conversación para comenzar a chatear
      </div>
    );
  }

  return (
    <div className="flex-1 min-w-0 bg-[#F9FAFB] flex flex-col h-full overflow-hidden">
      {/* 1. Header de la conversación activa */}
      <div className="bg-white border-b border-slate-200 px-3 md:px-6 py-3.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3.5 min-w-0">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="md:hidden p-2 -ml-1 hover:bg-slate-100 rounded-full text-slate-600"
              title="Volver"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <ProfileAvatar
            profile={otherUser}
            sizeClassName="w-10 h-10"
            textClassName="text-sm"
            statusClassName="w-2.5 h-2.5"
          />
          <div>
            <h3 className="font-bold text-slate-900 text-sm">{otherName}</h3>
            <span className="text-xs text-[#10B981] font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
              En línea
            </span>
          </div>
        </div>

        {/* Acciones del chat: Llamada, Videollamada, Opciones */}
        <div className="flex items-center gap-1 text-slate-500">
          <button
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
            title="Más opciones"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Área de Mensajes */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
        {isLoading && messages.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400">
            Cargando historial de mensajes...
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs">
            No hay mensajes en esta conversación. ¡Envía el primer mensaje!
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isSentByMe={msg.sender_id === profile?.id}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 3. Input inferior para escribir y enviar */}
      <div className="p-4 bg-white border-t border-slate-200">
        <form onSubmit={handleSend} className="flex items-center gap-3">
          <div className="flex-1 relative flex items-center">
            <input
              type="text"
              placeholder="Escribe un mensaje..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-base md:text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] focus:bg-white transition-all text-slate-900"
            />
          </div>

          {/* Botón enviar en verde esmeralda #10B981 */}
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="w-11 h-11 rounded-2xl bg-[#10B981] hover:bg-emerald-600 disabled:opacity-40 text-white flex items-center justify-center transition-all shadow-sm active:scale-95 flex-shrink-0"
            title="Enviar mensaje"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
