// Persistent storage import
const storage = require('./storage')
const { User, Habit, Routine, Todo, HabitCompletion, isConnected } = require('./db')
const webpush = require('web-push')

// Configure web-push with VAPID keys
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(
    'mailto:support@personalassistant.app',
    vapidPublicKey,
    vapidPrivateKey
  )
  console.log('✅ Web Push configured with VAPID keys')
} else {
  console.warn('⚠️ VAPID keys not configured - push notifications will not work')
}

// Initialize storage
storage.init()

// In-memory caching (will be loaded from persistent storage)
let users = []
let habits = []
let routines = []
let todos = []
let suggestions = []
let habitCompletions = []
let notificationSubscriptions = {} // Declare before use in loadAllData()

// Load all data from persistent storage
function loadAllData() {
  habits = storage.getHabits()
  routines = storage.getRoutines()
  todos = storage.getTodos()
  habitCompletions = storage.getHabitCompletions()
  // Load subscriptions from persistent storage
  const subscriptionsData = storage.getSubscriptions()
  notificationSubscriptions = {}
  subscriptionsData.forEach(item => {
    if (item.userId && item.subscriptions) {
      notificationSubscriptions[item.userId] = item.subscriptions
    }
  })
  console.log('✅ Loaded notification subscriptions from storage')
}

// Call load on startup
loadAllData()

// Require LLM service for on-demand suggestions
const llmService = require('./llmService')

// Helper function to save subscriptions to persistent storage
const saveSubscriptions = () => {
  try {
    const subscriptionsData = Object.entries(notificationSubscriptions).map(([userId, subscriptions]) => ({
      userId,
      subscriptions
    }))
    storage.setSubscriptions(subscriptionsData)
  } catch (error) {
    console.error('❌ Failed to save subscriptions:', error.message)
  }
}

// Helper function to calculate habit progress
const calculateHabitProgress = (habitId, userId) => {
  const today = new Date().toDateString();
  const thisWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toDateString();
  const thisMonth = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toDateString();
  
  const completions = habitCompletions.filter(c => c.habitId === habitId && c.userId === userId);
  const todayCompletion = completions.filter(c => new Date(c.completedAt).toDateString() === today).length;
  const weeklyCompletion = completions.filter(c => new Date(c.completedAt) >= new Date(thisWeek)).length;
  const monthlyCompletion = completions.filter(c => new Date(c.completedAt) >= new Date(thisMonth)).length;
  
  // Calculate streak
  let streak = 0;
  let currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);
  
  while (completions.some(c => new Date(c.completedAt).toDateString() === currentDate.toDateString())) {
    streak++;
    currentDate.setDate(currentDate.getDate() - 1);
  }
  
  return {
    todayComplete: todayCompletion > 0,
    weeklyCompletion,
    monthlyCompletion,
    totalCompletion: completions.length,
    streak,
    lastCompletedAt: completions.length > 0 ? new Date(completions[completions.length - 1].completedAt) : null
  };
};

// Helper function to calculate progress percentage
const getProgressPercentage = (habitId, userId, target = 30) => {
  const completions = habitCompletions.filter(c => c.habitId === habitId && c.userId === userId);
  return Math.min(Math.round((completions.length / target) * 100), 100);
};

// User Controller
const getUserProfile = async (req, res) => {
  try {
    const userId = req.userId;
    const userEmail = req.userEmail;
    
    console.log('📋 Fetching user profile for:', userEmail);
    
    // Try MongoDB first
    if (isConnected && isConnected()) {
      try {
        const user = await User.findById(userId).select('-password').maxTimeMS(5000);
        if (user) {
          console.log('✅ User profile fetched from MongoDB');
          return res.json({ 
            message: 'User profile retrieved',
            user: user.toObject()
          });
        }
      } catch (err) {
        console.log('⚠️ MongoDB fetch failed, using fallback:', err.message);
      }
    }
    
    // Fallback to file storage
    console.log('📂 Fetching user profile from file storage');
    const fileUser = users.find(u => u.email === userEmail) || {
      id: userId,
      name: 'Boss User',
      email: userEmail,
      timezone: 'UTC',
      preferences: {
        theme: 'dark',
        notifications: true,
        notificationTime: '09:00'
      }
    };
    
    res.json({ 
      message: 'User profile retrieved',
      user: fileUser
    });
  } catch (err) {
    console.error('❌ Error fetching user profile:', err);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
};

const updateUserProfile = (req, res) => {
  const userId = req.userId;
  const { name, timezone, preferences } = req.body;
  
  let user = users.find(u => u.id === userId);
  if (!user) {
    user = {
      id: userId,
      email: req.userEmail,
      name: name || 'Boss User',
      timezone: timezone || 'UTC',
      preferences: preferences || {}
    };
    users.push(user);
  } else {
    if (name) user.name = name;
    if (timezone) user.timezone = timezone;
    if (preferences) user.preferences = { ...user.preferences, ...preferences };
  }
  
  res.json({ 
    message: 'User profile updated',
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      timezone: user.timezone,
      preferences: user.preferences
    }
  });
};

// Habit Controller
const getHabits = async (req, res) => {
  try {
    const userId = req.userId;
    console.log('[HABITS] Fetching habits for user:', userId);
    
    // Try MongoDB first
    if (isConnected && isConnected()) {
      try {
        const mongoHabits = await Habit.find({ userId }).maxTimeMS(5000);
        if (mongoHabits && mongoHabits.length > 0) {
          console.log('[HABITS] Fetched from MongoDB:', mongoHabits.length, 'habits');
          return res.json({ 
            message: 'Habits retrieved', 
            habits: mongoHabits.map(h => ({
              ...h.toObject ? h.toObject() : h,
              completed: h.completed || false,
              streak: h.streak || 0
            }))
          });
        }
      } catch (err) {
        console.log('[HABITS] MongoDB unavailable, using file storage:', err.message);
      }
    }
    
    // Fallback to file storage
    console.log('[HABITS] Fetching from file storage');
    const userHabits = habits.filter(h => h.userId === userId).map(h => ({
      ...h,
      completed: h.completed || false,
      streak: h.streak || 0
    }));
    res.json({ 
      message: 'Habits retrieved', 
      habits: userHabits
    });
  } catch (err) {
    console.error('❌ Error fetching habits:', err);
    res.status(500).json({ error: 'Failed to fetch habits' });
  }
};

const createHabit = async (req, res) => {
  try {
    const { name, description, frequency, icon, color, category } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Habit name is required' });
    }

    console.log('✏️ Creating new habit:', name);
    
    const habitData = {
      userId: req.userId,
      name,
      description: description || '',
      frequency: frequency || 'daily',
      color: color || '#d4af37',
      category: category || 'Other'
    };
    
    // Try MongoDB first
    if (isConnected && isConnected()) {
      try {
        const newHabit = new Habit(habitData);
        const saved = await newHabit.save();
        console.log('✅ Habit saved to MongoDB');
        return res.status(201).json({ 
          message: 'Habit created', 
          habit: saved
        });
      } catch (err) {
        console.log('⚠️ MongoDB save failed, using file storage:', err.message);
      }
    }
    
    // Fallback to file storage
    console.log('💾 Saving habit to file storage');
    const habit = {
      id: Date.now(),
      ...habitData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    habits.push(habit);
    storage.setHabits(habits);
    res.status(201).json({ 
      message: 'Habit created', 
      habit: {
        ...habit,
        progress: 0,
        streak: 0,
        completed: false,
        lastCompleted: null
      }
    });
  } catch (err) {
    console.error('❌ Error creating habit:', err);
    res.status(500).json({ error: 'Failed to create habit' });
  }
};

const updateHabit = (req, res) => {
  const { id } = req.params;
  const { name, description, frequency, status, startTime, endTime, scheduleDays, category, weatherPreferences } = req.body;
  
  const habit = habits.find(h => h.id === parseInt(id) && h.userId === req.userId);
  if (!habit) {
    return res.status(404).json({ error: 'Habit not found' });
  }

  if (scheduleDays && Array.isArray(scheduleDays) && scheduleDays.length === 0) {
    return res.status(400).json({ error: 'At least one day must be selected' });
  }
  
  if (name) habit.name = name;
  if (description) habit.description = description;
  if (frequency) habit.frequency = frequency;
  if (status) habit.status = status;
  if (startTime) habit.startTime = startTime;
  if (endTime) habit.endTime = endTime;
  if (scheduleDays) habit.scheduleDays = scheduleDays;
  if (category) habit.category = category;
  if (weatherPreferences) habit.weatherPreferences = weatherPreferences;

  habit.updatedAt = new Date().toISOString();
  storage.setHabits(habits); // Persist to storage
  
  res.json({ 
    message: 'Habit updated', 
    habit 
  });
};

const deleteHabit = (req, res) => {
  const { id } = req.params;
  const index = habits.findIndex(h => h.id === parseInt(id) && h.userId === req.userId);
  
  if (index === -1) {
    return res.status(404).json({ error: 'Habit not found' });
  }
  
  habits.splice(index, 1);
  storage.setHabits(habits); // Persist to storage
  res.json({ message: 'Habit deleted' });
};

const completeHabit = (req, res) => {
  const { id } = req.params;
  const habit = habits.find(h => h.id === parseInt(id) && h.userId === req.userId);
  
  if (!habit) {
    return res.status(404).json({ error: 'Habit not found' });
  }
  
  const completion = {
    id: Date.now(),
    habitId: parseInt(id),
    userId: req.userId,
    completedAt: new Date().toISOString(),
    notes: req.body.notes || ''
  };
  
  habitCompletions.push(completion);
  storage.setHabitCompletions(habitCompletions); // Persist to storage
  
  const progress = calculateHabitProgress(parseInt(id), req.userId);
  
  // Send push notification
  (async () => {
    try {
      const userSubscriptions = notificationSubscriptions[req.userId] || [];
      if (userSubscriptions.length > 0) {
        const notificationPayload = JSON.stringify({
          title: 'Habit Completed',
          body: `${habit.name} marked complete. Keep the streak alive!`,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: 'habit-complete',
          data: {
            type: 'habit-complete',
            habitId: parseInt(id),
            timestamp: new Date().toISOString()
          },
          actions: [
            { action: 'open', title: 'View Habits' }
          ]
        });

        for (const subscription of userSubscriptions) {
          webpush.sendNotification(subscription, notificationPayload).catch(error => {
            console.error('[PUSH] Failed to send habit completion notification:', error.message);
          });
        }
      }
    } catch (error) {
      console.error('[PUSH] Error sending habit notification:', error);
    }
  })();
  
  res.json({ 
    message: 'Habit marked complete',
    completion,
    streak: progress.streak,
    progress: getProgressPercentage(parseInt(id), req.userId)
  });
};

// New Controllers for detailed tracking
const getHabitDetails = (req, res) => {
  const { id } = req.params;
  const habit = habits.find(h => h.id === parseInt(id) && h.userId === req.userId);
  
  if (!habit) {
    return res.status(404).json({ error: 'Habit not found' });
  }
  
  const progress = calculateHabitProgress(parseInt(id), req.userId);
  
  res.json({
    message: 'Habit details retrieved',
    habit: {
      ...habit,
      progress: getProgressPercentage(parseInt(id), req.userId),
      streak: progress.streak,
      completed: progress.todayComplete,
      lastCompleted: progress.lastCompletedAt,
      weeklyCompletion: progress.weeklyCompletion,
      monthlyCompletion: progress.monthlyCompletion
    }
  });
};

const getHabitHistory = (req, res) => {
  const { id } = req.params;
  const history = habitCompletions.filter(c => c.habitId === parseInt(id) && c.userId === req.userId);
  
  res.json({
    message: 'Habit history retrieved',
    history: history.sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
  });
};

const getHabitStats = (req, res) => {
  const { id } = req.params;
  const habit = habits.find(h => h.id === parseInt(id) && h.userId === req.userId);
  
  if (!habit) {
    return res.status(404).json({ error: 'Habit not found' });
  }
  
  const progress = calculateHabitProgress(parseInt(id), req.userId);
  const completions = habitCompletions.filter(c => c.habitId === parseInt(id) && c.userId === req.userId);
  
  res.json({
    message: 'Habit stats retrieved',
    stats: {
      habitName: habit.name,
      totalCompletions: progress.totalCompletion,
      currentStreak: progress.streak,
      weeklyCompletion: progress.weeklyCompletion,
      monthlyCompletion: progress.monthlyCompletion,
      completionPercentage: getProgressPercentage(parseInt(id), req.userId),
      lastCompletedAt: progress.lastCompletedAt,
      createdAt: habit.createdAt
    }
  });
};

// Routine Controller
const getRoutines = async (req, res) => {
  try {
    const userId = req.userId;
    console.log('📅 Fetching routines for user:', userId);
    
    // Try MongoDB first
    if (isConnected && isConnected()) {
      try {
        const mongoRoutines = await Routine.find({ userId }).maxTimeMS(5000);
        if (mongoRoutines && mongoRoutines.length > 0) {
          console.log('✅ Fetched', mongoRoutines.length, 'routines from MongoDB');
          return res.json({ 
            message: 'Routines retrieved', 
            routines: mongoRoutines
          });
        }
      } catch (err) {
        console.log('⚠️ MongoDB fetch failed, using file storage:', err.message);
      }
    }
    
    // Fallback to file storage
    console.log('📂 Fetching routines from file storage');
    const userRoutines = routines.filter(r => r.userId === userId);
    res.json({ 
      message: 'Routines retrieved', 
      routines: userRoutines
    });
  } catch (err) {
    console.error('❌ Error fetching routines:', err);
    res.status(500).json({ error: 'Failed to fetch routines' });
  }
};

const createRoutine = async (req, res) => {
  try {
    const { name, description, time, tasks, duration } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Routine name is required' });
    }

    console.log('✏️ Creating new routine:', name);

    const routineData = {
      userId: req.userId,
      name,
      description: description || '',
      time: time || '09:00',
      duration: duration || 30,
      tasks: tasks || [],
      active: true
    };
    
    // Try MongoDB first
    if (isConnected && isConnected()) {
      try {
        const newRoutine = new Routine(routineData);
        const saved = await newRoutine.save();
        console.log('✅ Routine saved to MongoDB');
        return res.status(201).json({ 
          message: 'Routine created', 
          routine: saved 
        });
      } catch (err) {
        console.log('⚠️ MongoDB save failed, using file storage:', err.message);
      }
    }

    // Fallback to file storage
    console.log('💾 Saving routine to file storage');
    const routine = {
      id: Date.now(),
      ...routineData,
      createdAt: new Date().toISOString()
    };
    
    routines.push(routine);
    storage.setRoutines(routines);
    res.status(201).json({ 
      message: 'Routine created', 
      routine 
    });
  } catch (err) {
    console.error('❌ Error creating routine:', err);
    res.status(500).json({ error: 'Failed to create routine' });
  }
};

const updateRoutine = (req, res) => {
  const { id } = req.params;
  const { name, time, tasks, repeatDays } = req.body;
  
  const routine = routines.find(r => r.id === parseInt(id) && r.userId === req.userId);
  if (!routine) {
    return res.status(404).json({ error: 'Routine not found' });
  }
  
  if (name) routine.name = name;
  if (time) routine.time = time;
  if (tasks) routine.tasks = tasks;
  if (repeatDays) routine.repeatDays = repeatDays;
  storage.setRoutines(routines); // Persist to storage
  
  res.json({ 
    message: 'Routine updated', 
    routine 
  });
};

const deleteRoutine = (req, res) => {
  const { id } = req.params;
  const index = routines.findIndex(r => r.id === parseInt(id) && r.userId === req.userId);
  
  if (index === -1) {
    return res.status(404).json({ error: 'Routine not found' });
  }
  
  routines.splice(index, 1);
  storage.setRoutines(routines); // Persist to storage
  res.json({ message: 'Routine deleted' });
};

// Todo Controller
const getTodos = async (req, res) => {
  try {
    const userId = req.userId;
    console.log('📝 Fetching todos for user:', userId);
    
    // Try MongoDB first
    if (isConnected && isConnected()) {
      try {
        const mongoTodos = await Todo.find({ userId }).maxTimeMS(5000);
        if (mongoTodos) {
          console.log('✅ Fetched', mongoTodos.length, 'todos from MongoDB');
          // Transform MongoDB docs: map _id to id for frontend compatibility
          const transformedTodos = mongoTodos.map(todo => ({
            ...todo.toObject ? todo.toObject() : todo,
            id: todo._id.toString() // Use string ID from MongoDB
          }));
          return res.json({ 
            message: 'Todos retrieved', 
            todos: transformedTodos
          });
        }
      } catch (err) {
        console.log('⚠️ MongoDB fetch failed, using file storage:', err.message);
      }
    }
    
    // Fallback to file storage
    console.log('📂 Fetching todos from file storage');
    const userTodos = todos.filter(t => t.userId === userId).map(todo => {
      const transformed = {
        ...todo,
        // Ensure id field exists
        id: todo.id || todo._id?.toString() || Date.now(),
        // Migrate old field names to new format for backward compatibility
        scheduledTime: todo.scheduledTime || (todo.dueDate && todo.dueTime ? new Date(`${todo.dueDate} ${todo.dueTime}`).toISOString() : new Date().toISOString()),
        riskLevel: todo.riskLevel || (todo.priority ? (todo.priority === 'high' ? 'high' : todo.priority === 'low' ? 'low' : 'medium') : 'low'),
        location: todo.location || todo.category || ''
      };
      console.log('📌 Todo mapped:', transformed.id, transformed.title);
      return transformed;
    });
    console.log('📊 Returning', userTodos.length, 'todos from file storage');
    res.json({ 
      message: 'Todos retrieved',
      todos: userTodos
    });
  } catch (err) {
    console.error('❌ Error fetching todos:', err);
    res.status(500).json({ error: 'Failed to fetch todos' });
  }
};

const createTodo = async (req, res) => {
  try {
    const { title, description, scheduledTime, location, riskLevel } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    console.log('✏️ Creating new todo:', title);

    const todoData = {
      userId: req.userId,
      title,
      description: description || '',
      scheduledTime: scheduledTime ? new Date(scheduledTime).toISOString() : new Date().toISOString(),
      location: location || '',
      riskLevel: riskLevel || 'low',
      completed: false
    };
    
    // Try MongoDB first
    if (isConnected && isConnected()) {
      try {
        const newTodo = new Todo(todoData);
        const saved = await newTodo.save();
        console.log('✅ Todo saved to MongoDB');
        return res.status(201).json({
          message: 'Todo created',
          todo: {
            ...saved.toObject?.() || saved,
            id: saved._id?.toString() || saved._id
          }
        });
      } catch (err) {
        console.log('⚠️ MongoDB save failed, using file storage:', err.message);
      }
    }

    // Fallback to file storage
    console.log('💾 Saving todo to file storage');
    const todo = {
      id: Date.now(),
      ...todoData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    todos.push(todo);
    const saved = storage.setTodos(todos);
    if (!saved) {
      console.error('❌ Failed to save todo to file storage');
      return res.status(500).json({ error: 'Failed to save todo' });
    }
    console.log('✅ Todo saved to file storage with id:', todo.id);
    res.status(201).json({
      message: 'Todo created',
      todo
    });
  } catch (err) {
    console.error('❌ Error creating todo:', err);
    res.status(500).json({ error: 'Failed to create todo' });
  }
};

const updateTodo = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const { title, description, scheduledTime, location, riskLevel } = req.body;

    // Try MongoDB first
    if (isConnected && isConnected()) {
      try {
        const todo = await Todo.findById(id);
        if (todo && todo.userId === userId) {
          if (title) todo.title = title;
          if (description) todo.description = description;
          if (scheduledTime) todo.scheduledTime = new Date(scheduledTime).toISOString();
          if (location) todo.location = location;
          if (riskLevel) todo.riskLevel = riskLevel;
          todo.updatedAt = new Date().toISOString();
          
          const saved = await todo.save();
          console.log('✅ Todo updated in MongoDB');
          return res.json({
            message: 'Todo updated',
            todo: {
              ...saved.toObject?.() || saved,
              id: saved._id.toString()
            }
          });
        }
      } catch (err) {
        console.log('⚠️ MongoDB update failed, trying file storage:', err.message);
      }
    }

    // Fallback to file storage (handle both numeric and string IDs)
    const numericId = parseInt(id);
    const todo = todos.find(t => (t.id === numericId || t.id === id) && t.userId === userId);
    if (!todo) {
      return res.status(404).json({ error: 'Todo not found' });
    }

    if (title) todo.title = title;
    if (description) todo.description = description;
    if (scheduledTime) todo.scheduledTime = new Date(scheduledTime).toISOString();
    if (location) todo.location = location;
    if (riskLevel) todo.riskLevel = riskLevel;

    todo.updatedAt = new Date().toISOString();
    storage.setTodos(todos);
    console.log('✅ Todo updated in file storage');

    res.json({
      message: 'Todo updated',
      todo
    });
  } catch (err) {
    console.error('❌ Error updating todo:', err);
    res.status(500).json({ error: 'Failed to update todo' });
  }
};

const completeTodo = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    // Try MongoDB first
    if (isConnected && isConnected()) {
      try {
        const todo = await Todo.findById(id);
        if (todo && todo.userId === userId) {
          todo.completed = true;
          todo.completedAt = new Date().toISOString();
          todo.updatedAt = new Date().toISOString();
          const saved = await todo.save();
          console.log('✅ Todo completed in MongoDB');

          // Send push notification
          (async () => {
            try {
              const userSubscriptions = notificationSubscriptions[userId] || [];
              if (userSubscriptions.length > 0) {
                const notificationPayload = JSON.stringify({
                  title: 'Todo Completed',
                  body: `${todo.title} done. One less thing to worry about.`,
                  icon: '/favicon.ico',
                  badge: '/favicon.ico',
                  tag: 'todo-complete',
                  data: {
                    type: 'todo-complete',
                    todoId: id,
                    timestamp: new Date().toISOString()
                  },
                  actions: [
                    { action: 'open', title: 'View Todos' }
                  ]
                });

                for (const subscription of userSubscriptions) {
                  webpush.sendNotification(subscription, notificationPayload).catch(error => {
                    console.error('[PUSH] Failed to send todo completion notification:', error.message);
                  });
                }
              }
            } catch (error) {
              console.error('[PUSH] Error sending todo notification:', error);
            }
          })();

          return res.json({
            message: 'Todo completed',
            todo: {
              ...saved.toObject?.() || saved,
              id: saved._id.toString()
            }
          });
        }
      } catch (err) {
        console.log('⚠️ MongoDB completion failed, trying file storage:', err.message);
      }
    }

    // Fallback to file storage (handle both numeric and string IDs)
    const numericId = parseInt(id);
    const todo = todos.find(t => (t.id === numericId || t.id === id) && t.userId === userId);
    if (!todo) {
      return res.status(404).json({ error: 'Todo not found' });
    }

    todo.completed = true;
    todo.completedAt = new Date().toISOString();
    todo.updatedAt = new Date().toISOString();
    storage.setTodos(todos);
    console.log('✅ Todo completed in file storage');

    // Send push notification
    (async () => {
      try {
        const userSubscriptions = notificationSubscriptions[userId] || [];
        if (userSubscriptions.length > 0) {
          const notificationPayload = JSON.stringify({
            title: 'Todo Completed',
            body: `${todo.title} done. One less thing to worry about.`,
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            tag: 'todo-complete',
            data: {
              type: 'todo-complete',
              todoId: todo.id,
              timestamp: new Date().toISOString()
            },
            actions: [
              { action: 'open', title: 'View Todos' }
            ]
          });

          for (const subscription of userSubscriptions) {
            webpush.sendNotification(subscription, notificationPayload).catch(error => {
              console.error('[PUSH] Failed to send todo completion notification:', error.message);
            });
          }
        }
      } catch (error) {
        console.error('[PUSH] Error sending todo notification:', error);
      }
    })();

    res.json({
      message: 'Todo completed',
      todo
    });
  } catch (err) {
    console.error('❌ Error completing todo:', err);
    res.status(500).json({ error: 'Failed to complete todo' });
  }
};

const deleteTodo = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    // Try MongoDB first
    if (isConnected && isConnected()) {
      try {
        const result = await Todo.findByIdAndDelete(id);
        if (result) {
          console.log('✅ Todo deleted from MongoDB');
          return res.json({ message: 'Todo deleted' });
        }
      } catch (err) {
        console.log('⚠️ MongoDB delete failed, trying file storage:', err.message);
      }
    }

    // Fallback to file storage (handle both numeric and string IDs)
    const numericId = parseInt(id);
    const index = todos.findIndex(t => (t.id === numericId || t.id === id) && t.userId === userId);
    if (index === -1) {
      return res.status(404).json({ error: 'Todo not found' });
    }

    todos.splice(index, 1);
    storage.setTodos(todos);
    console.log('✅ Todo deleted from file storage');
    res.json({ message: 'Todo deleted' });
  } catch (err) {
    console.error('❌ Error deleting todo:', err);
    res.status(500).json({ error: 'Failed to delete todo' });
  }
};

// Suggestions Controller
const getSuggestions = (req, res) => {
  const defaultSuggestions = [
    'Boss, it\'s time to check your morning routine!',
    'Boss, you\'ve been doing great with your habits. Keep it up!',
    'Boss, don\'t forget to log your mood today.',
    'Boss, you\'re 2 days away from a 7-day streak. Push it!',
    'Boss, take a 5-minute break and meditate.'
  ];
  
  res.json({ 
    message: 'Daily suggestions',
    suggestions: defaultSuggestions
  });
};

// Chat Controller - Use AI service with user context
const chat = async (req, res) => {
  const { message } = req.body;

  console.log('📨 Chat request received:', { message, hasToken: !!req.userId });

  if (!message || message.trim() === '') {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    const userId = req.userId;
    console.log('👤 User ID:', userId);
    
    const aiService = require('./aiService');
    
    // Load fresh data from storage
    habits = storage.getHabits();
    routines = storage.getRoutines();
    todos = storage.getTodos();
    
    // Get user context for smarter responses
    const userHabits = habits.filter(h => h.userId === userId);
    const userRoutines = routines.filter(r => r.userId === userId);
    const userTodos = todos.filter(t => t.userId === userId);
    const activeTodos = userTodos.filter(t => !t.completed);
    const user = users.find(u => u.id === userId);

    const msgLower = message.toLowerCase();
    let aiResponse = '';

    console.log('🔍 Message analysis:', { msgLower, userHabits: userHabits.length, userRoutines: userRoutines.length, activeTodos: activeTodos.length });

    // QUICK HANDLERS: respond immediately for direct project queries
    // If user explicitly asks about their routines, return stored routines or a clear message
    if (msgLower.includes('routine')) {
      if (userRoutines.length === 0) {
        try {
          const suggestion = await llmService.getLLMResponse(
            'Provide a short 3-step starter routine for someone who has no routines and wants to improve daily productivity and wellness.',
            [], [], [],
            user?.name || 'Chief'
          );
          if (suggestion && suggestion.response) {
            return res.json({ message: 'Chat response generated', response: suggestion.response, context: { habitsCount: userHabits.length, routinesCount: userRoutines.length, todosCount: activeTodos.length } });
          }
        } catch (e) {
          console.error('❌ LLM suggestion failed for routines:', e.message);
        }

        const noRoutineMsg = `Boss, you don't have any routines yet! I can suggest a simple starter routine: Wake up, hydrate, 10-minute movement, quick planning. Tell me if you want it more specific, sir.`;
        return res.json({ message: 'Chat response generated', response: noRoutineMsg, context: { habitsCount: userHabits.length, routinesCount: userRoutines.length, todosCount: activeTodos.length } });
      }

      let routineDetails = `You've got ${userRoutines.length} routine(s), boss! Here are the details:\n\n`;
      userRoutines.forEach((r, idx) => {
        routineDetails += `${idx + 1}. **${r.name}**\n`;
        routineDetails += `   ⏰ Time: ${r.time || 'Not set'}\n`;
        routineDetails += `   📅 Days: ${r.repeatDays?.join(', ') || 'Not set'}\n`;
        if (r.tasks && r.tasks.length > 0) {
          routineDetails += `   📝 Tasks:\n`;
          r.tasks.forEach((task, tidx) => {
            routineDetails += `      ${tidx + 1}. ${task.name || 'Unnamed task'}\n`;
          });
        }
        routineDetails += `\n`;
      });

      return res.json({ message: 'Chat response generated', response: routineDetails, context: { habitsCount: userHabits.length, routinesCount: userRoutines.length, todosCount: activeTodos.length } });
    }

    // ============ SPECIAL DETAILED DATA QUERIES ============

    // Habit Details - Show ALL habit information
    // Match more natural queries like "what is in my habit" or "show my habits"
    if (msgLower.includes('habit') && (
      msgLower.includes('detail') ||
      msgLower.includes('show') ||
      msgLower.includes('all') ||
      msgLower.includes('what') ||
      msgLower.includes("what's") ||
      msgLower.includes('whats') ||
      msgLower.includes('my habit') ||
      msgLower.includes('my habits')
    )) {
      if (userHabits.length === 0) {
        try {
          const suggestion = await llmService.getLLMResponse(
            'Suggest 3 simple starter habits for someone aiming to improve health and productivity.',
            [], [], [],
            user?.name || 'Chief'
          );
          if (suggestion && suggestion.response) {
            aiResponse = suggestion.response;
          } else {
            aiResponse = `Boss, you haven't created any habits yet. Start with: 1) 5-min morning stretch, 2) 10-min reading, 3) daily water goal, sir.`;
          }
        } catch (e) {
          console.error('❌ LLM suggestion failed for habits:', e.message);
          aiResponse = `Boss, you haven't created any habits yet. Start with: 1) 5-min morning stretch, 2) 10-min reading, 3) daily water goal.`;
        }
      } else {
        let habitDetails = `You've got ${userHabits.length} habit(s), boss! Here's the complete breakdown:\n\n`;
        userHabits.forEach((h, idx) => {
          const progress = getProgressPercentage(h.id, userId);
          habitDetails += `${idx + 1}. **${h.name}**\n`;
          habitDetails += `   🎯 Frequency: ${h.frequency}\n`;
          habitDetails += `   📊 Progress: ${progress}%\n`;
          habitDetails += `   🔥 Streak: ${h.streak || 0} days\n`;
          habitDetails += `   ⏰ Time: ${h.startTime} - ${h.endTime}\n`;
          habitDetails += `   📅 Days: ${h.scheduleDays?.join(', ') || 'Not set'}\n`;
          habitDetails += `   🏷️ Category: ${h.category || 'Other'}\n`;
          if (h.weatherPreferences) {
            habitDetails += `   🌤️ Weather Prefs: ${h.weatherPreferences.avoidRain ? 'No rain' : 'Any'}, ${h.weatherPreferences.avoidHotSun ? 'No hot sun' : 'Any'}, ${h.weatherPreferences.avoidSnow ? 'No snow' : 'Any'}\n`;
          }
          habitDetails += `\n`;
        });
        aiResponse = habitDetails;
      }
    }

    // Routine Details - Show ALL routine information
    else if (msgLower.includes('routine') && (
      msgLower.includes('detail') ||
      msgLower.includes('show') ||
      msgLower.includes('all') ||
      msgLower.includes('what') ||
      msgLower.includes("what's") ||
      msgLower.includes('whats') ||
      msgLower.includes('in my routine') ||
      msgLower.includes('my routine')
    )) {
      if (userRoutines.length === 0) {
        try {
          const suggestion = await llmService.getLLMResponse(
            'Provide a short 3-step starter routine for someone who has no routines and wants to improve daily productivity and wellness.',
            [], [], [],
            user?.name || 'Chief'
          );
          if (suggestion && suggestion.response) {
            aiResponse = suggestion.response;
          } else {
            aiResponse = `Boss, you don't have any routines yet! Building a solid routine is game-changing. Start with: 1) Morning prep, 2) Focus work block, 3) Evening wind-down, sir.`;
          }
        } catch (e) {
          console.error('❌ LLM suggestion failed for routines (detailed):', e.message);
          aiResponse = `Boss, you don't have any routines yet! Building a solid routine is game-changing. Start with: 1) Morning prep, 2) Focus work block, 3) Evening wind-down.`;
        }
      } else {
        let routineDetails = `You've got ${userRoutines.length} routine(s) scheduled, boss! Here are all the details:\n\n`;
        userRoutines.forEach((r, idx) => {
          routineDetails += `${idx + 1}. **${r.name}**\n`;
          routineDetails += `   ⏰ Time: ${r.time || 'Not set'}\n`;
          routineDetails += `   📅 Days: ${r.repeatDays?.join(', ') || 'Not set'}\n`;
          if (r.tasks && r.tasks.length > 0) {
            routineDetails += `   📝 Tasks:\n`;
            r.tasks.forEach((task, tidx) => {
              routineDetails += `      ${tidx + 1}. ${task.name || 'Unnamed task'}\n`;
            });
          }
          routineDetails += `\n`;
        });
        aiResponse = routineDetails;
      }
    }

    // Show all todos with details
    else if ((msgLower.includes('todo') || msgLower.includes('task')) && (
      msgLower.includes('detail') ||
      msgLower.includes('all') ||
      msgLower.includes('list') ||
      msgLower.includes('what') ||
      msgLower.includes('my todo') ||
      msgLower.includes('my todos')
    )) {
      if (activeTodos.length === 0) {
        try {
          const suggestion = await llmService.getLLMResponse(
            'Suggest 5 starter todo tasks for someone who wants to be productive today but has no current todos.',
            [], [], [],
            user?.name || 'Chief'
          );
          if (suggestion && suggestion.response) {
            aiResponse = suggestion.response;
          } else {
            aiResponse = `All clear, boss! 🎉 You've got no pending todos. Try adding: 1) Plan tomorrow, 2) 20-min focused work, 3) Quick inbox cleanup, sir.`;
          }
        } catch (e) {
          console.error('❌ LLM suggestion failed for todos:', e.message);
          aiResponse = `All clear, boss! 🎉 You've got no pending todos. Try adding: 1) Plan tomorrow, 2) 20-min focused work, 3) Quick inbox cleanup.`;
        }
      } else {
        let todoDetails = `You've got ${activeTodos.length} pending todo(s), Chief!\n\n`;
        const highPriority = activeTodos.filter(t => t.riskLevel === 'high');
        const mediumPriority = activeTodos.filter(t => t.riskLevel === 'medium');
        const lowPriority = activeTodos.filter(t => t.riskLevel === 'low');

        if (highPriority.length > 0) {
          todoDetails += `🔴 **HIGH PRIORITY** (${highPriority.length}):\n`;
          highPriority.forEach(t => {
            todoDetails += `   • ${t.title}\n`;
            if (t.description) todoDetails += `     └─ ${t.description}\n`;
            if (t.location) todoDetails += `     📍 Location: ${t.location}\n`;
            todoDetails += `     ⏰ Time: ${t.scheduledTime}\n\n`;
          });
        }

        if (mediumPriority.length > 0) {
          todoDetails += `🟡 **MEDIUM PRIORITY** (${mediumPriority.length}):\n`;
          mediumPriority.forEach(t => {
            todoDetails += `   • ${t.title}\n`;
            if (t.description) todoDetails += `     └─ ${t.description}\n`;
            if (t.location) todoDetails += `     📍 Location: ${t.location}\n`;
            todoDetails += `     ⏰ Time: ${t.scheduledTime}\n\n`;
          });
        }

        if (lowPriority.length > 0) {
          todoDetails += `🟢 **LOW PRIORITY** (${lowPriority.length}):\n`;
          lowPriority.forEach(t => {
            todoDetails += `   • ${t.title}\n`;
            if (t.description) todoDetails += `     └─ ${t.description}\n`;
            if (t.location) todoDetails += `     📍 Location: ${t.location}\n`;
            todoDetails += `     ⏰ Time: ${t.scheduledTime}\n\n`;
          });
        }

        aiResponse = todoDetails;
      }
    }

    // ============ LLM POWERED RESPONSES FOR GENERAL QUESTIONS ============
    else {
      console.log('🚀 Message not custom command - routing to LLM service');
      
      try {
        // Import LLM service
        const llmService = require('./llmService');
        
        // Prepare user data for LLM context
        const userForLLM = users.find(u => u.id === userId);
        const habitsForLLM = userHabits.map(h => ({
          name: h.name,
          frequency: h.frequency,
          progress: getProgressPercentage(h.id, userId),
          streak: h.streak || 0
        }));
        const routinesForLLM = userRoutines.map(r => ({
          name: r.name,
          time: r.time || 'flexible',
          days: r.repeatDays?.join(', ') || 'All days'
        }));
        const todosForLLM = activeTodos.map(t => ({
          title: t.title,
          priority: t.riskLevel || 'normal',
          time: t.scheduledTime,
          location: t.location || 'None'
        }));

        // Get LLM response with fallback chain (Grok → OpenAI → Gemini)
        console.log('📡 Calling LLM with fallback chain...');
        const llmResult = await llmService.getLLMResponse(
          message,
          habitsForLLM,
          routinesForLLM,
          todosForLLM,
          userForLLM?.name || 'Chief'
        );

        console.log('🔄 LLM service returned:', { hasResult: !!llmResult, model: llmResult?.model || 'none' });

        if (llmResult && llmResult.response) {
          aiResponse = llmResult.response;
          console.log(`✅ LLM response from ${llmResult.model}`);
        } else {
          // All LLM services failed - use intelligent contextual fallback
          console.log('⚠️ All LLM services failed, using contextual fallback');
          
          // Simple keyword-based contextual responses
          const lowerMsg = message.toLowerCase();
          
          if (lowerMsg.includes('today') || lowerMsg.includes('what day') || lowerMsg.includes('date')) {
            const today = new Date();
            const dateStr = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
            aiResponse = `Today is ${dateStr}, Chief! 📅 Time to crush those goals for the day!`;
          } else if (lowerMsg.includes('hello') || lowerMsg.includes('hi') || lowerMsg.includes('how are you')) {
            aiResponse = `Yo, boss! 💪 I'm here and ready to help you dominate your day. What's on your mind?`;
          } else if (lowerMsg.includes('motivation') || lowerMsg.includes('motivate') || lowerMsg.includes('inspire')) {
            aiResponse = `Listen up, legend! 🔥 You've got this! Every small step forward is progress. Keep pushing, stay consistent, and watch yourself transform. The future version of you will thank you for what you do today! 🚀`;
          } else if (lowerMsg.includes('help') || lowerMsg.includes('assist')) {
            const helpText = userHabits.length > 0 || userRoutines.length > 0 || activeTodos.length > 0
              ? `I'm at your service, boss! You've got ${userHabits.length} habit${userHabits.length !== 1 ? 's' : ''}, ${userRoutines.length} routine${userRoutines.length !== 1 ? 's' : ''}, and ${activeTodos.length} todo${activeTodos.length !== 1 ? 's' : ''}. What do you want to focus on?`
              : `I'm here to help you build amazing habits, create solid routines, and tackle your todos! What should we work on first, chief?`;
            aiResponse = helpText;
          } else if (lowerMsg.includes('thanks') || lowerMsg.includes('thank') || lowerMsg.includes('appreciate')) {
            aiResponse = `You got it, boss! That's what I'm here for. Now go out there and crush those goals! 💪`;
          } else if (lowerMsg.includes('goodbye') || lowerMsg.includes('bye') || lowerMsg.includes('quit')) {
            aiResponse = `See you later, chief! Keep grinding and remember - consistency is key! 🎯 I'll be here whenever you need me.`;
          } else if (lowerMsg.includes('tired') || lowerMsg.includes('tired') || lowerMsg.includes('exhausted')) {
            aiResponse = `Hey boss, I hear you. Rest is part of the process! Take care of yourself, recharge, and come back stronger. You can't pour from an empty cup! 💚`;
          } else if (lowerMsg.includes('problem') || lowerMsg.includes('stuck') || lowerMsg.includes('struggle')) {
            aiResponse = `Alright legend, let's break this down! Problems are just puzzles waiting to be solved. What specifically is getting you stuck? Let's tackle it together! 🧠`;
          } else if (lowerMsg.includes('question') || lowerMsg.includes('ask')) {
            aiResponse = `Fire away, boss! I'm all ears. Ask me anything about your goals, habits, or just life in general. Let's figure this out together! 🤝`;
          } else {
            // Default intelligent response
            aiResponse = `That's an interesting thought, chief! 🤔 Here's the thing - focus on what you can control right now. Break it down into small, actionable steps and take them one by one. Progress beats perfection every single time! 💪`;
          }
        }
      } catch (err) {
        console.error('❌ LLM service error:', err.message);
        aiResponse = `Oops, boss! I hit a snag processing that in my brain. Let me try again in a moment - or tell me what you're working on and we'll brainstorm together! 🧠`;
      }
    }

    res.json({ 
      message: 'Chat response generated',
      response: aiResponse,
      context: {
        habitsCount: userHabits.length,
        routinesCount: userRoutines.length,
        todosCount: activeTodos.length
      }
    });
    
    console.log('✅ Chat response sent:', { responseLength: aiResponse.length, type: 'LLM or fallback' });

  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Chat service temporarily unavailable. Try again in a moment, boss!' });
  }
};

// Get user dashboard stats
const getUserStats = (req, res) => {
  const userId = req.userId;
  const today = new Date().toDateString();
  
  // Get user's habits
  const userHabits = habits.filter(h => h.userId === userId);
  
  // Calculate longest streak across all habits
  let longestStreak = 0;
  userHabits.forEach(habit => {
    const progress = calculateHabitProgress(habit.id, userId);
    if (progress.streak > longestStreak) {
      longestStreak = progress.streak;
    }
  });
  
  // Count habits completed today
  const todayCompletions = habitCompletions.filter(
    c => c.userId === userId && new Date(c.completedAt).toDateString() === today
  );
  const completedToday = todayCompletions.length;
  
  // Calculate time spent today (from habit durations)
  let totalMinutesToday = 0;
  const completedHabitIds = new Set(todayCompletions.map(c => c.habitId));
  completedHabitIds.forEach(habitId => {
    const habit = userHabits.find(h => h.id === habitId);
    if (habit && habit.startTime && habit.endTime) {
      // Parse times like "09:00" and "10:00"
      const [startHour, startMin] = habit.startTime.split(':').map(Number);
      const [endHour, endMin] = habit.endTime.split(':').map(Number);
      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;
      const duration = Math.max(0, endMinutes - startMinutes);
      totalMinutesToday += duration;
    }
  });
  
  // Format time spent
  const hours = Math.floor(totalMinutesToday / 60);
  const minutes = totalMinutesToday % 60;
  const timeSpentStr = hours > 0 
    ? `${hours}h ${minutes}m` 
    : `${minutes}m`;
  
  res.json({
    streak: `${longestStreak} day${longestStreak !== 1 ? 's' : ''}`,
    completedToday: `${completedToday} today`,
    timeSpent: totalMinutesToday > 0 ? timeSpentStr : '0m'
  });
};

// Notification Controllers
/**
 * Subscribe user to push notifications
 */
const subscribeToNotifications = async (req, res) => {
  const { subscription } = req.body;
  const userId = req.userId;

  try {
    if (!subscription) {
      return res.status(400).json({ error: 'Subscription is required' });
    }

    // Initialize user notification subscriptions if not exists
    if (!notificationSubscriptions) {
      notificationSubscriptions = {};
    }

    // Store subscription in memory
    if (!notificationSubscriptions[userId]) {
      notificationSubscriptions[userId] = [];
    }
    notificationSubscriptions[userId].push(subscription);

    // Save subscriptions to persistent storage
    saveSubscriptions();
    console.log(`✅ Subscription saved for user ${userId}`);

    res.json({
      message: 'Subscribed to push notifications',
      subscribed: true
    });
  } catch (error) {
    console.error('Subscription error:', error);
    res.status(500).json({ error: 'Failed to subscribe to notifications' });
  }
};

/**
 * Send a notification to a user
 */
const sendNotification = async (req, res) => {
  const { title, body, type, userId: targetUserId } = req.body;
  const userId = req.userId;

  try {
    if (!title || !body) {
      return res.status(400).json({ error: 'Title and body are required' });
    }

    const sendToUserId = targetUserId || userId;

    // Get user subscriptions
    const userSubscriptions = notificationSubscriptions[sendToUserId] || [];

    if (userSubscriptions.length === 0) {
      console.log(`📬 No push subscriptions for user ${sendToUserId}, notification logged`);
      return res.json({
        message: 'No active push subscriptions, notification logged',
        notification: { title, body, type }
      });
    }

    // Prepare notification payload
    const notificationPayload = JSON.stringify({
      title: title,
      body: body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: type || 'reminder',
      data: {
        type: type || 'reminder',
        timestamp: new Date().toISOString()
      }
    });

    // Send push notifications to all subscriptions
    const sendPromises = userSubscriptions.map(subscription => {
      return webpush.sendNotification(subscription, notificationPayload)
        .then(() => {
          console.log(`✅ Push notification sent for user ${sendToUserId}: ${title}`);
        })
        .catch(error => {
          console.error(`❌ Failed to send push notification for user ${sendToUserId}:`, error.message);
          // Remove dead subscriptions
          if (error.statusCode === 410 || error.statusCode === 404) {
            notificationSubscriptions[sendToUserId] = notificationSubscriptions[sendToUserId].filter(s => s !== subscription);
          }
        });
    });

    await Promise.all(sendPromises);

    res.json({
      message: 'Notification sent to all subscriptions',
      notification: { title, body, type },
      subscriptions: userSubscriptions.length
    });
  } catch (error) {
    console.error('Send notification error:', error);
    res.status(500).json({ error: 'Failed to send notification', details: error.message });
  }
};

/**
 * Get pending reminders for user
 */
const getPendingReminders = async (req, res) => {
  const userId = req.userId;

  try {
    // Get todos, habits, and routines that are due
    const userTodos = (todos || []).filter(t => t.userId === userId && !t.completed);
    const userHabits = (habits || []).filter(h => h.userId === userId);
    const userRoutines = (routines || []).filter(r => r.userId === userId);

    const pendingReminders = [];

    // Check todos due today
    const today = new Date().toDateString();
    userTodos.forEach(todo => {
      if (todo.dueDate && new Date(todo.dueDate).toDateString() === today) {
        pendingReminders.push({
          id: `todo-${todo.id}`,
          type: 'todo',
          title: todo.title,
          body: `Time for: ${todo.title}`,
          time: todo.scheduledTime
        });
      }
    });

    // Check habits
    userHabits.forEach(habit => {
      if (habit.isActive !== false) {
        pendingReminders.push({
          id: `habit-${habit.id}`,
          type: 'habit',
          title: habit.name,
          body: `Time for your ${habit.frequency} habit: ${habit.name}`,
          time: habit.startTime
        });
      }
    });

    // Check routines
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const todayName = days[new Date().getDay()];
    userRoutines.forEach(routine => {
      if (routine.repeatDays && routine.repeatDays.includes(todayName)) {
        pendingReminders.push({
          id: `routine-${routine.id}`,
          type: 'routine',
          title: routine.name,
          body: `Time for: ${routine.name}`,
          time: routine.time
        });
      }
    });

    res.json({
      reminders: pendingReminders,
      count: pendingReminders.length
    });
  } catch (error) {
    console.error('Get pending reminders error:', error);
    res.status(500).json({ error: 'Failed to get pending reminders' });
  }
};

/**
 * Schedule a reminder for later
 */
const scheduleReminder = async (req, res) => {
  const { type, itemId, time } = req.body;
  const userId = req.userId;

  try {
    if (!type || !itemId || !time) {
      return res.status(400).json({ error: 'Type, itemId, and time are required' });
    }

    // In a real app, this would use a job scheduler like node-schedule
    console.log(`⏰ Scheduled reminder for user ${userId}: ${type} ${itemId} at ${time}`);

    res.json({
      message: 'Reminder scheduled',
      reminder: { type, itemId, time }
    });
  } catch (error) {
    console.error('Schedule reminder error:', error);
    res.status(500).json({ error: 'Failed to schedule reminder' });
  }
};

module.exports = {
  getUserProfile,
  updateUserProfile,
  getHabits,
  getHabitDetails,
  getHabitHistory,
  getHabitStats,
  createHabit,
  updateHabit,
  deleteHabit,
  completeHabit,
  getRoutines,
  createRoutine,
  updateRoutine,
  deleteRoutine,
  getTodos,
  createTodo,
  updateTodo,
  completeTodo,
  deleteTodo,
  getSuggestions,
  chat,
  getUserStats,
  subscribeToNotifications,
  sendNotification,
  getPendingReminders,
  scheduleReminder
};
