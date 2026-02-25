import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, TrendingUp, Flame, Target, Calendar, BarChart3, LineChart, PieChart } from 'lucide-react'
import { API_URL } from '../config/apiConfig'

export default function AnalyticsPage() {
  const [habits, setHabits] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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
        setError('Failed to load analytics')
      }
    } catch (err) {
      setError('Connection error loading analytics')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Calculate analytics
  const totalHabits = habits.length
  const completedToday = habits.filter(h => h.completed).length
  const averageProgress = habits.length > 0 
    ? Math.round(habits.reduce((sum, h) => sum + (h.progress || 0), 0) / habits.length)
    : 0
  const totalStreak = habits.reduce((sum, h) => sum + (h.streak || 0), 0)
  const bestStreak = habits.length > 0 
    ? Math.max(...habits.map(h => h.streak || 0), 0)
    : 0

  // Calculate weekly stats
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const weeklyStats = days.map(day => {
    const dayHabits = habits.filter(h => h.completedDates?.some(d => 
      new Date(d).toLocaleDateString('en-US', { weekday: 'short' }) === day
    ) || false)
    return {
      day,
      count: dayHabits.length,
      percentage: habits.length > 0 ? Math.round((dayHabits.length / habits.length) * 100) : 0
    }
  })

  // Calculate frequency breakdown
  const frequencyStats = {
    daily: habits.filter(h => h.frequency === 'daily').length,
    weekly: habits.filter(h => h.frequency === 'weekly').length,
    monthly: habits.filter(h => h.frequency === 'monthly').length,
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-command-dark via-command-slate to-command-dark flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-12 h-12 border-4 border-command-gold border-t-transparent rounded-full"
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-command-dark via-command-slate to-command-dark pb-12">
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
        <div className="max-w-7xl mx-auto px-4 py-6 flex items-center gap-4">
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
            <h1 className="text-3xl font-bold text-white">Analytics</h1>
            <p className="text-sm text-gray-400">Your habit performance insights</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8 relative z-10">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-lg bg-red-500/20 border border-red-500/50 text-red-200"
          >
            {error}
          </motion.div>
        )}

        {totalHabits === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20"
          >
            <div className="text-6xl mb-4">📊</div>
            <h2 className="text-2xl font-bold text-white mb-2">No data yet</h2>
            <p className="text-gray-400">Create habits to see your analytics</p>
          </motion.div>
        ) : (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {/* Total Habits */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 rounded-2xl bg-glass-bg border border-glass-border backdrop-blur-xl hover:border-command-gold/50 transition-all"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-gray-400 text-sm">Total Habits</span>
                  <Target size={20} className="text-command-gold" />
                </div>
                <div className="text-4xl font-bold text-white mb-2">{totalHabits}</div>
                <div className="text-xs text-gray-500">{totalHabits} active</div>
              </motion.div>

              {/* Completed Today */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="p-6 rounded-2xl bg-glass-bg border border-glass-border backdrop-blur-xl hover:border-green-500/50 transition-all"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-gray-400 text-sm">Today</span>
                  <Calendar size={20} className="text-green-400" />
                </div>
                <div className="text-4xl font-bold text-white mb-2">{completedToday}/{totalHabits}</div>
                <div className="text-xs text-gray-500">
                  {totalHabits > 0 ? Math.round((completedToday / totalHabits) * 100) : 0}% complete
                </div>
              </motion.div>

              {/* Average Progress */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="p-6 rounded-2xl bg-glass-bg border border-glass-border backdrop-blur-xl hover:border-command-cobalt/50 transition-all"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-gray-400 text-sm">Avg Progress</span>
                  <TrendingUp size={20} className="text-command-cobalt" />
                </div>
                <div className="text-4xl font-bold text-white mb-2">{averageProgress}%</div>
                <div className="text-xs text-gray-500">toward 30-day goal</div>
              </motion.div>

              {/* Best Streak */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="p-6 rounded-2xl bg-glass-bg border border-glass-border backdrop-blur-xl hover:border-orange-500/50 transition-all"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-gray-400 text-sm">Best Streak</span>
                  <Flame size={20} className="text-orange-400" />
                </div>
                <div className="text-4xl font-bold text-white mb-2">{bestStreak}</div>
                <div className="text-xs text-gray-500">days in a row</div>
              </motion.div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Weekly Performance */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 rounded-2xl bg-glass-bg border border-glass-border backdrop-blur-xl"
              >
                <div className="flex items-center gap-2 mb-6">
                  <BarChart3 size={20} className="text-command-gold" />
                  <h2 className="text-lg font-semibold text-white">Weekly Performance</h2>
                </div>
                <div className="space-y-3">
                  {weeklyStats.map((stat, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <span className="text-sm text-gray-400 w-12">{stat.day}</span>
                      <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${stat.percentage}%` }}
                          transition={{ delay: idx * 0.05, duration: 0.8 }}
                          className="h-full bg-gradient-to-r from-command-gold to-command-cobalt"
                        />
                      </div>
                      <span className="text-sm text-gray-400 w-12 text-right">{stat.percentage}%</span>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Frequency Breakdown */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="p-6 rounded-2xl bg-glass-bg border border-glass-border backdrop-blur-xl"
              >
                <div className="flex items-center gap-2 mb-6">
                  <PieChart size={20} className="text-command-gold" />
                  <h2 className="text-lg font-semibold text-white">Habit Frequency</h2>
                </div>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-400">Daily</span>
                      <span className="text-sm font-semibold text-white">{frequencyStats.daily}</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500"
                        style={{ width: `${(frequencyStats.daily / totalHabits) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-400">Weekly</span>
                      <span className="text-sm font-semibold text-white">{frequencyStats.weekly}</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-purple-500"
                        style={{ width: `${(frequencyStats.weekly / totalHabits) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-400">Monthly</span>
                      <span className="text-sm font-semibold text-white">{frequencyStats.monthly}</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-cyan-500"
                        style={{ width: `${(frequencyStats.monthly / totalHabits) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Top Habits */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 rounded-2xl bg-glass-bg border border-glass-border backdrop-blur-xl"
            >
              <h2 className="text-lg font-semibold text-white mb-6">Top Performing Habits</h2>
              <div className="space-y-3">
                {habits
                  .sort((a, b) => (b.progress || 0) - (a.progress || 0))
                  .slice(0, 5)
                  .map((habit, idx) => (
                    <motion.div
                      key={habit.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="flex items-center justify-between p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-all"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <span className="text-2xl">{habit.icon || '🎯'}</span>
                        <div>
                          <h3 className="text-sm font-semibold text-white">{habit.name}</h3>
                          <p className="text-xs text-gray-500">{habit.frequency}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-command-gold">{habit.progress || 0}%</div>
                        {habit.streak !== undefined && (
                          <div className="text-xs text-orange-400 flex items-center gap-1">
                            <Flame size={12} />
                            {habit.streak} days
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
              </div>
            </motion.div>
          </>
        )}
      </div>
    </div>
  )
}
