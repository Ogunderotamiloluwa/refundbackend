import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, ArrowLeft, Loader } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { API_URL } from '../config/apiConfig'

export default function ChatPage() {
  const { token } = useAuth()
  const [messages, setMessages] = useState([
    { id: 1, text: "Hi! I'm your personal AI assistant. Ask me anything about your habits, routines, todos, or just need some motivation? I'm here to help!", isAI: true, timestamp: new Date() }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async (e) => {
    e.preventDefault()
    
    if (!input.trim()) return

    // Add user message to chat
    const userMessage = {
      id: messages.length + 1,
      text: input,
      isAI: false,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)
    setError('')

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
        const contentType = response.headers.get('content-type')
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to get response')
        } else {
          throw new Error('Server error. Is backend running on localhost:5004?')
        }
      }

      const data = await response.json()
      
      // Add AI response to chat
      const aiMessage = {
        id: messages.length + 2,
        text: data.response,
        isAI: true,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, aiMessage])

    } catch (err) {
      console.error('Chat error:', err)
      setError(err.message || 'Failed to send message')
      
      // Add error message
      const errorMessage = {
        id: messages.length + 2,
        text: `Oops, boss! I hit a snag: ${err.message}. Try again in a moment.`,
        isAI: true,
        isError: true,
        timestamp: new Date()
      }
      
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:bg-gray-900 dark:text-white flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="max-w-4xl mx-auto w-full px-3 sm:px-4 py-3 sm:py-4 flex justify-between items-center gap-2">
          <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => window.location.hash = '#/dashboard'}
              className="flex items-center gap-2 px-2 sm:px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors flex-shrink-0"
            >
              <ArrowLeft size={18} />
              <span className="hidden sm:inline">Back</span>
            </motion.button>
            <h1 className="text-lg sm:text-2xl font-semibold text-gray-900 truncate">AI Assistant</h1>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 max-w-4xl mx-auto w-full px-3 sm:px-4 py-4 sm:py-8 overflow-y-auto">
        <AnimatePresence>
          {messages.map((msg, index) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`flex mb-4 sm:mb-6 ${msg.isAI ? 'justify-start' : 'justify-end'}`}
            >
              <div
                className={`max-w-[85%] sm:max-w-xs lg:max-w-md px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl text-sm sm:text-base ${
                  msg.isAI
                    ? msg.isError
                      ? 'bg-red-50 border border-red-200 text-red-700'
                      : 'bg-blue-50 border border-blue-200 text-gray-900'
                    : 'bg-blue-600 text-white font-semibold'
                }`}
              >
                <p className="leading-relaxed break-words">{msg.text}</p>
                <p className={`text-xs mt-1 sm:mt-2 ${msg.isAI ? (msg.isError ? 'text-red-600' : 'text-blue-600') : 'text-blue-100'}`}>
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {loading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start mb-4 sm:mb-6"
          >
            <div className="bg-blue-50 border border-blue-200 px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl text-gray-900 flex items-center gap-2 text-sm sm:text-base">
              <Loader size={16} className="animate-spin flex-shrink-0 text-blue-600" />
              <span>AI is thinking...</span>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="sticky bottom-0 z-40 border-t border-gray-200 px-3 sm:px-4 py-3 sm:py-4 bg-white">
        <div className="max-w-4xl mx-auto">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-3 p-2 sm:p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSendMessage} className="flex gap-2 sm:gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything..."
              disabled={loading}
              className="flex-1 min-w-0 px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base rounded-lg sm:rounded-lg bg-white border border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors disabled:opacity-50"
            />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="submit"
              disabled={loading || !input.trim()}
              className="px-3 sm:px-6 py-2 sm:py-3 text-sm sm:text-base rounded-lg sm:rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 sm:gap-2 flex-shrink-0"
            >
              <Send size={18} />
              <span className="hidden sm:inline">Send</span>
            </motion.button>
          </form>

          {/* Suggestions */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-3 sm:mt-4 flex flex-wrap gap-1 sm:gap-2"
          >
            {[
              'Tell me my habits',
              'What\'s my schedule?',
              'Show my todos',
              'Motivate me!'
            ].map((suggestion, idx) => (
              <motion.button
                key={idx}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setInput(suggestion)
                  setTimeout(() => {
                    document.querySelector('form')?.dispatchEvent(
                      new Event('submit', { bubbles: true })
                    )
                  }, 0)
                }}
                className="text-xs px-2 sm:px-3 py-1 sm:py-2 rounded-lg bg-blue-100 border border-blue-200 text-blue-700 hover:bg-blue-200 transition-colors flex-shrink-0"
              >
                {suggestion}
              </motion.button>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  )
}
