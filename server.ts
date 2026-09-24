import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createApp } from './server/src/app';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = createApp();
  const PORT = process.env.PORT || 3000;
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    // Modo desarrollo: Montar Vite middlewares en Express
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: 'spa',
    });

    app.use(vite.middlewares);
  } else {
    // Modo producción: Servir archivos estáticos de dist
    const express = (await import('express')).default;
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));

    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`🚀 SportConnect servidor ejecutándose en http://localhost:${PORT}`);
    console.log(`📡 API lista en http://localhost:${PORT}/api/health`);
  });
}

startServer().catch((err) => {
  console.error('Error fatal al iniciar SportConnect:', err);
  process.exit(1);
});
