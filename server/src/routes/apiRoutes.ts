import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware';
import { getPosts, createPost, deletePost } from '../controllers/postsController';
import { getChats, createChat, getMessages, sendMessage, markAsRead } from '../controllers/chatsController';
import { getProfile, updateProfile } from '../controllers/profilesController';
import { isServerSupabaseConfigured } from '../lib/supabaseServer';

const router = Router();

// Health Check
router.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    app: 'SportConnect API',
    supabaseConnected: isServerSupabaseConfigured(),
    timestamp: new Date().toISOString(),
  });
});

// Perfiles
router.get('/profiles/:id', getProfile);
router.put('/profiles/:id', requireAuth, updateProfile);

// Publicaciones
router.get('/posts', getPosts);
router.post('/posts', requireAuth, createPost);
router.delete('/posts/:id', requireAuth, deletePost);

// Conversaciones y Mensajes
router.get('/chats', requireAuth, getChats);
router.post('/chats', requireAuth, createChat);
router.get('/chats/:id/messages', requireAuth, getMessages);
router.post('/chats/:id/messages', requireAuth, sendMessage);
router.patch('/chats/:id/read', requireAuth, markAsRead);

export default router;
