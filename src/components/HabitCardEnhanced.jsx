import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Trash2, Edit2, CheckCircle2, Circle, Flame, TrendingUp, Clock } from 'lucide-react'
import { API_URL } from '../config/apiConfig'
import { useNotifications } from '../context/NotificationContext'

export default function HabitCardEnhanced({ habit, onComplete, onDelete, onEdit }) {
  const [isCompleting, setIsCompleting] = useState(false)
  const { addNotification } = useNotifications()

  const handleComplete = async () => {
    setIsCompleting(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/api/habits/${habit.id}/complete`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        // Show success notification
        addNotification({
          type: 'success',
          title: '✅ Habit Completed!',
          message: `${habit.name} marked complete! Great job, boss.`
        })
        onComplete && onComplete(data)
      }
    } catch (err) {
      console.error('Failed to complete habit:', err)
      addNotification({
        type: 'alert',
        title: '⚠️ Error',
        message: 'Failed to complete habit'
      })
    } finally {
      setIsCompleting(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this habit?')) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/api/habits/${habit.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        addNotification({
          type: 'info',
          title: '🗑️ Habit Deleted',
          message: `${habit.name} has been removed`
        })
        onDelete && onDelete(habit.id)
      }
    } catch (err) {
      console.error('Failed to delete habit:', err)
      addNotification({
        type: 'alert',
        title: '⚠️ Error',
        message: 'Failed to delete habit'
      })
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ y: -4 }}
      className="p-6 rounded-2xl bg-glass-bg border border-glass-border backdrop-blur-xl hover:border-command-gold/50 transition-all group"
      style={{ borderLeft: `4px solid ${habit.color || '#d4af37'}` }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-4 flex-1">
          {/* Icon and Title */}
          <div className="text-3xl">{habit.icon || '🎯'}</div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white mb-1">{habit.name}</h3>
            {habit.description && (
              <p className="text-sm text-gray-400 line-clamp-1">{habit.description}</p>
            )}
            <div className="flex items-center gap-4 mt-2 text-xs text-gray-400 flex-wrap">
              <span className="px-2 py-1 rounded-full bg-white/10 capitalize">{habit.frequency}</span>
              {habit.startTime && habit.endTime && (
                <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-white/10">
                  <Clock size={12} className="text-command-gold" />
                  <span>{habit.startTime} - {habit.endTime}</span>
                </div>
              )}
              {habit.streak !== undefined && (
                <div className="flex items-center gap-1">
                  <Flame size={14} className="text-orange-400" />
                  <span>{habit.streak} day streak</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onEdit && onEdit(habit)}
            className="p-2 rounded-lg hover:bg-blue-500/20 text-blue-400 transition-colors"
          >
            <Edit2 size={16} />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleDelete}
            className="p-2 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors"
          >
            <Trash2 size={16} />
          </motion.button>
        </div>
      </div>

      {/* Progress Bar */}
      {habit.progress !== undefined && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <TrendingUp size={14} className="text-command-gold" />
              <span className="text-xs text-gray-400">Progress</span>
            </div>
            <span className="text-sm font-semibold text-command-gold">{habit.progress}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${habit.progress}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="h-full rounded-full"
              style={{ backgroundColor: habit.color || '#d4af37' }}
            />
          </div>
        </div>
      )}

      {/* Complete Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleComplete}
        disabled={isCompleting || habit.completed}
        className={`w-full py-3 px-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
          habit.completed
            ? 'bg-green-500/20 border border-green-500/50 text-green-400 cursor-default'
            : 'bg-gradient-to-r from-command-gold to-command-cobalt text-command-dark hover:shadow-lg disabled:opacity-50'
        }`}
      >
        {habit.completed ? (
          <>
            <CheckCircle2 size={18} />
            Completed Today
          </>
        ) : isCompleting ? (
          'Marking...'
        ) : (
          <>
            <Circle size={18} />
            Mark Complete
          </>
        )}
      </motion.button>

      {habit.lastCompleted && (
        <div className="mt-3 text-xs text-gray-500 text-center">
          Last completed: {new Date(habit.lastCompleted).toLocaleDateString()}
        </div>
      )}
    </motion.div>
  )
}
