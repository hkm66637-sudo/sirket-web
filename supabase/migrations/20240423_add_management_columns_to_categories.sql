-- Add management columns to finance_categories
ALTER TABLE public.finance_categories 
ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS description text,
ADD COLUMN IF NOT EXISTS color text,
ADD COLUMN IF NOT EXISTS icon text;

-- Add index for filtering
CREATE INDEX IF NOT EXISTS finance_categories_type_is_active_idx ON public.finance_categories(type, is_active);
