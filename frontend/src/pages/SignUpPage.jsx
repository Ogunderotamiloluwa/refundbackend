import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, Lock, User, ArrowRight, AlertCircle, X, Check } from 'lucide-react'
import { API_URL } from '../config/apiConfig'
import { useAuth } from '../context/AuthContext'

export default function SignUpPage({ onSuccess }) {
  const { login } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState(0)

  const calculatePasswordStrength = (pwd) => {
    let strength = 0
    if (pwd.length >= 6) strength++
    if (pwd.length >= 8) strength++
    if (/[A-Z]/.test(pwd)) strength++
    if (/[0-9]/.test(pwd)) strength++
    if (/[^A-Za-z0-9]/.test(pwd)) strength++
    return strength
  }

  const handlePasswordChange = (e) => {
    const pwd = e.target.value
    setPassword(pwd)
    setPasswordStrength(calculatePasswordStrength(pwd))
  }

  const handleSignUp = async (e) => {
    e.preventDefault()
    setError('')

    if (!name.trim()) {
      setError('Name is required')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password, name })
      })

      if (!response.ok) {
        const contentType = response.headers.get('content-type')
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json()
          setError(data.error || 'Sign up failed')
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

  const strengthTexts = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong']
  const strengthColors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-lime-500', 'bg-green-500', 'bg-emerald-500']

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      {/* Gradient Overlay Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ x: [0, 30, 0], y: [0, 20, 0] }}
          transition={{ duration: 10, repeat: Infinity }}
          className="absolute top-20 right-20 w-96 h-96 bg-blue-200/30 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ x: [0, -30, 0], y: [0, -20, 0] }}
          transition={{ duration: 12, repeat: Infinity }}
          className="absolute bottom-20 left-20 w-80 h-80 bg-indigo-200/30 rounded-full blur-3xl"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md relative z-10"
      >
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => window.location.hash = '#/'}
          className="mb-4 flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 transition-colors"
        >
          <X size={16} />
          Back to Home
        </motion.button>

        <div className="p-6 md:p-8 rounded-2xl bg-white border border-gray-200 shadow-2xl backdrop-blur-sm">
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 mb-4"
            >
              <span className="text-2xl font-bold text-white">PA</span>
            </motion.div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Create Account</h1>
            <p className="text-sm text-gray-600">Join your personal assistant today</p>
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex gap-2"
            >
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleSignUp} className="space-y-4">
            {/* Name */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
              <div className="relative">
                <User size={18} className="absolute left-3 top-3.5 text-blue-600" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your Name"
                  className="w-full pl-10 pr-4 py-3 rounded-lg bg-white border border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-base"
                  required
                />
              </div>
            </motion.div>

            {/* Email */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-3.5 text-blue-600" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="boss@example.com"
                  className="w-full pl-10 pr-4 py-3 rounded-lg bg-white border border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-base"
                  required
                />
              </div>
            </motion.div>

            {/* Password */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-3.5 text-blue-600" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={handlePasswordChange}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-3 rounded-lg bg-white border border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-base"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-gray-500 hover:text-gray-700 transition-colors text-sm font-medium"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              {password && (
                <div className="mt-3 space-y-2">
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full ${
                          i < passwordStrength ? strengthColors[passwordStrength - 1] : 'bg-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-gray-600">
                    Strength: <span className="text-gray-900 font-medium">{strengthTexts[passwordStrength]}</span>
                  </p>
                  
                  {/* Password Requirements */}
                  <div className="bg-gray-50 p-2 rounded-lg border border-gray-200 space-y-1">
                    <p className="text-xs font-medium text-gray-700 mb-1">Password requirements:</p>
                    <div className="flex items-center gap-2">
                      {password.length >= 6 ? (
                        <Check size={14} className="text-green-600" />
                      ) : (
                        <span className="w-3.5 h-3.5 rounded-full border border-gray-400" />
                      )}
                      <span className={`text-xs ${password.length >= 6 ? 'text-green-700' : 'text-gray-600'}`}>
                        At least 6 characters
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {password.length >= 8 ? (
                        <Check size={14} className="text-green-600" />
                      ) : (
                        <span className="w-3.5 h-3.5 rounded-full border border-gray-400" />
                      )}
                      <span className={`text-xs ${password.length >= 8 ? 'text-green-700' : 'text-gray-600'}`}>
                        At least 8 characters (recommended)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {/[A-Z]/.test(password) ? (
                        <Check size={14} className="text-green-600" />
                      ) : (
                        <span className="w-3.5 h-3.5 rounded-full border border-gray-400" />
                      )}
                      <span className={`text-xs ${/[A-Z]/.test(password) ? 'text-green-700' : 'text-gray-600'}`}>
                        One uppercase letter
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {/[0-9]/.test(password) ? (
                        <Check size={14} className="text-green-600" />
                      ) : (
                        <span className="w-3.5 h-3.5 rounded-full border border-gray-400" />
                      )}
                      <span className={`text-xs ${/[0-9]/.test(password) ? 'text-green-700' : 'text-gray-600'}`}>
                        One number
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {/[^A-Za-z0-9]/.test(password) ? (
                        <Check size={14} className="text-green-600" />
                      ) : (
                        <span className="w-3.5 h-3.5 rounded-full border border-gray-400" />
                      )}
                      <span className={`text-xs ${/[^A-Za-z0-9]/.test(password) ? 'text-green-700' : 'text-gray-600'}`}>
                        One special character (!@#$%^&*)
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Confirm Password */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-3.5 text-blue-600" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 rounded-lg bg-white border border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-base"
                  required
                />
              </div>
            </motion.div>

            {/* Submit Button */}
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full mt-6 py-3 px-4 rounded-lg bg-blue-600 text-white font-semibold flex items-center justify-center gap-2 hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-base"
            >
              {loading ? 'Creating account...' : (
                <>
                  Create Account
                  <ArrowRight size={18} />
                </>
              )}
            </motion.button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-gray-200" />
            <span className="text-xs text-gray-500">Already have an account?</span>
            <div className="h-px flex-1 bg-gray-200" />
          </div>

          {/* Login Link */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-center text-sm text-gray-600"
          >
            <button
              type="button"
              onClick={() => window.location.hash = '#/login'}
              className="text-blue-600 hover:text-blue-700 font-semibold transition-colors cursor-pointer"
            >
              Sign in instead
            </button>
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}
