-- Migration: Simplify RLS policies for corporate_orders to prevent timeout hangs
DROP POLICY IF EXISTS admin_all ON corporate_orders;
DROP POLICY IF EXISTS marketing_manage ON corporate_orders;
DROP POLICY IF EXISTS graphic_read_update ON corporate_orders;
DROP POLICY IF EXISTS accounting_read_update ON corporate_orders;
DROP POLICY IF EXISTS production_read_update ON corporate_orders;
DROP POLICY IF EXISTS warehouse_read_update ON corporate_orders;

-- Allow all authenticated users to read records
CREATE POLICY auth_select ON corporate_orders FOR SELECT TO authenticated USING (true);

-- Allow all authenticated users to insert records
CREATE POLICY auth_insert ON corporate_orders FOR INSERT TO authenticated WITH CHECK (true);

-- Allow all authenticated users to update records
CREATE POLICY auth_update ON corporate_orders FOR UPDATE TO authenticated USING (true);
