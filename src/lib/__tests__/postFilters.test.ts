import { describe, expect, it } from 'vitest';
import { normalizeSearchValue, postMatchesFilters } from '../postFilters';
import { FeedFilters, Post } from '../../types';

const post = {
  id: '1',
  user_id: 'u1',
  video_url: '',
  descripcion: 'Gol de tiro libre',
  deporte: 'Fútbol',
  likes_count: 0,
  comments_count: 0,
  created_at: '',
  autor: { id: 'u1', nombre: 'Andrés Gómez', email: '', rol: 'deportista', ubicacion: 'Medellín, Antioquia, Colombia' },
  athlete_info: { disciplina: 'Fútbol', posicion: 'Delantero', edad: 19 },
} as Post;

const filters = (extra: Partial<FeedFilters> = {}): FeedFilters => ({ searchQuery: '', deporte: 'Todos', ...extra });

describe('normalizeSearchValue', () => {
  it('ignora mayúsculas y tildes', () => {
    expect(normalizeSearchValue('Medellín')).toBe('medellin');
  });
});

describe('postMatchesFilters', () => {
  it('sin filtros devuelve todo', () => {
    expect(postMatchesFilters(post)).toBe(true);
    expect(postMatchesFilters(post, filters())).toBe(true);
  });

  it('busca por texto sin importar tildes', () => {
    expect(postMatchesFilters(post, filters({ searchQuery: 'andres gomez' }))).toBe(true);
    expect(postMatchesFilters(post, filters({ searchQuery: 'portero' }))).toBe(false);
  });

  it('filtra por deporte, posición y ubicación', () => {
    expect(postMatchesFilters(post, filters({ deporte: 'futbol' }))).toBe(true);
    expect(postMatchesFilters(post, filters({ deporte: 'Tenis' }))).toBe(false);
    expect(postMatchesFilters(post, filters({ posicion: 'delantero' }))).toBe(true);
    expect(postMatchesFilters(post, filters({ ubicacion: 'medellin' }))).toBe(true);
    expect(postMatchesFilters(post, filters({ ubicacion: 'Bogotá' }))).toBe(false);
  });

  it('filtra por rango de edad', () => {
    expect(postMatchesFilters(post, filters({ minEdad: 18, maxEdad: 20 }))).toBe(true);
    expect(postMatchesFilters(post, filters({ minEdad: 21 }))).toBe(false);
    expect(postMatchesFilters(post, filters({ maxEdad: 18 }))).toBe(false);
  });
});
