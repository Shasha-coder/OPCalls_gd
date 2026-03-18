/**
 * /admin/organizations - Organization Management
 */

'use client'

import { useState, useEffect } from 'react'
import { useRequireAdmin } from '@/hooks/useSetupStatus'
import { useAuthStore } from '@/store/auth'

interface Organization {
  id: string
  name: string
  setup_status: string
  subscription_tier: string
  created_at: string
  profiles: { id: string; full_name: string; email: string }[]
  subscriptions: { status: string }[]
}

export default function AdminOrganizations() {
  const { loading: authLoading, isAdmin } = useRequireAdmin()
  const { user } = useAuthStore()
  
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedOrg, setSelectedOrg] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  
  useEffect(() => {
    if (user && isAdmin) {
      fetchOrganizations()
    }
  }, [user, isAdmin, page, search, statusFilter])
  
  const fetchOrganizations = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(search && { search }),
        ...(statusFilter && { status: statusFilter }),
      })
      
      const response = await fetch(`/api/admin/organizations?${params}`)
      
      if (response.ok) {
        const data = await response.json()
        setOrganizations(data.organizations || [])
        setTotalPages(data.pagination?.totalPages || 1)
      }
    } catch (error) {
      console.error('Failed to fetch organizations:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const handleAction = async (orgId: string, action: string, data?: any) => {
    setActionLoading(true)
    try {
      const response = await fetch('/api/admin/organizations', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orgId, action, data }),
      })
      
      if (response.ok) {
        fetchOrganizations()
      }
    } catch (error) {
      console.error('Action failed:', error)
    } finally {
      setActionLoading(false)
    }
  }
  
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <a href="/admin" className="text-slate-400 hover:text-white">← Back</a>
              <span className="text-xl font-semibold text-white">Organizations</span>
            </div>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="flex-1 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
            className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="onboarding">Onboarding</option>
            <option value="provisioning">Provisioning</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
        
        {/* Table */}
        <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-800">
              <tr>
                <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Organization</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Owner</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Status</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Tier</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium text-sm">Created</th>
                <th className="text-right px-4 py-3 text-slate-400 font-medium text-sm">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    Loading...
                  </td>
                </tr>
              ) : organizations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    No organizations found
                  </td>
                </tr>
              ) : (
                organizations.map(org => (
                  <tr key={org.id} className="hover:bg-slate-800/50">
                    <td className="px-4 py-3">
                      <p className="text-white font-medium">{org.name}</p>
                      <p className="text-slate-500 text-xs">{org.id}</p>
                    </td>
                    <td className="px-4 py-3">
                      {org.profiles?.[0] && (
                        <div>
                          <p className="text-white text-sm">{org.profiles[0].full_name}</p>
                          <p className="text-slate-400 text-xs">{org.profiles[0].email}</p>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={org.setup_status} />
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-slate-300 capitalize">{org.subscription_tier}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-sm">
                      {new Date(org.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex gap-2 justify-end">
                        {org.setup_status === 'suspended' ? (
                          <button
                            onClick={() => handleAction(org.id, 'reactivate')}
                            disabled={actionLoading}
                            className="text-xs px-3 py-1 bg-green-500/20 text-green-400 rounded hover:bg-green-500/30 disabled:opacity-50"
                          >
                            Reactivate
                          </button>
                        ) : (
                          <button
                            onClick={() => handleAction(org.id, 'suspend', { reason: 'Admin action' })}
                            disabled={actionLoading}
                            className="text-xs px-3 py-1 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 disabled:opacity-50"
                          >
                            Suspend
                          </button>
                        )}
                        <button
                          onClick={() => window.open(`/admin/organizations/${org.id}`, '_blank')}
                          className="text-xs px-3 py-1 bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/30"
                        >
                          View
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="flex items-center justify-between mt-4">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 bg-slate-800 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-slate-400">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 bg-slate-800 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </main>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending: 'bg-yellow-500/20 text-yellow-400',
    onboarding: 'bg-blue-500/20 text-blue-400',
    provisioning: 'bg-purple-500/20 text-purple-400',
    active: 'bg-green-500/20 text-green-400',
    suspended: 'bg-red-500/20 text-red-400',
  }
  
  return (
    <span className={`text-xs px-2 py-1 rounded ${colors[status] || colors.pending}`}>
      {status}
    </span>
  )
}
