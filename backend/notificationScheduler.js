// Notification Scheduler - Schedule and send notifications using node-schedule
// To use: npm install node-schedule

const schedule = require('node-schedule');

class NotificationScheduler {
  constructor() {
    this.scheduledJobs = {};
    this.webpush = null;
    this.notificationSubscriptions = null;
  }

  /**
   * Set webpush and notification subscriptions references
   * Call this from controllers.js after initializing
   */
  initialize(webpush, notificationSubscriptions) {
    this.webpush = webpush;
    this.notificationSubscriptions = notificationSubscriptions;
    console.log('✅ NotificationScheduler initialized with webpush and subscriptions');
  }

  /**
   * Schedule a notification for a specific time
   * @param {string} userId - User ID
   * @param {string} type - Type: 'todo', 'habit', 'routine'
   * @param {object} item - The item to remind about
   * @param {Date} scheduleTime - When to send the notification
   */
  scheduleNotification(userId, type, item, scheduleTime) {
    const jobId = `${userId}-${type}-${item.id}`;

    // Cancel existing job if any
    if (this.scheduledJobs[jobId]) {
      this.scheduledJobs[jobId].cancel();
    }

    try {
      this.scheduledJobs[jobId] = schedule.scheduleJob(scheduleTime, () => {
        this.sendReminder(userId, type, item);
      });

      console.log(`📅 Scheduled ${type} reminder for ${jobId} at ${scheduleTime}`);
    } catch (error) {
      console.error(`❌ Failed to schedule notification for ${jobId}:`, error);
    }
  }

  /**
   * Send a reminder notification
   */
  async sendReminder(userId, type, item) {
    try {
      // Normalize userId to string to ensure proper matching
      const userIdStr = userId?.toString ? userId.toString() : userId;
      
      console.log('\n╔════════════════════════════════════════════════════════════');
      console.log('║ 🔔 NOTIFICATION SEND ATTEMPT');
      console.log(`║ User: ${userIdStr}`);
      console.log(`║ Type: ${type}`);
      console.log(`║ Item: ${item?.title || item?.name || item?.id}`);
      console.log('╚════════════════════════════════════════════════════════════');
      
      // Build informative title and body
      let title, body;
      
      if (type === 'todo') {
        title = `📋 Todo: ${item.title}`;
        body = `It's time! "${item.title}"${item.description ? '\n' + item.description : ''}\n\nTap to view and mark complete.`;
      } else if (type === 'habit') {
        title = `🎯 Habit Reminder: ${item.name}`;
        body = `Time for your ${item.frequency || 'daily'} habit: "${item.name}"\n\nDon't break the streak!`;
      } else if (type === 'routine') {
        title = `📅 Routine Time: ${item.name}`;
        body = `Your routine "${item.name}" is scheduled now\n\nTap to view details.`;
      } else {
        title = 'Personal Assistant Reminder';
        body = 'You have a reminder waiting for you';
      }

      console.log(`║ Title: ${title}`);
      console.log(`║ Body: ${body}`);

      // Send via push notifications if available
      if (!this.webpush) {
        console.error('❌ WebPush NOT initialized!');
        return;
      }
      
      if (!this.notificationSubscriptions) {
        console.error('❌ notificationSubscriptions NOT available!');
        return;
      }
      
      // Get subscriptions for this specific user (must match exactly)
      const userSubscriptions = this.notificationSubscriptions[userIdStr] || [];
      
      console.log(`║ Subscriptions found for user: ${userSubscriptions.length}`);
      console.log(`║ Available user IDs: ${Object.keys(this.notificationSubscriptions)}`);
      
      if (userSubscriptions.length === 0) {
        console.warn(`⚠️ NO subscriptions for user ${userIdStr}`);
        console.warn(`⚠️ Notification will NOT be sent`);
        return;
      }

      const notificationPayload = JSON.stringify({
        title: title,
        body: body,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: `${type}-${item.id}`,
        data: {
          type: type,
          itemId: item.id,
          itemTitle: item.title || item.name,
          timestamp: new Date().toISOString()
        },
        actions: [
          { action: 'open', title: '📖 View' },
          { action: 'dismiss', title: '✖️ Dismiss' }
        ],
        requireInteraction: true
      });

      console.log(`📤 Sending push notification to ${userSubscriptions.length} subscription(s)`);
      console.log(`📊 Full Payload string: "${notificationPayload}"`);
      console.log(`📊 Payload length: ${notificationPayload.length} bytes`);
      
      // Send with options
      const sendOptions = {
        TTL: 24 * 60 * 60, // 24 hours
        urgency: 'high'
      };
      
      for (const subscription of userSubscriptions) {
        console.log(`🚀 Calling webpush.sendNotification with payload...`);
        this.webpush.sendNotification(subscription, notificationPayload, sendOptions)
          .then(() => {
            console.log(`✅ Push notification sent successfully for ${type} ${item.id}`);
            console.log(`   Subscription endpoint: ${subscription.endpoint.substring(0, 50)}...`);
          })
          .catch(error => {
            console.error(`❌ Failed to send push notification:`, error.message);
            console.error(`   Error code: ${error.statusCode}`);
            console.error(`   Full error:`, error);
            // If subscription is invalid, remove it
            if (error.statusCode === 410) {
              const index = userSubscriptions.indexOf(subscription);
              if (index > -1) {
                userSubscriptions.splice(index, 1);
                console.log(`🗑️ Removed invalid subscription`);
              }
            }
          });
      }
    } catch (error) {
      console.error(`❌ Failed to send reminder for ${type} ${item.id}:`, error);
    }
  }

  /**
   * Schedule daily reminders for habits
   */
  scheduleDailyHabitReminders(habits, userId) {
    habits
      .filter(h => h.userId === userId && h.isActive !== false)
      .forEach(habit => {
        if (habit.startTime) {
          const [hours, minutes] = habit.startTime.split(':').map(Number);
          
          // Schedule for every day
          const rule = new schedule.RecurrenceRule();
          rule.hour = hours;
          rule.minute = minutes;

          const jobId = `daily-habit-${userId}-${habit.id}`;

          if (this.scheduledJobs[jobId]) {
            this.scheduledJobs[jobId].cancel();
          }

          this.scheduledJobs[jobId] = schedule.scheduleJob(rule, () => {
            this.sendReminder(userId, 'habit', habit);
          });

          console.log(`⏰ Scheduled daily habit reminder for ${habit.name} at ${habit.startTime}`);
        }
      });
  }

  /**
   * Schedule routine reminders on specific days
   */
  scheduleRoutineReminders(routines, userId) {
    routines
      .filter(r => r.userId === userId)
      .forEach(routine => {
        if (routine.time && routine.repeatDays) {
          const [hours, minutes] = routine.time.split(':').map(Number);
          routine.repeatDays.forEach(day => {
            const dayIndex = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].indexOf(day);
            
            const rule = new schedule.RecurrenceRule();
            rule.dayOfWeek = dayIndex;
            rule.hour = hours;
            rule.minute = minutes;

            const jobId = `routine-${userId}-${routine.id}-${day}`;

            if (this.scheduledJobs[jobId]) {
              this.scheduledJobs[jobId].cancel();
            }

            this.scheduledJobs[jobId] = schedule.scheduleJob(rule, () => {
              this.sendReminder(userId, 'routine', routine);
            });

            console.log(`⏰ Scheduled ${day} routine reminder for ${routine.name} at ${routine.time}`);
          });
        }
      });
  }

  /**
   * Schedule one-time todo reminders
   */
  scheduleTodoReminders(todos, userId) {
    todos
      .filter(t => t.userId === userId && !t.completed)
      .forEach(todo => {
        if (todo.scheduledTime) {
          try {
            const scheduleTime = new Date(todo.scheduledTime);
            
            // Only schedule if time is in the future
            if (scheduleTime > new Date()) {
              const jobId = `todo-${userId}-${todo.id}`;

              if (this.scheduledJobs[jobId]) {
                this.scheduledJobs[jobId].cancel();
              }

              this.scheduledJobs[jobId] = schedule.scheduleJob(scheduleTime, () => {
                this.sendReminder(userId, 'todo', todo);
              });

              console.log(`⏰ Scheduled todo reminder for ${todo.title} at ${scheduleTime}`);
            }
          } catch (error) {
            console.error(`Error scheduling todo ${todo.id}:`, error);
          }
        }
      });
  }

  /**
   * Cancel a specific scheduled job
   */
  cancelNotification(userId, type, itemId) {
    const jobId = `${userId}-${type}-${itemId}`;
    if (this.scheduledJobs[jobId]) {
      this.scheduledJobs[jobId].cancel();
      delete this.scheduledJobs[jobId];
      console.log(`❌ Cancelled notification: ${jobId}`);
      return true;
    }
    return false;
  }

  /**
   * Cancel all scheduled jobs for a user
   */
  cancelUserJobs(userId) {
    Object.keys(this.scheduledJobs).forEach(jobId => {
      if (jobId.includes(userId)) {
        this.scheduledJobs[jobId].cancel();
        delete this.scheduledJobs[jobId];
        console.log(`❌ Cancelled job: ${jobId}`);
      }
    });
  }

  /**
   * Get all scheduled jobs
   */
  getScheduledJobs() {
    return Object.keys(this.scheduledJobs).length;
  }

  /**
   * Print scheduled jobs (debug)
   */
  listScheduledJobs() {
    console.log('📅 Scheduled Jobs:');
    Object.keys(this.scheduledJobs).forEach(jobId => {
      console.log(`  • ${jobId}`);
    });
  }

  /**
   * Reload all scheduled notifications from database on server startup
   * This ensures notifications persist across server restarts
   */
  async reloadScheduledNotifications(Habit, Routine, Todo) {
    try {
      console.log('🔄 Reloading scheduled notifications from database...');
      const now = new Date();
      
      // Load all habits and schedule reminders
      const habits = await Habit.find({ isActive: true }).catch(() => []);
      console.log(`📥 Loaded ${habits.length} active habits from MongoDB`);
      
      const habitsByUser = {};
      habits.forEach(habit => {
        const userId = habit.userId?.toString() || habit.userId;
        if (!habitsByUser[userId]) habitsByUser[userId] = [];
        const habitObj = habit.toObject ? habit.toObject() : habit;
        habitsByUser[userId].push(habitObj);
        
        // CRITICAL: Check if habit has a future scheduledTime and schedule that instead of daily
        if (habitObj.scheduledTime) {
          const scheduledDate = new Date(habitObj.scheduledTime);
          if (scheduledDate > now) {
            console.log(`⏰ Habit "${habitObj.name}" has future scheduledTime: ${scheduledDate}`);
            this.scheduleNotification(
              userId,
              'habit',
              { ...habitObj, id: habitObj._id?.toString() || habitObj.id },
              scheduledDate
            );
          }
        }
      });
      
      // Schedule daily habits that don't have a specific scheduledTime
      Object.entries(habitsByUser).forEach(([userId, userHabits]) => {
        const habitsWithoutScheduledTime = userHabits.filter(h => !h.scheduledTime || new Date(h.scheduledTime) <= now);
        if (habitsWithoutScheduledTime.length > 0) {
          console.log(`⏰ Scheduling ${habitsWithoutScheduledTime.length} daily habit reminders for user ${userId}`);
          this.scheduleDailyHabitReminders(habitsWithoutScheduledTime, userId);
        }
      });

      // Load all routines and schedule reminders
      const routines = await Routine.find({}).catch(() => []);
      console.log(`📥 Loaded ${routines.length} routines from MongoDB`);
      
      const routinesByUser = {};
      routines.forEach(routine => {
        const userId = routine.userId?.toString() || routine.userId;
        if (!routinesByUser[userId]) routinesByUser[userId] = [];
        const routineObj = routine.toObject ? routine.toObject() : routine;
        routinesByUser[userId].push(routineObj);
        
        // CRITICAL: Check if routine has a future scheduledTime and schedule that instead of recurring
        if (routineObj.scheduledTime) {
          const scheduledDate = new Date(routineObj.scheduledTime);
          if (scheduledDate > now) {
            console.log(`⏰ Routine "${routineObj.name}" has future scheduledTime: ${scheduledDate}`);
            this.scheduleNotification(
              userId,
              'routine',
              { ...routineObj, id: routineObj._id?.toString() || routineObj.id },
              scheduledDate
            );
          }
        }
      });
      
      // Schedule recurring routines that don't have a specific scheduledTime
      Object.entries(routinesByUser).forEach(([userId, userRoutines]) => {
        const routinesWithoutScheduledTime = userRoutines.filter(r => !r.scheduledTime || new Date(r.scheduledTime) <= now);
        if (routinesWithoutScheduledTime.length > 0) {
          console.log(`⏰ Scheduling ${routinesWithoutScheduledTime.length} routine reminders for user ${userId}`);
          this.scheduleRoutineReminders(routinesWithoutScheduledTime, userId);
        }
      });

      // Load todos with future due dates and schedule them
      const todos = await Todo.find({ 
        dueDate: { $gt: now },
        completed: false
      }).catch(() => []);
      console.log(`📥 Loaded ${todos.length} pending todos from MongoDB`);
      
      todos.forEach(todo => {
        const dueDate = new Date(todo.dueDate);
        if (dueDate > now) {
          const todoObj = todo.toObject ? todo.toObject() : todo;
          this.scheduleNotification(
            todo.userId?.toString() || todo.userId,
            'todo',
            { ...todoObj, id: todoObj._id?.toString() || todoObj.id },
            dueDate
          );
        }
      });

      const totalJobs = Object.keys(this.scheduledJobs).length;
      console.log(`\n✅ Notification reload complete: ${totalJobs} total jobs scheduled`);
      
    } catch (error) {
      console.error('❌ Failed to reload scheduled notifications:', error.message);
    }
  }
}

module.exports = new NotificationScheduler();
