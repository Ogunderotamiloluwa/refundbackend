import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, ArrowLeft, Loader, MapPin, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { API_URL } from '../config/apiConfig'
import TodoCard from '../components/TodoCard'
import TodoModal from '../components/TodoModal'
import { useNotifications } from '../context/NotificationContext'

export default function TodoPage() {
  const [todos, setTodos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTodo, setEditingTodo] = useState(null)
  const [userLocation, setUserLocation] = useState(null)
  const { addNotification } = useNotifications()

  useEffect(() => {
    loadTodos()
    getUserLocation()
  }, [])

  const loadTodos = async () => {
    setLoading(true)
    setError('')
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/api/todos`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        setTodos(data.todos || [])
      } else {
        setError('Failed to load todos')
      }
    } catch (err) {
      setError('Connection error loading todos')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          })
        },
        (error) => {
          console.log('Geolocation error:', error)
        }
      )
    }
  }

  const handleAddTodo = async (formData) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/api/todos`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        const data = await response.json()
        setTodos([...todos, data.todo])
        setIsModalOpen(false)
        setEditingTodo(null)
        addNotification({
          type: 'success',
          title: '✅ Todo Created',
          message: `${formData.title} added to your todos`
        })
      }
    } catch (err) {
      addNotification({
        type: 'alert',
        title: '⚠️ Error',
        message: 'Failed to create todo'
      })
      throw new Error('Failed to create todo')
    }
  }

  const handleEditTodo = async (formData) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/api/todos/${editingTodo.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        const data = await response.json()
        setTodos(todos.map(t => t.id === editingTodo.id ? data.todo : t))
        setIsModalOpen(false)
        setEditingTodo(null)
        addNotification({
          type: 'success',
          title: '✏️ Todo Updated',
          message: `${formData.title} has been updated`
        })
      }
    } catch (err) {
      addNotification({
        type: 'alert',
        title: '⚠️ Error',
        message: 'Failed to update todo'
      })
      throw new Error('Failed to update todo')
    }
  }

  const handleCompleteTodo = async (todoId) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/api/todos/${todoId}/complete`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        setTodos(todos.map(t => t.id === todoId ? data.todo : t))
        addNotification({
          type: 'success',
          title: '✅ Todo Completed',
          message: 'Great job, boss! Todo marked complete.'
        })
        
        // Auto-delete after 2 seconds
        setTimeout(() => {
          handleDeleteTodo(todoId)
        }, 2000)
      }
    } catch (err) {
      console.error('Failed to complete todo:', err)
      addNotification({
        type: 'alert',
        title: '⚠️ Error',
        message: 'Failed to complete todo'
      })
    }
  }

  const handleDeleteTodo = async (todoId) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/api/todos/${todoId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        setTodos(todos.filter(t => t.id !== todoId))
        addNotification({
          type: 'info',
          title: '🗑️ Todo Deleted',
          message: 'Todo removed from your list'
        })
      }
    } catch (err) {
      console.error('Failed to delete todo:', err)
      addNotification({
        type: 'alert',
        title: '⚠️ Error',
        message: 'Failed to delete todo'
      })
    }
  }

  const handleEdit = (todo) => {
    setEditingTodo(todo)
    setIsModalOpen(true)
  }

  const pendingTodos = todos.filter(t => !t.completed)
  const completedTodos = todos.filter(t => t.completed)
  const highRiskTodos = todos.filter(t => t.riskLevel === 'high' && !t.completed)

  return (
    <div className="min-h-screen bg-gradient-to-br from-command-dark via-command-slate to-command-dark">
      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ x: [0, 50, 0], y: [0, 30, 0] }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute top-10 left-10 w-72 h-72 bg-command-cobalt/10 rounded-full blur-3xl"
        />
      </div>

      {/* Header */}
      <div className="sticky top-0 z-40 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-6 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => window.location.hash = '#/dashboard'}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-command-gold hover:bg-glass-bg transition-colors"
            >
              <ArrowLeft size={18} />
              Back
            </motion.button>
            <div>
              <h1 className="text-3xl font-bold text-white">📋 My Todos</h1>
              <p className="text-sm text-gray-400 mt-1">Track your tasks with location and time awareness</p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setEditingTodo(null)
              setIsModalOpen(true)
            }}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-command-gold to-command-cobalt text-command-dark font-semibold hover:shadow-lg transition-all"
          >
            <Plus size={20} />
            Add Todo
          </motion.button>
        </div>
      </div>

      {/* Stats */}
      <div className="sticky top-20 z-30 backdrop-blur-xl border-b border-white/10 py-4">
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3 rounded-lg bg-white/5 border border-white/10">
            <div className="text-2xl font-bold text-command-gold">{pendingTodos.length}</div>
            <div className="text-xs text-gray-400">Pending Todos</div>
          </div>
          <div className="p-3 rounded-lg bg-white/5 border border-white/10">
            <div className="text-2xl font-bold text-green-400">{completedTodos.length}</div>
            <div className="text-xs text-gray-400">Completed</div>
          </div>
          <div className="p-3 rounded-lg bg-white/5 border border-white/10">
            <div className="text-2xl font-bold text-red-400">{highRiskTodos.length}</div>
            <div className="text-xs text-gray-400">High Risk</div>
          </div>
          {userLocation && (
            <div className="p-3 rounded-lg bg-white/5 border border-white/10">
              <div className="text-xs text-command-gold">📍 Location Active</div>
              <div className="text-xs text-gray-400 mt-1">Real-time tracking</div>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="relative z-20 max-w-6xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader className="animate-spin text-command-gold" size={40} />
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-red-400">{error}</p>
          </div>
        ) : (
          <>
            {/* Pending Todos */}
            {pendingTodos.length > 0 ? (
              <div>
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                  📝 Active Todos
                  {highRiskTodos.length > 0 && (
                    <span className="flex items-center gap-1 ml-auto text-sm bg-red-500/20 text-red-300 px-3 py-1 rounded-full">
                      <AlertTriangle size={14} />
                      {highRiskTodos.length} High Risk
                    </span>
                  )}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                  <AnimatePresence>
                    {pendingTodos.map(todo => (
                      <TodoCard
                        key={todo.id}
                        todo={todo}
                        onComplete={handleCompleteTodo}
                        onDelete={handleDeleteTodo}
                        onEdit={handleEdit}
                        userLocation={userLocation}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            ) : (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">🎉</div>
                <p className="text-gray-400 text-lg">No pending todos! You're all set, boss.</p>
              </div>
            )}

            {/* Completed Todos */}
            {completedTodos.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-gray-400 mb-4 flex items-center gap-2">
                  <CheckCircle2 size={20} className="text-green-400" />
                  Completed ({completedTodos.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <AnimatePresence>
                    {completedTodos.map(todo => (
                      <motion.div
                        key={todo.id}
                        initial={{ opacity: 0 }}
                        exit={{ opacity: 0 }}
                        className="p-4 rounded-xl bg-white/5 border border-green-500/30 opacity-60"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-sm font-semibold text-gray-300 line-through">{todo.title}</h3>
                            <p className="text-xs text-gray-500 mt-1">
                              Completed at {new Date(todo.completedAt).toLocaleTimeString()}
                            </p>
                          </div>
                          <CheckCircle2 size={20} className="text-green-400" />
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal */}
      <TodoModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingTodo(null)
        }}
        onSave={editingTodo ? handleEditTodo : handleAddTodo}
        todo={editingTodo}
      />
    </div>
  )
}
