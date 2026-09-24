-- ==============================================================================
-- SPORTCONNECT - SEED DATA (DATOS DE EJEMPLO)
-- Usuarios de prueba, perfiles de deportistas y reclutadores, videos y chats.
-- ==============================================================================

-- 1. Insertar perfiles de demostración (utilizando UUIDs consistentes)
DO $$
DECLARE
    athlete1_id UUID := 'a1111111-1111-4111-a111-111111111111';
    athlete2_id UUID := 'a2222222-2222-4222-a222-222222222222';
    recruiter1_id UUID := 'b1111111-1111-4111-b111-111111111111';
    recruiter2_id UUID := 'b2222222-2222-4222-b222-222222222222';
    post1_id UUID := 'c1111111-1111-4111-c111-111111111111';
    post2_id UUID := 'c2222222-2222-4222-c222-222222222222';
    post3_id UUID := 'c3333333-3333-4333-c333-333333333333';
    chat1_id UUID := 'd1111111-1111-4111-d111-111111111111';
BEGIN
    -- Perfil 1: Carlos Martínez (Deportista destacado)
    INSERT INTO public.profiles (id, nombre, email, rol, ubicacion, avatar_url, bio, fecha_registro)
    VALUES (
        athlete1_id,
        'Carlos Martínez',
        'carlos.martinez@sportconnect.dev',
        'deportista',
        'Madrid, España',
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
        'Delantero profesional con 8 años de experiencia. Especializado en velocidad y finalización. He jugado en categorías inferiores y busco oportunidades en clubes de primera y segunda división.',
        '2024-01-15 10:00:00+00'
    ) ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.athlete_profiles (user_id, disciplina, posicion, edad, partidos, goles, asistencias, logros)
    VALUES (
        athlete1_id,
        'Fútbol',
        'Delantero',
        22,
        120,
        85,
        42,
        ARRAY['Campeón regional Sub-20', 'Máximo goleador 2023', 'Mejor jugador joven del torneo']::TEXT[]
    ) ON CONFLICT (user_id) DO NOTHING;

    -- Perfil 2: Ana Rodríguez (Deportista baloncesto)
    INSERT INTO public.profiles (id, nombre, email, rol, ubicacion, avatar_url, bio, fecha_registro)
    VALUES (
        athlete2_id,
        'Ana Rodríguez',
        'ana.rodriguez@sportconnect.dev',
        'deportista',
        'Valencia, España',
        'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80',
        'Base armadora con excelente visión de juego, tiros triples y rapidez defensiva en transición.',
        '2024-02-01 12:00:00+00'
    ) ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.athlete_profiles (user_id, disciplina, posicion, edad, partidos, goles, asistencias, logros)
    VALUES (
        athlete2_id,
        'Baloncesto',
        'Base / Armador',
        20,
        78,
        34,
        68,
        ARRAY['Líder de asistencias Liga Nacional Jr', 'MVP Final Four 2023']::TEXT[]
    ) ON CONFLICT (user_id) DO NOTHING;

    -- Perfil 3: FC Barcelona Academy (Reclutador)
    INSERT INTO public.profiles (id, nombre, email, rol, ubicacion, avatar_url, bio, fecha_registro)
    VALUES (
        recruiter1_id,
        'FC Barcelona Academy',
        'scout.fcb@sportconnect.dev',
        'reclutador',
        'Barcelona, España',
        'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=300&auto=format&fit=crop&q=80',
        'Academia de fútbol profesional buscando talento joven para nuestras categorías inferiores. Enfocados en desarrollar futuras estrellas del fútbol con metodología de primer nivel y clase mundial.',
        '2023-12-01 09:00:00+00'
    ) ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.recruiter_profiles (user_id, nombre_club, tipo_institucion, deportistas_contactados, contrataciones, scouts_activos, perfiles_buscados)
    VALUES (
        recruiter1_id,
        'FC Barcelona Academy',
        'Club de Fútbol Profesional',
        150,
        12,
        8,
        ARRAY['Delanteros veloces (18-23 años)', 'Mediocampistas creativos (17-22 años)', 'Defensas centrales (18-24 años)']::TEXT[]
    ) ON CONFLICT (user_id) DO NOTHING;

    -- Perfil 4: Real Madrid Scout (Reclutador)
    INSERT INTO public.profiles (id, nombre, email, rol, ubicacion, avatar_url, bio, fecha_registro)
    VALUES (
        recruiter2_id,
        'Real Madrid Scout',
        'scout.rm@sportconnect.dev',
        'reclutador',
        'Madrid, España',
        'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=300&auto=format&fit=crop&q=80',
        'Área de captación y captación juvenil para talentos nacionales e internacionales.',
        '2023-11-20 08:30:00+00'
    ) ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.recruiter_profiles (user_id, nombre_club, tipo_institucion, deportistas_contactados, contrataciones, scouts_activos, perfiles_buscados)
    VALUES (
        recruiter2_id,
        'Real Madrid CF Academy',
        'Club de Fútbol Profesional',
        210,
        18,
        12,
        ARRAY['Extremos desequilibrantes', 'Laterales con llegada', 'Porteros con juego aéreo']::TEXT[]
    ) ON CONFLICT (user_id) DO NOTHING;

    -- 2. Publicaciones de video
    INSERT INTO public.posts (id, user_id, video_url, thumbnail_url, titulo, descripcion, deporte, duracion, likes_count, comments_count)
    VALUES (
        post1_id,
        athlete1_id,
        'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800&auto=format&fit=crop&q=80',
        'Gol desde fuera del área',
        'Gol increíble desde fuera del área en el último partido. Velocidad y potencia combinadas. 🔥 ⚽',
        'Fútbol',
        '0:45',
        245,
        2
    ) ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.posts (id, user_id, video_url, thumbnail_url, titulo, descripcion, deporte, duracion, likes_count, comments_count)
    VALUES (
        post2_id,
        athlete1_id,
        'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4',
        'https://images.unsplash.com/photo-1551958219-acbc608c6377?w=800&auto=format&fit=crop&q=80',
        'Hat-trick vs Valencia',
        'Resumen de mis tres goles en el derbi regional contra el filial. Buena lectura de espacios.',
        'Fútbol',
        '2:30',
        189,
        5
    ) ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.posts (id, user_id, video_url, thumbnail_url, titulo, descripcion, deporte, duracion, likes_count, comments_count)
    VALUES (
        post3_id,
        athlete2_id,
        'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
        'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&auto=format&fit=crop&q=80',
        'Jugada individual y triple',
        'Recuperación defensiva, transición rápida en contraataque y triple decisivo en el último cuarto.',
        'Baloncesto',
        '1:15',
        98,
        3
    ) ON CONFLICT (id) DO NOTHING;

    -- 3. Comentarios de ejemplo
    INSERT INTO public.comments (post_id, user_id, contenido)
    VALUES 
        (post1_id, recruiter1_id, 'Excelente definición Carlos. Gran potencia de golpeo.'),
        (post1_id, recruiter2_id, 'Muy buena curva y lectura de la trayectoria del balón.')
    ON CONFLICT DO NOTHING;

    -- 4. Chat entre FC Barcelona Academy y Carlos Martínez
    INSERT INTO public.chats (id, created_at, updated_at)
    VALUES (chat1_id, now() - INTERVAL '3 days', now())
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.chat_participants (chat_id, user_id)
    VALUES 
        (chat1_id, recruiter1_id),
        (chat1_id, athlete1_id)
    ON CONFLICT DO NOTHING;

    INSERT INTO public.messages (chat_id, sender_id, contenido, leido, created_at)
    VALUES
        (chat1_id, recruiter1_id, 'Hola Carlos, hemos visto tu perfil y nos impresiona tu velocidad y técnica.', true, now() - INTERVAL '40 minutes'),
        (chat1_id, athlete1_id, '¡Muchas gracias! Es un honor recibir interés de parte del Barcelona.', true, now() - INTERVAL '38 minutes'),
        (chat1_id, recruiter1_id, 'Nos gustaría hablar contigo sobre una oportunidad en nuestras categorías inferiores.', true, now() - INTERVAL '35 minutes'),
        (chat1_id, recruiter1_id, '¿Estarías disponible para una videollamada esta semana?', false, now() - INTERVAL '30 minutes'),
        (chat1_id, athlete1_id, 'Por supuesto, estaría encantado. ¿Qué día les vendría mejor?', true, now() - INTERVAL '25 minutes')
    ON CONFLICT DO NOTHING;

END $$;
