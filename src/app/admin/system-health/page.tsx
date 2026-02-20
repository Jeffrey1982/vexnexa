'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client-new'

interface HealthData {
  status: string
  timestamp: string
  database: {
    status: string
    latency: number
    recordCounts: {
      users: number
      sites: number
      scans: number
      teams: number
    }
  }
  memory: {
    heapUsed: number
    heapTotal: number
    external: number
    rss: number
  }
  uptime: number
}

interface PerformanceData {
  timestamp: string
  database: {
    avgQueryTime: number
    slowQueries: number
    activeConnections: number
  }
  requests: {
    total: number
    successful: number
    failed: number
    avgResponseTime: number
  }
  resources: {
    cpuUsage: number
    memoryUsage: number
  }
}

export default function SystemHealthPage() {
  const router = useRouter()
  const [health, setHealth] = useState<HealthData | null>(null)
  const [performance, setPerformance] = useState<PerformanceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null)

  useEffect(() => {
    checkAdminAndLoadData()

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      loadHealthData()
      loadPerformanceData()
    }, 30000)

    setRefreshInterval(interval)

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [])

  const checkAdminAndLoadData = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth/login')
        return
      }

      // Check if user is admin
      const response = await fetch('/api/admin/system/health')
      if (response.status === 403) {
        router.push('/dashboard')
        return
      }

      setIsAdmin(true)
      await Promise.all([loadHealthData(), loadPerformanceData()])
    } catch (error) {
      console.error('Error checking admin status:', error)
      setLoading(false)
    }
  }

  const loadHealthData = async () => {
    try {
      const response = await fetch('/api/admin/system/health')

      if (response.ok) {
        const data = await response.json()
        setHealth(data.data)
      }
    } catch (error) {
      console.error('Error loading health data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadPerformanceData = async () => {
    try {
      const response = await fetch('/api/admin/system/performance')

      if (response.ok) {
        const data = await response.json()
        setPerformance(data.data)
      }
    } catch (error) {
      console.error('Error loading performance data:', error)
    }
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)

    if (days > 0) return `${days}d ${hours}h ${minutes}m`
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }

  const getStatusColor = (status: string) => {
    return status === 'healthy' ? 'text-green-600' : 'text-red-600'
  }

  const getStatusBadge = (status: string) => {
    return status === 'healthy'
      ? 'bg-green-100 text-green-800 border-green-200'
      : 'bg-red-100 text-red-800 border-red-200'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">System Health Dashboard</h1>
          <button
            onClick={() => {
              loadHealthData()
              loadPerformanceData()
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Refresh
          </button>
        </div>

        {/* Overall Status */}
        {health && (
          <div className={`rounded-lg border-2 p-6 mb-6 ${getStatusBadge(health.status)}`}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2">
                  System Status: <span className="uppercase">{health.status}</span>
                </h2>
                <p className="text-sm opacity-75">
                  Last updated: {new Date(health.timestamp).toLocaleString()}
                </p>
              </div>
              <div className="text-4xl">
                {health.status === 'healthy' ? '✅' : '❌'}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Database Health */}
          {health && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span className={getStatusColor(health.database.status)}>●</span>
                Database
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <span className="font-medium">{health.database.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Latency:</span>
                  <span className="font-medium">{health.database.latency}ms</span>
                </div>
                <div className="border-t pt-3 mt-3">
                  <div className="text-sm text-muted-foreground mb-2">Record Counts:</div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>Users: <span className="font-medium">{health.database.recordCounts.users}</span></div>
                    <div>Sites: <span className="font-medium">{health.database.recordCounts.sites}</span></div>
                    <div>Scans: <span className="font-medium">{health.database.recordCounts.scans}</span></div>
                    <div>Teams: <span className="font-medium">{health.database.recordCounts.teams}</span></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Memory Usage */}
          {health && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">Memory Usage</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Heap Used:</span>
                  <span className="font-medium">{formatBytes(health.memory.heapUsed)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Heap Total:</span>
                  <span className="font-medium">{formatBytes(health.memory.heapTotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">External:</span>
                  <span className="font-medium">{formatBytes(health.memory.external)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">RSS:</span>
                  <span className="font-medium">{formatBytes(health.memory.rss)}</span>
                </div>
                <div className="border-t pt-3 mt-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Uptime:</span>
                    <span className="font-medium">{formatUptime(health.uptime)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Performance Metrics */}
        {performance && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">Database Performance</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Avg Query Time:</span>
                  <span className="font-medium">{performance.database.avgQueryTime}ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Slow Queries:</span>
                  <span className="font-medium">{performance.database.slowQueries}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Active Connections:</span>
                  <span className="font-medium">{performance.database.activeConnections}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">Request Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Requests:</span>
                  <span className="font-medium">{performance.requests.total}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Successful:</span>
                  <span className="font-medium text-green-600">{performance.requests.successful}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Failed:</span>
                  <span className="font-medium text-red-600">{performance.requests.failed}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Avg Response:</span>
                  <span className="font-medium">{performance.requests.avgResponseTime}ms</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">Resource Usage</h3>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-muted-foreground">CPU Usage:</span>
                    <span className="font-medium">{performance.resources.cpuUsage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${performance.resources.cpuUsage}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-muted-foreground">Memory Usage:</span>
                    <span className="font-medium">{performance.resources.memoryUsage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{ width: `${performance.resources.memoryUsage}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 text-center text-sm text-muted-foreground">
          Auto-refreshes every 30 seconds
        </div>
      </div>
    </div>
  )
}
