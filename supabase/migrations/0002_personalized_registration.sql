-- Datos estructurados del registro personalizado.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS primer_nombre TEXT,
  ADD COLUMN IF NOT EXISTS segundo_nombre TEXT,
  ADD COLUMN IF NOT EXISTS primer_apellido TEXT,
  ADD COLUMN IF NOT EXISTS segundo_apellido TEXT,
  ADD COLUMN IF NOT EXISTS pais_nacimiento TEXT,
  ADD COLUMN IF NOT EXISTS region_nacimiento TEXT,
  ADD COLUMN IF NOT EXISTS ciudad_nacimiento TEXT;

UPDATE public.profiles
SET primer_nombre = COALESCE(primer_nombre, split_part(nombre, ' ', 1)),
    primer_apellido = COALESCE(primer_apellido, NULLIF(trim(regexp_replace(nombre, '^\\S+\\s*', '')), ''))
WHERE primer_nombre IS NULL OR primer_apellido IS NULL;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_rol TEXT;
    v_nombre TEXT;
BEGIN
    v_rol := COALESCE(NEW.raw_user_meta_data->>'rol', 'deportista');
    v_nombre := COALESCE(
      NEW.raw_user_meta_data->>'nombre',
      concat_ws(' ', NEW.raw_user_meta_data->>'primer_nombre', NEW.raw_user_meta_data->>'segundo_nombre', NEW.raw_user_meta_data->>'primer_apellido', NEW.raw_user_meta_data->>'segundo_apellido'),
      split_part(NEW.email, '@', 1)
    );

    INSERT INTO public.profiles (
      id, nombre, email, rol, ubicacion, primer_nombre, segundo_nombre,
      primer_apellido, segundo_apellido, pais_nacimiento, region_nacimiento,
      ciudad_nacimiento, avatar_url
    )
    VALUES (
      NEW.id, v_nombre, NEW.email, v_rol,
      COALESCE(NEW.raw_user_meta_data->>'ubicacion', 'Madrid, España'),
      NEW.raw_user_meta_data->>'primer_nombre', NEW.raw_user_meta_data->>'segundo_nombre',
      NEW.raw_user_meta_data->>'primer_apellido', NEW.raw_user_meta_data->>'segundo_apellido',
      NEW.raw_user_meta_data->>'pais_nacimiento', NEW.raw_user_meta_data->>'region_nacimiento',
      NEW.raw_user_meta_data->>'ciudad_nacimiento', NEW.raw_user_meta_data->>'avatar_url'
    );

    IF v_rol = 'deportista' THEN
      INSERT INTO public.athlete_profiles (user_id, disciplina, posicion, edad)
      VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'disciplina', 'Fútbol'),
        COALESCE(NEW.raw_user_meta_data->>'posicion', 'Delantero'),
        COALESCE((NEW.raw_user_meta_data->>'edad')::INTEGER, 20)
      );
    ELSE
      INSERT INTO public.recruiter_profiles (user_id, nombre_club)
      VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nombre_club', v_nombre));
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;