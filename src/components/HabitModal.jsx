import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { X, Plus, AlertCircle, Cloud, Droplets, Sun } from 'lucide-react'

const HABIT_ICONS = ['🎯', '📚', '💪', '🧘', '🚴', '🏃', '💤', '📝', '🎨', '🎵', '⚽', '🏊', '🧗']
const HABIT_COLORS = ['#d4af37', '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#dfe6e9', '#a29bfe', '#74b9ff', '#81ecec']
const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const HABIT_CATEGORIES = ['Fitness', 'Learning', 'Wellness', 'Sport', 'Music', 'Creative', 'Other']

export default function HabitModal({ isOpen, onClose, onSave, habit = null }) {
  const defaultFormData = {
    name: '',
    description: '',
    frequency: 'daily',
    icon: '🎯',
    color: '#d4af37',
    target: 30,
    startTime: '09:00',
    endTime: '10:00',
    scheduleDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    category: 'Other',
    weatherPreferences: {
      avoidRain: false,
      avoidHotSun: false,
      avoidSnow: false,
    }
  }

  const [formData, setFormData] = useState(habit ? { ...defaultFormData, ...habit } : defaultFormData)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setError('')
  }

  const toggleDay = (day) => {
    setFormData(prev => ({
      ...prev,
      scheduleDays: prev.scheduleDays.includes(day)
        ? prev.scheduleDays.filter(d => d !== day)
        : [...prev.scheduleDays, day]
    }))
  }

  const toggleWeatherPref = (pref) => {
    setFormData(prev => ({
      ...prev,
      weatherPreferences: {
        ...prev.weatherPreferences,
        [pref]: !prev.weatherPreferences[pref]
      }
    }))
  }

  const handleSave = async () => {
    if (!formData.name.trim()) {
      setError('Habit name is required')
      return
    }

    if (formData.scheduleDays.length === 0) {
      setError('Select at least one day')
      return
    }

    setSaving(true)
    try {
      await onSave(formData)
      setFormData({
        name: '',
        description: '',
        frequency: 'daily',
        icon: '🎯',
        color: '#d4af37',
        target: 30,
        startTime: '09:00',
        endTime: '10:00',
        scheduleDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        category: 'Other',
        weatherPreferences: {
          avoidRain: false,
          avoidHotSun: false,
          avoidSnow: false,
        }
      })
    } catch (err) {
      setError(err.message || 'Failed to save habit')
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
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className="bg-glass-bg border border-glass-border backdrop-blur-xl rounded-3xl p-8 w-full max-w-md max-h-[90vh] overflow-y-auto my-8"
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">
            {habit ? 'Edit Habit' : 'New Habit'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-200 text-sm flex gap-2"
          >
            <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </motion.div>
        )}

        <div className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Habit Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="e.g., Play Soccer"
              className="w-full px-4 py-2 rounded-lg bg-white/10 border border-glass-border text-white placeholder-gray-500 focus:outline-none focus:border-command-gold focus:ring-1 focus:ring-command-gold transition-all"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Why is this habit important?"
              rows="2"
              className="w-full px-4 py-2 rounded-lg bg-white/10 border border-glass-border text-white placeholder-gray-500 focus:outline-none focus:border-command-gold focus:ring-1 focus:ring-command-gold transition-all resize-none"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              className="w-full px-4 py-2 rounded-lg bg-white/10 border border-glass-border text-white focus:outline-none focus:border-command-gold focus:ring-1 focus:ring-command-gold transition-all"
            >
              {HABIT_CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Time Schedule */}
          <div className="bg-white/5 p-4 rounded-lg border border-white/10">
            <h3 className="text-sm font-semibold text-gray-300 mb-3">⏰ Time Schedule</h3>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Start Time</label>
                <input
                  type="time"
                  name="startTime"
                  value={formData.startTime}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 rounded-lg bg-white/10 border border-glass-border text-white focus:outline-none focus:border-command-gold transition-all"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">End Time</label>
                <input
                  type="time"
                  name="endTime"
                  value={formData.endTime}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 rounded-lg bg-white/10 border border-glass-border text-white focus:outline-none focus:border-command-gold transition-all"
                />
              </div>
            </div>

            {/* Days Selection */}
            <label className="block text-xs text-gray-400 mb-2">Days of Week</label>
            <div className="grid grid-cols-7 gap-1">
              {DAYS_OF_WEEK.map(day => (
                <button
                  key={day}
                  onClick={() => toggleDay(day)}
                  className={`p-2 rounded text-xs font-semibold transition-all ${
                    formData.scheduleDays.includes(day)
                      ? 'bg-command-gold text-command-dark'
                      : 'bg-white/10 text-gray-400 hover:bg-white/20'
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>

          {/* Weather Preferences */}
          <div className="bg-white/5 p-4 rounded-lg border border-white/10">
            <h3 className="text-sm font-semibold text-gray-300 mb-3">🌤️ Weather Conditions</h3>
            <div className="space-y-2">
              <label className="flex items-center gap-3 cursor-pointer p-2 rounded hover:bg-white/5 transition-all">
                <input
                  type="checkbox"
                  checked={formData.weatherPreferences.avoidRain}
                  onChange={() => toggleWeatherPref('avoidRain')}
                  className="w-4 h-4 rounded"
                />
                <Droplets size={16} className="text-blue-400" />
                <span className="text-sm text-gray-300">Avoid on rainy days</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer p-2 rounded hover:bg-white/5 transition-all">
                <input
                  type="checkbox"
                  checked={formData.weatherPreferences.avoidHotSun}
                  onChange={() => toggleWeatherPref('avoidHotSun')}
                  className="w-4 h-4 rounded"
                />
                <Sun size={16} className="text-yellow-400" />
                <span className="text-sm text-gray-300">Avoid in hot/sunny weather</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer p-2 rounded hover:bg-white/5 transition-all">
                <input
                  type="checkbox"
                  checked={formData.weatherPreferences.avoidSnow}
                  onChange={() => toggleWeatherPref('avoidSnow')}
                  className="w-4 h-4 rounded"
                />
                <Cloud size={16} className="text-gray-300" />
                <span className="text-sm text-gray-300">Avoid when snowing</span>
              </label>
            </div>
          </div>

          {/* Icon Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Icon</label>
            <div className="grid grid-cols-5 gap-2">
              {HABIT_ICONS.map(icon => (
                <button
                  key={icon}
                  onClick={() => setFormData(prev => ({ ...prev, icon }))}
                  className={`p-3 rounded-lg text-2xl transition-all ${
                    formData.icon === icon
                      ? 'bg-command-gold/30 border-2 border-command-gold scale-110'
                      : 'bg-white/10 border border-glass-border hover:bg-white/20'
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          {/* Color Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Color</label>
            <div className="grid grid-cols-5 gap-2">
              {HABIT_COLORS.map(color => (
                <button
                  key={color}
                  onClick={() => setFormData(prev => ({ ...prev, color }))}
                  className={`w-full h-10 rounded-lg transition-all ${
                    formData.color === color
                      ? 'ring-2 ring-offset-2 ring-offset-command-dark scale-110'
                      : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {/* Target */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Target Days (for 100%)</label>
            <input
              type="number"
              name="target"
              value={formData.target}
              onChange={handleInputChange}
              min="1"
              max="365"
              className="w-full px-4 py-2 rounded-lg bg-white/10 border border-glass-border text-white focus:outline-none focus:border-command-gold focus:ring-1 focus:ring-command-gold transition-all"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-8">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg border border-glass-border text-gray-300 hover:bg-white/10 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-command-gold to-command-cobalt text-command-dark hover:shadow-lg transition-all font-medium disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Plus size={16} />
            {saving ? 'Saving...' : habit ? 'Update' : 'Create'} Habit
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
