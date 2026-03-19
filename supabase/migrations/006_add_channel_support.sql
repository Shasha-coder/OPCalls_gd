-- ============================================================
-- Add channel column to agents table
-- This separates communication channel from agent role/type
-- ============================================================

-- Create channel enum if it doesn't exist
DO $$ BEGIN
  CREATE TYPE agent_channel AS ENUM ('inbound', 'outbound', 'sms');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add channel column to agents table (if not exists)
DO $$ BEGIN
  ALTER TABLE agents ADD COLUMN channel agent_channel NOT NULL DEFAULT 'inbound';
EXCEPTION
  WHEN duplicate_column THEN null;
END $$;

-- Add 'sms' to call_direction enum if not already there
DO $$ BEGIN
  ALTER TYPE call_direction ADD VALUE IF NOT EXISTS 'sms';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create sms_messages table for SMS conversations
CREATE TABLE IF NOT EXISTS sms_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  phone_number_id UUID REFERENCES phone_numbers(id) ON DELETE SET NULL,
  
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  from_number TEXT NOT NULL,
  to_number TEXT NOT NULL,
  body TEXT NOT NULL,
  
  -- Twilio metadata
  twilio_sid TEXT UNIQUE,
  status TEXT DEFAULT 'sent',
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_sms_messages_org ON sms_messages(org_id);
CREATE INDEX IF NOT EXISTS idx_sms_messages_agent ON sms_messages(agent_id);
CREATE INDEX IF NOT EXISTS idx_sms_messages_created ON sms_messages(created_at DESC);

-- RLS for sms_messages
ALTER TABLE sms_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Users can view their org's SMS messages"
  ON sms_messages FOR SELECT
  USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));
