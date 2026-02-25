import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Trash2, CheckCircle2, Circle, Clock, MapPin, AlertTriangle, CloudRain, Wind } from 'lucide-react'

const RISK_COLORS = {
  low: { bg: 'bg-green-500/20', border: 'border-green-500/50', text: 'text-green-400' },
  medium: { bg: 'bg-yellow-500/20', border: 'border-yellow-500/50', text: 'text-yellow-400' },
  high: { bg: 'bg-red-500/20', border: 'border-red-500/50', text: 'text-red-400' }
}

export default function TodoCard({ todo, onComplete, onDelete, onEdit, userLocation }) {
  const [timeLeft, setTimeLeft] = useState('')
  const [isOverdue, setIsOverdue] = useState(false)
  const [trafficAlert, setTrafficAlert] = useState(null)
  const [weatherAlert, setWeatherAlert] = useState(null)

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
    const interval = setInterval(updateTimeLeft, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, [todo]);

  useEffect(() => {
    // Check for traffic/route dangers
    if (todo.location && todo.riskLevel === 'high') {
      // Mock traffic alert - in production, use Google Maps API or similar
      const trafficSimulation = Math.random() > 0.5;
      if (trafficSimulation) {
        setTrafficAlert({
          type: 'traffic',
          message: '🚗 Heavy traffic detected on this route',
          severity: 'high'
        });
      }
    }

    // Check for weather alerts
    if (todo.location && userLocation) {
      const weatherSimulation = Math.random() > 0.6;
      if (weatherSimulation) {
        const alerts = ['⛈️ Thunderstorm warning', '🌧️ Heavy rain expected', '☀️ High heat warning'];
        setWeatherAlert({
          type: 'weather',
          message: alerts[Math.floor(Math.random() * alerts.length)],
          severity: 'medium'
        });
      }
    }
  }, [todo, userLocation]);

  const riskStyle = RISK_COLORS[todo.riskLevel];
  const todoTime = new Date(todo.scheduledTime);
  const now = new Date();
  const isNearTime = (todoTime - now) < 15 * 60000; // Less than 15 minutes

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`p-5 rounded-xl border-2 backdrop-blur-xl transition-all ${
        isNearTime && isOverdue
          ? 'bg-red-500/10 border-red-500/50 shadow-lg shadow-red-500/20'
          : isNearTime
          ? 'bg-command-gold/10 border-command-gold/50 shadow-lg shadow-command-gold/20'
          : `${riskStyle.bg} border-${todo.riskLevel === 'low' ? 'green' : todo.riskLevel === 'medium' ? 'yellow' : 'red'}-500/50`
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white">{todo.title}</h3>
          {todo.description && (
            <p className="text-sm text-gray-400 mt-1">{todo.description}</p>
          )}
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ml-2 ${riskStyle.bg} border border-white/20 ${riskStyle.text}`}>
          {todo.riskLevel === 'low' && '✅ Low'}
          {todo.riskLevel === 'medium' && '⚠️ Medium'}
          {todo.riskLevel === 'high' && '🚨 High'}
        </span>
      </div>

      {/* Time and Location */}
      <div className="space-y-2 mb-3">
        <div className="flex items-center gap-2 text-sm">
          <Clock size={14} className={isNearTime || isOverdue ? 'text-red-400' : 'text-command-gold'} />
          <span className={isNearTime || isOverdue ? 'text-red-400 font-semibold' : 'text-gray-300'}>
            {todoTime.toLocaleString()}
          </span>
          <span className={`ml-auto font-semibold ${isOverdue ? 'text-red-400' : 'text-gray-400'}`}>
            {timeLeft}
          </span>
        </div>

        {todo.location && (
          <div className="flex items-center gap-2 text-sm text-gray-300">
            <MapPin size={14} className="text-blue-400" />
            <span>{todo.location}</span>
          </div>
        )}
      </div>

      {/* Alerts */}
      {(trafficAlert || weatherAlert) && (
        <div className="space-y-2 mb-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          {trafficAlert && (
            <div className="flex items-center gap-2 text-xs text-red-300">
              <Wind size={12} />
              <span>{trafficAlert.message}</span>
            </div>
          )}
          {weatherAlert && (
            <div className="flex items-center gap-2 text-xs text-red-300">
              <CloudRain size={12} />
              <span>{weatherAlert.message}</span>
            </div>
          )}
        </div>
      )}

      {/* Progress indicator if near time */}
      {isNearTime && (
        <div className="mb-3 h-1 bg-red-500/20 rounded-full overflow-hidden">
          <motion.div
            animate={{ width: ['0%', '100%'] }}
            transition={{ duration: 60, repeat: Infinity }}
            className="h-full bg-red-500"
          />
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onComplete(todo.id)}
          className="flex-1 py-2 px-3 rounded-lg bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
        >
          <CheckCircle2 size={16} />
          Complete
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onDelete(todo.id)}
          className="py-2 px-3 rounded-lg bg-white/5 border border-white/10 text-gray-300 hover:bg-red-500/20 hover:border-red-500/50 hover:text-red-400 transition-all"
        >
          <Trash2 size={16} />
        </motion.button>
      </div>

      {/* Danger indicator */}
      {isNearTime && isOverdue && (
        <div className="mt-2 text-xs text-red-400 flex items-center gap-1">
          <AlertTriangle size={12} />
          This todo is overdue! Complete it now!
        </div>
      )}
    </motion.div>
  )
}
