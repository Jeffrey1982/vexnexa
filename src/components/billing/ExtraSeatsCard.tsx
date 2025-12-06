"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Users, Plus, Minus, Loader2, CheckCircle, Info } from "lucide-react"
import { AddOnType } from "@prisma/client"
import { ADDON_PRICING } from "@/lib/billing/addons"

interface ExtraSeatsCardProps {
  baseSeats: number
  extraSeats: number
  usedSeats: number
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

export function ExtraSeatsCard({ baseSeats, extraSeats, usedSeats, addOns, onRefresh, isTrial = false }: ExtraSeatsCardProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const totalSeats = baseSeats + extraSeats
  const seatAddOn = addOns.find(a => a.type === "EXTRA_SEAT" && a.status === "active")
  const pricePerSeat = ADDON_PRICING.EXTRA_SEAT.pricePerUnit

  const handleAddSeat = async () => {
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      if (seatAddOn) {
        // Update existing add-on
        const response = await fetch(`/api/billing/addons/${seatAddOn.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ quantity: seatAddOn.quantity + 1 })
        })

        const data = await response.json()
        if (!response.ok) throw new Error(data.error || "Failed to add seat")
        setSuccess(data.message)
      } else {
        // Create new add-on
        const response = await fetch("/api/billing/addons", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "EXTRA_SEAT", quantity: 1 })
        })

        const data = await response.json()
        if (!response.ok) throw new Error(data.error || "Failed to add seat")
        setSuccess(data.message)
      }

      setTimeout(() => {
        onRefresh()
        setSuccess(null)
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add seat")
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveSeat = async () => {
    if (!seatAddOn || seatAddOn.quantity <= 1) {
      // Cancel the add-on entirely
      if (!seatAddOn) return

      const confirmed = confirm("Wil je alle extra seats annuleren?")
      if (!confirmed) return

      setLoading(true)
      setError(null)
      setSuccess(null)

      try {
        const response = await fetch(`/api/billing/addons/${seatAddOn.id}`, {
          method: "DELETE"
        })

        const data = await response.json()
        if (!response.ok) throw new Error(data.error || "Failed to cancel seats")
        setSuccess(data.message)

        setTimeout(() => {
          onRefresh()
          setSuccess(null)
        }, 2000)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to remove seat")
      } finally {
        setLoading(false)
      }
    } else {
      // Just reduce quantity
      setLoading(true)
      setError(null)
      setSuccess(null)

      try {
        const response = await fetch(`/api/billing/addons/${seatAddOn.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ quantity: seatAddOn.quantity - 1 })
        })

        const data = await response.json()
        if (!response.ok) throw new Error(data.error || "Failed to remove seat")
        setSuccess(data.message)

        setTimeout(() => {
          onRefresh()
          setSuccess(null)
        }, 2000)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to remove seat")
      } finally {
        setLoading(false)
      }
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Team & Seats
        </CardTitle>
        <CardDescription>
          Beheer team seats voor samenwerking
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current usage */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Basis seats</p>
            <p className="text-2xl font-bold">{baseSeats}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Extra seats</p>
            <p className="text-2xl font-bold text-primary">{extraSeats}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Totaal</p>
            <p className="text-2xl font-bold">{totalSeats}</p>
          </div>
        </div>

        {/* Usage bar */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">In gebruik</span>
            <span className="text-sm font-medium">
              {usedSeats} / {totalSeats} seats
            </span>
          </div>
          <div className="w-full bg-secondary rounded-full h-2">
            <div
              className={`rounded-full h-2 transition-all ${
                usedSeats >= totalSeats ? "bg-destructive" : "bg-primary"
              }`}
              style={{ width: `${Math.min(100, (usedSeats / totalSeats) * 100)}%` }}
            />
          </div>
        </div>

        {/* Pricing info */}
        <div className="bg-muted p-3 rounded-lg flex items-start gap-2">
          <Info className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
          <p className="text-sm text-muted-foreground">
            Extra seats kosten <span className="font-semibold">€{pricePerSeat.toFixed(2)} per seat per maand</span>.
            Je kunt seats toevoegen en verwijderen wanneer je wilt.
          </p>
        </div>

        {/* Actions */}
        {isTrial ? (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Upgrade naar een betaald plan om extra seats te kunnen kopen.
              <a href="/pricing" className="ml-2 underline font-medium">
                Bekijk plannen →
              </a>
            </AlertDescription>
          </Alert>
        ) : (
          <div className="flex gap-2">
            <Button
              onClick={handleAddSeat}
              disabled={loading}
              className="flex-1"
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              Seat toevoegen
            </Button>

            {extraSeats > 0 && (
              <Button
                onClick={handleRemoveSeat}
                disabled={loading}
                variant="outline"
                className="flex-1"
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Minus className="mr-2 h-4 w-4" />
                )}
                Seat verwijderen
              </Button>
            )}
          </div>
        )}

        {/* Current add-on info */}
        {seatAddOn && (
          <div className="pt-3 border-t">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Maandelijkse kosten:</span>
              <div className="flex items-center gap-2">
                <span className="font-semibold">€{Number(seatAddOn.totalPrice).toFixed(2)}/maand</span>
                <Badge variant={seatAddOn.status === "active" ? "default" : "secondary"}>
                  {seatAddOn.status}
                </Badge>
              </div>
            </div>
          </div>
        )}

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
