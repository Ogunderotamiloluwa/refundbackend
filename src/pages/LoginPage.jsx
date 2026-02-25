import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Mail, Lock, ArrowRight, X } from 'lucide-react'
import { API_URL } from '../config/apiConfig'
import { useAuth } from '../context/AuthContext'

export default function LoginPage({ onSuccess }) {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password })
      })

      if (!response.ok) {
        const contentType = response.headers.get('content-type')
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json()
          setError(data.error || 'Login failed')
        } else {
          setError('Server error. Please check backend connection.')
        }
        return
      }

      const data = await response.json()

      // Update auth context with token
      login(data.token, data.user)

      onSuccess && onSuccess(data)
      
      // Redirect to landing page (user can navigate to dashboard if they want)
      setTimeout(() => {
        window.location.hash = '#/'
      }, 300)
    } catch (err) {
      setError('Connection error. Backend may not be running.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-command-dark via-command-slate to-command-dark flex items-center justify-center p-4">
      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ x: [0, 50, 0], y: [0, 30, 0] }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute top-10 left-10 w-72 h-72 bg-command-cobalt/10 rounded-full blur-3xl"
        />
      </div>

      {/* Login Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Back to Home Button */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => window.location.hash = '#/'}
          className="mb-4 flex items-center gap-2 text-sm text-gray-400 hover:text-command-gold transition-colors"
        >
          <X size={16} />
          Back to Home
        </motion.button>

        <div className="p-6 md:p-8 rounded-3xl bg-glass-bg border border-glass-border backdrop-blur-xl">
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-command-gold to-command-cobalt mb-4"
            >
              <span className="text-2xl font-bold text-command-dark">PA</span>
            </motion.div>
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Boss Login</h1>
            <p className="text-sm text-gray-400">Welcome back, Chief</p>
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-200 text-sm"
            >
              {error}
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-3.5 text-command-gold" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="boss@example.com"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-glass-bg border border-glass-border text-white placeholder-gray-500 focus:outline-none focus:border-command-gold focus:ring-1 focus:ring-command-gold transition-all text-base"
                  required
                />
              </div>
            </motion.div>

            {/* Password */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-3.5 text-command-gold" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-3 rounded-xl bg-glass-bg border border-glass-border text-white placeholder-gray-500 focus:outline-none focus:border-command-gold focus:ring-1 focus:ring-command-gold transition-all text-base"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-gray-400 hover:text-command-gold transition-colors text-sm"
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </motion.div>

            {/* Remember Me & Forgot Password */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25 }}
              className="flex items-center justify-end mt-4"
            >
              <button
                type="button"
                onClick={() => window.location.hash = '#/forgot-password'}
                className="text-xs text-command-gold/80 hover:text-command-gold transition-colors cursor-pointer font-medium"
              >
                Forgot password?
              </button>
            </motion.div>

            {/* Submit Button */}
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full mt-6 py-3 px-4 rounded-xl bg-gradient-to-r from-command-gold to-command-cobalt text-command-dark font-semibold flex items-center justify-center gap-2 hover:shadow-lg transition-all disabled:opacity-50 text-base"
            >
              {loading ? 'Logging in...' : (
                <>
                  Sign In
                  <ArrowRight size={18} />
                </>
              )}
            </motion.button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-glass-border" />
            <span className="text-xs text-gray-500">New to Boss?</span>
            <div className="h-px flex-1 bg-glass-border" />
          </div>

          {/* Sign Up Link */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-center text-sm text-gray-400"
          >
            <button
              type="button"
              onClick={() => window.location.hash = '#/signup'}
              className="text-command-gold hover:text-command-gold/80 font-semibold transition-colors cursor-pointer"
            >
              Create an account
            </button>
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}
