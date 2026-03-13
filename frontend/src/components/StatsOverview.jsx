import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Flame, CheckCircle2, TrendingUp, Target } from 'lucide-react'
import { API_URL } from '../config/apiConfig'

export default function StatsOverview() {
  const [stats, setStats] = useState({
    completedToday: 0,
    totalHabits: 0,
    completionRate: 0,
    streak: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
    // Refresh stats every 30 seconds
    const interval = setInterval(loadStats, 30000)
    return () => clearInterval(interval)
  }, [])

  const loadStats = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        setLoading(false)
        return
      }
      
      // Fetch habits data
      const habitsResponse = await fetch(`${API_URL}/api/habits`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (habitsResponse.ok) {
        const habitsData = await habitsResponse.json()
        const habits = habitsData.habits || []
        
        // Count completed habits (check if completed flag is true)
        const completedToday = habits.filter(h => h.completed === true).length
        const totalHabits = habits.length
        const completionRate = totalHabits > 0 ? Math.round((completedToday / totalHabits) * 100) : 0
        
        // Calculate streak - sum of all completion dates from all habits
        let maxStreak = 0
        if (habits.length > 0) {
          habits.forEach(habit => {
            if (habit.streak) {
              maxStreak = Math.max(maxStreak, habit.streak)
            }
          })
        }
        
        setStats({
          completedToday,
          totalHabits,
          completionRate,
          streak: maxStreak
        })
      }
    } catch (err) {
      console.error('Error loading stats:', err)
    } finally {
      setLoading(false)
    }
  }

  const containerVariants = {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  }

  const itemVariants = {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 }
  }

  const getCardStyles = (accentColor) => {
    const colorMap = {
      'orange': { bg: 'bg-orange-50 border-orange-200', icon: 'text-orange-600', bg_light: 'bg-orange-100' },
      'emerald': { bg: 'bg-emerald-50 border-emerald-200', icon: 'text-emerald-600', bg_light: 'bg-emerald-100' },
      'blue': { bg: 'bg-blue-50 border-blue-200', icon: 'text-blue-600', bg_light: 'bg-blue-100' },
      'indigo': { bg: 'bg-indigo-50 border-indigo-200', icon: 'text-indigo-600', bg_light: 'bg-indigo-100' }
    }
    return colorMap[accentColor] || colorMap.blue
  }

  const StatCard = ({ Icon, label, value, accentColor, delay, unit = '' }) => {
    const styles = getCardStyles(accentColor)
    const textGradients = {
      'orange': 'bg-gradient-to-r from-orange-500 to-orange-600',
      'emerald': 'bg-gradient-to-r from-emerald-500 to-emerald-600',
      'blue': 'bg-gradient-to-r from-blue-500 to-blue-600',
      'indigo': 'bg-gradient-to-r from-indigo-500 to-indigo-600'
    }

    return (
      <motion.div
        variants={itemVariants}
        transition={{ delay }}
        whileHover={{ y: -4, boxShadow: "0 20px 40px rgba(0, 0, 0, 0.08)" }}
        className={`p-5 md:p-6 rounded-2xl bg-white border-2 ${styles.bg} shadow-md hover:shadow-xl transition-all group`}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="text-xs md:text-sm text-gray-500 mb-2 md:mb-3 font-medium uppercase tracking-wide">{label}</div>
            <div className={`text-3xl md:text-4xl font-bold ${textGradients[accentColor]} bg-clip-text text-transparent`}>
              {value}{unit}
            </div>
          </div>
          <div className={`p-3 md:p-4 rounded-xl ${styles.bg_light} w-fit`}>
            <Icon size={24} className={`md:w-7 md:h-7 ${styles.icon}`} />
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="initial"
      animate="animate"
      className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8"
    >
      <StatCard
        Icon={Flame}
        label="Streak"
        value={stats.streak}
        unit=" days"
        accentColor="orange"
        delay={0}
      />

      <StatCard
        Icon={CheckCircle2}
        label="Completed"
        value={`${stats.completedToday}/${stats.totalHabits}`}
        accentColor="emerald"
        delay={0.1}
      />

      <StatCard
        Icon={TrendingUp}
        label="Completion"
        value={stats.completionRate}
        unit="%"
        accentColor="blue"
        delay={0.2}
      />

      <StatCard
        Icon={Target}
        label="Total Goals"
        value={stats.totalHabits}
        accentColor="indigo"
        delay={0.3}
      />
    </motion.div>
  )
}
