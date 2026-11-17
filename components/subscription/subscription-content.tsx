"use client"

import { useAuth } from "@/components/auth/auth-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Check, 
  CreditCard, 
  Database, 
  Calendar, 
  TrendingUp, 
  Zap, 
  Shield, 
  Users, 
  Search, 
  RefreshCw, 
  ExternalLink,
  Lock,
  ArrowRight,
  Radio,
  CheckCircle2,
  Menu,
  X
} from "lucide-react"
import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { PaymentModal } from "@/components/payment/payment-modal"
import { PLAN_PRICES } from "@/lib/subscription/config"
import { convertEurToSol } from "@/lib/solana/payment"
import { downloadReceipt, ReceiptData } from "@/lib/subscription/receipt"
import { Download } from "lucide-react"
import { ThemeToggle } from "@/components/theme/theme-toggle"
import { WalletButton } from "@/components/wallet/wallet-button"

interface SubscriptionPlan {
  id: string
  name: string
  daily_requests: number
  monthly_price_eur: number
  yearly_price_eur: number
}

interface UserSubscription {
  plan_name: string
  daily_requests: number
  status: string
  expires_at: string | null
}

export function SubscriptionContent() {
  const { user, loading: authLoading } = useAuth()
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [currentSubscription, setCurrentSubscription] = useState<UserSubscription | null>(null)
  const [loadingData, setLoadingData] = useState(true)
  const [selectedBilling, setSelectedBilling] = useState<"monthly" | "yearly">("monthly")
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [lastSignature, setLastSignature] = useState<string>("")
  const [paymentModal, setPaymentModal] = useState<{
    isOpen: boolean
    planName: string
    amount: number
    billingPeriod: "monthly" | "yearly"
  }>({
    isOpen: false,
    planName: "",
    amount: 0,
    billingPeriod: "monthly",
  })
  const { toast } = useToast()

  const DEFAULT_PLANS: SubscriptionPlan[] = [
    {
      id: "free-plan",
      name: "free",
      daily_requests: 10,
      monthly_price_eur: 0,
      yearly_price_eur: 0,
    },
    {
      id: "investigator-plan",
      name: "investigator",
      daily_requests: 300,
      monthly_price_eur: PLAN_PRICES.investigator.monthly,
      yearly_price_eur: PLAN_PRICES.investigator.yearly,
    },
    {
      id: "pro-plan",
      name: "pro",
      daily_requests: 1000,
      monthly_price_eur: PLAN_PRICES.pro.monthly,
      yearly_price_eur: PLAN_PRICES.pro.yearly,
    },
  ]

  const fetchSubscriptionData = useCallback(async () => {
    try {
      let updatedPlans: SubscriptionPlan[] = DEFAULT_PLANS

      try {
        const supabase = createClient()
        if (supabase) {
          const { data: plansData, error: plansError } = await supabase
            .from("subscription_plans")
            .select("*")
            .order("monthly_price_eur", { ascending: true })

          if (!plansError && plansData && plansData.length > 0) {
            updatedPlans = plansData.map((plan) => {
              if (plan.name === "investigator") {
                return {
                  ...plan,
                  monthly_price_eur: PLAN_PRICES.investigator.monthly,
                  yearly_price_eur: PLAN_PRICES.investigator.yearly,
                }
              } else if (plan.name === "pro") {
                return {
                  ...plan,
                  monthly_price_eur: PLAN_PRICES.pro.monthly,
                  yearly_price_eur: PLAN_PRICES.pro.yearly,
                }
              }
              return plan
            })
          }
        }
      } catch (err) {
        console.warn("[v0] Supabase client error in subscription, falling back to defaults:", err)
      }

      setPlans(updatedPlans)

      if (user?.wallet_address) {
        try {
          const response = await fetch(`/api/subscription/status?wallet=${user.wallet_address}`)
          if (response.ok) {
            const data = await response.json()
            if (data?.subscription) {
              setCurrentSubscription({
                plan_name: data.subscription.planName || "free",
                daily_requests: data.subscription.dailyRequests || 10,
                status: data.subscription.status || "active",
                expires_at: data.subscription.expiresAt || null,
              })
            }
          }
        } catch (fetchErr) {
          console.warn("[v0] Could not fetch user subscription status:", fetchErr)
          setCurrentSubscription({
            plan_name: "free",
            daily_requests: 10,
            status: "active",
            expires_at: null,
          })
        }
      }
    } catch (error) {
      console.error("[v0] Failed to fetch subscription data:", error)
      setPlans(DEFAULT_PLANS)
    } finally {
      setLoadingData(false)
    }
  }, [user?.wallet_address])

  useEffect(() => {
    fetchSubscriptionData()
  }, [fetchSubscriptionData])

  const handleUpgrade = (planName: string, billing: "monthly" | "yearly") => {
    const plan = plans.find((p) => p.name === planName) || DEFAULT_PLANS.find((p) => p.name === planName)
    if (!plan) return

    const amount = billing === "monthly" ? plan.monthly_price_eur : plan.yearly_price_eur

    setPaymentModal({
      isOpen: true,
      planName,
      amount,
      billingPeriod: billing,
    })
  }

  const handlePaymentSuccess = async (signature: string) => {
    setLastSignature(signature)
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000))
      await fetchSubscriptionData()
      setPaymentModal((prev) => ({ ...prev, isOpen: false }))

      toast({
        title: "Settlement Confirmed",
        description: `Plan clearance updated. Signature: ${signature.slice(0, 8)}...`,
      })
    } catch (error) {
      console.error("[v0] Failed to refresh subscription:", error)
      toast({
        title: "Payment Received",
        description: "Transaction confirmed on-chain. Please refresh to synchronize clearance tier.",
      })
    }
  }

  const getPlanFeatures = (planName: string) => {
    const baseFeatures = ["REST API & Webhook Access", "Ed25519 Cryptographic Signatures", "Live Threat Stream Telemetry"]

    switch (planName) {
      case "free":
        return [...baseFeatures, "10 queries/day rate limit", "Public Tor hidden service index", "Community support enclave"]
      case "investigator":
        return [
          ...baseFeatures,
          "300 queries/day clearance",
          "Deep Darknet paste & breach dump index",
          "Low-latency endpoints (sub-200ms)",
          "Data exports (JSON/CSV format)",
          "Standard priority processing",
        ]
      case "pro":
        return [
          ...baseFeatures,
          "1,000 queries/day unlimited tier",
          "Zero-day forum crawler index",
          "Dedicated high-speed RPC nodes",
          "Custom regex IOC matchers",
          "24/7 dedicated analyst engineering support",
        ]
      default:
        return baseFeatures
    }
  }

  const getPlanIcon = (planName: string) => {
    switch (planName) {
      case "free":
        return <Database className="h-5 w-5 text-muted-foreground" />
      case "investigator":
        return <Zap className="h-5 w-5 text-primary" />
      case "pro":
        return <Shield className="h-5 w-5 text-cyan-400" />
      default:
        return <Database className="h-5 w-5 text-muted-foreground" />
    }
  }

  if (authLoading || loadingData) {
    return (
      <div className="min-h-screen bg-background bg-dot-pattern flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3 cyber-panel p-8 rounded-lg border border-border">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-mono-data text-muted-foreground uppercase tracking-widest">
            SYNCHRONIZING CLEARANCE TIERS...
          </span>
        </div>
      </div>
    )
  }

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
                  CLEARANCE
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
                href="/subscription" 
                className="px-3 py-1.5 rounded bg-secondary text-foreground border border-border/80"
              >
                BILLING
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setLoadingData(true)
                fetchSubscriptionData()
              }}
              className="h-8 border-border bg-secondary/50 font-mono-data text-xs gap-1.5 hidden sm:flex"
            >
              <RefreshCw className="h-3 w-3" />
              <span>SYNC</span>
            </Button>
            <ThemeToggle />
            <WalletButton />

            {/* Mobile Menu Toggle */}
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

        {/* Mobile Navigation Drawer */}
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
              href="/subscription"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded bg-secondary text-foreground border border-border/60"
            >
              BILLING & CLEARANCE
            </Link>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="container max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex-1 space-y-8">
        {/* Page Hero */}
        <div className="cyber-panel rounded-lg p-5 sm:p-6 border border-border/80">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                <span className="text-xs uppercase font-mono-data text-primary tracking-wider font-semibold">
                  SOLANA PAY ON-CHAIN CLEARANCE
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-mono-data">
                Clearance Tiers & Subscription
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl mt-1">
                Acquire automated intelligence querying clearance. Settle instantly in SOL with non-custodial cryptographic verification.
              </p>
            </div>

            {/* Auth status indicator */}
            {!user ? (
              <div className="flex items-center gap-2 p-3 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-mono-data">
                <Lock className="h-4 w-4 shrink-0" />
                <span>Connect your Solana wallet to unlock full upgrade actions</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 p-2.5 rounded-md bg-secondary/80 border border-border text-xs font-mono-data">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <div>
                  <div className="text-[10px] text-muted-foreground">ACTIVE WALLET</div>
                  <div className="font-semibold text-foreground">
                    {user.wallet_address.slice(0, 4)}...{user.wallet_address.slice(-4)}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <Tabs defaultValue="current" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
            <TabsList className="bg-secondary/60 border border-border/60 font-mono-data text-xs h-9 p-1">
              <TabsTrigger value="plans" className="text-xs px-4">
                CLEARANCE TIERS
              </TabsTrigger>
              <TabsTrigger value="current" className="text-xs px-4">
                ACTIVE STATUS
              </TabsTrigger>
            </TabsList>

            {/* Billing Toggle (Monthly / Yearly) */}
            <div className="inline-flex items-center p-1 rounded-md bg-secondary/60 border border-border/60 self-start sm:self-auto font-mono-data text-xs">
              <button
                type="button"
                onClick={() => setSelectedBilling("monthly")}
                className={`px-3 py-1 rounded transition-colors ${
                  selectedBilling === "monthly"
                    ? "bg-primary text-primary-foreground font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                MONTHLY
              </button>
              <button
                type="button"
                onClick={() => setSelectedBilling("yearly")}
                className={`px-3 py-1 rounded flex items-center gap-1.5 transition-colors ${
                  selectedBilling === "yearly"
                    ? "bg-primary text-primary-foreground font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <span>ANNUAL</span>
                <span className="text-[10px] px-1 py-0.2 rounded bg-black/40 text-emerald-200">
                  SAVE ~30%
                </span>
              </button>
            </div>
          </div>

          {/* Tab 1: Available Plans */}
          <TabsContent value="plans" className="space-y-8 mt-0 focus-visible:outline-none">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
              {plans.map((plan) => {
                const isCurrentPlan = currentSubscription?.plan_name?.toLowerCase() === plan.name.toLowerCase()
                const price = selectedBilling === "monthly" ? plan.monthly_price_eur : plan.yearly_price_eur
                const features = getPlanFeatures(plan.name)
                const isPopular = plan.name === "investigator"

                return (
                  <div
                    key={plan.id}
                    className={`rounded-lg border flex flex-col justify-between transition-all duration-200 ${
                      isPopular
                        ? "cyber-panel-glow border-primary/40 relative"
                        : "cyber-panel border-border/80"
                    }`}
                  >
                    {isPopular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono-data uppercase tracking-wider font-bold bg-primary text-primary-foreground shadow-lg">
                          MOST POPULAR
                        </span>
                      </div>
                    )}

                    <div className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="h-9 w-9 rounded border border-border/80 bg-secondary flex items-center justify-center">
                          {getPlanIcon(plan.name)}
                        </div>
                        <span className="text-[11px] font-mono-data uppercase tracking-wider text-muted-foreground">
                          {plan.name === "free" ? "TIER 0" : plan.name === "investigator" ? "TIER 1" : "TIER 2"}
                        </span>
                      </div>

                      <h3 className="text-xl font-bold font-mono-data uppercase text-foreground mb-1">
                        {plan.name}
                      </h3>
                      <p className="text-xs text-muted-foreground mb-4 min-h-[32px]">
                        {plan.name === "free" && "Essential recon reconnaissance tier for security auditors."}
                        {plan.name === "investigator" && "Advanced breach index querying for professional intelligence analysts."}
                        {plan.name === "pro" && "High-frequency infrastructure for corporate threat defense & incident teams."}
                      </p>

                      <div className="mb-6 p-3 rounded bg-secondary/40 border border-border/40 font-mono-data">
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl font-extrabold text-foreground">€{price}</span>
                          {plan.name !== "free" && (
                            <span className="text-xs text-muted-foreground">
                              /{selectedBilling === "monthly" ? "mo" : "yr"}
                            </span>
                          )}
                        </div>
                        {plan.name !== "free" && selectedBilling === "yearly" && (
                          <div className="text-[11px] text-emerald-400 mt-1">
                            Billed annually in SOL (~€{(plan.monthly_price_eur * 12).toFixed(0)} standard)
                          </div>
                        )}
                        <div className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                          <Radio className="h-3 w-3 text-primary shrink-0" />
                          <span>{plan.daily_requests.toLocaleString()} queries / day limit</span>
                        </div>
                      </div>

                      <div className="space-y-2.5 text-xs">
                        <div className="text-[10px] font-mono-data uppercase text-muted-foreground tracking-wider mb-2">
                          ENTITLEMENT SPECIFICATION
                        </div>
                        {features.map((feature, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-foreground/90">
                            <Check className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                            <span className="leading-tight">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="p-6 pt-0 mt-6 border-t border-border/40 space-y-2">
                      {isCurrentPlan ? (
                        <>
                          <Button
                            variant="outline"
                            disabled
                            className="w-full h-10 border-emerald-500/40 bg-emerald-500/10 text-emerald-400 font-mono-data text-xs cursor-default"
                          >
                            ACTIVE CLEARANCE
                          </Button>
                          {plan.name !== "free" && (
                            <Button
                              variant="outline"
                              onClick={async () => {
                                const amountEur = plan.name === "investigator" ? PLAN_PRICES.investigator.monthly : plan.name === "pro" ? PLAN_PRICES.pro.monthly : 0
                                let amountSol = 0
                                if (amountEur > 0) {
                                  try {
                                    amountSol = await convertEurToSol(amountEur)
                                  } catch {
                                    amountSol = Number((amountEur / 180).toFixed(4))
                                  }
                                }
                                const receipt: ReceiptData = {
                                  receiptId: "REC-" + (lastSignature ? lastSignature.slice(0, 8).toUpperCase() : Math.random().toString(36).substring(2, 10).toUpperCase()),
                                  transactionSignature: lastSignature || "On-Chain Active Clearance Verified",
                                  payerWallet: user?.wallet_address || "Connected Wallet",
                                  planName: plan.name,
                                  billingPeriod: selectedBilling,
                                  amountEur: amountEur,
                                  amountSol: amountSol,
                                  date: new Date().toISOString().replace("T", " ").substring(0, 19),
                                  status: "CONFIRMED",
                                  dailyRequests: plan.daily_requests,
                                }
                                downloadReceipt(receipt)
                              }}
                              className="w-full h-9 border-border bg-secondary/60 hover:bg-secondary text-foreground font-mono-data text-xs gap-1.5"
                            >
                              <Download className="h-3.5 w-3.5 text-primary" />
                              <span>DOWNLOAD RECEIPT</span>
                            </Button>
                          )}
                        </>
                      ) : plan.name === "free" ? (
                        <Button
                          variant="outline"
                          disabled
                          className="w-full h-10 border-border bg-secondary/30 text-muted-foreground font-mono-data text-xs"
                        >
                          DEFAULT BASELINE
                        </Button>
                      ) : (
                        <Button
                          onClick={() => handleUpgrade(plan.name, selectedBilling)}
                          className="w-full h-10 bg-primary text-primary-foreground hover:bg-primary/90 font-mono-data text-xs font-semibold gap-1.5"
                        >
                          <span>SUBSCRIBE WITH SOL</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Architecture / Guarantee Enclave */}
            <div className="cyber-panel rounded-lg p-6 border border-border/80">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="h-4 w-4 text-primary" />
                <h3 className="font-mono-data text-sm font-semibold uppercase tracking-wide">
                  On-Chain Settlement Protocol
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono-data text-xs">
                <div className="p-3.5 rounded bg-secondary/40 border border-border/60">
                  <div className="font-semibold text-foreground mb-1 flex items-center gap-1.5">
                    <Zap className="h-3.5 w-3.5 text-amber-400" />
                    SUB-SECOND FINALITY
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Powered by Solana blockchain transaction speeds. Clearance flags update in your session within 400ms of slot confirmation.
                  </p>
                </div>

                <div className="p-3.5 rounded bg-secondary/40 border border-border/60">
                  <div className="font-semibold text-foreground mb-1 flex items-center gap-1.5">
                    <Lock className="h-3.5 w-3.5 text-primary" />
                    ZERO CUSTODIAL RISK
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Direct peer-to-merchant smart contract transfers. No credit card retention, no recurring KYC banking storage.
                  </p>
                </div>

                <div className="p-3.5 rounded bg-secondary/40 border border-border/60">
                  <div className="font-semibold text-foreground mb-1 flex items-center gap-1.5">
                    <Database className="h-3.5 w-3.5 text-cyan-400" />
                    IMMUTABLE LEDGER
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Cryptographic transaction hashes act as permanent audit proofs for institutional reimbursement and expense records.
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Tab 2: Active Status */}
          <TabsContent value="current" className="space-y-6 mt-0 focus-visible:outline-none">
            <div className="cyber-panel rounded-lg p-6 border border-border/80 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border/60">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded border border-primary/30 bg-primary/10 flex items-center justify-center">
                    {getPlanIcon(currentSubscription?.plan_name || "free")}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-bold font-mono-data uppercase text-foreground">
                        {currentSubscription?.plan_name || "FREE"} CLEARANCE
                      </h2>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono-data uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {currentSubscription?.status || "ACTIVE"}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 font-mono-data">
                      Authorized quota: {currentSubscription?.daily_requests || 10} queries per 24-hour cycle
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={async () => {
                      const planName = currentSubscription?.plan_name || "free"
                      const amountEur = planName === "investigator" ? PLAN_PRICES.investigator.monthly : planName === "pro" ? PLAN_PRICES.pro.monthly : 0
                      let amountSol = 0
                      if (amountEur > 0) {
                        try {
                          amountSol = await convertEurToSol(amountEur)
                        } catch {
                          amountSol = Number((amountEur / 180).toFixed(4))
                        }
                      }
                      const receipt: ReceiptData = {
                        receiptId: "REC-" + (lastSignature ? lastSignature.slice(0, 8).toUpperCase() : Math.random().toString(36).substring(2, 10).toUpperCase()),
                        transactionSignature: lastSignature || "On-Chain Active Clearance Verified",
                        payerWallet: user?.wallet_address || "Connected Wallet",
                        planName: planName,
                        billingPeriod: selectedBilling,
                        amountEur: amountEur,
                        amountSol: amountSol,
                        date: new Date().toISOString().replace("T", " ").substring(0, 19),
                        status: "CONFIRMED",
                        dailyRequests: currentSubscription?.daily_requests || 10,
                      }
                      downloadReceipt(receipt)
                    }}
                    className="border-border bg-secondary/60 hover:bg-secondary text-foreground font-mono-data text-xs h-9 gap-1.5"
                  >
                    <Download className="h-3.5 w-3.5 text-primary" />
                    <span>DOWNLOAD RECEIPT</span>
                  </Button>
                  <Button
                    onClick={() => {
                      const plansTrigger = document.querySelector('[value="plans"]') as HTMLElement
                      plansTrigger?.click()
                    }}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 font-mono-data text-xs h-9"
                  >
                    UPGRADE CLEARANCE
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 font-mono-data text-xs">
                <div className="p-4 rounded bg-secondary/50 border border-border/60">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1.5">
                    <Calendar className="h-4 w-4 text-primary" />
                    <span className="uppercase">EXPIRATION CYCLE</span>
                  </div>
                  <div className="text-base font-bold text-foreground">
                    {currentSubscription?.expires_at
                      ? new Date(currentSubscription.expires_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "PERPETUAL (FREE)"}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    {currentSubscription?.expires_at ? "On-chain renewal required at expiry" : "Default base access"}
                  </p>
                </div>

                <div className="p-4 rounded bg-secondary/50 border border-border/60">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1.5">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    <span className="uppercase">THROUGHPUT CEILING</span>
                  </div>
                  <div className="text-base font-bold text-foreground">
                    {currentSubscription?.daily_requests || 10} REQ / 24H
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Automatic midnight UTC quota replenishment
                  </p>
                </div>

                <div className="p-4 rounded bg-secondary/50 border border-border/60 sm:col-span-2 lg:col-span-1">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1.5">
                    <CreditCard className="h-4 w-4 text-primary" />
                    <span className="uppercase">PAYMENT CHANNEL</span>
                  </div>
                  <div className="text-base font-bold text-foreground">SOLANA MAINNET</div>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Direct cryptographic peer settlement
                  </p>
                </div>
              </div>

              <div className="p-4 rounded border border-primary/20 bg-primary/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="font-semibold text-foreground text-sm font-mono-data">
                    Need higher intelligence volume?
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Upgrade to Investigator (300/day) or Pro (1,000/day) clearance for instant high-speed API limits.
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => {
                    const plansTrigger = document.querySelector('[value="plans"]') as HTMLElement
                    plansTrigger?.click()
                  }}
                  className="font-mono-data text-xs bg-primary text-primary-foreground hover:bg-primary/90 h-8 shrink-0"
                >
                  VIEW TIERS
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Modal for Solana Pay */}
        <PaymentModal
          isOpen={paymentModal.isOpen}
          onClose={() => setPaymentModal((prev) => ({ ...prev, isOpen: false }))}
          planName={paymentModal.planName}
          amount={paymentModal.amount}
          billingPeriod={paymentModal.billingPeriod}
          onPaymentSuccess={handlePaymentSuccess}
        />
      </main>
    </div>
  )
}
