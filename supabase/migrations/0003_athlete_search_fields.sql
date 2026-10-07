ALTER TABLE public.athlete_profiles
  ADD COLUMN IF NOT EXISTS genero TEXT CHECK (genero IN ('masculino', 'femenino', 'no_especificado')),
  ADD COLUMN IF NOT EXISTS nivel_deportivo TEXT CHECK (nivel_deportivo IN ('amateur', 'formativo', 'semiprofesional', 'profesional', 'elite')),
  ADD COLUMN IF NOT EXISTS disponibilidad TEXT CHECK (disponibilidad IN ('disponible', 'buscando_equipo', 'pruebas', 'contrato_vigente', 'no_disponible')),
  ADD COLUMN IF NOT EXISTS club_actual TEXT,
  ADD COLUMN IF NOT EXISTS academia TEXT,
  ADD COLUMN IF NOT EXISTS experiencia_anios INTEGER CHECK (experiencia_anios >= 0);
