-- 1. Remove duplicate partners (keep the oldest one by created_at)
DELETE FROM public.partners
WHERE id IN (
    SELECT id
    FROM (
        SELECT id,
               ROW_NUMBER() OVER (PARTITION BY name ORDER BY created_at ASC) as row_num
        FROM public.partners
    ) t
    WHERE t.row_num > 1
);

-- 2. Add unique constraint to name to prevent future duplicates
-- Check if it already exists to avoid errors
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'unique_partner_name'
    ) THEN
        ALTER TABLE public.partners ADD CONSTRAINT unique_partner_name UNIQUE (name);
    END IF;
END $$;
