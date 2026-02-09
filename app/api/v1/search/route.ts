import { type NextRequest, NextResponse } from "next/server"
import { verifyApiKey } from "@/lib/auth/api-key"

export async function GET(request: NextRequest) {
  // 1. Extract API Key
  const authHeader = request.headers.get("authorization")
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json(
      { error: "Missing or invalid Authorization header. Expected 'Bearer <api_key>'" },
      { status: 401 }
    )
  }

  const apiKey = authHeader.split(" ")[1]

  // 2. Verify Key
  const result = await verifyApiKey(apiKey, "/api/v1/search")

  if (!result.valid) {
    return NextResponse.json(
      { error: result.error },
      { status: result.error?.includes("limit") ? 429 : 401 }
    )
  }

  // 3. Perform Search (Mock Logic for Demo)
  // In a real scenario, you'd use Puppeteer/Playwright here
  const query = request.nextUrl.searchParams.get("q") || "latest leaks"
  
  const mockResults = [
    {
      title: `Dark Market Listing: ${query}`,
      source: "onion_v3_xyz...onion",
      timestamp: new Date().toISOString(),
      threat_level: "high",
      summary: "Detected compromised credentials matching your query."
    },
    {
      title: "Forum Discussion #8821",
      source: "dread...onion",
      timestamp: new Date().toISOString(),
      threat_level: "medium",
      summary: "Mention of target keyword in general discussion."
    }
  ]

  // 4. Return Response with Rate Limit Headers
  return NextResponse.json({
    data: mockResults,
    meta: {
      plan: result.user?.subscription.plan,
      usage: {
        current: result.user?.subscription.usage,
        limit: result.user?.subscription.limit
      }
    }
  }, {
    headers: {
      "X-RateLimit-Limit": result.user?.subscription.limit.toString() || "0",
      "X-RateLimit-Remaining": ((result.user?.subscription.limit || 0) - (result.user?.subscription.usage || 0)).toString()
    }
  })
}
