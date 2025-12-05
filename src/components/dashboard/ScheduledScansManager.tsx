'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Calendar, Clock, Globe, Trash2, Edit2, Power } from 'lucide-react'

interface ScheduledScan {
  id: string
  siteId: string
  site: {
    id: string
    url: string
  }
  frequency: string
  dayOfWeek: number | null
  dayOfMonth: number | null
  timeOfDay: string
  active: boolean
  lastRunAt: string | null
  nextRunAt: string | null
  emailOnComplete: boolean
  emailOnIssues: boolean
  createdAt: string
}

export function ScheduledScansManager() {
  const [scheduledScans, setScheduledScans] = useState<ScheduledScan[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadScheduledScans()
  }, [])

  const loadScheduledScans = async () => {
    try {
      const res = await fetch('/api/scheduled-scans')
      if (res.ok) {
        const data = await res.json()
        setScheduledScans(data.data.scheduledScans || [])
      }
    } catch (error) {
      console.error('Error loading scheduled scans:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleActive = async (id: string, active: boolean) => {
    try {
      const res = await fetch(`/api/scheduled-scans/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !active })
      })

      if (res.ok) {
        await loadScheduledScans()
      }
    } catch (error) {
      console.error('Error toggling scheduled scan:', error)
    }
  }

  const deleteScheduledScan = async (id: string) => {
    if (!confirm('Are you sure you want to delete this scheduled scan?')) return

    try {
      const res = await fetch(`/api/scheduled-scans/${id}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        await loadScheduledScans()
      }
    } catch (error) {
      console.error('Error deleting scheduled scan:', error)
    }
  }

  const getFrequencyLabel = (scan: ScheduledScan) => {
    if (scan.frequency === 'daily') return 'Daily'
    if (scan.frequency === 'weekly') {
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
      return `Weekly on ${days[scan.dayOfWeek || 0]}`
    }
    if (scan.frequency === 'monthly') {
      return `Monthly on day ${scan.dayOfMonth}`
    }
    return scan.frequency
  }

  if (loading) {
    return <div className="text-center py-8">Loading scheduled scans...</div>
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Scheduled Scans
            </CardTitle>
            <CardDescription>
              Automate accessibility scans for your sites
            </CardDescription>
          </div>
          <Button size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Schedule
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {scheduledScans.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Scheduled Scans</h3>
            <p className="text-muted-foreground mb-4 max-w-sm mx-auto">
              Set up automated scans to monitor your sites continuously
            </p>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Schedule
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {scheduledScans.map((scan) => (
              <div
                key={scan.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Globe className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">{scan.site.url}</span>
                    <Badge variant={scan.active ? 'default' : 'secondary'}>
                      {scan.active ? 'Active' : 'Paused'}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {getFrequencyLabel(scan)}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {scan.timeOfDay}
                    </div>
                    {scan.nextRunAt && (
                      <div>
                        Next: {new Date(scan.nextRunAt).toLocaleString()}
                      </div>
                    )}
                    {scan.lastRunAt && (
                      <div>
                        Last: {new Date(scan.lastRunAt).toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleActive(scan.id, scan.active)}
                  >
                    <Power className={`w-4 h-4 ${scan.active ? 'text-green-600' : 'text-gray-400'}`} />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => deleteScheduledScan(scan.id)}
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
