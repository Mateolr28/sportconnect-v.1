ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS media_type TEXT NOT NULL DEFAULT 'video';

ALTER TABLE public.posts
  DROP CONSTRAINT IF EXISTS posts_media_type_check;

ALTER TABLE public.posts
  ADD CONSTRAINT posts_media_type_check
  CHECK (media_type IN ('video', 'image'));
