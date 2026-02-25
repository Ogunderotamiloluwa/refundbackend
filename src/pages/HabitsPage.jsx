import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, ArrowLeft, Loader } from 'lucide-react'
import { API_URL } from '../config/apiConfig'
import HabitCardEnhanced from '../components/HabitCardEnhanced'
import HabitModal from '../components/HabitModal'
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
          title: '🎯 New Habit Created',
          message: `${formData.name} added to your habits. Let's build this!`
        })
      }
    } catch (err) {
      addNotification({
        type: 'alert',
        title: '⚠️ Error',
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
          title: '✏️ Habit Updated',
          message: `${formData.name} has been updated`
        })
      }
    } catch (err) {
      addNotification({
        type: 'alert',
        title: '⚠️ Error',
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
              <h1 className="text-3xl font-bold text-white">Habits</h1>
              <p className="text-sm text-gray-400">Track and manage your daily habits</p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setEditingHabit(null)
              setIsModalOpen(true)
            }}
            className="flex items-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-command-gold to-command-cobalt text-command-dark font-semibold hover:shadow-lg transition-all"
          >
            <Plus size={20} />
            New Habit
          </motion.button>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-6xl mx-auto px-4 py-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 rounded-2xl bg-glass-bg border border-glass-border backdrop-blur-xl"
          >
            <div className="text-gray-400 text-sm mb-2">Total Habits</div>
            <div className="text-4xl font-bold text-command-gold">{totalHabits}</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-6 rounded-2xl bg-glass-bg border border-glass-border backdrop-blur-xl"
          >
            <div className="text-gray-400 text-sm mb-2">Completed Today</div>
            <div className="text-4xl font-bold text-green-400">{completedToday}</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-6 rounded-2xl bg-glass-bg border border-glass-border backdrop-blur-xl"
          >
            <div className="text-gray-400 text-sm mb-2">Average Progress</div>
            <div className="text-4xl font-bold text-command-cobalt">{averageProgress}%</div>
          </motion.div>
        </div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-lg bg-red-500/20 border border-red-500/50 text-red-200"
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
              className="w-12 h-12 border-4 border-command-gold border-t-transparent rounded-full"
            />
          </div>
        ) : habits.length === 0 ? (
          // Empty State
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16"
          >
            <div className="text-6xl mb-4">🎯</div>
            <h2 className="text-2xl font-bold text-white mb-2">No habits yet</h2>
            <p className="text-gray-400 mb-6">Create your first habit to get started!</p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-command-gold to-command-cobalt text-command-dark font-semibold hover:shadow-lg transition-all"
            >
              <Plus size={20} />
              Create First Habit
            </motion.button>
          </motion.div>
        ) : (
          // Habits Grid
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
