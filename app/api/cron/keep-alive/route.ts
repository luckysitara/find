import { NextResponse, type NextRequest } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

// Vercel Cron Jobs max duration & dynamic rendering
export const dynamic = "force-dynamic"
export const maxDuration = 30

export async function GET(request: NextRequest) {
  // Optional security check: verify CRON_SECRET if configured on Vercel
  const authHeader = request.headers.get("authorization")
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const supabase = createAdminClient()

    // Perform a lightweight query against Supabase to register activity and prevent auto-pause
    const { count, error } = await supabase
      .from("subscription_plans")
      .select("*", { count: "exact", head: true })

    if (error) {
      console.error("[Keep-Alive Cron] Supabase query error:", error)
      return NextResponse.json(
        {
          success: false,
          message: "Keep-alive ping encountered a database error",
          error: error.message,
          timestamp: new Date().toISOString(),
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Database pinged successfully — keep-alive active",
      timestamp: new Date().toISOString(),
      count,
    })
  } catch (err: any) {
    console.error("[Keep-Alive Cron] Unexpected error:", err)
    return NextResponse.json(
      {
        success: false,
        error: err?.message || "Internal server error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}
