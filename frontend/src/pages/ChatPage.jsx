import React, { useState, useEffect, useRef } from 'react'
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
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async (e) => {
    e.preventDefault()

    if (!input.trim()) return

    // Capture the message before clearing input
    const messageToSend = input.trim()

    // Add user message to chat
    const userMessage = {
      id: messages.length + 1,
      text: messageToSend,
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
        body: JSON.stringify({ message: messageToSend })
      })

      if (!response.ok) {
        const contentType = response.headers.get('content-type')
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to get response')
        } else {
          throw new Error('Backend service unavailable')
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
            <button
              onClick={() => window.location.hash = '#/dashboard'}
              className="flex items-center gap-2 px-2 sm:px-3 py-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex-shrink-0"
            >
              <ArrowLeft size={18} />
              <span className="hidden sm:inline">Back</span>
            </button>
            <h1 className="text-lg sm:text-2xl font-semibold text-gray-900 dark:text-white truncate">AI Assistant</h1>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 max-w-4xl mx-auto w-full px-3 sm:px-4 py-4 sm:py-8 overflow-y-auto">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex mb-4 sm:mb-6 ${msg.isAI ? 'justify-start' : 'justify-end'}`}>
            <div
              className={`max-w-[85%] sm:max-w-xs lg:max-w-md px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl text-sm sm:text-base ${
                msg.isAI
                  ? msg.isError
                    ? 'bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-100'
                    : 'bg-blue-50 dark:bg-gray-700 border border-blue-200 dark:border-gray-600 text-gray-900 dark:text-gray-100'
                  : 'bg-blue-600 dark:bg-blue-700 text-white font-semibold'
              }`}
            >
              <p className="leading-relaxed break-words">{msg.text}</p>
              <p className={`text-xs mt-1 sm:mt-2 ${msg.isAI ? (msg.isError ? 'text-red-600 dark:text-red-300' : 'text-blue-600 dark:text-gray-400') : 'text-blue-100'}`}>
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start mb-4 sm:mb-6">
            <div className="bg-blue-50 dark:bg-gray-700 border border-blue-200 dark:border-gray-600 px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl text-gray-900 dark:text-gray-100 flex items-center gap-2 text-sm sm:text-base">
              <Loader size={16} className="animate-spin flex-shrink-0 text-blue-600 dark:text-blue-400" />
              <span>AI is thinking...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="sticky bottom-0 z-40 border-t border-gray-200 dark:border-gray-700 px-3 sm:px-4 py-3 sm:py-4 bg-white dark:bg-gray-800">
        <div className="max-w-4xl mx-auto">
          {error && (
            <div className="mb-3 p-2 sm:p-3 rounded-lg bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-100 text-xs sm:text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSendMessage} className="flex gap-2 sm:gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything..."
              disabled={loading}
              className="flex-1 min-w-0 px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base rounded-lg bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-3 sm:px-6 py-2 sm:py-3 text-sm sm:text-base rounded-lg bg-blue-600 dark:bg-blue-700 text-white font-semibold hover:bg-blue-700 dark:hover:bg-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 sm:gap-2 flex-shrink-0"
            >
              <Send size={18} />
              <span className="hidden sm:inline">Send</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
