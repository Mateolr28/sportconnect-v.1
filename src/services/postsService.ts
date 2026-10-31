import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Post, Comment, Profile, FeedFilters } from '../types';
import { postMatchesFilters } from '../lib/postFilters';

// Estado local reactivo cuando opera en modo offline / pre-configuración
let localPosts: Post[] = [];

export const postsService = {
  async getPosts(filters?: FeedFilters): Promise<Post[]> {
    if (isSupabaseConfigured()) {
      try {
        let query = supabase
          .from('posts')
          .select(`
            *,
            autor:profiles(*, athlete_profile:athlete_profiles(*)),
            comments(*, autor:profiles(nombre, avatar_url, rol))
          `)
          .order('created_at', { ascending: false });

        const { data, error } = await query;
        if (error) throw error;
        const posts = ((data as any[]) || []).map((post) => {
          const athleteProfile = Array.isArray(post.autor?.athlete_profile)
            ? post.autor.athlete_profile[0]
            : post.autor?.athlete_profile;

          return {
            ...post,
            athlete_info: post.athlete_info || athleteProfile || undefined,
          };
        }) as Post[];

        return posts.filter((post) => postMatchesFilters(post, filters));
      } catch (err) {
        console.warn('Fallback a datos locales para posts:', err);
      }
    }

    // Filtrado local
    return localPosts.filter((post) => postMatchesFilters(post, filters));
  },

  async createPost({
    user_id,
    video_url,
    media_type = 'video',
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
            media_type,
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
      media_type,
      storage_path,
      thumbnail_url: thumbnail_url || 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=1000&auto=format&fit=crop&q=80',
      titulo: titulo || 'Nuevo video destacado',
      descripcion,
      deporte,
      duracion,
      likes_count: 0,
      comments_count: 0,
      created_at: new Date().toISOString(),
      autor,
      athlete_info: athlete_info || { posicion: 'Delantero', edad: 22 },
      is_liked_by_user: false,
      is_saved_by_user: false,
      comments: [],
    };

    localPosts = [newPost, ...localPosts];
    return newPost;
  },

  async deletePost(postId: string, userId: string, storagePath?: string): Promise<void> {
    if (isSupabaseConfigured()) {
      const { data: post, error: postError } = await supabase
        .from('posts')
        .select('user_id, storage_path')
        .eq('id', postId)
        .single();

      if (postError) throw postError;
      if (post.user_id !== userId) throw new Error('No puedes eliminar un video que no es tuyo.');

      const videoPath = storagePath || post.storage_path;
      if (videoPath) {
        const thumbnailPath = `${videoPath.replace(/\.[^/.]+$/, '')}-thumbnail.jpg`;
        const { error: storageError } = await supabase.storage
          .from('sports-videos')
          .remove([videoPath, thumbnailPath]);

        if (storageError) throw storageError;
      }

      const { error: deleteError } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId)
        .eq('user_id', userId);

      if (deleteError) throw deleteError;
      return;
    }

    const post = localPosts.find((item) => item.id === postId);
    if (!post) return;
    if (post.user_id !== userId) throw new Error('No puedes eliminar un video que no es tuyo.');
    localPosts = localPosts.filter((item) => item.id !== postId);
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
        console.error('Error gestionando like en Supabase:', err);
        throw err;
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
        // Con Supabase configurado no se simula el comentario: se informaría un guardado que no ocurrió.
        console.error('Error añadiendo comentario en Supabase:', err);
        throw err;
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

  async getComments(postId: string): Promise<Comment[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('comments')
          .select('*, autor:profiles(nombre, avatar_url, rol)')
          .eq('post_id', postId)
          .order('created_at', { ascending: true });

        if (error) throw error;
        return (data as Comment[]) || [];
      } catch (err) {
        console.warn('Error cargando comentarios de Supabase, usando los del post:', err);
      }
    }

    return localPosts.find((item) => item.id === postId)?.comments || [];
  },

  async deleteComment(commentId: string, postId: string): Promise<void> {
    if (isSupabaseConfigured()) {
      const { error } = await supabase.from('comments').delete().eq('id', commentId);
      if (error) throw error;
    }
    const post = localPosts.find((p) => p.id === postId);
    if (post && post.comments) {
      post.comments = post.comments.filter((c) => c.id !== commentId);
      post.comments_count = Math.max(0, post.comments_count - 1);
    }
  },
};
