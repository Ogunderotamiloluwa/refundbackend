import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { X, Clock, MapPin, AlertTriangle } from 'lucide-react'

const RISK_LEVELS = [
  { value: 'low', label: 'Low Risk', color: 'green', icon: '✅' },
  { value: 'medium', label: 'Medium Risk', color: 'yellow', icon: '⚠️' },
  { value: 'high', label: 'High Risk', color: 'red', icon: '🚨' }
]

export default function TodoModal({ isOpen, onClose, onSave, todo = null }) {
  const defaultFormData = {
    title: '',
    description: '',
    scheduledTime: new Date().toISOString().slice(0, 16),
    location: '',
    riskLevel: 'low'
  }

  const [formData, setFormData] = useState(todo ? { ...defaultFormData, ...todo } : defaultFormData)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setError('')
  }

  const handleSave = async () => {
    if (!formData.title.trim()) {
      setError('Todo title is required')
      return
    }

    if (!formData.scheduledTime) {
      setError('Scheduled time is required')
      return
    }

    setSaving(true)
    try {
      await onSave(formData)
      setFormData(defaultFormData)
    } catch (err) {
      setError(err.message || 'Failed to save todo')
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-md bg-glass-bg border border-glass-border backdrop-blur-xl rounded-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-command-gold/20 to-command-cobalt/20 px-6 py-4 flex justify-between items-center border-b border-white/10">
          <h2 className="text-xl font-bold text-white">
            {todo ? '✏️ Edit Todo' : '📝 Create New Todo'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-5">
          {error && (
            <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-sm flex items-center gap-2">
              <AlertTriangle size={16} />
              {error}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-white mb-2">
              📌 Title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="What do you need to do?"
              className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-command-gold focus:outline-none transition-all"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-white mb-2">
              📝 Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Add any notes or details..."
              rows="3"
              className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-command-gold focus:outline-none transition-all resize-none"
            />
          </div>

          {/* Scheduled Time */}
          <div>
            <label className="block text-sm font-semibold text-white mb-2 flex items-center gap-2">
              <Clock size={16} className="text-command-gold" />
              Scheduled Time <span className="text-red-400">*</span>
            </label>
            <input
              type="datetime-local"
              name="scheduledTime"
              value={formData.scheduledTime.slice(0, 16)}
              onChange={handleInputChange}
              className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white focus:border-command-gold focus:outline-none transition-all"
            />
            <p className="text-xs text-gray-400 mt-2">Set when you want to be reminded about this todo</p>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-semibold text-white mb-2 flex items-center gap-2">
              <MapPin size={16} className="text-command-gold" />
              Location
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              placeholder="e.g., Lekki Road, Office, Home"
              className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-command-gold focus:outline-none transition-all"
            />
            <p className="text-xs text-gray-400 mt-2">Where do you need to go? (for traffic/route alerts)</p>
          </div>

          {/* Risk Level */}
          <div>
            <label className="block text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <AlertTriangle size={16} className="text-command-gold" />
              Risk Level
            </label>
            <div className="grid grid-cols-3 gap-3">
              {RISK_LEVELS.map(level => (
                <button
                  key={level.value}
                  onClick={() => setFormData(prev => ({ ...prev, riskLevel: level.value }))}
                  className={`p-3 rounded-lg border-2 transition-all text-center ${
                    formData.riskLevel === level.value
                      ? `border-${level.color}-500 bg-${level.color}-500/20`
                      : 'border-white/10 bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <div className="text-2xl mb-1">{level.icon}</div>
                  <div className="text-xs font-semibold text-gray-300">{level.label}</div>
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-2">
              {formData.riskLevel === 'high' && '🚨 High risk: Expected traffic/dangers - check weather & road conditions'}
              {formData.riskLevel === 'medium' && '⚠️ Medium risk: Check conditions before leaving'}
              {formData.riskLevel === 'low' && '✅ Low risk: Routine errand'}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-white/5 border-t border-white/10 px-6 py-4 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg border border-white/20 text-white hover:bg-white/10 transition-colors font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-command-gold to-command-cobalt text-command-dark hover:shadow-lg transition-all font-semibold disabled:opacity-50"
          >
            {saving ? 'Saving...' : (todo ? 'Update Todo' : 'Create Todo')}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
