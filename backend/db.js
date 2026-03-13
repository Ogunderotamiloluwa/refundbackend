const mongoose = require('mongoose');
require('dotenv').config();

// User Schema
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  timezone: {
    type: String,
    default: 'UTC'
  },
  preferences: {
    theme: {
      type: String,
      default: 'light'
    },
    notifications: {
      type: Boolean,
      default: false
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const User = mongoose.model('User', userSchema, 'user');

// Habit Schema
const habitSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  description: String,
  frequency: {
    type: String,
    enum: ['daily', 'weekly', 'monthly'],
    default: 'daily'
  },
  category: String,
  targetDays: Number,
  streak: {
    type: Number,
    default: 0
  },
  completed: {
    type: Boolean,
    default: false
  },
  color: String,
  icon: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const Habit = mongoose.model('Habit', habitSchema, 'habits');

// Routine Schema
const routineSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  description: String,
  time: String,
  duration: Number,
  tasks: [String],
  category: String,
  active: {
    type: Boolean,
    default: true
  },
  reminderEnabled: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const Routine = mongoose.model('Routine', routineSchema, 'routines');

// Todo Schema
const todoSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: String,
  completed: {
    type: Boolean,
    default: false
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  dueDate: Date,
  dueTime: String,
  category: String,
  tags: [String],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const Todo = mongoose.model('Todo', todoSchema, 'todos');

// Habit Completion Schema (for tracking daily completions)
const habitCompletionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  habitId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Habit',
    required: true
  },
  completedAt: {
    type: Date,
    default: Date.now
  }
});

const HabitCompletion = mongoose.model('HabitCompletion', habitCompletionSchema, 'habitCompletions');

// Connect to MongoDB - non-blocking
let isConnected = false;

const connectDB = async () => {
  // Skip MongoDB connection if URI is not configured
  if (!process.env.MONGODB_URI || process.env.MONGODB_URI.trim() === '') {
    console.log('📂 MongoDB URI not configured, using file storage instead');
    return Promise.resolve(false);
  }

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      console.log('⏱️ MongoDB connection attempt timed out, continuing without DB');
      resolve(false);
    }, 10000);

    mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 5000,
    })
      .then(() => {
        clearTimeout(timeout);
        isConnected = true;
        console.log('✅ MongoDB connected successfully');
        resolve(true);
      })
      .catch((error) => {
        clearTimeout(timeout);
        console.log('⚠️ MongoDB connection failed:', error.message);
        resolve(false);
      });
  });
};

module.exports = {
  User,
  Habit,
  Routine,
  Todo,
  HabitCompletion,
  connectDB,
  isConnected: () => isConnected && mongoose.connection.readyState === 1
};
