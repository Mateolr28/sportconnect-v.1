-- Las cuentas nuevas deben conservar los datos elegidos durante el registro
-- y no heredar contenido de fútbol ni logros de demostración.
ALTER TABLE public.athlete_profiles
  ALTER COLUMN disciplina SET DEFAULT '',
  ALTER COLUMN posicion SET DEFAULT '',
  ALTER COLUMN logros SET DEFAULT ARRAY[]::TEXT[];

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_rol TEXT;
    v_nombre TEXT;
BEGIN
    v_rol := COALESCE(NEW.raw_user_meta_data->>'rol', 'deportista');
    v_nombre := COALESCE(NEW.raw_user_meta_data->>'nombre', split_part(NEW.email, '@', 1));

    INSERT INTO public.profiles (id, nombre, email, rol, avatar_url, ubicacion)
    VALUES (
        NEW.id,
        v_nombre,
        NEW.email,
        v_rol,
        NEW.raw_user_meta_data->>'avatar_url',
        COALESCE(NEW.raw_user_meta_data->>'ubicacion', 'Madrid, España')
    );

    IF v_rol = 'deportista' THEN
        INSERT INTO public.athlete_profiles (user_id, disciplina, posicion, edad, logros)
        VALUES (
            NEW.id,
            COALESCE(NULLIF(NEW.raw_user_meta_data->>'disciplina', ''), ''),
            COALESCE(NULLIF(NEW.raw_user_meta_data->>'posicion', ''), ''),
            NULLIF(NEW.raw_user_meta_data->>'edad', '')::INTEGER,
            ARRAY[]::TEXT[]
        );
    ELSE
        INSERT INTO public.recruiter_profiles (user_id, nombre_club)
        VALUES (
            NEW.id,
            COALESCE(NEW.raw_user_meta_data->>'nombre_club', 'Club Deportivo')
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
