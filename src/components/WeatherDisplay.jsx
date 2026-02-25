import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Cloud, CloudRain, Sun, Wind, Droplets, AlertTriangle, MapPin } from 'lucide-react'
import { getWeatherAlerts } from '../services/weatherService'

export default function WeatherDisplay() {
  const [userLocation, setUserLocation] = useState(null)
  const [weather, setWeather] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          })
        },
        (err) => {
          console.log('Geolocation error:', err)
          setError('Location not available')
          setLoading(false)
        }
      )
    } else {
      setError('Geolocation not supported')
      setLoading(false)
    }
  }, [])

  // Fetch weather when location is available
  useEffect(() => {
    if (!userLocation) return

    const fetchWeather = async () => {
      try {
        const data = await getWeatherAlerts(userLocation.latitude, userLocation.longitude)
        setWeather(data)
        setError(null)
        setLoading(false)
      } catch (err) {
        console.log('Weather fetch error:', err)
        setError('Weather unavailable')
        setLoading(false)
      }
    }

    fetchWeather()
    const interval = setInterval(fetchWeather, 10 * 60 * 1000) // Refresh every 10 minutes
    return () => clearInterval(interval)
  }, [userLocation])

  const getWeatherIcon = () => {
    if (!weather) return null
    if (weather.raining) return <CloudRain className="text-blue-400" size={32} />
    if (weather.cloudCover > 70) return <Cloud className="text-gray-400" size={32} />
    if (weather.snowing) return <Cloud className="text-blue-200" size={32} />
    return <Sun className="text-yellow-400" size={32} />
  }

  const getWeatherCondition = () => {
    if (!weather) return 'Loading...'
    if (weather.snowing) return 'Snowing'
    if (weather.raining) return 'Raining'
    if (weather.cloudCover > 70) return 'Cloudy'
    return 'Clear'
  }

  const getAlertLevel = () => {
    if (!weather) return 'neutral'
    if (weather.snowing || weather.raining) return 'danger'
    if (weather.cloudCover > 70) return 'warning'
    return 'safe'
  }

  const alertLevel = getAlertLevel()
  const alertColors = {
    danger: 'bg-red-500/10 border-red-500/50',
    warning: 'bg-yellow-500/10 border-yellow-500/50',
    safe: 'bg-green-500/20 border-green-500/50',
    neutral: 'bg-glass-bg border-glass-border'
  }

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 rounded-2xl bg-glass-bg border border-glass-border backdrop-blur-xl"
      >
        <div className="h-32 flex items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-8 h-8 border-3 border-command-gold border-t-transparent rounded-full"
          />
        </div>
      </motion.div>
    )
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 rounded-2xl bg-glass-bg border border-glass-border backdrop-blur-xl"
      >
        <div className="text-center text-gray-400">
          <AlertTriangle size={24} className="mx-auto mb-2 text-yellow-400" />
          {error}
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-6 rounded-2xl border backdrop-blur-xl transition-all ${alertColors[alertLevel]}`}
    >
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">🌤️ Weather & Location</h3>
          {userLocation && (
            <span className="text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-300 flex items-center gap-1">
              <MapPin size={12} />
              Live
            </span>
          )}
        </div>

        {/* Weather Info */}
        <div className="grid grid-cols-2 gap-4">
          {/* Left - Weather Status */}
          <div className="flex items-center gap-3">
            {getWeatherIcon()}
            <div>
              <div className="text-2xl font-bold text-white">
                {Math.round(weather.temperature)}°
              </div>
              <div className="text-sm text-gray-300">{getWeatherCondition()}</div>
            </div>
          </div>

          {/* Right - Quick Stats */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs">
              <Wind size={14} className="text-blue-400" />
              <span className="text-gray-300">Cloud: <span className="font-semibold">{weather.cloudCover}%</span></span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <Droplets size={14} className="text-blue-400" />
              <span className="text-gray-300">Rain: <span className="font-semibold">{weather.rain}mm</span></span>
            </div>
          </div>
        </div>

        {/* Detailed Stats */}
        <div className="grid grid-cols-4 gap-2 pt-3 border-t border-white/10">
          <div className="p-2 rounded-lg bg-white/5 text-center">
            <div className="text-xs text-gray-400">Temperature</div>
            <div className="text-sm font-semibold text-white">{Math.round(weather.temperature)}°C</div>
          </div>
          <div className="p-2 rounded-lg bg-white/5 text-center">
            <div className="text-xs text-gray-400">Cloud</div>
            <div className="text-sm font-semibold text-white">{weather.cloudCover}%</div>
          </div>
          <div className="p-2 rounded-lg bg-white/5 text-center">
            <div className="text-xs text-gray-400">Rain</div>
            <div className="text-sm font-semibold text-white">{weather.rain}mm</div>
          </div>
          <div className="p-2 rounded-lg bg-white/5 text-center">
            <div className="text-xs text-gray-400">Snow</div>
            <div className="text-sm font-semibold text-white">{weather.snowing ? '❄️' : 'No'}</div>
          </div>
        </div>

        {/* Alert Messages */}
        {(weather.raining || weather.snowing || weather.cloudCover > 70) && (
          <div className={`p-3 rounded-lg text-sm text-center font-semibold ${
            weather.raining || weather.snowing
              ? 'bg-red-500/20 text-red-300 border border-red-500/50'
              : 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/50'
          }`}>
            {weather.raining && '🌧️ Heavy rain - Check road conditions before going out'}
            {weather.snowing && '❄️ Snowing - Be careful, roads may be slippery'}
            {!weather.raining && !weather.snowing && weather.cloudCover > 70 && '☁️ Cloudy conditions - May affect outdoor plans'}
          </div>
        )}

        {/* Safe Condition */}
        {!weather.raining && !weather.snowing && weather.cloudCover <= 70 && (
          <div className="p-3 rounded-lg text-sm text-center bg-green-500/20 text-green-300 border border-green-500/50 font-semibold">
            ☀️ Great weather! Perfect for outdoor activities
          </div>
        )}
      </div>
    </motion.div>
  )
}
