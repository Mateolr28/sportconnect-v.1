import { beforeEach, describe, expect, it, vi } from 'vitest';

// Cliente de Supabase simulado: cada llamada encadenada se registra y la consulta
// se resuelve con el resultado configurado para esa tabla.
const state = vi.hoisted(() => ({
  configured: true,
  results: {} as Record<string, { data: unknown; error: unknown }>,
  calls: [] as Array<{ table: string; method: string; args: unknown[] }>,
}));

vi.mock('../../lib/supabase', () => {
  const chain = (table: string) => {
    const builder: Record<string, unknown> = {};
    const proxy: unknown = new Proxy(builder, {
      get(_target, method: string) {
        if (method === 'then') {
          const result = state.results[table] ?? { data: null, error: null };
          return (resolve: (value: unknown) => unknown) => Promise.resolve(result).then(resolve);
        }
        return (...args: unknown[]) => {
          state.calls.push({ table, method, args });
          return proxy;
        };
      },
    });
    return proxy;
  };

  return {
    isSupabaseConfigured: () => state.configured,
    supabase: {
      from: (table: string) => chain(table),
      rpc: (name: string) => chain(`rpc:${name}`),
    },
  };
});

import { chatService } from '../chatService';
import { postsService, POSTS_PAGE_SIZE } from '../postsService';

const makePosts = (count: number, deporte = 'Fútbol') =>
  Array.from({ length: count }, (_, index) => ({
    id: `post-${index}`,
    user_id: 'u1',
    video_url: 'https://example.com/v.mp4',
    descripcion: `Publicación ${index}`,
    deporte,
    likes_count: 0,
    comments_count: 0,
    created_at: new Date(2026, 0, index + 1).toISOString(),
  }));

beforeEach(() => {
  state.configured = true;
  state.results = {};
  state.calls = [];
});

describe('chatService con Supabase configurado', () => {
  it('propaga el error al enviar un mensaje en vez de simular el envío', async () => {
    state.results.messages = { data: null, error: new Error('fallo de red') };
    await expect(chatService.sendMessage('chat-1', 'u1', 'hola')).rejects.toThrow('fallo de red');
  });

  it('devuelve el mensaje guardado cuando el envío funciona', async () => {
    const saved = { id: 'm1', chat_id: 'chat-1', sender_id: 'u1', contenido: 'hola', leido: false, created_at: 'x' };
    state.results.messages = { data: saved, error: null };
    await expect(chatService.sendMessage('chat-1', 'u1', 'hola')).resolves.toEqual(saved);
  });

  it('propaga el error al crear un chat en vez de crear uno local', async () => {
    state.results['rpc:get_or_create_chat'] = { data: null, error: new Error('sin permiso') };
    await expect(chatService.getOrCreateChat('u1', 'u2')).rejects.toThrow('sin permiso');
  });
});

describe('postsService.createPost con Supabase configurado', () => {
  it('propaga el error en vez de guardar una copia local', async () => {
    state.results.posts = { data: null, error: new Error('rechazado') };
    await expect(
      postsService.createPost({ user_id: 'u1', video_url: 'https://example.com/v.mp4', descripcion: 'x', deporte: 'Fútbol' })
    ).rejects.toThrow('rechazado');
  });
});

describe('postsService.getPostsPage', () => {
  it('pide el rango de la página y avisa de que hay más cuando la página viene llena', async () => {
    state.results.posts = { data: makePosts(POSTS_PAGE_SIZE), error: null };
    const page = await postsService.getPostsPage(undefined, { offset: 20 });

    const range = state.calls.find((call) => call.method === 'range');
    expect(range?.args).toEqual([20, 20 + POSTS_PAGE_SIZE - 1]);
    expect(page.posts).toHaveLength(POSTS_PAGE_SIZE);
    expect(page.nextOffset).toBe(20 + POSTS_PAGE_SIZE);
    expect(page.hasMore).toBe(true);
  });

  it('marca el final cuando la página viene incompleta', async () => {
    state.results.posts = { data: makePosts(3), error: null };
    const page = await postsService.getPostsPage();
    expect(page.hasMore).toBe(false);
    expect(page.nextOffset).toBe(3);
  });

  it('avanza por las filas leídas aunque los filtros descarten algunas', async () => {
    state.results.posts = { data: makePosts(POSTS_PAGE_SIZE, 'Tenis'), error: null };
    const page = await postsService.getPostsPage({ searchQuery: '', deporte: 'Fútbol' });
    expect(page.posts).toHaveLength(0);
    expect(page.nextOffset).toBe(POSTS_PAGE_SIZE);
    expect(page.hasMore).toBe(true);
  });

  it('filtra por autores en la consulta', async () => {
    state.results.posts = { data: [], error: null };
    await postsService.getPostsPage(undefined, { userIds: ['u1', 'u2'] });
    expect(state.calls.find((call) => call.method === 'in')?.args).toEqual(['user_id', ['u1', 'u2']]);
  });

  it('no consulta nada si la lista de autores está vacía', async () => {
    const page = await postsService.getPostsPage(undefined, { userIds: [] });
    expect(page).toEqual({ posts: [], nextOffset: 0, hasMore: false });
    expect(state.calls).toHaveLength(0);
  });

  it('propaga el error de la consulta', async () => {
    state.results.posts = { data: null, error: new Error('timeout') };
    await expect(postsService.getPostsPage()).rejects.toThrow('timeout');
  });
});
