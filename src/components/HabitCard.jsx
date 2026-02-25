import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Check, Trash2 } from 'lucide-react'

export default function HabitCard({ habit, onComplete, onDelete }) {
  const [isCompleting, setIsCompleting] = useState(false)
  const progress = habit.completed ? 100 : (habit.progress || 0)
  const circumference = 2 * Math.PI * 45

  const handleComplete = async () => {
    setIsCompleting(true)
    await onComplete(habit.id)
    setTimeout(() => setIsCompleting(false), 600)
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5 }}
      transition={{ duration: 0.3 }}
      className="group p-6 rounded-2xl bg-glass-bg border border-glass-border backdrop-blur-xl hover:bg-white/10 transition-all hover:border-command-gold/50"
    >
      <div className="flex items-start justify-between gap-4">
        {/* Progress Ring */}
        <div className="flex-shrink-0 relative w-24 h-24">
          <svg className="w-full h-full transform -rotate-90">
            {/* Background circle */}
            <circle
              cx="48"
              cy="48"
              r="45"
              fill="none"
              stroke="rgba(255, 255, 255, 0.1)"
              strokeWidth="3"
            />
            {/* Progress circle */}
            <motion.circle
              cx="48"
              cy="48"
              r="45"
              fill="none"
              stroke="url(#gradient)"
              strokeWidth="3"
              strokeDasharray={circumference}
              strokeDashoffset={isCompleting ? 0 : circumference - (circumference * progress) / 100}
              strokeLinecap="round"
              animate={{
                strokeDashoffset: circumference - (circumference * progress) / 100,
              }}
              transition={{ duration: 0.6, ease: 'easeInOut' }}
            />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#d4af37" />
                <stop offset="100%" stopColor="#0066cc" />
              </linearGradient>
            </defs>
          </svg>

          {/* Center content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {isCompleting ? (
              <motion.div
                animate={{ scale: [1, 1.2, 0] }}
                transition={{ duration: 0.6 }}
              >
                <Check size={32} className="text-command-gold" />
              </motion.div>
            ) : (
              <>
                <div className="text-xl font-bold text-command-gold">{progress}%</div>
                <div className="text-xs text-gray-400">Complete</div>
              </>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-white truncate">{habit.name}</h3>
          <p className="text-xs text-gray-400 mt-1 line-clamp-2">{habit.description}</p>
          <div className="mt-3 flex items-center gap-2">
            <span className="inline-block px-2 py-1 rounded-full bg-command-cobalt/20 text-command-cobalt text-xs font-medium">
              {habit.frequency}
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-4 flex gap-2">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleComplete}
          className="flex-1 py-2 px-3 rounded-lg bg-gradient-to-r from-command-gold to-command-cobalt text-command-dark text-xs font-semibold hover:shadow-lg transition-all"
        >
          Mark Complete
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onDelete(habit.id)}
          className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
        >
          <Trash2 size={16} />
        </motion.button>
      </div>
    </motion.div>
  )
}
