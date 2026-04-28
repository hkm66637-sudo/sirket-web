-- Migration: Create corporate_orders workflow schema safely
CREATE TABLE IF NOT EXISTS corporate_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid,
  order_number text NOT NULL,
  customer_name text NOT NULL,
  customer_company text,
  phone text,
  email text,
  tax_office text,
  tax_number text,
  delivery_address text,
  invoice_address text,
  order_type text CHECK (order_type IN ('promosyon', 'toptan', 'ozel_uretim')),
  current_stage text DEFAULT 'pazarlama' CHECK (current_stage IN ('pazarlama', 'grafiker', 'muhasebe', 'uretim', 'depo', 'tamamlandi')),
  status text DEFAULT 'Yeni',
  responsible_role text,
  assigned_user_id uuid,
  total_amount numeric DEFAULT 0,
  currency text DEFAULT 'TRY',
  vat_rate numeric DEFAULT 20,
  deadline_date date,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS corporate_order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES corporate_orders(id) ON DELETE CASCADE,
  product_id uuid,
  product_name text NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  price numeric NOT NULL DEFAULT 0,
  total numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS corporate_order_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES corporate_orders(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_url text NOT NULL,
  uploaded_by uuid,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS corporate_order_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES corporate_orders(id) ON DELETE CASCADE,
  old_status text,
  new_status text,
  old_stage text,
  new_stage text,
  note text,
  changed_by uuid,
  changed_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS corporate_order_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES corporate_orders(id) ON DELETE CASCADE,
  comment text NOT NULL,
  created_by uuid,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS corporate_order_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES corporate_orders(id) ON DELETE CASCADE,
  amount numeric NOT NULL CHECK (amount >= 0),
  payment_date date DEFAULT current_date,
  payment_method text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS corporate_order_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  order_id uuid REFERENCES corporate_orders(id) ON DELETE CASCADE,
  message text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- RLS ENABLING
ALTER TABLE corporate_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE corporate_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE corporate_order_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE corporate_order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE corporate_order_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE corporate_order_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE corporate_order_notifications ENABLE ROW LEVEL SECURITY;

-- SAFE RLS POLICIES FOR corporate_orders
CREATE POLICY admin_all ON corporate_orders FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('super_admin', 'admin')));

CREATE POLICY marketing_manage ON corporate_orders FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'pazarlama_muduru'));

CREATE POLICY graphic_read_update ON corporate_orders FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'grafiker' AND current_stage = 'grafiker'));

CREATE POLICY accounting_read_update ON corporate_orders FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'muhasebe_muduru' AND current_stage = 'muhasebe'));

CREATE POLICY production_read_update ON corporate_orders FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'uretim_muduru' AND current_stage = 'uretim'));

CREATE POLICY warehouse_read_update ON corporate_orders FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'depo_muduru' AND current_stage = 'depo'));

-- SUB TABLES ALL ACCESS FALLBACK FOR SIMPLICITY OR LINKED ACCESS
CREATE POLICY linked_items ON corporate_order_items FOR ALL USING (true);
CREATE POLICY linked_files ON corporate_order_files FOR ALL USING (true);
CREATE POLICY linked_history ON corporate_order_status_history FOR ALL USING (true);
CREATE POLICY linked_comments ON corporate_order_comments FOR ALL USING (true);
CREATE POLICY linked_payments ON corporate_order_payments FOR ALL USING (true);
CREATE POLICY linked_notifications ON corporate_order_notifications FOR ALL USING (true);
