-- Add category_forms column to auditions table
-- category_forms: { [categoryName]: AuditionField[] }
ALTER TABLE public.auditions
  ADD COLUMN IF NOT EXISTS category_forms jsonb NOT NULL DEFAULT '{}'::jsonb;
