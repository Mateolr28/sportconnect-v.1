import { describe, expect, it } from 'vitest';
import { buildPath, parseRoute } from '../router';

describe('parseRoute', () => {
  it('trata la raíz como inicio', () => {
    expect(parseRoute('/')).toEqual({ tab: 'inicio', userId: null });
    expect(parseRoute('')).toEqual({ tab: 'inicio', userId: null });
  });

  it('reconoce cada sección por su ruta', () => {
    expect(parseRoute('/talentos').tab).toBe('talentos');
    expect(parseRoute('/descubrir').tab).toBe('descubrir');
    expect(parseRoute('/prospectos').tab).toBe('prospectos');
    expect(parseRoute('/publicar').tab).toBe('subir');
    expect(parseRoute('/mensajes/').tab).toBe('mensajes');
  });

  it('distingue el perfil propio del perfil de otro usuario', () => {
    expect(parseRoute('/perfil')).toEqual({ tab: 'perfil', userId: null });
    expect(parseRoute('/perfil/a1111111-1111-4111-a111-111111111111')).toEqual({
      tab: 'perfil',
      userId: 'a1111111-1111-4111-a111-111111111111',
    });
  });

  it('ignora el id en secciones que no lo usan', () => {
    expect(parseRoute('/talentos/abc')).toEqual({ tab: 'talentos', userId: null });
  });

  it('envía las rutas desconocidas a inicio', () => {
    expect(parseRoute('/no-existe/123')).toEqual({ tab: 'inicio', userId: null });
  });

  it('no falla con un id mal codificado', () => {
    expect(parseRoute('/perfil/%E0%A4%A')).toEqual({ tab: 'perfil', userId: '%E0%A4%A' });
  });
});

describe('buildPath', () => {
  it('genera rutas que parseRoute devuelve al mismo estado', () => {
    const routes = [
      { tab: 'inicio', userId: null },
      { tab: 'subir', userId: null },
      { tab: 'perfil', userId: null },
      { tab: 'perfil', userId: 'id con espacios/y barra' },
    ] as const;
    for (const route of routes) {
      expect(parseRoute(buildPath(route))).toEqual(route);
    }
  });

  it('no añade el id fuera del perfil', () => {
    expect(buildPath({ tab: 'mensajes', userId: 'abc' })).toBe('/mensajes');
  });
});
