import React, { useState, useEffect } from 'react'
import { Menu, X, Home, Zap, BarChart3, Bell, Settings, LogOut, Moon, Sun, Clock, CheckCircle, Cloud, MessageSquare } from 'lucide-react'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false)
  const { logout, theme, toggleTheme } = useAuth()

  const menuItems = [
    { icon: Home, label: 'Dashboard', id: 1, href: '#/dashboard' },
    { icon: Zap, label: 'Habits', id: 2, href: '#/habits' },
    { icon: Clock, label: 'Routines', id: 3, href: '#/routines' },
    { icon: CheckCircle, label: 'Todos', id: 4, href: '#/todos' },
    { icon: Cloud, label: 'Weather', id: 5, href: '#/weather' },
    { icon: MessageSquare, label: 'Chat', id: 6, href: '#/chat' },
    { icon: BarChart3, label: 'Analytics', id: 7, href: '#/analytics' },
    { icon: Bell, label: 'Notifications', id: 8, href: '#/dashboard' },
    { icon: Settings, label: 'Profile', id: 9, href: '#/profile' },
  ]

  const handleLogout = () => {
    logout()
    window.location.hash = '#/login'
    setIsOpen(false)
  }

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="flex items-center gap-3 mb-12">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold">
          PA
        </div>
        <div>
          <div className={`font-bold text-lg ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Boss</div>
          <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Personal Assistant</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className={`flex-1 space-y-2 overflow-y-auto max-h-[calc(100vh-400px)] pr-2`}>
        {menuItems.map((item) => (
          <motion.a
            key={item.id}
            href={item.href}
            whileHover={{ x: 4 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsOpen(false)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all group cursor-pointer ${
              theme === 'dark'
                ? 'text-gray-300 hover:text-blue-600 hover:bg-gray-800'
                : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
            }`}
          >
            <item.icon size={20} className="group-hover:text-blue-600 transition-colors" />
            <span className="text-sm font-medium">{item.label}</span>
          </motion.a>
        ))}
      </nav>

      {/* Theme Toggle */}
      <div className={`py-3 border-t border-b space-y-3 ${
        theme === 'dark'
          ? 'border-gray-700'
          : 'border-gray-200'
      }`}>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className={`w-full py-2 px-4 rounded-lg border font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
            theme === 'dark'
              ? 'border-gray-700 text-gray-300 hover:text-blue-600 hover:bg-gray-800'
              : 'border-gray-300 text-gray-700 hover:text-blue-600 hover:bg-blue-50'
          }`}
        >
          {theme === 'dark' ? (
            <>
              <Sun size={16} />
              Light Mode
            </>
          ) : (
            <>
              <Moon size={16} />
              Dark Mode
            </>
          )}
        </motion.button>
      </div>

      {/* Footer */}
      <div className="pt-6 border-t border-glass-border space-y-3">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`w-full py-2 px-4 rounded-lg border font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
            theme === 'dark'
              ? 'border-blue-600 text-blue-400 hover:bg-blue-600/20'
              : 'border-blue-600 text-blue-600 hover:bg-blue-50'
          }`}
        >
          Upgrade Pro
        </motion.button>

        {/* Theme Toggle Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={toggleTheme}
          className={`w-full py-2.5 px-4 rounded-lg border font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
            theme === 'dark'
              ? 'border-indigo-600 text-indigo-400 hover:bg-indigo-600/20'
              : 'border-indigo-200 text-indigo-600 hover:bg-indigo-50'
          }`}
        >
          {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
          {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleLogout}
          className={`w-full py-2 px-4 rounded-lg border font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
            theme === 'dark'
              ? 'border-red-600 text-red-400 hover:bg-red-600/20'
              : 'border-red-200 text-red-600 hover:bg-red-50'
          }`}
        >
          <LogOut size={16} />
          Logout
        </motion.button>
        <p className={`text-xs mt-4 text-center ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>© 2026 Boss PA</p>
      </div>
    </>
  )

  return (
    <>
      {/* Mobile Toggle Button - Right Side */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 right-4 z-50 p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-all"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Desktop Sidebar - Always Visible */}
      <aside className={`hidden lg:flex flex-col w-64 h-screen bg-gradient-to-b ${theme === 'dark' ? 'from-gray-900 to-black' : 'from-white to-gray-50'} border-r ${theme === 'dark' ? 'border-gray-800' : 'border-gray-200'} p-6 flex-shrink-0`}>
        <SidebarContent />
      </aside>

      {/* Mobile Overlay */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsOpen(false)}
          className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-30"
        />
      )}

      {/* Mobile Sidebar - Animated Drawer from Right */}
      <motion.aside
        initial={{ x: 300 }}
        animate={{ x: isOpen ? 0 : 300 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className={`lg:hidden fixed right-0 top-0 h-screen w-64 bg-gradient-to-b ${theme === 'dark' ? 'from-gray-900 to-black' : 'from-white to-gray-50'} border-l ${theme === 'dark' ? 'border-gray-800' : 'border-gray-200'} z-40 p-6 flex flex-col`}
      >
        <SidebarContent />
      </motion.aside>
    </>
  )
}
