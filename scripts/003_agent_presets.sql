-- ============================================================
-- AGENT PRESETS - Templates for quick agent deployment
-- Run this in Supabase SQL Editor after the main schema
-- ============================================================

-- Agent Presets Table (admin-managed templates shown on landing page)
CREATE TABLE IF NOT EXISTS agent_presets (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Display Info
  name                  TEXT NOT NULL,
  description           TEXT NOT NULL,
  icon                  TEXT NOT NULL DEFAULT 'phone',  -- Icon name for UI
  color                 TEXT NOT NULL DEFAULT '#3366FF', -- Accent color
  industry              industry_type NOT NULL DEFAULT 'other',
  
  -- Agent Configuration (used as template when creating agent)
  agent_type            agent_type NOT NULL,
  default_prompt        TEXT,
  default_voice_id      TEXT,
  default_languages     TEXT[] NOT NULL DEFAULT ARRAY['en'],
  
  -- Categorization
  category              TEXT NOT NULL DEFAULT 'general', -- 'sales', 'support', 'booking', 'followup', 'industry'
  tags                  TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  -- Display order and visibility
  sort_order            INTEGER NOT NULL DEFAULT 0,
  is_featured           BOOLEAN NOT NULL DEFAULT false,
  is_active             BOOLEAN NOT NULL DEFAULT true,
  
  -- Stats (for social proof)
  times_used            INTEGER NOT NULL DEFAULT 0,
  
  -- Metadata
  created_by            UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_presets_active ON agent_presets(is_active, sort_order);
CREATE INDEX IF NOT EXISTS idx_presets_category ON agent_presets(category, is_active);
CREATE INDEX IF NOT EXISTS idx_presets_industry ON agent_presets(industry, is_active);
CREATE INDEX IF NOT EXISTS idx_presets_featured ON agent_presets(is_featured, is_active);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS trg_agent_presets_updated_at ON agent_presets;
CREATE TRIGGER trg_agent_presets_updated_at 
  BEFORE UPDATE ON agent_presets 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- SEED DATA - Initial presets
-- ============================================================

INSERT INTO agent_presets (name, description, icon, color, industry, agent_type, category, tags, sort_order, is_featured) VALUES
-- Sales & Lead Gen
('Sales Closer', 'Convert leads into paying customers with persuasive AI conversations', 'target', '#EF4444', 'other', 'support', 'sales', ARRAY['sales', 'conversion', 'closing'], 1, true),
('Lead Qualifier', 'Pre-qualify leads automatically before routing to your sales team', 'filter', '#F59E0B', 'other', 'support', 'sales', ARRAY['lead-gen', 'qualification'], 2, true),
('Follow-up Agent', 'Never lose a lead with intelligent follow-up sequences', 'repeat', '#8B5CF6', 'other', 'followup', 'followup', ARRAY['followup', 'nurturing'], 3, true),

-- Industry Specific
('Real Estate Agent', 'Handle property inquiries, schedule viewings, and qualify buyers', 'home', '#10B981', 'realty', 'receptionist', 'industry', ARRAY['real-estate', 'property'], 4, true),
('HVAC Dispatcher', 'Book service appointments and handle emergency calls 24/7', 'thermometer', '#3B82F6', 'hvac', 'booking', 'industry', ARRAY['hvac', 'service'], 5, true),
('Dental Receptionist', 'Schedule appointments and answer patient questions', 'smile', '#EC4899', 'dental', 'receptionist', 'industry', ARRAY['dental', 'healthcare'], 6, false),
('Medical Intake', 'Collect patient information and schedule consultations', 'heart-pulse', '#06B6D4', 'clinic', 'receptionist', 'industry', ARRAY['medical', 'intake'], 7, false),
('Legal Intake', 'Screen potential clients and book consultations', 'scale', '#6366F1', 'legal', 'receptionist', 'industry', ARRAY['legal', 'intake'], 8, false),

-- Support & Service
('Customer Support', 'Handle inquiries, resolve issues, and escalate when needed', 'headphones', '#14B8A6', 'other', 'support', 'support', ARRAY['support', 'service'], 9, true),
('After Hours Agent', 'Ensure no call goes unanswered outside business hours', 'moon', '#6366F1', 'other', 'afterhours', 'support', ARRAY['after-hours', '24/7'], 10, false),

-- Booking & Scheduling
('Appointment Booker', 'Seamlessly schedule appointments with calendar integration', 'calendar', '#F97316', 'other', 'booking', 'booking', ARRAY['booking', 'calendar'], 11, true),
('Missed Call Recovery', 'Automatically call back missed calls and convert them', 'phone-missed', '#EF4444', 'other', 'missed_call', 'followup', ARRAY['missed-call', 'recovery'], 12, false);

-- ============================================================
-- RLS POLICIES
-- ============================================================

-- Enable RLS
ALTER TABLE agent_presets ENABLE ROW LEVEL SECURITY;

-- Public read access for active presets (for landing page)
CREATE POLICY "Public can view active presets" ON agent_presets
  FOR SELECT USING (is_active = true);

-- Platform admins can manage presets
CREATE POLICY "Admins can manage presets" ON agent_presets
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  );

-- ============================================================
-- DEMO CALL TRACKING UPDATE
-- ============================================================

-- Add preset_id to demo_calls for conversion tracking
ALTER TABLE demo_calls ADD COLUMN IF NOT EXISTS preset_id UUID REFERENCES agent_presets(id) ON DELETE SET NULL;

-- Function to increment preset usage when agent is created from preset
CREATE OR REPLACE FUNCTION increment_preset_usage()
RETURNS TRIGGER AS $$
BEGIN
  -- If agent was created from a preset, increment the usage counter
  IF NEW.metadata ? 'preset_id' THEN
    UPDATE agent_presets 
    SET times_used = times_used + 1 
    WHERE id = (NEW.metadata->>'preset_id')::UUID;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to track preset usage
DROP TRIGGER IF EXISTS trg_track_preset_usage ON agents;
CREATE TRIGGER trg_track_preset_usage 
  AFTER INSERT ON agents 
  FOR EACH ROW EXECUTE FUNCTION increment_preset_usage();
