ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS legacy_image_url text;
UPDATE public.articles SET legacy_image_url = image_url, image_url = NULL WHERE image_url ILIKE '%wp-content%';
UPDATE public.articles SET content = regexp_replace(content, '<img[^>]*wp-content[^>]*>', '', 'gi') WHERE content ILIKE '%wp-content%';