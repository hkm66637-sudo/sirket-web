-- ==========================================
-- 1. PRODUCTS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.products (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    sku text NOT NULL,
    name text NOT NULL,
    default_machine_id uuid,
    average_duration_minutes integer DEFAULT 60,
    created_at timestamptz DEFAULT now(),
    UNIQUE(company_id, sku)
);

-- ==========================================
-- 2. RAW MATERIALS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.raw_materials (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name text NOT NULL,
    unit text NOT NULL DEFAULT 'adet', -- adet, kg, m, vb.
    current_stock numeric DEFAULT 0,
    reserved_stock numeric DEFAULT 0,
    minimum_stock numeric DEFAULT 0,
    critical_stock numeric DEFAULT 0,
    supplier_name text,
    lead_time_days integer DEFAULT 3,
    created_at timestamptz DEFAULT now()
);

-- ==========================================
-- 3. MACHINES TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.machines (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name text NOT NULL,
    code text NOT NULL,
    capacity_units_per_hour numeric DEFAULT 10,
    status text DEFAULT 'active', -- active, maintenance, broken
    last_maintenance_date date,
    description text,
    created_at timestamptz DEFAULT now(),
    UNIQUE(company_id, code)
);

-- Update products references
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_default_machine_id_fkey;
ALTER TABLE public.products ADD CONSTRAINT products_default_machine_id_fkey FOREIGN KEY (default_machine_id) REFERENCES public.machines(id) ON DELETE SET NULL;

-- ==========================================
-- 4. PRODUCT RECIPES TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.product_recipes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    raw_material_id uuid NOT NULL REFERENCES public.raw_materials(id) ON DELETE CASCADE,
    quantity_per_unit numeric NOT NULL DEFAULT 1,
    fire_rate_percent numeric DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    UNIQUE(product_id, raw_material_id)
);

-- ==========================================
-- 5. PRODUCTION ORDERS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.production_orders (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    order_no text NOT NULL,
    customer_name text NOT NULL,
    product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    quantity integer NOT NULL DEFAULT 1,
    target_date date NOT NULL,
    status text DEFAULT 'bekliyor', -- bekliyor, üretime_alındı, üretimde, tamamlandı, muhasebe_onayı, ödeme_alındı, sevkiyata_hazır, sevk_edildi, iptal
    priority text DEFAULT 'normal', -- normal, acil, cok_acil
    machine_id uuid REFERENCES public.machines(id) ON DELETE SET NULL,
    assigned_person_id uuid,
    estimated_duration_minutes integer,
    actual_duration_minutes integer,
    notes text,
    created_at timestamptz DEFAULT now(),
    UNIQUE(company_id, order_no)
);

-- ==========================================
-- 6. RAW MATERIAL MOVEMENTS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.raw_material_movements (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    raw_material_id uuid NOT NULL REFERENCES public.raw_materials(id) ON DELETE CASCADE,
    order_id uuid REFERENCES public.production_orders(id) ON DELETE SET NULL,
    type text NOT NULL, -- entry, reserve, consumption, fire, correction
    quantity numeric NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- ==========================================
-- 7. PURCHASE REQUESTS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.purchase_requests (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    raw_material_id uuid NOT NULL REFERENCES public.raw_materials(id) ON DELETE CASCADE,
    quantity_needed numeric NOT NULL,
    supplier_name text,
    status text DEFAULT 'pending', -- pending, approved, ordered, received
    created_at timestamptz DEFAULT now()
);

-- ==========================================
-- 8. PRODUCTION LOGS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.production_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id uuid NOT NULL REFERENCES public.production_orders(id) ON DELETE CASCADE,
    status_from text,
    status_to text NOT NULL,
    message text,
    created_at timestamptz DEFAULT now()
);

-- ==========================================
-- 9. PRODUCTION NOTIFICATIONS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.production_notifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    message text NOT NULL,
    read boolean DEFAULT false,
    type text DEFAULT 'info', -- info, warning, error, success
    created_at timestamptz DEFAULT now()
);

-- ==========================================
-- RLS CONFIGURATIONS
-- ==========================================
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.raw_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.machines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.raw_material_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_notifications ENABLE ROW LEVEL SECURITY;

-- Dynamic Policy: Global view by auth, filter per frontend.
CREATE POLICY "Auth access for products" ON public.products FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Auth access for raw_materials" ON public.raw_materials FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Auth access for machines" ON public.machines FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Auth access for product_recipes" ON public.product_recipes FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Auth access for production_orders" ON public.production_orders FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Auth access for movements" ON public.raw_material_movements FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Auth access for requests" ON public.purchase_requests FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Auth access for logs" ON public.production_logs FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Auth access for notifications" ON public.production_notifications FOR ALL USING (auth.role() = 'authenticated');
