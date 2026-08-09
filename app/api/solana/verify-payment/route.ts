import { type NextRequest, NextResponse } from "next/server"
import { createConnection, MERCHANT_WALLET_ADDRESS } from "@/lib/solana/config"
import { verifyPayment } from "@/lib/solana/payment"
import { createClient, createAdminClient } from "@/lib/supabase/server"
import { PLAN_PRICES } from "@/lib/subscription/config"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const { signature, expectedAmount, userWallet, planName, billingPeriod } = await request.json()

    console.log("[v0] Payment verification request:", {
      signature,
      expectedAmount,
      userWallet,
      planName,
      billingPeriod,
    })

    if (!signature || !expectedAmount || !userWallet || !planName || !billingPeriod) {
      console.error("[v0] Missing required parameters:", {
        signature: !!signature,
        expectedAmount: !!expectedAmount,
        userWallet: !!userWallet,
        planName: !!planName,
        billingPeriod: !!billingPeriod,
      })
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    const connection = createConnection()
    const merchantWallet = process.env.NEXT_PUBLIC_MERCHANT_WALLET || MERCHANT_WALLET_ADDRESS

    if (!merchantWallet) {
      console.error("[v0] Merchant wallet not configured")
      return NextResponse.json({ error: "Payment configuration error" }, { status: 500 })
    }

    console.log("[v0] Verifying payment on blockchain...")
    const isValid = await verifyPayment(connection, signature, expectedAmount, merchantWallet)

    if (!isValid) {
      console.log("[v0] Payment verification failed for signature:", signature)
      return NextResponse.json({ error: "Payment verification failed" }, { status: 400 })
    }

    console.log("[v0] Payment verified successfully, processing subscription...")

    const supabase = await createAdminClient()

    // Get user ID or create if missing
    let { data: user } = await supabase
      .from("users")
      .select("id")
      .eq("wallet_address", userWallet)
      .maybeSingle()

    if (!user) {
      const { data: newUser, error: createError } = await supabase
        .from("users")
        .insert({ wallet_address: userWallet })
        .select("id")
        .single()
      
      if (createError || !newUser) {
        console.error("[v0] Failed to create user for wallet:", userWallet, createError)
        return NextResponse.json({ error: "Failed to create user record" }, { status: 500 })
      }
      user = newUser
    }

    // Calculate expiration date (1 month from now)
    const expirationDate = new Date()
    expirationDate.setMonth(expirationDate.getMonth() + 1)

    // Get plan details
    let planId = null
    let dailyRequests = 10
    
    if (planName === "investigator") {
      dailyRequests = 100000
    } else if (planName === "pro") {
      dailyRequests = 500000
    }

    // Get or create the plan ID from subscription_plans table
    let { data: plan } = await supabase
      .from("subscription_plans")
      .select("id")
      .eq("name", planName)
      .maybeSingle()

    if (!plan) {
      console.log("[v0] Plan missing in DB, creating plan:", planName)
      const { data: newPlan, error: newPlanError } = await supabase
        .from("subscription_plans")
        .insert({
          name: planName,
          daily_requests: dailyRequests,
          monthly_price_eur: planName === "investigator" ? PLAN_PRICES.investigator.monthly : PLAN_PRICES.pro.monthly,
          yearly_price_eur: planName === "investigator" ? PLAN_PRICES.investigator.yearly : PLAN_PRICES.pro.yearly,
        })
        .select("id")
        .single()
      
      if (!newPlanError && newPlan) {
        plan = newPlan
      }
    }

    if (plan) {
      planId = plan.id
    }

    console.log("[v0] Creating/updating subscription:", {
      userId: user.id,
      planName,
      planId,
      expiresAt: expirationDate,
      dailyRequests,
    })

    // Delete existing subscriptions for this user
    await supabase
      .from("user_subscriptions")
      .delete()
      .eq("user_id", user.id)

    // Create new subscription
    const { data: subscription, error: subError } = await supabase
      .from("user_subscriptions")
      .insert({
        user_id: user.id,
        plan_id: planId,
        status: "active",
        expires_at: expirationDate.toISOString(),
      })
      .select()
      .single()

    if (subError) {
      console.error("[v0] Subscription creation error:", subError)
      return NextResponse.json(
        {
          error: "Failed to create subscription",
          details: subError.message,
        },
        { status: 500 },
      )
    }

    console.log("[v0] Payment and subscription processed successfully")

    return NextResponse.json({
      success: true,
      message: "Payment verified and subscription activated",
      subscription: {
        planName,
        dailyRequests,
        status: "active",
        expiresAt: expirationDate.toISOString(),
      },
    })
  } catch (error) {
    console.error("[v0] Payment verification error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
