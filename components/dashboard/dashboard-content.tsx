"use client"

import { useAuth } from "@/components/auth/auth-provider"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  Key, 
  CreditCard, 
  Activity, 
  Shield, 
  Calendar, 
  Terminal, 
  RefreshCw, 
  CheckCircle2, 
  ExternalLink,
  Code2,
  Copy,
  Check,
  Search,
  Sparkles,
  Zap,
  Radio
} from "lucide-react"
import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { ThemeToggle } from "@/components/theme/theme-toggle"
import { WalletButton } from "@/components/wallet/wallet-button"

interface UserStats {
  dailyUsage: number
  dailyLimit: number
  totalApiKeys: number
  currentPlan: string
  planExpiry: string | null
}

export function DashboardContent() {
  const { user, loading: authLoading } = useAuth()
  const [stats, setStats] = useState<UserStats | null>(null)
  const [loadingStats, setLoadingStats] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [copiedCurl, setCopiedCurl] = useState(false)
  const [accountCreatedDate, setAccountCreatedDate] = useState<string | null>(null)

  useEffect(() => {
    if (user?.created_at) {
      try {
        const d = new Date(user.created_at)
        if (!isNaN(d.getTime())) {
          setAccountCreatedDate(d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }))
        }
      } catch (e) {
        console.error("Error parsing date:", e)
      }
    }
  }, [user])

  const fetchStats = useCallback(async () => {
    if (!user?.wallet_address) return
    setLoadingStats(true)

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 6000)

      const response = await fetch(`/api/subscription/status?wallet=${user.wallet_address}`, {
        signal: controller.signal,
      })
      clearTimeout(timeoutId)

      if (response.ok) {
        const data = await response.json()
        const sub = data?.subscription
        const usage = data?.usage

        setStats({
          dailyUsage: usage?.dailyUsage ?? 0,
          dailyLimit: sub?.dailyRequests ?? 10,
          totalApiKeys: data?.totalKeys ?? 1,
          currentPlan: sub?.planName ?? "free",
          planExpiry: sub?.expiresAt ?? null,
        })
      } else {
        setStats({
          dailyUsage: 0,
          dailyLimit: 10,
          totalApiKeys: 1,
          currentPlan: "free",
          planExpiry: null,
        })
      }
    } catch {
      setStats({
        dailyUsage: 0,
        dailyLimit: 10,
        totalApiKeys: 1,
        currentPlan: "free",
        planExpiry: null,
      })
    } finally {
      setLoadingStats(false)
      setIsRefreshing(false)
    }
  }, [user?.wallet_address])

  useEffect(() => {
    if (user?.wallet_address) {
      fetchStats()
    }
  }, [user?.wallet_address, fetchStats])

  const handleRefresh = () => {
    setIsRefreshing(true)
    fetchStats()
  }

  const copyCurlCode = () => {
    const code = `curl -X POST https://api.findxo.intel/v1/search \\
  -H "Authorization: Bearer fxo_live_YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"query": "leak:breached_domain.onion", "limit": 25}'`
    navigator.clipboard.writeText(code)
    setCopiedCurl(true)
    setTimeout(() => setCopiedCurl(false), 2000)
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background bg-dot-pattern flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 cyber-panel p-8 rounded-lg border border-border">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-mono-data text-muted-foreground uppercase tracking-widest">
            INITIALIZING ANALYST CONSOLE...
          </span>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background bg-grid-pattern flex items-center justify-center p-4">
        <div className="cyber-panel p-8 max-w-md w-full rounded-lg border border-border/80 text-center shadow-2xl">
          <div className="w-14 h-14 bg-primary/10 border border-primary/20 rounded-md flex items-center justify-center mx-auto mb-4">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <h2 className="text-xl font-bold uppercase tracking-wide mb-2 text-foreground">
            Authentication Required
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            Access to findxo intelligence console requires Solana wallet authentication with cryptographically signed session.
          </p>
          <div className="flex justify-center">
            <WalletButton />
          </div>
        </div>
      </div>
    )
  }

  const usagePercent = stats ? Math.min(100, Math.round((stats.dailyUsage / (stats.dailyLimit || 1)) * 100)) : 0

  return (
    <div className="min-h-screen bg-background text-foreground bg-grid-pattern flex flex-col">
      {/* Top HUD / Command Bar */}
      <header className="border-b border-border/80 bg-background/90 backdrop-blur sticky top-0 z-50">
        <div className="container max-w-7xl mx-auto flex h-14 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="h-7 w-7 rounded border border-primary/30 bg-primary/15 flex items-center justify-center">
                <Search className="h-3.5 w-3.5 text-primary" />
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="font-bold tracking-tight text-base font-mono-data">findxo</span>
                <span className="text-[10px] uppercase font-mono-data tracking-wider px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                  CONSOLE v2.4
                </span>
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-1 font-mono-data text-xs">
              <Link 
                href="/dashboard" 
                className="px-3 py-1.5 rounded bg-secondary text-foreground border border-border/80"
              >
                OVERVIEW
              </Link>
              <Link 
                href="/api-keys" 
                className="px-3 py-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
              >
                API KEYS
              </Link>
              <Link 
                href="/analytics" 
                className="px-3 py-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
              >
                TELEMETRY
              </Link>
              <Link 
                href="/subscription" 
                className="px-3 py-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
              >
                BILLING
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="h-8 border-border bg-secondary/50 font-mono-data text-xs gap-1.5"
            >
              <RefreshCw className={`h-3 w-3 ${isRefreshing ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">SYNC</span>
            </Button>
            <ThemeToggle />
            <WalletButton />
          </div>
        </div>
      </header>

      {/* Main Console Body */}
      <main className="container max-w-7xl mx-auto px-4 sm:px-6 py-6 flex-1 space-y-6">
        
        {/* User Identity HUD Bar */}
        <div className="cyber-panel rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded border border-border bg-secondary flex items-center justify-center">
              <Radio className="h-5 w-5 text-primary animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-mono-data text-muted-foreground">CONNECTED IDENTITY:</span>
                <span className="font-mono-data text-xs px-2 py-0.5 rounded bg-secondary border border-border text-foreground font-semibold">
                  {user.wallet_address.slice(0, 4)}...{user.wallet_address.slice(-4)}
                </span>
                <span className="flex items-center gap-1 text-[11px] font-mono-data text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                  AUTHENTICATED
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Session registered via Solana Ed25519 signature • Plan: <strong className="text-foreground uppercase">{stats?.currentPlan || "FREE"}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button size="sm" asChild className="h-8 text-xs font-mono-data bg-primary text-primary-foreground hover:bg-primary/90">
              <Link href="/subscription">UPGRADE TIER</Link>
            </Button>
            <Button variant="outline" size="sm" asChild className="h-8 text-xs font-mono-data border-border">
              <Link href="/api-keys">MANAGE KEYS</Link>
            </Button>
          </div>
        </div>

        {/* Bento Grid Analytics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Daily Quota */}
          <Card className="cyber-panel border-border/80 rounded-lg">
            <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
              <span className="text-xs font-mono-data uppercase tracking-wider text-muted-foreground">
                24H QUERY CONSUMPTION
              </span>
              <Activity className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent className="p-4 pt-2">
              <div className="flex items-baseline justify-between mb-2">
                <div className="text-2xl font-bold font-mono-data tracking-tight">
                  {stats?.dailyUsage ?? 0}
                  <span className="text-sm font-normal text-muted-foreground"> / {stats?.dailyLimit ?? 10}</span>
                </div>
                <span className="text-xs font-mono-data text-muted-foreground">{usagePercent}%</span>
              </div>
              <Progress value={usagePercent} className="h-1.5 bg-secondary" />
              <div className="flex justify-between items-center mt-2 text-[11px] font-mono-data text-muted-foreground">
                <span>RESETS 00:00 UTC</span>
                <span>{Math.max(0, (stats?.dailyLimit ?? 10) - (stats?.dailyUsage ?? 0))} REMAINING</span>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Active Plan */}
          <Card className="cyber-panel border-border/80 rounded-lg">
            <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
              <span className="text-xs font-mono-data uppercase tracking-wider text-muted-foreground">
                CURRENT CLEARANCE
              </span>
              <Shield className="h-4 w-4 text-emerald-400" />
            </CardHeader>
            <CardContent className="p-4 pt-2">
              <div className="text-2xl font-bold uppercase font-mono-data tracking-tight text-foreground">
                {stats?.currentPlan || "FREE"}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats?.currentPlan === "free" ? "10 requests/day basic access" : "Unlimited search & batch downloads"}
              </p>
              <div className="mt-3 flex items-center justify-between">
                <Link href="/subscription" className="text-xs font-mono-data text-primary hover:underline flex items-center gap-1">
                  Change Plan <ExternalLink className="h-3 w-3" />
                </Link>
                <Badge variant="outline" className="text-[10px] font-mono-data uppercase border-border">
                  ACTIVE
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Card 3: API Keys */}
          <Card className="cyber-panel border-border/80 rounded-lg">
            <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
              <span className="text-xs font-mono-data uppercase tracking-wider text-muted-foreground">
                PROVISIONED TOKENS
              </span>
              <Key className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent className="p-4 pt-2">
              <div className="text-2xl font-bold font-mono-data tracking-tight">
                {stats?.totalApiKeys ?? 1}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Active bearer credentials configured
              </p>
              <div className="mt-3 flex items-center justify-between">
                <Link href="/api-keys" className="text-xs font-mono-data text-primary hover:underline flex items-center gap-1">
                  Generate Key <ExternalLink className="h-3 w-3" />
                </Link>
                <span className="text-[11px] font-mono-data text-emerald-400">STATUS: OK</span>
              </div>
            </CardContent>
          </Card>

          {/* Card 4: Account Created */}
          <Card className="cyber-panel border-border/80 rounded-lg">
            <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
              <span className="text-xs font-mono-data uppercase tracking-wider text-muted-foreground">
                REGISTRATION LOG
              </span>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-4 pt-2">
              <div className="text-lg font-bold font-mono-data tracking-tight truncate">
                {accountCreatedDate || "Recently"}
              </div>
              <p className="text-xs text-muted-foreground mt-1 font-mono-data">
                AUDIT ID: #{user.id.slice(0, 8)}
              </p>
              <div className="mt-3">
                <span className="text-[11px] font-mono-data px-2 py-0.5 rounded bg-secondary border border-border text-muted-foreground">
                  VERIFIED PROTOCOL
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Industrial API Quickstart & Terminal Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Code Snippet / Terminal */}
          <div className="lg:col-span-2 cyber-panel rounded-lg border border-border p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="h-4 w-4 text-primary" />
                <h3 className="font-mono-data text-sm font-semibold uppercase tracking-wide">
                  Direct Intelligence API Execution
                </h3>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={copyCurlCode}
                className="h-7 text-xs font-mono-data gap-1 border-border bg-secondary/50"
              >
                {copiedCurl ? (
                  <>
                    <Check className="h-3 w-3 text-emerald-400" />
                    COPIED
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    COPY cURL
                  </>
                )}
              </Button>
            </div>

            <div className="relative rounded bg-black/80 border border-border/60 p-4 font-mono-data text-xs text-emerald-400 overflow-x-auto leading-relaxed">
              <div className="text-zinc-500 mb-2"># Query dark web leaks & indexed forums via HTTP POST</div>
              <div>
                <span className="text-pink-400">curl</span> -X POST https://api.findxo.intel/v1/search \
              </div>
              <div className="pl-4">
                -H <span className="text-amber-300">&quot;Authorization: Bearer fxo_live_YOUR_KEY&quot;</span> \
              </div>
              <div className="pl-4">
                -H <span className="text-amber-300">&quot;Content-Type: application/json&quot;</span> \
              </div>
              <div className="pl-4">
                -d <span className="text-cyan-300">&apos;{"{"}&quot;query&quot;: &quot;leak:breached_domain.onion&quot;, &quot;limit&quot;: 25{"}"}&apos;</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs font-mono-data text-muted-foreground pt-1">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                <span>REST & Webhooks</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                <span>Zero Query Logging</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                <span>Solana Micro-invoicing</span>
              </div>
            </div>
          </div>

          {/* Right: Quick Action Rail */}
          <div className="cyber-panel rounded-lg border border-border p-5 space-y-4 flex flex-col justify-between">
            <div>
              <h3 className="font-mono-data text-sm font-semibold uppercase tracking-wide mb-3 flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-400" /> Quick Operations
              </h3>
              <div className="space-y-2">
                <Link
                  href="/api-keys"
                  className="flex items-center justify-between p-2.5 rounded bg-secondary/50 border border-border/60 hover:bg-secondary hover:border-border transition-colors group"
                >
                  <div className="flex items-center gap-2.5">
                    <Key className="h-4 w-4 text-primary" />
                    <div>
                      <div className="text-xs font-semibold font-mono-data text-foreground">API Keys Hub</div>
                      <div className="text-[11px] text-muted-foreground">Issue, rotate or revoke access tokens</div>
                    </div>
                  </div>
                  <ExternalLink className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground" />
                </Link>

                <Link
                  href="/analytics"
                  className="flex items-center justify-between p-2.5 rounded bg-secondary/50 border border-border/60 hover:bg-secondary hover:border-border transition-colors group"
                >
                  <div className="flex items-center gap-2.5">
                    <Activity className="h-4 w-4 text-primary" />
                    <div>
                      <div className="text-xs font-semibold font-mono-data text-foreground">Telemetry & Logs</div>
                      <div className="text-[11px] text-muted-foreground">Realtime latency, request headers & errors</div>
                    </div>
                  </div>
                  <ExternalLink className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground" />
                </Link>

                <Link
                  href="/subscription"
                  className="flex items-center justify-between p-2.5 rounded bg-secondary/50 border border-border/60 hover:bg-secondary hover:border-border transition-colors group"
                >
                  <div className="flex items-center gap-2.5">
                    <CreditCard className="h-4 w-4 text-primary" />
                    <div>
                      <div className="text-xs font-semibold font-mono-data text-foreground">Solana Pay Settlement</div>
                      <div className="text-[11px] text-muted-foreground">Instant cryptographic plan renewals</div>
                    </div>
                  </div>
                  <ExternalLink className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground" />
                </Link>
              </div>
            </div>

            <div className="pt-3 border-t border-border/60">
              <div className="flex items-center justify-between text-[11px] font-mono-data text-muted-foreground">
                <span>SECURITY ENCLAVE</span>
                <span className="text-emerald-400">HARDENED</span>
              </div>
            </div>
          </div>
        </div>

      </main>
    </div>
  )
}
