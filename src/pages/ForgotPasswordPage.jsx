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

    // Simulate password reset email sending
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
    <div className="min-h-screen w-full bg-gradient-to-br from-command-dark via-command-slate to-command-dark flex items-center justify-center p-4">
      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ x: [0, 50, 0], y: [0, 30, 0] }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute top-10 left-10 w-72 h-72 bg-command-cobalt/10 rounded-full blur-3xl"
        />
      </div>

      {/* Reset Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Back to Login Button */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => window.location.hash = '#/login'}
          className="mb-4 flex items-center gap-2 text-sm text-gray-400 hover:text-command-gold transition-colors"
        >
          <X size={16} />
          Back to Login
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
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Reset Password</h1>
            <p className="text-sm text-gray-400">No worries, it happens!</p>
          </div>

          {success ? (
            // Success Message
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center space-y-6"
            >
              <div className="p-4 rounded-lg bg-green-500/20 border border-green-500/50 text-green-200 text-sm">
                <p className="font-medium mb-2">✓ Reset Email Sent</p>
                <p className="text-xs">Check your email at {email} for password reset instructions. It may take a few minutes to arrive.</p>
              </div>
              <button
                onClick={() => window.location.hash = '#/login'}
                className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-command-gold to-command-cobalt text-command-dark font-semibold transition-all hover:shadow-lg cursor-pointer"
              >
                Back to Login
              </button>
            </motion.div>
          ) : (
            // Reset Form
            <>
              <p className="text-gray-400 text-sm mb-6">
                Enter your email address and we'll send you instructions to reset your password.
              </p>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-200 text-sm"
                >
                  {error}
                </motion.div>
              )}

              <form onSubmit={handleResetClick} className="space-y-4">
                {/* Email */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
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

                {/* Submit Button */}
                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading}
                  className="w-full mt-6 py-3 px-4 rounded-xl bg-gradient-to-r from-command-gold to-command-cobalt text-command-dark font-semibold flex items-center justify-center gap-2 hover:shadow-lg transition-all disabled:opacity-50 text-base"
                >
                  {loading ? 'Sending...' : (
                    <>
                      Send Reset Link
                      <ArrowRight size={18} />
                    </>
                  )}
                </motion.button>
              </form>

              {/* Back to Login */}
              <div className="mt-6 text-center">
                <button
                  type="button"
                  onClick={() => window.location.hash = '#/login'}
                  className="text-sm text-command-gold hover:text-command-gold/80 transition-colors cursor-pointer font-medium"
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
