'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client-new'

interface AdminUser {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  createdAt: string
  updatedAt: string
}

export default function AdminRolesPage() {
  const router = useRouter()
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [searchEmail, setSearchEmail] = useState('')
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

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
      await loadAdminUsers()
    } catch (error) {
      console.error('Error checking admin status:', error)
      setLoading(false)
    }
  }

  const loadAdminUsers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/manage-admin-role')

      if (response.ok) {
        const data = await response.json()
        setAdminUsers(data.data || [])
      } else {
        setMessage({ type: 'error', text: 'Failed to load admin users' })
      }
    } catch (error) {
      console.error('Error loading admin users:', error)
      setMessage({ type: 'error', text: 'Error loading admin users' })
    } finally {
      setLoading(false)
    }
  }

  const searchUser = async () => {
    if (!searchEmail.trim()) {
      setMessage({ type: 'error', text: 'Please enter an email address' })
      return
    }

    try {
      const response = await fetch(`/api/admin/search-user?email=${encodeURIComponent(searchEmail)}`)

      if (response.ok) {
        const data = await response.json()
        if (data.data) {
          return data.data
        } else {
          setMessage({ type: 'error', text: 'User not found' })
          return null
        }
      } else {
        setMessage({ type: 'error', text: 'Failed to search user' })
        return null
      }
    } catch (error) {
      console.error('Error searching user:', error)
      setMessage({ type: 'error', text: 'Error searching user' })
      return null
    }
  }

  const grantAdminRole = async () => {
    const user = await searchUser()
    if (!user) return

    try {
      const response = await fetch('/api/admin/manage-admin-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, action: 'grant' }),
      })

      if (response.ok) {
        setMessage({ type: 'success', text: `Admin role granted to ${user.email}` })
        setSearchEmail('')
        await loadAdminUsers()
      } else {
        const data = await response.json()
        setMessage({ type: 'error', text: data.error || 'Failed to grant admin role' })
      }
    } catch (error) {
      console.error('Error granting admin role:', error)
      setMessage({ type: 'error', text: 'Error granting admin role' })
    }
  }

  const revokeAdminRole = async (userId: string, email: string) => {
    if (!confirm(`Are you sure you want to revoke admin role from ${email}?`)) {
      return
    }

    try {
      const response = await fetch('/api/admin/manage-admin-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action: 'revoke' }),
      })

      if (response.ok) {
        setMessage({ type: 'success', text: `Admin role revoked from ${email}` })
        await loadAdminUsers()
      } else {
        const data = await response.json()
        setMessage({ type: 'error', text: data.error || 'Failed to revoke admin role' })
      }
    } catch (error) {
      console.error('Error revoking admin role:', error)
      setMessage({ type: 'error', text: 'Error revoking admin role' })
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
        <h1 className="text-3xl font-bold mb-8">Admin Role Management</h1>

        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-100 text-green-800 border border-green-200'
              : 'bg-red-100 text-red-800 border border-red-200'
          }`}>
            <p className="font-medium">{message.text}</p>
          </div>
        )}

        {/* Grant Admin Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Grant Admin Role</h2>
          <div className="flex gap-4">
            <input
              type="email"
              placeholder="Enter user email"
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyPress={(e) => e.key === 'Enter' && grantAdminRole()}
            />
            <button
              onClick={grantAdminRole}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Grant Admin
            </button>
          </div>
        </div>

        {/* Current Admins List */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Current Admin Users</h2>

          {adminUsers.length === 0 ? (
            <p className="text-gray-500">No admin users found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Email</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Name</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Admin Since</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {adminUsers.map((admin) => (
                    <tr key={admin.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">{admin.email}</td>
                      <td className="py-3 px-4">
                        {admin.firstName || admin.lastName
                          ? `${admin.firstName || ''} ${admin.lastName || ''}`.trim()
                          : '-'
                        }
                      </td>
                      <td className="py-3 px-4">
                        {new Date(admin.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => revokeAdminRole(admin.id, admin.email)}
                          className="px-4 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors text-sm"
                        >
                          Revoke
                        </button>
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
