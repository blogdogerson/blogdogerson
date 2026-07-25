ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS categories text[] NOT NULL DEFAULT '{}';
UPDATE public.articles SET categories = ARRAY[category] WHERE (categories IS NULL OR array_length(categories,1) IS NULL) AND category IS NOT NULL;
CREATE INDEX IF NOT EXISTS articles_categories_gin_idx ON public.articles USING GIN (categories);