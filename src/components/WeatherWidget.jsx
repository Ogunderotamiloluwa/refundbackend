import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Cloud, CloudRain, Sun, Wind, Droplets, AlertTriangle } from 'lucide-react'
import { getWeatherAlerts } from '../services/weatherService'

export default function WeatherWidget({ userLocation }) {
  const [weather, setWeather] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchWeather = async () => {
      if (!userLocation) {
        setError('Location not available')
        setLoading(false)
        return
      }

      try {
        const data = await getWeatherAlerts(userLocation.latitude, userLocation.longitude)
        setWeather(data)
        setError(null)
      } catch (err) {
        console.error('Weather fetch error:', err)
        setError('Weather unavailable')
      } finally {
        setLoading(false)
      }
    }

    fetchWeather()
    // Refresh weather every 10 minutes
    const interval = setInterval(fetchWeather, 10 * 60 * 1000)
    return () => clearInterval(interval)
  }, [userLocation])

  if (loading) {
    return (
      <div className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xl">
        <div className="h-20 flex items-center justify-center">
          <div className="animate-pulse text-gray-400">Loading weather...</div>
        </div>
      </div>
    )
  }

  if (error || !weather) {
    return (
      <div className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xl">
        <div className="text-xs text-gray-400">🌍 {error || 'Weather data unavailable'}</div>
      </div>
    )
  }

  const getWeatherIcon = () => {
    if (weather.raining) return <CloudRain className="text-blue-400" size={24} />
    if (weather.cloudCover > 70) return <Cloud className="text-gray-400" size={24} />
    if (weather.snowing) return <Cloud className="text-blue-200" size={24} />
    return <Sun className="text-yellow-400" size={24} />
  }

  const getWeatherCondition = () => {
    if (weather.snowing) return 'Snowing'
    if (weather.raining) return 'Raining'
    if (weather.cloudCover > 70) return 'Cloudy'
    return 'Clear'
  }

  const getAlertLevel = () => {
    if (weather.snowing || weather.raining) return 'danger'
    if (weather.cloudCover > 70) return 'warning'
    return 'safe'
  }

  const alertLevel = getAlertLevel()
  const alertColors = {
    danger: 'bg-red-500/20 border-red-500/50',
    warning: 'bg-yellow-500/20 border-yellow-500/50',
    safe: 'bg-green-500/20 border-green-500/50'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-4 rounded-xl border backdrop-blur-xl transition-all ${alertColors[alertLevel]}`}
    >
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getWeatherIcon()}
            <div>
              <div className="text-sm font-semibold text-white">{getWeatherCondition()}</div>
              <div className="text-xs text-gray-400">{Math.round(weather.temperature)}°C</div>
            </div>
          </div>
          {alertLevel === 'danger' && (
            <AlertTriangle className="text-red-400" size={18} />
          )}
        </div>

        {/* Details */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-1 text-gray-300">
            <Wind size={12} className="text-blue-400" />
            <span>Cloud: {weather.cloudCover}%</span>
          </div>
          <div className="flex items-center gap-1 text-gray-300">
            <Droplets size={12} className="text-blue-400" />
            <span>Rain: {weather.rain}mm</span>
          </div>
        </div>

        {/* Alert Message */}
        {(weather.raining || weather.snowing || weather.cloudCover > 70) && (
          <div className={`text-xs p-2 rounded-lg ${
            weather.raining || weather.snowing 
              ? 'bg-red-500/20 text-red-300'
              : 'bg-yellow-500/20 text-yellow-300'
          }`}>
            {weather.raining && '🌧️ Be ready for rain schedules'}
            {weather.snowing && '❄️ Snowing - Avoid outdoor activities'}
            {!weather.raining && !weather.snowing && weather.cloudCover > 70 && '☁️ Cloudy conditions'}
          </div>
        )}
      </div>
    </motion.div>
  )
}
