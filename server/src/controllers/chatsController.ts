import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { supabaseAdmin, isServerSupabaseConfigured } from '../lib/supabaseServer';

export const getChats = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'No autenticado' });

    if (isServerSupabaseConfigured()) {
      const { data, error } = await supabaseAdmin
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
      return res.json({ success: true, data });
    }

    return res.json({ success: true, data: [] });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Error al obtener chats' });
  }
};

export const createChat = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const currentUserId = req.user?.id;
    const { target_user_id } = req.body;

    if (!currentUserId || !target_user_id) {
      return res.status(400).json({ error: 'Falta target_user_id' });
    }

    if (currentUserId === target_user_id) {
      return res.status(400).json({ error: 'No puedes iniciar una conversación contigo mismo' });
    }

    if (isServerSupabaseConfigured()) {
      // Comprobar chat existente
      const { data: myChats } = await supabaseAdmin
        .from('chat_participants')
        .select('chat_id')
        .eq('user_id', currentUserId);

      if (myChats && myChats.length > 0) {
        const chatIds = myChats.map((c) => c.chat_id);
        const { data: match } = await supabaseAdmin
          .from('chat_participants')
          .select('chat_id')
          .in('chat_id', chatIds)
          .eq('user_id', target_user_id)
          .maybeSingle();

        if (match) {
          return res.json({ success: true, chatId: match.chat_id, existing: true });
        }
      }

      // Crear nuevo chat
      const { data: chat, error: chatErr } = await supabaseAdmin.from('chats').insert({}).select().single();
      if (chatErr) throw chatErr;

      await supabaseAdmin.from('chat_participants').insert([
        { chat_id: chat.id, user_id: currentUserId },
        { chat_id: chat.id, user_id: target_user_id },
      ]);

      return res.status(201).json({ success: true, chatId: chat.id, existing: false });
    }

    return res.json({ success: true, chatId: 'chat-demo-' + target_user_id });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Error al crear conversación' });
  }
};

export const getMessages = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id: chatId } = req.params;

    if (isServerSupabaseConfigured()) {
      const { data, error } = await supabaseAdmin
        .from('messages')
        .select('*, sender:profiles(*)')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return res.json({ success: true, data });
    }

    return res.json({ success: true, data: [] });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Error al obtener mensajes' });
  }
};

export const sendMessage = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id: chatId } = req.params;
    const senderId = req.user?.id;
    const { contenido } = req.body;

    if (!senderId || !contenido) {
      return res.status(400).json({ error: 'Contenido del mensaje requerido' });
    }

    if (isServerSupabaseConfigured()) {
      const { data, error } = await supabaseAdmin
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
      return res.status(201).json({ success: true, data });
    }

    return res.status(201).json({
      success: true,
      data: {
        id: 'msg-' + Date.now(),
        chat_id: chatId,
        sender_id: senderId,
        contenido,
        leido: false,
        created_at: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Error al enviar mensaje' });
  }
};

export const markAsRead = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id: chatId } = req.params;
    const userId = req.user?.id;

    if (isServerSupabaseConfigured()) {
      await supabaseAdmin
        .from('messages')
        .update({ leido: true })
        .eq('chat_id', chatId)
        .neq('sender_id', userId);
    }

    return res.json({ success: true, message: 'Mensajes marcados como leídos' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Error marcando mensajes leídos' });
  }
};
