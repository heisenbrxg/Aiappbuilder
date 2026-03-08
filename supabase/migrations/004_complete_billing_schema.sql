-- =====================================================
-- COMPLETE Starsky BILLING SCHEMA
-- =====================================================
-- 
-- This is the complete, updated schema that includes:
-- 1. Core user data tables
-- 2. Complete billing system with all plan variants
-- 3. Fixed CASCADE DELETE issues
-- 4. Auto-assignment of free plan to new users
-- 5. Permanent usage tracking that survives chat deletion
-- 
-- CRITICAL FIXES INCLUDED:
-- - No CASCADE DELETE on message_usage (prevents usage reset)
-- - Free plan auto-assignment for new users
-- - Scale plan variants (scale0-scale7) for dropdown
-- - Permanent billing records with URL ID references
-- =====================================================

-- =====================================================
-- 1. CREATE CORE USER TABLES
-- =====================================================

-- Create user profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  display_name text,
  avatar_url text,
  preferences jsonb DEFAULT '{}', -- Theme, language, timezone
  model_preferences jsonb DEFAULT '{}', -- AI model selections
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user chats table with GLOBALLY UNIQUE url_id
CREATE TABLE IF NOT EXISTS user_chats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  url_id uuid UNIQUE NOT NULL DEFAULT gen_random_uuid(), -- GLOBALLY UNIQUE for all users
  title text NOT NULL,
  description text,
  messages jsonb NOT NULL DEFAULT '[]', -- Complete AI conversation
  metadata jsonb DEFAULT '{}', -- Git URLs, deployment info, project settings
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create chat snapshots table
CREATE TABLE IF NOT EXISTS chat_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id uuid NOT NULL REFERENCES user_chats(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  files jsonb NOT NULL DEFAULT '{}', -- Complete file structure
  locked_files jsonb DEFAULT '{}', -- File locking state
  created_at timestamptz DEFAULT now()
);

-- Create user settings table
CREATE TABLE IF NOT EXISTS user_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category text NOT NULL, -- 'ui', 'developer', 'features'
  key text NOT NULL,
  value jsonb NOT NULL,
  synced boolean DEFAULT true, -- Whether to sync across devices
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, category, key)
);

-- =====================================================
-- 2. CREATE BILLING TABLES
-- =====================================================

-- Create subscription plans table
CREATE TABLE IF NOT EXISTS subscription_plans (
  id text PRIMARY KEY, -- 'free', 'starter', 'pro', 'scale0', 'scale1', etc.
  name text NOT NULL,
  description text,
  price_cents integer NOT NULL, -- Price in cents (e.g., 900 for $9.00)
  currency text NOT NULL DEFAULT 'usd',
  message_limit integer NOT NULL, -- Monthly message limit
  features jsonb DEFAULT '[]', -- Array of feature strings
  stripe_price_id text, -- Stripe Price ID for this plan
  is_active boolean DEFAULT true,
  archived_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT price_non_negative CHECK (price_cents >= 0),
  CONSTRAINT message_limit_positive CHECK (message_limit > 0)
);

-- Create user subscriptions table
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id text NOT NULL REFERENCES subscription_plans(id),
  stripe_customer_id text UNIQUE, -- Stripe Customer ID
  stripe_subscription_id text UNIQUE, -- Stripe Subscription ID
  status text NOT NULL DEFAULT 'active', -- 'active', 'canceled', 'past_due', 'unpaid'
  current_period_start timestamptz NOT NULL,
  current_period_end timestamptz NOT NULL,
  cancel_at_period_end boolean DEFAULT false,
  trial_start timestamptz,
  trial_end timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id) -- One subscription per user
);

-- Index to speed up plan lookup
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_plan_id ON user_subscriptions(plan_id);

-- Create message usage tracking table
-- CRITICAL: NO CASCADE DELETE on chat_id - usage records are permanent billing data
CREATE TABLE IF NOT EXISTS message_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  chat_id uuid, -- NO FOREIGN KEY CONSTRAINT - allows chat deletion without affecting billing
  chat_url_id text, -- Store URL ID for reference even after chat deletion
  message_id text, -- Store the specific message ID for deduplication
  message_type text NOT NULL, -- 'user', 'assistant', 'system'
  message_count integer NOT NULL DEFAULT 1,
  billing_period_start timestamptz NOT NULL,
  billing_period_end timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Add index for faster lookups by message_id
CREATE INDEX IF NOT EXISTS idx_message_usage_message_id ON message_usage(message_id);

-- Create billing events table for audit trail
CREATE TABLE IF NOT EXISTS billing_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type text NOT NULL, -- 'subscription_created', 'payment_succeeded', etc.
  stripe_event_id text UNIQUE, -- Stripe Event ID for deduplication
  data jsonb NOT NULL DEFAULT '{}', -- Event data from Stripe
  processed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create usage summaries table for efficient querying
-- Note: usage_summaries table removed (was unused)

-- =====================================================
-- 3. CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Core table indexes
CREATE INDEX IF NOT EXISTS idx_user_chats_user_id ON user_chats(user_id);
CREATE INDEX IF NOT EXISTS idx_user_chats_url_id ON user_chats(url_id);
CREATE INDEX IF NOT EXISTS idx_chat_snapshots_chat_id ON chat_snapshots(chat_id);
CREATE INDEX IF NOT EXISTS idx_chat_snapshots_user_id ON chat_snapshots(user_id);
CREATE INDEX IF NOT EXISTS idx_user_settings_user_category ON user_settings(user_id, category);

-- Billing table indexes
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_stripe_customer ON user_subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_message_usage_user_id ON message_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_message_usage_user_period ON message_usage(user_id, billing_period_start, billing_period_end);
CREATE INDEX IF NOT EXISTS idx_message_usage_url_id ON message_usage(chat_url_id) WHERE chat_url_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_message_usage_created_at ON message_usage(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_billing_events_user_id ON billing_events(user_id);
CREATE INDEX IF NOT EXISTS idx_billing_events_type ON billing_events(event_type);
CREATE INDEX IF NOT EXISTS idx_billing_events_stripe_id ON billing_events(stripe_event_id);
CREATE INDEX IF NOT EXISTS idx_billing_events_processed ON billing_events(processed);

-- =====================================================
-- 4. INSERT SUBSCRIPTION PLANS
-- =====================================================

INSERT INTO subscription_plans (id, name, description, price_cents, message_limit, features) VALUES
-- Free plan for new users
('free', 'Free', 'Get started with Starsky', 0, 20, '[
  "20 messages per month",
  "Basic AI models (GPT-3.5, Claude Haiku)",
  "Code editor with syntax highlighting",
  "Live preview",
  "Community support"
]'::jsonb),

-- Starter plan
('starter', 'Starter', 'Perfect for individual developers', 1000, 100, '[
  "100 messages per month",
  "Basic AI models (GPT-4o, Claude Haiku, Gemini)",
  "Git integration & GitHub push",
  "Vercel & Netlify deployment",
  "Chat export/import",
  "Folder import/export",
  "Project export (ZIP)",
  "Prompt Library",
  "Community support"
]'::jsonb),

-- Pro plan
('pro', 'Pro', 'For serious developers and teams', 2000, 300, '[
  "300 messages per month",
  "Advanced AI models (GPT-4o, Claude 3.5 Sonnet, Gemini Pro)",
  "Advanced context optimization",
  "Git integration & GitHub push",
  "Vercel & Netlify deployment",
  "Chat export/import",
  "Folder import/export",
  "Project export (ZIP)",
  "Prompt Library",
  "Priority support"
]'::jsonb),

-- Scale plan variants (for dropdown options)
('scale0', 'Scale', 'For growing teams and high usage', 10000, 1000, '[
  "1,000 messages per month",
  "All AI Providers (9+ providers, 30+ Models)",
  "Advanced context optimization",
  "Git integration & GitHub push",
  "Vercel & Netlify deployment",
  "Chat export/import",
  "Folder import/export",
  "Project export (ZIP)",
  "Prompt Library",
  "Dedicated support"
]'::jsonb),

('scale1', 'Scale', 'For growing teams and high usage', 15000, 2000, '[
  "2,000 messages per month",
  "All AI Providers (9+ providers, 30+ Models)",
  "Advanced context optimization",
  "Git integration & GitHub push",
  "Vercel & Netlify deployment",
  "Chat export/import",
  "Folder import/export",
  "Project export (ZIP)",
  "Prompt Library",
  "Dedicated support"
]'::jsonb),

('scale2', 'Scale', 'For growing teams and high usage', 20000, 3000, '[
  "3,000 messages per month",
  "All AI Providers (9+ providers, 30+ Models)",
  "Advanced context optimization",
  "Git integration & GitHub push",
  "Vercel & Netlify deployment",
  "Chat export/import",
  "Folder import/export",
  "Project export (ZIP)",
  "Prompt Library",
  "Dedicated support"
]'::jsonb),

('scale3', 'Scale', 'For growing teams and high usage', 25000, 4000, '[
  "4,000 messages per month",
  "All AI Providers (9+ providers, 30+ Models)",
  "Advanced context optimization",
  "Git integration & GitHub push",
  "Vercel & Netlify deployment",
  "Chat export/import",
  "Folder import/export",
  "Project export (ZIP)",
  "Prompt Library",
  "Dedicated support"
]'::jsonb),

('scale4', 'Scale', 'For growing teams and high usage', 30000, 5000, '[
  "5,000 messages per month",
  "All AI Providers (9+ providers, 30+ Models)",
  "Advanced context optimization",
  "Git integration & GitHub push",
  "Vercel & Netlify deployment",
  "Chat export/import",
  "Folder import/export",
  "Project export (ZIP)",
  "Prompt Library",
  "Dedicated support"
]'::jsonb),

('scale5', 'Scale', 'For growing teams and high usage', 35000, 6000, '[
  "6,000 messages per month",
  "All AI Providers (9+ providers, 30+ Models)",
  "Advanced context optimization",
  "Git integration & GitHub push",
  "Vercel & Netlify deployment",
  "Chat export/import",
  "Folder import/export",
  "Project export (ZIP)",
  "Prompt Library",
  "Dedicated support"
]'::jsonb),

('scale6', 'Scale', 'For growing teams and high usage', 40000, 7000, '[
  "7,000 messages per month",
  "All AI Providers (9+ providers, 30+ Models)",
  "Advanced context optimization",
  "Git integration & GitHub push",
  "Vercel & Netlify deployment",
  "Chat export/import",
  "Folder import/export",
  "Project export (ZIP)",
  "Prompt Library",
  "Dedicated support"
]'::jsonb),

('scale7', 'Scale', 'For growing teams and high usage', 45000, 8000, '[
  "8,000 messages per month",
  "All AI Providers (9+ providers, 30+ Models)",
  "Advanced context optimization",
  "Git integration & GitHub push",
  "Vercel & Netlify deployment",
  "Chat export/import",
  "Folder import/export",
  "Project export (ZIP)",
  "Prompt Library",
  "Dedicated support"
]'::jsonb)

ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price_cents = EXCLUDED.price_cents,
  message_limit = EXCLUDED.message_limit,
  features = EXCLUDED.features,
  updated_at = now();

-- =====================================================
-- 5. CREATE BILLING FUNCTIONS
-- =====================================================

-- Function to get current billing period for a user
CREATE OR REPLACE FUNCTION get_current_billing_period(user_uuid uuid)
RETURNS TABLE(
  period_start timestamptz,
  period_end timestamptz
) AS $$
DECLARE
  subscription_record RECORD;
BEGIN
  -- Get user's subscription
  SELECT current_period_start, current_period_end INTO subscription_record
  FROM user_subscriptions
  WHERE user_id = user_uuid AND status = 'active';

  -- If user has subscription, use subscription period
  IF subscription_record IS NOT NULL THEN
    RETURN QUERY SELECT subscription_record.current_period_start, subscription_record.current_period_end;
  ELSE
    -- Default to current month for free users
    RETURN QUERY SELECT
      date_trunc('month', now()) as period_start,
      (date_trunc('month', now()) + interval '1 month' - interval '1 second') as period_end;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to get user's current usage for billing period
CREATE OR REPLACE FUNCTION get_user_usage(user_uuid uuid)
RETURNS TABLE(
  total_messages bigint,
  user_messages bigint,
  assistant_messages bigint,
  message_limit integer,
  usage_percentage numeric
) AS $$
DECLARE
  billing_period RECORD;
  plan_limit integer;
BEGIN
  -- Get current billing period
  SELECT * INTO billing_period FROM get_current_billing_period(user_uuid);

  -- Get user's plan limit
  SELECT sp.message_limit INTO plan_limit
  FROM user_subscriptions us
  JOIN subscription_plans sp ON us.plan_id = sp.id
  WHERE us.user_id = user_uuid AND us.status = 'active';

  -- Default to free plan limit if no subscription
  IF plan_limit IS NULL THEN
    plan_limit := 20;
  END IF;

  -- Get usage counts (only count user messages for billing)
  RETURN QUERY
  SELECT
    COALESCE(SUM(CASE WHEN mu.message_type = 'user' THEN mu.message_count ELSE 0 END), 0) as total_messages,
    COALESCE(SUM(CASE WHEN mu.message_type = 'user' THEN mu.message_count ELSE 0 END), 0) as user_messages,
    COALESCE(SUM(CASE WHEN mu.message_type = 'assistant' THEN mu.message_count ELSE 0 END), 0) as assistant_messages,
    plan_limit as message_limit,
    ROUND((COALESCE(SUM(CASE WHEN mu.message_type = 'user' THEN mu.message_count ELSE 0 END), 0)::numeric / plan_limit::numeric) * 100, 2) as usage_percentage
  FROM message_usage mu
  WHERE mu.user_id = user_uuid
    AND mu.billing_period_start = billing_period.period_start
    AND mu.billing_period_end = billing_period.period_end;
END;
$$ LANGUAGE plpgsql;

-- Function to check if user has exceeded message limit
CREATE OR REPLACE FUNCTION check_message_limit(user_uuid uuid)
RETURNS boolean AS $$
DECLARE
  usage_data RECORD;
BEGIN
  SELECT * INTO usage_data FROM get_user_usage(user_uuid);
  RETURN usage_data.total_messages >= usage_data.message_limit;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 6. CREATE RLS POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_events ENABLE ROW LEVEL SECURITY;

-- User profiles policies
DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;
CREATE POLICY "Users can read own profile" ON user_profiles
  FOR ALL TO authenticated USING (auth.uid() = id);

-- User chats policies
DROP POLICY IF EXISTS "Users can manage own chats" ON user_chats;
CREATE POLICY "Users can manage own chats" ON user_chats
  FOR ALL TO authenticated USING (auth.uid() = user_id);

-- Chat snapshots policies
DROP POLICY IF EXISTS "Users can manage own snapshots" ON chat_snapshots;
CREATE POLICY "Users can manage own snapshots" ON chat_snapshots
  FOR ALL TO authenticated USING (auth.uid() = user_id);

-- User settings policies
DROP POLICY IF EXISTS "Users can manage own settings" ON user_settings;
CREATE POLICY "Users can manage own settings" ON user_settings
  FOR ALL TO authenticated USING (auth.uid() = user_id);

-- Subscription plans policies (read-only for authenticated users)
DROP POLICY IF EXISTS "Anyone can read subscription plans" ON subscription_plans;
CREATE POLICY "Anyone can read subscription plans" ON subscription_plans
  FOR SELECT TO anon, authenticated USING (true);

-- User subscriptions policies
DROP POLICY IF EXISTS "Users can read own subscriptions" ON user_subscriptions;
CREATE POLICY "Users can read own subscriptions" ON user_subscriptions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Service role needs to be able to manage subscriptions (create/update) for webhook processing
CREATE POLICY "Service can manage all subscriptions" ON user_subscriptions
  FOR ALL TO service_role USING (true);

-- Message usage policies
DROP POLICY IF EXISTS "Users can read own usage" ON message_usage;
CREATE POLICY "Users can read own usage" ON message_usage
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own usage" ON message_usage
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Create a service role policy to allow the system to manage usage for any user
CREATE POLICY "Service can manage all usage" ON message_usage
  FOR ALL TO service_role USING (true);

-- Billing events policies
DROP POLICY IF EXISTS "Users can read own billing events" ON billing_events;
CREATE POLICY "Users can manage own billing events" ON billing_events
  FOR ALL TO authenticated USING (auth.uid() = user_id);

-- Create a service role policy to allow the system to create billing events for any user
CREATE POLICY "Service can manage all billing events" ON billing_events
  FOR ALL TO service_role USING (true);

-- =====================================================
-- 7. GRANT PERMISSIONS
-- =====================================================

-- Grant permissions to authenticated users
GRANT SELECT ON subscription_plans TO anon, authenticated;
GRANT ALL ON user_profiles TO authenticated;
GRANT ALL ON user_chats TO authenticated;
GRANT ALL ON chat_snapshots TO authenticated;
GRANT ALL ON user_settings TO authenticated;
GRANT ALL ON user_subscriptions TO authenticated;
GRANT ALL ON message_usage TO authenticated;
GRANT SELECT ON billing_events TO authenticated;

-- Grant usage on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- =====================================================
-- 8. AUTO-ASSIGN FREE PLAN TO NEW USERS
-- =====================================================

-- Function to create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, display_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'display_name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create free subscription for new users
CREATE OR REPLACE FUNCTION public.handle_new_user_subscription()
RETURNS trigger AS $$
BEGIN
  -- Create a free subscription for the new user
  INSERT INTO public.user_subscriptions (
    user_id,
    plan_id,
    status,
    current_period_start,
    current_period_end
  ) VALUES (
    NEW.id,
    'free',
    'active',
    now(),
    now() + interval '1 month'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for new user setup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

DROP TRIGGER IF EXISTS on_auth_user_created_subscription ON auth.users;
CREATE TRIGGER on_auth_user_created_subscription
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user_subscription();

-- =====================================================
-- 9. ADD HELPFUL COMMENTS
-- =====================================================

COMMENT ON TABLE message_usage IS 'Permanent billing records - never deleted when chats are removed';
COMMENT ON COLUMN message_usage.chat_id IS 'Chat ID reference (no foreign key - allows chat deletion without affecting billing)';
COMMENT ON COLUMN message_usage.chat_url_id IS 'Chat URL ID for permanent reference even after chat deletion';
COMMENT ON TABLE user_subscriptions IS 'One subscription per user - automatically created as free plan for new users';
COMMENT ON TABLE subscription_plans IS 'All available plans including free tier and scale variants (scale0-scale7)';

-- =====================================================
-- 10. VERIFICATION QUERIES
-- =====================================================

-- Verify no foreign key constraints on message_usage.chat_id
DO $$
DECLARE
    fk_count integer;
BEGIN
    SELECT COUNT(*) INTO fk_count
    FROM pg_constraint
    WHERE conrelid = 'message_usage'::regclass
    AND confrelid = 'user_chats'::regclass;

    IF fk_count = 0 THEN
        RAISE NOTICE '✅ SUCCESS: No foreign key constraints found on message_usage.chat_id';
        RAISE NOTICE '✅ Billing data is protected from chat deletion';
    ELSE
        RAISE WARNING '⚠️ WARNING: Foreign key constraints still exist on message_usage';
    END IF;
END $$;

-- Verify all subscription plans exist
DO $$
DECLARE
    plan_count integer;
BEGIN
    SELECT COUNT(*) INTO plan_count FROM subscription_plans;

    IF plan_count >= 11 THEN -- free + starter + pro + 8 scale variants
        RAISE NOTICE '✅ SUCCESS: All subscription plans created (% plans)', plan_count;
    ELSE
        RAISE WARNING '⚠️ WARNING: Missing subscription plans (only % found)', plan_count;
    END IF;
END $$;

-- =====================================================
-- 11. VERIFY RLS POLICIES
-- =====================================================

-- Verify billing_events policies
DO $$
DECLARE
    policy_count integer;
BEGIN
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE tablename = 'billing_events' AND policyname = 'Service can manage all billing events';

    IF policy_count > 0 THEN
        RAISE NOTICE '✅ SUCCESS: Service role policy for billing_events is correctly set up';
    ELSE
        RAISE WARNING '⚠️ WARNING: Missing service role policy for billing_events';
    END IF;
END $$;

-- Verify message_usage policies
DO $$
DECLARE
    policy_count integer;
BEGIN
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE tablename = 'message_usage' AND policyname = 'Service can manage all usage';

    IF policy_count > 0 THEN
        RAISE NOTICE '✅ SUCCESS: Service role policy for message_usage is correctly set up';
    ELSE
        RAISE WARNING '⚠️ WARNING: Missing service role policy for message_usage';
    END IF;
END $$;

-- Verify user_subscriptions policies
DO $$
DECLARE
    policy_count integer;
BEGIN
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE tablename = 'user_subscriptions' AND policyname = 'Service can manage all subscriptions';

    IF policy_count > 0 THEN
        RAISE NOTICE '✅ SUCCESS: Service role policy for user_subscriptions is correctly set up';
    ELSE
        RAISE WARNING '⚠️ WARNING: Missing service role policy for user_subscriptions';
    END IF;
END $$;

-- =====================================================
-- SCHEMA COMPLETE
-- =====================================================

-- This schema provides:
-- ✅ Complete user data management
-- ✅ Secure billing system with permanent usage records
-- ✅ Auto-assignment of free plan to new users
-- ✅ Scale plan variants for flexible pricing
-- ✅ Protection against usage manipulation
-- ✅ Proper RLS policies for data security
-- ✅ Efficient indexes for performance
-- ✅ Comprehensive billing functions
-- ✅ Service role policies for system operations
