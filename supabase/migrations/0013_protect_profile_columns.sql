-- Protege columnas sensibles de profiles y posts.
-- 1. Un usuario ya no puede cambiar su propio rol (ni id/fechas) con un UPDATE directo.
-- 2. Los contadores de likes y comentarios solo los mueven los triggers.
-- 3. El email deja de guardarse en profiles (lectura pública): vive solo en auth.users
--    y el propio usuario lo obtiene de su sesión.
--
-- Reversión del punto 3:
--   ALTER TABLE public.profiles ADD COLUMN email TEXT;
--   UPDATE public.profiles p SET email = u.email FROM auth.users u WHERE u.id = p.id;

-- ==============================================================================
-- 1. PROFILES: solo columnas editables
-- ==============================================================================
DROP POLICY IF EXISTS "Usuarios pueden actualizar su propio perfil" ON public.profiles;
CREATE POLICY "Usuarios pueden actualizar su propio perfil" ON public.profiles
    FOR UPDATE TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

REVOKE UPDATE ON public.profiles FROM anon, authenticated;
GRANT UPDATE (
    nombre, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido,
    pais_nacimiento, region_nacimiento, ciudad_nacimiento,
    ubicacion, avatar_url, bio, updated_at
) ON public.profiles TO authenticated;

-- ==============================================================================
-- 2. POSTS: los contadores no son editables por el autor
-- ==============================================================================
DROP POLICY IF EXISTS "Usuarios pueden actualizar sus publicaciones" ON public.posts;
CREATE POLICY "Usuarios pueden actualizar sus publicaciones" ON public.posts
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

REVOKE UPDATE ON public.posts FROM anon, authenticated;
GRANT UPDATE (titulo, descripcion, deporte, thumbnail_url, updated_at)
    ON public.posts TO authenticated;

-- ==============================================================================
-- 3. EMAIL fuera de profiles
-- El trigger crea el perfil completo (incluye los datos de registro personalizados),
-- por lo que el cliente ya no necesita hacer upsert tras el registro.
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_rol TEXT;
    v_nombre TEXT;
BEGIN
    v_rol := COALESCE(NEW.raw_user_meta_data->>'rol', 'deportista');
    v_nombre := COALESCE(
        NULLIF(NEW.raw_user_meta_data->>'nombre', ''),
        NULLIF(concat_ws(' ',
            NULLIF(NEW.raw_user_meta_data->>'primer_nombre', ''),
            NULLIF(NEW.raw_user_meta_data->>'segundo_nombre', ''),
            NULLIF(NEW.raw_user_meta_data->>'primer_apellido', ''),
            NULLIF(NEW.raw_user_meta_data->>'segundo_apellido', '')), ''),
        split_part(NEW.email, '@', 1)
    );

    INSERT INTO public.profiles (
        id, nombre, rol, avatar_url, ubicacion,
        primer_nombre, segundo_nombre, primer_apellido, segundo_apellido,
        pais_nacimiento, region_nacimiento, ciudad_nacimiento
    )
    VALUES (
        NEW.id, v_nombre, v_rol, NEW.raw_user_meta_data->>'avatar_url',
        COALESCE(NULLIF(NEW.raw_user_meta_data->>'ubicacion', ''), 'Madrid, España'),
        NULLIF(NEW.raw_user_meta_data->>'primer_nombre', ''),
        NULLIF(NEW.raw_user_meta_data->>'segundo_nombre', ''),
        NULLIF(NEW.raw_user_meta_data->>'primer_apellido', ''),
        NULLIF(NEW.raw_user_meta_data->>'segundo_apellido', ''),
        NULLIF(NEW.raw_user_meta_data->>'pais_nacimiento', ''),
        NULLIF(NEW.raw_user_meta_data->>'region_nacimiento', ''),
        NULLIF(NEW.raw_user_meta_data->>'ciudad_nacimiento', '')
    );

    IF v_rol = 'deportista' THEN
        INSERT INTO public.athlete_profiles (user_id, disciplina, posicion, especialidad, categoria, modalidad_competencia, edad, logros)
        VALUES (
            NEW.id,
            COALESCE(NULLIF(NEW.raw_user_meta_data->>'disciplina', ''), ''),
            COALESCE(NULLIF(NEW.raw_user_meta_data->>'posicion', ''), ''),
            NULLIF(NEW.raw_user_meta_data->>'especialidad', ''),
            NULLIF(NEW.raw_user_meta_data->>'categoria', ''),
            NULLIF(NEW.raw_user_meta_data->>'modalidad_competencia', ''),
            NULLIF(NEW.raw_user_meta_data->>'edad', '')::INTEGER,
            ARRAY[]::TEXT[]
        );
    ELSE
        INSERT INTO public.recruiter_profiles (user_id, nombre_club)
        VALUES (NEW.id, COALESCE(NULLIF(NEW.raw_user_meta_data->>'nombre_club', ''), v_nombre));
    END IF;

    RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

ALTER TABLE public.profiles DROP COLUMN IF EXISTS email;
