// Free weather API using Open-Meteo (no API key needed)
// Returns weather for user's location

const WEATHER_CACHE = {}
const CACHE_DURATION = 30 * 60 * 1000 // 30 minutes

export const getWeatherAlerts = async (lat = null, lon = null) => {
  try {
    // Try to get user's location if not provided
    if (!lat || !lon) {
      const coords = await getUserLocation()
      lat = coords.lat
      lon = coords.lon
    }

    // Check cache first
    const cacheKey = `${lat},${lon}`
    if (WEATHER_CACHE[cacheKey] && Date.now() - WEATHER_CACHE[cacheKey].timestamp < CACHE_DURATION) {
      return WEATHER_CACHE[cacheKey].data
    }

    // Fetch from Open-Meteo API (free, no key required)
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,precipitation,rain,showers,snowfall,cloud_cover,weather_code&temperature_unit=celsius&timezone=auto`
    )

    if (!response.ok) throw new Error('Weather API failed')

    const data = await response.json()
    const current = data.current

    // Cache the result
    WEATHER_CACHE[cacheKey] = {
      data: {
        temperature: current.temperature_2m,
        raining: current.precipitation > 0 || current.rain > 0 || current.showers > 0,
        cloudCover: current.cloud_cover,
        snowing: current.snowfall > 0,
        weatherCode: current.weather_code,
        rain: current.rain || 0,
      },
      timestamp: Date.now()
    }

    return WEATHER_CACHE[cacheKey].data
  } catch (err) {
    console.error('Weather fetch error:', err)
    // Return safe default if API fails
    return {
      temperature: null,
      raining: false,
      cloudCover: 0,
      snowing: false,
      weatherCode: null,
      error: true
    }
  }
}

export const getUserLocation = () => {
  return new Promise((resolve) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lon: position.coords.longitude
          })
        },
        () => {
          // Default to UTC if geolocation fails
          resolve({ lat: 0, lon: 0 })
        }
      )
    } else {
      resolve({ lat: 0, lon: 0 })
    }
  })
}

export const getWeatherAlert = (weather, habitPreferences = {}) => {
  const { avoidRain, avoidHotSun, avoidSnow } = habitPreferences

  if (weather.error) return null

  const alerts = []

  if (avoidRain && weather.raining) {
    const rainAmount = weather.rain > 0 ? weather.rain : 2
    alerts.push({
      type: 'weather',
      severity: 'warning',
      message: `Boss, it's raining (${rainAmount}mm). You're allergic to rain, so maybe reschedule your ${habitPreferences.name || 'activity'} today.`,
      title: '🌧️ Rainy Weather Alert'
    })
  }

  if (avoidHotSun && weather.cloudCover < 30 && weather.temperature > 28) {
    alerts.push({
      type: 'weather',
      severity: 'warning',
      message: `Boss, it's ${weather.temperature}°C and sunny. Too hot for outdoor activities. Stay hydrated or reschedule.`,
      title: '☀️ Hot Sun Alert'
    })
  }

  if (avoidSnow && weather.snowing) {
    alerts.push({
      type: 'weather',
      severity: 'alert',
      message: `Boss, it's snowing. That ${habitPreferences.name || 'activity'} isn't happening today. Stay safe inside.`,
      title: '❄️ Snowing Alert'
    })
  }

  return alerts.length > 0 ? alerts : null
}
