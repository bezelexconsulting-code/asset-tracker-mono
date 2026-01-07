-- Add specialization column if missing (caused schema cache error)
ALTER TABLE technicians ADD COLUMN IF NOT EXISTS specialization TEXT;

-- Ensure auth columns exist (referenced in SuperTechs)
ALTER TABLE technicians ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE technicians ADD COLUMN IF NOT EXISTS password TEXT;
ALTER TABLE technicians ADD COLUMN IF NOT EXISTS hashed_password TEXT;
ALTER TABLE technicians ADD COLUMN IF NOT EXISTS must_reset_password BOOLEAN DEFAULT true;
