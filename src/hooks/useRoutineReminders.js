import { useEffect } from 'react'
import { useNotifications } from '../context/NotificationContext'

const REMINDER_INTERVALS = {
  '10min': 10 * 60 * 1000,      // 10 minutes
  '5min': 5 * 60 * 1000,        // 5 minutes
  'onTime': 0,                   // exactly on time
  'after5min': 5 * 60 * 1000,   // 5 minutes after
  'after15min': 15 * 60 * 1000, // 15 minutes after
}

export const useRoutineReminders = (routines = []) => {
  const { addNotification } = useNotifications()

  useEffect(() => {
    if (!routines || routines.length === 0) return

    const checkRoutines = () => {
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
      const today = days[new Date().getDay() - 1 || 6]

      routines.forEach(routine => {
        if (!routine.repeatDays?.includes(today)) return

        const [routineHours, routineMinutes] = routine.time.split(':').map(Number)
        const now = new Date()
        const routineTime = new Date()
        routineTime.setHours(routineHours, routineMinutes, 0, 0)

        const timeDiff = now - routineTime // Positive if overdue

        // Send reminder if 5 minutes before
        if (timeDiff >= -5 * 60 * 1000 && timeDiff < -4 * 60 * 1000) {
          addNotification({
            type: 'info',
            title: '⏰ Routine Starting Soon',
            message: `${routine.name} starts in 5 minutes. Get ready, boss!`,
            autoDismiss: true
          })
        }

        // Send nag notification when time arrives
        if (timeDiff >= 0 && timeDiff < 60 * 1000 && !routine.completed) {
          addNotification({
            type: 'alert',
            title: '🚀 Time to Move, Boss!',
            message: `${routine.name} is happening NOW. Don't forget! ${routine.tasks?.length > 0 ? `You have ${routine.tasks.length} tasks to complete.` : ''}`,
            autoDismiss: false // Don't auto-dismiss, let user dismiss
          })
        }

        // Send persistent nag if overdue
        if (timeDiff >= 5 * 60 * 1000 && timeDiff < 20 * 60 * 1000 && !routine.completed) {
          addNotification({
            type: 'alert',
            title: '⏳ Boss, Come On!',
            message: `${routine.name} was supposed to start ${Math.round(timeDiff / 60 / 1000)} minutes ago. Don't let me down now.`,
            autoDismiss: false
          })
        }

        // Heavy reminder at 15+ minutes overdue
        if (timeDiff >= 20 * 60 * 1000 && timeDiff < 25 * 60 * 1000 && !routine.completed) {
          addNotification({
            type: 'alert',
            title: '🔥 SERIOUSLY?!',
            message: `${routine.name} is NOW ${Math.round(timeDiff / 60 / 1000)} MINUTES LATE! You're slipping. Complete it or remove it.`,
            autoDismiss: false
          })
        }
      })
    }

    // Check immediately
    checkRoutines()

    // Check every minute
    const interval = setInterval(checkRoutines, 60 * 1000)

    return () => clearInterval(interval)
  }, [routines, addNotification])
}
