-- Endurece la seguridad de chats, mensajes y storage.
-- 1. Evita la recursión infinita en la política de chat_participants.
-- 2. Impide que un usuario se una a chats ajenos: los chats se crean solo con get_or_create_chat().
-- 3. Los participantes solo pueden marcar como leídos los mensajes recibidos (no editar su contenido).
-- 4. Las subidas a storage quedan limitadas a la carpeta del propio usuario.

-- ==============================================================================
-- FUNCIÓN AUXILIAR: ¿el usuario actual participa en el chat?
-- SECURITY DEFINER para consultar chat_participants sin volver a evaluar su RLS.
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.is_chat_participant(p_chat_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.chat_participants
        WHERE chat_id = p_chat_id
        AND user_id = auth.uid()
    );
$$;

REVOKE ALL ON FUNCTION public.is_chat_participant(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_chat_participant(UUID) TO authenticated;

-- ==============================================================================
-- CHATS
-- ==============================================================================
DROP POLICY IF EXISTS "Usuarios acceden a chats donde participan" ON public.chats;
DROP POLICY IF EXISTS "Usuarios autenticados pueden crear chats" ON public.chats;

CREATE POLICY "Usuarios acceden a chats donde participan" ON public.chats
    FOR SELECT TO authenticated
    USING (public.is_chat_participant(id));

-- ==============================================================================
-- CHAT PARTICIPANTS
-- ==============================================================================
DROP POLICY IF EXISTS "Usuarios ven participantes de sus chats" ON public.chat_participants;
DROP POLICY IF EXISTS "Usuarios autenticados pueden unirse a chats" ON public.chat_participants;

CREATE POLICY "Usuarios ven participantes de sus chats" ON public.chat_participants
    FOR SELECT TO authenticated
    USING (public.is_chat_participant(chat_id));

-- ==============================================================================
-- MESSAGES
-- ==============================================================================
DROP POLICY IF EXISTS "Participantes pueden leer mensajes" ON public.messages;
DROP POLICY IF EXISTS "Participantes pueden enviar mensajes" ON public.messages;
DROP POLICY IF EXISTS "Participantes pueden marcar como leido" ON public.messages;

CREATE POLICY "Participantes pueden leer mensajes" ON public.messages
    FOR SELECT TO authenticated
    USING (public.is_chat_participant(chat_id));

CREATE POLICY "Participantes pueden enviar mensajes" ON public.messages
    FOR INSERT TO authenticated
    WITH CHECK (
        auth.uid() = sender_id
        AND leido = false
        AND public.is_chat_participant(chat_id)
    );

CREATE POLICY "Participantes pueden marcar como leido" ON public.messages
    FOR UPDATE TO authenticated
    USING (public.is_chat_participant(chat_id) AND sender_id <> auth.uid())
    WITH CHECK (public.is_chat_participant(chat_id) AND sender_id <> auth.uid());

-- Solo la columna leido es actualizable por los clientes.
REVOKE UPDATE ON public.messages FROM anon, authenticated;
GRANT UPDATE (leido) ON public.messages TO authenticated;

-- ==============================================================================
-- RPC: obtener o crear el chat 1 a 1 entre el usuario actual y otro usuario
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.get_or_create_chat(p_target_user_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_current_user_id UUID := auth.uid();
    v_chat_id UUID;
BEGIN
    IF v_current_user_id IS NULL THEN
        RAISE EXCEPTION 'No autenticado' USING ERRCODE = '42501';
    END IF;

    IF p_target_user_id IS NULL OR p_target_user_id = v_current_user_id THEN
        RAISE EXCEPTION 'No puedes iniciar una conversación contigo mismo' USING ERRCODE = '22023';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_target_user_id) THEN
        RAISE EXCEPTION 'El usuario destino no existe' USING ERRCODE = 'P0002';
    END IF;

    -- Serializa la creación para la misma pareja y evita chats duplicados.
    PERFORM pg_advisory_xact_lock(
        hashtextextended(
            LEAST(v_current_user_id, p_target_user_id)::text || GREATEST(v_current_user_id, p_target_user_id)::text,
            0
        )
    );

    SELECT mine.chat_id INTO v_chat_id
    FROM public.chat_participants mine
    JOIN public.chat_participants theirs ON theirs.chat_id = mine.chat_id
    WHERE mine.user_id = v_current_user_id
    AND theirs.user_id = p_target_user_id
    ORDER BY mine.joined_at
    LIMIT 1;

    IF v_chat_id IS NOT NULL THEN
        RETURN v_chat_id;
    END IF;

    INSERT INTO public.chats DEFAULT VALUES RETURNING id INTO v_chat_id;

    INSERT INTO public.chat_participants (chat_id, user_id)
    VALUES (v_chat_id, v_current_user_id), (v_chat_id, p_target_user_id);

    RETURN v_chat_id;
END;
$$;

REVOKE ALL ON FUNCTION public.get_or_create_chat(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_or_create_chat(UUID) TO authenticated;

-- ==============================================================================
-- STORAGE: subidas solo dentro de la carpeta {user_id}/
-- ==============================================================================
DROP POLICY IF EXISTS "Subida de avatar propio" ON storage.objects;
DROP POLICY IF EXISTS "Actualizar avatar propio" ON storage.objects;
DROP POLICY IF EXISTS "Subida de videos propios" ON storage.objects;

CREATE POLICY "Subida de avatar propio" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (
        bucket_id = 'avatars' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Actualizar avatar propio" ON storage.objects
    FOR UPDATE TO authenticated
    USING (
        bucket_id = 'avatars' AND
        auth.uid()::text = (storage.foldername(name))[1]
    )
    WITH CHECK (
        bucket_id = 'avatars' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Subida de videos propios" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (
        bucket_id = 'sports-videos' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );
