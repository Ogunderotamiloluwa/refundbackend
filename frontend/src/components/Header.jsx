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
    { icon: Flame, label: 'Streak', value: stats.streak, color: 'text-orange-600' },
    { icon: Trophy, label: 'Completed', value: stats.completedToday, color: 'text-blue-600' },
    { icon: Clock, label: 'Time Spent', value: stats.timeSpent, color: 'text-green-600' },
  ]

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
      <div className="px-4 md:px-6 py-4 md:py-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 md:gap-6">
          <div className="flex-1">
            <motion.h1
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-2xl md:text-3xl font-bold text-gray-900"
            >
              Command Center
            </motion.h1>
            <p className="text-xs md:text-sm text-gray-600 mt-0.5 md:mt-1 hidden sm:block">Welcome back. Time to stay productive.</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 md:gap-4 md:hidden">
            {statsList.map((stat, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.1 }}
                className="p-2 md:p-3 rounded bg-white border border-gray-200 hover:border-blue-300 transition-all"
              >
                <stat.icon size={14} className={`${stat.color} md:w-4 md:h-4`} />
                <div className="text-xs text-gray-600 mt-1 truncate">{stat.label}</div>
                <div className="text-sm md:text-lg font-semibold text-gray-900 mt-0.5">{stat.value}</div>
              </motion.div>
            ))}
          </div>

          <div className="hidden lg:grid grid-cols-3 gap-4">
            {statsList.map((stat, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.1 }}
                className="px-4 py-3 rounded-lg bg-white border border-gray-200 hover:border-blue-300 transition-all"
              >
                <div className="flex items-center gap-2">
                  <stat.icon size={16} className={stat.color} />
                  <div className="text-xs text-gray-600">{stat.label}</div>
                </div>
                <div className="text-lg font-semibold text-gray-900 mt-1">{stat.value}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </header>
  )
}
