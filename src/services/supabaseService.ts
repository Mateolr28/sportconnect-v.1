import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Post, Comment, Chat, Message, Profile, AthleteProfile, RecruiterProfile, FeedFilters } from '../types';
import { INITIAL_POSTS, INITIAL_CHATS, INITIAL_MESSAGES, INITIAL_PROFILES, INITIAL_ATHLETE_PROFILES, INITIAL_RECRUITER_PROFILES } from '../lib/mockData';

// Estado local reactivo cuando opera en modo offline / pre-configuración
let localPosts: Post[] = [...INITIAL_POSTS];
let localChats: Chat[] = [...INITIAL_CHATS];
let localMessages: Record<string, Message[]> = { ...INITIAL_MESSAGES };

export const supabaseService = {
  // --------------------------------------------------------------------------
  // 1. PUBLICACIONES (POSTS)
  // --------------------------------------------------------------------------
  async getPosts(filters?: FeedFilters): Promise<Post[]> {
    if (isSupabaseConfigured()) {
      try {
        let query = supabase
          .from('posts')
          .select(`
            *,
            autor:profiles(*),
            comments(*, autor:profiles(nombre, avatar_url, rol))
          `)
          .order('created_at', { ascending: false });

        if (filters?.deporte && filters.deporte !== 'Todos') {
          query = query.eq('deporte', filters.deporte);
        }

        if (filters?.searchQuery) {
          query = query.ilike('descripcion', `%${filters.searchQuery}%`);
        }

        const { data, error } = await query;
        if (error) throw error;
        return (data as Post[]) || [];
      } catch (err) {
        console.warn('Fallback a datos locales para posts:', err);
      }
    }

    // Filtrado local
    let result = [...localPosts];
    if (filters?.deporte && filters.deporte !== 'Todos') {
      result = result.filter((p) => p.deporte.toLowerCase() === filters.deporte.toLowerCase());
    }
    if (filters?.searchQuery) {
      const q = filters.searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.descripcion.toLowerCase().includes(q) ||
          p.titulo?.toLowerCase().includes(q) ||
          p.autor?.nombre.toLowerCase().includes(q) ||
          p.deporte.toLowerCase().includes(q)
      );
    }
    return result;
  },

  async createPost({
    user_id,
    video_url,
    storage_path,
    titulo,
    descripcion,
    deporte,
    duracion = '0:45',
    thumbnail_url,
    autor,
    athlete_info,
  }: Partial<Post> & { user_id: string; video_url: string; descripcion: string; deporte: string }): Promise<Post> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('posts')
          .insert({
            user_id,
            video_url,
            storage_path,
            titulo: titulo || 'Nuevo video destacado',
            descripcion,
            deporte,
            duracion,
            thumbnail_url: thumbnail_url || 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=1000&auto=format&fit=crop&q=80',
          })
          .select('*, autor:profiles(*)')
          .single();

        if (error) throw error;
        return data as Post;
      } catch (err) {
        console.warn('Error creando post en Supabase, guardando local:', err);
      }
    }

    const newPost: Post = {
      id: 'post-' + Math.random().toString(36).substring(2, 9),
      user_id,
      video_url,
      storage_path,
      thumbnail_url: thumbnail_url || 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=1000&auto=format&fit=crop&q=80',
      titulo: titulo || 'Nuevo video destacado',
      descripcion,
      deporte,
      duracion,
      likes_count: 0,
      comments_count: 0,
      created_at: new Date().toISOString(),
      autor: autor || INITIAL_PROFILES[0],
      athlete_info: athlete_info || { posicion: 'Delantero', edad: 22 },
      is_liked_by_user: false,
      is_saved_by_user: false,
      comments: [],
    };

    localPosts = [newPost, ...localPosts];
    return newPost;
  },

  async toggleLike(postId: string, userId: string): Promise<{ liked: boolean; count: number }> {
    if (isSupabaseConfigured()) {
      try {
        // Verificar si ya existe el like
        const { data: existingLike } = await supabase
          .from('likes')
          .select('id')
          .eq('post_id', postId)
          .eq('user_id', userId)
          .maybeSingle();

        if (existingLike) {
          await supabase.from('likes').delete().eq('id', existingLike.id);
          const { data: post } = await supabase.from('posts').select('likes_count').eq('id', postId).single();
          return { liked: false, count: post?.likes_count ?? 0 };
        } else {
          await supabase.from('likes').insert({ post_id: postId, user_id: userId });
          const { data: post } = await supabase.from('posts').select('likes_count').eq('id', postId).single();
          return { liked: true, count: post?.likes_count ?? 1 };
        }
      } catch (err) {
        console.warn('Error gestionando like en Supabase, aplicando local:', err);
      }
    }

    // Toggle local
    const post = localPosts.find((p) => p.id === postId);
    if (!post) return { liked: false, count: 0 };

    const wasLiked = Boolean(post.is_liked_by_user);
    post.is_liked_by_user = !wasLiked;
    post.likes_count = wasLiked ? Math.max(0, post.likes_count - 1) : post.likes_count + 1;
    return { liked: post.is_liked_by_user, count: post.likes_count };
  },

  async addComment(postId: string, userId: string, contenido: string, currentUser?: Profile): Promise<Comment> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('comments')
          .insert({
            post_id: postId,
            user_id: userId,
            contenido,
          })
          .select('*, autor:profiles(*)')
          .single();

        if (error) throw error;
        return data as Comment;
      } catch (err) {
        console.warn('Error añadiendo comentario en Supabase, aplicando local:', err);
      }
    }

    const newComment: Comment = {
      id: 'comm-' + Math.random().toString(36).substring(2, 9),
      post_id: postId,
      user_id: userId,
      contenido,
      created_at: new Date().toISOString(),
      autor: {
        nombre: currentUser?.nombre || 'Usuario',
        avatar_url: currentUser?.avatar_url,
        rol: currentUser?.rol || 'deportista',
      },
    };

    const post = localPosts.find((p) => p.id === postId);
    if (post) {
      if (!post.comments) post.comments = [];
      post.comments.push(newComment);
      post.comments_count += 1;
    }

    return newComment;
  },

  async deleteComment(commentId: string, postId: string): Promise<void> {
    if (isSupabaseConfigured()) {
      await supabase.from('comments').delete().eq('id', commentId);
    }
    const post = localPosts.find((p) => p.id === postId);
    if (post && post.comments) {
      post.comments = post.comments.filter((c) => c.id !== commentId);
      post.comments_count = Math.max(0, post.comments_count - 1);
    }
  },

  // --------------------------------------------------------------------------
  // 2. CHATS Y MENSAJES (REALTIME)
  // --------------------------------------------------------------------------
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
        // Buscar chat existente compartido
        const { data: myChats } = await supabase
          .from('chat_participants')
          .select('chat_id')
          .eq('user_id', currentUserId);

        if (myChats && myChats.length > 0) {
          const chatIds = myChats.map((c) => c.chat_id);
          const { data: match } = await supabase
            .from('chat_participants')
            .select('chat_id')
            .in('chat_id', chatIds)
            .eq('user_id', targetUserId)
            .maybeSingle();

          if (match) {
            const { data: chatData } = await supabase.from('chats').select('*').eq('id', match.chat_id).single();
            return {
              id: match.chat_id,
              created_at: chatData.created_at,
              updated_at: chatData.updated_at,
              other_participant: targetProfile,
            };
          }
        }

        // Crear nuevo chat
        const { data: newChat, error: chatErr } = await supabase.from('chats').insert({}).select().single();
        if (chatErr) throw chatErr;

        // Añadir participantes
        await supabase.from('chat_participants').insert([
          { chat_id: newChat.id, user_id: currentUserId },
          { chat_id: newChat.id, user_id: targetUserId },
        ]);

        return {
          id: newChat.id,
          created_at: newChat.created_at,
          updated_at: newChat.updated_at,
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

  // --------------------------------------------------------------------------
  // 3. STORAGE DE SUPABASE (VIDEOS Y AVATARES)
  // --------------------------------------------------------------------------
  async uploadVideo(file: File, userId: string, onProgress?: (percent: number) => void): Promise<{ url: string; path: string }> {
    if (isSupabaseConfigured()) {
      try {
        const fileExt = file.name.split('.').pop() || 'mp4';
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
        const filePath = `${userId}/${fileName}`;

        if (onProgress) onProgress(30);

        const { error: uploadError } = await supabase.storage
          .from('sports-videos')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) throw uploadError;

        if (onProgress) onProgress(80);

        const { data: publicData } = supabase.storage
          .from('sports-videos')
          .getPublicUrl(filePath);

        if (onProgress) onProgress(100);

        return {
          url: publicData.publicUrl,
          path: filePath,
        };
      } catch (err) {
        console.warn('Error subiendo video a Supabase Storage, usando blob/simulación:', err);
      }
    }

    // Modo simulación local con barra de progreso
    for (let p = 10; p <= 100; p += 20) {
      if (onProgress) onProgress(p);
      await new Promise((r) => setTimeout(r, 120));
    }

    const localUrl = URL.createObjectURL(file);
    return {
      url: localUrl,
      path: `simulated/${userId}/${file.name}`,
    };
  },

  async uploadAvatar(file: File, userId: string): Promise<string> {
    if (isSupabaseConfigured()) {
      try {
        const fileExt = file.name.split('.').pop() || 'png';
        const filePath = `${userId}/avatar-${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, file, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: publicData } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);

        // Actualizar tabla profiles
        await supabase.from('profiles').update({ avatar_url: publicData.publicUrl }).eq('id', userId);

        return publicData.publicUrl;
      } catch (err) {
        console.warn('Error subiendo avatar a Supabase Storage:', err);
      }
    }

    return URL.createObjectURL(file);
  },

  // --------------------------------------------------------------------------
  // 4. PERFILES (PROFILES)
  // --------------------------------------------------------------------------
  async getProfile(userId: string): Promise<{ profile: Profile | null; athlete?: AthleteProfile | null; recruiter?: RecruiterProfile | null }> {
    if (isSupabaseConfigured()) {
      try {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).single();
        if (profile) {
          if (profile.rol === 'deportista') {
            const { data: athlete } = await supabase.from('athlete_profiles').select('*').eq('user_id', userId).maybeSingle();
            return { profile, athlete: athlete || null, recruiter: null };
          } else {
            const { data: recruiter } = await supabase.from('recruiter_profiles').select('*').eq('user_id', userId).maybeSingle();
            return { profile, athlete: null, recruiter: recruiter || null };
          }
        }
      } catch (err) {
        console.warn('Error obteniendo perfil de Supabase:', err);
      }
    }

    const profile = INITIAL_PROFILES.find((p) => p.id === userId) || null;
    const athlete = profile ? INITIAL_ATHLETE_PROFILES[profile.id] || null : null;
    const recruiter = profile ? INITIAL_RECRUITER_PROFILES[profile.id] || null : null;

    return { profile, athlete, recruiter };
  },
};
