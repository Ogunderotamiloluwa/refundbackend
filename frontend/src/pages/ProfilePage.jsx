import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { User, Mail, Palette, Bell, LogOut, Save, Edit2, Clock, ArrowLeft, Moon, Sun } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { API_URL } from '../config/apiConfig'

export default function ProfilePage({ onLogout }) {
  const { theme, toggleTheme } = useAuth()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    timezone: 'UTC',
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:bg-gray-900 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full"
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:bg-gray-900 dark:text-white">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => window.location.hash = '#/dashboard'}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <ArrowLeft size={18} />
              Back
            </motion.button>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Your Profile</h1>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors font-medium"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-4 py-8">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400"
          >
            {error}
          </motion.div>
        )}

        {/* Main Content Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Profile Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:col-span-1 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-8 text-center shadow-md"
          >
            <motion.div
              whileHover={{ scale: 1.1 }}
              className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mx-auto mb-6"
            >
              <User size={48} className="text-white" />
            </motion.div>

            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{user?.name || 'User'}</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 break-all">{user?.email}</p>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-8">Welcome back. Ready to be productive?</p>
          </motion.div>

          {/* Settings Cards */}
          <div className="md:col-span-2 space-y-6">
            {/* Theme Toggle */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 shadow-md"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {theme === 'light' ? (
                    <Sun size={24} className="text-amber-500" />
                  ) : (
                    <Moon size={24} className="text-indigo-500" />
                  )}
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Theme</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {theme === 'light' ? 'Light mode' : 'Dark mode'}
                    </p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={toggleTheme}
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-all font-medium"
                >
                  Toggle
                </motion.button>
              </div>
            </motion.div>

            {/* Notifications Setting */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 shadow-md"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Bell size={24} className="text-blue-600 dark:text-blue-400" />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Notifications</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Receive push notifications</p>
                  </div>
                </div>
                <label className="relative inline-block w-14 h-8">
                  <input
                    type="checkbox"
                    checked={formData.notifications}
                    onChange={(e) => setFormData({ ...formData, notifications: e.target.checked })}
                    className="opacity-0 w-0 h-0"
                  />
                  <span
                    className={`absolute cursor-pointer top-0 left-0 right-0 bottom-0 rounded-full transition-all ${
                      formData.notifications ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  />
                  <span
                    className={`absolute left-1 top-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform ${
                      formData.notifications ? 'translate-x-6' : ''
                    }`}
                  />
                </label>
              </div>
            </motion.div>

            {/* Save Button */}
            {editing && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={handleSaveProfile}
                disabled={saving}
                className="w-full py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-all font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Save size={18} />
                {saving ? 'Saving...' : 'Save Changes'}
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
