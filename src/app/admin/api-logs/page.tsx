'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface ApiStats {
  timestamp: string
  periods: {
    last24h: {
      scans: number
      newSites: number
      newUsers: number
    }
    last7d: {
      scans: number
    }
  }
  note: string
}

export default function ApiLogsPage() {
  const router = useRouter()
  const [stats, setStats] = useState<ApiStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    checkAdminAndLoadData()
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
      await loadApiStats()
    } catch (error) {
      console.error('Error checking admin status:', error)
      setLoading(false)
    }
  }

  const loadApiStats = async () => {
    try {
      const response = await fetch('/api/admin/system/api-stats')

      if (response.ok) {
        const data = await response.json()
        setStats(data.data)
      }
    } catch (error) {
      console.error('Error loading API stats:', error)
    } finally {
      setLoading(false)
    }
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
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">API Request Logs</h1>

        {/* Notice */}
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                {stats?.note || 'For detailed API usage tracking, implement API logging middleware'}
              </p>
            </div>
          </div>
        </div>

        {/* Current Statistics */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold mb-4">Last 24 Hours</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                  <div>
                    <div className="text-sm text-gray-600">Scans Created</div>
                    <div className="text-2xl font-bold text-blue-600">{stats.periods.last24h.scans}</div>
                  </div>
                  <div className="text-3xl">📊</div>
                </div>
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                  <div>
                    <div className="text-sm text-gray-600">New Sites</div>
                    <div className="text-2xl font-bold text-green-600">{stats.periods.last24h.newSites}</div>
                  </div>
                  <div className="text-3xl">🌐</div>
                </div>
                <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                  <div>
                    <div className="text-sm text-gray-600">New Users</div>
                    <div className="text-2xl font-bold text-purple-600">{stats.periods.last24h.newUsers}</div>
                  </div>
                  <div className="text-3xl">👥</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold mb-4">Last 7 Days</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                  <div>
                    <div className="text-sm text-gray-600">Total Scans</div>
                    <div className="text-2xl font-bold text-blue-600">{stats.periods.last7d.scans}</div>
                  </div>
                  <div className="text-3xl">📈</div>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <div className="text-sm text-gray-600">Avg Scans/Day</div>
                    <div className="text-2xl font-bold text-gray-600">
                      {Math.round(stats.periods.last7d.scans / 7)}
                    </div>
                  </div>
                  <div className="text-3xl">📉</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Implementation Guide */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4">Implementing Full API Logging</h2>
          <div className="prose max-w-none">
            <p className="text-gray-600 mb-4">
              To implement comprehensive API request logging, consider the following steps:
            </p>
            <ol className="list-decimal list-inside space-y-2 text-gray-600">
              <li>Add API logging middleware to capture all requests</li>
              <li>Store logs in a dedicated database table or external service</li>
              <li>Include request details: method, path, status, response time, user ID</li>
              <li>Implement log aggregation and search functionality</li>
              <li>Add retention policies to manage log storage</li>
              <li>Set up monitoring and alerting for unusual patterns</li>
            </ol>
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold mb-2">Recommended Services:</h3>
              <ul className="list-disc list-inside text-sm text-gray-600">
                <li>Datadog APM - Application performance monitoring</li>
                <li>Sentry - Error tracking and performance monitoring</li>
                <li>LogRocket - Session replay and logging</li>
                <li>Papertrail - Log aggregation and search</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
