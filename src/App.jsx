import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Send, Zap } from 'lucide-react'
import './styles/index.css'
import { AuthProvider, useAuth } from './context/AuthContext'
import { NotificationProvider } from './context/NotificationContext'
import { useRoutineReminders } from './hooks/useRoutineReminders'
import { useHabitReminders } from './hooks/useHabitReminders'
import { useTodoReminders } from './hooks/useTodoReminders'
import { API_URL } from './config/apiConfig'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import MessageBubble from './components/MessageBubble'
import HabitCard from './components/HabitCard'
import NotificationCenter from './components/NotificationCenter'
import GradientBackground from './components/GradientBackground'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import SignUpPage from './pages/SignUpPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ProfilePage from './pages/ProfilePage'
import HabitsPage from './pages/HabitsPage'
import RoutinesPage from './pages/RoutinesPage'
import AnalyticsPage from './pages/AnalyticsPage'
import TodoPage from './pages/TodoPage'
import WeatherPage from './pages/WeatherPage'
import ChatPage from './pages/ChatPage'
import DashboardSidebar from './components/DashboardSidebar'
import TodoReminder from './components/TodoReminder'
import BossCommands from './components/BossCommands'

function DashboardContent() {
  const { token } = useAuth()
  const [suggestions, setSuggestions] = useState([])
  const [habits, setHabits] = useState([
    { id: 1, name: 'Morning Run', description: '30 min cardio session', frequency: 'daily', progress: 75, completed: false },
    { id: 2, name: 'Read', description: 'Chapter from a book', frequency: 'daily', progress: 50, completed: false },
  ])
  const [routines, setRoutines] = useState([])
  const [todos, setTodos] = useState([])
  const [userLocation, setUserLocation] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState([
    { id: 1, text: "Welcome back, Chief. Let's crush this day.", isAI: true },
  ])

  // Get user location for weather/traffic alerts
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

  // Set up routine reminders
  useRoutineReminders(routines)

  // Set up habit reminders
  useHabitReminders(habits)

  // Set up todo reminders with location awareness
  useTodoReminders(todos, userLocation)

  useEffect(() => {
    fetchData()
    // Refresh routines every 5 minutes
    const interval = setInterval(loadRoutines, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const fetchData = async () => {
    // Create abort controller with timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    try {
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }

      const [sugRes, habitsRes, routinesRes] = await Promise.all([
        fetch(`${API_URL}/api/suggestions`, { signal: controller.signal, headers }).catch(() => ({ ok: false })),
        fetch(`${API_URL}/api/habits`, { signal: controller.signal, headers }).catch(() => ({ ok: false })),
        fetch(`${API_URL}/api/routines`, { signal: controller.signal, headers }).catch(() => ({ ok: false })),
      ])

      if (sugRes.ok) {
        const data = await sugRes.json()
        setSuggestions(data.suggestions || [])
      }

      if (habitsRes.ok) {
        const data = await habitsRes.json()
        setHabits(data.habits || [])
      }

      if (routinesRes.ok) {
        const data = await routinesRes.json()
        setRoutines(data.routines || [])
      }
    } catch (err) {
      console.error('Data fetch error:', err)
    } finally {
      clearTimeout(timeoutId)
    }
  }

  const loadRoutines = async () => {
    try {
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }

      const response = await fetch(`${API_URL}/api/routines`, { headers })
      if (response.ok) {
        const data = await response.json()
        setRoutines(data.routines || [])
      }
    } catch (err) {
      console.error('Error loading routines:', err)
    }
  }

  const handleSendMessage = async () => {
    if (!input.trim()) return

    // Add user message
    const userMessage = { id: Date.now(), text: input, isAI: false }
    setMessages([...messages, userMessage])
    setInput('')

    // Simulate AI response
    setTimeout(() => {
      const responses = [
        "That's the spirit! Let's execute on that.",
        "Noted. Adding to your command queue.",
        "Strategic move. I like it.",
        "Done. You're on fire today!",
      ]
      const aiMessage = {
        id: Date.now() + 1,
        text: responses[Math.floor(Math.random() * responses.length)],
        isAI: true,
      }
      setMessages(prev => [...prev, aiMessage])
    }, 500)
  }

  const handleCompleteHabit = async (habitId) => {
    // Add to completed
    setHabits(habits.map(h => h.id === habitId ? { ...h, progress: 100, completed: true } : h))
  }

  const handleDeleteHabit = async (habitId) => {
    setHabits(habits.filter(h => h.id !== habitId))
  }

  const createNewHabit = async () => {
    const newHabit = {
      id: Date.now(),
      name: 'New Habit',
      description: 'Edit this habit',
      frequency: 'daily',
      progress: 0,
      completed: false,
    }
    setHabits([...habits, newHabit])
  }

  return (
    <div className="flex h-screen bg-command-dark text-white font-inter overflow-hidden">
      {/* Background */}
      <GradientBackground />

      {/* Sidebar */}
      <Sidebar />

      {/* Main content wrapper */}
      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        {/* Header */}
        <Header />

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6 max-w-7xl mx-auto w-full">
            {/* Todo Reminder at Top */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <TodoReminder />
            </motion.div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Messages & Chat (2 cols on large screens) */}
            <div className="lg:col-span-2 space-y-6">
              {/* Boss Commands Component */}
              <BossCommands token={token} userContext={{ habits, routines, todos }} />

                {/* AI Suggestions */}
                {suggestions.length > 0 && (
                  <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="p-6 rounded-2xl bg-glass-bg border border-glass-border backdrop-blur-xl"
                  >
                    <h2 className="text-lg font-semibold text-white mb-4">AI Recommendations</h2>
                    <div className="space-y-3">
                      {suggestions.map((suggestion, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          className="p-4 rounded-xl border border-command-gold/30 bg-command-gold/5 hover:bg-command-gold/10 transition-all cursor-pointer group"
                        >
                          <p className="text-sm text-white group-hover:text-command-gold transition-colors">
                            {suggestion}
                          </p>
                        </motion.div>
                      ))}
                    </div>
                  </motion.section>
                )}
              </div>

              {/* Right Column - Stats & Weather */}
              <div className="space-y-6 max-h-[calc(100vh-150px)] overflow-y-auto pr-2">
                {/* Active Habits Widget */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="p-6 rounded-2xl bg-glass-bg border border-glass-border backdrop-blur-xl"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-white">⚡ Active Habits</h2>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={createNewHabit}
                      className="p-2 rounded-lg bg-command-gold/20 text-command-gold hover:bg-command-gold/30 transition-all"
                    >
                      <Plus size={18} />
                    </motion.button>
                  </div>

                  {/* Habits Grid */}
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    <AnimatePresence>
                      {habits.map((habit) => (
                        <HabitCard
                          key={habit.id}
                          habit={habit}
                          onComplete={handleCompleteHabit}
                          onDelete={handleDeleteHabit}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                </motion.div>

                {/* Quick Links Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {/* Todo Link */}
                  <motion.a
                    href="#/todos"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    whileHover={{ scale: 1.02 }}
                    className="block p-5 rounded-2xl bg-gradient-to-br from-blue-600/20 to-blue-800/20 border border-blue-500/50 backdrop-blur-xl hover:border-blue-400/70 transition-all cursor-pointer"
                  >
                    <div className="text-2xl mb-2">📋</div>
                    <h3 className="text-base font-semibold text-white">Todos</h3>
                    <p className="text-xs text-gray-300">Live countdown & weather alerts</p>
                  </motion.a>

                  {/* Weather Link */}
                  <motion.a
                    href="#/weather"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                    whileHover={{ scale: 1.02 }}
                    className="block p-5 rounded-2xl bg-gradient-to-br from-yellow-600/20 to-yellow-800/20 border border-yellow-500/50 backdrop-blur-xl hover:border-yellow-400/70 transition-all cursor-pointer"
                  >
                    <div className="text-2xl mb-2">🌤️</div>
                    <h3 className="text-base font-semibold text-white">Weather</h3>
                    <p className="text-xs text-gray-300">Real-time conditions & alerts</p>
                  </motion.a>

                  {/* Chat Link */}
                  <motion.a
                    href="#/chat"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    whileHover={{ scale: 1.02 }}
                    className="block p-5 rounded-2xl bg-gradient-to-br from-purple-600/20 to-purple-800/20 border border-purple-500/50 backdrop-blur-xl hover:border-purple-400/70 transition-all cursor-pointer"
                  >
                    <div className="text-2xl mb-2">💬</div>
                    <h3 className="text-base font-semibold text-white">Chat</h3>
                    <p className="text-xs text-gray-300">Ask AI about routines & habits</p>
                  </motion.a>
                </div>
              </div>
            </div>
            </div>
        </main>
        </div>

      {/* Notification Center */}
      <NotificationCenter />
    </div>
  )
}

// Main App with routing
export default function App() {
  const [currentPage, setCurrentPage] = useState('') // Always start empty (landing page)

  // Initialize theme on app load
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark'
    document.documentElement.classList.remove('dark', 'light')
    document.documentElement.classList.add(savedTheme)
    console.log('Theme initialized:', savedTheme)
  }, [])

  // Handle initial hash on first load
  useEffect(() => {
    const hash = window.location.hash.slice(1).split('/')[1] || ''
    setCurrentPage(hash)
  }, [])

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1).split('/')[1] || ''
      console.log('Hash changed to:', hash)
      setCurrentPage(hash)
    }
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  return (
    <AuthProvider>
      <NotificationProvider>
        <AppRouter currentPage={currentPage} />
      </NotificationProvider>
    </AuthProvider>
  )
}

function AppRouter({ currentPage }) {
  const { isAuthenticated, loading, logout } = useAuth()

  if (loading) {
    return (
      <div className="w-full h-screen bg-gradient-to-br from-command-dark via-command-slate to-command-dark flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-12 h-12 border-4 border-command-gold border-t-transparent rounded-full"
        />
      </div>
    )
  }

  // Public routes - anyone can access
  if (currentPage === 'login') {
    return <LoginPage onSuccess={() => window.location.hash = '#/dashboard'} />
  }
  if (currentPage === 'signup') {
    return <SignUpPage onSuccess={() => window.location.hash = '#/dashboard'} />
  }
  if (currentPage === 'forgot-password') {
    return <ForgotPasswordPage />
  }

  // Protected routes - require authentication
  if (isAuthenticated) {
    if (currentPage === 'profile') {
      return <ProfilePage onLogout={() => {
        logout()
        window.location.hash = '#/'
      }} />
    }
    if (currentPage === 'habits') {
      return <HabitsPage />
    }
    if (currentPage === 'routines') {
      return <RoutinesPage />
    }
    if (currentPage === 'todos') {
      return <TodoPage />
    }
    if (currentPage === 'weather') {
      return <WeatherPage />
    }
    if (currentPage === 'chat') {
      return <ChatPage />
    }
    if (currentPage === 'analytics') {
      return <AnalyticsPage />
    }
    if (currentPage === 'dashboard') {
      return <DashboardContent />
    }
  }

  // If user tries to access protected route without auth, redirect to landing page
  const protectedRoutes = ['dashboard', 'profile', 'habits', 'routines', 'todos', 'weather', 'analytics', 'chat']
  if (protectedRoutes.includes(currentPage) && !isAuthenticated) {
    return <LandingPage />
  }

  // Default: show landing page for any unrecognized routes or empty currentPage
  return <LandingPage />
}
