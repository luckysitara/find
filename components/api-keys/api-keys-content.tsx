"use client"

import { useAuth } from "@/components/auth/auth-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Key, 
  Copy, 
  Trash2, 
  Eye, 
  EyeOff, 
  Database, 
  Search, 
  Plus, 
  Check, 
  Shield, 
  Menu, 
  X,
  Code2,
  RefreshCw,
  ExternalLink
} from "lucide-react"
import { useEffect, useState } from "react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { ThemeToggle } from "@/components/theme/theme-toggle"
import { WalletButton } from "@/components/wallet/wallet-button"

interface ApiKey {
  id: string
  name: string
  key_hash: string
  status: string
  created_at: string
  last_used_at: string | null
}

const generateSecureApiKey = (): string => {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  const key = Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("")
  return `fx_${key.substring(0, 48)}`
}

const hashApiKey = async (key: string): Promise<string> => {
  const encoder = new TextEncoder()
  const data = encoder.encode(key)
  const hashBuffer = await crypto.subtle.digest("SHA-256", data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
}

export function ApiKeysContent() {
  const { user, loading } = useAuth()
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [loadingKeys, setLoadingKeys] = useState(true)
  const [newKeyName, setNewKeyName] = useState("")
  const [creating, setCreating] = useState(false)
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set())
  const [newlyCreatedKeys, setNewlyCreatedKeys] = useState<Map<string, string>>(new Map())
  const [deleteConfirmations, setDeleteConfirmations] = useState<Set<string>>(new Set())
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { toast } = useToast()

  const fetchApiKeys = async () => {
    if (!user) return

    try {
      const response = await fetch(`/api/keys?userId=${user.id}`)
      if (response.ok) {
        const data = await response.json()
        setApiKeys(data.keys || [])
      }
    } catch (error) {
      console.error("[v0] Error fetching API keys:", error)
      toast({
        title: "Telemetry Sync Warning",
        description: "Failed to query keys from backend",
        variant: "destructive",
      })
    } finally {
      setLoadingKeys(false)
    }
  }

  useEffect(() => {
    fetchApiKeys()
  }, [user])

  const createApiKey = async () => {
    if (!newKeyName.trim()) {
      toast({
        title: "Validation Error",
        description: "Please assign a label name for the token",
        variant: "destructive",
      })
      return
    }

    if (!user) {
      toast({
        title: "Session Missing",
        description: "Please connect your Solana wallet first",
        variant: "destructive",
      })
      return
    }

    setCreating(true)

    try {
      const rawKey = generateSecureApiKey()
      const hashedKey = await hashApiKey(rawKey)

      const response = await fetch("/api/keys/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newKeyName.trim(),
          keyHash: hashedKey,
          userId: user.id,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create API key")
      }

      const { key: newKey } = await response.json()

      setNewlyCreatedKeys((prev) => new Map(prev).set(newKey.id, rawKey))
      setVisibleKeys((prev) => new Set(prev).add(newKey.id))
      setApiKeys((prev) => [newKey, ...prev])
      setNewKeyName("")

      toast({
        title: "Token Provisioned",
        description: "API access token generated successfully.",
      })
    } catch (error) {
      console.error("[v0] Key generation error:", error)
      toast({
        title: "Provisioning Failed",
        description: error instanceof Error ? error.message : "Failed to create API key",
        variant: "destructive",
      })
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteClick = (keyId: string) => {
    setDeleteConfirmations((prev) => new Set(prev).add(keyId))
  }

  const cancelDelete = (keyId: string) => {
    setDeleteConfirmations((prev) => {
      const newSet = new Set(prev)
      newSet.delete(keyId)
      return newSet
    })
  }

  const confirmDelete = async (keyId: string) => {
    try {
      const response = await fetch("/api/keys", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keyId,
          userId: user?.id,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to delete API key")
      }

      setApiKeys((keys) => keys.filter((key) => key.id !== keyId))
      setDeleteConfirmations((prev) => {
        const newSet = new Set(prev)
        newSet.delete(keyId)
        return newSet
      })
      setNewlyCreatedKeys((prev) => {
        const newMap = new Map(prev)
        newMap.delete(keyId)
        return newMap
      })

      toast({
        title: "Token Revoked",
        description: "API key permanently invalidated",
      })
    } catch (error) {
      console.error("[v0] Failed to delete API key:", error)
      toast({
        title: "Revocation Failed",
        description: "Failed to delete API key",
        variant: "destructive",
      })
    }
  }

  const copyToClipboard = (text: string, keyId?: string) => {
    let textToCopy = text
    if (keyId && newlyCreatedKeys.has(keyId)) {
      textToCopy = newlyCreatedKeys.get(keyId) || text
    }

    navigator.clipboard.writeText(textToCopy)
    toast({
      title: "Token Copied",
      description: "API token copied to clipboard",
    })
  }

  const toggleKeyVisibility = (keyId: string) => {
    setVisibleKeys((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(keyId)) {
        newSet.delete(keyId)
      } else {
        newSet.add(keyId)
      }
      return newSet
    })
  }

  if (loading || loadingKeys) {
    return (
      <div className="min-h-screen bg-background bg-dot-pattern flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3 cyber-panel p-8 rounded-lg border border-border">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-mono-data text-muted-foreground uppercase tracking-widest">
            AUTHENTICATING KEY ENCLAVE...
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
            <Key className="h-6 w-6 text-primary" />
          </div>
          <h2 className="text-xl font-bold uppercase tracking-wide mb-2 text-foreground font-mono-data">
            Authentication Required
          </h2>
          <p className="text-xs text-muted-foreground mb-6">
            Please connect your Solana wallet to issue and inspect cryptographic access tokens.
          </p>
          <div className="flex justify-center">
            <WalletButton />
          </div>
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
                  TOKENS
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
                className="px-3 py-1.5 rounded bg-secondary text-foreground border border-border/80"
              >
                API KEYS
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
              onClick={fetchApiKeys}
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
              className="block px-3 py-2 rounded bg-secondary text-foreground border border-border/60"
            >
              API KEYS
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

      {/* Main Container */}
      <main className="container max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex-1 space-y-8">
        <div className="cyber-panel rounded-lg p-5 sm:p-6 border border-border/80">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                <span className="text-xs uppercase font-mono-data text-primary tracking-wider font-semibold">
                  API CREDENTIAL ENCLAVE
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-mono-data">
                API Tokens & Integrations
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl mt-1">
                Generate and revoke scoped cryptographic bearer tokens for programmatic OSINT search and threat stream ingestion.
              </p>
            </div>
          </div>
        </div>

        {/* Generate Token Form */}
        <div className="cyber-panel rounded-lg p-6 border border-border/80">
          <h2 className="text-sm font-bold font-mono-data uppercase tracking-wider mb-2 flex items-center gap-2">
            <Plus className="h-4 w-4 text-primary" />
            Provision New Access Token
          </h2>
          <p className="text-xs text-muted-foreground mb-4">
            Assign an identifier descriptor to help distinguish usage across multiple microservices or scanning scripts.
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <Input
              type="text"
              placeholder="e.g. incident-responder-daemon, shodan-hook"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              className="font-mono-data text-xs bg-secondary/60 border-border max-w-md h-10"
              onKeyDown={(e) => e.key === "Enter" && createApiKey()}
            />
            <Button
              onClick={createApiKey}
              disabled={creating}
              className="bg-primary text-primary-foreground hover:bg-primary/90 font-mono-data text-xs font-semibold h-10 px-5 shrink-0"
            >
              {creating ? (
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  <span>GENERATING...</span>
                </div>
              ) : (
                <span>GENERATE TOKEN</span>
              )}
            </Button>
          </div>
        </div>

        {/* Active Tokens Table / Cards */}
        <div className="cyber-panel rounded-lg p-6 border border-border/80 space-y-4">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <h2 className="text-sm font-bold font-mono-data uppercase tracking-wider flex items-center gap-2">
              <Key className="h-4 w-4 text-primary" />
              Active Scoped Tokens ({apiKeys.length})
            </h2>
            <span className="text-[11px] font-mono-data text-muted-foreground">SHA-256 SALTED HASHED STORAGE</span>
          </div>

          {apiKeys.length === 0 ? (
            <div className="text-center py-10 font-mono-data text-xs text-muted-foreground">
              No active API tokens found. Provision a key above to enable REST ingestion.
            </div>
          ) : (
            <div className="space-y-3">
              {apiKeys.map((k) => {
                const hasRaw = newlyCreatedKeys.has(k.id)
                const isVisible = visibleKeys.has(k.id)
                const displayToken = hasRaw && isVisible 
                  ? newlyCreatedKeys.get(k.id) 
                  : hasRaw 
                    ? "••••••••••••••••••••••••••••••••••••••••"
                    : `fx_${k.key_hash.slice(0, 16)}••••••••`

                const isConfirmingDelete = deleteConfirmations.has(k.id)

                return (
                  <div
                    key={k.id}
                    className="p-4 rounded border border-border/80 bg-secondary/40 flex flex-col md:flex-row md:items-center justify-between gap-4 font-mono-data text-xs"
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2.5">
                        <span className="font-bold text-foreground text-sm truncate">{k.name}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {k.status.toUpperCase()}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <code className="px-2 py-1 rounded bg-black/60 text-zinc-300 border border-border/60 text-[11px] truncate max-w-sm sm:max-w-md">
                          {displayToken}
                        </code>

                        {hasRaw && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleKeyVisibility(k.id)}
                            className="h-7 w-7 text-muted-foreground hover:text-foreground"
                            title={isVisible ? "Hide secret token" : "Reveal secret token"}
                          >
                            {isVisible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                          </Button>
                        )}

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => copyToClipboard(displayToken, k.id)}
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          title="Copy Token"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                      </div>

                      <div className="text-[10px] text-muted-foreground flex flex-wrap gap-x-4 gap-y-1">
                        <span>Created: {new Date(k.created_at).toLocaleDateString()}</span>
                        <span>Last used: {k.last_used_at ? new Date(k.last_used_at).toLocaleDateString() : "Never"}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
                      {isConfirmingDelete ? (
                        <div className="flex items-center gap-1.5">
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => confirmDelete(k.id)}
                            className="h-8 font-mono-data text-xs px-2.5"
                          >
                            CONFIRM REVOKE
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => cancelDelete(k.id)}
                            className="h-8 font-mono-data text-xs border-border px-2.5"
                          >
                            CANCEL
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteClick(k.id)}
                          className="h-8 font-mono-data text-xs border-border/80 text-red-400 hover:text-red-300 hover:bg-red-500/10 px-3"
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-1" />
                          REVOKE
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Integration Quick Snippet */}
        <div className="cyber-panel rounded-lg p-6 border border-border/80 space-y-3 font-mono-data text-xs">
          <div className="flex items-center gap-2 text-foreground font-bold">
            <Code2 className="h-4 w-4 text-primary" />
            <span>REST API Integration Example</span>
          </div>
          <div className="p-3.5 rounded bg-black/80 border border-border text-zinc-300 overflow-x-auto leading-relaxed">
            <span className="text-pink-400">curl</span> -X POST https://api.findxo.intel/v1/search \<br />
            &nbsp;&nbsp;-H <span className="text-emerald-400">&quot;Authorization: Bearer YOUR_API_TOKEN&quot;</span> \<br />
            &nbsp;&nbsp;-H <span className="text-emerald-400">&quot;Content-Type: application/json&quot;</span> \<br />
            &nbsp;&nbsp;-d <span className="text-amber-300">&apos;{"{"}&quot;query&quot;: &quot;leak:target_domain.onion&quot;{"}"}&apos;</span>
          </div>
        </div>
      </main>
    </div>
  )
}
