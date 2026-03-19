-- Create phone_numbers table
CREATE TABLE IF NOT EXISTS phone_numbers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  number TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'US',
  status TEXT NOT NULL DEFAULT 'pending_agent' CHECK (status IN ('active', 'pending_agent', 'inactive')),
  agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  monthly_cost DECIMAL(10, 2) NOT NULL DEFAULT 5.00,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_phone_numbers_org_id ON phone_numbers(org_id);
CREATE INDEX IF NOT EXISTS idx_phone_numbers_agent_id ON phone_numbers(agent_id);

-- Enable RLS
ALTER TABLE phone_numbers ENABLE ROW LEVEL SECURITY;

-- Create RLS policy (users can only see their org's phone numbers)
CREATE POLICY "Users can view their organization's phone numbers"
  ON phone_numbers
  FOR ALL
  USING (
    org_id IN (
      SELECT org_id FROM profiles WHERE id = auth.uid()
    )
  );
