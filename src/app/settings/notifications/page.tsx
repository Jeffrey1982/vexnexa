"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import {
  Mail,
  Bell,
  Users,
  TrendingUp,
  Shield,
  CheckCircle
} from 'lucide-react'
import DashboardNav from '@/components/dashboard/DashboardNav'
import DashboardFooter from '@/components/dashboard/DashboardFooter'
import { createClient } from '@/lib/supabase/client-new'

interface NotificationSettings {
  marketingEmails: boolean
  productUpdates: boolean
  securityAlerts: boolean
  teamInvitations: boolean
  scanNotifications: boolean
  weeklyReports: boolean
}

export default function NotificationSettingsPage() {
  const [authUser, setAuthUser] = useState<any>(null)
  const supabase = createClient()

  useEffect(() => {
    const getAuthUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setAuthUser(user)
    }
    getAuthUser()
  }, [supabase])

  const [settings, setSettings] = useState<NotificationSettings>({
    marketingEmails: true,
    productUpdates: true,
    securityAlerts: true,
    teamInvitations: true,
    scanNotifications: true,
    weeklyReports: false
  })
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/user/notification-settings')
      if (response.ok) {
        const data = await response.json()
        setSettings(data)
      }
    } catch (error) {
      console.error('Failed to load notification settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/user/notification-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      })

      if (response.ok) {
        toast({
          title: "Instellingen opgeslagen",
          description: "Je notificatie voorkeuren zijn bijgewerkt.",
        })
      } else {
        throw new Error('Failed to save settings')
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error saving",
        description: "Please try again later.",
      })
    } finally {
      setSaving(false)
    }
  }

  const updateSetting = (key: keyof NotificationSettings, value: boolean) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }))
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <DashboardNav user={authUser} />
      <div className="flex-1">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="max-w-2xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold tracking-tight">Notificatie instellingen</h1>
              <p className="text-muted-foreground mt-2">
                Beheer welke emails je wilt ontvangen van VexNexa
              </p>
            </div>

            <div className="space-y-6">
              {/* Marketing & Product Updates */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="w-5 h-5" />
                    Marketing & Product Updates
                  </CardTitle>
                  <CardDescription>
                    Informatie over nieuwe features, tips en bedrijfsupdates
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="marketingEmails">Marketing emails</Label>
                      <p className="text-sm text-muted-foreground">
                        Ontvang updates over nieuwe features en tips voor betere accessibility
                      </p>
                    </div>
                    <Switch
                      id="marketingEmails"
                      checked={settings.marketingEmails}
                      onCheckedChange={(checked) => updateSetting('marketingEmails', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="productUpdates">Product updates</Label>
                      <p className="text-sm text-muted-foreground">
                        Belangrijke updates over het VexNexa platform
                      </p>
                    </div>
                    <Switch
                      id="productUpdates"
                      checked={settings.productUpdates}
                      onCheckedChange={(checked) => updateSetting('productUpdates', checked)}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Security & Account */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Beveiliging & Account
                  </CardTitle>
                  <CardDescription>
                    Belangrijke beveiligingsmeldingen en account wijzigingen
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="securityAlerts">Beveiligingsalerts</Label>
                      <p className="text-sm text-muted-foreground">
                        Meldingen over inlogpogingen en beveiligingswijzigingen
                      </p>
                    </div>
                    <Switch
                      id="securityAlerts"
                      checked={settings.securityAlerts}
                      onCheckedChange={(checked) => updateSetting('securityAlerts', checked)}
                      disabled
                    />
                  </div>
                  <Alert>
                    <Shield className="w-4 h-4" />
                    <AlertDescription>
                      Beveiligingsalerts kunnen niet worden uitgeschakeld voor je veiligheid.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>

              {/* Platform Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="w-5 h-5" />
                    Platform activiteit
                  </CardTitle>
                  <CardDescription>
                    Meldingen over scans, teams en rapporten
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="teamInvitations">Team uitnodigingen</Label>
                      <p className="text-sm text-muted-foreground">
                        Ontvang meldingen wanneer je wordt uitgenodigd voor teams
                      </p>
                    </div>
                    <Switch
                      id="teamInvitations"
                      checked={settings.teamInvitations}
                      onCheckedChange={(checked) => updateSetting('teamInvitations', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="scanNotifications">Scan notificaties</Label>
                      <p className="text-sm text-muted-foreground">
                        Meldingen wanneer scans zijn voltooid of gefaald
                      </p>
                    </div>
                    <Switch
                      id="scanNotifications"
                      checked={settings.scanNotifications}
                      onCheckedChange={(checked) => updateSetting('scanNotifications', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="weeklyReports">Wekelijkse rapporten</Label>
                      <p className="text-sm text-muted-foreground">
                        Ontvang een samenvatting van je accessibility voortgang
                      </p>
                    </div>
                    <Switch
                      id="weeklyReports"
                      checked={settings.weeklyReports}
                      onCheckedChange={(checked) => updateSetting('weeklyReports', checked)}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Save Button */}
              <div className="flex justify-end pt-4">
                <Button
                  onClick={saveSettings}
                  disabled={saving}
                  className="min-w-[120px]"
                >
                  {saving ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                      Opslaan...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Opslaan
                    </div>
                  )}
                </Button>
              </div>

              {/* Unsubscribe Note */}
              <Card className="border-amber-200 bg-amber-50">
                <CardContent className="pt-6">
                  <p className="text-sm text-amber-800">
                    <strong>Let op:</strong> Je kunt je ook uitschrijven via de link onderaan elke email die we versturen.
                    Sommige emails (zoals beveiligingsalerts) kunnen niet worden uitgeschakeld voor je veiligheid.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
      <DashboardFooter />
    </div>
  )
}