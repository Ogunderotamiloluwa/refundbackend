const fs = require('fs')
const path = require('path')

// Data directory
const dataDir = path.join(__dirname, 'data')

// Ensure data directory exists
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir)
}

// File paths
const USER_FILE = path.join(dataDir, 'users.json')
const HABITS_FILE = path.join(dataDir, 'habits.json')
const ROUTINES_FILE = path.join(dataDir, 'routines.json')
const TODOS_FILE = path.join(dataDir, 'todos.json')
const COMPLETIONS_FILE = path.join(dataDir, 'habitCompletions.json')
const SESSIONS_FILE = path.join(dataDir, 'sessions.json')
const SUBSCRIPTIONS_FILE = path.join(dataDir, 'subscriptions.json')

// Initialize files if they don't exist
function initializeFiles() {
  [USER_FILE, HABITS_FILE, ROUTINES_FILE, TODOS_FILE, COMPLETIONS_FILE, SESSIONS_FILE, SUBSCRIPTIONS_FILE].forEach(file => {
    if (!fs.existsSync(file)) {
      fs.writeFileSync(file, JSON.stringify([], null, 2))
    }
  })
}

// Read data from file
function readData(filePath) {
  try {
    const data = fs.readFileSync(filePath, 'utf8')
    return JSON.parse(data)
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err.message)
    return []
  }
}

// Write data to file
function writeData(filePath, data) {
  try {
    const fileName = path.basename(filePath);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2))
    
    // Log subscription writes specifically for debugging
    if (fileName === 'subscriptions.json') {
      console.log(`\n💾 STORAGE: Writing subscriptions.json`);
      console.log(`   Items: ${(Array.isArray(data) ? data : []).length}`);
      if (Array.isArray(data)) {
        data.forEach(item => {
          console.log(`   [${item.userId}]: ${item.subscriptions?.length || 0} subscription(s)`);
        });
      }
    }
    
    return true
  } catch (err) {
    console.error(`❌ Error writing to ${filePath}:`, err.message)
    return false
  }
}

// Storage API
const storage = {
  init: initializeFiles,

  // Users
  getUsers: () => readData(USER_FILE),
  setUsers: (data) => writeData(USER_FILE, data),

  // Habits
  getHabits: () => readData(HABITS_FILE),
  setHabits: (data) => writeData(HABITS_FILE, data),

  // Routines
  getRoutines: () => readData(ROUTINES_FILE),
  setRoutines: (data) => writeData(ROUTINES_FILE, data),

  // Todos
  getTodos: () => readData(TODOS_FILE),
  setTodos: (data) => writeData(TODOS_FILE, data),

  // Habit Completions
  getHabitCompletions: () => readData(COMPLETIONS_FILE),
  setHabitCompletions: (data) => writeData(COMPLETIONS_FILE, data),

  // Sessions (for token persistence across restarts)
  getSessions: () => {
    const data = readData(SESSIONS_FILE)
    return Array.isArray(data) ? data : []
  },
  setSessions: (data) => writeData(SESSIONS_FILE, Array.isArray(data) ? data : []),

  // Push Notification Subscriptions
  getSubscriptions: () => {
    const data = readData(SUBSCRIPTIONS_FILE)
    return Array.isArray(data) ? data : []
  },
  setSubscriptions: (data) => writeData(SUBSCRIPTIONS_FILE, Array.isArray(data) ? data : []),
}

module.exports = storage
