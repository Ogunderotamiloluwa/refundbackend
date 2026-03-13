import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, ArrowLeft, Loader } from 'lucide-react'
import { API_URL } from '../config/apiConfig'
import HabitCardEnhanced from '../components/HabitCardEnhanced'
import HabitModal from '../components/HabitModal'
import StatsOverview from '../components/StatsOverview'
import { useNotifications } from '../context/NotificationContext'

export default function HabitsManagementPage() {
  const [habits, setHabits] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingHabit, setEditingHabit] = useState(null)
  const { addNotification } = useNotifications()

  useEffect(() => {
    loadHabits()
  }, [])

  const loadHabits = async () => {
    setLoading(true)
    setError('')
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/api/habits`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        setHabits(data.habits || [])
      } else {
        setError('Failed to load habits')
      }
    } catch (err) {
      setError('Connection error loading habits')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddHabit = async (formData) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/api/habits`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        const data = await response.json()
        setHabits([...habits, data.habit])
        setIsModalOpen(false)
        setEditingHabit(null)
        addNotification({
          type: 'success',
          title: 'New Habit Created',
          message: `${formData.name} added to your habits. Let's build this!`
        })
      }
    } catch (err) {
      addNotification({
        type: 'alert',
        title: 'Error',
        message: 'Failed to create habit'
      })
      throw new Error('Failed to create habit')
    }
  }

  const handleEditHabit = async (formData) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/api/habits/${editingHabit.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        const data = await response.json()
        setHabits(habits.map(h => h.id === editingHabit.id ? data.habit : h))
        setIsModalOpen(false)
        setEditingHabit(null)
        addNotification({
          type: 'success',
          title: 'Habit Updated',
          message: `${formData.name} has been updated`
        })
      }
    } catch (err) {
      addNotification({
        type: 'alert',
        title: 'Error',
        message: 'Failed to update habit'
      })
      throw new Error('Failed to update habit')
    }
  }

  const handleCompleteHabit = (data) => {
    loadHabits() // Reload to get updated progress
  }

  const handleDeleteHabit = (habitId) => {
    setHabits(habits.filter(h => h.id !== habitId))
  }

  const handleEdit = (habit) => {
    setEditingHabit(habit)
    setIsModalOpen(true)
  }

  const totalHabits = habits.length
  const completedToday = habits.filter(h => h.completed).length
  const averageProgress = habits.length > 0 
    ? Math.round(habits.reduce((sum, h) => sum + (h.progress || 0), 0) / habits.length)
    : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:bg-gray-900 dark:text-white">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-6xl mx-auto px-4 py-4 md:py-6 flex justify-between items-center gap-4">
          <div className="flex items-center gap-3 md:gap-4 flex-1">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => window.location.hash = '#/dashboard'}
              className="flex items-center justify-center p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors flex-shrink-0"
            >
              <ArrowLeft size={18} className="md:w-5 md:h-5" />
            </motion.button>
            <div className="min-w-0">
              <h1 className="text-xl md:text-3xl font-semibold text-gray-900 truncate">Habits</h1>
              <p className="text-xs md:text-sm text-gray-500 hidden sm:block">Build consistent habits and track progress</p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setEditingHabit(null)
              setIsModalOpen(true)
            }}
            className="flex items-center gap-2 px-4 md:px-6 py-2 md:py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors flex-shrink-0 text-sm md:text-base"
          >
            <Plus size={16} className="md:w-5 md:h-5" />
            <span className="hidden sm:inline">New Habit</span>
            <span className="sm:hidden">Add</span>
          </motion.button>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-6xl mx-auto px-4 py-6 md:py-8">
        <StatsOverview />

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm"
          >
            {error}
          </motion.div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full"
            />
          </div>
        ) : habits.length === 0 ? (
          // Empty State
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-12 md:py-16"
          >
            <div className="text-5xl md:text-6xl mb-4">✓</div>
            <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mb-2">No habits yet</h2>
            <p className="text-sm md:text-base text-gray-500 mb-6">Create your first habit to get started!</p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors text-sm md:text-base"
            >
              <Plus size={18} className="md:w-5 md:h-5" />
              Create First Habit
            </motion.button>
          </motion.div>
        ) : (
          // Habits Grid
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            <AnimatePresence>
              {habits.map((habit) => (
                <HabitCardEnhanced
                  key={habit.id}
                  habit={habit}
                  onComplete={handleCompleteHabit}
                  onDelete={handleDeleteHabit}
                  onEdit={handleEdit}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Modal */}
      <HabitModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingHabit(null)
        }}
        onSave={editingHabit ? handleEditHabit : handleAddHabit}
        habit={editingHabit}
      />
    </div>
  )
}
