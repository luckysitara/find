import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Check, 
  Search, 
  Shield, 
  Zap, 
  Database, 
  Key, 
  Globe, 
  LayoutDashboard, 
  Terminal, 
  ExternalLink,
  Lock,
  Radio,
  Cpu
} from "lucide-react"
import { WalletButton } from "@/components/wallet/wallet-button"
import { ThemeToggle } from "@/components/theme/theme-toggle"
import Link from "next/link"
import { PLAN_PRICES } from "@/lib/subscription/config"
import { calculateYearlySavings } from "@/lib/subscription/utils"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground bg-grid-pattern flex flex-col">
      {/* Top Console Navigation Bar */}
      <header className="border-b border-border/80 bg-background/90 backdrop-blur sticky top-0 z-50">
        <div className="container max-w-7xl mx-auto flex h-14 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center space-x-6">
            <Link href="/" className="flex items-center space-x-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded border border-primary/30 bg-primary/15 text-primary">
                <Search className="h-3.5 w-3.5" />
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="font-bold tracking-tight text-base font-mono-data">findxo</span>
                <span className="text-[10px] uppercase font-mono-data tracking-wider px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                  INTEL
                </span>
              </div>
            </Link>

            <nav className="hidden md:flex items-center space-x-5 font-mono-data text-xs">
              <Link href="#capabilities" className="text-muted-foreground hover:text-foreground transition-colors">
                CAPABILITIES
              </Link>
              <Link href="#terminal" className="text-muted-foreground hover:text-foreground transition-colors">
                API_SPEC
              </Link>
              <Link href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">
                CLEARANCE_TIERS
              </Link>
            </nav>
          </div>

          <div className="flex items-center space-x-3">
            <Button variant="outline" size="sm" asChild className="h-8 border-border bg-secondary/50 font-mono-data text-xs gap-1.5">
              <Link href="/dashboard">
                <LayoutDashboard className="h-3.5 w-3.5" />
                CONSOLE
              </Link>
            </Button>
            <ThemeToggle />
            <WalletButton />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-16 px-4 overflow-hidden border-b border-border/40">
        <div className="container max-w-6xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-mono-data mb-6">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-ping" />
            <span>DECENTRALIZED THREAT INTELLIGENCE • ED25519 VERIFIED</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-balance mb-6 font-mono-data">
            Dark Web Intelligence <br />
            <span className="text-primary tracking-normal">Indexed in Realtime.</span>
          </h1>

          <p className="text-base sm:text-lg text-muted-foreground text-balance mb-8 max-w-2xl mx-auto">
            Industrial-grade OSINT search engine querying underground forums, breach dumps, and Tor hidden services. Query directly via low-latency REST APIs settled through Solana Pay.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 mb-12">
            <Button size="lg" asChild className="h-11 px-6 bg-primary text-primary-foreground font-mono-data text-xs font-semibold hover:bg-primary/90">
              <Link href="/dashboard">ENTER CONSOLE</Link>
            </Button>
            <Button variant="outline" size="lg" asChild className="h-11 px-6 border-border bg-secondary/40 font-mono-data text-xs hover:bg-secondary">
              <Link href="#terminal">INSPECT API SPEC</Link>
            </Button>
          </div>

          {/* Interactive Mock Terminal */}
          <div className="max-w-3xl mx-auto text-left cyber-panel rounded-lg border border-border/80 shadow-2xl overflow-hidden" id="terminal">
            <div className="flex items-center justify-between px-4 py-2.5 bg-secondary/80 border-b border-border/60">
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full bg-red-500/80" />
                <div className="h-2.5 w-2.5 rounded-full bg-amber-500/80" />
                <div className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
                <span className="text-xs font-mono-data text-muted-foreground ml-2">curl -X POST https://api.findxo.intel/v1/search</span>
              </div>
              <Badge variant="outline" className="text-[10px] font-mono-data border-emerald-500/30 text-emerald-400">
                HTTP 200 OK
              </Badge>
            </div>

            <div className="p-4 font-mono-data text-xs bg-black/90 text-zinc-300 space-y-2 overflow-x-auto leading-relaxed">
              <div className="text-zinc-500">// Request payload</div>
              <div>
                <span className="text-pink-400">POST</span> /v1/search HTTP/2
              </div>
              <div className="text-zinc-400">
                Authorization: Bearer fxo_live_8a49f87c2...
              </div>
              <div className="text-zinc-400">
                {"{"} &quot;target&quot;: &quot;leaked_corporation.onion&quot;, &quot;depth&quot;: &quot;deep_crawl&quot; {"}"}
              </div>
              <div className="border-t border-zinc-800 my-2 pt-2 text-zinc-500">// Response snippet (latency: 18ms)</div>
              <div className="text-emerald-400">
                {`{
  "status": "success",
  "records_matched": 14208,
  "sources": ["tor_hidden_service", "breach_dump_v3", "telegram_channel"],
  "first_seen": "2026-11-12T14:22:01Z",
  "threat_level": "CRITICAL_COMPROMISE"
}`}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Capabilities Section */}
      <section id="capabilities" className="py-20 px-4 border-b border-border/40">
        <div className="container max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-xs uppercase font-mono-data text-primary tracking-widest">SYSTEM ARCHITECTURE</span>
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight font-mono-data mt-2">
              Hardened Intelligence Infrastructure
            </h2>
            <p className="text-sm text-muted-foreground max-w-xl mx-auto mt-2">
              Designed for digital forensic units, threat intelligence teams, and Web3 security researchers.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="cyber-panel p-6 rounded-lg border border-border/80 space-y-3">
              <div className="h-10 w-10 rounded border border-border bg-secondary flex items-center justify-center">
                <Database className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-mono-data text-base font-bold text-foreground">Underground Lake</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Aggregates millions of records across authenticated hidden services, darknet bazaars, and Pastebin-type repositories.
              </p>
            </div>

            <div className="cyber-panel p-6 rounded-lg border border-border/80 space-y-3">
              <div className="h-10 w-10 rounded border border-border bg-secondary flex items-center justify-center">
                <Zap className="h-5 w-5 text-amber-400" />
              </div>
              <h3 className="font-mono-data text-base font-bold text-foreground">Sub-second Indexing</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Full-text inverted indexes tuned for rapid querying of complex hashes, leaked credentials, and IOC indicators.
              </p>
            </div>

            <div className="cyber-panel p-6 rounded-lg border border-border/80 space-y-3">
              <div className="h-10 w-10 rounded border border-border bg-secondary flex items-center justify-center">
                <Shield className="h-5 w-5 text-emerald-400" />
              </div>
              <h3 className="font-mono-data text-base font-bold text-foreground">No-Log Guarantee</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Queries are processed entirely in ephemeral memory enclaves. Your investigation patterns and search queries are never retained.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing / Clearance Tiers */}
      <section id="pricing" className="py-20 px-4">
        <div className="container max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-xs uppercase font-mono-data text-primary tracking-widest">ACCESS CLEARANCE</span>
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight font-mono-data mt-2">
              Predictable Settlement via Solana
            </h2>
            <p className="text-sm text-muted-foreground max-w-xl mx-auto mt-2">
              Zero recurring credit card commitments. Settle using SOL tokens with instantaneous confirmation.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto items-stretch">
            {/* Free */}
            <div className="cyber-panel p-6 rounded-lg border border-border/80 flex flex-col justify-between">
              <div>
                <span className="text-xs font-mono-data uppercase tracking-wider text-muted-foreground">TIER 0</span>
                <h3 className="text-xl font-bold font-mono-data mt-1">Community</h3>
                <div className="text-3xl font-extrabold font-mono-data my-4">€0</div>
                <p className="text-xs text-muted-foreground mb-6">
                  For individual researchers and test integrations.
                </p>
                <div className="space-y-2.5 text-xs font-mono-data">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span>10 API queries / 24h</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span>Basic dark web search</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span>Standard rate limits</span>
                  </div>
                </div>
              </div>

              <Button variant="outline" className="w-full mt-8 font-mono-data text-xs border-border bg-secondary/50" asChild>
                <Link href="/dashboard">Access Free</Link>
              </Button>
            </div>

            {/* Investigator */}
            <div className="cyber-panel-glow p-6 rounded-lg border border-primary/40 flex flex-col justify-between relative">
              <div className="absolute -top-3 right-4">
                <Badge className="bg-primary text-primary-foreground font-mono-data text-[10px] uppercase">
                  RECOMMENDED
                </Badge>
              </div>

              <div>
                <span className="text-xs font-mono-data uppercase tracking-wider text-primary">TIER 1</span>
                <h3 className="text-xl font-bold font-mono-data mt-1">Investigator</h3>
                <div className="text-3xl font-extrabold font-mono-data my-4">
                  €{PLAN_PRICES.investigator.monthly} <span className="text-xs font-normal text-muted-foreground">/ month</span>
                </div>
                <p className="text-xs text-muted-foreground mb-6">
                  For active threat analysts and incident responders.
                </p>
                <div className="space-y-2.5 text-xs font-mono-data">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span>300 API queries / 24h</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span>Threat actor & IOC filtering</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span>Batch leak export (JSON/CSV)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span>Priority query queues</span>
                  </div>
                </div>
              </div>

              <Button className="w-full mt-8 font-mono-data text-xs bg-primary text-primary-foreground hover:bg-primary/90" asChild>
                <Link href="/subscription">Acquire Clearance</Link>
              </Button>
            </div>

            {/* Pro */}
            <div className="cyber-panel p-6 rounded-lg border border-border/80 flex flex-col justify-between">
              <div>
                <span className="text-xs font-mono-data uppercase tracking-wider text-muted-foreground">TIER 2</span>
                <h3 className="text-xl font-bold font-mono-data mt-1">Enterprise Pro</h3>
                <div className="text-3xl font-extrabold font-mono-data my-4">
                  €{PLAN_PRICES.pro.monthly} <span className="text-xs font-normal text-muted-foreground">/ month</span>
                </div>
                <p className="text-xs text-muted-foreground mb-6">
                  For cybersecurity firms and institutional security operations centers.
                </p>
                <div className="space-y-2.5 text-xs font-mono-data">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span>1,500 API queries / 24h</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span>Real-time webhook alert triggers</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span>Dedicated throughput quota</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span>Direct engineering support</span>
                  </div>
                </div>
              </div>

              <Button variant="outline" className="w-full mt-8 font-mono-data text-xs border-border bg-secondary/50" asChild>
                <Link href="/subscription">Acquire Clearance</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Industrial Footer */}
      <footer className="mt-auto border-t border-border/80 bg-background/80 py-8 px-4 font-mono-data text-xs text-muted-foreground">
        <div className="container max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-foreground">findxo</span>
            <span>—</span>
            <span>Decentralized OSINT & Underground Intelligence</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="hover:text-foreground">Console</Link>
            <Link href="/api-keys" className="hover:text-foreground">API Tokens</Link>
            <Link href="/subscription" className="hover:text-foreground">Solana Pay</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
