const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const app = express();
const routes = require('./routes');
const storage = require('./storage');
const auth = require('./auth');
const { connectDB, Habit, Routine, Todo, Session } = require('./db');
const notificationScheduler = require('./notificationScheduler');

// Connect to MongoDB WITHOUT blocking server startup
connectDB()
  .then(async () => {
    console.log('✅ MongoDB connection established');
    
    // Load sessions from MongoDB to restore any active user sessions
    try {
      const dbSessions = await Session.find({});
      console.log(`📝 Loaded ${dbSessions.length} sessions from MongoDB`);
      dbSessions.forEach(session => {
        auth.sessions.set(session.token, {
          userId: session.userId.toString(),
          userEmail: session.userEmail
        });
      });
    } catch (error) {
      console.warn('⚠️ Failed to load sessions from MongoDB:', error.message);
    }
    
    // Reload all scheduled notifications from database
    // This ensures notifications persist across server restarts
    try {
      await notificationScheduler.reloadScheduledNotifications(Habit, Routine, Todo);
    } catch (error) {
      console.error('⚠️ Failed to reload scheduled notifications:', error.message);
    }
  })
  .catch(err => {
    console.warn('⚠️ MongoDB connection failed, using file storage as fallback:', err.message);
  });

// Log connection attempt details
console.log('🔄 MongoDB Connection Attempt:');
console.log('   URI configured:', !!process.env.MONGODB_URI);
console.log('   URI starts with:', process.env.MONGODB_URI ? process.env.MONGODB_URI.substring(0, 30) + '...' : 'NOT SET');

// Initialize persistent storage on startup
storage.init();
console.log('✅ Persistent storage initialized');

// Load users from storage
auth.loadUsers();
console.log('✅ Users loaded from storage');

// Load sessions from storage
auth.loadSessions();
console.log('✅ Sessions restored from storage');

// Load auth users (will be called in auth functions)
// Middleware - Allow multiple ports for frontend
const defaultOrigins = [
  // Frontend Ports (Vite and custom ports)
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  'http://localhost:3003',
  'http://localhost:5000',
  'http://localhost:5001',
  'http://localhost:5002',
  'http://localhost:5003',
  'http://localhost:5004',
  'http://localhost:5173',
  // Local network IPs
  'http://192.168.43.131:3000',
  'http://192.168.43.131:3001',
  'http://192.168.43.131:3002',
  'http://192.168.43.131:3003',
  'http://192.168.52.131:5000',
  'http://192.168.52.131:5001',
  'http://192.168.52.131:5002',
  'http://192.168.52.131:5003',
  'http://192.168.52.131:5004',
  'http://192.168.52.131:5173',
  'http://192.168.52.131:3000',
  'http://192.168.52.131:3001',
  'http://192.168.52.131:3002',
  // Production - include both typo and corrected URLs
  'https://personal-assistan.netlify.app', // Current deployed version (with typo)
  'https://personal-assistant.netlify.app', // Corrected URL
  'https://boss-pa.netlify.app'
];

// Always include default origins, plus any from CLIENT_URL env var
const allowedOrigins = [
  ...defaultOrigins,
  ...(process.env.CLIENT_URL ? process.env.CLIENT_URL.split(',').map(url => url.trim()) : [])
];

// Remove duplicates
const uniqueOrigins = [...new Set(allowedOrigins)];

console.log('✅ CORS Allowed Origins:', uniqueOrigins);

app.use(cors({
  origin: uniqueOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Health Check Route
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK',
    message: 'PA Web App Backend is running',
    timestamp: new Date().toISOString(),
    port: PORT,
    environment: process.env.NODE_ENV || 'development'
  });
});

// Test Auth Route (without requiring token)
app.get('/api/test-auth', (req, res) => {
  res.json({
    message: 'Auth endpoints are working!',
    endpoints: {
      register: 'POST /api/auth/register',
      login: 'POST /api/auth/login',
      verify: 'GET /api/auth/verify'
    },
    instructions: {
      register: 'Send: { name, email, password }',
      login: 'Send: { email, password }',
      verify: 'Send header: Authorization: Bearer <token>'
    }
  });
});

// DEBUG: Check users in database (development only)
app.get('/api/debug/users', async (req, res) => {
  try {
    const { User } = require('./db');
    const { isConnected } = require('./db');
    
    console.log('📊 Debug endpoint called - checking users...');
    
    if (isConnected && isConnected()) {
      console.log('🔌 MongoDB is connected, querying users...');
      const users = await User.find({}).select('_id name email password timezone createdAt').maxTimeMS(5000);
      console.log(`   Found ${users.length} users in MongoDB`);
      
      return res.json({
        source: 'MongoDB',
        count: users.length,
        users: users.map(u => ({
          id: u._id,
          name: u.name,
          email: u.email,
          passwordLength: u.password ? u.password.length : 0,
          passwordActual: u.password, // For debugging
          timezone: u.timezone,
          createdAt: u.createdAt
        }))
      });
    }
    
    // Fallback to file storage
    console.log('📂 MongoDB not connected, checking file storage...');
    const storageUsers = storage.getUsers();
    console.log(`   Found ${storageUsers.length} users in file storage`);
    
    res.json({
      source: 'File Storage',
      count: storageUsers.length,
      users: storageUsers.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        passwordLength: u.password ? u.password.length : 0,
        passwordActual: u.password, // For debugging
        timezone: u.timezone
      }))
    });
  } catch (err) {
    console.error('❌ Debug endpoint error:', err);
    res.status(500).json({ error: 'Debug failed: ' + err.message });
  }
});

// API Routes
app.use('/api', routes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ 
    error: err.message || 'Internal Server Error'
  });
});

// Start Server
const PORT = process.env.PORT || 5001;
const HOSTNAME = process.env.NODE_ENV === 'production' ? (process.env.HOSTNAME || '0.0.0.0') : 'localhost';

app.listen(PORT, HOSTNAME, () => {
  console.log(`\n🚀 PA Web App Backend running!`);
  console.log(`   📍 Local: http://localhost:${PORT}`);
  console.log(`   🌐 Network: http://192.168.52.131:${PORT}`);
  console.log(`   📦 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   💾 Database: personal-asst`);
  console.log(`   👥 User Collection: user`);
  console.log(`\n📝 Available Ports for Backend: 5000, 5001, 5002, 5003, 5004`);
  console.log(`   Set with: PORT=5000 npm start\n`);
});
