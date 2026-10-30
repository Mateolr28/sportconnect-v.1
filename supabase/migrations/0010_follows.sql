-- Sistema de seguidores: un usuario puede seguir a deportistas y reclutadores.
-- El feed de inicio muestra solo publicaciones de las personas seguidas.

CREATE TABLE IF NOT EXISTS public.follows (
    follower_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (follower_id, following_id),
    CONSTRAINT follows_no_self_follow CHECK (follower_id <> following_id)
);

CREATE INDEX IF NOT EXISTS idx_follows_following_id ON public.follows(following_id);

ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Seguidores visibles para usuarios autenticados" ON public.follows;
DROP POLICY IF EXISTS "Usuarios pueden seguir" ON public.follows;
DROP POLICY IF EXISTS "Usuarios pueden dejar de seguir" ON public.follows;

CREATE POLICY "Seguidores visibles para usuarios autenticados" ON public.follows
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Usuarios pueden seguir" ON public.follows
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Usuarios pueden dejar de seguir" ON public.follows
    FOR DELETE TO authenticated
    USING (auth.uid() = follower_id);

-- Permisos explícitos: sin ellos PostgREST responde 403 aunque las políticas RLS existan.
GRANT SELECT, INSERT, DELETE ON public.follows TO authenticated;
