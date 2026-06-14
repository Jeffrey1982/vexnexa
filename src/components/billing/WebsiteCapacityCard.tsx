"use client"

import { useState } from "react"
import { AddOnType } from "@prisma/client"
import { CheckCircle, Globe, Loader2, ShoppingCart, X } from "lucide-react"
import { ADDON_NAMES, ADDON_PRICING } from "@/lib/billing/addons"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface WebsiteCapacityCardProps {
  baseSites: number
  extraSites: number
  usedSites: number
  addOns: Array<{
    id: string
    type: AddOnType
    quantity: number
    status: string
    totalPrice: number
  }>
  onRefresh: () => void
}

const WEBSITE_PACK_TYPES: AddOnType[] = [
  "EXTRA_WEBSITE_1",
  "EXTRA_WEBSITE_5",
  "EXTRA_WEBSITE_10",
]

export function WebsiteCapacityCard({
  baseSites,
  extraSites,
  usedSites,
  addOns,
  onRefresh,
}: WebsiteCapacityCardProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const totalSites = baseSites + extraSites
  const usagePercentage = totalSites > 0 ? Math.min(100, (usedSites / totalSites) * 100) : 0
  const activePacks = addOns.filter(
    (addOn) => WEBSITE_PACK_TYPES.includes(addOn.type) && addOn.status === "active",
  )

  const refreshAfterFeedback = () => {
    window.setTimeout(() => {
      onRefresh()
      setSuccess(null)
    }, 1500)
  }

  const handlePurchase = async (type: AddOnType) => {
    setLoading(type)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch("/api/billing/addons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, quantity: 1 }),
      })
      const data = await response.json()

      if (!response.ok) {
        if (data.redirectUrl) {
          window.location.href = data.redirectUrl
          return
        }
        throw new Error(data.error || "Website package purchase failed")
      }

      setSuccess(data.message)
      refreshAfterFeedback()
    } catch (purchaseError) {
      setError(
        purchaseError instanceof Error
          ? purchaseError.message
          : "Website package purchase failed",
      )
    } finally {
      setLoading(null)
    }
  }

  const handleCancel = async (addOnId: string) => {
    if (!window.confirm("Cancel this website package? Your site limit will decrease immediately.")) {
      return
    }

    setLoading(addOnId)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch(`/api/billing/addons/${addOnId}`, {
        method: "DELETE",
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Website package cancellation failed")
      }

      setSuccess(data.message)
      refreshAfterFeedback()
    } catch (cancelError) {
      setError(
        cancelError instanceof Error
          ? cancelError.message
          : "Website package cancellation failed",
      )
    } finally {
      setLoading(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          Website capacity
        </CardTitle>
        <CardDescription>
          Add website slots without changing your current plan
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div>
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Sites in use</span>
            <span className="font-medium">
              {usedSites} / {totalSites}
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-secondary">
            <div
              className={`h-2 rounded-full ${
                usedSites >= totalSites ? "bg-destructive" : "bg-primary"
              }`}
              style={{ width: `${usagePercentage}%` }}
            />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">Included in plan</span>
              <span className="font-medium">{baseSites}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">Extra capacity</span>
              <span className="font-medium text-primary">+{extraSites}</span>
            </div>
          </div>
        </div>

        {activePacks.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Active packages</h3>
            {activePacks.map((addOn) => {
              const capacityAfterCancellation =
                totalSites - ADDON_PRICING[addOn.type].websites * addOn.quantity
              const capacityInUse = usedSites > capacityAfterCancellation

              return (
                <div
                  key={addOn.id}
                  className="flex items-center justify-between gap-4 rounded-lg border p-3"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <CheckCircle className="h-4 w-4 shrink-0 text-success" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{ADDON_NAMES[addOn.type]}</p>
                      <p className="text-xs text-muted-foreground">
                        €{Number(addOn.totalPrice).toFixed(2)}/month
                        {capacityInUse && " · Remove sites before cancelling"}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleCancel(addOn.id)}
                    disabled={capacityInUse || loading === addOn.id}
                    aria-label={`Cancel ${ADDON_NAMES[addOn.type]}`}
                    title={capacityInUse ? "This capacity is currently in use" : undefined}
                  >
                    {loading === addOn.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <X className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              )
            })}
          </div>
        )}

        <div className="space-y-2">
          <h3 className="text-sm font-medium">Available packages</h3>
          <div className="grid gap-2">
            {WEBSITE_PACK_TYPES.map((type) => {
              const pricing = ADDON_PRICING[type]
              const isActive = activePacks.some((addOn) => addOn.type === type)

              return (
                <div
                  key={type}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{ADDON_NAMES[type]}</p>
                      {isActive && <Badge variant="secondary">Active</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      €{pricing.pricePerUnit.toFixed(2)} per month, VAT included
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handlePurchase(type)}
                    disabled={isActive || loading === type}
                  >
                    {loading === type ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <ShoppingCart className="mr-2 h-4 w-4" />
                    )}
                    Add
                  </Button>
                </div>
              )
            })}
          </div>
        </div>

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
