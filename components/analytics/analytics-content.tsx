"use client"

import { useAuth } from "@/components/auth/auth-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  BarChart3, 
  TrendingUp, 
  Activity, 
  Calendar, 
  Database, 
  Clock, 
  Target, 
  Zap, 
  Search, 
  Radio, 
  RefreshCw, 
  Menu, 
  X,
  Shield,
  Server,
  Cpu
} from "lucide-react"
import { useEffect, useState } from "react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { ThemeToggle } from "@/components/theme/theme-toggle"
import { WalletButton } from "@/components/wallet/wallet-button"

interface AnalyticsData {
  totalRequests: number
  dailyUsage: number
  dailyLimit: number
  weeklyUsage: number[]
  monthlyUsage: number[]
  topEndpoints: { endpoint: string; count: number }[]
  responseTimeAvg: number
  successRate: number
  lastActivity: string | null
}

export function AnalyticsContent() {
  const { user, loading } = useAuth()
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loadingData, setLoadingData] = useState(true)
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d">("30d")
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { toast } = useToast()

  const fetchAnalytics = async () => {
    if (!user) {
      setLoadingData(false)
      return
    }

    try {
      const mockData: AnalyticsData = {
        totalRequests: 1482,
        dailyUsage: 28,
        dailyLimit: 300,
        weeklyUsage: [14, 22, 35, 41, 38, 28, 24],
        monthlyUsage: [450, 523, 612, 589, 634, 701, 823, 756, 892, 945, 1023, 1482],
        topEndpoints: [
          { endpoint: "POST /v1/search (Tor Crawler)", count: 842 },
          { endpoint: "GET /v1/ioc/verify", count: 320 },
          { endpoint: "POST /v1/export/batch", count: 184 },
          { endpoint: "GET /v1/threat/actors", count: 96 },
          { endpoint: "POST /v1/auth/verify", count: 40 },
        ],
        responseTimeAvg: 142,
        successRate: 99.4,
        lastActivity: new Date(Date.now() - 14 * 60 * 1000).toISOString(),
      }

      setAnalytics(mockData)
    } catch (error) {
      console.error("[v0] Analytics fetch error:", error)
    } finally {
      setLoadingData(false)
    }
  }

  useEffect(() => {
    fetchAnalytics()
  }, [user])

  if (loading || loadingData) {
    return (
      <div className="min-h-screen bg-background bg-dot-pattern flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3 cyber-panel p-8 rounded-lg border border-border">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-mono-data text-muted-foreground uppercase tracking-widest">
            LOADING TELEMETRY MATRICES...
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
            <Activity className="h-6 w-6 text-primary" />
          </div>
          <h2 className="text-xl font-bold uppercase tracking-wide mb-2 text-foreground font-mono-data">
            Telemetry Restricted
          </h2>
          <p className="text-xs text-muted-foreground mb-6">
            Please connect your Solana wallet to inspect query telemetry and latency distributions.
          </p>
          <div className="flex justify-center">
            <WalletButton />
          </div>
        </div>
      </div>
    )
  }

  const usagePercent = analytics ? Math.min(100, Math.round((analytics.dailyUsage / (analytics.dailyLimit || 1)) * 100)) : 0

  return (
    <div className="min-h-screen bg-background text-foreground bg-grid-pattern flex flex-col">
      {/* Top HUD / Command Bar */}
      <header className="border-b border-border/80 bg-background/90 backdrop-blur sticky top-0 z-50">
        <div className="container max-w-7xl mx-auto flex h-14 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-4 sm:gap-6">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="h-7 w-7 rounded border border-primary/30 bg-primary/15 flex items-center justify-center">
                <Search className="h-3.5 w-3.5 text-primary" />
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="font-bold tracking-tight text-base font-mono-data">findxo</span>
                <span className="text-[10px] uppercase font-mono-data tracking-wider px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                  TELEMETRY
                </span>
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-1 font-mono-data text-xs">
              <Link 
                href="/dashboard" 
                className="px-3 py-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
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
                className="px-3 py-1.5 rounded bg-secondary text-foreground border border-border/80"
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

          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchAnalytics}
              className="h-8 border-border bg-secondary/50 font-mono-data text-xs gap-1.5 hidden sm:flex"
            >
              <RefreshCw className="h-3 w-3" />
              <span>SYNC</span>
            </Button>
            <ThemeToggle />
            <WalletButton />

            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 md:hidden border-border bg-secondary/50"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border/80 bg-background/95 backdrop-blur px-4 py-3 space-y-1 font-mono-data text-xs animate-in slide-in-from-top-2 duration-200">
            <Link
              href="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded text-muted-foreground hover:text-foreground hover:bg-secondary/50"
            >
              OVERVIEW
            </Link>
            <Link
              href="/api-keys"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded text-muted-foreground hover:text-foreground hover:bg-secondary/50"
            >
              API KEYS
            </Link>
            <Link
              href="/analytics"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded bg-secondary text-foreground border border-border/60"
            >
              TELEMETRY
            </Link>
            <Link
              href="/subscription"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded text-muted-foreground hover:text-foreground hover:bg-secondary/50"
            >
              BILLING & CLEARANCE
            </Link>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="container max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex-1 space-y-8">
        <div className="cyber-panel rounded-lg p-5 sm:p-6 border border-border/80">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                <span className="text-xs uppercase font-mono-data text-primary tracking-wider font-semibold">
                  LIVE SENSOR TELEMETRY
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-mono-data">
                Platform Telemetry & Metrics
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl mt-1">
                Real-time query volumes, response latencies, and edge gateway throughput metrics.
              </p>
            </div>

            {/* Time Filter Toggle */}
            <div className="inline-flex items-center p-1 rounded-md bg-secondary/60 border border-border/60 self-start sm:self-auto font-mono-data text-xs">
              <button
                type="button"
                onClick={() => setTimeRange("7d")}
                className={`px-3 py-1 rounded transition-colors ${
                  timeRange === "7d" ? "bg-primary text-primary-foreground font-semibold" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                7D
              </button>
              <button
                type="button"
                onClick={() => setTimeRange("30d")}
                className={`px-3 py-1 rounded transition-colors ${
                  timeRange === "30d" ? "bg-primary text-primary-foreground font-semibold" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                30D
              </button>
              <button
                type="button"
                onClick={() => setTimeRange("90d")}
                className={`px-3 py-1 rounded transition-colors ${
                  timeRange === "90d" ? "bg-primary text-primary-foreground font-semibold" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                90D
              </button>
            </div>
          </div>
        </div>

        {/* Top Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono-data">
          <div className="cyber-panel rounded-lg p-4 border border-border/80">
            <div className="flex items-center justify-between text-muted-foreground text-xs mb-2">
              <span className="uppercase">TOTAL QUERIES</span>
              <BarChart3 className="h-4 w-4 text-primary" />
            </div>
            <div className="text-2xl font-extrabold text-foreground">
              {analytics?.totalRequests.toLocaleString()}
            </div>
            <div className="text-[11px] text-emerald-400 mt-2 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              <span>+18.4% vs previous window</span>
            </div>
          </div>

          <div className="cyber-panel rounded-lg p-4 border border-border/80">
            <div className="flex items-center justify-between text-muted-foreground text-xs mb-2">
              <span className="uppercase">DAILY USAGE</span>
              <Activity className="h-4 w-4 text-primary" />
            </div>
            <div className="text-2xl font-extrabold text-foreground">
              {analytics?.dailyUsage} / {analytics?.dailyLimit}
            </div>
            <div className="mt-2">
              <Progress value={usagePercent} className="h-1.5 bg-secondary" />
            </div>
          </div>

          <div className="cyber-panel rounded-lg p-4 border border-border/80">
            <div className="flex items-center justify-between text-muted-foreground text-xs mb-2">
              <span className="uppercase">MEAN LATENCY</span>
              <Clock className="h-4 w-4 text-cyan-400" />
            </div>
            <div className="text-2xl font-extrabold text-foreground">
              {analytics?.responseTimeAvg}ms
            </div>
            <div className="text-[11px] text-muted-foreground mt-2">
              Edge routing via Solana RPC
            </div>
          </div>

          <div className="cyber-panel rounded-lg p-4 border border-border/80">
            <div className="flex items-center justify-between text-muted-foreground text-xs mb-2">
              <span className="uppercase">SUCCESS RATE</span>
              <Shield className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-extrabold text-foreground">
              {analytics?.successRate}%
            </div>
            <div className="text-[11px] text-emerald-400 mt-2">
              Zero unhandled exceptions
            </div>
          </div>
        </div>

        {/* Top Endpoints & Node Status */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-mono-data text-xs">
          <div className="cyber-panel rounded-lg p-6 border border-border/80 lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <h3 className="font-bold uppercase tracking-wider text-sm flex items-center gap-2">
                <Server className="h-4 w-4 text-primary" />
                Endpoint Execution Breakdown
              </h3>
              <span className="text-[11px] text-muted-foreground">TOP CALLS</span>
            </div>

            <div className="space-y-3">
              {analytics?.topEndpoints.map((ep, idx) => {
                const epPercent = Math.round((ep.count / (analytics?.totalRequests || 1)) * 100)
                return (
                  <div key={idx} className="p-3 rounded bg-secondary/40 border border-border/60 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-foreground truncate">{ep.endpoint}</span>
                      <span className="text-muted-foreground shrink-0">{ep.count} reqs ({epPercent}%)</span>
                    </div>
                    <Progress value={epPercent} className="h-1 bg-secondary" />
                  </div>
                )
              })}
            </div>
          </div>

          <div className="cyber-panel rounded-lg p-6 border border-border/80 space-y-4">
            <div className="border-b border-border/60 pb-3">
              <h3 className="font-bold uppercase tracking-wider text-sm flex items-center gap-2">
                <Cpu className="h-4 w-4 text-primary" />
                Infrastructure Health
              </h3>
            </div>

            <div className="space-y-3">
              <div className="p-3 rounded bg-secondary/40 border border-border/60 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-foreground">TOR CRAWLER CLUSTER</div>
                  <div className="text-[10px] text-muted-foreground">8 Nodes Operational</div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  HEALTHY
                </span>
              </div>

              <div className="p-3 rounded bg-secondary/40 border border-border/60 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-foreground">SOLANA SETTLEMENT</div>
                  <div className="text-[10px] text-muted-foreground">Mainnet RPC</div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  ONLINE
                </span>
              </div>

              <div className="p-3 rounded bg-secondary/40 border border-border/60 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-foreground">DATABASE REPLICAS</div>
                  <div className="text-[10px] text-muted-foreground">Postgres 17 + Timescale</div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  OPTIMAL
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
