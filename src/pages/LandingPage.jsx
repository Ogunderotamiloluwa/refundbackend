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
    <div className="min-h-screen w-full bg-gradient-to-br from-command-dark via-command-slate to-command-dark text-white overflow-x-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ x: [0, 50, 0], y: [0, 30, 0] }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute top-10 left-10 w-72 h-72 md:w-96 md:h-96 bg-command-cobalt/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ x: [0, -50, 0], y: [0, -30, 0] }}
          transition={{ duration: 10, repeat: Infinity }}
          className="absolute bottom-10 right-10 w-72 h-72 md:w-96 md:h-96 bg-command-gold/5 rounded-full blur-3xl"
        />
      </div>

      {/* Header */}
      <header className="relative z-10 p-4 md:p-6 sticky top-0 backdrop-blur-md border-b border-glass-border/50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 md:gap-3"
          >
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-gradient-to-br from-command-gold to-command-cobalt flex items-center justify-center text-command-dark font-bold text-sm md:text-base">
              PA
            </div>
            <div>
              <div className="font-bold text-base md:text-lg text-white">Boss</div>
              <div className="text-xs text-gray-400 hidden sm:block">Command Center</div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex gap-2 md:gap-4"
          >
            <button
              onClick={handleSignIn}
              className="px-3 md:px-6 py-2 rounded-lg border border-glass-border text-xs md:text-sm text-gray-300 hover:text-command-gold hover:border-command-gold transition-colors cursor-pointer font-medium active:scale-95"
            >
              Sign In
            </button>
            <button
              onClick={handleGetStarted}
              className="px-3 md:px-6 py-2 rounded-lg bg-gradient-to-r from-command-gold to-command-cobalt text-command-dark text-xs md:text-sm font-bold hover:shadow-lg transition-all cursor-pointer active:scale-95"
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
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-4 md:mb-6 bg-gradient-to-r from-command-gold via-white to-command-cobalt bg-clip-text text-transparent leading-tight"
            >
              Your AI Personal Assistant
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-base sm:text-lg md:text-xl text-gray-300 mb-6 md:mb-8 leading-relaxed"
            >
              Execute your goals with precision. Get real-time AI recommendations, track your habits, and dominate your day with the Boss Command Center.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center mb-12 md:mb-20"
            >
              <button
                onClick={handleGetStarted}
                className="px-6 md:px-8 py-3 md:py-4 rounded-xl bg-gradient-to-r from-command-gold to-command-cobalt text-command-dark font-bold text-base md:text-lg hover:shadow-2xl transition-all transform hover:scale-105 cursor-pointer active:scale-95 w-full sm:w-auto"
              >
                Start Now
              </button>
              <button
                onClick={handleSignIn}
                className="px-6 md:px-8 py-3 md:py-4 rounded-xl border-2 border-command-gold text-command-gold font-bold text-base md:text-lg hover:bg-command-gold/10 transition-all cursor-pointer active:scale-95 w-full sm:w-auto"
              >
                Sign In
              </button>
            </motion.div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="px-4 md:px-6 py-12 md:py-20 bg-command-dark/50">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6"
            >
              {features.map((feature, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + idx * 0.1 }}
                  className="p-4 md:p-6 rounded-2xl bg-glass-bg border border-glass-border backdrop-blur-xl hover:border-command-gold/50 transition-all group"
                >
                  <feature.icon size={32} className="text-command-gold mb-3 group-hover:scale-110 transition-transform" />
                  <h3 className="text-base md:text-lg font-bold text-white mb-2">{feature.title}</h3>
                  <p className="text-xs md:text-sm text-gray-400">{feature.description}</p>
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
              className="text-center py-12 md:py-16 px-4 md:px-8 rounded-3xl bg-glass-bg border border-glass-border backdrop-blur-xl"
            >
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-3 md:mb-4">Ready to Command Your Day?</h2>
              <p className="text-sm md:text-base text-gray-300 mb-6 md:mb-8 leading-relaxed">
                Join thousands of users who are already crushing their goals with the Boss AI Personal Assistant.
              </p>
              <button
                onClick={handleGetStarted}
                className="w-full sm:w-auto px-6 md:px-8 py-3 md:py-4 rounded-xl bg-gradient-to-r from-command-gold to-command-cobalt text-command-dark font-bold text-base md:text-lg hover:shadow-2xl transition-all transform hover:scale-105 cursor-pointer active:scale-95"
              >
                Create Free Account
              </button>
            </motion.div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-glass-border py-6 md:py-8 px-4 md:px-6 text-center text-gray-500 text-xs md:text-sm">
        <p>© 2026 Boss Command Center. All rights reserved.</p>
      </footer>
    </div>
  )
}
