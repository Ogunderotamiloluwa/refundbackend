import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, CheckCircle2, AlertTriangle, Clock, Zap } from 'lucide-react'
import { API_URL } from '../config/apiConfig'

export default function TodoReminder() {
  const [todos, setTodos] = useState([])
  const [collapsed, setCollapsed] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    loadTodos()
    // Refresh every 60 seconds to catch new todos
    const interval = setInterval(loadTodos, 60000)
    return () => clearInterval(interval)
  }, [])

  const loadTodos = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch(`${API_URL}/api/todos`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        // Filter to only show incomplete todos
        const pendingTodos = (data.todos || []).filter(t => !t.completed)
        setTodos(pendingTodos)
      }
    } catch (err) {
      console.log('Error loading todos:', err)
    }
  }

  if (dismissed || todos.length === 0) {
    return null
  }

  // Separate todos by urgency/risk level
  const highRiskTodos = todos.filter(t => t.riskLevel === 'high')
  const mediumRiskTodos = todos.filter(t => t.riskLevel === 'medium')
  const lowRiskTodos = todos.filter(t => t.riskLevel === 'low')

  const getTimeUntil = (scheduledTime) => {
    try {
      const now = new Date()
      const scheduled = new Date(scheduledTime)
      const diff = scheduled - now
      
      if (diff < 0) return 'Overdue'
      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      
      if (hours === 0) return `${minutes}m left`
      return `${hours}h ${minutes}m left`
    } catch (e) {
      return 'N/A'
    }
  }

  const getTodoRiskColor = (level) => {
    switch (level) {
      case 'high':
        return 'bg-red-50 border-red-200 text-red-900'
      case 'medium':
        return 'bg-amber-50 border-amber-200 text-amber-900'
      default:
        return 'bg-blue-50 border-blue-200 text-blue-900'
    }
  }

  const getRiskBadgeColor = (level) => {
    switch (level) {
      case 'high':
        return 'bg-red-200 text-red-700'
      case 'medium':
        return 'bg-amber-200 text-amber-700'
      default:
        return 'bg-green-200 text-green-700'
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="relative"
      >
        {/* Main Banner */}
        <div className={`rounded-xl p-4 sm:p-5 border ${
          highRiskTodos.length > 0
            ? 'bg-red-50 border-red-300'
            : mediumRiskTodos.length > 0
            ? 'bg-amber-50 border-amber-300'
            : 'bg-blue-50 border-blue-300'
        }`}>
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start gap-3 flex-1">
              {/* Icon */}
              <div className={`p-2.5 rounded-lg flex-shrink-0 ${
                highRiskTodos.length > 0
                  ? 'bg-red-200 text-red-700'
                  : mediumRiskTodos.length > 0
                  ? 'bg-amber-200 text-amber-700'
                  : 'bg-blue-200 text-blue-700'
              }`}>
                {highRiskTodos.length > 0 ? (
                  <AlertTriangle size={20} />
                ) : (
                  <Clock size={20} />
                )}
              </div>

              {/* Title & Summary */}
              <div className="flex-1">
                <h3 className={`text-base sm:text-lg font-bold mb-1 ${
                  highRiskTodos.length > 0
                    ? 'text-red-900'
                    : mediumRiskTodos.length > 0
                    ? 'text-amber-900'
                    : 'text-blue-900'
                }`}>
                  {highRiskTodos.length > 0
                    ? `${highRiskTodos.length} Urgent Task${highRiskTodos.length > 1 ? 's' : ''}`
                    : mediumRiskTodos.length > 0
                    ? `${mediumRiskTodos.length} Pending Task${mediumRiskTodos.length > 1 ? 's' : ''}`
                    : `${todos.length} Task${todos.length > 1 ? 's' : ''} Remaining`
                  }
                </h3>
                <p className={`text-xs sm:text-sm ${
                  highRiskTodos.length > 0
                    ? 'text-red-700'
                    : mediumRiskTodos.length > 0
                    ? 'text-amber-700'
                    : 'text-blue-700'
                }`}>
                  {highRiskTodos.length > 0
                    ? 'Need immediate attention'
                    : mediumRiskTodos.length > 0
                    ? 'Review your schedule'
                    : 'Keep building momentum'
                  }
                </p>
              </div>

              {/* Close Button */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setDismissed(true)}
                className={`p-2 rounded-lg transition-colors flex-shrink-0 ${
                  highRiskTodos.length > 0
                    ? 'hover:bg-red-200 text-red-700'
                    : mediumRiskTodos.length > 0
                    ? 'hover:bg-amber-200 text-amber-700'
                    : 'hover:bg-blue-200 text-blue-700'
                }`}
              >
                <X size={18} />
              </motion.button>
            </div>
          </div>

          {/* Todos List - Show first 3 */}
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-2 mb-4"
            >
              {todos.slice(0, 3).map((todo) => (
                <motion.div
                  key={todo.id}
                  layout
                  className={`p-3 rounded-lg border flex items-center gap-3 text-sm ${getTodoRiskColor(todo.riskLevel)}`}
                >
                  {/* Status Icon */}
                  <div className="flex-shrink-0">
                    <CheckCircle2 size={16} className="opacity-60" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{todo.title}</p>
                    <div className="flex items-center gap-2 opacity-70 text-xs mt-1">
                      {todo.scheduledTime && (
                        <>
                          <Clock size={12} />
                          <span>{getTimeUntil(todo.scheduledTime)}</span>
                        </>
                      )}
                      {todo.location && (
                        <>
                          <span>•</span>
                          <span>{todo.location}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Risk Badge */}
                  <div className="flex-shrink-0">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getRiskBadgeColor(todo.riskLevel)}`}>
                      {todo.riskLevel === 'high' ? 'High' : todo.riskLevel === 'medium' ? 'Mid' : 'Low'}
                    </span>
                  </div>
                </motion.div>
              ))}

              {todos.length > 3 && (
                <p className="text-xs text-gray-600 text-center py-2">
                  + {todos.length - 3} more task{todos.length - 3 > 1 ? 's' : ''}
                </p>
              )}
            </motion.div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between gap-3 pt-4 border-t border-gray-300">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setCollapsed(!collapsed)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                collapsed
                  ? 'bg-gray-700 text-white hover:bg-gray-800'
                  : 'bg-gray-600 text-white hover:bg-gray-700'
              }`}
            >
              {collapsed ? 'Show Details' : 'Hide Details'}
            </motion.button>

            <motion.a
              href="#/todos"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-4 py-2 rounded-lg text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              View All Todos
            </motion.a>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
