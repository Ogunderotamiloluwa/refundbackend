import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, CheckCircle2, Flame, ArrowRight, MapPin, Cloud, Sun, CloudRain } from 'lucide-react'
import { API_URL } from '../config/apiConfig'
import { getWeatherAlerts } from '../services/weatherService'

export default function DashboardSidebar() {
  const [habits, setHabits] = useState([])
  const [routines, setRoutines] = useState([])
  const [userLocation, setUserLocation] = useState(null)
  const [weather, setWeather] = useState(null)
  const [loading, setLoading] = useState(true)

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          })
        },
        (error) => console.log('Geolocation error:', error)
      )
    }
  }, [])

  // Fetch weather when location is available
  useEffect(() => {
    if (!userLocation) return

    const fetchWeather = async () => {
      try {
        const data = await getWeatherAlerts(userLocation.latitude, userLocation.longitude)
        setWeather(data)
      } catch (err) {
        console.log('Weather error:', err)
      }
    }

    fetchWeather()
    const interval = setInterval(fetchWeather, 10 * 60 * 1000) // Refresh every 10 minutes
    return () => clearInterval(interval)
  }, [userLocation])

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const loadData = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const [habitsRes, routinesRes] = await Promise.all([
        fetch(`${API_URL}/api/habits`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }),
        fetch(`${API_URL}/api/routines`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
      ])

      if (habitsRes.ok) {
        const data = await habitsRes.json()
        setHabits((data.habits || []).slice(0, 5))
      }

      if (routinesRes.ok) {
        const data = await routinesRes.json()
        setRoutines((data.routines || []).slice(0, 5))
      }
    } catch (err) {
      console.error('Error loading dashboard data:', err)
    } finally {
      setLoading(false)
    }
  }

  const getTodayRoutines = () => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    const today = days[new Date().getDay() - 1 || 6]
    return routines.filter(r => r.repeatDays?.includes(today))
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-6"
    >
      {/* Weather & Location Widget */}
      {weather && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-5 rounded-2xl border backdrop-blur-xl transition-all ${
            weather.raining || weather.snowing
              ? 'bg-red-500/10 border-red-500/50'
              : weather.cloudCover > 70
              ? 'bg-yellow-500/10 border-yellow-500/50'
              : 'bg-glass-bg border-glass-border'
          }`}
        >
          <div className="space-y-3">
            {/* Location */}
            {userLocation && (
              <div className="flex items-center gap-2 text-xs text-gray-300">
                <MapPin size={14} className="text-blue-400" />
                <span>📍 Live Location Active</span>
              </div>
            )}

            {/* Weather Status */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {weather.raining ? (
                  <CloudRain className="text-blue-400" size={20} />
                ) : weather.cloudCover > 70 ? (
                  <Cloud className="text-gray-400" size={20} />
                ) : (
                  <Sun className="text-yellow-400" size={20} />
                )}
                <div>
                  <div className="text-sm font-semibold text-white">
                    {weather.raining ? '🌧️ Raining' : weather.snowing ? '❄️ Snowing' : weather.cloudCover > 70 ? '☁️ Cloudy' : '☀️ Clear'}
                  </div>
                  <div className="text-xs text-gray-400">{Math.round(weather.temperature)}°C</div>
                </div>
              </div>
            </div>

            {/* Weather Details */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded-lg bg-white/5">
                <div className="text-gray-400">Cloud</div>
                <div className="text-white font-semibold">{weather.cloudCover}%</div>
              </div>
              <div className="p-2 rounded-lg bg-white/5">
                <div className="text-gray-400">Rain</div>
                <div className="text-white font-semibold">{weather.rain}mm</div>
              </div>
            </div>

            {/* Alert */}
            {(weather.raining || weather.snowing) && (
              <div className={`text-xs p-2 rounded-lg text-center font-semibold ${
                weather.raining ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-500/20 text-blue-300'
              }`}>
                {weather.raining ? '⚠️ Bad weather - reschedule outdoor activities' : '❄️ Snowing - Check road conditions'}
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Active Habits & Today's Routines - Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Habits Widget */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-2xl bg-glass-bg border border-glass-border backdrop-blur-xl"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-300">ACTIVE HABITS</h3>
            <motion.a
              href="#/habits"
              whileHover={{ x: 4 }}
              className="text-xs text-command-gold hover:text-command-cobalt transition-colors flex items-center gap-1"
            >
              View All <ArrowRight size={12} />
            </motion.a>
          </div>

          {habits.length === 0 ? (
            <p className="text-xs text-gray-500 italic">No habits yet. Create one to start tracking!</p>
          ) : (
            <div className="space-y-3">
              {habits.map((habit) => (
                <motion.div
                  key={habit.id}
                  whileHover={{ x: 4 }}
                  className="p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-all cursor-pointer group"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{habit.icon || '🎯'}</span>
                      <div>
                        <h4 className="text-xs font-semibold text-white">{habit.name}</h4>
                        <p className="text-xs text-gray-500">{habit.frequency}</p>
                      </div>
                    </div>
                    {habit.streak !== undefined && habit.streak > 0 && (
                      <div className="flex items-center gap-1 text-orange-400">
                        <Flame size={12} />
                        <span className="text-xs font-semibold">{habit.streak}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-command-gold to-command-cobalt"
                        style={{ width: `${habit.progress || 0}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-400">{habit.progress || 0}%</span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Today's Routines Widget */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-6 rounded-2xl bg-glass-bg border border-glass-border backdrop-blur-xl"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-300">TODAY'S ROUTINES</h3>
            <motion.a
              href="#/routines"
              whileHover={{ x: 4 }}
              className="text-xs text-command-gold hover:text-command-cobalt transition-colors flex items-center gap-1"
            >
              View All <ArrowRight size={12} />
            </motion.a>
          </div>

          {getTodayRoutines().length === 0 ? (
            <p className="text-xs text-gray-500 italic">No routines scheduled for today</p>
          ) : (
            <div className="space-y-3">
              {getTodayRoutines().map((routine) => (
                <RoutineWidget key={routine.id} routine={routine} />
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Quick Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="p-4 rounded-xl bg-gradient-to-br from-command-gold/10 to-command-cobalt/10 border border-command-gold/30"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400">Total Progress</p>
            <p className="text-2xl font-bold text-white">
              {habits.length > 0 
                ? Math.round(habits.reduce((sum, h) => sum + (h.progress || 0), 0) / habits.length)
                : 0}%
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">Habits Done</p>
            <p className="text-2xl font-bold text-command-gold">
              {habits.filter(h => h.completed).length}/{habits.length}
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

function RoutineWidget({ routine }) {
  const [timeLeft, setTimeLeft] = useState(getTimeRemaining(routine.time))
  const [isOverdue, setIsOverdue] = useState(false)

  useEffect(() => {
    const updateTime = () => {
      const remaining = getTimeRemaining(routine.time)
      setTimeLeft(remaining)
      setIsOverdue(remaining.minutes < 0)
    }

    const interval = setInterval(updateTime, 60000) // Update every minute
    updateTime() // Initial update

    return () => clearInterval(interval)
  }, [routine.time])

  return (
    <motion.div
      whileHover={{ x: 4 }}
      className={`p-3 rounded-lg transition-all cursor-pointer group ${
        isOverdue
          ? 'bg-red-500/10 border border-red-500/30 hover:bg-red-500/20'
          : 'bg-white/5 hover:bg-white/10'
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <Clock size={14} className={isOverdue ? 'text-red-400' : 'text-gray-400'} />
          <div>
            <h4 className="text-xs font-semibold text-white">{routine.name}</h4>
            <p className="text-xs text-gray-500">{routine.time}</p>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between gap-2">
        <div className="text-xs">
          {isOverdue ? (
            <span className="text-red-400 font-semibold">⏰ Overdue {Math.abs(timeLeft.hours)}h {Math.abs(timeLeft.minutes)}m</span>
          ) : (
            <span className="text-yellow-400">⏳ In {timeLeft.hours}h {timeLeft.minutes}m</span>
          )}
        </div>
        {routine.tasks && routine.tasks.length > 0 && (
          <span className="text-xs text-gray-500">
            {routine.tasks.filter(t => t.completed).length}/{routine.tasks.length}
          </span>
        )}
      </div>
    </motion.div>
  )
}

function getTimeRemaining(timeString) {
  const [hours, minutes] = timeString.split(':').map(Number)
  const now = new Date()
  const routineTime = new Date()
  routineTime.setHours(hours, minutes, 0, 0)

  let diff = routineTime - now
  const isOverdue = diff < 0

  diff = Math.abs(diff)
  const timeHours = Math.floor(diff / (1000 * 60 * 60))
  const timeMinutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

  return {
    hours: timeHours,
    minutes: timeMinutes,
    isOverdue
  }
}
