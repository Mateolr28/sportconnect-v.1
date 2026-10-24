-- Asegura que cualquier usuario pueda consultar los comentarios de las publicaciones.
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Comentarios visibles para todos" ON public.comments;

CREATE POLICY "Comentarios visibles para todos"
ON public.comments
FOR SELECT
USING (true);
