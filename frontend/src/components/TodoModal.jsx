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

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-md bg-white rounded-xl overflow-hidden shadow-xl"
      >
        {/* Header */}
        <div className="bg-gray-50 px-6 py-5 flex justify-between items-center border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {todo ? 'Edit Task' : 'Create New Task'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[80vh] overflow-y-auto space-y-5">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-3">
              <AlertTriangle size={16} />
              {error}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Task Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="What do you need to do?"
              className="w-full px-4 py-2.5 rounded-lg bg-gray-50 border border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:bg-white focus:outline-none transition-all"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Add any notes or details..."
              rows="3"
              className="w-full px-4 py-2.5 rounded-lg bg-gray-50 border border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:bg-white focus:outline-none transition-all resize-none"
            />
          </div>

          {/* Scheduled Time */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <Clock size={16} className="text-blue-600" />
              Due Date & Time <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              name="scheduledTime"
              value={formData.scheduledTime.slice(0, 16)}
              onChange={handleInputChange}
              className="w-full px-4 py-2.5 rounded-lg bg-gray-50 border border-gray-300 text-gray-900 focus:border-blue-500 focus:bg-white focus:outline-none transition-all"
            />
            <p className="text-xs text-gray-500 mt-1">Set when you want to be reminded about this task</p>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <MapPin size={16} className="text-blue-600" />
              Location
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              placeholder="e.g., Office, Home, Downtown"
              className="w-full px-4 py-2.5 rounded-lg bg-gray-50 border border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:bg-white focus:outline-none transition-all"
            />
            <p className="text-xs text-gray-500 mt-1">Where do you need to go?</p>
          </div>

          {/* Risk Level */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">Priority Level</label>
            <div className="grid grid-cols-3 gap-2">
              {RISK_LEVELS.map(level => (
                <button
                  key={level.value}
                  onClick={() => setFormData(prev => ({ ...prev, riskLevel: level.value }))}
                  className={`px-3 py-2.5 rounded-lg font-medium text-sm transition-all border-2 ${
                    formData.riskLevel === level.value
                      ? level.value === 'low' ? 'border-green-500 bg-green-50 text-green-700'
                        : level.value === 'medium' ? 'border-amber-500 bg-amber-50 text-amber-700'
                        : 'border-red-500 bg-red-50 text-red-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {level.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex gap-3 justify-end">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-gray-700 font-medium hover:bg-gray-200 transition-colors"
          >
            Cancel
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving...' : 'Save Task'}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
