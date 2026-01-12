-- Safely drop deprecated feature tables: flags, feature_flags, tickets
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'flags') THEN
    DROP TABLE flags;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'feature_flags') THEN
    DROP TABLE feature_flags;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tickets') THEN
    DROP TABLE tickets;
  END IF;
EXCEPTION WHEN others THEN
  -- ignore
  NULL;
END $$;

