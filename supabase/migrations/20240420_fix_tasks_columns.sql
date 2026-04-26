-- 1. Ensure description column exists in tasks table
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='description') THEN
        ALTER TABLE public.tasks ADD COLUMN description text;
    END IF;
END $$;

-- 2. Ensure created_by column exists (usually it does but for safety)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='created_by') THEN
        ALTER TABLE public.tasks ADD COLUMN created_by uuid REFERENCES public.profiles(id);
    END IF;
END $$;

-- 3. Add index for faster queries if not exists
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON public.tasks(created_at DESC);
