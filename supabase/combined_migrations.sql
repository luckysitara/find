-- Create users table for wallet-based authentication
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  wallet_connected_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- RLS policies for users
-- Allow anyone to insert a new user (signup)
CREATE POLICY "Anyone can insert users" ON public.users
  FOR INSERT WITH CHECK (true);

-- Allow users to view their own data
CREATE POLICY "Users can view their own data" ON public.users
  FOR SELECT USING (wallet_address = current_setting('app.current_wallet', true));

-- Allow users to update their own data
CREATE POLICY "Users can update their own data" ON public.users
  FOR UPDATE USING (wallet_address = current_setting('app.current_wallet', true));
-- Create subscription plans table
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  daily_requests INTEGER NOT NULL,
  monthly_price_eur DECIMAL(10,2),
  yearly_price_eur DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default plans
INSERT INTO public.subscription_plans (name, daily_requests, monthly_price_eur, yearly_price_eur) VALUES
  ('free', 10, 0, 0),
  ('investigator', 100, 30, 250),
  ('pro', 1000, 100, 1000)
ON CONFLICT (name) DO NOTHING;

-- No RLS needed for subscription plans as they are public reference data
-- Create user subscriptions table
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.subscription_plans(id),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
  starts_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS policies for user subscriptions
CREATE POLICY "Users can view their own subscriptions" ON public.user_subscriptions
  FOR SELECT USING (
    user_id IN (
      SELECT id FROM public.users WHERE wallet_address = current_setting('app.current_wallet', true)
    )
  );

CREATE POLICY "Users can insert their own subscriptions" ON public.user_subscriptions
  FOR INSERT WITH CHECK (
    user_id IN (
      SELECT id FROM public.users WHERE wallet_address = current_setting('app.current_wallet', true)
    )
  );

CREATE POLICY "Users can update their own subscriptions" ON public.user_subscriptions
  FOR UPDATE USING (
    user_id IN (
      SELECT id FROM public.users WHERE wallet_address = current_setting('app.current_wallet', true)
    )
  );
-- Create API keys table
CREATE TABLE IF NOT EXISTS public.api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  key_hash TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- RLS policies for API keys
CREATE POLICY "Users can view their own API keys" ON public.api_keys
  FOR SELECT USING (
    user_id IN (
      SELECT id FROM public.users WHERE wallet_address = current_setting('app.current_wallet', true)
    )
  );

CREATE POLICY "Users can insert their own API keys" ON public.api_keys
  FOR INSERT WITH CHECK (
    user_id IN (
      SELECT id FROM public.users WHERE wallet_address = current_setting('app.current_wallet', true)
    )
  );

CREATE POLICY "Users can update their own API keys" ON public.api_keys
  FOR UPDATE USING (
    user_id IN (
      SELECT id FROM public.users WHERE wallet_address = current_setting('app.current_wallet', true)
    )
  );

CREATE POLICY "Users can delete their own API keys" ON public.api_keys
  FOR DELETE USING (
    user_id IN (
      SELECT id FROM public.users WHERE wallet_address = current_setting('app.current_wallet', true)
    )
  );
-- Create usage tracking table
CREATE TABLE IF NOT EXISTS public.api_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  api_key_id UUID REFERENCES public.api_keys(id) ON DELETE SET NULL,
  endpoint TEXT NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  date DATE NOT NULL DEFAULT CURRENT_DATE
);

-- Create index for efficient daily usage queries
CREATE INDEX IF NOT EXISTS idx_api_usage_user_date ON public.api_usage(user_id, date);
CREATE INDEX IF NOT EXISTS idx_api_usage_api_key_date ON public.api_usage(api_key_id, date);

-- Enable RLS
ALTER TABLE public.api_usage ENABLE ROW LEVEL SECURITY;

-- RLS policies for API usage
CREATE POLICY "Users can view their own usage" ON public.api_usage
  FOR SELECT USING (
    user_id IN (
      SELECT id FROM public.users WHERE wallet_address = current_setting('app.current_wallet', true)
    )
  );

CREATE POLICY "System can insert usage records" ON public.api_usage
  FOR INSERT WITH CHECK (true); -- API system needs to insert usage records
-- Create payments table for Solana transactions
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.user_subscriptions(id),
  transaction_signature TEXT UNIQUE NOT NULL,
  amount_sol DECIMAL(20,9) NOT NULL,
  amount_eur DECIMAL(10,2) NOT NULL,
  plan_name TEXT NOT NULL,
  billing_period TEXT NOT NULL CHECK (billing_period IN ('monthly', 'yearly')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  confirmed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- RLS policies for payments
CREATE POLICY "Users can view their own payments" ON public.payments
  FOR SELECT USING (
    user_id IN (
      SELECT id FROM public.users WHERE wallet_address = current_setting('app.current_wallet', true)
    )
  );

CREATE POLICY "Users can insert their own payments" ON public.payments
  FOR INSERT WITH CHECK (
    user_id IN (
      SELECT id FROM public.users WHERE wallet_address = current_setting('app.current_wallet', true)
    )
  );

CREATE POLICY "System can update payment status" ON public.payments
  FOR UPDATE USING (true); -- Payment system needs to update status
-- Function to get user's current daily usage
CREATE OR REPLACE FUNCTION get_daily_usage(user_uuid UUID, check_date DATE DEFAULT CURRENT_DATE)
RETURNS INTEGER AS $$
BEGIN
  RETURN COALESCE(
    (SELECT SUM(request_count) 
     FROM public.api_usage 
     WHERE user_id = user_uuid AND date = check_date),
    0
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's current subscription
CREATE OR REPLACE FUNCTION get_current_subscription(user_uuid UUID)
RETURNS TABLE(
  plan_name TEXT,
  daily_requests INTEGER,
  status TEXT,
  expires_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sp.name,
    sp.daily_requests,
    us.status,
    us.expires_at
  FROM public.user_subscriptions us
  JOIN public.subscription_plans sp ON us.plan_id = sp.id
  WHERE us.user_id = user_uuid 
    AND us.status = 'active'
    AND (us.expires_at IS NULL OR us.expires_at > NOW())
  ORDER BY us.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create default free subscription for new users
CREATE OR REPLACE FUNCTION create_default_subscription()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_subscriptions (user_id, plan_id)
  SELECT NEW.id, sp.id
  FROM public.subscription_plans sp
  WHERE sp.name = 'free';
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create default subscription for new users
DROP TRIGGER IF EXISTS on_user_created ON public.users;
CREATE TRIGGER on_user_created
  AFTER INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_subscription();
-- Add function to set wallet context for RLS
CREATE OR REPLACE FUNCTION set_config(parameter text, value text)
RETURNS void AS $$
BEGIN
  PERFORM set_config(parameter, value, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Update subscription plan pricing to match user requirements
UPDATE subscription_plans 
SET 
  monthly_price_eur = 300,
  yearly_price_eur = 2500
WHERE name = 'investigator';

UPDATE subscription_plans 
SET 
  monthly_price_eur = 1000,
  yearly_price_eur = 12000
WHERE name = 'pro';
-- Update the investigator plan daily requests from 100 to 300
UPDATE subscription_plans 
SET daily_requests = 300 
WHERE name = 'investigator' AND daily_requests = 100;

-- Verify the update
SELECT name, daily_requests, monthly_price_eur, yearly_price_eur 
FROM subscription_plans 
WHERE name = 'investigator';
-- Updated get_current_subscription function to handle edge cases better
CREATE OR REPLACE FUNCTION get_current_subscription(user_uuid UUID)
RETURNS TABLE(
  plan_name TEXT,
  daily_requests INTEGER,
  status TEXT,
  expires_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  -- First try to get active subscription
  RETURN QUERY
  SELECT 
    sp.name,
    sp.daily_requests,
    us.status,
    us.expires_at
  FROM public.user_subscriptions us
  JOIN public.subscription_plans sp ON us.plan_id = sp.id
  WHERE us.user_id = user_uuid 
    AND us.status = 'active'
    AND (us.expires_at IS NULL OR us.expires_at > NOW())
  ORDER BY us.created_at DESC
  LIMIT 1;
  
  -- If no active subscription found, return free plan as default
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT 
      sp.name,
      sp.daily_requests,
      'active'::TEXT as status,
      NULL::TIMESTAMP WITH TIME ZONE as expires_at
    FROM public.subscription_plans sp
    WHERE sp.name = 'free'
    LIMIT 1;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to ensure user has a default subscription
CREATE OR REPLACE FUNCTION ensure_user_subscription(user_uuid UUID)
RETURNS VOID AS $$
BEGIN
  -- Check if user has any subscription
  IF NOT EXISTS (
    SELECT 1 FROM public.user_subscriptions 
    WHERE user_id = user_uuid
  ) THEN
    -- Create free subscription if none exists
    INSERT INTO public.user_subscriptions (user_id, plan_id, status, starts_at)
    SELECT user_uuid, sp.id, 'active', NOW()
    FROM public.subscription_plans sp
    WHERE sp.name = 'free';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the trigger to use the new function
CREATE OR REPLACE FUNCTION create_default_subscription()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM ensure_user_subscription(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Fix subscription system issues

-- First, let's fix the get_current_subscription function to handle edge cases better
CREATE OR REPLACE FUNCTION get_current_subscription(user_uuid UUID)
RETURNS TABLE(
  plan_name TEXT,
  daily_requests INTEGER,
  status TEXT,
  expires_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  -- First try to get active subscription
  RETURN QUERY
  SELECT 
    sp.name,
    sp.daily_requests,
    us.status,
    us.expires_at
  FROM public.user_subscriptions us
  JOIN public.subscription_plans sp ON us.plan_id = sp.id
  WHERE us.user_id = user_uuid 
    AND us.status = 'active'
    AND (us.expires_at IS NULL OR us.expires_at > NOW())
  ORDER BY us.created_at DESC
  LIMIT 1;
  
  -- If no active subscription found, return free plan
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT 
      sp.name,
      sp.daily_requests,
      'active'::TEXT as status,
      NULL::TIMESTAMP WITH TIME ZONE as expires_at
    FROM public.subscription_plans sp
    WHERE sp.name = 'free'
    LIMIT 1;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix the create_default_subscription function to handle duplicates
CREATE OR REPLACE FUNCTION create_default_subscription()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create if user doesn't already have a subscription
  IF NOT EXISTS (
    SELECT 1 FROM public.user_subscriptions 
    WHERE user_id = NEW.id
  ) THEN
    INSERT INTO public.user_subscriptions (user_id, plan_id, status, starts_at)
    SELECT NEW.id, sp.id, 'active', NOW()
    FROM public.subscription_plans sp
    WHERE sp.name = 'free';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add function to upgrade subscription (handles existing subscriptions properly)
CREATE OR REPLACE FUNCTION upgrade_user_subscription(
  user_uuid UUID,
  new_plan_name TEXT,
  billing_period TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  plan_uuid UUID;
  expires_date TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Get the plan ID
  SELECT id INTO plan_uuid
  FROM public.subscription_plans
  WHERE name = new_plan_name;
  
  IF plan_uuid IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Calculate expiry date
  IF billing_period = 'monthly' THEN
    expires_date := NOW() + INTERVAL '1 month';
  ELSE
    expires_date := NOW() + INTERVAL '1 year';
  END IF;
  
  -- Deactivate existing subscriptions
  UPDATE public.user_subscriptions
  SET status = 'cancelled', updated_at = NOW()
  WHERE user_id = user_uuid AND status = 'active';
  
  -- Create new subscription
  INSERT INTO public.user_subscriptions (
    user_id, 
    plan_id, 
    status, 
    starts_at, 
    expires_at,
    created_at,
    updated_at
  ) VALUES (
    user_uuid,
    plan_uuid,
    'active',
    NOW(),
    expires_date,
    NOW(),
    NOW()
  );
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add function to check if user has valid subscription for API usage
CREATE OR REPLACE FUNCTION check_user_api_limit(user_uuid UUID)
RETURNS TABLE(
  can_make_request BOOLEAN,
  daily_limit INTEGER,
  current_usage INTEGER,
  plan_name TEXT
) AS $$
DECLARE
  user_sub RECORD;
  today_usage INTEGER;
BEGIN
  -- Get current subscription
  SELECT * INTO user_sub
  FROM get_current_subscription(user_uuid)
  LIMIT 1;
  
  -- Get today's usage
  SELECT COALESCE(SUM(request_count), 0) INTO today_usage
  FROM public.api_usage
  WHERE user_id = user_uuid AND date = CURRENT_DATE;
  
  -- Return the result
  RETURN QUERY
  SELECT 
    (today_usage < user_sub.daily_requests) as can_make_request,
    user_sub.daily_requests as daily_limit,
    today_usage as current_usage,
    user_sub.plan_name as plan_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure all existing users have a subscription
INSERT INTO public.user_subscriptions (user_id, plan_id, status, starts_at, created_at, updated_at)
SELECT 
  u.id,
  sp.id,
  'active',
  NOW(),
  NOW(),
  NOW()
FROM public.users u
CROSS JOIN public.subscription_plans sp
WHERE sp.name = 'free'
  AND NOT EXISTS (
    SELECT 1 FROM public.user_subscriptions us 
    WHERE us.user_id = u.id
  );
-- Add better payment tracking and verification

-- Add index for faster payment lookups
CREATE INDEX IF NOT EXISTS idx_payments_signature ON public.payments(transaction_signature);
CREATE INDEX IF NOT EXISTS idx_payments_user_status ON public.payments(user_id, status);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_active ON public.user_subscriptions(user_id, status) WHERE status = 'active';

-- Function to process successful payment and update subscription
CREATE OR REPLACE FUNCTION process_payment_and_subscription(
  payment_signature TEXT,
  user_wallet TEXT,
  plan_name TEXT,
  billing_period TEXT,
  amount_sol NUMERIC,
  amount_eur NUMERIC
)
RETURNS BOOLEAN AS $$
DECLARE
  user_uuid UUID;
  payment_uuid UUID;
  success BOOLEAN := FALSE;
BEGIN
  -- Start transaction
  BEGIN
    -- Get or create user
    SELECT id INTO user_uuid
    FROM public.users
    WHERE wallet_address = user_wallet;
    
    IF user_uuid IS NULL THEN
      INSERT INTO public.users (wallet_address, created_at, updated_at)
      VALUES (user_wallet, NOW(), NOW())
      RETURNING id INTO user_uuid;
    END IF;
    
    -- Record the payment
    INSERT INTO public.payments (
      user_id,
      transaction_signature,
      amount_sol,
      amount_eur,
      plan_name,
      billing_period,
      status,
      confirmed_at,
      created_at
    ) VALUES (
      user_uuid,
      payment_signature,
      amount_sol,
      amount_eur,
      plan_name,
      billing_period,
      'confirmed',
      NOW(),
      NOW()
    ) RETURNING id INTO payment_uuid;
    
    -- Upgrade the subscription
    SELECT upgrade_user_subscription(user_uuid, plan_name, billing_period) INTO success;
    
    IF success THEN
      COMMIT;
      RETURN TRUE;
    ELSE
      ROLLBACK;
      RETURN FALSE;
    END IF;
    
  EXCEPTION WHEN OTHERS THEN
    ROLLBACK;
    RETURN FALSE;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Fix database functions to handle edge cases better

-- Improved process_payment_and_subscription function with better error handling
CREATE OR REPLACE FUNCTION process_payment_and_subscription(
  payment_signature TEXT,
  user_wallet TEXT,
  plan_name TEXT,
  billing_period TEXT,
  amount_sol NUMERIC,
  amount_eur NUMERIC
)
RETURNS BOOLEAN AS $$
DECLARE
  user_uuid UUID;
  payment_uuid UUID;
  plan_uuid UUID;
  success BOOLEAN := FALSE;
BEGIN
  -- Start transaction
  BEGIN
    -- Validate inputs
    IF payment_signature IS NULL OR user_wallet IS NULL OR plan_name IS NULL OR billing_period IS NULL THEN
      RAISE EXCEPTION 'Missing required parameters';
    END IF;

    -- Check if payment already exists
    IF EXISTS (SELECT 1 FROM public.payments WHERE transaction_signature = payment_signature) THEN
      RAISE EXCEPTION 'Payment with signature % already exists', payment_signature;
    END IF;

    -- Get plan ID
    SELECT id INTO plan_uuid
    FROM public.subscription_plans
    WHERE name = plan_name;
    
    IF plan_uuid IS NULL THEN
      RAISE EXCEPTION 'Invalid plan name: %', plan_name;
    END IF;

    -- Get or create user
    SELECT id INTO user_uuid
    FROM public.users
    WHERE wallet_address = user_wallet;
    
    IF user_uuid IS NULL THEN
      INSERT INTO public.users (wallet_address, created_at, updated_at)
      VALUES (user_wallet, NOW(), NOW())
      RETURNING id INTO user_uuid;
      
      RAISE NOTICE 'Created new user with ID: %', user_uuid;
    END IF;
    
    -- Record the payment
    INSERT INTO public.payments (
      user_id,
      transaction_signature,
      amount_sol,
      amount_eur,
      plan_name,
      billing_period,
      status,
      confirmed_at,
      created_at
    ) VALUES (
      user_uuid,
      payment_signature,
      amount_sol,
      amount_eur,
      plan_name,
      billing_period,
      'confirmed',
      NOW(),
      NOW()
    ) RETURNING id INTO payment_uuid;
    
    RAISE NOTICE 'Created payment record with ID: %', payment_uuid;
    
    -- Upgrade the subscription
    SELECT upgrade_user_subscription(user_uuid, plan_name, billing_period) INTO success;
    
    IF success THEN
      RAISE NOTICE 'Successfully upgraded subscription for user: %', user_uuid;
      RETURN TRUE;
    ELSE
      RAISE EXCEPTION 'Failed to upgrade subscription for user: %', user_uuid;
    END IF;
    
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Payment processing failed: %', SQLERRM;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Improved upgrade_user_subscription function
CREATE OR REPLACE FUNCTION upgrade_user_subscription(
  user_uuid UUID,
  new_plan_name TEXT,
  billing_period TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  plan_uuid UUID;
  expires_date TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Validate inputs
  IF user_uuid IS NULL OR new_plan_name IS NULL OR billing_period IS NULL THEN
    RAISE EXCEPTION 'Missing required parameters for subscription upgrade';
  END IF;

  -- Get the plan ID
  SELECT id INTO plan_uuid
  FROM public.subscription_plans
  WHERE name = new_plan_name;
  
  IF plan_uuid IS NULL THEN
    RAISE EXCEPTION 'Invalid plan name: %', new_plan_name;
  END IF;
  
  -- Calculate expiry date
  IF billing_period = 'monthly' THEN
    expires_date := NOW() + INTERVAL '1 month';
  ELSIF billing_period = 'yearly' THEN
    expires_date := NOW() + INTERVAL '1 year';
  ELSE
    RAISE EXCEPTION 'Invalid billing period: %', billing_period;
  END IF;
  
  -- Deactivate existing subscriptions
  UPDATE public.user_subscriptions
  SET status = 'cancelled', updated_at = NOW()
  WHERE user_id = user_uuid AND status = 'active';
  
  RAISE NOTICE 'Deactivated existing subscriptions for user: %', user_uuid;
  
  -- Create new subscription
  INSERT INTO public.user_subscriptions (
    user_id, 
    plan_id, 
    status, 
    starts_at, 
    expires_at,
    created_at,
    updated_at
  ) VALUES (
    user_uuid,
    plan_uuid,
    'active',
    NOW(),
    expires_date,
    NOW(),
    NOW()
  );
  
  RAISE NOTICE 'Created new subscription for user: % with plan: % expires: %', user_uuid, new_plan_name, expires_date;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Add wallet_connected_at column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS wallet_connected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Update existing users to have wallet_connected_at set to their created_at if not already set
UPDATE users SET wallet_connected_at = created_at WHERE wallet_connected_at IS NULL;
-- Fix subscription for user with wallet Dc3QQVbiBBk8NCF69kcDSerNVMrZoKbg2KBz1NofsXjs
-- Update to investigator plan with 1 month expiration

BEGIN;

-- Get user ID and plan ID
WITH user_data AS (
  SELECT id FROM public.users 
  WHERE wallet_address = 'Dc3QQVbiBBk8NCF69kcDSerNVMrZoKbg2KBz1NofsXjs'
),
plan_data AS (
  SELECT id FROM public.subscription_plans 
  WHERE name = 'investigator'
)
-- Delete existing subscriptions for this user
DELETE FROM public.user_subscriptions 
WHERE user_id = (SELECT id FROM user_data);

-- Insert new subscription with 1 month expiration if user exists
INSERT INTO public.user_subscriptions (user_id, plan_id, status, expires_at, created_at)
SELECT u.id, p.id, 'active', NOW() + INTERVAL '1 month', NOW()
FROM (SELECT id FROM public.users WHERE wallet_address = 'Dc3QQVbiBBk8NCF69kcDSerNVMrZoKbg2KBz1NofsXjs') u
CROSS JOIN (SELECT id FROM public.subscription_plans WHERE name = 'investigator') p;

COMMIT;

-- Verify the update
SELECT 
  u.wallet_address,
  sp.name as plan_name,
  us.status,
  us.expires_at,
  us.created_at
FROM public.user_subscriptions us
JOIN public.users u ON us.user_id = u.id
JOIN public.subscription_plans sp ON us.plan_id = sp.id
WHERE u.wallet_address = 'Dc3QQVbiBBk8NCF69kcDSerNVMrZoKbg2KBz1NofsXjs';
