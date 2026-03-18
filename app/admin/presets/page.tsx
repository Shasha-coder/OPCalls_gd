'use client'

import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'

interface AgentPreset {
  id: string
  name: string
  description: string
  category: string
  icon_name: string
  color: string
  is_active: boolean
  display_order: number
  created_at: string
}

const CATEGORIES = ['Sales', 'Support', 'Industry', 'Booking', 'Nurture', 'Recovery']
const COLORS = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316']

export default function AdminPresetsPage() {
  const [presets, setPresets] = useState<AgentPreset[]>([
    { id: '1', name: 'Sales Closer', description: 'Convert leads into paying customers', category: 'Sales', icon_name: 'target', color: '#EF4444', is_active: true, display_order: 1, created_at: '2024-01-15' },
    { id: '2', name: 'Lead Qualifier', description: 'Pre-qualify leads automatically', category: 'Sales', icon_name: 'filter', color: '#F59E0B', is_active: true, display_order: 2, created_at: '2024-01-15' },
    { id: '3', name: 'Follow-up Agent', description: 'Smart follow-up sequences', category: 'Nurture', icon_name: 'repeat', color: '#8B5CF6', is_active: true, display_order: 3, created_at: '2024-01-16' },
    { id: '4', name: 'Real Estate', description: 'Property inquiries & viewings', category: 'Industry', icon_name: 'home', color: '#10B981', is_active: true, display_order: 4, created_at: '2024-01-17' },
    { id: '5', name: 'HVAC Dispatch', description: 'Book service appointments 24/7', category: 'Industry', icon_name: 'thermometer', color: '#3B82F6', is_active: true, display_order: 5, created_at: '2024-01-18' },
  ])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPreset, setEditingPreset] = useState<AgentPreset | null>(null)
  const [formData, setFormData] = useState({ name: '', description: '', category: 'Sales', icon_name: 'phone', color: '#3366FF' })

  const headerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(headerRef.current, { opacity: 0, y: -20 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' })
      gsap.fromTo('.preset-row', { opacity: 0, x: -20 }, { opacity: 1, x: 0, duration: 0.4, stagger: 0.05, delay: 0.2, ease: 'power3.out' })
    })
    return () => ctx.revert()
  }, [])

  const openModal = (preset?: AgentPreset) => {
    if (preset) {
      setEditingPreset(preset)
      setFormData({ name: preset.name, description: preset.description, category: preset.category, icon_name: preset.icon_name, color: preset.color })
    } else {
      setEditingPreset(null)
      setFormData({ name: '', description: '', category: 'Sales', icon_name: 'phone', color: '#3366FF' })
    }
    setIsModalOpen(true)
  }

  const handleSave = () => {
    if (editingPreset) {
      setPresets(presets.map(p => p.id === editingPreset.id ? { ...p, ...formData } : p))
    } else {
      const newPreset: AgentPreset = {
        id: Date.now().toString(),
        ...formData,
        is_active: true,
        display_order: presets.length + 1,
        created_at: new Date().toISOString().split('T')[0],
      }
      setPresets([...presets, newPreset])
    }
    setIsModalOpen(false)
  }

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this preset?')) {
      setPresets(presets.filter(p => p.id !== id))
    }
  }

  const toggleActive = (id: string) => {
    setPresets(presets.map(p => p.id === id ? { ...p, is_active: !p.is_active } : p))
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div ref={headerRef} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-[#1E3A5F]">Agent Presets</h1>
          <p className="text-[#5A6B7D] mt-1">Manage presets shown on the landing page phone mockup</p>
        </div>
        <button
          onClick={() => openModal()}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#3366FF] text-white font-semibold text-sm rounded-xl hover:bg-[#2952CC] transition-all shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
          Add Preset
        </button>
      </div>

      {/* Info Card */}
      <div className="bg-[#3366FF]/5 border border-[#3366FF]/20 rounded-2xl p-5 flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-[#3366FF]/10 flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-[#3366FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
        </div>
        <div>
          <h3 className="font-semibold text-[#1E3A5F] mb-1">How it works</h3>
          <p className="text-sm text-[#5A6B7D]">Agent presets you add here will appear in the scrolling phone mockup on the landing page. Active presets are shown to visitors and can trigger demo calls when clicked.</p>
        </div>
      </div>

      {/* Presets Table */}
      <div className="bg-white rounded-2xl border border-[#E8E5DF] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#E8E5DF] bg-[#F5F3EF]">
                <th className="text-left text-xs font-semibold text-[#5A6B7D] uppercase tracking-wide px-6 py-4">Preset</th>
                <th className="text-left text-xs font-semibold text-[#5A6B7D] uppercase tracking-wide px-6 py-4">Category</th>
                <th className="text-left text-xs font-semibold text-[#5A6B7D] uppercase tracking-wide px-6 py-4">Status</th>
                <th className="text-left text-xs font-semibold text-[#5A6B7D] uppercase tracking-wide px-6 py-4">Order</th>
                <th className="text-right text-xs font-semibold text-[#5A6B7D] uppercase tracking-wide px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {presets.map((preset) => (
                <tr key={preset.id} className="preset-row border-b border-[#E8E5DF] hover:bg-[#F5F3EF]/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${preset.color}15` }}>
                        <svg className="w-5 h-5" style={{ color: preset.color }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.362 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.574 2.81.7A2 2 0 0122 16.92z"/>
                        </svg>
                      </div>
                      <div>
                        <div className="font-semibold text-[#1E3A5F]">{preset.name}</div>
                        <div className="text-sm text-[#5A6B7D]">{preset.description}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ backgroundColor: `${preset.color}15`, color: preset.color }}>
                      {preset.category}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => toggleActive(preset.id)}
                      className={`relative w-11 h-6 rounded-full transition-colors ${preset.is_active ? 'bg-[#10B981]' : 'bg-[#E8E5DF]'}`}
                    >
                      <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${preset.is_active ? 'left-6' : 'left-1'}`} />
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-[#5A6B7D]">#{preset.display_order}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openModal(preset)}
                        className="p-2 rounded-lg text-[#5A6B7D] hover:text-[#3366FF] hover:bg-[#3366FF]/10 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>
                      <button
                        onClick={() => handleDelete(preset.id)}
                        className="p-2 rounded-lg text-[#5A6B7D] hover:text-[#EF4444] hover:bg-[#EF4444]/10 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#1E3A5F]/50 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
            <h2 className="text-xl font-display font-bold text-[#1E3A5F] mb-6">
              {editingPreset ? 'Edit Preset' : 'Add New Preset'}
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#1E3A5F] mb-1.5">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-[#E8E5DF] focus:border-[#3366FF] focus:ring-2 focus:ring-[#3366FF]/20 outline-none transition-all"
                  placeholder="e.g. Sales Closer"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[#1E3A5F] mb-1.5">Description</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-[#E8E5DF] focus:border-[#3366FF] focus:ring-2 focus:ring-[#3366FF]/20 outline-none transition-all"
                  placeholder="e.g. Convert leads into paying customers"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[#1E3A5F] mb-1.5">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-[#E8E5DF] focus:border-[#3366FF] focus:ring-2 focus:ring-[#3366FF]/20 outline-none transition-all bg-white"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[#1E3A5F] mb-1.5">Color</label>
                <div className="flex gap-2">
                  {COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => setFormData({ ...formData, color })}
                      className={`w-8 h-8 rounded-lg transition-transform ${formData.color === color ? 'ring-2 ring-offset-2 ring-[#1E3A5F] scale-110' : 'hover:scale-105'}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setIsModalOpen(false)}
                className="flex-1 px-4 py-3 rounded-xl border border-[#E8E5DF] text-[#5A6B7D] font-medium hover:bg-[#F5F3EF] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex-1 px-4 py-3 rounded-xl bg-[#3366FF] text-white font-semibold hover:bg-[#2952CC] transition-colors"
              >
                {editingPreset ? 'Save Changes' : 'Add Preset'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
