-- ==============================================================================
-- SPORTCONNECT - ESQUEMA COMPLETO DE BASE DE DATOS SUPABASE POSTGRESQL
-- Incluye Tablas, Relaciones, Triggers, RLS, Storage y Realtime
-- ==============================================================================

-- 1. EXTENSIONES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. TABLA: profiles (Vinculada a auth.users de Supabase)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    email TEXT NOT NULL,
    rol TEXT NOT NULL CHECK (rol IN ('deportista', 'reclutador')),
    ubicacion TEXT DEFAULT 'Madrid, España',
    avatar_url TEXT,
    bio TEXT,
    fecha_registro TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. TABLA: athlete_profiles (Datos específicos para deportistas)
CREATE TABLE IF NOT EXISTS public.athlete_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    disciplina TEXT NOT NULL DEFAULT 'Fútbol',
    posicion TEXT DEFAULT 'Delantero',
    edad INTEGER CHECK (edad >= 10 AND edad <= 50),
    partidos INTEGER DEFAULT 0 CHECK (partidos >= 0),
    goles INTEGER DEFAULT 0 CHECK (goles >= 0),
    asistencias INTEGER DEFAULT 0 CHECK (asistencias >= 0),
    logros TEXT[] DEFAULT ARRAY['Campeón regional Sub-20', 'Máximo goleador 2023', 'Mejor jugador joven del torneo']::TEXT[],
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. TABLA: recruiter_profiles (Datos específicos para reclutadores)
CREATE TABLE IF NOT EXISTS public.recruiter_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    nombre_club TEXT NOT NULL DEFAULT 'Club Deportivo',
    tipo_institucion TEXT DEFAULT 'Club Profesional',
    deportistas_contactados INTEGER DEFAULT 0 CHECK (deportistas_contactados >= 0),
    contrataciones INTEGER DEFAULT 0 CHECK (contrataciones >= 0),
    scouts_activos INTEGER DEFAULT 1 CHECK (scouts_activos >= 0),
    perfiles_buscados TEXT[] DEFAULT ARRAY['Delanteros veloces (18-23 años)', 'Mediocampistas creativos (17-22 años)', 'Defensas centrales (18-24 años)']::TEXT[],
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. TABLA: posts (Publicaciones con video)
CREATE TABLE IF NOT EXISTS public.posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    video_url TEXT NOT NULL,
    storage_path TEXT,
    thumbnail_url TEXT,
    titulo TEXT,
    descripcion TEXT,
    deporte TEXT NOT NULL DEFAULT 'Fútbol',
    duracion TEXT DEFAULT '0:45',
    likes_count INTEGER DEFAULT 0 CHECK (likes_count >= 0),
    comments_count INTEGER DEFAULT 0 CHECK (comments_count >= 0),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. TABLA: likes (Reacciones de usuarios)
CREATE TABLE IF NOT EXISTS public.likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_user_post_like UNIQUE (post_id, user_id)
);

-- 7. TABLA: comments (Comentarios en posts)
CREATE TABLE IF NOT EXISTS public.comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    contenido TEXT NOT NULL CHECK (char_length(trim(contenido)) > 0),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. TABLA: chats (Conversaciones)
CREATE TABLE IF NOT EXISTS public.chats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. TABLA: chat_participants (Participantes de cada conversación)
CREATE TABLE IF NOT EXISTS public.chat_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_id UUID NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_chat_user UNIQUE (chat_id, user_id)
);

-- 10. TABLA: messages (Mensajes del chat en tiempo real)
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_id UUID NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    contenido TEXT NOT NULL CHECK (char_length(trim(contenido)) > 0),
    leido BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 11. TABLA ADICIONAL: saved_posts (Guardar/Marcador de talentos para reclutadores)
CREATE TABLE IF NOT EXISTS public.saved_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_user_saved_post UNIQUE (post_id, user_id)
);

-- ==============================================================================
-- ÍNDICES DE RENDIMIENTO
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON public.posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_deporte ON public.posts(deporte);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_likes_post_id ON public.likes(post_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON public.likes(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON public.comments(post_id);
CREATE INDEX IF NOT EXISTS idx_chat_participants_user_id ON public.chat_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_participants_chat_id ON public.chat_participants(chat_id);
CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON public.messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at ASC);

-- ==============================================================================
-- FUNCIONES Y TRIGGERS AUTOMATIZADOS
-- ==============================================================================

-- A) Trigger para crear perfil automáticamente al registrar usuario en Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_rol TEXT;
    v_nombre TEXT;
BEGIN
    v_rol := COALESCE(NEW.raw_user_meta_data->>'rol', 'deportista');
    v_nombre := COALESCE(NEW.raw_user_meta_data->>'nombre', split_part(NEW.email, '@', 1));

    -- Insertar en profiles
    INSERT INTO public.profiles (id, nombre, email, rol, avatar_url, ubicacion)
    VALUES (
        NEW.id,
        v_nombre,
        NEW.email,
        v_rol,
        NEW.raw_user_meta_data->>'avatar_url',
        COALESCE(NEW.raw_user_meta_data->>'ubicacion', 'Madrid, España')
    );

    -- Insertar en tabla correspondiente
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
        VALUES (
            NEW.id,
            COALESCE(NEW.raw_user_meta_data->>'nombre_club', 'Club Deportivo')
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- B) Actualizar likes_count de forma consistente
CREATE OR REPLACE FUNCTION public.update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.posts
        SET likes_count = likes_count + 1
        WHERE id = NEW.post_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.posts
        SET likes_count = GREATEST(likes_count - 1, 0)
        WHERE id = OLD.post_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_like_change ON public.likes;
CREATE TRIGGER on_like_change
    AFTER INSERT OR DELETE ON public.likes
    FOR EACH ROW EXECUTE FUNCTION public.update_post_likes_count();

-- C) Actualizar comments_count de forma consistente
CREATE OR REPLACE FUNCTION public.update_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.posts
        SET comments_count = comments_count + 1
        WHERE id = NEW.post_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.posts
        SET comments_count = GREATEST(comments_count - 1, 0)
        WHERE id = OLD.post_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_comment_change ON public.comments;
CREATE TRIGGER on_comment_change
    AFTER INSERT OR DELETE ON public.comments
    FOR EACH ROW EXECUTE FUNCTION public.update_post_comments_count();

-- D) Actualizar chats.updated_at cuando se envía un nuevo mensaje
CREATE OR REPLACE FUNCTION public.handle_new_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.chats
    SET updated_at = timezone('utc'::text, now())
    WHERE id = NEW.chat_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_message_created ON public.messages;
CREATE TRIGGER on_message_created
    AFTER INSERT ON public.messages
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_message();

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) & POLÍTICAS
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.athlete_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recruiter_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_posts ENABLE ROW LEVEL SECURITY;

-- 1. Profiles
CREATE POLICY "Perfiles públicos para lectura" ON public.profiles
    FOR SELECT USING (true);

CREATE POLICY "Usuarios pueden actualizar su propio perfil" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Usuarios pueden insertar su propio perfil" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- 2. Athlete Profiles
CREATE POLICY "Perfiles de deportistas públicos" ON public.athlete_profiles
    FOR SELECT USING (true);

CREATE POLICY "Deportistas gestionan su propio perfil" ON public.athlete_profiles
    FOR ALL USING (auth.uid() = user_id);

-- 3. Recruiter Profiles
CREATE POLICY "Perfiles de reclutadores públicos" ON public.recruiter_profiles
    FOR SELECT USING (true);

CREATE POLICY "Reclutadores gestionan su propio perfil" ON public.recruiter_profiles
    FOR ALL USING (auth.uid() = user_id);

-- 4. Posts
CREATE POLICY "Publicaciones visibles para todos" ON public.posts
    FOR SELECT USING (true);

CREATE POLICY "Usuarios autenticados pueden crear publicaciones" ON public.posts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden actualizar sus publicaciones" ON public.posts
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden eliminar sus publicaciones" ON public.posts
    FOR DELETE USING (auth.uid() = user_id);

-- 5. Likes
CREATE POLICY "Likes públicos para consulta" ON public.likes
    FOR SELECT USING (true);

CREATE POLICY "Usuarios autenticados pueden dar like" ON public.likes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden remover su propio like" ON public.likes
    FOR DELETE USING (auth.uid() = user_id);

-- 6. Comments
CREATE POLICY "Comentarios visibles para todos" ON public.comments
    FOR SELECT USING (true);

CREATE POLICY "Usuarios autenticados pueden comentar" ON public.comments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden eliminar su propio comentario" ON public.comments
    FOR DELETE USING (auth.uid() = user_id);

-- 7. Chats & Chat Participants
CREATE POLICY "Usuarios acceden a chats donde participan" ON public.chats
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.chat_participants
            WHERE chat_participants.chat_id = chats.id
            AND chat_participants.user_id = auth.uid()
        )
    );

CREATE POLICY "Usuarios autenticados pueden crear chats" ON public.chats
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Usuarios ven participantes de sus chats" ON public.chat_participants
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.chat_participants cp
            WHERE cp.chat_id = chat_participants.chat_id
            AND cp.user_id = auth.uid()
        )
    );

CREATE POLICY "Usuarios autenticados pueden unirse a chats" ON public.chat_participants
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 8. Messages
CREATE POLICY "Participantes pueden leer mensajes" ON public.messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.chat_participants
            WHERE chat_participants.chat_id = messages.chat_id
            AND chat_participants.user_id = auth.uid()
        )
    );

CREATE POLICY "Participantes pueden enviar mensajes" ON public.messages
    FOR INSERT WITH CHECK (
        auth.uid() = sender_id AND
        EXISTS (
            SELECT 1 FROM public.chat_participants
            WHERE chat_participants.chat_id = messages.chat_id
            AND chat_participants.user_id = auth.uid()
        )
    );

CREATE POLICY "Participantes pueden marcar como leido" ON public.messages
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.chat_participants
            WHERE chat_participants.chat_id = messages.chat_id
            AND chat_participants.user_id = auth.uid()
        )
    );

-- 9. Saved Posts
CREATE POLICY "Usuarios ven sus posts guardados" ON public.saved_posts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden guardar posts" ON public.saved_posts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden eliminar posts guardados" ON public.saved_posts
    FOR DELETE USING (auth.uid() = user_id);

-- ==============================================================================
-- CONFIGURACIÓN DE SUPABASE STORAGE
-- ==============================================================================

-- Creación de buckets para multimedia
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('sports-videos', 'sports-videos', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas de Storage para avatars
CREATE POLICY "Avatares públicos" ON storage.objects
    FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Subida de avatar propio" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'avatars' AND
        auth.role() = 'authenticated'
    );

CREATE POLICY "Actualizar avatar propio" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'avatars' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Eliminar avatar propio" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'avatars' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- Políticas de Storage para videos
CREATE POLICY "Videos deportivos públicos" ON storage.objects
    FOR SELECT USING (bucket_id = 'sports-videos');

CREATE POLICY "Subida de videos propios" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'sports-videos' AND
        auth.role() = 'authenticated'
    );

CREATE POLICY "Eliminar videos propios" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'sports-videos' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- ==============================================================================
-- HABILITACIÓN DE SUPABASE REALTIME
-- ==============================================================================
-- Agregar tablas a la publicación de tiempo real de Supabase
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chats;
ALTER PUBLICATION supabase_realtime ADD TABLE public.likes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;
