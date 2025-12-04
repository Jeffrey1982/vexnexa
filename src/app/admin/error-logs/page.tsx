'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface ErrorData {
  message: string
  note: string
  placeholder: {
    totalErrors24h: number
    criticalErrors: number
    recentErrors: any[]
  }
}

export default function ErrorLogsPage() {
  const router = useRouter()
  const [errorData, setErrorData] = useState<ErrorData | null>(null)
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
      await loadErrorData()
    } catch (error) {
      console.error('Error checking admin status:', error)
      setLoading(false)
    }
  }

  const loadErrorData = async () => {
    try {
      const response = await fetch('/api/admin/system/errors')

      if (response.ok) {
        const data = await response.json()
        setErrorData(data.data)
      }
    } catch (error) {
      console.error('Error loading error data:', error)
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
        <h1 className="text-3xl font-bold mb-8">Application Error Logs</h1>

        {/* Notice */}
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                {errorData?.note || 'Error tracking not yet configured. Integrate with Sentry or DataDog for production error monitoring'}
              </p>
            </div>
          </div>
        </div>

        {/* Current Statistics */}
        {errorData && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold mb-4">Error Summary (Last 24h)</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                  <div>
                    <div className="text-sm text-gray-600">Total Errors</div>
                    <div className="text-2xl font-bold text-red-600">
                      {errorData.placeholder.totalErrors24h}
                    </div>
                  </div>
                  <div className="text-3xl">🔴</div>
                </div>
                <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
                  <div>
                    <div className="text-sm text-gray-600">Critical Errors</div>
                    <div className="text-2xl font-bold text-orange-600">
                      {errorData.placeholder.criticalErrors}
                    </div>
                  </div>
                  <div className="text-3xl">⚠️</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold mb-4">Error Rate Trends</h2>
              <div className="space-y-4">
                <div className="p-4 bg-green-50 rounded-lg text-center">
                  <div className="text-sm text-gray-600 mb-2">System Status</div>
                  <div className="text-xl font-bold text-green-600">Healthy</div>
                  <div className="text-xs text-gray-500 mt-1">No error tracking configured</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recent Errors */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Recent Errors</h2>
          {errorData?.placeholder.recentErrors.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No recent errors logged
            </div>
          ) : (
            <div className="space-y-3">
              {errorData?.placeholder.recentErrors.map((error, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded">
                          ERROR
                        </span>
                        <span className="text-sm text-gray-500">{error.timestamp}</span>
                      </div>
                      <div className="font-medium text-gray-900 mb-1">{error.message}</div>
                      <div className="text-sm text-gray-600">{error.stack}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Implementation Guide */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4">Implementing Error Tracking</h2>
          <div className="prose max-w-none">
            <p className="text-gray-600 mb-4">
              To implement comprehensive error tracking and monitoring:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-3 text-gray-900">Sentry Integration</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
                  <li>Install Sentry SDK: <code className="bg-gray-100 px-2 py-1 rounded">npm install @sentry/nextjs</code></li>
                  <li>Run setup wizard: <code className="bg-gray-100 px-2 py-1 rounded">npx @sentry/wizard -i nextjs</code></li>
                  <li>Configure DSN in environment variables</li>
                  <li>Add error boundaries to catch React errors</li>
                  <li>Set up source maps for production debugging</li>
                </ol>
              </div>

              <div>
                <h3 className="font-semibold mb-3 text-gray-900">DataDog Integration</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
                  <li>Install DataDog browser SDK</li>
                  <li>Configure RUM (Real User Monitoring)</li>
                  <li>Set up log collection</li>
                  <li>Create custom dashboards</li>
                  <li>Configure alerting rules</li>
                </ol>
              </div>
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold mb-2 text-blue-900">Benefits of Error Tracking:</h3>
              <ul className="list-disc list-inside text-sm text-blue-800 space-y-1">
                <li>Real-time error notifications</li>
                <li>Stack traces with source maps</li>
                <li>User context and session replay</li>
                <li>Performance monitoring</li>
                <li>Release tracking and trend analysis</li>
                <li>Integration with issue trackers</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
