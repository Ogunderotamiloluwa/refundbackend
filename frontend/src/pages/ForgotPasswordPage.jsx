import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, ArrowRight, X } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleResetClick = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    setTimeout(() => {
      if (email.includes('@')) {
        setSuccess(true)
        console.log('Password reset email sent to:', email)
      } else {
        setError('Please enter a valid email address')
      }
      setLoading(false)
    }, 1500)
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      {/* Gradient Overlay */}
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
          onClick={() => window.location.hash = '#/login'}
          className="mb-4 flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 transition-colors"
        >
          <X size={16} />
          Back to Login
        </motion.button>

        <div className="p-6 md:p-8 rounded-2xl bg-white border border-gray-200 shadow-xl backdrop-blur-sm">
          <div className="text-center mb-8">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 mb-4"
            >
              <span className="text-2xl font-bold text-white">PA</span>
            </motion.div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Reset Password</h1>
            <p className="text-sm text-gray-600">No worries, happens to everyone!</p>
          </div>

          {success ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center space-y-6"
            >
              <div className="p-4 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">
                <p className="font-medium mb-2">✓ Reset Link Sent</p>
                <p className="text-xs">Check your email at {email} for password reset instructions.</p>
              </div>
              <button
                onClick={() => window.location.hash = '#/login'}
                className="w-full px-4 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-all cursor-pointer"
              >
                Back to Login
              </button>
            </motion.div>
          ) : (
            <>
              <p className="text-gray-600 text-sm mb-6">
                Enter your email and we'll send you a link to reset your password.
              </p>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm"
                >
                  {error}
                </motion.div>
              )}

              <form onSubmit={handleResetClick} className="space-y-4">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                  <div className="relative">
                    <Mail size={18} className="absolute left-3 top-3.5 text-blue-600" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="boss@example.com"
                      className="w-full pl-10 pr-4 py-3 rounded-lg bg-white border border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                      required
                    />
                  </div>
                </motion.div>

                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading}
                  className="w-full mt-6 py-3 px-4 rounded-lg bg-blue-600 text-white font-semibold flex items-center justify-center gap-2 hover:bg-blue-700 transition-all disabled:opacity-50"
                >
                  {loading ? 'Sending...' : (
                    <>
                      Send Reset Link
                      <ArrowRight size={18} />
                    </>
                  )}
                </motion.button>
              </form>

              <div className="mt-6 text-center">
                <button
                  type="button"
                  onClick={() => window.location.hash = '#/login'}
                  className="text-sm text-blue-600 hover:text-blue-700 transition-colors cursor-pointer font-medium"
                >
                  Remember your password? Back to Login
                </button>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  )
}
