'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client-new'

interface AuditLog {
  id: string
  action: string
  entity: string
  entityId: string | null
  description: string
  actorId: string | null
  actorEmail: string | null
  actorType: string
  ip: string | null
  userAgent: string | null
  metadata: any
  oldValues: any
  newValues: any
  createdAt: string
}

export default function AuditLogsPage() {
  const router = useRouter()
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [filterAction, setFilterAction] = useState('')
  const [filterEntity, setFilterEntity] = useState('')
  const [searchEmail, setSearchEmail] = useState('')

  useEffect(() => {
    checkAdminAndLoadData()
  }, [page, filterAction, filterEntity, searchEmail])

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
        limit: '50',
        ...(filterAction && { action: filterAction }),
        ...(filterEntity && { entity: filterEntity }),
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

  const getActionBadge = (action: string, actorType: string) => {
    const actionColors: Record<string, string> = {
      created: 'bg-green-100 text-green-800',
      updated: 'bg-blue-100 text-blue-800',
      deleted: 'bg-red-100 text-red-800',
      suspended: 'bg-yellow-100 text-yellow-800',
      activated: 'bg-green-100 text-green-800',
    }

    const actorColors: Record<string, string> = {
      user: 'bg-blue-100 text-blue-800',
      admin: 'bg-purple-100 text-purple-800',
      system: 'bg-gray-100 text-gray-800',
      api: 'bg-cyan-100 text-cyan-800',
    }

    const actionColor = actionColors[action.toLowerCase().split('.')[0]] || 'bg-gray-100 text-gray-800'
    const actorColor = actorColors[actorType] || 'bg-gray-100 text-gray-800'

    return (
      <div className="flex flex-col gap-1">
        <span className={`px-2 py-1 rounded text-xs font-medium ${actionColor}`}>
          {action}
        </span>
        <span className={`px-2 py-1 rounded text-xs font-medium ${actorColor}`}>
          {actorType.toUpperCase()}
        </span>
      </div>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Action
              </label>
              <input
                type="text"
                placeholder="e.g., user.created, site.updated"
                value={filterAction}
                onChange={(e) => {
                  setFilterAction(e.target.value)
                  setPage(1)
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Entity
              </label>
              <select
                value={filterEntity}
                onChange={(e) => {
                  setFilterEntity(e.target.value)
                  setPage(1)
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Entities</option>
                <option value="User">User</option>
                <option value="Site">Site</option>
                <option value="Scan">Scan</option>
                <option value="Subscription">Subscription</option>
                <option value="Team">Team</option>
                <option value="Settings">Settings</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search by Actor Email
              </label>
              <input
                type="email"
                placeholder="admin@example.com"
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
            <div className="p-8 text-center text-muted-foreground">
              No audit logs found
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Timestamp</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Action / Actor</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Entity</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Actor</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Description</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Changes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr key={log.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm text-muted-foreground whitespace-nowrap">
                          {formatDate(log.createdAt)}
                        </td>
                        <td className="py-3 px-4">
                          {getActionBadge(log.action, log.actorType)}
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-sm font-medium text-gray-900">{log.entity}</div>
                          {log.entityId && (
                            <div className="text-xs text-muted-foreground font-mono">
                              ID: {log.entityId.substring(0, 8)}...
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-sm text-gray-900">{log.actorEmail || 'System'}</div>
                          {log.ip && (
                            <div className="text-xs text-muted-foreground">
                              IP: {log.ip}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">
                          {log.description}
                        </td>
                        <td className="py-3 px-4 text-xs">
                          {(log.oldValues || log.newValues) && (
                            <details className="cursor-pointer">
                              <summary className="text-blue-600 hover:underline">View</summary>
                              <div className="mt-2 space-y-2">
                                {log.oldValues && (
                                  <div>
                                    <div className="font-semibold text-gray-700">Before:</div>
                                    <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
                                      {JSON.stringify(log.oldValues, null, 2)}
                                    </pre>
                                  </div>
                                )}
                                {log.newValues && (
                                  <div>
                                    <div className="font-semibold text-gray-700">After:</div>
                                    <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
                                      {JSON.stringify(log.newValues, null, 2)}
                                    </pre>
                                  </div>
                                )}
                              </div>
                            </details>
                          )}
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
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:bg-[var(--vn-disabled-bg)] disabled:text-[var(--vn-disabled-fg)] disabled:opacity-100 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-muted-foreground">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:bg-[var(--vn-disabled-bg)] disabled:text-[var(--vn-disabled-fg)] disabled:opacity-100 disabled:cursor-not-allowed"
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
