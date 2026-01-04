-- Migration: Add locale support to BlogPost table
-- Run this SQL against your database

-- Step 1: Add locale column with default value
ALTER TABLE "BlogPost" ADD COLUMN "locale" TEXT NOT NULL DEFAULT 'en';

-- Step 2: Drop the existing unique constraint on slug
ALTER TABLE "BlogPost" DROP CONSTRAINT IF EXISTS "BlogPost_slug_key";

-- Step 3: Add new unique constraint on (slug, locale)
ALTER TABLE "BlogPost" ADD CONSTRAINT "BlogPost_slug_locale_key" UNIQUE ("slug", "locale");

-- Step 4: Add index on locale for better query performance
CREATE INDEX "BlogPost_locale_idx" ON "BlogPost"("locale");

-- Step 5: Update existing blog posts to have language suffix in slug
-- This will update English posts to have -en suffix
-- You can modify this based on your existing data
UPDATE "BlogPost"
SET "slug" = "slug" || '-en',
    "locale" = 'en'
WHERE "locale" = 'en';

COMMENT ON COLUMN "BlogPost"."locale" IS 'Supported locales: en, nl, fr, es, pt';
