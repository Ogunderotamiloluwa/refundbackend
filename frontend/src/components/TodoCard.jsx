import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Trash2, CheckCircle2, Clock, MapPin, AlertTriangle } from 'lucide-react'

const RISK_COLORS = {
  low: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', badge: 'bg-green-100 text-green-700' },
  medium: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-700' },
  high: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', badge: 'bg-red-100 text-red-700' }
}

export default function TodoCard({ todo, onComplete, onDelete, onEdit, userLocation }) {
  const [timeLeft, setTimeLeft] = useState('')
  const [isOverdue, setIsOverdue] = useState(false)

  useEffect(() => {
    const updateTimeLeft = () => {
      const now = new Date();
      const todoTime = new Date(todo.scheduledTime);
      const diff = todoTime - now;

      if (diff < 0) {
        setIsOverdue(true);
        const hours = Math.abs(Math.floor(diff / 3600000));
        const minutes = Math.abs(Math.floor((diff % 3600000) / 60000));
        setTimeLeft(`${hours}h ${minutes}m overdue`);
      } else {
        setIsOverdue(false);
        const hours = Math.floor(diff / 3600000);
        const minutes = Math.floor((diff % 3600000) / 60000);
        if (hours > 0) {
          setTimeLeft(`${hours}h ${minutes}m`);
        } else {
          setTimeLeft(`${minutes}m`);
        }
      }
    };

    updateTimeLeft();
    const interval = setInterval(updateTimeLeft, 30000);
    return () => clearInterval(interval);
  }, [todo]);

  // Handle undefined riskLevel with fallback
  const riskLevel = todo.riskLevel || 'low';
  const riskStyle = RISK_COLORS[riskLevel];
  const todoTime = new Date(todo.scheduledTime);
  const now = new Date();
  const isNearTime = (todoTime - now) < 15 * 60000;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`p-4 sm:p-5 rounded-xl border transition-all ${
        isNearTime && isOverdue
          ? 'bg-red-50 border-red-300 shadow-md'
          : isNearTime
          ? 'bg-blue-50 border-blue-300 shadow-md'
          : riskLevel === 'medium'
          ? 'bg-amber-50 border-amber-200'
          : riskLevel === 'high'
          ? 'bg-red-50 border-red-200'
          : 'bg-green-50 border-green-200'
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm sm:text-base font-semibold text-gray-900 truncate">{todo.title}</h3>
          {todo.description && (
            <p className="text-xs sm:text-sm text-gray-600 mt-1 line-clamp-1">{todo.description}</p>
          )}
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap flex-shrink-0 ${riskStyle.badge}`}>
          {riskLevel === 'low' && 'Low'}
          {riskLevel === 'medium' && 'Medium'}
          {riskLevel === 'high' && 'High'}
        </span>
      </div>

      {/* Time and Location */}
      <div className="space-y-2 mb-4 text-xs sm:text-sm">
        <div className="flex items-center gap-2 text-gray-600">
          <Clock size={16} className="flex-shrink-0 text-blue-600" />
          <span className={`${isNearTime || isOverdue ? 'font-semibold text-red-700' : ''}`}>
            {todoTime.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </span>
          <span className={`ml-auto font-medium flex-shrink-0 ${isOverdue ? 'text-red-700' : 'text-gray-500'}`}>
            {timeLeft?.replace('minutes', 'm')?.replace('hours', 'h')}
          </span>
        </div>

        {todo.location && (
          <div className="flex items-center gap-2 text-gray-600 truncate">
            <MapPin size={16} className="flex-shrink-0 text-blue-600" />
            <span className="truncate text-xs sm:text-sm">{todo.location}</span>
          </div>
        )}
      </div>

      {/* Alert for overdue */}
      {isNearTime && isOverdue && (
        <div className="mb-4 p-2 sm:p-3 bg-red-100 border border-red-300 rounded-lg flex items-center gap-2 text-xs sm:text-sm text-red-700">
          <AlertTriangle size={14} className="flex-shrink-0" />
          <span>This task is overdue</span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onComplete(todo.id)}
          className="flex-1 py-2 px-3 rounded-lg text-xs sm:text-sm bg-green-600 text-white font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
        >
          <CheckCircle2 size={16} />
          <span className="hidden sm:inline">Complete</span>
          <span className="sm:hidden">Done</span>
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            console.log('🗑️ Delete button clicked for todo:', todo.id)
            onDelete && onDelete(todo.id)
          }}
          className="py-2 px-3 rounded-lg bg-white border border-gray-300 text-gray-600 hover:bg-red-50 hover:border-red-300 hover:text-red-700 transition-colors font-medium"
          title="Delete this todo"
        >
          <Trash2 size={16} />
        </motion.button>
      </div>
    </motion.div>
  )
}
