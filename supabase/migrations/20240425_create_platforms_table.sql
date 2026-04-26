-- Create platforms table
CREATE TABLE IF NOT EXISTS public.platforms (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL UNIQUE,
    status text DEFAULT 'active',
    created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.platforms ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Public platforms are viewable by everyone" ON public.platforms;
CREATE POLICY "Public platforms are viewable by everyone" ON public.platforms
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage platforms" ON public.platforms;
CREATE POLICY "Admins can manage platforms" ON public.platforms
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('super_admin', 'admin', 'muhasebe_muduru')
        )
    );

-- Insert initial platforms
INSERT INTO public.platforms (name)
VALUES ('Trendyol'), ('Amazon'), ('Shopify'), ('Hepsiburada'), ('n11'), ('Diğer')
ON CONFLICT (name) DO NOTHING;

-- Add platform_id to finance_records if it doesn't exist
ALTER TABLE public.finance_records ADD COLUMN IF NOT EXISTS platform_id uuid REFERENCES public.platforms(id) ON DELETE SET NULL;
