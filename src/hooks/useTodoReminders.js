import { useEffect } from 'react'
import { useNotifications } from '../context/NotificationContext'
import { getWeatherAlerts } from '../services/weatherService'

export function useTodoReminders(todos, userLocation) {
  const { addNotification } = useNotifications()

  useEffect(() => {
    if (!todos || todos.length === 0) return

    const checkTodos = async () => {
      const now = new Date()

      for (const todo of todos) {
        if (todo.completed) continue

        const todoTime = new Date(todo.scheduledTime)
        const timeDiff = todoTime - now // milliseconds
        const minutesDiff = Math.floor(timeDiff / 60000)

        // 15 minutes before
        if (minutesDiff === 15 && minutesDiff > 0) {
          let message = `📋 "${todo.title}" starts in 15 minutes`
          if (todo.location) {
            message += ` at ${todo.location}`
          }

          // Check weather if high risk
          if (todo.riskLevel === 'high' && userLocation) {
            try {
              const weather = await getWeatherAlerts(userLocation.latitude, userLocation.longitude)
              if (weather.raining || weather.snowing) {
                message += ` ⚠️ Bad weather detected - check conditions!`
              }
            } catch (err) {
              console.log('Weather check error:', err)
            }
          }

          addNotification({
            type: 'warning',
            title: '⏰ Todo Reminder',
            message
          })
        }

        // At scheduled time
        if (Math.abs(minutesDiff) < 1 && minutesDiff >= -1) {
          let message = `🎯 Time for: "${todo.title}"`
          if (todo.location) {
            message += ` at ${todo.location}`
          }

          // Check traffic/dangers if high risk
          if (todo.riskLevel === 'high') {
            message += ` - Check traffic & weather before leaving!`
          }

          addNotification({
            type: 'success',
            title: '🚀 Now Time!',
            message
          })
        }

        // 5 minutes late
        if (minutesDiff === -5) {
          addNotification({
            type: 'alert',
            title: '⏳ Getting Late',
            message: `Boss! "${todo.title}" was supposed to start 5 minutes ago. Get moving!`
          })
        }

        // 30+ minutes late
        if (minutesDiff <= -30 && minutesDiff > -31) {
          addNotification({
            type: 'alert',
            title: '🔥 SERIOUSLY?!',
            message: `BOSS! "${todo.title}" is NOW 30+ MINUTES LATE! This is urgent!`
          })
        }
      }
    }

    const interval = setInterval(checkTodos, 60000) // Check every minute
    checkTodos() // Check immediately

    return () => clearInterval(interval)
  }, [todos, userLocation, addNotification])
}
