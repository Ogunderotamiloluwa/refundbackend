// Routes - API Endpoints
const express = require('express');
const router = express.Router();
const controllers = require('./controllers');
const { register, login, verify, authenticate } = require('./auth');

// Public route to get VAPID key for push notifications
router.get('/vapid-key', (req, res) => {
  const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
  if (!vapidPublicKey) {
    return res.status(500).json({ error: 'VAPID key not configured' });
  }
  res.json({ publicKey: vapidPublicKey });
});

// Diagnostic endpoint to check notification system status
router.get('/notifications/status', authenticate, (req, res) => {
  const userId = req.userId?.toString ? req.userId.toString() : req.userId;
  const { notificationSubscriptions } = req.app.locals;
  
  const userSubscriptions = notificationSubscriptions?.[userId] || [];
  const allUsers = Object.keys(notificationSubscriptions || {});
  
  res.json({
    system: {
      vapidPublicKeyConfigured: !!process.env.VAPID_PUBLIC_KEY,
      vapidPrivateKeyConfigured: !!process.env.VAPID_PRIVATE_KEY,
      webpushInitialized: !!req.app.locals.webpush
    },
    currentUser: {
      userId: userId,
      subscriptionsCount: userSubscriptions.length,
      subscriptions: userSubscriptions.map(s => ({
        endpoint: s.endpoint?.substring(0, 50) + '...',
        auth: !!s.keys?.auth,
        p256dh: !!s.keys?.p256dh
      }))
    },
    allUsers: {
      totalUsers: allUsers.length,
      userIds: allUsers
    }
  });
});

// Auth Routes (Public)
router.post('/auth/register', register);
router.post('/auth/login', login);
router.get('/auth/verify', verify);
router.post('/auth/verify-email', controllers.verifyEmailCode);
router.post('/auth/resend-verification-code', controllers.resendVerificationCode);
router.post('/auth/forgot-password', controllers.requestPasswordReset);
router.post('/auth/verify-reset-code', controllers.verifyResetCode);
router.post('/auth/reset-password', controllers.resetPasswordV2);

// User Routes (Protected)
router.get('/users/profile', authenticate, controllers.getUserProfile);
router.put('/users/profile', authenticate, controllers.updateUserProfile);
router.get('/users/stats', authenticate, controllers.getUserStats);

// Habit Routes (Protected)
router.get('/habits', authenticate, controllers.getHabits);
router.get('/habits/:id', authenticate, controllers.getHabitDetails);
router.post('/habits', authenticate, controllers.createHabit);
router.put('/habits/:id', authenticate, controllers.updateHabit);
router.delete('/habits/:id', authenticate, controllers.deleteHabit);
router.post('/habits/:id/complete', authenticate, controllers.completeHabit);
router.get('/habits/:id/history', authenticate, controllers.getHabitHistory);
router.get('/habits/:id/stats', authenticate, controllers.getHabitStats);

// Routine Routes (Protected)
router.get('/routines', authenticate, controllers.getRoutines);
router.post('/routines', authenticate, controllers.createRoutine);
router.put('/routines/:id', authenticate, controllers.updateRoutine);
router.delete('/routines/:id', authenticate, controllers.deleteRoutine);

// Todo Routes (Protected)
router.get('/todos', authenticate, controllers.getTodos);
router.post('/todos', authenticate, controllers.createTodo);
router.put('/todos/:id', authenticate, controllers.updateTodo);
router.post('/todos/:id/complete', authenticate, controllers.completeTodo);
router.delete('/todos/:id', authenticate, controllers.deleteTodo);

// Suggestions Routes (Protected)
router.get('/suggestions', authenticate, controllers.getSuggestions);

// Chat Routes (Protected)
router.post('/chat', authenticate, controllers.chat);

// Notification Routes (Protected)
router.post('/notifications/subscribe', authenticate, controllers.subscribeToNotifications);
router.post('/notifications/send', authenticate, controllers.sendNotification);
router.get('/reminders/pending', authenticate, controllers.getPendingReminders);
router.post('/reminders/schedule', authenticate, controllers.scheduleReminder);

// Test Route - Send immediate test notification
router.post('/test-notification', authenticate, (req, res) => {
  const { notificationSubscriptions, webpush } = req.app.locals;
  const userId = req.userId;
  
  console.log(`\n🧪 TEST NOTIFICATION REQUEST from user: ${userId}`);
  
  try {
    const userSubscriptions = notificationSubscriptions[userId] || [];
    console.log(`📊 Found ${userSubscriptions.length} subscription(s) for user`);
    
    if (userSubscriptions.length === 0) {
      return res.status(400).json({ error: 'No push subscriptions found - please enable notifications first' });
    }

    const testPayload = JSON.stringify({
      title: '🧪 TEST NOTIFICATION',
      body: 'This is a test notification. If you see this, push notifications are working!',
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: 'test-notification',
      data: {
        type: 'test',
        timestamp: new Date().toISOString()
      },
      actions: [
        { action: 'open', title: '✅ Got it!' }
      ],
      requireInteraction: true
    });

    console.log(`📤 Sending TEST payload to ${userSubscriptions.length} subscription(s)`);
    console.log(`📋 Payload: ${testPayload}`);
    console.log(`📏 Payload size: ${testPayload.length} bytes`);

    const sendOptions = {
      TTL: 24 * 60 * 60,
      urgency: 'high'
    };

    let successCount = 0;
    let failureCount = 0;

    userSubscriptions.forEach((subscription, index) => {
      console.log(`🚀 Attempt ${index + 1}: Sending to subscription...`);
      webpush.sendNotification(subscription, testPayload, sendOptions)
        .then(() => {
          successCount++;
          console.log(`✅✅✅ TEST NOTIFICATION SENT SUCCESSFULLY ✅✅✅`);
        })
        .catch(error => {
          failureCount++;
          console.error(`❌ Failed to send test notification:`, error.message);
          console.error(`   Error code: ${error.statusCode}`);
        });
    });

    setTimeout(() => {
      res.json({
        message: 'Test notification sent',
        subscriptions: userSubscriptions.length,
        details: `Sent to ${userSubscriptions.length} subscription(s). Check your browser.`
      });
    }, 500);

  } catch (error) {
    console.error(`❌ Test notification error:`, error);
    res.status(500).json({ error: error.message });
  }
});

// Test Route - Send test email
router.post('/test-email', (req, res) => {
  const { email, type = 'verification' } = req.body;
  
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }
  
  console.log(`\n🧪 TEST EMAIL REQUEST: type=${type}, email=${email}`);
  
  try {
    const emailService = require('./emailService');
    
    if (type === 'verification') {
      const testCode = '123456';
      const result = emailService.sendVerificationEmail(email, 'Test User', testCode);
      console.log(`✅ Verification email test sent, promise result pending...`);
      
      result.then(success => {
        if (success) {
          console.log(`✅✅✅ TEST VERIFICATION EMAIL SENT SUCCESSFULLY ✅✅✅`);
        } else {
          console.log(`❌ Test verification email returned false`);
        }
      }).catch(err => {
        console.error(`❌ Test verification email error:`, err.message);
      });
      
      res.json({ message: 'Verification email test initiated', email, code: testCode });
    } else if (type === 'reset') {
      const testCode = '654321';
      const result = emailService.sendPasswordResetEmail(email, 'Test User', testCode);
      console.log(`✅ Reset email test sent, promise result pending...`);
      
      result.then(success => {
        if (success) {
          console.log(`✅✅✅ TEST PASSWORD RESET EMAIL SENT SUCCESSFULLY ✅✅✅`);
        } else {
          console.log(`❌ Test password reset email returned false`);
        }
      }).catch(err => {
        console.error(`❌ Test password reset email error:`, err.message);
      });
      
      res.json({ message: 'Password reset email test initiated', email, code: testCode });
    } else {
      res.status(400).json({ error: 'Invalid email type. Use "verification" or "reset"' });
    }
  } catch (error) {
    console.error(`❌ Test email error:`, error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
