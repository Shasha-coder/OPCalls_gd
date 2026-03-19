-- Add capabilities column to agents table
ALTER TABLE agents ADD COLUMN IF NOT EXISTS capabilities TEXT[] DEFAULT ARRAY['inbound', 'outbound', 'sms']::TEXT[];
