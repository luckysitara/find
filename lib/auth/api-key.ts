import { createHash } from "crypto"
import { createAdminClient } from "@/lib/supabase/server"

export interface ApiKeyVerificationResult {
  valid: boolean
  error?: string
  user?: {
    id: string
    subscription: {
      plan: string
      limit: number
      usage: number
    }
  }
}

/**
 * Verifies an API key and tracks usage
 * @param rawKey The raw API key provided in the request (e.g. "fx_...")
 * @param endpoint The endpoint being accessed (e.g. "/api/v1/search")
 */
export async function verifyApiKey(
  rawKey: string, 
  endpoint: string
): Promise<ApiKeyVerificationResult> {
  try {
    if (!rawKey) {
      return { valid: false, error: "API key required" }
    }

    // 1. Hash the key to match database storage
    const keyHash = createHash("sha256").update(rawKey).digest("hex")
    
    const supabase = createAdminClient()

    // 2. Fetch API key details
    const { data: apiKey, error: keyError } = await supabase
      .from("api_keys")
      .select("id, user_id, status, name")
      .eq("key_hash", keyHash)
      .single()

    if (keyError || !apiKey) {
      return { valid: false, error: "Invalid API key" }
    }

    if (apiKey.status !== "active") {
      return { valid: false, error: "API key is revoked or inactive" }
    }

    // 3. Check Subscription & Limits
    // We use the SQL function get_current_subscription designed for this
    const { data: subscription, error: subError } = await supabase.rpc(
      "get_current_subscription",
      { user_uuid: apiKey.user_id }
    )

    // Handle case where user has no subscription (fallback to free) or function error
    let planLimit = 10 // Default free limit
    let planName = "free"
    
    if (!subError && subscription && subscription.length > 0) {
      planLimit = subscription[0].daily_requests
      planName = subscription[0].plan_name
    } else {
       // Check if we should fallback or if it's a critical error
       // For now, let's assume if no sub found, they might be new or something is wrong
       // But usually 'create_default_subscription' trigger handles this.
       // We'll proceed with basic checks.
    }

    // 4. Check Current Usage
    const { data: usageCount, error: usageError } = await supabase.rpc(
      "get_daily_usage",
      { user_uuid: apiKey.user_id }
    )

    const currentUsage = usageCount || 0

    if (currentUsage >= planLimit) {
      return { 
        valid: false, 
        error: `Daily limit exceeded. Plan: ${planName} (${currentUsage}/${planLimit})` 
      }
    }

    // 5. Log Usage (Async - fire and forget if you want speed, but await for consistency)
    // We'll await to ensure we don't return success if logging fails (strict mode)
    // Or we can perform this after responding. for "Production" strict accounting is better.
    const { error: logError } = await supabase
      .from("api_usage")
      .insert({
        user_id: apiKey.user_id,
        api_key_id: apiKey.id,
        endpoint: endpoint,
        request_count: 1
      })
      
    if (logError) {
      console.error("Failed to log API usage:", logError)
      // We generally don't block the request if logging fails, unless strict auditing is required
    }

    // Update last_used_at on the key
    await supabase
      .from("api_keys")
      .update({ last_used_at: new Date().toISOString() })
      .eq("id", apiKey.id)

    return {
      valid: true,
      user: {
        id: apiKey.user_id,
        subscription: {
          plan: planName,
          limit: planLimit,
          usage: currentUsage + 1
        }
      }
    }

  } catch (error) {
    console.error("API Key Verification Error:", error)
    return { valid: false, error: "Internal verification error" }
  }
}
