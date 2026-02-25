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
              <h1 className="text-3xl font-bold text-white">Routines</h1>
              <p className="text-sm text-gray-400">Organize your daily routines</p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setEditingRoutine(null)
              setIsModalOpen(true)
            }}
            className="flex items-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-command-gold to-command-cobalt text-command-dark font-semibold hover:shadow-lg transition-all"
          >
            <Plus size={20} />
            New Routine
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
            <div className="text-gray-400 text-sm mb-2">Total Routines</div>
            <div className="text-4xl font-bold text-command-gold">{routines.length}</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-6 rounded-2xl bg-glass-bg border border-glass-border backdrop-blur-xl"
          >
            <div className="text-gray-400 text-sm mb-2">Today's Routines</div>
            <div className="text-4xl font-bold text-command-cobalt">{todayRoutines.length}</div>
            <div className="text-xs text-gray-500 mt-2">{today}'s schedule</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-6 rounded-2xl bg-glass-bg border border-glass-border backdrop-blur-xl"
          >
            <div className="text-gray-400 text-sm mb-2">Total Tasks</div>
            <div className="text-4xl font-bold text-green-400">
              {routines.reduce((sum, r) => sum + (r.tasks?.length || 0), 0)}
            </div>
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
        ) : routines.length === 0 ? (
          // Empty State
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16"
          >
            <div className="text-6xl mb-4">⏰</div>
            <h2 className="text-2xl font-bold text-white mb-2">No routines yet</h2>
            <p className="text-gray-400 mb-6">Create your first routine to organize your day!</p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-command-gold to-command-cobalt text-command-dark font-semibold hover:shadow-lg transition-all"
            >
              <Plus size={20} />
              Create First Routine
            </motion.button>
          </motion.div>
        ) : (
          <>
            {/* Today's Routines Section */}
            {todayRoutines.length > 0 && (
              <div className="mb-10">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Clock size={20} className="text-command-gold" />
                  Today's Schedule
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
              <h2 className="text-xl font-bold text-white mb-4">All Routines</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
