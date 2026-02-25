import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Cloud, CloudRain, Sun, Wind, Droplets, AlertTriangle, MapPin, Loader, Search, Eye, Gauge } from 'lucide-react'

export default function WeatherPage() {
  const [searchInput, setSearchInput] = useState('')
  const [userLocation, setUserLocation] = useState(null)
  const [weather, setWeather] = useState(null)
  const [forecast, setForecast] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [searchResults, setSearchResults] = useState([])
  const [selectedLocation, setSelectedLocation] = useState(null)

  // Get user location on mount
  useEffect(() => {
    const getLocation = () => {
      if (navigator.geolocation) {
        // Set timeout for geolocation request (10 seconds max)
        const timeoutId = setTimeout(() => {
          setError('Location request timed out. Please search for a location.')
          setLoading(false)
        }, 10000)

        navigator.geolocation.getCurrentPosition(
          (position) => {
            clearTimeout(timeoutId)
            setUserLocation({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              name: 'Your Location'
            })
            fetchWeatherAndForecast(position.coords.latitude, position.coords.longitude, 'Your Location')
          },
          (err) => {
            clearTimeout(timeoutId)
            console.log('❌ Geolocation error:', err.message)
            let errorMsg = 'Location not available. '
            
            switch(err.code) {
              case err.PERMISSION_DENIED:
                errorMsg += 'Please enable location permissions in your browser settings.'
                break
              case err.POSITION_UNAVAILABLE:
                errorMsg += 'Location information is unavailable.'
                break
              case err.TIMEOUT:
                errorMsg += 'Location request timed out.'
                break
              default:
                errorMsg += 'An error occurred while getting your location.'
            }
            
            setError(errorMsg + ' You can search for a location below.')
            setLoading(false)
          },
          {
            timeout: 8000,
            enableHighAccuracy: false // Don't require high accuracy for faster results
          }
        )
      } else {
        setError('⚠️ Geolocation is not supported in your browser. Please search for a location below.')
        setLoading(false)
      }
    }

    getLocation()
  }, [])

  // Fetch weather and forecast data
  const fetchWeatherAndForecast = async (lat, lon, locationName) => {
    setLoading(true)
    try {
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,cloud_cover,visibility&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max,uv_index_max&hourly=temperature_2m,weather_code,precipitation&timezone=auto`
      )
      const data = await response.json()
      
      setWeather({
        temperature: data.current.temperature_2m,
        condition: getWeatherCondition(data.current.weather_code),
        weatherCode: data.current.weather_code,
        humidity: data.current.relative_humidity_2m,
        apparentTemp: data.current.apparent_temperature,
        rainfall: data.current.precipitation || 0,
        windSpeed: data.current.wind_speed_10m,
        cloudCover: data.current.cloud_cover,
        visibility: data.current.visibility / 1000, // Convert to km
        timezone: data.timezone,
        raining: data.current.precipitation > 0,
        snowing: data.current.weather_code >= 71 && data.current.weather_code <= 77,
      })

      // Format forecast
      const forecastData = []
      for (let i = 0; i < data.daily.time.length; i++) {
        forecastData.push({
          date: data.daily.time[i],
          maxTemp: data.daily.temperature_2m_max[i],
          minTemp: data.daily.temperature_2m_min[i],
          condition: getWeatherCondition(data.daily.weather_code[i]),
          weatherCode: data.daily.weather_code[i],
          precipitation: data.daily.precipitation_sum[i],
          windSpeed: data.daily.wind_speed_10m_max[i],
          uvIndex: data.daily.uv_index_max[i],
        })
      }
      setForecast(forecastData)
      setSelectedLocation({ latitude: lat, longitude: lon, name: locationName })
      setLastUpdated(new Date())
      setError(null)
    } catch (err) {
      console.error('Weather fetch error:', err)
      setError('Failed to fetch weather data')
    } finally {
      setLoading(false)
    }
  }

  // Search for locations
  const handleLocationSearch = async (value) => {
    setSearchInput(value)
    
    if (!value || value.length < 2) {
      setSearchResults([])
      return
    }

    try {
      const response = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(value)}&count=5&language=en&format=json`
      )
      const data = await response.json()
      
      if (data.results) {
        setSearchResults(data.results)
      } else {
        setSearchResults([])
      }
    } catch (err) {
      console.error('Search error:', err)
      setSearchResults([])
    }
  }

  // Select location from search results
  const selectLocation = (result) => {
    const locationName = `${result.name}${result.admin1 ? ', ' + result.admin1 : ''}${result.country ? ', ' + result.country : ''}`
    fetchWeatherAndForecast(result.latitude, result.longitude, locationName)
    setSearchInput('')
    setSearchResults([])
  }

  const handleRefresh = () => {
    if (selectedLocation) {
      fetchWeatherAndForecast(selectedLocation.latitude, selectedLocation.longitude, selectedLocation.name)
    }
  }

  const getWeatherCondition = (code) => {
    // WMO Weather interpretation codes
    if (!code) return 'Unknown'
    if (code === 0) return 'Clear sky'
    if (code === 1 || code === 2) return 'Partly cloudy'
    if (code === 3) return 'Overcast'
    if (code === 45 || code === 48) return 'Foggy'
    if (code >= 51 && code <= 67) return 'Drizzle'
    if (code >= 71 && code <= 77) return 'Snow'
    if (code >= 80 && code <= 82) return 'Rain showers'
    if (code >= 85 && code <= 86) return 'Snow showers'
    if (code >= 80 && code <= 82) return 'Thunderstorm'
    return 'Variable'
  }

  const getWeatherIcon = (code) => {
    if (!code) return '🌍'
    if (code === 0) return '☀️'
    if (code === 1 || code === 2) return '⛅'
    if (code === 3) return '☁️'
    if (code === 45 || code === 48) return '🌫️'
    if (code >= 51 && code <= 67) return '🌦️'
    if (code >= 71 && code <= 77) return '❄️'
    if (code >= 80 && code <= 82) return '🌧️'
    if (code >= 85 && code <= 86) return '🌨️'
    return '🌈'
  }

  const getAlertLevel = (code) => {
    if (!code) return 'neutral'
    if (code >= 71 && code <= 77) return 'danger' // Snow
    if (code >= 80 && code <= 82) return 'danger' // Rain showers
    if (code >= 80 && code <= 82) return 'danger' // Thunderstorm
    if (code === 45 || code === 48) return 'warning' // Fog
    if (code === 3) return 'warning' // Overcast
    return 'safe'
  }

  const alertColors = {
    danger: 'from-red-600 to-red-800',
    warning: 'from-yellow-600 to-yellow-800',
    safe: 'from-green-600 to-green-800',
    neutral: 'from-blue-600 to-blue-800'
  }

  const alertLevel = weather ? getAlertLevel(weather.weatherCode) : 'neutral'

  return (
    <div className="min-h-screen bg-gradient-to-br from-command-dark via-command-slate to-command-dark">
      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ x: [0, 50, 0], y: [0, 30, 0] }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute top-10 left-10 w-72 h-72 bg-command-cobalt/10 rounded-full blur-3xl"
        />
      </div>

      {/* Header */}
      <div className="sticky top-0 z-40 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => window.location.hash = '#/dashboard'}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-command-gold hover:bg-glass-bg transition-colors"
            >
              <ArrowLeft size={18} />
              Back
            </motion.button>
            <div>
              <h1 className="text-3xl font-bold text-white">🌤️ Weather & Forecast</h1>
              <p className="text-sm text-gray-400 mt-1">Live weather with accurate forecasts</p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleRefresh}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-command-gold/20 text-command-gold hover:bg-command-gold/30 transition-all disabled:opacity-50 font-semibold"
          >
            {loading ? 'Updating...' : 'Refresh'}
          </motion.button>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-20 max-w-7xl mx-auto px-4 py-8">
        {/* Location Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="relative">
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-glass-bg border border-glass-border focus-within:border-command-gold/50 focus-within:ring-1 focus-within:ring-command-gold/30 transition-all">
              <Search size={18} className="text-command-gold" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => handleLocationSearch(e.target.value)}
                placeholder="Search for a city or location..."
                className="flex-1 bg-transparent text-white placeholder-gray-500 outline-none"
              />
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute top-full left-0 right-0 mt-2 bg-glass-bg border border-glass-border rounded-xl backdrop-blur-xl overflow-hidden z-50"
              >
                {searchResults.map((result, idx) => (
                  <motion.button
                    key={idx}
                    onClick={() => selectLocation(result)}
                    whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                    className="w-full text-left px-4 py-3 border-b border-white/10 last:border-b-0 hover:bg-white/10 transition-colors"
                  >
                    <div className="text-white font-semibold">
                      <MapPin size={14} className="inline mr-2 text-command-gold" />
                      {result.name}
                    </div>
                    <div className="text-xs text-gray-400 ml-6">
                      {result.admin1 && `${result.admin1}, `}{result.country}
                    </div>
                  </motion.button>
                ))}
              </motion.div>
            )}
          </div>
          {selectedLocation && (
            <p className="text-sm text-gray-400 mt-2">📍 {selectedLocation.name}</p>
          )}
        </motion.div>

        {loading && !weather ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center py-32"
          >
            <div className="text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-16 h-16 border-4 border-command-gold border-t-transparent rounded-full mx-auto mb-4"
              />
              <p className="text-gray-400 text-lg">Fetching weather data...</p>
            </div>
          </motion.div>
        ) : error ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-8 rounded-2xl bg-red-500/20 border border-red-500/50 text-center"
          >
            <AlertTriangle className="mx-auto mb-4 text-red-400" size={40} />
            <p className="text-red-300 text-lg font-semibold">{error}</p>
          </motion.div>
        ) : weather ? (
          <div className="space-y-6">
            {/* Main Weather Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-8 rounded-3xl bg-gradient-to-br ${alertColors[alertLevel]} border border-white/20 backdrop-blur-xl`}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                {/* Left - Main Info */}
                <div className="flex flex-col items-center justify-center">
                  <div className="text-8xl mb-4">{getWeatherIcon(weather.weatherCode)}</div>
                  <div className="text-center">
                    <div className="text-7xl font-bold text-white mb-2">
                      {Math.round(weather.temperature)}°
                    </div>
                    <div className="text-2xl font-semibold text-white/90 mb-2">
                      {weather.condition}
                    </div>
                    <div className="text-base text-white/80">
                      Feels like {Math.round(weather.apparentTemp)}°C
                    </div>
                  </div>
                </div>

                {/* Right - Detailed Metrics */}
                <div className="grid grid-cols-2 gap-4">
                  <motion.div whileHover={{ scale: 1.05 }} className="p-6 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-lg text-center">
                    <Droplets className="mx-auto mb-2 text-blue-300" size={24} />
                    <div className="text-sm text-white/70 mb-2">Humidity</div>
                    <div className="text-3xl font-bold text-white">{weather.humidity}%</div>
                  </motion.div>

                  <motion.div whileHover={{ scale: 1.05 }} className="p-6 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-lg text-center">
                    <Wind className="mx-auto mb-2 text-cyan-300" size={24} />
                    <div className="text-sm text-white/70 mb-2">Wind Speed</div>
                    <div className="text-3xl font-bold text-white">{Math.round(weather.windSpeed)} km/h</div>
                  </motion.div>

                  <motion.div whileHover={{ scale: 1.05 }} className="p-6 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-lg text-center">
                    <Cloud className="mx-auto mb-2 text-gray-300" size={24} />
                    <div className="text-sm text-white/70 mb-2">Cloud Cover</div>
                    <div className="text-3xl font-bold text-white">{weather.cloudCover}%</div>
                  </motion.div>

                  <motion.div whileHover={{ scale: 1.05 }} className="p-6 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-lg text-center">
                    <Eye className="mx-auto mb-2 text-yellow-300" size={24} />
                    <div className="text-sm text-white/70 mb-2">Visibility</div>
                    <div className="text-3xl font-bold text-white">{Math.round(weather.visibility)} km</div>
                  </motion.div>
                </div>
              </div>
            </motion.div>

            {/* Alert if needed */}
            {alertLevel !== 'safe' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-6 rounded-2xl border backdrop-blur-xl ${
                  alertLevel === 'danger'
                    ? 'bg-red-500/20 border-red-500/50'
                    : 'bg-yellow-500/20 border-yellow-500/50'
                }`}
              >
                <div className="flex items-start gap-4">
                  <AlertTriangle className={alertLevel === 'danger' ? 'text-red-400' : 'text-yellow-400'} size={32} />
                  <div>
                    <h3 className={`text-xl font-bold mb-2 ${alertLevel === 'danger' ? 'text-red-300' : 'text-yellow-300'}`}>
                      ⚠️ Weather Alert
                    </h3>
                    <p className={`text-lg ${alertLevel === 'danger' ? 'text-red-200' : 'text-yellow-200'}`}>
                      {weather.raining && '🌧️ Rain detected'}
                      {weather.snowing && '❄️ Snow - Drive carefully'}
                      {weather.cloudCover > 80 && '☁️ Heavy cloud cover'}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* 7-Day Forecast */}
            {forecast && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 rounded-2xl bg-glass-bg border border-glass-border backdrop-blur-xl"
              >
                <h3 className="text-2xl font-bold text-white mb-6">📅 7-Day Forecast</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {forecast.slice(0, 7).map((day, idx) => (
                    <motion.div
                      key={idx}
                      whileHover={{ scale: 1.05 }}
                      className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-center"
                    >
                      <div className="text-sm text-gray-400 mb-2">
                        {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </div>
                      <div className="text-4xl mb-3">{getWeatherIcon(day.weatherCode)}</div>
                      <div className="text-sm text-gray-300 mb-3">{day.condition}</div>
                      <div className="flex justify-center gap-2 mb-3">
                        <div className="p-2 rounded-lg bg-red-500/20">
                          <div className="text-xs text-gray-400">Max</div>
                          <div className="text-lg font-bold text-white">{Math.round(day.maxTemp)}°</div>
                        </div>
                        <div className="p-2 rounded-lg bg-blue-500/20">
                          <div className="text-xs text-gray-400">Min</div>
                          <div className="text-lg font-bold text-white">{Math.round(day.minTemp)}°</div>
                        </div>
                      </div>
                      {day.precipitation > 0 && (
                        <div className="text-xs text-blue-300">
                          💧 {Math.round(day.precipitation)}mm
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Update Time */}
            <div className="text-center text-gray-500 text-sm mt-4">
              {lastUpdated && `Last updated: ${lastUpdated.toLocaleTimeString()}`}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}

