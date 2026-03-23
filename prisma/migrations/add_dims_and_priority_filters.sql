-- DIM System & Priority Engine tables
-- Run this in the Supabase SQL Editor

-- Enums
DO $$ BEGIN
  CREATE TYPE "DimCategory" AS ENUM ('DECISION', 'IDEA', 'MICRO_TASK');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "DimStatus" AS ENUM ('OPEN', 'COMPLETED', 'DEFERRED', 'DELEGATED', 'DELETED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "DimRecommendation" AS ENUM ('DO', 'DEFER', 'DELEGATE', 'DELETE');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- DIMs table
CREATE TABLE IF NOT EXISTS "dims" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "user_id" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "category" "DimCategory" NOT NULL DEFAULT 'IDEA',
  "status" "DimStatus" NOT NULL DEFAULT 'OPEN',
  "priority_score" INTEGER,
  "recommendation" "DimRecommendation",
  "ai_reasoning" TEXT,
  "source" TEXT NOT NULL DEFAULT 'manual',
  "related_goal_id" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completed_at" TIMESTAMP(3),
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "dims_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "dims_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "dims_related_goal_id_fkey" FOREIGN KEY ("related_goal_id") REFERENCES "goals"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- Priority Filters table
CREATE TABLE IF NOT EXISTS "priority_filters" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "user_id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "weight" INTEGER NOT NULL DEFAULT 5,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "priority_filters_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "priority_filters_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS "dims_user_id_status_idx" ON "dims"("user_id", "status");
CREATE INDEX IF NOT EXISTS "dims_user_id_created_at_idx" ON "dims"("user_id", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "priority_filters_user_id_idx" ON "priority_filters"("user_id");
