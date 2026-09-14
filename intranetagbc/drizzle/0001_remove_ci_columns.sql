-- Migración segura para remover las columnas ci y national_id
ALTER TABLE "personal" DROP COLUMN IF EXISTS "ci";
ALTER TABLE "users" DROP COLUMN IF EXISTS "national_id";
DROP INDEX IF EXISTS "users_national_id_unique";
