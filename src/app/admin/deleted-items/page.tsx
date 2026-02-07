'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client-new'

interface DeletedItem {
  id: string
  type: 'user' | 'site' | 'scan' | 'portfolio'
  name: string
  email?: string
  url?: string
  deletedAt: string
  deletedBy: string
  metadata: any
}

export default function DeletedItemsPage() {
  const router = useRouter()
  const [items, setItems] = useState<DeletedItem[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [filterType, setFilterType] = useState('')
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  useEffect(() => {
    checkAdminAndLoadData()
  }, [filterType])

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
      await loadDeletedItems()
    } catch (error) {
      console.error('Error checking admin status:', error)
      setLoading(false)
    }
  }

  const loadDeletedItems = async () => {
    try {
      setLoading(true)

      // For now, show a placeholder message since soft-delete is disabled
      // When soft-delete is implemented, this will fetch from the API
      setItems([])
    } catch (error) {
      console.error('Error loading deleted items:', error)
    } finally {
      setLoading(false)
    }
  }

  const restoreItem = async (itemId: string, itemType: string) => {
    if (!confirm('Are you sure you want to restore this item?')) {
      return
    }

    try {
      const response = await fetch('/api/admin/restore-item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId, itemType }),
      })

      if (response.ok) {
        setMessage({ type: 'success', text: 'Item restored successfully' })
        await loadDeletedItems()
      } else {
        const data = await response.json()
        setMessage({ type: 'error', text: data.error || 'Failed to restore item' })
      }
    } catch (error) {
      console.error('Error restoring item:', error)
      setMessage({ type: 'error', text: 'Error restoring item' })
    }
  }

  const permanentlyDelete = async (itemId: string, itemType: string) => {
    if (!confirm('Are you sure you want to PERMANENTLY delete this item? This action cannot be undone!')) {
      return
    }

    try {
      const response = await fetch('/api/admin/permanent-delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId, itemType }),
      })

      if (response.ok) {
        setMessage({ type: 'success', text: 'Item permanently deleted' })
        await loadDeletedItems()
      } else {
        const data = await response.json()
        setMessage({ type: 'error', text: data.error || 'Failed to delete item' })
      }
    } catch (error) {
      console.error('Error deleting item:', error)
      setMessage({ type: 'error', text: 'Error deleting item' })
    }
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

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      user: 'bg-blue-100 text-blue-800',
      site: 'bg-green-100 text-green-800',
      scan: 'bg-purple-100 text-purple-800',
      portfolio: 'bg-yellow-100 text-yellow-800',
    }

    return (
      <span className={`px-2 py-1 rounded text-xs font-medium uppercase ${colors[type] || 'bg-gray-100 text-gray-800'}`}>
        {type}
      </span>
    )
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
        <h1 className="text-3xl font-bold mb-8">Deleted Items Recovery</h1>

        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-100 text-green-800 border border-green-200'
              : 'bg-red-100 text-red-800 border border-red-200'
          }`}>
            <p className="font-medium">{message.text}</p>
          </div>
        )}

        {/* Notice about soft-delete */}
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>Note:</strong> Soft-delete functionality is currently disabled pending database migration.
                When enabled, deleted items will appear here and can be restored within 30 days.
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Type
              </label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Types</option>
                <option value="user">Users</option>
                <option value="site">Sites</option>
                <option value="scan">Scans</option>
                <option value="portfolio">Portfolios</option>
              </select>
            </div>
          </div>
        </div>

        {/* Deleted Items Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {items.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No deleted items found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Type</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Name/Email</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Deleted At</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Deleted By</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        {getTypeBadge(item.type)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm font-medium text-gray-900">
                          {item.email || item.name}
                        </div>
                        {item.url && (
                          <div className="text-xs text-gray-500">{item.url}</div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {formatDate(item.deletedAt)}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {item.deletedBy}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => restoreItem(item.id, item.type)}
                            className="px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors text-sm"
                          >
                            Restore
                          </button>
                          <button
                            onClick={() => permanentlyDelete(item.id, item.type)}
                            className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors text-sm"
                          >
                            Delete Forever
                          </button>
                        </div>
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
