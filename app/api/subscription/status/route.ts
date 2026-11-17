import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const walletAddress = searchParams.get("wallet")

    if (!walletAddress) {
      return NextResponse.json({ error: "Wallet address required" }, { status: 400 })
    }

    const supabase = createAdminClient()

    // 1. Get user by wallet address
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("wallet_address", walletAddress)
      .maybeSingle()

    if (userError || !user) {
      if (userError) console.error("[v0] User query error:", userError)
      return NextResponse.json({
        subscription: {
          planName: "free",
          dailyRequests: 10,
          status: "active",
          expiresAt: null,
        },
        usage: {
          dailyUsage: 0,
          dailyLimit: 10,
        },
      })
    }

    // 2. Query user_subscriptions with inner join on subscription_plans
    const { data: subData, error: subError } = await supabase
      .from("user_subscriptions")
      .select(
        `
        id,
        status,
        expires_at,
        subscription_plans (
          name,
          daily_requests
        )
      `
      )
      .eq("user_id", user.id)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    let subscription = {
      plan_name: "free",
      daily_requests: 10,
      status: "active",
      expires_at: null as string | null,
    }

    if (!subError && subData) {
      const isNotExpired = !subData.expires_at || new Date(subData.expires_at) > new Date()
      if (isNotExpired) {
        const planObj = Array.isArray(subData.subscription_plans)
          ? subData.subscription_plans[0]
          : subData.subscription_plans

        subscription = {
          plan_name: planObj?.name || "free",
          daily_requests: planObj?.daily_requests || 10,
          status: subData.status,
          expires_at: subData.expires_at,
        }
      }
    }

    // 3. Get daily usage count
    let usage = 0
    try {
      const { data: usageData, error: usageError } = await supabase.rpc("get_daily_usage", {
        user_uuid: user.id,
      })
      if (!usageError && typeof usageData === "number") {
        usage = usageData
      }
    } catch {
      // Fallback usage
    }

    return NextResponse.json(
      {
        subscription: {
          planName: subscription.plan_name,
          dailyRequests: subscription.daily_requests,
          status: subscription.status,
          expiresAt: subscription.expires_at,
        },
        usage: {
          dailyUsage: usage,
          dailyLimit: subscription.daily_requests,
        },
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
        },
      }
    )
  } catch (error) {
    console.error("[v0] Subscription status error:", error)
    return NextResponse.json(
      {
        subscription: {
          planName: "free",
          dailyRequests: 10,
          status: "active",
          expiresAt: null,
        },
        usage: {
          dailyUsage: 0,
          dailyLimit: 10,
        },
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
        },
      }
    )
  }
}
