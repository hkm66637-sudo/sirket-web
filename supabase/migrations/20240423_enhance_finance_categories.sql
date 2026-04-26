-- 1. Update finance_categories table
ALTER TABLE public.finance_categories 
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now(),
ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE;

-- 2. Ensure trigger for updated_at
DROP TRIGGER IF EXISTS set_finance_categories_updated_at ON public.finance_categories;
CREATE TRIGGER set_finance_categories_updated_at
    BEFORE UPDATE ON public.finance_categories
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 3. Add category_id to finance_records for better standardization
ALTER TABLE public.finance_records 
ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES public.finance_categories(id) ON DELETE SET NULL;

-- 4. Try to link existing records by name (optional but helpful)
DO $$ 
BEGIN 
    UPDATE public.finance_records fr
    SET category_id = fc.id
    FROM public.finance_categories fc
    WHERE fr.category = fc.name AND fr.type = fc.type;
EXCEPTION WHEN OTHERS THEN 
    -- Ignore if names don't match exactly
END $$;
