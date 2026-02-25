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
        return 'from-red-600 to-red-800 ring-1 ring-red-500/50'
      case 'medium':
        return 'from-yellow-600 to-yellow-800 ring-1 ring-yellow-500/50'
      default:
        return 'from-green-600 to-green-800 ring-1 ring-green-500/50'
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
        <div className={`rounded-2xl p-6 backdrop-blur-xl border transition-all ${
          highRiskTodos.length > 0
            ? 'bg-gradient-to-r from-red-600/20 to-red-700/10 border-red-500/40'
            : mediumRiskTodos.length > 0
            ? 'bg-gradient-to-r from-yellow-600/20 to-yellow-700/10 border-yellow-500/40'
            : 'bg-gradient-to-r from-blue-600/20 to-blue-700/10 border-blue-500/40'
        }`}>
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start gap-3 flex-1">
              {/* Icon */}
              <div className={`p-2.5 rounded-lg ${
                highRiskTodos.length > 0
                  ? 'bg-red-500/20 text-red-300'
                  : mediumRiskTodos.length > 0
                  ? 'bg-yellow-500/20 text-yellow-300'
                  : 'bg-blue-500/20 text-blue-300'
              }`}>
                {highRiskTodos.length > 0 ? (
                  <AlertTriangle size={20} />
                ) : (
                  <Clock size={20} />
                )}
              </div>

              {/* Title & Summary */}
              <div className="flex-1">
                <h3 className={`text-lg font-bold mb-1 ${
                  highRiskTodos.length > 0
                    ? 'text-red-300'
                    : mediumRiskTodos.length > 0
                    ? 'text-yellow-300'
                    : 'text-blue-300'
                }`}>
                  {highRiskTodos.length > 0
                    ? `⚠️ ${highRiskTodos.length} Urgent Todo${highRiskTodos.length > 1 ? 's' : ''}`
                    : mediumRiskTodos.length > 0
                    ? `📋 ${mediumRiskTodos.length} Pending Todo${mediumRiskTodos.length > 1 ? 's' : ''}`
                    : `✓ ${todos.length} Todo${todos.length > 1 ? 's' : ''} To Complete`
                  }
                </h3>
                <p className={`text-sm ${
                  highRiskTodos.length > 0
                    ? 'text-red-200'
                    : mediumRiskTodos.length > 0
                    ? 'text-yellow-200'
                    : 'text-blue-200'
                }`}>
                  {highRiskTodos.length > 0
                    ? 'These need immediate attention!'
                    : mediumRiskTodos.length > 0
                    ? 'Review your schedule to stay on track'
                    : 'Keep up the momentum with these tasks'
                  }
                </p>
              </div>

              {/* Close Button */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setDismissed(true)}
                className={`p-2 rounded-lg transition-colors ${
                  highRiskTodos.length > 0
                    ? 'hover:bg-red-500/20 text-red-300'
                    : mediumRiskTodos.length > 0
                    ? 'hover:bg-yellow-500/20 text-yellow-300'
                    : 'hover:bg-blue-500/20 text-blue-300'
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
                  className={`p-3 rounded-lg backdrop-blur-sm border bg-gradient-to-r ${getTodoRiskColor(todo.riskLevel)} flex items-center gap-3 text-sm`}
                >
                  {/* Status Icon */}
                  <div className="flex-shrink-0">
                    <CheckCircle2 size={16} className="text-white/60" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold truncate">{todo.title}</p>
                    <div className="flex items-center gap-2 text-white/70 text-xs mt-1">
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
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold text-white ${
                      todo.riskLevel === 'high'
                        ? 'bg-red-500/40'
                        : todo.riskLevel === 'medium'
                        ? 'bg-yellow-500/40'
                        : 'bg-green-500/40'
                    }`}>
                      {todo.riskLevel === 'high' ? '🔴' : todo.riskLevel === 'medium' ? '🟡' : '🟢'}
                    </span>
                  </div>
                </motion.div>
              ))}

              {todos.length > 3 && (
                <p className="text-xs text-gray-400 italic text-center py-2">
                  + {todos.length - 3} more todo{todos.length - 3 > 1 ? 's' : ''}
                </p>
              )}
            </motion.div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/10">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setCollapsed(!collapsed)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                collapsed
                  ? 'bg-white/10 hover:bg-white/20 text-white'
                  : 'bg-white/5 hover:bg-white/10 text-gray-300'
              }`}
            >
              {collapsed ? 'Show' : 'Hide'}
            </motion.button>

            <motion.a
              href="#/todos"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-command-gold to-command-cobalt text-command-dark hover:shadow-lg transition-all flex items-center gap-2"
            >
              <Zap size={14} />
              View All Todos
            </motion.a>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
