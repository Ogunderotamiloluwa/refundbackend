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
      className="rounded-2xl bg-white border border-gray-200 shadow-md p-4 sm:p-6 hover:shadow-lg transition-shadow"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4 sm:mb-5">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">Boss Commands</h2>
          <p className="text-xs sm:text-sm text-gray-500">AI-powered assistant</p>
        </div>
        <div className="p-2.5 rounded-lg bg-blue-100">
          <Settings size={20} className="text-blue-600" />
        </div>
      </div>

      {/* Messages Display */}
      <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl p-4 sm:p-5 mb-4 sm:mb-5 min-h-[150px] sm:min-h-[200px] max-h-[300px] overflow-y-auto space-y-3 sm:space-y-4 border border-gray-200">
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
                    ? 'text-red-600'
                    : 'text-gray-800'
                  : 'text-gray-700 ml-2 sm:ml-4'
              }`}
            >
              <div className="flex items-start gap-2">
                <span className="text-base font-semibold flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${msg.isCommand ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-600'}">
                  {msg.isCommand ? '▸' : '→'}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="leading-relaxed break-words">{msg.text}</p>
                  <p className="text-xs opacity-60 mt-1.5 text-gray-500">
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
            className="flex items-center gap-2 text-blue-600 text-xs sm:text-sm font-medium"
          >
            <Loader size={14} className="animate-spin flex-shrink-0" />
            <span>Processing...</span>
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
          placeholder="Enter your command..."
          disabled={loading}
          className="flex-1 min-w-0 px-3 sm:px-4 py-2.5 text-xs sm:text-sm rounded-lg bg-white border-2 border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all disabled:opacity-50"
        />
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          type="submit"
          disabled={loading || !input.trim()}
          className="px-3 sm:px-4 py-2.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 flex-shrink-0 font-medium"
        >
          <Send size={16} />
        </motion.button>
      </form>
    </motion.div>
  )
}
