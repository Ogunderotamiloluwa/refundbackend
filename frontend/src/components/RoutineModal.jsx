import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { X, Plus, AlertCircle, Trash2 } from 'lucide-react'

const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const ROUTINE_COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#ec4899', '#6b7280']

export default function RoutineModal({ isOpen, onClose, onSave, routine = null }) {
  const [formData, setFormData] = useState(routine || {
    name: '',
    time: '09:00',
    tasks: [],
    repeatDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    color: '#3b82f6',
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
        color: '#3b82f6',
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
        className="bg-white border border-gray-200 rounded-xl p-6 sm:p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto my-8"
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-900">
            {routine ? 'Edit Routine' : 'New Routine'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-600" />
          </button>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex gap-2"
          >
            <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </motion.div>
        )}

        <div className="space-y-4 max-h-96 overflow-y-auto pr-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Routine Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="e.g., Morning Routine"
              className="w-full px-4 py-2 rounded-lg bg-white border border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="What's this routine about?"
              rows="2"
              className="w-full px-4 py-2 rounded-lg bg-white border border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all resize-none"
            />
          </div>

          {/* Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Time</label>
            <input
              type="time"
              name="time"
              value={formData.time}
              onChange={handleInputChange}
              className="w-full px-4 py-2 rounded-lg bg-white border border-gray-300 text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
            />
          </div>

          {/* Repeat Days */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Repeat On</label>
            <div className="grid grid-cols-7 gap-2">
              {DAYS_OF_WEEK.map(day => (
                <button
                  key={day}
                  onClick={() => toggleDay(day)}
                  className={`py-2 px-2 rounded-lg text-sm font-medium transition-all ${
                    formData.repeatDays.includes(day)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>

          {/* Tasks */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tasks</label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={taskInput}
                onChange={(e) => setTaskInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addTask()}
                placeholder="Add a task..."
                className="flex-1 px-4 py-2 rounded-lg bg-white border border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              />
              <button
                onClick={addTask}
                className="px-4 py-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors font-medium"
              >
                <Plus size={18} />
              </button>
            </div>

            {/* Task List */}
            <div className="space-y-2">
              {formData.tasks.map(task => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-200"
                >
                  <span className="text-sm text-gray-700">{task.title}</span>
                  <button
                    onClick={() => removeTask(task.id)}
                    className="p-1 hover:bg-red-100 rounded text-red-600 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Color Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
            <div className="grid grid-cols-8 gap-2">
              {ROUTINE_COLORS.map(color => (
                <button
                  key={color}
                  onClick={() => setFormData(prev => ({ ...prev, color }))}
                  className={`w-full h-8 rounded-lg transition-all ${
                    formData.color === color
                      ? 'ring-2 ring-offset-2 ring-offset-white ring-gray-900 scale-110'
                      : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-8 pt-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Plus size={16} />
            {saving ? 'Saving...' : routine ? 'Update' : 'Create'} Routine
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
