-- Diagnostic Script: List all tables with their contents
-- This script will help identify the issue with subscription updates

-- 1. List all tables in the database
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- 2. Users table
SELECT '=== USERS TABLE ===' as section;
SELECT * FROM users;

-- 3. Subscription Plans
SELECT '=== SUBSCRIPTION_PLANS TABLE ===' as section;
SELECT * FROM subscription_plans;

-- 4. User Subscriptions
SELECT '=== USER_SUBSCRIPTIONS TABLE ===' as section;
SELECT * FROM user_subscriptions;

-- 5. API Keys
SELECT '=== API_KEYS TABLE ===' as section;
SELECT * FROM api_keys;

-- 6. Payments
SELECT '=== PAYMENTS TABLE ===' as section;
SELECT * FROM payments;

-- 7. API Usage Tracking
SELECT '=== API_USAGE_TRACKING TABLE ===' as section;
SELECT * FROM api_usage_tracking LIMIT 100;

-- 8. Join users with their current subscriptions
SELECT '=== USERS WITH CURRENT SUBSCRIPTIONS ===' as section;
SELECT 
  u.id,
  u.wallet_address,
  u.created_at,
  us.id as subscription_id,
  us.status as subscription_status,
  sp.name as plan_name,
  sp.daily_requests,
  us.expires_at,
  us.created_at as subscription_created_at
FROM users u
LEFT JOIN user_subscriptions us ON u.id = us.user_id
LEFT JOIN subscription_plans sp ON us.plan_id = sp.id
ORDER BY u.created_at DESC;

-- 9. Check payment history
SELECT '=== RECENT PAYMENTS ===' as section;
SELECT 
  p.id,
  p.user_id,
  u.wallet_address,
  p.amount_sol,
  p.amount_eur,
  p.currency,
  p.status,
  p.signature,
  p.plan_requested,
  p.created_at
FROM payments p
LEFT JOIN users u ON p.user_id = u.id
ORDER BY p.created_at DESC
LIMIT 20;

-- 10. Check for the specific wallet address mentioned
SELECT '=== SPECIFIC USER WALLET ===' as section;
SELECT 
  u.id,
  u.wallet_address,
  u.created_at,
  us.id as subscription_id,
  us.status,
  sp.name as plan_name,
  us.expires_at
FROM users u
LEFT JOIN user_subscriptions us ON u.id = us.user_id
LEFT JOIN subscription_plans sp ON us.plan_id = sp.id
WHERE u.wallet_address = 'Dc3QQVbiBBk8NCF69kcDSerNVMrZoKbg2KBz1NofsXjs';

-- 11. Check RLS policies
SELECT '=== RLS POLICIES ===' as section;
SELECT * FROM pg_policies;

-- 12. Check functions and triggers
SELECT '=== FUNCTIONS ===' as section;
SELECT 
  p.proname,
  n.nspname,
  pg_get_functiondef(p.oid)
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
ORDER BY p.proname;
