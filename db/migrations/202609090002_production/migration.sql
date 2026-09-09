CREATE TABLE "RateLimit" (
  "id" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "count" INTEGER NOT NULL,
  "lastRequest" BIGINT NOT NULL,
  CONSTRAINT "RateLimit_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "RateLimit_key_key" ON "RateLimit"("key");
CREATE INDEX "RateLimit_lastRequest_idx" ON "RateLimit"("lastRequest");

-- Supabase: o schema privado é inacessível por PUBLIC, anon e authenticated.
-- Não modifica schemas de aplicações vizinhas nem o schema public de desenvolvimento.
DO $$
DECLARE role_name text;
BEGIN
  IF current_schema() = 'colorimetry' THEN
    REVOKE ALL ON SCHEMA colorimetry FROM PUBLIC;
    REVOKE ALL ON ALL TABLES IN SCHEMA colorimetry FROM PUBLIC;
    REVOKE ALL ON ALL SEQUENCES IN SCHEMA colorimetry FROM PUBLIC;
    ALTER DEFAULT PRIVILEGES IN SCHEMA colorimetry REVOKE ALL ON TABLES FROM PUBLIC;
    ALTER DEFAULT PRIVILEGES IN SCHEMA colorimetry REVOKE ALL ON SEQUENCES FROM PUBLIC;
    FOREACH role_name IN ARRAY ARRAY['anon', 'authenticated'] LOOP
      IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = role_name) THEN
        EXECUTE format('REVOKE ALL ON SCHEMA colorimetry FROM %I', role_name);
        EXECUTE format('REVOKE ALL ON ALL TABLES IN SCHEMA colorimetry FROM %I', role_name);
        EXECUTE format('REVOKE ALL ON ALL SEQUENCES IN SCHEMA colorimetry FROM %I', role_name);
        EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA colorimetry REVOKE ALL ON TABLES FROM %I', role_name);
        EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA colorimetry REVOKE ALL ON SEQUENCES FROM %I', role_name);
      END IF;
    END LOOP;
  END IF;
END $$;
