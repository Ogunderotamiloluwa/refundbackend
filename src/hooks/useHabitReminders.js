import { useEffect } from 'react'
import { useNotifications } from '../context/NotificationContext'
import { getWeatherAlerts } from '../services/weatherService'

export const useHabitReminders = (habits = []) => {
  const { addNotification } = useNotifications()

  useEffect(() => {
    if (!habits || habits.length === 0) return

    const checkHabits = async () => {
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
      const today = days[new Date().getDay() - 1 || 6]
      const now = new Date()

      for (const habit of habits) {
        // Check if habit is scheduled for today
        if (!habit.scheduleDays?.includes(today)) continue

        // Check if habit is incomplete
        if (habit.completed) continue

        const [habitHours, habitMinutes] = (habit.startTime || '09:00').split(':').map(Number)
        const habitTime = new Date()
        habitTime.setHours(habitHours, habitMinutes, 0, 0)

        const timeDiff = now - habitTime // Positive if overdue

        // Check weather only if habit has weather preferences
        let weatherAlerts = null
        if (habit.weatherPreferences && (habit.weatherPreferences.avoidRain || habit.weatherPreferences.avoidHotSun || habit.weatherPreferences.avoidSnow)) {
          try {
            const weather = await getWeatherAlerts()
            weatherAlerts = weather.alerts
          } catch (err) {
            console.error('Weather check failed:', err)
          }
        }

        // Send weather alert if conditions are bad
        if (weatherAlerts) {
          weatherAlerts.forEach(alert => {
            addNotification({
              type: alert.severity === 'alert' ? 'alert' : 'info',
              title: alert.title,
              message: alert.message,
              autoDismiss: false
            })
          })
          return // Don't send time reminder if weather is bad
        }

        // Send reminder if 15 minutes before
        if (timeDiff >= -15 * 60 * 1000 && timeDiff < -14 * 60 * 1000) {
          addNotification({
            type: 'info',
            title: '⏰ Habit Time Coming Up',
            message: `Boss, ${habit.name} starts in 15 minutes. Prepare yourself!`,
            autoDismiss: true
          })
        }

        // Send main reminder at habit time
        if (timeDiff >= 0 && timeDiff < 60 * 1000) {
          addNotification({
            type: 'alert',
            title: '🎯 Time For Your Habit!',
            message: `Boss, it's time for ${habit.name} (${habit.startTime}). Have you started? Don't skip this!`,
            autoDismiss: false
          })
        }

        // Send nag if overdue
        if (timeDiff >= 5 * 60 * 1000 && timeDiff < 6 * 60 * 1000) {
          addNotification({
            type: 'alert',
            title: '⏳ Boss, Come On!',
            message: `${habit.name} was supposed to start 5 minutes ago. You better get moving or mark it done.`,
            autoDismiss: false
          })
        }

        // Send heavy nag if 30+ minutes late
        if (timeDiff >= 30 * 60 * 1000 && timeDiff < 31 * 60 * 1000) {
          addNotification({
            type: 'alert',
            title: '🔥 SERIOUSLY?!',
            message: `${habit.name} is NOW 30 MINUTES LATE! This is not like you. Complete it right now or remove it.`,
            autoDismiss: false
          })
        }
      }
    }

    // Check immediately and then every minute
    checkHabits()
    const interval = setInterval(checkHabits, 60 * 1000)

    return () => clearInterval(interval)
  }, [habits, addNotification])
}
