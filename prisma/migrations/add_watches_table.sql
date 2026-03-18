-- Add WatchType enum and watches table
-- Run this against your Supabase database (SQL Editor)

DO $$ BEGIN
  CREATE TYPE "WatchType" AS ENUM ('FIRST_WATCH', 'NIGHT_WATCH');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "watches" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "date" DATE NOT NULL,
  "type" "WatchType" NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'draft',
  "sections" JSONB NOT NULL,
  "ai_draft" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "watches_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "watches_user_id_date_type_key" ON "watches"("user_id", "date", "type");

DO $$ BEGIN
  ALTER TABLE "watches" ADD CONSTRAINT "watches_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
