ALTER TABLE public.recruiter_profiles
  ADD COLUMN IF NOT EXISTS deportes_buscados TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS categorias_buscadas TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS filosofia TEXT,
  ADD COLUMN IF NOT EXISTS proceso_seleccion TEXT,
  ADD COLUMN IF NOT EXISTS beneficios TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS sitio_web TEXT,
  ADD COLUMN IF NOT EXISTS email_contacto TEXT,
  ADD COLUMN IF NOT EXISTS telefono_contacto TEXT,
  ADD COLUMN IF NOT EXISTS anio_fundacion INTEGER CHECK (anio_fundacion IS NULL OR anio_fundacion BETWEEN 1800 AND 2200),
  ADD COLUMN IF NOT EXISTS sede_principal TEXT;

ALTER TABLE public.recruiter_profiles
  ALTER COLUMN perfiles_buscados SET DEFAULT ARRAY[]::TEXT[];

UPDATE public.recruiter_profiles
SET perfiles_buscados = ARRAY[]::TEXT[]
WHERE perfiles_buscados = ARRAY['Delanteros veloces (18-23 años)', 'Mediocampistas creativos (17-22 años)', 'Defensas centrales (18-24 años)']::TEXT[];
