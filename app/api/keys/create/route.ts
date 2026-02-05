import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const { keyName, keyHash, userId } = await request.json()

    if (!keyName || !keyHash || !userId) {
      return NextResponse.json(
        { error: "Missing required fields: keyName, keyHash, userId" },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Create API key with admin client (bypasses RLS)
    const { data: newKey, error: createError } = await supabase
      .from("api_keys")
      .insert({
        user_id: userId,
        name: keyName,
        key_hash: keyHash,
        status: "active",
      })
      .select()
      .single()

    if (createError) {
      console.error("[v0] API key creation error:", createError)
      return NextResponse.json(
        { error: `Failed to create API key: ${createError.message}` },
        { status: 500 }
      )
    }

    console.log("[v0] API key created successfully:", newKey.id)

    return NextResponse.json({
      success: true,
      keyId: newKey.id,
      name: newKey.name,
      createdAt: newKey.created_at,
    })
  } catch (error) {
    console.error("[v0] API key creation error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}
