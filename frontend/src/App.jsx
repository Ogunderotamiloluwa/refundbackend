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
import notificationService from './services/notificationService'
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
import StatsOverview from './components/StatsOverview'

function DashboardContent() {
  const { token } = useAuth()
  const [suggestions, setSuggestions] = useState([])
  const [habits, setHabits] = useState([])
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

  // Initialize push notifications when user is logged in
  useEffect(() => {
    if (token) {
      initializeNotifications()
    }
  }, [token])

  const initializeNotifications = async () => {
    try {
      const initialized = await notificationService.initialize()
      if (initialized) {
        console.log('Notifications enabled');
        // Try to subscribe to push notifications
        await notificationService.subscribeToPushNotifications(token)
      }
    } catch (error) {
      console.log('ℹ️ Notifications not available:', error.message)
    }
  }

  const fetchData = async () => {
    try {
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }

      const [sugRes, habitsRes, routinesRes] = await Promise.all([
        fetch(`${API_URL}/api/suggestions`, { headers }).catch(() => ({ ok: false })),
        fetch(`${API_URL}/api/habits`, { headers }).catch(() => ({ ok: false })),
        fetch(`${API_URL}/api/routines`, { headers }).catch(() => ({ ok: false })),
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
    <div className="flex h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 dark:text-white text-gray-900 font-inter overflow-hidden">
      {/* Animated Background Gradients */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ x: [0, 50, 0], y: [0, 30, 0] }}
          transition={{ duration: 10, repeat: Infinity }}
          className="absolute top-1/4 right-1/4 w-96 h-96 bg-blue-200/20 dark:bg-blue-900/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ x: [0, -50, 0], y: [0, -30, 0] }}
          transition={{ duration: 12, repeat: Infinity }}
          className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-indigo-200/20 dark:bg-indigo-900/20 rounded-full blur-3xl"
        />
      </div>

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

            {/* Live Stats Overview */}
            <StatsOverview />

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
                    className="p-6 rounded-lg bg-white border border-gray-200"
                  >
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">AI Recommendations</h2>
                    <div className="space-y-3">
                      {suggestions.map((suggestion, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          className="p-4 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 transition-all cursor-pointer group"
                        >
                          <p className="text-sm text-gray-700 group-hover:text-blue-600 transition-colors">
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
                  className="p-6 rounded-lg bg-white border border-gray-200"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">Active Habits</h2>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={createNewHabit}
                      className="p-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 transition-all"
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
                    className="block p-5 rounded-lg bg-white border border-blue-200 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center mb-2 text-blue-700 font-bold text-sm">T</div>
                    <h3 className="text-base font-semibold text-gray-900">Todos</h3>
                    <p className="text-xs text-gray-600">Manage tasks & priorities</p>
                  </motion.a>

                  {/* Weather Link */}
                  <motion.a
                    href="#/weather"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                    whileHover={{ scale: 1.02 }}
                    className="block p-5 rounded-lg bg-white border border-amber-200 hover:border-amber-400 hover:shadow-md transition-all cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center mb-2 text-amber-700 font-bold text-sm">W</div>
                    <h3 className="text-base font-semibold text-gray-900">Weather</h3>
                    <p className="text-xs text-gray-600">Real-time conditions & forecast</p>
                  </motion.a>

                  {/* Chat Link */}
                  <motion.a
                    href="#/chat"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    whileHover={{ scale: 1.02 }}
                    className="block p-5 rounded-lg bg-white border border-purple-200 hover:border-purple-400 hover:shadow-md transition-all cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center mb-2 text-purple-700 font-bold text-sm">C</div>
                    <h3 className="text-base font-semibold text-gray-900">Chat</h3>
                    <p className="text-xs text-gray-600">Talk with your AI assistant</p>
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

  console.log('📄 AppRouter rendering:', { currentPage, isAuthenticated, loading })

  if (loading) {
    console.log('⏳ Auth still loading, showing spinner...')
    return (
      <div className="w-full h-screen bg-white flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full"
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
    console.log('🔐 Protected route accessed without auth, showing Landing Page')
    return <LandingPage />
  }

  // Default: show landing page for any unrecognized routes or empty currentPage
  console.log('🏠 Showing Landing Page (default route)')
  return <LandingPage />
}
