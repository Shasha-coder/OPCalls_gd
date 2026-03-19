-- Update agent_type to include SMS capability
-- Run this in Supabase SQL Editor

-- Drop the old enum and create a new one
DROP TYPE IF EXISTS public.agent_type CASCADE;
CREATE TYPE public.agent_type AS ENUM ('inbound', 'outbound', 'sms', 'receptionist', 'booking', 'followup', 'support', 'afterhours', 'missed_call');

-- Update agents table if type column exists
ALTER TABLE agents ALTER COLUMN type TYPE public.agent_type;

-- Update call_direction to support SMS
DROP TYPE IF EXISTS public.call_direction CASCADE;
CREATE TYPE public.call_direction AS ENUM ('inbound', 'outbound', 'sms');

-- Update calls table if direction column exists
ALTER TABLE calls ALTER COLUMN direction TYPE public.call_direction;
