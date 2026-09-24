import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { supabaseAdmin, isServerSupabaseConfigured } from '../lib/supabaseServer';

export const getProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (isServerSupabaseConfigured()) {
      const { data: profile, error } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      if (profile.rol === 'deportista') {
        const { data: athlete } = await supabaseAdmin
          .from('athlete_profiles')
          .select('*')
          .eq('user_id', id)
          .maybeSingle();
        return res.json({ success: true, profile, athlete });
      } else {
        const { data: recruiter } = await supabaseAdmin
          .from('recruiter_profiles')
          .select('*')
          .eq('user_id', id)
          .maybeSingle();
        return res.json({ success: true, profile, recruiter });
      }
    }

    return res.json({
      success: true,
      profile: {
        id,
        nombre: 'Carlos Martínez',
        email: 'carlos.martinez@sportconnect.dev',
        rol: 'deportista',
        ubicacion: 'Madrid, España',
      },
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Error al obtener perfil' });
  }
};

export const updateProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user?.id;

    if (currentUserId !== id) {
      return res.status(403).json({ error: 'No autorizado para modificar este perfil' });
    }

    const { nombre, bio, ubicacion, avatar_url, athlete_data, recruiter_data } = req.body;

    if (isServerSupabaseConfigured()) {
      await supabaseAdmin
        .from('profiles')
        .update({ nombre, bio, ubicacion, avatar_url, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (athlete_data) {
        await supabaseAdmin
          .from('athlete_profiles')
          .update({ ...athlete_data, updated_at: new Date().toISOString() })
          .eq('user_id', id);
      }

      if (recruiter_data) {
        await supabaseAdmin
          .from('recruiter_profiles')
          .update({ ...recruiter_data, updated_at: new Date().toISOString() })
          .eq('user_id', id);
      }
    }

    return res.json({ success: true, message: 'Perfil actualizado con éxito' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Error al actualizar perfil' });
  }
};
