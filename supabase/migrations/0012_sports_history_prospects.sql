-- HU-10 Historial deportivo y flujo de reclutamiento (prospectos).
--
-- sports_history: línea de tiempo de equipos y torneos de un deportista (lectura pública).
-- prospects: perfiles de deportistas que un reclutador marca como de interés (privado del reclutador).
--
-- Reversión: DROP TABLE public.prospects; DROP TABLE public.sports_history;

CREATE TABLE IF NOT EXISTS public.sports_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    tipo TEXT NOT NULL CHECK (tipo IN ('equipo', 'torneo')),
    titulo TEXT NOT NULL CHECK (char_length(titulo) BETWEEN 1 AND 120),
    detalle TEXT CHECK (detalle IS NULL OR char_length(detalle) <= 300),
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT sports_history_dates CHECK (fecha_fin IS NULL OR fecha_fin >= fecha_inicio)
);

CREATE INDEX IF NOT EXISTS idx_sports_history_user ON public.sports_history(user_id, fecha_inicio DESC);

ALTER TABLE public.sports_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Historial deportivo visible" ON public.sports_history;
DROP POLICY IF EXISTS "Deportistas agregan su historial" ON public.sports_history;
DROP POLICY IF EXISTS "Deportistas editan su historial" ON public.sports_history;
DROP POLICY IF EXISTS "Deportistas eliminan su historial" ON public.sports_history;

CREATE POLICY "Historial deportivo visible" ON public.sports_history
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Deportistas agregan su historial" ON public.sports_history
    FOR INSERT TO authenticated
    WITH CHECK (
        auth.uid() = user_id
        AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.rol = 'deportista')
    );

CREATE POLICY "Deportistas editan su historial" ON public.sports_history
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Deportistas eliminan su historial" ON public.sports_history
    FOR DELETE TO authenticated USING (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.sports_history TO authenticated;

CREATE TABLE IF NOT EXISTS public.prospects (
    recruiter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    athlete_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    estado TEXT NOT NULL DEFAULT 'interesado'
        CHECK (estado IN ('interesado', 'contactado', 'en_pruebas', 'fichado', 'descartado')),
    notas TEXT CHECK (notas IS NULL OR char_length(notas) <= 500),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (recruiter_id, athlete_id),
    CONSTRAINT prospects_no_self CHECK (recruiter_id <> athlete_id)
);

CREATE INDEX IF NOT EXISTS idx_prospects_recruiter ON public.prospects(recruiter_id, updated_at DESC);

ALTER TABLE public.prospects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Reclutadores ven sus prospectos" ON public.prospects;
DROP POLICY IF EXISTS "Reclutadores agregan prospectos" ON public.prospects;
DROP POLICY IF EXISTS "Reclutadores actualizan sus prospectos" ON public.prospects;
DROP POLICY IF EXISTS "Reclutadores eliminan sus prospectos" ON public.prospects;

CREATE POLICY "Reclutadores ven sus prospectos" ON public.prospects
    FOR SELECT TO authenticated USING (auth.uid() = recruiter_id);

CREATE POLICY "Reclutadores agregan prospectos" ON public.prospects
    FOR INSERT TO authenticated
    WITH CHECK (
        auth.uid() = recruiter_id
        AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.rol = 'reclutador')
        AND EXISTS (SELECT 1 FROM public.profiles a WHERE a.id = athlete_id AND a.rol = 'deportista')
    );

CREATE POLICY "Reclutadores actualizan sus prospectos" ON public.prospects
    FOR UPDATE TO authenticated
    USING (auth.uid() = recruiter_id) WITH CHECK (auth.uid() = recruiter_id);

CREATE POLICY "Reclutadores eliminan sus prospectos" ON public.prospects
    FOR DELETE TO authenticated USING (auth.uid() = recruiter_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.prospects TO authenticated;
