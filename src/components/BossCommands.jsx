import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Loader, Settings } from 'lucide-react'
import { API_URL } from '../config/apiConfig'

export default function BossCommands({ token, userContext }) {
  const [messages, setMessages] = useState([
    { id: 1, text: "Welcome back, Chief. Let's crush this day.", isCommand: true, timestamp: new Date() }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const inputRef = useRef(null)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const sendCommand = async (e) => {
    e.preventDefault()
    
    if (!input.trim()) return

    // Add user command
    setMessages(prev => [...prev, {
      id: prev.length + 1,
      text: input,
      isCommand: false,
      timestamp: new Date()
    }])

    setInput('')
    setLoading(true)

    try {
      const response = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: input })
      })

      if (!response.ok) {
        throw new Error('Chat service unavailable')
      }

      const data = await response.json()
      
      setMessages(prev => [...prev, {
        id: prev.length + 1,
        text: data.response,
        isCommand: true,
        timestamp: new Date()
      }])
    } catch (err) {
      setMessages(prev => [...prev, {
        id: prev.length + 1,
        text: `Boss, I hit a snag: ${err.message}. Backend might need a restart.`,
        isCommand: true,
        isError: true,
        timestamp: new Date()
      }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-lg sm:rounded-2xl bg-glass-bg border border-glass-border backdrop-blur-xl p-3 sm:p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-command-gold">Boss Commands</h2>
          <p className="text-xs text-gray-400">AI-powered</p>
        </div>
        <Settings size={20} className="text-command-gold/50 flex-shrink-0" />
      </div>

      {/* Messages Display */}
      <div className="bg-gradient-to-b from-command-dark/50 to-transparent rounded-lg sm:rounded-xl p-3 sm:p-4 mb-3 sm:mb-4 min-h-[150px] sm:min-h-[200px] max-h-[250px] sm:max-h-[300px] overflow-y-auto space-y-2 sm:space-y-3">
        <AnimatePresence>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`text-xs sm:text-sm ${
                msg.isCommand
                  ? msg.isError
                    ? 'text-red-300 italic'
                    : 'text-command-gold'
                  : 'text-gray-200 ml-2 sm:ml-4'
              }`}
            >
              <div className="flex items-start gap-2">
                <span className="text-sm flex-shrink-0">{msg.isCommand ? '💡' : '👤'}</span>
                <div className="min-w-0 flex-1">
                  <p className="leading-relaxed break-words">{msg.text}</p>
                  <p className="text-xs opacity-50 mt-1">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 text-command-gold text-xs sm:text-sm"
          >
            <Loader size={14} className="animate-spin flex-shrink-0" />
            <span>Boss is thinking...</span>
          </motion.div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={sendCommand} className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Command..."
          disabled={loading}
          className="flex-1 min-w-0 px-2 sm:px-3 py-2 text-xs sm:text-sm rounded-lg bg-command-dark/50 border border-glass-border text-white placeholder-gray-500 focus:outline-none focus:border-command-gold transition-colors disabled:opacity-50"
        />
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          type="submit"
          disabled={loading || !input.trim()}
          className="px-2 sm:px-3 py-2 rounded-lg bg-command-gold/20 border border-command-gold/50 text-command-gold hover:bg-command-gold/30 transition-all disabled:opacity-50 flex items-center gap-1 flex-shrink-0"
        >
          <Send size={14} />
        </motion.button>
      </form>
    </motion.div>
  )
}
