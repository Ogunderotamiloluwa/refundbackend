const crypto = require('crypto')
const storage = require('./storage')
const { User } = require('./db')

// In-memory session storage (but persisted to file)
const sessions = new Map()

// Helper to manage user data with persistence
let users = []

// Default test user
const DEFAULT_USER = {
  id: 1,
  email: 'boss@test.com',
  password: 'password123',
  name: 'Boss'
}

// Load users from storage on startup
function loadUsers() {
  users = storage.getUsers()
  // Ensure default test user always exists
  if (users.length === 0 || !users.find(u => u.email === DEFAULT_USER.email)) {
    const defaultUser = {
      id: users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1,
      email: DEFAULT_USER.email,
      password_hash: hashPassword(DEFAULT_USER.password),
      name: DEFAULT_USER.name,
      timezone: 'UTC',
      preferences: { theme: 'dark', notifications: true },
      created_at: new Date().toISOString()
    }
    users.push(defaultUser)
    storage.setUsers(users)
  }
}

// Load sessions from persistent storage (MongoDB first, then file storage)
function loadSessions() {
  // Load from file storage (for in-memory cache)
  const mongoose = require('mongoose')
  const sessionData = storage.getSessions()
  sessions.clear()
  sessionData.forEach(([token, sessionInfo]) => {
    // Only load valid sessions with proper ObjectId
    if (sessionInfo.userId && mongoose.Types.ObjectId.isValid(sessionInfo.userId)) {
      sessions.set(token, sessionInfo)
    }
  })
}

// Save sessions to persistent storage (MongoDB first, then file storage)
async function saveSessions() {
  const sessionArray = Array.from(sessions.entries())
  storage.setSessions(sessionArray)
  
  // Also try to save to MongoDB if connected
  try {
    const { isConnected } = require('./db')
    if (isConnected && isConnected()) {
      const { Session } = require('./db')
      const mongoose = require('mongoose')
      for (const [token, sessionInfo] of sessionArray) {
        try {
          // Only save if userId is a valid MongoDB ObjectId
          if (sessionInfo.userId && mongoose.Types.ObjectId.isValid(sessionInfo.userId)) {
            await Session.findOneAndUpdate(
              { token },
              { token, ...sessionInfo, createdAt: new Date() },
              { upsert: true }
            )
          }
        } catch (err) {
          console.warn('⚠️ Failed to save session to MongoDB:', err.message)
        }
      }
      console.log('💾 Sessions saved to MongoDB')
    }
  } catch (err) {
    console.warn('⚠️ MongoDB not available for session storage')
  }
}

// Get user ID counter
function getUserIdCounter() {
  return Math.max(0, ...users.map(u => u.id || 0)) + 1
}

// Hash password using Node's built-in crypto
function hashPassword(password) {
  return crypto.createHash('sha256').update(password + 'salt123').digest('hex')
}

// Compare passwords
function comparePasswords(password, hash) {
  return hashPassword(password) === hash
}

// Generate session token
function generateToken(userId) {
  return crypto.randomBytes(32).toString('hex')
}

// Register user
const register = async (req, res) => {
  try {
    const { email, password, name } = req.body

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('📝 REGISTRATION ATTEMPT STARTED');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🔹 Email:', email);
    console.log('🔹 Name:', name);
    console.log('🔹 Password length:', password ? password.length : 'missing');

    // Validation
    if (!email || !password || !name) {
      const missing = [];
      if (!email) missing.push('email');
      if (!password) missing.push('password');
      if (!name) missing.push('name');
      console.log('❌ VALIDATION FAILED: Missing required fields:', missing);
      return res.status(400).json({ error: `Missing required fields: ${missing.join(', ')}` })
    }

    if (password.length < 6) {
      console.log('❌ VALIDATION FAILED: Password too short (', password.length, 'chars, need 6+)');
      return res.status(400).json({ error: 'Password must be at least 6 characters' })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log('❌ VALIDATION FAILED: Invalid email format:', email);
      return res.status(400).json({ error: 'Invalid email format' })
    }

    console.log('✅ Validation passed');

    // Try to use MongoDB if available
    let savedUser = null;
    const { isConnected } = require('./db');
    
    console.log('📧 Step 1: Checking if MongoDB is connected...');
    if (isConnected && isConnected()) {
      console.log('✅ MongoDB is connected');
      try {
        // Check if user already exists
        console.log('📧 Step 2: Checking if user exists in MongoDB...');
        const existingUser = await User.findOne({ email }).maxTimeMS(5000);
        if (existingUser) {
          console.log('❌ USER ALREADY EXISTS IN MONGODB:', email);
          console.log('   Existing user ID:', existingUser._id);
          return res.status(400).json({ error: 'Email already registered' })
        }
        console.log('✅ User does not exist in MongoDB');

        // Create new user in MongoDB (plain text password for now)
        console.log('📧 Step 3: Creating new user in MongoDB...');
        const newUser = new User({
          name,
          email,
          password, // Plain text for now
          timezone: 'UTC',
          preferences: {
            theme: 'light',
            notifications: false
          }
        })

        savedUser = await newUser.save();
        console.log('✅ User saved to MongoDB:', { userId: savedUser._id, email: savedUser.email });
      } catch (err) {
        console.log('⚠️ MongoDB save failed, falling back to storage:', err.message);
        savedUser = null;
      }
    } else {
      console.log('⚠️ MongoDB not connected, will use file storage');
    }

    // Fallback to file storage if MongoDB is not available or failed
    if (!savedUser) {
      console.log('📧 Step 4: Saving to file storage...');
      users = storage.getUsers();
      
      // Check if user already exists in file storage
      const existingFileUser = users.find(u => u.email === email);
      if (existingFileUser) {
        console.log('❌ USER ALREADY EXISTS IN FILE STORAGE:', email);
        console.log('   Existing user ID:', existingFileUser.id);
        return res.status(400).json({ error: 'Email already registered' })
      }

      // Create user in file storage
      const newUser = {
        id: getUserIdCounter(),
        email,
        password, // Plain text for now
        name,
        timezone: 'UTC',
        preferences: { theme: 'light', notifications: false },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      users.push(newUser);
      storage.setUsers(users);
      
      // Convert to match expected format
      savedUser = {
        _id: { toString: () => newUser.id.toString() },
        ...newUser,
        toObject: () => ({ ...newUser })
      };
      
      console.log('✅ User saved to file storage:', { userId: newUser.id, email: newUser.email });
    }

    // Generate email verification code
    console.log('📧 Step 5: Generating verification code...');
    const verificationCode = String(Math.floor(100000 + Math.random() * 900000))
    const verificationToken = crypto.randomBytes(32).toString('hex')
    const emailVerificationExpires = Date.now() + (24 * 60 * 60 * 1000) // 24 hours
    
    console.log('✅ Generated verification code:', verificationCode);
    console.log('✅ Generated verification token:', verificationToken.substring(0, 10) + '...');
    
    emailVerificationTokens.set(verificationToken, {
      email,
      code: verificationCode,
      expiresAt: emailVerificationExpires,
      attempts: 0,
      userId: savedUser._id.toString()
    })
    console.log('✅ Stored verification token in memory');
    
    // Send verification email
    console.log('📧 Step 6: SENDING VERIFICATION EMAIL...');
    console.log('   📮 To:', email);
    console.log('   📮 Name:', name);
    console.log('   📮 Code:', verificationCode);
    
    try {
      const emailService = require('./emailService')
      console.log('📧 Step 6a: Email service loaded');
      
      const emailSent = await emailService.sendVerificationEmail(email, name, verificationCode)
      
      console.log('📧 Step 6b: Email service returned:', emailSent);
      
      if (emailSent) {
        console.log('✅✅✅ VERIFICATION EMAIL SENT SUCCESSFULLY ✅✅✅');
      } else {
        console.warn('⚠️⚠️⚠️ EMAIL SERVICE RETURNED FALSE ⚠️⚠️⚠️');
        console.warn('   Email:', email);
        console.warn('   Code:', verificationCode);
      }
    } catch (err) {
      console.error('❌ EXCEPTION DURING EMAIL SENDING:', err.message);
      console.error('   Stack:', err.stack);
      console.error('   Code still valid:', verificationCode);
    }

    console.log('═══════════════════════════════════════════════════════════');
    console.log('✅ REGISTRATION COMPLETE - Response being sent');
    console.log('═══════════════════════════════════════════════════════════\n');

    // Return verification token and success (account not yet active)
    res.status(201).json({
      message: 'Registration successful! Check your email for verification code.',
      verificationToken,
      email,
      requiresEmailVerification: true
    })
  } catch (err) {
    console.error('\n❌❌❌ REGISTRATION FATAL ERROR ❌❌❌');
    console.error('Message:', err.message);
    console.error('Stack:', err.stack);
    console.log('═══════════════════════════════════════════════════════════\n');
    res.status(500).json({ error: 'Registration failed: ' + err.message })
  }
}

// Login user
const login = async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' })
    }

    console.log('🔑 Login attempt:', { email, passwordLength: password.length });

    let user = null;
    const { isConnected } = require('./db');

    // Try MongoDB first
    if (isConnected && isConnected()) {
      try {
        console.log('🔍 Searching user in MongoDB with email:', email);
        const mongoUser = await User.findOne({ email }).maxTimeMS(5000);
        
        if (mongoUser) {
          console.log('✅ User found in MongoDB:', { name: mongoUser.name, email: mongoUser.email });
          console.log('   Database password length:', mongoUser.password ? mongoUser.password.length : 'null');
          console.log('   Input password length:', password.length);
          
          // Check password for MongoDB user (plain text comparison)
          if (mongoUser.password === password) {
            user = mongoUser;
            console.log('✅ Password verified in MongoDB - MATCH!');
          } else {
            console.log('❌ Password mismatch - Expected:', mongoUser.password, '| Got:', password);
          }
        } else {
          console.log('❌ User not found in MongoDB with email:', email);
          console.log('   Searching for ALL users to debug...');
          const allUsers = await User.find({}).maxTimeMS(5000);
          console.log('   Total users in DB:', allUsers.length);
          if (allUsers.length > 0) {
            console.log('   Existing emails:', allUsers.map(u => u.email).join(', '));
          }
        }
      } catch (err) {
        console.log('❌ MongoDB search failed:', err.message);
        console.log('   Error:', err);
      }
    } else {
      console.log('⚠️ MongoDB not connected, checking file storage');
    }

    // Fallback to file storage if MongoDB didn't find/verify user
    if (!user) {
      console.log('📂 Searching user in file storage...');
      users = storage.getUsers();
      console.log('   Total users in file storage:', users.length);
      const fileUser = users.find(u => u.email === email);
      if (fileUser) {
        // Check password - support both hashed and plain text
        const passwordValid = fileUser.password_hash 
          ? comparePasswords(password, fileUser.password_hash)
          : fileUser.password === password;
        
        if (passwordValid) {
          console.log('✅ User found in file storage');
          user = {
            _id: { toString: () => fileUser.id.toString() },
            ...fileUser,
            toObject: () => ({ ...fileUser })
          };
        } else {
          console.log('❌ Password mismatch in file storage');
        }
      } else {
        console.log('❌ User not found in file storage');
        console.log('   Existing emails:', users.map(u => u.email).join(', '));
      }
    }

    // Check if user was found and password is valid
    if (!user) {
      console.log('❌ Login failed - Invalid email or password');
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    // Generate token
    const token = generateToken(user._id.toString())
    sessions.set(token, { userId: user._id.toString(), userEmail: email })
    saveSessions()

    // Set HTTP-only cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    })

    // Return user (without password)
    const userResponse = user.toObject ? user.toObject() : user
    delete userResponse.password
    
    res.status(200).json({
      message: 'Login successful',
      token,
      user: userResponse
    })
  } catch (err) {
    console.error('Login error:', err)
    res.status(500).json({ error: 'Login failed: ' + err.message })
  }
}

// Verify token
const verify = (req, res) => {
  try {
    let token = null
    
    // Check Authorization header first
    const authHeader = req.headers.authorization
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7)
    }
    
    // Fall back to cookies if no header token
    if (!token && req.cookies && req.cookies.token) {
      token = req.cookies.token
    }

    if (!token) {
      return res.status(401).json({ error: 'No token provided' })
    }

    // Check in-memory sessions first
    let session = sessions.get(token)
    
    if (!session) {
      console.log('⚠️ Token not in memory, checking MongoDB...')
      // Try MongoDB if connected
      const { isConnected } = require('./db')
      if (isConnected && isConnected()) {
        const { Session } = require('./db')
        Session.findOne({ token }).then(dbSession => {
          if (dbSession) {
            console.log('✅ Token found in MongoDB, adding to memory')
            session = { userId: dbSession.userId.toString(), userEmail: dbSession.userEmail }
            sessions.set(token, session)
            
            res.status(200).json({
              valid: true,
              userId: session.userId,
              userEmail: session.userEmail
            })
          } else {
            console.log('❌ Token not found in MongoDB')
            res.status(401).json({ error: 'Invalid token' })
          }
        }).catch(err => {
          console.error('❌ MongoDB error checking token:', err.message)
          res.status(401).json({ error: 'Invalid token' })
        })
        return
      } else {
        return res.status(401).json({ error: 'Invalid token' })
      }
    }

    res.status(200).json({
      valid: true,
      userId: session.userId,
      userEmail: session.userEmail
    })
  } catch (err) {
    console.error('Token verification error:', err)
    res.status(500).json({ error: 'Verification failed' })
  }
}

// Middleware to protect routes
const authenticate = (req, res, next) => {
  try {
    let token = null
    
    // Check Authorization header first
    const authHeader = req.headers.authorization
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7)
    }
    
    // Fall back to cookies if no header token
    if (!token && req.cookies && req.cookies.token) {
      token = req.cookies.token
    }

    if (!token) {
      return res.status(401).json({ error: 'No token provided' })
    }

    let session = sessions.get(token)

    if (!session) {
      // Token not in memory, try MongoDB
      const { isConnected } = require('./db')
      if (isConnected && isConnected()) {
        const { Session } = require('./db')
        Session.findOne({ token }).then(dbSession => {
          if (dbSession) {
            console.log('✅ Token found in MongoDB during auth check')
            session = { userId: dbSession.userId.toString(), userEmail: dbSession.userEmail }
            sessions.set(token, session)
            req.userId = session.userId
            req.userEmail = session.userEmail
            next()
          } else {
            return res.status(401).json({ error: 'Invalid token' })
          }
        }).catch(err => {
          console.error('❌ MongoDB error during auth:', err.message)
          return res.status(401).json({ error: 'Authentication failed' })
        })
        return
      } else {
        return res.status(401).json({ error: 'Invalid token' })
      }
    }

    req.userId = session.userId
    req.userEmail = session.userEmail
    next()
  } catch (err) {
    res.status(401).json({ error: 'Authentication failed' })
  }
}

// Export helpers for controllers
function getUsers() {
  // Load fresh data from storage
  users = storage.getUsers()
  return users
}

function findUserById(userId) {
  users = storage.getUsers()
  return users.find(u => u.id === userId)
}

// Password reset token storage (in-memory with expiry)
const resetTokens = new Map()

// Email verification token storage (in-memory with expiry)
const emailVerificationTokens = new Map()

/**
 * Generate password reset code
 * @param {string} email - User email
 * @returns {object} - { code, expiresIn, token } or { error }
 */
function generatePasswordResetCode(email) {
  try {
    // Generate 6-digit code
    const code = String(Math.floor(100000 + Math.random() * 900000))
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = Date.now() + (30 * 60 * 1000) // 30 minutes expiry
    
    // Store in memory
    resetTokens.set(token, {
      email,
      code,
      expiresAt,
      attempts: 0
    })
    
    console.log(`🔐 Reset code generated for ${email}:`, { code, expiresIn: '30 minutes' })
    
    return { code, token, expiresIn: 1800 }
  } catch (err) {
    console.error('❌ Error generating reset code:', err.message)
    return { error: 'Failed to generate reset code' }
  }
}

/**
 * Verify password reset code
 * @param {string} token - Reset token
 * @param {string} code - User-provided code
 * @returns {object} - { valid: true, email } or { valid: false, error }
 */
function verifyPasswordResetCode(token, code) {
  try {
    const resetData = resetTokens.get(token)
    
    if (!resetData) {
      return { valid: false, error: 'Reset code expired or invalid' }
    }
    
    if (resetData.expiresAt < Date.now()) {
      resetTokens.delete(token)
      return { valid: false, error: 'Reset code expired. Please request a new one.' }
    }
    
    if (resetData.attempts > 3) {
      resetTokens.delete(token)
      return { valid: false, error: 'Too many incorrect attempts. Please request a new reset code.' }
    }
    
    if (resetData.code !== code) {
      resetData.attempts += 1
      console.log(`⚠️ Incorrect reset code attempt (${resetData.attempts}/3) for ${resetData.email}`)
      return { valid: false, error: 'Incorrect code. Please try again.' }
    }
    
    console.log(`✅ Reset code verified for ${resetData.email}`)
    return { valid: true, email: resetData.email, token }
  } catch (err) {
    console.error('❌ Error verifying reset code:', err.message)
    return { valid: false, error: 'Verification failed' }
  }
}

/**
 * Update user password
 * @param {string} email - User email
 * @param {string} newPassword - New password
 * @returns {object} - { success: true } or { error }
 */
function updateUserPassword(email, newPassword) {
  try {
    // Load from MongoDB first
    const { isConnected } = require('./db')
    if (isConnected && isConnected()) {
      const { User } = require('./db')
      const hashedPassword = hashPassword(newPassword)
      
      User.findOneAndUpdate(
        { email },
        { password_hash: hashedPassword, updated_at: new Date() },
        { new: true }
      ).then(user => {
        if (!user) {
          console.log('⚠️ User not found in MongoDB:', email)
        } else {
          console.log('✅ Password updated in MongoDB for:', email)
        }
      }).catch(err => {
        console.error('❌ MongoDB error updating password:', err.message)
      })
    }
    
    // Also update in file storage
    users = storage.getUsers()
    const userIndex = users.findIndex(u => u.email === email)
    if (userIndex !== -1) {
      users[userIndex].password_hash = hashPassword(newPassword)
      users[userIndex].updated_at = new Date().toISOString()
      storage.setUsers(users)
      console.log('✅ Password updated in file storage for:', email)
      return { success: true }
    }
    
    return { error: 'User not found' }
  } catch (err) {
    console.error('❌ Error updating password:', err.message)
    return { error: 'Failed to update password' }
  }
}

/**
 * Verify email with code
 * @param {string} token - Email verification token
 * @param {string} code - User-provided code
 * @returns {object} - { valid: true, email, userId } or { valid: false, error }
 */
function verifyEmailCode(token, code) {
  try {
    const verificationData = emailVerificationTokens.get(token)
    
    if (!verificationData) {
      return { valid: false, error: 'Verification code expired or invalid' }
    }
    
    if (verificationData.expiresAt < Date.now()) {
      emailVerificationTokens.delete(token)
      return { valid: false, error: 'Verification code expired. Please register again.' }
    }
    
    if (verificationData.attempts > 3) {
      emailVerificationTokens.delete(token)
      return { valid: false, error: 'Too many incorrect attempts. Please register again.' }
    }
    
    if (verificationData.code !== code) {
      verificationData.attempts += 1
      console.log(`⚠️ Incorrect email verification attempt (${verificationData.attempts}/3) for ${verificationData.email}`)
      return { valid: false, error: 'Incorrect code. Please try again.' }
    }
    
    console.log(`✅ Email verified for ${verificationData.email}`)
    return { valid: true, email: verificationData.email, userId: verificationData.userId, token }
  } catch (err) {
    console.error('❌ Error verifying email:', err.message)
    return { valid: false, error: 'Verification failed' }
  }
}

/**
 * Resend verification code to user email
 * @param {string} token - Verification token
 * @returns {object} - { success: true } or { error }
 */
async function resendVerificationCode(token) {
  try {
    const verificationData = emailVerificationTokens.get(token)
    
    if (!verificationData) {
      return { success: false, error: 'Invalid verification token' }
    }
    
    if (verificationData.expiresAt < Date.now()) {
      emailVerificationTokens.delete(token)
      return { success: false, error: 'Verification token expired. Please register again.' }
    }
    
    // Check for rate limiting - allow resend every 30 seconds
    if (verificationData.lastResendAt && Date.now() - verificationData.lastResendAt < 30000) {
      const waitTime = Math.ceil((30000 - (Date.now() - verificationData.lastResendAt)) / 1000)
      return { success: false, error: `Please wait ${waitTime} seconds before resending` }
    }
    
    // Reset attempts on resend
    verificationData.attempts = 0
    verificationData.lastResendAt = Date.now()
    
    // Get user name for the email
    const users = getUsers()
    const user = users.find(u => u.email === verificationData.email) || {}
    const userName = user.name || 'User'
    
    // Resend verification email
    try {
      const emailService = require('./emailService')
      const emailSent = await emailService.sendVerificationEmail(verificationData.email, userName, verificationData.code)
      if (emailSent) {
        console.log('✅ Verification email resent successfully to:', verificationData.email)
      } else {
        console.warn('⚠️ Email service returned false for resend, code still valid:', verificationData.code)
      }
    } catch (err) {
      console.error('❌ Email resend error:', err.message, 'Code still valid:', verificationData.code)
    }
    
    return { success: true, message: 'Verification code resent to your email' }
  } catch (err) {
    console.error('❌ Error resending verification code:', err.message)
    return { success: false, error: 'Failed to resend verification code' }
  }
}

/**
 * Mark email as verified and create session
 * @param {string} email - User email
 * @returns {object} - { success: true, token, user } or { error }
 */
function completeEmailVerification(email) {
  try {
    users = storage.getUsers()
    const user = users.find(u => u.email === email)
    
    if (!user) {
      return { error: 'User not found' }
    }
    
    // Generate token
    const token = generateToken(user.id || user._id?.toString?.())
    sessions.set(token, { userId: (user.id || user._id?.toString?.()), userEmail: email })
    saveSessions()
    
    console.log(`✅ Email verification completed for ${email}`)
    return { success: true, token, user }
  } catch (err) {
    console.error('❌ Error completing email verification:', err.message)
    return { error: 'Failed to complete verification' }
  }
}

module.exports = {
  register,
  login,
  verify,
  authenticate,
  loadUsers,
  loadSessions,
  saveSessions,
  getUsers,
  findUserById,
  hashPassword,
  comparePasswords,
  generatePasswordResetCode,
  verifyPasswordResetCode,
  updateUserPassword,
  verifyEmailCode,
  completeEmailVerification,
  resendVerificationCode,
  sessions
}
