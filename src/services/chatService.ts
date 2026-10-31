import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Chat, Message, Profile } from '../types';

// Estado local reactivo cuando opera en modo offline / pre-configuración
let localChats: Chat[] = [];
let localMessages: Record<string, Message[]> = {};

export const chatService = {
  async getChats(userId: string): Promise<Chat[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data: participations, error } = await supabase
          .from('chat_participants')
          .select(`
            chat_id,
            chat:chats(
              id,
              created_at,
              updated_at,
              participants:chat_participants(user:profiles(*)),
              messages(id, contenido, leido, created_at, sender_id)
            )
          `)
          .eq('user_id', userId);

        if (error) throw error;
        
        // Formatear chats
        if (participations) {
          return participations.map((p: any) => {
            const chat = p.chat;
            const otherUser = chat.participants?.find((part: any) => part.user?.id !== userId)?.user;
            const msgs = (chat.messages || []).sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            return {
              id: chat.id,
              created_at: chat.created_at,
              updated_at: chat.updated_at,
              other_participant: otherUser,
              last_message: msgs[0],
              unread_count: msgs.filter((m: any) => !m.leido && m.sender_id !== userId).length,
            };
          });
        }
      } catch (err) {
        console.warn('Error cargando chats de Supabase, usando locales:', err);
      }
    }

    return [...localChats];
  },

  async getMessages(chatId: string): Promise<Message[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('messages')
          .select('*, sender:profiles(*)')
          .eq('chat_id', chatId)
          .order('created_at', { ascending: true });

        if (error) throw error;
        return (data as Message[]) || [];
      } catch (err) {
        console.warn('Error cargando mensajes de Supabase, usando locales:', err);
      }
    }

    return localMessages[chatId] || [];
  },

  async sendMessage(chatId: string, senderId: string, contenido: string): Promise<Message> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('messages')
          .insert({
            chat_id: chatId,
            sender_id: senderId,
            contenido,
            leido: false,
          })
          .select('*, sender:profiles(*)')
          .single();

        if (error) throw error;
        return data as Message;
      } catch (err) {
        console.warn('Error enviando mensaje a Supabase:', err);
      }
    }

    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newMsg: Message = {
      id: 'm-' + Date.now(),
      chat_id: chatId,
      sender_id: senderId,
      contenido,
      leido: false,
      created_at: nowStr,
    };

    if (!localMessages[chatId]) {
      localMessages[chatId] = [];
    }
    localMessages[chatId].push(newMsg);

    // Actualizar el chat
    const chat = localChats.find((c) => c.id === chatId);
    if (chat) {
      chat.last_message = newMsg;
      chat.updated_at = new Date().toISOString();
    }

    return newMsg;
  },

  async markAsRead(chatId: string, currentUserId: string): Promise<void> {
    if (isSupabaseConfigured()) {
      try {
        await supabase
          .from('messages')
          .update({ leido: true })
          .eq('chat_id', chatId)
          .neq('sender_id', currentUserId);
      } catch (err) {
        console.warn('Error marcando leídos en Supabase:', err);
      }
    }

    const msgs = localMessages[chatId];
    if (msgs) {
      msgs.forEach((m) => {
        if (m.sender_id !== currentUserId) {
          m.leido = true;
        }
      });
    }

    const chat = localChats.find((c) => c.id === chatId);
    if (chat) {
      chat.unread_count = 0;
    }
  },

  async getOrCreateChat(currentUserId: string, targetUserId: string, targetProfile?: Profile): Promise<Chat> {
    if (isSupabaseConfigured()) {
      try {
        // Buscar o crear el chat en el servidor (RLS no permite insertar participantes directamente)
        const { data: chatId, error: rpcErr } = await supabase.rpc('get_or_create_chat', {
          p_target_user_id: targetUserId,
        });
        if (rpcErr) throw rpcErr;

        const { data: chatData, error: chatErr } = await supabase
          .from('chats')
          .select('*')
          .eq('id', chatId)
          .single();
        if (chatErr) throw chatErr;

        return {
          id: chatData.id,
          created_at: chatData.created_at,
          updated_at: chatData.updated_at,
          other_participant: targetProfile,
        };
      } catch (err) {
        console.warn('Error creando chat en Supabase, creando local:', err);
      }
    }

    // Comprobar si ya existe localmente
    const existing = localChats.find(
      (c) => c.other_participant?.id === targetUserId
    );
    if (existing) return existing;

    const newChatId = 'chat-' + Math.random().toString(36).substring(2, 9);
    const newChat: Chat = {
      id: newChatId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      other_participant: targetProfile || {
        id: targetUserId,
        nombre: 'Deportista Contactado',
        email: 'contacto@sportconnect.dev',
        rol: 'deportista',
        ubicacion: 'Madrid, España',
      },
      unread_count: 0,
    };

    localChats = [newChat, ...localChats];
    localMessages[newChatId] = [];
    return newChat;
  },
};
