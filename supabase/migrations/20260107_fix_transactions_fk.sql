-- Fix transactions_v2 foreign key to point to assets table instead of assets_v2
-- This resolves the "Could not find a relationship" error when joining transactions_v2 with assets

DO $$
BEGIN
    -- Delete orphaned transactions that reference non-existent assets (or assets not in the new table)
    -- This prevents the ADD CONSTRAINT from failing
    DELETE FROM transactions_v2 WHERE asset_id NOT IN (SELECT id FROM assets);

    -- Try to drop the constraint if it exists (standard naming convention)
    -- We check for both likely names just in case
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'transactions_v2_asset_id_fkey') THEN
        ALTER TABLE transactions_v2 DROP CONSTRAINT transactions_v2_asset_id_fkey;
    END IF;
    
    -- Also check for auto-generated name if different
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'transactions_v2_asset_id_fkey1') THEN
        ALTER TABLE transactions_v2 DROP CONSTRAINT transactions_v2_asset_id_fkey1;
    END IF;

    -- Add the new constraint
    ALTER TABLE transactions_v2 
        ADD CONSTRAINT transactions_v2_asset_id_fkey 
        FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE;

END $$;
