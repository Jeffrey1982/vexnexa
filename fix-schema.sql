-- Add missing teamInvitations column to User table
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "teamInvitations" BOOLEAN NOT NULL DEFAULT true;