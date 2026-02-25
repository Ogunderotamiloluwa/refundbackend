import React from 'react'
import { motion } from 'framer-motion'
import { Trash2, Edit2, Clock, Calendar, CheckCircle2 } from 'lucide-react'
import { API_URL } from '../config/apiConfig'

export default function RoutineCard({ routine, onDelete, onEdit, onComplete }) {
  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this routine?')) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/api/routines/${routine.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        onDelete && onDelete(routine.id)
      }
    } catch (err) {
      console.error('Failed to delete routine:', err)
    }
  }

  const completedTasks = routine.tasks?.filter(t => t.completed).length || 0
  const totalTasks = routine.tasks?.length || 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ y: -4 }}
      className="p-6 rounded-2xl bg-glass-bg border border-glass-border backdrop-blur-xl hover:border-command-gold/50 transition-all group"
      style={{ borderTop: `4px solid ${routine.color || '#d4af37'}` }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white mb-1">{routine.name}</h3>
          {routine.description && (
            <p className="text-sm text-gray-400 line-clamp-1 mb-2">{routine.description}</p>
          )}
          
          {/* Time and Days */}
          <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
            <div className="flex items-center gap-1">
              <Clock size={14} />
              <span>{routine.time}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar size={14} />
              <span>{routine.repeatDays?.length || 0} days/week</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onEdit && onEdit(routine)}
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

      {/* Tasks */}
      {totalTasks > 0 && (
        <div className="mb-4">
          <div className="text-xs text-gray-400 mb-2">
            {completedTasks} of {totalTasks} tasks
          </div>
          <div className="space-y-1">
            {routine.tasks?.slice(0, 3).map(task => (
              <div key={task.id} className="text-xs text-gray-400 flex items-center gap-2">
                <div className={`w-3 h-3 rounded border ${task.completed ? 'bg-green-500 border-green-500' : 'border-gray-600'}`} />
                <span className={task.completed ? 'line-through text-gray-500' : ''}>{task.title}</span>
              </div>
            ))}
            {totalTasks > 3 && (
              <div className="text-xs text-gray-500">+{totalTasks - 3} more tasks</div>
            )}
          </div>
        </div>
      )}

      {/* Days View */}
      <div className="flex gap-1 mb-4">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
          <div
            key={day}
            className={`flex-1 py-1 text-xs text-center rounded font-medium ${
              routine.repeatDays?.includes(day)
                ? 'bg-command-gold/30 text-command-gold'
                : 'bg-white/5 text-gray-500'
            }`}
          >
            {day.slice(0, 1)}
          </div>
        ))}
      </div>

      {/* Start Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => onComplete && onComplete(routine.id)}
        className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-command-gold to-command-cobalt text-command-dark hover:shadow-lg transition-all font-semibold flex items-center justify-center gap-2"
      >
        <CheckCircle2 size={18} />
        Start Routine
      </motion.button>
    </motion.div>
  )
}
