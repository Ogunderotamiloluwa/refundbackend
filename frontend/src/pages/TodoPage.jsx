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
    let token = null
    try {
      token = localStorage.getItem('token')
      if (!token) {
        throw new Error('No authentication token found')
      }

      const response = await fetch(`${API_URL}/api/todos`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Failed to create todo (${response.status})`)
      }

      const data = await response.json()
      
      // Close modal first
      setIsModalOpen(false)
      setEditingTodo(null)
      
      // Show notification
      addNotification({
        type: 'success',
        title: 'Todo Created',
        message: `${formData.title} added to your todos`
      })
      
      // Reload all todos from backend
      await loadTodos()
      
    } catch (err) {
      console.error('❌ Error creating todo:', err)
      addNotification({
        type: 'alert',
        title: 'Error',
        message: err.message || 'Failed to create todo'
      })
      throw new Error(err.message || 'Failed to create todo')
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
          title: 'Todo Updated',
          message: `${formData.title} has been updated`
        })
      }
    } catch (err) {
      addNotification({
        type: 'alert',
        title: 'Error',
        message: 'Failed to update todo'
      })
      throw new Error('Failed to update todo')
    }
  }

  const handleCompleteTodo = async (todoId) => {
    try {
      const token = localStorage.getItem('token')
      if (!token) throw new Error('No authentication token')
      
      console.log('📌 Completing todo:', todoId)
      const response = await fetch(`${API_URL}/api/todos/${todoId}/complete`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const data = await response.json()
      console.log('✅ Todo completed:', data)
      
      setTodos(todos.map(t => String(t.id) === String(todoId) ? data.todo : t))
      addNotification({
        type: 'success',
        title: 'Todo Completed',
        message: 'Great job, boss! Todo marked complete.'
      })
      
      // Auto-delete after 2 seconds
      setTimeout(() => {
        handleDeleteTodo(todoId)
      }, 2000)
    } catch (err) {
      console.error('❌ Failed to complete todo:', err)
      addNotification({
        type: 'alert',
        title: 'Error',
        message: `Failed to complete todo: ${err.message}`
      })
    }
  }

  const handleDeleteTodo = async (todoId) => {
    try {
      const token = localStorage.getItem('token')
      if (!token) throw new Error('No authentication token')
      
      console.log('🗑️ Deleting todo:', todoId)
      const response = await fetch(`${API_URL}/api/todos/${todoId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      console.log('✅ Todo deleted')
      setTodos(todos.filter(t => String(t.id) !== String(todoId)))
      addNotification({
        type: 'info',
        title: 'Todo Deleted',
        message: 'Todo removed from your list'
      })
    } catch (err) {
      console.error('❌ Failed to delete todo:', err)
      addNotification({
        type: 'alert',
        title: 'Error',
        message: `Failed to delete todo: ${err.message}`
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:bg-gray-900 dark:text-white">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => window.location.hash = '#/dashboard'}
                className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors text-sm"
              >
                <ArrowLeft size={18} />
                <span className="hidden sm:inline">Back</span>
              </motion.button>
              <div>
                <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900">Tasks</h1>
                <p className="text-sm text-gray-500 hidden sm:block">Manage your daily tasks and reminders</p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setEditingTodo(null)
                setIsModalOpen(true)
              }}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 sm:px-6 sm:py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors text-sm"
            >
              <Plus size={18} />
              <span>Add Task</span>
            </motion.button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="bg-gray-50 border-b border-gray-200 py-3 sm:py-4">
        <div className="max-w-4xl mx-auto px-4 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-3 sm:p-4 rounded-lg bg-white border border-gray-200">
            <div className="text-xl sm:text-2xl font-bold text-gray-900">{pendingTodos.length}</div>
            <div className="text-xs text-gray-600 uppercase tracking-wide">Active</div>
          </div>
          <div className="p-3 sm:p-4 rounded-lg bg-white border border-gray-200">
            <div className="text-xl sm:text-2xl font-bold text-green-600">{completedTodos.length}</div>
            <div className="text-xs text-gray-600 uppercase tracking-wide">Completed</div>
          </div>
          <div className="p-3 sm:p-4 rounded-lg bg-white border border-gray-200">
            <div className="text-xl sm:text-2xl font-bold text-red-600">{highRiskTodos.length}</div>
            <div className="text-xs text-gray-600 uppercase tracking-wide">Urgent</div>
          </div>
          {userLocation && (
            <div className="p-3 sm:p-4 rounded-lg bg-white border border-gray-200">
              <div className="text-sm font-semibold text-blue-600">Location</div>
              <div className="text-xs text-gray-600 uppercase tracking-wide mt-1">Active</div>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
        {loading ? (
          <div className="flex items-center justify-center py-16 sm:py-20">
            <Loader className="animate-spin text-gray-400" size={40} />
          </div>
        ) : error ? (
          <div className="text-center py-16 sm:py-20">
            <p className="text-red-600 text-sm sm:text-base">{error}</p>
          </div>
        ) : (
          <>
            {/* Pending Todos */}
            {pendingTodos.length > 0 ? (
              <div>
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 flex flex-col sm:flex-row sm:items-center sm:gap-3">
                  Active Tasks
                  {highRiskTodos.length > 0 && (
                    <span className="flex items-center gap-2 text-xs sm:text-sm bg-red-50 text-red-700 px-3 py-1.5 sm:py-2 rounded-full mt-2 sm:mt-0 w-fit border border-red-200">
                      <AlertTriangle size={14} />
                      {highRiskTodos.length} Urgent
                    </span>
                  )}
                </h2>
                <div className="grid grid-cols-1 gap-3 sm:gap-4 mb-8">
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
              <div className="text-center py-16 sm:py-20">
                <div className="text-4xl sm:text-5xl mb-3 sm:mb-4">✓</div>
                <p className="text-gray-500 text-base sm:text-lg">No active tasks. Great work!</p>
              </div>
            )}

            {/* Completed Todos */}
            {completedTodos.length > 0 && (
              <div>
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <CheckCircle2 size={20} className="text-green-600" />
                  Completed ({completedTodos.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  <AnimatePresence>
                    {completedTodos.map(todo => (
                      <motion.div
                        key={todo.id}
                        initial={{ opacity: 0 }}
                        exit={{ opacity: 0 }}
                        className="p-4 rounded-lg bg-gray-50 border border-gray-200"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-sm font-medium text-gray-500 line-through">{todo.title}</h3>
                            <p className="text-xs text-gray-400 mt-2">
                              Completed {new Date(todo.completedAt).toLocaleDateString()}
                            </p>
                          </div>
                          <CheckCircle2 size={18} className="text-green-600 flex-shrink-0" />
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
      <AnimatePresence>
        {isModalOpen && (
          <TodoModal
            isOpen={isModalOpen}
            onClose={() => {
              setIsModalOpen(false)
              setEditingTodo(null)
            }}
            onSave={editingTodo ? handleEditTodo : handleAddTodo}
            todo={editingTodo}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
