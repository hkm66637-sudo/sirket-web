-- 1. Create partners table
CREATE TABLE IF NOT EXISTS public.partners (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 2. Create partner_transactions table
CREATE TABLE IF NOT EXISTS public.partner_transactions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_id uuid REFERENCES public.partners(id) ON DELETE CASCADE,
    amount decimal(15,2) NOT NULL DEFAULT 0,
    type text NOT NULL CHECK (type IN ('deposit', 'withdrawal')), -- deposit: Partner -> Company, withdrawal: Company -> Partner
    date date NOT NULL DEFAULT CURRENT_DATE,
    bank_id uuid REFERENCES public.banks(id) ON DELETE SET NULL,
    description text,
    document_url text,
    status text DEFAULT 'Bekliyor',
    company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
    created_by uuid REFERENCES auth.users(id),
    finance_record_id uuid REFERENCES public.finance_records(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 3. Enable RLS
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_transactions ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for Partners
DROP POLICY IF EXISTS "Partners visibility" ON public.partners;
CREATE POLICY "Partners visibility" ON public.partners
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND (profiles.role IN ('super_admin', 'admin', 'muhasebe_muduru', 'finans'))
        )
    );

-- 5. RLS Policies for Partner Transactions
DROP POLICY IF EXISTS "Partner transactions visibility" ON public.partner_transactions;
CREATE POLICY "Partner transactions visibility" ON public.partner_transactions
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND (profiles.role IN ('super_admin', 'admin', 'muhasebe_muduru', 'finans'))
        )
    );

-- 6. Insert initial partners (optional, but requested names)
-- Since companies might not exist yet in a generic way, we'll let the user add them or add a default script.
-- But the user mentioned specific names.

-- 7. Add partner_id to finance_records for future linking if needed
ALTER TABLE public.finance_records ADD COLUMN IF NOT EXISTS partner_id uuid REFERENCES public.partners(id) ON DELETE SET NULL;

-- 8. Trigger for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_partners_updated_at
    BEFORE UPDATE ON public.partners
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_partner_transactions_updated_at
    BEFORE UPDATE ON public.partner_transactions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
