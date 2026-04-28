-- Migration: Extend corporate_order_notifications with granular targeting
ALTER TABLE corporate_order_notifications
ADD COLUMN IF NOT EXISTS title text,
ADD COLUMN IF NOT EXISTS target_role text,
ADD COLUMN IF NOT EXISTS target_user_id uuid;
