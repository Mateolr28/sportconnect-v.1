import { useCallback, useEffect, useState } from 'react';

// Enrutador mínimo sobre la History API: cada sección tiene su URL,
// los perfiles se pueden compartir (/perfil/:id) y el botón atrás funciona.

export type AppTab = 'inicio' | 'talentos' | 'descubrir' | 'prospectos' | 'perfil' | 'subir' | 'mensajes';

export interface AppRoute {
  tab: AppTab;
  /** Solo para 'perfil': id del perfil que se está viendo; null es el perfil propio. */
  userId: string | null;
}

const TAB_PATHS: Record<AppTab, string> = {
  inicio: '/',
  talentos: '/talentos',
  descubrir: '/descubrir',
  prospectos: '/prospectos',
  perfil: '/perfil',
  subir: '/publicar',
  mensajes: '/mensajes',
};

const PATH_TABS = new Map<string, AppTab>(
  (Object.entries(TAB_PATHS) as Array<[AppTab, string]>).map(([tab, path]) => [path, tab])
);

export const isAppTab = (value: string): value is AppTab => value in TAB_PATHS;

export const parseRoute = (pathname: string): AppRoute => {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length === 0) return { tab: 'inicio', userId: null };

  const tab = PATH_TABS.get(`/${segments[0]}`);
  if (!tab) return { tab: 'inicio', userId: null };

  if (tab === 'perfil' && segments[1]) {
    let userId = segments[1];
    try {
      userId = decodeURIComponent(segments[1]);
    } catch {
      // Se conserva el segmento tal cual si no es una secuencia válida
    }
    return { tab, userId };
  }
  return { tab, userId: null };
};

export const buildPath = ({ tab, userId }: AppRoute): string =>
  tab === 'perfil' && userId ? `${TAB_PATHS.perfil}/${encodeURIComponent(userId)}` : TAB_PATHS[tab];

export const useRoute = (): [AppRoute, (tab: AppTab, userId?: string | null) => void] => {
  const [route, setRoute] = useState<AppRoute>(() => parseRoute(window.location.pathname));

  useEffect(() => {
    const onPopState = () => setRoute(parseRoute(window.location.pathname));
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const navigate = useCallback((tab: AppTab, userId: string | null = null) => {
    const next: AppRoute = { tab, userId: tab === 'perfil' ? userId : null };
    const path = buildPath(next);
    if (path !== window.location.pathname) {
      // Se conservan query y hash solo en la carga inicial; al navegar se limpia la URL
      window.history.pushState(null, '', path);
    }
    setRoute(next);
  }, []);

  return [route, navigate];
};
