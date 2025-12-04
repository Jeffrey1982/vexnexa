'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface AuditLog {
  id: string
  userId: string
  adminId: string
  eventType: string
  description: string
  metadata: any
  createdAt: string
  user: {
    email: string
    firstName: string | null
    lastName: string | null
  }
  admin: {
    email: string
    firstName: string | null
    lastName: string | null
  }
}

export default function AuditLogsPage() {
  const router = useRouter()
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [filterType, setFilterType] = useState('')
  const [searchEmail, setSearchEmail] = useState('')

  useEffect(() => {
    checkAdminAndLoadData()
  }, [page, filterType, searchEmail])

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
      await loadAuditLogs()
    } catch (error) {
      console.error('Error checking admin status:', error)
      setLoading(false)
    }
  }

  const loadAuditLogs = async () => {
    try {
      setLoading(true)

      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(filterType && { eventType: filterType }),
        ...(searchEmail && { email: searchEmail }),
      })

      const response = await fetch(`/api/admin/audit-logs?${params}`)

      if (response.ok) {
        const data = await response.json()
        setLogs(data.data.logs || [])
        setTotalPages(data.data.pagination.pages || 1)
      }
    } catch (error) {
      console.error('Error loading audit logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const getEventTypeBadge = (eventType: string) => {
    const colors: Record<string, string> = {
      MANUAL_ACTIVATION: 'bg-green-100 text-green-800',
      MANUAL_SUSPENSION: 'bg-red-100 text-red-800',
      PASSWORD_RESET: 'bg-yellow-100 text-yellow-800',
      EMAIL_VERIFIED: 'bg-blue-100 text-blue-800',
      IMPERSONATION: 'bg-purple-100 text-purple-800',
      ROLE_CHANGE: 'bg-indigo-100 text-indigo-800',
    }

    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${colors[eventType] || 'bg-gray-100 text-gray-800'}`}>
        {eventType.replace(/_/g, ' ')}
      </span>
    )
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading && logs.length === 0) {
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
        <h1 className="text-3xl font-bold mb-8">Audit Logs</h1>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Event Type
              </label>
              <select
                value={filterType}
                onChange={(e) => {
                  setFilterType(e.target.value)
                  setPage(1)
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Events</option>
                <option value="MANUAL_ACTIVATION">Manual Activation</option>
                <option value="MANUAL_SUSPENSION">Manual Suspension</option>
                <option value="PASSWORD_RESET">Password Reset</option>
                <option value="EMAIL_VERIFIED">Email Verified</option>
                <option value="IMPERSONATION">Impersonation</option>
                <option value="ROLE_CHANGE">Role Change</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search by Email
              </label>
              <input
                type="email"
                placeholder="user@example.com"
                value={searchEmail}
                onChange={(e) => {
                  setSearchEmail(e.target.value)
                  setPage(1)
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Audit Logs Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {logs.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No audit logs found
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Timestamp</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Event Type</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Target User</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Admin</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr key={log.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {formatDate(log.createdAt)}
                        </td>
                        <td className="py-3 px-4">
                          {getEventTypeBadge(log.eventType)}
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-sm font-medium text-gray-900">{log.user.email}</div>
                          {(log.user.firstName || log.user.lastName) && (
                            <div className="text-xs text-gray-500">
                              {`${log.user.firstName || ''} ${log.user.lastName || ''}`.trim()}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-sm text-gray-900">{log.admin.email}</div>
                          {(log.admin.firstName || log.admin.lastName) && (
                            <div className="text-xs text-gray-500">
                              {`${log.admin.firstName || ''} ${log.admin.lastName || ''}`.trim()}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {log.description}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-600">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
