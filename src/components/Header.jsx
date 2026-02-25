import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Clock, Flame, Trophy } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { API_URL } from '../config/apiConfig'

export default function Header() {
  const { token } = useAuth()
  const [stats, setStats] = useState({
    streak: '0 days',
    completedToday: '0 today',
    timeSpent: '0m'
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) {
      setLoading(false)
      return
    }

    const fetchStats = async () => {
      try {
        const response = await fetch(`${API_URL}/api/users/stats`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        })
        
        if (response.ok) {
          const data = await response.json()
          setStats({
            streak: data.streak,
            completedToday: data.completedToday,
            timeSpent: data.timeSpent
          })
        }
      } catch (error) {
        console.error('Error fetching stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [token])

  const statsList = [
    { icon: Flame, label: 'Streak', value: stats.streak, color: 'text-red-400' },
    { icon: Trophy, label: 'Completed', value: stats.completedToday, color: 'text-yellow-400' },
    { icon: Clock, label: 'Time Spent', value: stats.timeSpent, color: 'text-blue-400' },
  ]

  return (
    <header className="sticky top-0 z-30 bg-gradient-to-b from-command-dark to-transparent backdrop-blur-xl border-b border-glass-border">
      <div className="px-6 py-6">
        <div className="flex items-start justify-between gap-6">
          <div className="flex-1">
            <motion.h1
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl font-bold text-white"
            >
              Command Center
            </motion.h1>
            <p className="text-sm text-gray-400 mt-1">Welcome back, Chief. Time to execute.</p>
          </div>

          {/* Stats */}
          <div className="hidden lg:grid grid-cols-3 gap-4">
            {statsList.map((stat, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.1 }}
                className="px-4 py-3 rounded-lg bg-glass-bg border border-glass-border backdrop-blur-xl"
              >
                <div className="flex items-center gap-2">
                  <stat.icon size={16} className={stat.color} />
                  <div className="text-xs text-gray-400">{stat.label}</div>
                </div>
                <div className="text-lg font-semibold text-white mt-1">{stat.value}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </header>
  )
}
