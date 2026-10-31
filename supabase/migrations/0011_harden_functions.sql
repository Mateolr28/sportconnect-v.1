-- Endurecimiento de funciones SECURITY DEFINER (avisos del linter de Supabase).
-- 1) Fija search_path para evitar que un esquema alterno sustituya objetos.
-- 2) Retira EXECUTE a PUBLIC/anon/authenticated en funciones de trigger,
--    que no deben ser invocables vía /rest/v1/rpc.
-- 3) is_chat_participant y get_or_create_chat siguen disponibles solo para usuarios autenticados.

ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION public.handle_new_message() SET search_path = public;
ALTER FUNCTION public.update_post_likes_count() SET search_path = public;
ALTER FUNCTION public.update_post_comments_count() SET search_path = public;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_message() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_post_likes_count() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_post_comments_count() FROM PUBLIC, anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.is_chat_participant(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_or_create_chat(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_chat_participant(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_or_create_chat(uuid) TO authenticated;
