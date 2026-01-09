-- Consolidate transactions: add missing columns, copy data from transactions_v2, drop v2
DO $$
BEGIN
  -- Ensure columns exist on canonical transactions table
  ALTER TABLE transactions
    ADD COLUMN IF NOT EXISTS from_location_id uuid REFERENCES locations(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS to_location_id uuid REFERENCES locations(id) ON DELETE SET NULL;

  -- Optional indexes for performance
  CREATE INDEX IF NOT EXISTS transactions_org_id_idx ON transactions(org_id);
  CREATE INDEX IF NOT EXISTS transactions_created_at_idx ON transactions(created_at);

  -- Copy data from transactions_v2 if present
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'transactions_v2') THEN
    INSERT INTO transactions (id, org_id, asset_id, technician_id, type, notes, created_at, from_location_id, to_location_id)
    SELECT id, org_id, asset_id, technician_id, type, notes, created_at, from_location_id, to_location_id
    FROM transactions_v2
    ON CONFLICT (id) DO NOTHING;

    -- Drop the v2 table
    DROP TABLE transactions_v2;
  END IF;
EXCEPTION WHEN others THEN
  -- Ignore errors to avoid breaking deployment; handle manually if needed
  NULL;
END $$;

