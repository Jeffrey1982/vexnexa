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
      apiCalls: number
      apiErrors: number
      avgResponseTime: number
    }
    last7d: {
      scans: number
    }
  }
  topEndpoints: Array<{
    path: string
    method: string
    calls: number
  }>
}

interface ApiLog {
  id: string
  method: string
  path: string
  statusCode: number
  duration: number
  userEmail: string | null
  createdAt: string
  errorMessage: string | null
}

export default function ApiLogsPage() {
  const router = useRouter()
  const [stats, setStats] = useState<ApiStats | null>(null)
  const [recentLogs, setRecentLogs] = useState<ApiLog[]>([])
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
      const [statsRes, logsRes] = await Promise.all([
        fetch('/api/admin/system/api-stats'),
        fetch('/api/admin/system/api-logs?limit=50')
      ])

      if (statsRes.ok) {
        const data = await statsRes.json()
        setStats(data.data)
      }

      if (logsRes.ok) {
        const data = await logsRes.json()
        setRecentLogs(data.data.logs || [])
      }
    } catch (error) {
      console.error('Error loading API data:', error)
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

        {/* System Status */}
        {stats && stats.periods.last24h.apiCalls === 0 && (
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  No API requests logged yet. Use the logging helpers in src/lib/logging.ts to track API calls.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* API Performance Metrics */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold mb-4">Request Volume (24h)</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                  <div>
                    <div className="text-sm text-gray-600">Total API Calls</div>
                    <div className="text-2xl font-bold text-blue-600">{stats.periods.last24h.apiCalls}</div>
                  </div>
                  <div className="text-3xl">📡</div>
                </div>
                <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                  <div>
                    <div className="text-sm text-gray-600">Errors (4xx/5xx)</div>
                    <div className="text-2xl font-bold text-red-600">{stats.periods.last24h.apiErrors}</div>
                  </div>
                  <div className="text-3xl">⚠️</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold mb-4">Performance Metrics</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                  <div>
                    <div className="text-sm text-gray-600">Avg Response Time</div>
                    <div className="text-2xl font-bold text-green-600">{stats.periods.last24h.avgResponseTime}ms</div>
                  </div>
                  <div className="text-3xl">⚡</div>
                </div>
                <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                  <div>
                    <div className="text-sm text-gray-600">Error Rate</div>
                    <div className="text-2xl font-bold text-purple-600">
                      {stats.periods.last24h.apiCalls > 0
                        ? ((stats.periods.last24h.apiErrors / stats.periods.last24h.apiCalls) * 100).toFixed(1)
                        : '0.0'}%
                    </div>
                  </div>
                  <div className="text-3xl">📊</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold mb-4">Activity Summary</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
                  <div>
                    <div className="text-sm text-gray-600">New Users (24h)</div>
                    <div className="text-2xl font-bold text-orange-600">{stats.periods.last24h.newUsers}</div>
                  </div>
                  <div className="text-3xl">👥</div>
                </div>
                <div className="flex items-center justify-between p-4 bg-cyan-50 rounded-lg">
                  <div>
                    <div className="text-sm text-gray-600">Scans Run (24h)</div>
                    <div className="text-2xl font-bold text-cyan-600">{stats.periods.last24h.scans}</div>
                  </div>
                  <div className="text-3xl">🔍</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Top Endpoints */}
        {stats && stats.topEndpoints && stats.topEndpoints.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Top API Endpoints (Last 24h)</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Path</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requests</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {stats.topEndpoints.map((endpoint, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded ${
                          endpoint.method === 'GET' ? 'bg-blue-100 text-blue-800' :
                          endpoint.method === 'POST' ? 'bg-green-100 text-green-800' :
                          endpoint.method === 'PUT' ? 'bg-yellow-100 text-yellow-800' :
                          endpoint.method === 'DELETE' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {endpoint.method}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 font-mono">{endpoint.path}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{endpoint.calls}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Recent API Requests */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4">Recent API Requests</h2>
          {recentLogs.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No API requests logged yet</p>
              <div className="text-sm text-gray-400">
                Use <code className="bg-gray-100 px-2 py-1 rounded">logApiRequest()</code> from src/lib/logging.ts to track API calls
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Path</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded ${
                          log.method === 'GET' ? 'bg-blue-100 text-blue-800' :
                          log.method === 'POST' ? 'bg-green-100 text-green-800' :
                          log.method === 'PUT' ? 'bg-yellow-100 text-yellow-800' :
                          log.method === 'DELETE' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {log.method}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 font-mono">{log.path}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded ${
                          log.statusCode >= 500 ? 'bg-red-100 text-red-800' :
                          log.statusCode >= 400 ? 'bg-yellow-100 text-yellow-800' :
                          log.statusCode >= 300 ? 'bg-blue-100 text-blue-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {log.statusCode}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {log.duration}ms
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {log.userEmail || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
