const crypto = require('crypto')
const storage = require('./storage')
const { User } = require('./db')

// In-memory session storage (but persisted to file)
const sessions = new Map()

// Email verification tokens with code and expiry
const emailVerificationTokens = new Map()

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

// Load sessions from persistent storage
function loadSessions() {
  const sessionData = storage.getSessions()
  sessions.clear()
  // Sessions is an array of [token, {userId, userEmail}] pairs
  sessionData.forEach(([token, sessionInfo]) => {
    sessions.set(token, sessionInfo)
  })
}

// Save sessions to persistent storage
function saveSessions() {
  const sessionArray = Array.from(sessions.entries())
  storage.setSessions(sessionArray)
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

    console.log('📝 Register attempt:', { email, name });

    // Validation
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' })
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' })
    }

    // Try to use MongoDB if available
    let savedUser = null;
    const { isConnected } = require('./db');
    
    if (isConnected && isConnected()) {
      try {
        // Check if user already exists
        console.log('🔍 Checking if user exists in MongoDB...');
        const existingUser = await User.findOne({ email }).maxTimeMS(5000);
        if (existingUser) {
          return res.status(400).json({ error: 'Email already registered' })
        }

        // Create new user in MongoDB (plain text password for now)
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
        console.log('✅ User saved to MongoDB');
      } catch (err) {
        console.log('❌ MongoDB save failed, falling back to storage:', err.message);
        savedUser = null;
      }
    }

    // Fallback to file storage if MongoDB is not available or failed
    if (!savedUser) {
      users = storage.getUsers();
      
      // Check if user already exists in file storage
      if (users.find(u => u.email === email)) {
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
      
      console.log('✅ User saved to file storage');
    }

    // Generate token
    const token = generateToken(savedUser._id.toString())
    sessions.set(token, { userId: savedUser._id.toString(), userEmail: email })
    saveSessions()

    // Set HTTP-only cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    })

    // Return user (without password)
    const userObject = savedUser.toObject ? savedUser.toObject() : savedUser;
    delete userObject.password
    
    // Generate verification code and send email
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationToken = require('crypto').randomBytes(32).toString('hex');
    const expiryTime = Date.now() + (15 * 60 * 1000); // 15 minutes
    
    // Store verification token
    emailVerificationTokens.set(verificationToken, {
      email,
      code: verificationCode,
      expiresAt: expiryTime,
      attempts: 0,
      userId: savedUser._id || savedUser.id
    });
    
    console.log(`📧 Generated verification code for ${email}: ${verificationCode}`);
    
    // Send verification email using Brevo API
    (async () => {
      try {
        const brevoApiKey = process.env.BREVO_API_KEY;
        const senderEmail = process.env.BREVO_SENDER_EMAIL || 'noreply@personalassistant.app';
        
        if (!brevoApiKey) {
          console.error('❌ BREVO_API_KEY not configured');
          return;
        }
        
        const emailData = {
          sender: { name: 'Personal Assistant', email: senderEmail },
          to: [{ email, name }],
          subject: 'Verify Your Email - Personal Assistant',
          htmlContent: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>Welcome to Personal Assistant!</h2>
              <p>Hello ${name},</p>
              <p>Thank you for signing up. Please verify your email address to complete your registration.</p>
              <div style="background: #f0f0f0; padding: 20px; border-radius: 5px; margin: 20px 0;">
                <p style="font-size: 24px; font-weight: bold; text-align: center; color: #007bff;">
                  ${verificationCode}
                </p>
              </div>
              <p>This code will expire in 15 minutes.</p>
              <p>If you didn't create this account, please ignore this email.</p>
              <p>Best regards,<br>Personal Assistant Team</p>
            </div>
          `
        };
        
        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: {
            'api-key': brevoApiKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(emailData),
          timeout: 10000
        });
        
        const responseText = await response.text();
        console.log(`✅ Verification email API response: ${response.status}`);
        
      } catch (emailErr) {
        console.error('❌ Failed to send verification email:', emailErr.message);
      }
    })();
    
    res.status(201).json({
      message: 'User registered successfully. Check your email for verification code.',
      token: verificationToken,
      user: userObject
    })
  } catch (err) {
    console.error('Registration error:', err)
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

    const session = sessions.get(token)

    if (!session) {
      return res.status(401).json({ error: 'Invalid token' })
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

    const session = sessions.get(token)

    if (!session) {
      return res.status(401).json({ error: 'Invalid token' })
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

// Email verification function
async function verifyEmailCode(token, code) {
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

// Complete email verification
async function completeEmailVerification(email) {
  try {
    // Check MongoDB first
    let user = null
    const { isConnected } = require('./db')
    
    if (isConnected && isConnected()) {
      try {
        const { User } = require('./db')
        user = await User.findOne({ email })
        if (user) {
          console.log('✅ User found in MongoDB for verification completion')
        }
      } catch (err) {
        console.log('⚠️ MongoDB lookup failed in completeEmailVerification:', err.message)
      }
    }
    
    // Fallback to file storage
    if (!user) {
      users = storage.getUsers()
      user = users.find(u => u.email === email)
      if (user) {
        console.log('✅ User found in file storage for verification completion')
      }
    }
    
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
  verifyEmailCode,
  completeEmailVerification,
  emailVerificationTokens
}
