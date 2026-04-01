"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Zap, ShoppingCart, Loader2, CheckCircle, X, AlertTriangle } from "lucide-react"
import { AddOnType } from "@prisma/client"
import { ADDON_PRICING, ADDON_NAMES } from "@/lib/billing/addons"

interface ScanPackagesCardProps {
  baseScans: number
  extraScans: number
  usedScans: number
  currentPeriod: string
  addOns: Array<{
    id: string
    type: AddOnType
    quantity: number
    status: string
    totalPrice: number
  }>
  onRefresh: () => void
  isTrial?: boolean
}

const VOLUME_PACKS: Array<{ type: AddOnType; pages: number; price: number }> = [
  { type: "PAGE_PACK_25K" as AddOnType, pages: 25000, price: 29 },
  { type: "PAGE_PACK_100K" as AddOnType, pages: 100000, price: 79 },
  { type: "PAGE_PACK_250K" as AddOnType, pages: 250000, price: 149 },
]

const PAGE_ADDON_TYPES: AddOnType[] = [
  "PAGE_PACK_25K" as AddOnType,
  "PAGE_PACK_100K" as AddOnType,
  "PAGE_PACK_250K" as AddOnType,
  "SCAN_PACK_100" as AddOnType,
  "SCAN_PACK_500" as AddOnType,
  "SCAN_PACK_1500" as AddOnType,
]

export function ScanPackagesCard({
  baseScans,
  extraScans,
  usedScans,
  currentPeriod,
  addOns,
  onRefresh,
  isTrial = false
}: ScanPackagesCardProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const totalPages = baseScans + extraScans
  const usagePercentage = totalPages > 0 ? (usedScans / totalPages) * 100 : 0
  const isWarning = usagePercentage >= 80
  const isCritical = usagePercentage >= 95

  const activePagePacks = addOns.filter(a =>
    PAGE_ADDON_TYPES.includes(a.type) && a.status === "active"
  )

  const handlePurchase = async (type: AddOnType) => {
    setLoading(type)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch("/api/billing/addons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, quantity: 1 })
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Purchase failed")
      setSuccess(data.message)

      setTimeout(() => {
        onRefresh()
        setSuccess(null)
      }, 2000)
    } catch (err: any) {
      setError(err?.message || "Purchase failed")

      if (err?.redirectUrl) {
        setTimeout(() => window.location.href = err.redirectUrl, 2000)
      }
    } finally {
      setLoading(null)
    }
  }

  const handleCancel = async (addonId: string) => {
    const confirmed = confirm("Do you want to cancel this volume pack? Access remains until the end of the current billing period.")
    if (!confirmed) return

    setLoading(addonId)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch(`/api/billing/addons/${addonId}`, {
        method: "DELETE"
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Cancellation failed")
      setSuccess(data.message)

      setTimeout(() => {
        onRefresh()
        setSuccess(null)
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cancellation failed")
    } finally {
      setLoading(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Pages per month
        </CardTitle>
        <CardDescription>
          Increase your monthly scan capacity with volume packs
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current usage */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Usage ({currentPeriod})</span>
            <span className="text-sm font-medium">
              {usedScans.toLocaleString()} / {totalPages.toLocaleString()} pages
            </span>
          </div>
          <div className="w-full bg-secondary rounded-full h-3">
            <div
              className={`rounded-full h-3 transition-all ${
                isCritical ? "bg-destructive" : isWarning ? "bg-orange-500" : "bg-primary"
              }`}
              style={{ width: `${Math.min(100, usagePercentage)}%` }}
            />
          </div>

          {/* Breakdown */}
          <div className="grid grid-cols-2 gap-2 mt-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Basis (plan):</span>
              <span className="font-medium">{baseScans.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Extra packs:</span>
              <span className="font-medium text-primary">+{extraScans.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Warning alerts */}
        {isWarning && !isCritical && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              You have already used {usagePercentage.toFixed(0)}% of your page limit. Consider adding a volume pack.
            </AlertDescription>
          </Alert>
        )}

        {isCritical && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              You have almost reached your page limit ({usagePercentage.toFixed(0)}%)! Purchase extra capacity to continue scanning.
            </AlertDescription>
          </Alert>
        )}

        {/* Active packages (legacy + new) */}
        {activePagePacks.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Active packs</h4>
            {activePagePacks.map(addon => (
              <div key={addon.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="font-medium text-sm">{ADDON_NAMES[addon.type]}</p>
                    <p className="text-xs text-muted-foreground">
                      €{Number(addon.totalPrice).toFixed(2)}/month
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleCancel(addon.id)}
                  disabled={loading === addon.id}
                >
                  {loading === addon.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <X className="h-4 w-4" />
                  )}
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Available volume packs */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Available volume packs</h4>
          {isTrial ? (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Upgrade to a paid plan to purchase volume packs.
                <a href="/pricing" className="ml-2 underline font-medium">
                  View plans →
                </a>
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid gap-2">
              {VOLUME_PACKS.map(pkg => {
                const isActive = activePagePacks.some(a => a.type === pkg.type)

                return (
                  <div
                    key={pkg.type}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      isActive ? "bg-muted opacity-60" : "bg-card"
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">+{pkg.pages.toLocaleString()} pages/month</p>
                        {isActive && <Badge variant="secondary">Active</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground">{ADDON_PRICING[pkg.type].description}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="font-bold">€{pkg.price}</p>
                        <p className="text-xs text-muted-foreground">/month</p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handlePurchase(pkg.type)}
                        disabled={isActive || loading === pkg.type}
                      >
                        {loading === pkg.type ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <ShoppingCart className="mr-2 h-4 w-4" />
                        )}
                        Kopen
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Alerts */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>
              {error}
              {error.includes("payment method") && (
                <Button
                  variant="outline"
                  size="sm"
                  className="ml-4"
                  onClick={() => window.location.href = "/settings/billing"}
                >
                  Set up payment method
                </Button>
              )}
            </AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
