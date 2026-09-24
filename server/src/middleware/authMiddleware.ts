import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin, isServerSupabaseConfigured } from '../lib/supabaseServer';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email?: string;
    role?: string;
  };
}

export const requireAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // Si estamos en desarrollo sin configurar, permitimos modo demo
    if (!isServerSupabaseConfigured()) {
      req.user = {
        id: (req.headers['x-user-id'] as string) || 'a1111111-1111-4111-a111-111111111111',
        email: 'carlos.martinez@sportconnect.dev',
        role: 'authenticated',
      };
      return next();
    }

    res.status(401).json({ error: 'Encabezado de autorización ausente o inválido' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    if (isServerSupabaseConfigured()) {
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

      if (error || !user) {
        res.status(401).json({ error: 'Token de sesión expirado o inválido' });
        return;
      }

      req.user = {
        id: user.id,
        email: user.email,
        role: user.role,
      };
      next();
    } else {
      req.user = {
        id: (req.headers['x-user-id'] as string) || 'a1111111-1111-4111-a111-111111111111',
        email: 'carlos.martinez@sportconnect.dev',
        role: 'authenticated',
      };
      next();
    }
  } catch (err) {
    res.status(500).json({ error: 'Fallo al autenticar la petición' });
  }
};
