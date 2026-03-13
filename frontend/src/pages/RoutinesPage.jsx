import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, ArrowLeft, Clock } from 'lucide-react'
import { API_URL } from '../config/apiConfig'
import RoutineCard from '../components/RoutineCard'
import RoutineModal from '../components/RoutineModal'

export default function RoutinesPage() {
  const [routines, setRoutines] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingRoutine, setEditingRoutine] = useState(null)

  useEffect(() => {
    loadRoutines()
  }, [])

  const loadRoutines = async () => {
    setLoading(true)
    setError('')
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/api/routines`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        setRoutines(data.routines || [])
      } else {
        setError('Failed to load routines')
      }
    } catch (err) {
      setError('Connection error loading routines')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddRoutine = async (formData) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/api/routines`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        const data = await response.json()
        setRoutines([...routines, data.routine])
        setIsModalOpen(false)
        setEditingRoutine(null)
      }
    } catch (err) {
      throw new Error('Failed to create routine')
    }
  }

  const handleEditRoutine = async (formData) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/api/routines/${editingRoutine.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        const data = await response.json()
        setRoutines(routines.map(r => r.id === editingRoutine.id ? data.routine : r))
        setIsModalOpen(false)
        setEditingRoutine(null)
      }
    } catch (err) {
      throw new Error('Failed to update routine')
    }
  }

  const handleDeleteRoutine = (routineId) => {
    setRoutines(routines.filter(r => r.id !== routineId))
  }

  const handleEdit = (routine) => {
    setEditingRoutine(routine)
    setIsModalOpen(true)
  }

  const today = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][new Date().getDay() - 1 || 6]
  const todayRoutines = routines.filter(r => r.repeatDays?.includes(today))

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:bg-gray-900 dark:text-white">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-6xl mx-auto px-4 py-4 md:py-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-6">
            <div className="flex items-center gap-3 flex-shrink-0 w-full sm:w-auto">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => window.location.hash = '#/dashboard'}
                className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors text-sm"
              >
                <ArrowLeft size={18} />
                <span className="hidden sm:inline">Back</span>
              </motion.button>
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 truncate">Routines</h1>
                <p className="text-sm text-gray-500 hidden sm:block">Organize and automate your daily schedule</p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setEditingRoutine(null)
                setIsModalOpen(true)
              }}
              className="flex items-center justify-center gap-2 px-4 py-2.5 sm:px-6 sm:py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors text-sm flex-shrink-0 w-full sm:w-auto"
            >
              <Plus size={18} />
              <span>Add Routine</span>
            </motion.button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-6xl mx-auto px-4 py-6 md:py-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-lg bg-white border border-gray-200"
          >
            <div className="text-sm text-gray-600 mb-2">Total Routines</div>
            <div className="text-2xl sm:text-3xl font-bold text-blue-600">{routines.length}</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-4 rounded-lg bg-white border border-gray-200"
          >
            <div className="text-sm text-gray-600 mb-2">Today's Routines</div>
            <div className="text-2xl sm:text-3xl font-bold text-indigo-600">{todayRoutines.length}</div>
            <div className="text-xs text-gray-500 mt-1">{today}</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-4 rounded-lg bg-white border border-gray-200"
          >
            <div className="text-sm text-gray-600 mb-2">Total Tasks</div>
            <div className="text-2xl sm:text-3xl font-bold text-green-600">
              {routines.reduce((sum, r) => sum + (r.tasks?.length || 0), 0)}
            </div>
          </motion.div>
        </div>

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
          <div className="flex items-center justify-center py-20">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full"
            />
          </div>
        ) : routines.length === 0 ? (
          // Empty State
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20"
          >
            <div className="text-5xl sm:text-6xl mb-4">✓</div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">No routines yet</h2>
            <p className="text-gray-500 text-base mb-6 max-w-md mx-auto">Create your first routine to automate your daily schedule!</p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
            >
              <Plus size={18} />
              Create Routine
            </motion.button>
          </motion.div>
        ) : (
          <>
            {/* Today's Routines Section */}
            {todayRoutines.length > 0 && (
              <div className="mb-10">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Clock size={20} className="text-blue-600" />
                  Today's Schedule
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <AnimatePresence>
                    {todayRoutines.sort((a, b) => a.time.localeCompare(b.time)).map((routine) => (
                      <RoutineCard
                        key={routine.id}
                        routine={routine}
                        onDelete={handleDeleteRoutine}
                        onEdit={handleEdit}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}

            {/* All Routines Section */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">All Routines</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <AnimatePresence>
                  {routines.map((routine) => (
                    <RoutineCard
                      key={routine.id}
                      routine={routine}
                      onDelete={handleDeleteRoutine}
                      onEdit={handleEdit}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modal */}
      <RoutineModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingRoutine(null)
        }}
        onSave={editingRoutine ? handleEditRoutine : handleAddRoutine}
        routine={editingRoutine}
      />
    </div>
  )
}
