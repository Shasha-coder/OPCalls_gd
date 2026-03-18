-- ============================================================================
-- OPCALLS PHASE 2: BILLING SCHEMA
-- Complete billing, subscription, and entitlement system
-- ============================================================================

-- ============================================================================
-- 1. PLANS TABLE
-- Defines pricing tiers and included limits
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL, -- 'starter', 'core', 'scale', 'enterprise'
  name TEXT NOT NULL,
  description TEXT,
  
  -- Pricing
  monthly_price_cents INTEGER NOT NULL DEFAULT 0,
  annual_price_cents INTEGER, -- Optional annual pricing
  stripe_price_id_monthly TEXT, -- Stripe price ID for monthly
  stripe_price_id_annual TEXT, -- Stripe price ID for annual
  
  -- Included limits
  included_minutes INTEGER NOT NULL DEFAULT 0,
  included_numbers INTEGER NOT NULL DEFAULT 1,
  included_sms INTEGER NOT NULL DEFAULT 0,
  included_agents INTEGER NOT NULL DEFAULT 1,
  
  -- Overage pricing (in cents)
  overage_voice_per_minute_cents INTEGER NOT NULL DEFAULT 10, -- $0.10/min
  overage_sms_per_unit_cents INTEGER NOT NULL DEFAULT 2, -- $0.02/sms
  
  -- Limits and controls
  max_concurrent_calls INTEGER NOT NULL DEFAULT 1,
  max_active_numbers INTEGER NOT NULL DEFAULT 1,
  max_monthly_test_calls INTEGER NOT NULL DEFAULT 10,
  api_requests_per_minute INTEGER NOT NULL DEFAULT 60,
  
  -- Features (JSON for flexibility)
  features JSONB NOT NULL DEFAULT '{}'::JSONB,
  
  -- Metadata
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_public BOOLEAN NOT NULL DEFAULT true, -- Show on pricing page
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS plans_slug_idx ON public.plans(slug);
CREATE INDEX IF NOT EXISTS plans_active_idx ON public.plans(is_active);

-- ============================================================================
-- 2. SUBSCRIPTIONS TABLE
-- Stores Stripe subscription linkage and billing status
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.plans(id),
  
  -- Stripe references
  stripe_customer_id TEXT NOT NULL,
  stripe_subscription_id TEXT UNIQUE,
  stripe_price_id TEXT,
  
  -- Billing status (the source of truth)
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft',           -- Initial state before payment
    'trialing',        -- In trial period
    'active',          -- Paid and active
    'past_due',        -- Payment failed, grace period
    'restricted',      -- Past grace, limited functionality
    'suspended',       -- Fully suspended
    'canceled',        -- Subscription ended
    'incomplete',      -- Stripe checkout incomplete
    'incomplete_expired' -- Checkout expired
  )),
  
  -- Billing cycle
  billing_interval TEXT NOT NULL DEFAULT 'month' CHECK (billing_interval IN ('month', 'year')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  
  -- Trial info
  trial_start TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  
  -- Cancellation
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  canceled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  
  -- Grace period tracking
  grace_period_start TIMESTAMPTZ,
  grace_period_end TIMESTAMPTZ,
  
  -- Payment failure tracking
  last_payment_attempt TIMESTAMPTZ,
  payment_failure_count INTEGER NOT NULL DEFAULT 0,
  last_payment_error TEXT,
  
  -- Metadata
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for subscriptions
CREATE INDEX IF NOT EXISTS subscriptions_org_id_idx ON public.subscriptions(org_id);
CREATE INDEX IF NOT EXISTS subscriptions_status_idx ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS subscriptions_stripe_customer_idx ON public.subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS subscriptions_stripe_sub_idx ON public.subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS subscriptions_grace_end_idx ON public.subscriptions(grace_period_end) WHERE status = 'past_due';

-- ============================================================================
-- 3. ENTITLEMENTS TABLE
-- Current service permissions derived from subscription state
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.entitlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID UNIQUE NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  -- Service access flags
  can_receive_calls BOOLEAN NOT NULL DEFAULT false,
  can_make_calls BOOLEAN NOT NULL DEFAULT false,
  can_send_sms BOOLEAN NOT NULL DEFAULT false,
  can_edit_settings BOOLEAN NOT NULL DEFAULT true,
  can_add_numbers BOOLEAN NOT NULL DEFAULT false,
  can_create_agents BOOLEAN NOT NULL DEFAULT false,
  can_access_analytics BOOLEAN NOT NULL DEFAULT true,
  can_access_api BOOLEAN NOT NULL DEFAULT false,
  
  -- Limits (copied from plan for quick access)
  max_minutes INTEGER NOT NULL DEFAULT 0,
  max_numbers INTEGER NOT NULL DEFAULT 1,
  max_agents INTEGER NOT NULL DEFAULT 1,
  max_concurrent_calls INTEGER NOT NULL DEFAULT 1,
  
  -- Spend controls
  soft_spend_limit_cents INTEGER, -- Warning threshold
  hard_spend_limit_cents INTEGER, -- Block threshold
  current_month_spend_cents INTEGER NOT NULL DEFAULT 0,
  
  -- Restriction info
  restriction_reason TEXT,
  restricted_at TIMESTAMPTZ,
  suspended_at TIMESTAMPTZ,
  
  -- Admin override
  admin_override BOOLEAN NOT NULL DEFAULT false,
  admin_override_reason TEXT,
  admin_override_by UUID,
  admin_override_at TIMESTAMPTZ,
  
  -- Metadata
  last_recalculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for entitlements
CREATE INDEX IF NOT EXISTS entitlements_org_id_idx ON public.entitlements(org_id);

-- ============================================================================
-- 4. BILLING_EVENTS TABLE
-- Audit log of all billing-related events
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.billing_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  
  -- Event details
  event_type TEXT NOT NULL, -- 'subscription.created', 'payment.failed', etc.
  event_source TEXT NOT NULL DEFAULT 'stripe', -- 'stripe', 'system', 'admin'
  
  -- Stripe reference
  stripe_event_id TEXT,
  stripe_invoice_id TEXT,
  stripe_payment_intent_id TEXT,
  
  -- State transition
  previous_status TEXT,
  new_status TEXT,
  
  -- Amount (if payment related)
  amount_cents INTEGER,
  currency TEXT DEFAULT 'usd',
  
  -- Details
  description TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  
  -- Processing
  processed BOOLEAN NOT NULL DEFAULT false,
  processed_at TIMESTAMPTZ,
  error_message TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for billing_events
CREATE INDEX IF NOT EXISTS billing_events_org_id_idx ON public.billing_events(org_id);
CREATE INDEX IF NOT EXISTS billing_events_stripe_event_idx ON public.billing_events(stripe_event_id);
CREATE INDEX IF NOT EXISTS billing_events_type_idx ON public.billing_events(event_type);
CREATE INDEX IF NOT EXISTS billing_events_created_idx ON public.billing_events(created_at DESC);

-- ============================================================================
-- 5. INVOICES TABLE
-- Normalized invoice records
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  
  -- Stripe references
  stripe_invoice_id TEXT UNIQUE NOT NULL,
  stripe_invoice_number TEXT,
  stripe_hosted_invoice_url TEXT,
  stripe_invoice_pdf TEXT,
  
  -- Invoice details
  status TEXT NOT NULL CHECK (status IN (
    'draft', 'open', 'paid', 'void', 'uncollectible'
  )),
  
  -- Amounts
  subtotal_cents INTEGER NOT NULL DEFAULT 0,
  tax_cents INTEGER NOT NULL DEFAULT 0,
  total_cents INTEGER NOT NULL DEFAULT 0,
  amount_paid_cents INTEGER NOT NULL DEFAULT 0,
  amount_due_cents INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'usd',
  
  -- Dates
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,
  due_date TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  
  -- Line items (stored as JSON for flexibility)
  line_items JSONB NOT NULL DEFAULT '[]'::JSONB,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for invoices
CREATE INDEX IF NOT EXISTS invoices_org_id_idx ON public.invoices(org_id);
CREATE INDEX IF NOT EXISTS invoices_stripe_idx ON public.invoices(stripe_invoice_id);
CREATE INDEX IF NOT EXISTS invoices_status_idx ON public.invoices(status);

-- ============================================================================
-- 6. USAGE_RECORDS TABLE
-- Track usage for metering and billing
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.usage_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  -- Usage period
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  -- Voice usage
  inbound_minutes INTEGER NOT NULL DEFAULT 0,
  outbound_minutes INTEGER NOT NULL DEFAULT 0,
  total_minutes INTEGER GENERATED ALWAYS AS (inbound_minutes + outbound_minutes) STORED,
  
  -- SMS usage
  sms_sent INTEGER NOT NULL DEFAULT 0,
  sms_received INTEGER NOT NULL DEFAULT 0,
  
  -- Call counts
  total_calls INTEGER NOT NULL DEFAULT 0,
  successful_calls INTEGER NOT NULL DEFAULT 0,
  failed_calls INTEGER NOT NULL DEFAULT 0,
  
  -- Costs (platform costs, not customer charges)
  twilio_cost_cents INTEGER NOT NULL DEFAULT 0,
  retell_cost_cents INTEGER NOT NULL DEFAULT 0,
  total_cost_cents INTEGER GENERATED ALWAYS AS (twilio_cost_cents + retell_cost_cents) STORED,
  
  -- Billed amounts
  billed_cents INTEGER NOT NULL DEFAULT 0,
  overage_cents INTEGER NOT NULL DEFAULT 0,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(org_id, period_start, period_end)
);

-- Indexes for usage_records
CREATE INDEX IF NOT EXISTS usage_records_org_period_idx ON public.usage_records(org_id, period_start DESC);

-- ============================================================================
-- 7. ERROR_CODES TABLE
-- Central error taxonomy
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.error_codes (
  code TEXT PRIMARY KEY,
  category TEXT NOT NULL CHECK (category IN (
    'billing', 'telephony', 'ai', 'auth', 'provisioning', 'internal'
  )),
  severity TEXT NOT NULL CHECK (severity IN (
    'info', 'warn', 'error', 'critical'
  )),
  message TEXT NOT NULL,
  description TEXT,
  retryable BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert standard error codes
INSERT INTO public.error_codes (code, category, severity, message, retryable) VALUES
  ('BILLING_PAYMENT_FAILED', 'billing', 'error', 'Payment failed', true),
  ('BILLING_SUBSCRIPTION_MISSING', 'billing', 'error', 'No active subscription found', false),
  ('BILLING_CARD_DECLINED', 'billing', 'error', 'Card was declined', true),
  ('BILLING_INSUFFICIENT_FUNDS', 'billing', 'error', 'Insufficient funds', true),
  ('BILLING_CARD_EXPIRED', 'billing', 'error', 'Card has expired', false),
  ('BILLING_INVOICE_NOT_FOUND', 'billing', 'error', 'Invoice not found', false),
  ('BILLING_CUSTOMER_NOT_FOUND', 'billing', 'error', 'Stripe customer not found', false),
  ('BILLING_WEBHOOK_INVALID', 'billing', 'error', 'Invalid webhook signature', false),
  ('BILLING_PLAN_NOT_FOUND', 'billing', 'error', 'Plan not found', false),
  ('BILLING_GRACE_EXPIRED', 'billing', 'warn', 'Grace period has expired', false),
  ('ENTITLEMENT_BLOCKED', 'billing', 'error', 'Action blocked by entitlements', false),
  ('ENTITLEMENT_LIMIT_REACHED', 'billing', 'warn', 'Usage limit reached', false),
  ('ENTITLEMENT_SPEND_LIMIT', 'billing', 'error', 'Spend limit exceeded', false)
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- 8. HEALTH_CHECKS TABLE
-- Store health check results
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.health_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  check_type TEXT NOT NULL CHECK (check_type IN (
    'provisioning', 'resume', 'nightly', 'manual', 'billing'
  )),
  status TEXT NOT NULL CHECK (status IN ('passed', 'failed', 'warning')),
  
  -- Check details
  checks_performed JSONB NOT NULL DEFAULT '[]'::JSONB,
  failed_checks JSONB NOT NULL DEFAULT '[]'::JSONB,
  
  -- Additional context
  details JSONB NOT NULL DEFAULT '{}'::JSONB,
  error_message TEXT,
  
  -- Who/what triggered it
  triggered_by TEXT, -- 'system', 'admin', 'webhook'
  triggered_by_user_id UUID,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for health_checks
CREATE INDEX IF NOT EXISTS health_checks_org_created_idx ON public.health_checks(org_id, created_at DESC);

-- ============================================================================
-- 9. NOTIFICATION_TEMPLATES TABLE
-- Email/SMS templates for billing notifications
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.notification_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('email', 'sms', 'in_app')),
  
  -- Template content
  subject TEXT, -- For email
  body TEXT NOT NULL,
  
  -- Variables this template expects
  variables JSONB NOT NULL DEFAULT '[]'::JSONB,
  
  -- Metadata
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert billing notification templates
INSERT INTO public.notification_templates (code, channel, subject, body, variables) VALUES
  ('payment_failed', 'email', 'Payment Failed - Action Required', 
   'Hi {{business_name}},\n\nWe were unable to process your payment of {{amount}}. Please update your payment method to avoid service interruption.\n\nYour service will remain active for {{grace_days}} days.\n\nUpdate payment: {{portal_url}}',
   '["business_name", "amount", "grace_days", "portal_url"]'::JSONB),
  
  ('grace_period_ending', 'email', 'Service Interruption Warning',
   'Hi {{business_name}},\n\nYour grace period ends in {{days_remaining}} days. Please update your payment method to avoid service restrictions.\n\nUpdate payment: {{portal_url}}',
   '["business_name", "days_remaining", "portal_url"]'::JSONB),
  
  ('service_suspended', 'email', 'Service Suspended',
   'Hi {{business_name}},\n\nYour OPCalls service has been suspended due to non-payment. Your AI agent is no longer handling calls.\n\nTo restore service, please update your payment method: {{portal_url}}',
   '["business_name", "portal_url"]'::JSONB),
  
  ('service_resumed', 'email', 'Service Restored',
   'Hi {{business_name}},\n\nGreat news! Your payment has been processed and your OPCalls service is now active.\n\nYour AI agent is back online and ready to handle calls.',
   '["business_name"]'::JSONB),
  
  ('usage_threshold_80', 'email', 'Usage Alert: 80% of Plan Limit',
   'Hi {{business_name}},\n\nYou have used {{used_minutes}} of your {{included_minutes}} included minutes ({{percentage}}%).\n\nConsider upgrading to avoid overage charges: {{upgrade_url}}',
   '["business_name", "used_minutes", "included_minutes", "percentage", "upgrade_url"]'::JSONB),
  
  ('usage_threshold_100', 'email', 'Usage Alert: Plan Limit Reached',
   'Hi {{business_name}},\n\nYou have reached your plan limit of {{included_minutes}} minutes. Additional usage will be billed at {{overage_rate}}/minute.\n\nUpgrade now: {{upgrade_url}}',
   '["business_name", "included_minutes", "overage_rate", "upgrade_url"]'::JSONB)
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- 10. VERTICAL_PRESETS TABLE
-- Store vertical-specific configurations
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.vertical_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL, -- 'clinic', 'hvac', 'salon', 'legal'
  version INTEGER NOT NULL DEFAULT 1,
  name TEXT NOT NULL,
  description TEXT,
  
  -- Configuration
  config JSONB NOT NULL DEFAULT '{}'::JSONB,
  
  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(code, version)
);

-- Index for vertical_presets
CREATE INDEX IF NOT EXISTS vertical_presets_code_active_idx ON public.vertical_presets(code, is_active);

-- ============================================================================
-- 11. RLS POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entitlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_checks ENABLE ROW LEVEL SECURITY;

-- Plans: Public read for active plans
CREATE POLICY "Plans are viewable by everyone" ON public.plans
  FOR SELECT USING (is_active = true AND is_public = true);

-- Subscriptions: Only org members can view
CREATE POLICY "Users can view their org subscription" ON public.subscriptions
  FOR SELECT USING (
    org_id IN (
      SELECT org_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Entitlements: Only org members can view
CREATE POLICY "Users can view their org entitlements" ON public.entitlements
  FOR SELECT USING (
    org_id IN (
      SELECT org_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Invoices: Only org members can view
CREATE POLICY "Users can view their org invoices" ON public.invoices
  FOR SELECT USING (
    org_id IN (
      SELECT org_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Usage records: Only org members can view
CREATE POLICY "Users can view their org usage" ON public.usage_records
  FOR SELECT USING (
    org_id IN (
      SELECT org_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- ============================================================================
-- 12. HELPER FUNCTIONS
-- ============================================================================

-- Function to recalculate entitlements based on subscription status
CREATE OR REPLACE FUNCTION recalculate_entitlements(target_org_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  sub_record RECORD;
  plan_record RECORD;
  ent_record RECORD;
BEGIN
  -- Get subscription
  SELECT * INTO sub_record
  FROM public.subscriptions
  WHERE org_id = target_org_id
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- Get plan
  IF sub_record.plan_id IS NOT NULL THEN
    SELECT * INTO plan_record
    FROM public.plans
    WHERE id = sub_record.plan_id;
  END IF;
  
  -- Upsert entitlements based on status
  INSERT INTO public.entitlements (
    org_id,
    can_receive_calls,
    can_make_calls,
    can_send_sms,
    can_edit_settings,
    can_add_numbers,
    can_create_agents,
    can_access_analytics,
    can_access_api,
    max_minutes,
    max_numbers,
    max_agents,
    max_concurrent_calls,
    restriction_reason,
    restricted_at,
    suspended_at,
    last_recalculated_at
  )
  VALUES (
    target_org_id,
    -- Active or trialing: full access
    CASE WHEN sub_record.status IN ('active', 'trialing') THEN true ELSE false END,
    CASE WHEN sub_record.status IN ('active', 'trialing') THEN true ELSE false END,
    CASE WHEN sub_record.status IN ('active', 'trialing') THEN true ELSE false END,
    -- Past due: limited editing
    CASE WHEN sub_record.status IN ('active', 'trialing', 'past_due') THEN true ELSE false END,
    CASE WHEN sub_record.status IN ('active', 'trialing') THEN true ELSE false END,
    CASE WHEN sub_record.status IN ('active', 'trialing') THEN true ELSE false END,
    -- Analytics always available except suspended
    CASE WHEN sub_record.status != 'suspended' THEN true ELSE false END,
    CASE WHEN sub_record.status IN ('active', 'trialing') THEN true ELSE false END,
    -- Limits from plan
    COALESCE(plan_record.included_minutes, 0),
    COALESCE(plan_record.max_active_numbers, 1),
    COALESCE(plan_record.included_agents, 1),
    COALESCE(plan_record.max_concurrent_calls, 1),
    -- Restriction info
    CASE 
      WHEN sub_record.status = 'past_due' THEN 'Payment past due'
      WHEN sub_record.status = 'restricted' THEN 'Grace period expired'
      WHEN sub_record.status = 'suspended' THEN 'Account suspended'
      ELSE NULL
    END,
    CASE WHEN sub_record.status = 'restricted' THEN NOW() ELSE NULL END,
    CASE WHEN sub_record.status = 'suspended' THEN NOW() ELSE NULL END,
    NOW()
  )
  ON CONFLICT (org_id) DO UPDATE SET
    can_receive_calls = EXCLUDED.can_receive_calls,
    can_make_calls = EXCLUDED.can_make_calls,
    can_send_sms = EXCLUDED.can_send_sms,
    can_edit_settings = EXCLUDED.can_edit_settings,
    can_add_numbers = EXCLUDED.can_add_numbers,
    can_create_agents = EXCLUDED.can_create_agents,
    can_access_analytics = EXCLUDED.can_access_analytics,
    can_access_api = EXCLUDED.can_access_api,
    max_minutes = EXCLUDED.max_minutes,
    max_numbers = EXCLUDED.max_numbers,
    max_agents = EXCLUDED.max_agents,
    max_concurrent_calls = EXCLUDED.max_concurrent_calls,
    restriction_reason = EXCLUDED.restriction_reason,
    restricted_at = COALESCE(public.entitlements.restricted_at, EXCLUDED.restricted_at),
    suspended_at = COALESCE(public.entitlements.suspended_at, EXCLUDED.suspended_at),
    last_recalculated_at = NOW(),
    updated_at = NOW();
END;
$$;

-- Function to log billing events
CREATE OR REPLACE FUNCTION log_billing_event(
  p_org_id UUID,
  p_subscription_id UUID,
  p_event_type TEXT,
  p_event_source TEXT,
  p_stripe_event_id TEXT DEFAULT NULL,
  p_previous_status TEXT DEFAULT NULL,
  p_new_status TEXT DEFAULT NULL,
  p_amount_cents INTEGER DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  event_id UUID;
BEGIN
  INSERT INTO public.billing_events (
    org_id, subscription_id, event_type, event_source,
    stripe_event_id, previous_status, new_status,
    amount_cents, description, metadata, processed, processed_at
  )
  VALUES (
    p_org_id, p_subscription_id, p_event_type, p_event_source,
    p_stripe_event_id, p_previous_status, p_new_status,
    p_amount_cents, p_description, p_metadata, true, NOW()
  )
  RETURNING id INTO event_id;
  
  RETURN event_id;
END;
$$;

-- ============================================================================
-- 13. INSERT DEFAULT PLANS
-- ============================================================================

INSERT INTO public.plans (code, name, description, monthly_price_cents, included_minutes, included_numbers, included_agents, max_concurrent_calls, features, sort_order) VALUES
  ('starter', 'Starter', 'Perfect for trying out AI voice agents', 0, 30, 1, 1, 1, 
   '{"trial": true, "support": "community", "analytics": "basic"}'::JSONB, 1),
  
  ('core', 'Core', 'For small businesses ready to automate', 9900, 500, 1, 2, 2,
   '{"support": "email", "analytics": "standard", "integrations": ["calendar", "crm_basic"]}'::JSONB, 2),
  
  ('scale', 'Scale', 'For growing businesses with high call volume', 29900, 2000, 3, 5, 5,
   '{"support": "priority", "analytics": "advanced", "integrations": ["calendar", "crm_full", "zapier"], "api_access": true}'::JSONB, 3),
  
  ('enterprise', 'Enterprise', 'Custom solutions for large organizations', 0, 0, 0, 0, 0,
   '{"support": "dedicated", "analytics": "enterprise", "sla": true, "custom": true}'::JSONB, 4)
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- 14. TRIGGERS
-- ============================================================================

-- Update updated_at on subscriptions
CREATE OR REPLACE FUNCTION update_subscription_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_subscription_updated_at();

-- Auto-recalculate entitlements when subscription changes
CREATE OR REPLACE FUNCTION trigger_recalculate_entitlements()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM recalculate_entitlements(NEW.org_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER subscription_entitlement_sync
  AFTER INSERT OR UPDATE OF status ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION trigger_recalculate_entitlements();
