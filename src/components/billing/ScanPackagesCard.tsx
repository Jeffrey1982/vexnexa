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
      if (!response.ok) throw new Error(data.error || "Aankoop mislukt")
      setSuccess(data.message)

      setTimeout(() => {
        onRefresh()
        setSuccess(null)
      }, 2000)
    } catch (err: any) {
      setError(err?.message || "Aankoop mislukt")

      if (err?.redirectUrl) {
        setTimeout(() => window.location.href = err.redirectUrl, 2000)
      }
    } finally {
      setLoading(null)
    }
  }

  const handleCancel = async (addonId: string) => {
    const confirmed = confirm("Wil je dit volume pakket annuleren? Toegang blijft tot einde van de huidige betaalperiode.")
    if (!confirmed) return

    setLoading(addonId)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch(`/api/billing/addons/${addonId}`, {
        method: "DELETE"
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Annulering mislukt")
      setSuccess(data.message)

      setTimeout(() => {
        onRefresh()
        setSuccess(null)
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Annulering mislukt")
    } finally {
      setLoading(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Pages per maand
        </CardTitle>
        <CardDescription>
          Verhoog je maandelijkse scan capaciteit met volume pakketten
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current usage */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Gebruik ({currentPeriod})</span>
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
              <span className="text-muted-foreground">Extra pakketten:</span>
              <span className="font-medium text-primary">+{extraScans.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Warning alerts */}
        {isWarning && !isCritical && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Je hebt al {usagePercentage.toFixed(0)}% van je paginalimiet gebruikt. Overweeg een volume pakket.
            </AlertDescription>
          </Alert>
        )}

        {isCritical && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Je hebt bijna je paginalimiet bereikt ({usagePercentage.toFixed(0)}%)! Koop extra capaciteit om door te kunnen scannen.
            </AlertDescription>
          </Alert>
        )}

        {/* Active packages (legacy + new) */}
        {activePagePacks.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Actieve pakketten</h4>
            {activePagePacks.map(addon => (
              <div key={addon.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="font-medium text-sm">{ADDON_NAMES[addon.type]}</p>
                    <p className="text-xs text-muted-foreground">
                      €{Number(addon.totalPrice).toFixed(2)}/maand
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
          <h4 className="text-sm font-medium">Beschikbare volume pakketten</h4>
          {isTrial ? (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Upgrade naar een betaald plan om volume pakketten te kunnen kopen.
                <a href="/pricing" className="ml-2 underline font-medium">
                  Bekijk plannen →
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
                        <p className="font-medium">+{pkg.pages.toLocaleString()} pages/maand</p>
                        {isActive && <Badge variant="secondary">Actief</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground">{ADDON_PRICING[pkg.type].description}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="font-bold">€{pkg.price}</p>
                        <p className="text-xs text-muted-foreground">/maand</p>
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
              {error.includes("betaalmethode") && (
                <Button
                  variant="outline"
                  size="sm"
                  className="ml-4"
                  onClick={() => window.location.href = "/settings/billing"}
                >
                  Betaalmethode instellen
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
