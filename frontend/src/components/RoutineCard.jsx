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
      className="p-4 md:p-6 rounded-lg md:rounded-xl bg-white border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all group"
      style={{ borderTop: `4px solid ${routine.color || '#3b82f6'}` }}
    >
      <div className="flex items-start justify-between gap-2 mb-3 md:mb-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm md:text-lg font-semibold text-gray-900 truncate mb-0.5 md:mb-1">{routine.name}</h3>
          {routine.description && (
            <p className="text-xs md:text-sm text-gray-600 line-clamp-1 mb-2">{routine.description}</p>
          )}
          
          {/* Time and Days */}
          <div className="flex items-center gap-2 md:gap-4 mt-2 text-xs text-gray-500 flex-wrap">
            <div className="flex items-center gap-1">
              <Clock size={12} className="md:w-4 md:h-4" />
              <span>{routine.time}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar size={12} className="md:w-4 md:h-4" />
              <span className="hidden xs:inline">{routine.repeatDays?.length || 0}d/wk</span>
              <span className="xs:hidden">{routine.repeatDays?.length || 0}d</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-1 flex-shrink-0">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onEdit && onEdit(routine)}
            className="p-1.5 md:p-2 rounded hover:bg-blue-100 text-blue-600 transition-colors"
          >
            <Edit2 size={14} className="md:w-4 md:h-4" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleDelete}
            className="p-1.5 md:p-2 rounded hover:bg-red-100 text-red-600 transition-colors"
          >
            <Trash2 size={14} className="md:w-4 md:h-4" />
          </motion.button>
        </div>
      </div>

      {/* Tasks */}
      {totalTasks > 0 && (
        <div className="mb-3 md:mb-4">
          <div className="text-xs text-gray-600 mb-1.5 md:mb-2">
            {completedTasks}/{totalTasks} tasks
          </div>
          <div className="space-y-0.5">
            {routine.tasks?.slice(0, 2).map(task => (
              <div key={task.id} className="text-xs text-gray-600 flex items-center gap-2 truncate">
                <div className={`w-3 h-3 flex-shrink-0 rounded border ${task.completed ? 'bg-green-500 border-green-500' : 'border-gray-300'}`} />
                <span className={`truncate ${task.completed ? 'line-through text-gray-400' : ''}`}>{task.title}</span>
              </div>
            ))}
            {totalTasks > 2 && (
              <div className="text-xs text-gray-400">+{totalTasks - 2} more</div>
            )}
          </div>
        </div>
      )}

      {/* Days View - Compact */}
      <div className="flex gap-0.5 md:gap-1 mb-3 md:mb-4">
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, idx) => (
          <div
            key={day + idx}
            className={`flex-1 py-1 text-xs text-center rounded font-medium ${
              routine.repeatDays?.includes(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][idx])
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-500'
            }`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Start Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => onComplete && onComplete(routine.id)}
        className="w-full py-2 md:py-3 px-3 md:px-4 rounded-lg md:rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-all font-semibold flex items-center justify-center gap-1 md:gap-2 text-sm md:text-base"
      >
        <CheckCircle2 size={16} className="md:w-5 md:h-5" />
        <span className="hidden sm:inline">Start Routine</span>
        <span className="sm:hidden">Start</span>
      </motion.button>
    </motion.div>
  )
}
