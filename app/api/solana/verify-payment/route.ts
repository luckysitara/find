import { type NextRequest, NextResponse } from "next/server"
import { createConnection } from "@/lib/solana/config"
import { verifyPayment } from "@/lib/solana/payment"
import { createClient } from "@/lib/supabase/server"

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
    const merchantWallet = process.env.NEXT_PUBLIC_MERCHANT_WALLET

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

    const supabase = await createClient()

    // Calculate EUR amount based on plan
    let amountEur = 0
    if (planName === "investigator") {
      amountEur = billingPeriod === "monthly" ? 300 : 2500
    } else if (planName === "pro") {
      amountEur = billingPeriod === "monthly" ? 1000 : 12000
    }

    console.log("[v0] Processing payment with database function...")

    try {
      const { data: result, error: processError } = await supabase.rpc("process_payment_and_subscription", {
        payment_signature: signature,
        user_wallet: userWallet,
        plan_name: planName,
        billing_period: billingPeriod,
        amount_sol: expectedAmount,
        amount_eur: amountEur,
      })

      console.log("[v0] Database function result:", { result, processError })

      if (processError) {
        console.error("[v0] Database function error details:", {
          message: processError.message,
          details: processError.details,
          hint: processError.hint,
          code: processError.code,
        })
        return NextResponse.json(
          {
            error: "Failed to process payment and subscription",
            details: processError.message,
          },
          { status: 500 },
        )
      }

      if (!result) {
        console.error("[v0] Database function returned false/null")
        return NextResponse.json(
          {
            error: "Failed to process payment and subscription - function returned false",
          },
          { status: 500 },
        )
      }

      console.log("[v0] Payment and subscription processed successfully")

      const { data: verifySubscription, error: verifyError } = await supabase.rpc("get_current_subscription", {
        user_uuid: (await supabase.from("users").select("id").eq("wallet_address", userWallet).single()).data?.id,
      })

      console.log("[v0] Subscription verification:", { verifySubscription, verifyError })

      return NextResponse.json({
        success: true,
        message: "Payment verified and subscription activated",
        subscription: verifySubscription,
      })
    } catch (dbError) {
      console.error("[v0] Database operation failed:", dbError)
      return NextResponse.json(
        {
          error: "Database operation failed",
          details: dbError instanceof Error ? dbError.message : "Unknown database error",
        },
        { status: 500 },
      )
    }
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
