import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { User, Mail, Palette, Bell, LogOut, Save, Edit2, Clock, ArrowLeft } from 'lucide-react'
import { API_URL } from '../config/apiConfig'

export default function ProfilePage({ onLogout }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    timezone: 'UTC',
    theme: 'dark',
    notifications: true
  })

  useEffect(() => {
    loadUserProfile()
  }, [])

  const loadUserProfile = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        setError('No token found. Please login again.')
        setTimeout(() => {
          window.location.hash = '#/login'
        }, 2000)
        return
      }

      const response = await fetch(`${API_URL}/api/users/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const contentType = response.headers.get('content-type')
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to load profile')
        } else {
          throw new Error('Server error: Invalid response. Please try again.')
        }
      }

      const data = await response.json()
      setUser(data.user)
      setFormData({
        name: data.user.name || '',
        timezone: data.user.timezone || 'UTC',
        theme: data.user.preferences?.theme || 'dark',
        notifications: data.user.preferences?.notifications !== false
      })
    } catch (err) {
      console.error('Profile load error:', err)
      setError(err.message || 'Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveProfile = async () => {
    setSaving(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/api/users/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name,
          timezone: formData.timezone,
          preferences: {
            theme: formData.theme,
            notifications: formData.notifications
          }
        })
      })

      if (!response.ok) {
        const contentType = response.headers.get('content-type')
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to update profile')
        } else {
          throw new Error('Server error: Invalid response')
        }
      }

      const data = await response.json()
      setUser(data.user)
      setEditing(false)
      setError('')
    } catch (err) {
      console.error('Save profile error:', err)
      setError(err.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    onLogout && onLogout()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-command-dark via-command-slate to-command-dark flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-12 h-12 border-4 border-command-gold border-t-transparent rounded-full"
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-command-dark via-command-slate to-command-dark">
      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ x: [0, 50, 0], y: [0, 30, 0] }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute top-10 left-10 w-72 h-72 bg-command-cobalt/10 rounded-full blur-3xl"
        />
      </div>

      {/* Header */}
      <div className="sticky top-0 z-40 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => window.location.hash = '#/dashboard'}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-command-gold hover:bg-glass-bg transition-colors"
            >
              <ArrowLeft size={18} />
              Back
            </motion.button>
            <h1 className="text-2xl font-bold text-white">Boss, Your Profile</h1>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-red-400 hover:bg-red-500/20 transition-colors"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-4 relative z-10">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-lg bg-red-500/20 border border-red-500/50 text-red-200"
          >
            {error}
          </motion.div>
        )}

        {/* Profile Card - Simplified */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl bg-glass-bg border border-glass-border backdrop-blur-xl p-8 mb-6 text-center max-w-md mx-auto"
        >
          {/* User Avatar */}
          <motion.div
            whileHover={{ scale: 1.1 }}
            className="w-24 h-24 rounded-2xl bg-gradient-to-br from-command-gold to-command-cobalt flex items-center justify-center mx-auto mb-6"
          >
            <User size={48} className="text-command-dark" />
          </motion.div>

          {/* User Name Only */}
          <h2 className="text-3xl font-bold text-white mb-2">{user?.name || 'Boss'}</h2>
          
          {/* User Email for Verification */}
          <p className="text-sm text-gray-400 mb-6">{user?.email}</p>

          {/* Simple Message */}
          <p className="text-gray-400 mb-8">Welcome back, Chief. Ready to crush it? 🚀</p>

          {/* Logout Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleLogout}
            className="w-full py-3 rounded-xl bg-red-500/20 border border-red-500/50 text-red-400 hover:bg-red-500/30 font-semibold transition-all flex items-center justify-center gap-2"
          >
            <LogOut size={18} />
            Logout
          </motion.button>
        </motion.div>
      </div>
    </div>
  )
}
