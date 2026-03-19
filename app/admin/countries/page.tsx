'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Country {
  id: string
  code: string
  name: string
  dial_code: string
  flag_emoji: string
  supports_local: boolean
  supports_toll_free: boolean
  is_active: boolean
  sort_order: number
}

export default function AdminCountriesPage() {
  const [countries, setCountries] = useState<Country[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [newCountry, setNewCountry] = useState({
    code: '',
    name: '',
    dial_code: '',
    flag_emoji: '',
    supports_local: true,
    supports_toll_free: true,
  })
  const [showAddForm, setShowAddForm] = useState(false)

  const fetchCountries = useCallback(async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('supported_countries')
      .select('*')
      .order('sort_order', { ascending: true })
    
    if (!error && data) {
      setCountries(data)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchCountries()
  }, [fetchCountries])

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    setSaving(true)
    const supabase = createClient()
    await supabase
      .from('supported_countries')
      .update({ is_active: !currentActive })
      .eq('id', id)
    
    setCountries(prev => prev.map(c => 
      c.id === id ? { ...c, is_active: !currentActive } : c
    ))
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this country?')) return
    
    setSaving(true)
    const supabase = createClient()
    await supabase.from('supported_countries').delete().eq('id', id)
    setCountries(prev => prev.filter(c => c.id !== id))
    setSaving(false)
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCountry.code || !newCountry.name) return

    setSaving(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from('supported_countries')
      .insert({
        ...newCountry,
        is_active: true,
        sort_order: countries.length + 1,
      })
      .select()
      .single()

    if (!error && data) {
      setCountries(prev => [...prev, data])
      setNewCountry({ code: '', name: '', dial_code: '', flag_emoji: '', supports_local: true, supports_toll_free: true })
      setShowAddForm(false)
    }
    setSaving(false)
  }

  const handleUpdate = async (id: string, updates: Partial<Country>) => {
    setSaving(true)
    const supabase = createClient()
    await supabase
      .from('supported_countries')
      .update(updates)
      .eq('id', id)
    
    setCountries(prev => prev.map(c => 
      c.id === id ? { ...c, ...updates } : c
    ))
    setEditingId(null)
    setSaving(false)
  }

  const inputClasses = "px-3 py-2 bg-[#1a1a1a] border border-white/[0.08] rounded-lg text-white text-sm focus:outline-none focus:border-white/20 transition-all"

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Supported Countries</h1>
          <p className="text-white/40 mt-1">Manage countries available for phone number selection</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-white text-gray-900 rounded-xl font-medium hover:bg-white/90 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Country
        </button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <form onSubmit={handleAdd} className="bg-white/5 rounded-2xl border border-white/10 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Add New Country</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm text-white/50 mb-2">Country Code *</label>
              <input
                type="text"
                value={newCountry.code}
                onChange={e => setNewCountry(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                placeholder="US"
                maxLength={2}
                className={inputClasses + ' w-full'}
                required
              />
            </div>
            <div>
              <label className="block text-sm text-white/50 mb-2">Country Name *</label>
              <input
                type="text"
                value={newCountry.name}
                onChange={e => setNewCountry(prev => ({ ...prev, name: e.target.value }))}
                placeholder="United States"
                className={inputClasses + ' w-full'}
                required
              />
            </div>
            <div>
              <label className="block text-sm text-white/50 mb-2">Dial Code *</label>
              <input
                type="text"
                value={newCountry.dial_code}
                onChange={e => setNewCountry(prev => ({ ...prev, dial_code: e.target.value }))}
                placeholder="+1"
                className={inputClasses + ' w-full'}
                required
              />
            </div>
            <div>
              <label className="block text-sm text-white/50 mb-2">Flag Emoji</label>
              <input
                type="text"
                value={newCountry.flag_emoji}
                onChange={e => setNewCountry(prev => ({ ...prev, flag_emoji: e.target.value }))}
                placeholder="🇺🇸"
                className={inputClasses + ' w-full'}
              />
            </div>
          </div>
          <div className="flex items-center gap-6 mt-4">
            <label className="flex items-center gap-2 text-sm text-white/70 cursor-pointer">
              <input
                type="checkbox"
                checked={newCountry.supports_local}
                onChange={e => setNewCountry(prev => ({ ...prev, supports_local: e.target.checked }))}
                className="w-4 h-4 rounded border-white/20 bg-white/5 text-blue-500 focus:ring-0"
              />
              Supports Local Numbers
            </label>
            <label className="flex items-center gap-2 text-sm text-white/70 cursor-pointer">
              <input
                type="checkbox"
                checked={newCountry.supports_toll_free}
                onChange={e => setNewCountry(prev => ({ ...prev, supports_toll_free: e.target.checked }))}
                className="w-4 h-4 rounded border-white/20 bg-white/5 text-blue-500 focus:ring-0"
              />
              Supports Toll-Free
            </label>
          </div>
          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 border border-white/10 text-white/60 hover:text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-white text-gray-900 rounded-lg font-medium hover:bg-white/90 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Adding...' : 'Add Country'}
            </button>
          </div>
        </form>
      )}

      {/* Countries Table */}
      <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left px-6 py-4 text-sm font-medium text-white/50">Country</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-white/50">Dial Code</th>
              <th className="text-center px-6 py-4 text-sm font-medium text-white/50">Local</th>
              <th className="text-center px-6 py-4 text-sm font-medium text-white/50">Toll-Free</th>
              <th className="text-center px-6 py-4 text-sm font-medium text-white/50">Status</th>
              <th className="text-right px-6 py-4 text-sm font-medium text-white/50">Actions</th>
            </tr>
          </thead>
          <tbody>
            {countries.map(country => (
              <tr key={country.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{country.flag_emoji}</span>
                    <div>
                      <span className="font-medium text-white">{country.name}</span>
                      <span className="text-xs text-white/40 ml-2">({country.code})</span>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-white/70 font-mono">{country.dial_code}</td>
                <td className="px-6 py-4 text-center">
                  {country.supports_local ? (
                    <span className="text-emerald-400">Yes</span>
                  ) : (
                    <span className="text-white/30">No</span>
                  )}
                </td>
                <td className="px-6 py-4 text-center">
                  {country.supports_toll_free ? (
                    <span className="text-emerald-400">Yes</span>
                  ) : (
                    <span className="text-white/30">No</span>
                  )}
                </td>
                <td className="px-6 py-4 text-center">
                  <button
                    onClick={() => handleToggleActive(country.id, country.is_active)}
                    disabled={saving}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      country.is_active
                        ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                        : 'bg-white/5 text-white/40 hover:bg-white/10'
                    }`}
                  >
                    {country.is_active ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => setEditingId(editingId === country.id ? null : country.id)}
                      className="p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(country.id)}
                      className="p-2 text-white/40 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {countries.length === 0 && (
          <div className="text-center py-12 text-white/40">
            No countries configured. Add one to get started.
          </div>
        )}
      </div>
    </div>
  )
}
