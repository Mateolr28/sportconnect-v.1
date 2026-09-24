import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { supabaseAdmin, isServerSupabaseConfigured } from '../lib/supabaseServer';

export const getPosts = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { deporte, search } = req.query;

    if (isServerSupabaseConfigured()) {
      let query = supabaseAdmin
        .from('posts')
        .select(`
          *,
          autor:profiles(*),
          comments(*, autor:profiles(nombre, avatar_url, rol))
        `)
        .order('created_at', { ascending: false });

      if (deporte && deporte !== 'Todos') {
        query = query.eq('deporte', String(deporte));
      }

      if (search) {
        query = query.ilike('descripcion', `%${String(search)}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return res.json({ success: true, data });
    }

    // Demo data response
    return res.json({
      success: true,
      message: 'Operando en modo de datos deportivos integrados',
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Error al obtener publicaciones' });
  }
};

export const createPost = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const { video_url, storage_path, titulo, descripcion, deporte, duracion, thumbnail_url } = req.body;

    if (!video_url || !descripcion || !deporte) {
      return res.status(400).json({ error: 'Campos requeridos: video_url, descripcion, deporte' });
    }

    if (isServerSupabaseConfigured()) {
      const { data, error } = await supabaseAdmin
        .from('posts')
        .insert({
          user_id: userId,
          video_url,
          storage_path,
          titulo,
          descripcion,
          deporte,
          duracion: duracion || '0:45',
          thumbnail_url,
        })
        .select('*, autor:profiles(*)')
        .single();

      if (error) throw error;
      return res.status(201).json({ success: true, data });
    }

    return res.status(201).json({
      success: true,
      data: {
        id: 'post-' + Date.now(),
        user_id: userId,
        video_url,
        storage_path,
        titulo,
        descripcion,
        deporte,
        duracion: duracion || '0:45',
        thumbnail_url,
        created_at: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Error al crear publicación' });
  }
};

export const deletePost = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (isServerSupabaseConfigured()) {
      const { error } = await supabaseAdmin
        .from('posts')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) throw error;
    }

    return res.json({ success: true, message: 'Publicación eliminada correctamente' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Error al eliminar publicación' });
  }
};
