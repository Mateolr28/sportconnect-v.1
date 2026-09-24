import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import apiRoutes from './routes/apiRoutes';

export const createApp = (): Application => {
  const app = express();

  // Middleware
  app.use(cors({
    origin: '*',
    credentials: true,
  }));
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Rutas de API
  app.use('/api', apiRoutes);

  // Manejador de errores global
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Error no controlado en SportConnect API:', err);
    res.status(err.status || 500).json({
      error: err.message || 'Error interno del servidor',
    });
  });

  return app;
};
