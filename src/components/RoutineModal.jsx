import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { X, Plus, AlertCircle, Trash2 } from 'lucide-react'

const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const ROUTINE_COLORS = ['#d4af37', '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#a29bfe', '#74b9ff']

export default function RoutineModal({ isOpen, onClose, onSave, routine = null }) {
  const [formData, setFormData] = useState(routine || {
    name: '',
    time: '09:00',
    tasks: [],
    repeatDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    color: '#d4af37',
    description: ''
  })
  const [taskInput, setTaskInput] = useState('')
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
      repeatDays: prev.repeatDays.includes(day)
        ? prev.repeatDays.filter(d => d !== day)
        : [...prev.repeatDays, day]
    }))
  }

  const addTask = () => {
    if (taskInput.trim()) {
      setFormData(prev => ({
        ...prev,
        tasks: [...prev.tasks, { id: Date.now(), title: taskInput.trim(), completed: false }]
      }))
      setTaskInput('')
    }
  }

  const removeTask = (taskId) => {
    setFormData(prev => ({
      ...prev,
      tasks: prev.tasks.filter(t => t.id !== taskId)
    }))
  }

  const handleSave = async () => {
    if (!formData.name.trim()) {
      setError('Routine name is required')
      return
    }
    if (formData.repeatDays.length === 0) {
      setError('Select at least one day')
      return
    }

    setSaving(true)
    try {
      await onSave(formData)
      setFormData({
        name: '',
        time: '09:00',
        tasks: [],
        repeatDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
        color: '#d4af37',
        description: ''
      })
    } catch (err) {
      setError(err.message || 'Failed to save routine')
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
        className="bg-glass-bg border border-glass-border backdrop-blur-xl rounded-3xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto my-8"
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">
            {routine ? 'Edit Routine' : 'New Routine'}
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

        <div className="space-y-4 max-h-96 overflow-y-auto pr-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Routine Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="e.g., Morning Routine"
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
              placeholder="What's this routine about?"
              rows="2"
              className="w-full px-4 py-2 rounded-lg bg-white/10 border border-glass-border text-white placeholder-gray-500 focus:outline-none focus:border-command-gold focus:ring-1 focus:ring-command-gold transition-all resize-none"
            />
          </div>

          {/* Time */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Time</label>
            <input
              type="time"
              name="time"
              value={formData.time}
              onChange={handleInputChange}
              className="w-full px-4 py-2 rounded-lg bg-white/10 border border-glass-border text-white focus:outline-none focus:border-command-gold focus:ring-1 focus:ring-command-gold transition-all"
            />
          </div>

          {/* Repeat Days */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Repeat On</label>
            <div className="grid grid-cols-7 gap-2">
              {DAYS_OF_WEEK.map(day => (
                <button
                  key={day}
                  onClick={() => toggleDay(day)}
                  className={`py-2 px-2 rounded-lg text-sm font-medium transition-all ${
                    formData.repeatDays.includes(day)
                      ? 'bg-command-gold text-command-dark'
                      : 'bg-white/10 text-gray-400 hover:bg-white/20'
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>

          {/* Tasks */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Tasks</label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={taskInput}
                onChange={(e) => setTaskInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addTask()}
                placeholder="Add a task..."
                className="flex-1 px-4 py-2 rounded-lg bg-white/10 border border-glass-border text-white placeholder-gray-500 focus:outline-none focus:border-command-gold focus:ring-1 focus:ring-command-gold transition-all"
              />
              <button
                onClick={addTask}
                className="px-4 py-2 rounded-lg bg-command-gold/20 text-command-gold hover:bg-command-gold/30 transition-colors"
              >
                <Plus size={18} />
              </button>
            </div>

            {/* Task List */}
            <div className="space-y-2">
              {formData.tasks.map(task => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-glass-border"
                >
                  <span className="text-sm text-gray-300">{task.title}</span>
                  <button
                    onClick={() => removeTask(task.id)}
                    className="p-1 hover:bg-red-500/20 rounded text-red-400 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Color Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Color</label>
            <div className="grid grid-cols-8 gap-2">
              {ROUTINE_COLORS.map(color => (
                <button
                  key={color}
                  onClick={() => setFormData(prev => ({ ...prev, color }))}
                  className={`w-full h-8 rounded-lg transition-all ${
                    formData.color === color
                      ? 'ring-2 ring-offset-2 ring-offset-command-dark scale-110'
                      : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-8 pt-6 border-t border-glass-border">
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
            {saving ? 'Saving...' : routine ? 'Update' : 'Create'} Routine
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
