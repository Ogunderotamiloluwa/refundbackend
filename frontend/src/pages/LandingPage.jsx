import React, { useEffect } from 'react'
import { motion } from 'framer-motion'
import { Zap, TrendingUp, Brain, Lock } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function LandingPage() {
  const { isAuthenticated } = useAuth()

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      window.location.hash = '#/dashboard'
    }
  }, [isAuthenticated])

  const handleGetStarted = () => {
    console.log('Get Started button clicked - navigating to signup')
    window.location.hash = '#/signup'
  }

  const handleSignIn = () => {
    console.log('Sign In button clicked - navigating to login')
    window.location.hash = '#/login'
  }

  const features = [
    { icon: Brain, title: 'AI-Powered', description: 'Smart recommendations tailored to you' },
    { icon: TrendingUp, title: 'Track Progress', description: 'Monitor habits and daily achievements' },
    { icon: Lock, title: 'Secure', description: 'Your data is protected with encryption' },
    { icon: Zap, title: 'Lightning Fast', description: 'Real-time updates and instant commands' }
  ]

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 dark:text-white text-gray-900 overflow-x-hidden">
      {/* Animated Background Overlays */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ x: [0, 30, 0], y: [0, 20, 0] }}
          transition={{ duration: 10, repeat: Infinity }}
          className="absolute top-20 right-20 w-96 h-96 bg-blue-200/30 dark:bg-blue-900/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ x: [0, -30, 0], y: [0, -20, 0] }}
          transition={{ duration: 12, repeat: Infinity }}
          className="absolute bottom-20 left-20 w-80 h-80 bg-indigo-200/30 dark:bg-indigo-900/20 rounded-full blur-3xl"
        />
      </div>

      {/* Header */}
      <header className="relative z-20 p-4 md:p-6 sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 md:gap-3"
          >
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm md:text-base">
              PA
            </div>
            <div>
              <div className="font-bold text-base md:text-lg text-gray-900">Boss</div>
              <div className="text-xs text-gray-500 hidden sm:block">Personal Assistant</div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex gap-2 md:gap-4"
          >
            <button
              onClick={handleSignIn}
              className="px-3 md:px-6 py-2 rounded-lg border border-gray-300 text-xs md:text-sm text-gray-700 hover:text-blue-600 hover:border-blue-600 transition-colors cursor-pointer font-medium active:scale-95"
            >
              Sign In
            </button>
            <button
              onClick={handleGetStarted}
              className="px-3 md:px-6 py-2 rounded-lg bg-blue-600 text-white text-xs md:text-sm font-bold hover:bg-blue-700 transition-all cursor-pointer active:scale-95"
            >
              Get Started
            </button>
          </motion.div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 w-full">
        <section className="min-h-screen flex flex-col justify-center px-4 md:px-6 py-12 md:py-24">
          <div className="max-w-4xl mx-auto w-full text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-6 inline-block"
            >
              <div className="px-4 py-2 rounded-full bg-blue-100 border border-blue-200 backdrop-blur-sm">
                <span className="text-blue-700 text-xs md:text-sm font-semibold">✨ Transform Your Productivity</span>
              </div>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-4 md:mb-6 text-gray-900 leading-tight"
            >
              Your AI Personal
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"> Assistant</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-base sm:text-lg md:text-xl text-gray-600 mb-6 md:mb-8 leading-relaxed max-w-2xl mx-auto"
            >
              Execute your goals with precision. Get real-time AI recommendations, track your habits, and stay productive every day with your personal assistant.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center mb-12 md:mb-20"
            >
              <button
                onClick={handleGetStarted}
                className="px-6 md:px-8 py-3 md:py-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-base md:text-lg hover:shadow-2xl transition-all transform hover:scale-105 cursor-pointer active:scale-95 w-full sm:w-auto shadow-lg"
              >
                Start Now
              </button>
              <button
                onClick={handleSignIn}
                className="px-6 md:px-8 py-3 md:py-4 rounded-xl border-2 border-blue-600 text-blue-600 font-bold text-base md:text-lg hover:bg-blue-50 transition-all cursor-pointer active:scale-95 w-full sm:w-auto backdrop-blur-sm"
              >
                Sign In
              </button>
            </motion.div>

            {/* Social Proof */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="flex justify-center items-center gap-6 text-center text-gray-600 text-sm"
            >
              <div>
                <div className="font-bold text-lg text-gray-900">1000+</div>
                <div className="text-xs">Active Users</div>
              </div>
              <div className="w-px h-8 bg-gray-300"></div>
              <div>
                <div className="font-bold text-lg text-gray-900">50k+</div>
                <div className="text-xs">Goals Tracked</div>
              </div>
              <div className="w-px h-8 bg-gray-300"></div>
              <div>
                <div className="font-bold text-lg text-gray-900">98%</div>
                <div className="text-xs">Success Rate</div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="px-4 md:px-6 py-12 md:py-20">
          <div className="max-w-6xl mx-auto">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl md:text-4xl font-bold text-center mb-4 text-gray-900"
            >
              Powerful Features
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-center text-gray-600 mb-12 max-w-2xl mx-auto"
            >
              Everything you need to take control of your goals and build lasting habits.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6"
            >
              {features.map((feature, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + idx * 0.1 }}
                  whileHover={{ y: -8, boxShadow: "0 20px 40px rgba(59, 130, 246, 0.15)" }}
                  className="p-6 md:p-8 rounded-2xl bg-white border border-gray-200 hover:border-blue-300 transition-all group cursor-pointer shadow-md"
                >
                  <div className="p-3 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 w-fit mb-4 group-hover:shadow-lg transition-shadow">
                    <feature.icon size={28} className="text-blue-600" />
                  </div>
                  <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-sm md:text-base text-gray-600 leading-relaxed">{feature.description}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="px-4 md:px-6 py-12 md:py-20">
          <div className="max-w-2xl mx-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-center py-12 md:py-16 px-4 md:px-8 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 border border-blue-400/30 shadow-2xl"
            >
              <h2 className="text-2xl md:text-4xl font-bold text-white mb-3 md:mb-4">Ready to Get Started?</h2>
              <p className="text-sm md:text-lg text-blue-100 mb-6 md:mb-8 leading-relaxed">
                Join thousands of users who are already achieving their goals with an intelligent personal assistant.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={handleGetStarted}
                  className="px-6 md:px-8 py-3 md:py-4 rounded-xl bg-white text-blue-600 font-bold text-base md:text-lg hover:shadow-2xl transition-all transform hover:scale-105 cursor-pointer active:scale-95"
                >
                  Create Free Account
                </button>
                <button
                  onClick={handleSignIn}
                  className="px-6 md:px-8 py-3 md:py-4 rounded-xl border-2 border-white text-white font-bold text-base md:text-lg hover:bg-white/10 transition-all cursor-pointer active:scale-95"
                >
                  Sign In
                </button>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-20 border-t border-gray-200 py-6 md:py-8 px-4 md:px-6 text-center text-gray-600 text-xs md:text-sm bg-white/50 backdrop-blur-sm">
        <p>© 2026 Personal Assistant. All rights reserved.</p>
      </footer>
    </div>
  )
}
