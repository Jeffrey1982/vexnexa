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
}

const SCAN_PACKAGES = [
  { type: "SCAN_PACK_100" as AddOnType, scans: 100, price: 19 },
  { type: "SCAN_PACK_500" as AddOnType, scans: 500, price: 69 },
  { type: "SCAN_PACK_1500" as AddOnType, scans: 1500, price: 179 },
]

export function ScanPackagesCard({
  baseScans,
  extraScans,
  usedScans,
  currentPeriod,
  addOns,
  onRefresh
}: ScanPackagesCardProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const totalScans = baseScans + extraScans
  const usagePercentage = (usedScans / totalScans) * 100
  const isWarning = usagePercentage >= 80
  const isCritical = usagePercentage >= 95

  const activeScanPacks = addOns.filter(a =>
    a.type !== "EXTRA_SEAT" && a.status === "active"
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
      if (!response.ok) throw new Error(data.error || "Failed to purchase scan package")
      setSuccess(data.message)

      setTimeout(() => {
        onRefresh()
        setSuccess(null)
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to purchase scan package")
    } finally {
      setLoading(null)
    }
  }

  const handleCancel = async (addonId: string) => {
    const confirmed = confirm("Wil je dit scan pakket annuleren? Toegang blijft tot einde van de huidige betaalperiode.")
    if (!confirmed) return

    setLoading(addonId)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch(`/api/billing/addons/${addonId}`, {
        method: "DELETE"
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Failed to cancel scan package")
      setSuccess(data.message)

      setTimeout(() => {
        onRefresh()
        setSuccess(null)
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel scan package")
    } finally {
      setLoading(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Scan Paketten
        </CardTitle>
        <CardDescription>
          Verhoog je maandelijkse scan limiet met extra pakketten
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current usage */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Gebruik ({currentPeriod})</span>
            <span className="text-sm font-medium">
              {usedScans.toLocaleString()} / {totalScans.toLocaleString()} scans
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
              Je hebt al {usagePercentage.toFixed(0)}% van je scans gebruikt. Overweeg een extra pakket.
            </AlertDescription>
          </Alert>
        )}

        {isCritical && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Je hebt bijna je scan limiet bereikt ({usagePercentage.toFixed(0)}%)! Koop extra scans om door te kunnen gaan.
            </AlertDescription>
          </Alert>
        )}

        {/* Active packages */}
        {activeScanPacks.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Actieve pakketten</h4>
            {activeScanPacks.map(addon => (
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

        {/* Available packages */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Beschikbare pakketten</h4>
          <div className="grid gap-2">
            {SCAN_PACKAGES.map(pkg => {
              const isActive = activeScanPacks.some(a => a.type === pkg.type)
              const pricing = ADDON_PRICING[pkg.type]

              return (
                <div
                  key={pkg.type}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    isActive ? "bg-muted opacity-60" : "bg-card"
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">+{pkg.scans.toLocaleString()} scans</p>
                      {isActive && <Badge variant="secondary">Actief</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">{pricing.description}</p>
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
        </div>

        {/* Alerts */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
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
