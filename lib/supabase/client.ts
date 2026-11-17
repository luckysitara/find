import { createBrowserClient } from "@supabase/ssr"

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://skrdoyepxmugbfkuglgq.supabase.co"
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNrcmRveWVweG11Z2Jma3VnbGdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYxODMzNTMsImV4cCI6MjEwMTc1OTM1M30.DsOB_qG-ukwjteJKVZGPW9N7r6OMA45TRA0f6AGaAlI"

  try {
    return createBrowserClient(supabaseUrl, supabaseAnonKey)
  } catch (err) {
    console.warn("[v0] Falling back to client-side supabase instance:", err)
    return createBrowserClient(supabaseUrl, supabaseAnonKey)
  }
}
