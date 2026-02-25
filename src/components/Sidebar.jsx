import React, { useState, useEffect } from 'react'
import { Menu, X, Home, Zap, BarChart3, Bell, Settings, LogOut, Moon, Sun, Clock, CheckCircle, Cloud, MessageSquare } from 'lucide-react'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false)
  const [theme, setTheme] = useState(() => {
    // Check localStorage first, then check what's on the document
    const saved = localStorage.getItem('theme')
    if (saved) return saved
    
    // Check if document has dark or light class
    if (document.documentElement.classList.contains('light')) return 'light'
    if (document.documentElement.classList.contains('dark')) return 'dark'
    
    return 'dark' // default
  })
  const { logout } = useAuth()

  useEffect(() => {
    localStorage.setItem('theme', theme)
    
    // Remove both classes first
    document.documentElement.classList.remove('dark', 'light')
    
    // Add the new theme class
    if (theme === 'light') {
      document.documentElement.classList.add('light')
      document.body.style.backgroundColor = '#ffffff'
      document.body.style.color = '#000000'
    } else {
      document.documentElement.classList.add('dark')
      document.body.style.backgroundColor = '#121212'
      document.body.style.color = '#ffffff'
    }
    
    console.log('Theme applied:', theme, 'Classes:', document.documentElement.className)
  }, [theme])

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
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-command-gold to-command-cobalt flex items-center justify-center text-command-dark font-bold">
          PA
        </div>
        <div>
          <div className="font-bold text-white text-lg">Boss</div>
          <div className="text-xs text-gray-400">Command Center</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2 overflow-y-auto max-h-[calc(100vh-400px)] pr-2">
        {menuItems.map((item) => (
          <motion.a
            key={item.id}
            href={item.href}
            whileHover={{ x: 4 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsOpen(false)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:text-command-gold hover:bg-glass-bg transition-all group cursor-pointer"
          >
            <item.icon size={20} className="group-hover:text-command-cobalt transition-colors" />
            <span className="text-sm font-medium">{item.label}</span>
          </motion.a>
        ))}
      </nav>

      {/* Theme Toggle */}
      <div className="py-3 border-t border-glass-border border-b space-y-3">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="w-full py-2 px-4 rounded-xl border border-glass-border text-gray-300 hover:text-command-gold hover:bg-glass-bg font-semibold text-sm transition-all flex items-center justify-center gap-2"
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
          className="w-full py-2 px-4 rounded-xl bg-gradient-to-r from-command-gold to-command-cobalt text-command-dark font-semibold text-sm hover:shadow-lg transition-all"
        >
          Upgrade Pro
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleLogout}
          className="w-full py-2 px-4 rounded-xl border border-glass-border text-red-400 hover:bg-red-500/20 font-semibold text-sm transition-all flex items-center justify-center gap-2"
        >
          <LogOut size={16} />
          Logout
        </motion.button>
        <p className="text-xs text-gray-500 mt-4 text-center">© 2026 Boss PA</p>
      </div>
    </>
  )

  return (
    <>
      {/* Mobile Toggle Button - Right Side */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 right-4 z-50 p-2 text-command-gold hover:bg-glass-bg rounded-lg transition-all"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Desktop Sidebar - Always Visible */}
      <aside className="hidden lg:flex flex-col w-64 h-screen bg-gradient-to-b from-command-slate to-command-dark border-r border-glass-border backdrop-blur-xl p-6 flex-shrink-0">
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
        className="lg:hidden fixed right-0 top-0 h-screen w-64 bg-gradient-to-b from-command-slate to-command-dark border-l border-glass-border backdrop-blur-xl z-40 p-6 flex flex-col"
      >
        <SidebarContent />
      </motion.aside>
    </>
  )
}
