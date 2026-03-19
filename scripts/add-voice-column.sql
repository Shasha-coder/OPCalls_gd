-- Add voice column to agents table
ALTER TABLE agents ADD COLUMN IF NOT EXISTS voice TEXT DEFAULT 'professional';
ALTER TABLE agents ADD COLUMN IF NOT EXISTS knowledge_base TEXT;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS max_call_duration INTEGER DEFAULT 30;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS conversion_rate DECIMAL(5,2) DEFAULT 0;
