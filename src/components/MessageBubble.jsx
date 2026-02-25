import React from 'react'
import { motion } from 'framer-motion'

export default function MessageBubble({ message, isAI = true }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex gap-3 mb-4"
    >
      {isAI && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-command-cobalt to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
          B
        </div>
      )}

      <div className={`flex-1 ${!isAI ? 'text-right' : ''}`}>
        {isAI ? (
          <motion.div
            className="inline-block max-w-sm p-4 rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-700 text-white shadow-lg animate-pulse-glow"
            whileHover={{ scale: 1.02 }}
          >
            <p className="text-sm leading-relaxed">{message}</p>
          </motion.div>
        ) : (
          <div className="inline-block max-w-sm p-4 rounded-2xl bg-glass-bg border border-glass-border text-gray-200">
            <p className="text-sm leading-relaxed">{message}</p>
          </div>
        )}

        <div className="mt-1 flex items-center justify-start gap-2">
          {isAI && <span className="text-xs text-gray-400">Boss</span>}
          <span className="text-xs text-gray-500">Just now</span>
        </div>
      </div>
    </motion.div>
  )
}
