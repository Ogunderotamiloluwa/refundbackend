// Routes - API Endpoints
const express = require('express');
const router = express.Router();
const controllers = require('./controllers');
const { register, login, verify, authenticate } = require('./auth');

// Auth Routes (Public)
router.post('/auth/register', register);
router.post('/auth/login', login);
router.get('/auth/verify', verify);
router.post('/auth/verify-email', controllers.verifyEmailCode);

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

module.exports = router;
