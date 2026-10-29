CREATE TABLE IF NOT EXISTS public.sports_catalog (
  slug TEXT PRIMARY KEY,
  nombre TEXT NOT NULL UNIQUE,
  descripcion TEXT NOT NULL,
  categorias TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  especialidades TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  modos_competencia TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.athlete_profiles
  ADD COLUMN IF NOT EXISTS categoria TEXT,
  ADD COLUMN IF NOT EXISTS especialidad TEXT,
  ADD COLUMN IF NOT EXISTS modalidad_competencia TEXT;

UPDATE public.athlete_profiles
SET logros = ARRAY[]::TEXT[]
WHERE logros = ARRAY['Campeón regional Sub-20', 'Máximo goleador 2023', 'Mejor jugador joven del torneo']::TEXT[];

INSERT INTO public.sports_catalog (slug, nombre, descripcion, categorias, especialidades, modos_competencia)
VALUES
  ('futbol', 'Fútbol', 'Deporte colectivo de 11 jugadores por equipo.', ARRAY['Fútbol 11','Fútbol 7','Fútbol playa'], ARRAY['Portero','Defensa central','Lateral','Mediocampista','Extremo','Delantero'], ARRAY['Liga','Torneo eliminatorio','Fase de grupos','Todos contra todos']),
  ('baloncesto', 'Baloncesto', 'Deporte de cancha basado en anotaciones y posesiones.', ARRAY['5x5','3x3','Baloncesto juvenil'], ARRAY['Base','Escolta','Alero','Ala-pívot','Pívot'], ARRAY['Liga','Playoffs','Torneo 3x3','Fase de grupos']),
  ('voleibol', 'Voleibol', 'Deporte de red en sala o playa.', ARRAY['Voleibol sala','Voleibol playa','Voleibol juvenil'], ARRAY['Colocador','Líbero','Central','Punta','Opuesto'], ARRAY['Liga','Torneo','Fase de grupos','Eliminación directa']),
  ('atletismo', 'Atletismo', 'Disciplinas de carreras, saltos, lanzamientos y combinadas.', ARRAY['Velocidad','Medio fondo y fondo','Saltos','Lanzamientos','Pruebas combinadas'], ARRAY['100/200/400 m','800/1500 m','Fondo','Saltos','Lanzamientos','Decatlón/Heptatlón'], ARRAY['Marca individual','Series y final','Heptatlón','Decatlón']),
  ('natacion', 'Natación', 'Disciplinas acuáticas de piscina y aguas abiertas.', ARRAY['Piscina','Aguas abiertas','Natación artística','Clavados'], ARRAY['Libre','Espalda','Braza','Mariposa','Combinado','Relevos'], ARRAY['Series y final','Contrarreloj','Relevos','Puntuación']),
  ('ciclismo', 'Ciclismo', 'Competencias sobre bicicleta en ruta, pista y montaña.', ARRAY['Ruta','Pista','Mountain bike','BMX'], ARRAY['Ruta','Contrarreloj','Velocidad','Fondo','Descenso','Freestyle'], ARRAY['Etapas','Contrarreloj','Carrera por puntos','Eliminación']),
  ('tenis', 'Tenis', 'Deporte de raqueta individual o por parejas.', ARRAY['Individual','Dobles','Tenis de mesa'], ARRAY['Individual','Dobles','Saque','Fondo de pista'], ARRAY['Individual','Dobles','Round robin','Eliminación directa']),
  ('beisbol', 'Béisbol', 'Deporte de bate, pelota y carreras por entradas.', ARRAY['Béisbol 9 entradas','Softbol','Béisbol juvenil'], ARRAY['Lanzador','Receptor','Infield','Outfield','Bateador designado'], ARRAY['Liga','Series','Playoffs','Torneo']),
  ('boxeo', 'Boxeo', 'Combate reglamentado por categorías de peso.', ARRAY['Olímpico','Profesional','Amateur'], ARRAY['Peso ligero','Peso wélter','Peso mediano','Peso pesado'], ARRAY['Combate individual','Torneo eliminatorio','Liga','Puntuación']),
  ('gimnasia', 'Gimnasia', 'Disciplinas de ejecución técnica y artística.', ARRAY['Artística','Rítmica','Trampolín','Acrobática'], ARRAY['Suelo','Salto','Barras','Anillas','Viga','All-around'], ARRAY['Rutina individual','Equipos','All-around','Final por aparato']),
  ('rugby', 'Rugby', 'Deporte colectivo de contacto y avance territorial.', ARRAY['Rugby 15','Rugby 7','Rugby playa'], ARRAY['Pilar','Hooker','Apertura','Centro','Ala','Zaguero'], ARRAY['Liga','Torneo','Fase de grupos','Eliminación directa']),
  ('hockey', 'Hockey', 'Deporte de equipo con stick sobre césped, hielo o sala.', ARRAY['Hockey sobre césped','Hockey sobre hielo','Hockey sala'], ARRAY['Portero','Defensa','Mediocampo','Delantero'], ARRAY['Liga','Torneo','Series','Eliminación directa']),
  ('futbol-sala', 'Fútbol Sala', 'Versión de cancha reducida con cinco jugadores.', ARRAY['Futsal 5x5','Futsal juvenil','Fútbol sala femenino'], ARRAY['Portero','Cierre','Ala','Pívot'], ARRAY['Liga','Torneo','Playoffs','Fase de grupos'])
ON CONFLICT (slug) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categorias = EXCLUDED.categorias,
  especialidades = EXCLUDED.especialidades,
  modos_competencia = EXCLUDED.modos_competencia;

ALTER TABLE public.sports_catalog ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Catálogo deportivo público" ON public.sports_catalog
  FOR SELECT USING (activo = true);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_rol TEXT;
    v_nombre TEXT;
BEGIN
    v_rol := COALESCE(NEW.raw_user_meta_data->>'rol', 'deportista');
    v_nombre := COALESCE(NEW.raw_user_meta_data->>'nombre', split_part(NEW.email, '@', 1));
    INSERT INTO public.profiles (id, nombre, email, rol, avatar_url, ubicacion)
    VALUES (NEW.id, v_nombre, NEW.email, v_rol, NEW.raw_user_meta_data->>'avatar_url',
      COALESCE(NEW.raw_user_meta_data->>'ubicacion', 'Madrid, España'));
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
      VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nombre_club', 'Club Deportivo'));
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
