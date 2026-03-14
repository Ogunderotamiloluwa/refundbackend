// Custom Command Detector for Chat
// Identifies when a user message is a custom command vs general question

const CUSTOM_COMMAND_KEYWORDS = {
  // Habit queries
  habit: ['habit', 'habits', 'habbit', 'habbit'],
  habit_detail: ['habit detail', 'habit details', 'show habit', 'all habit'],
  habit_progress: ['habit progress', 'how am i doing', 'habit streak'],
  
  // Routine queries
  routine: ['routine', 'routines', 'schedule'],
  routine_detail: ['routine detail', 'routine details', 'show routine', 'all routine'],
  
  // Todo queries
  todo: ['todo', 'todos', 'task', 'tasks', 'list', 'what do i need'],
  todo_detail: ['todo detail', 'todo details', 'all todo', 'show todo'],
  
  // Stats/Analytics
  stats: ['stat', 'stats', 'analytics', 'progress', 'completion'],
  
  // Motivation/Encouragement (not custom command, goes to LLM)
  encourage: ['motivate', 'inspire', 'encourage', 'help me', 'advice'],
  
  // General questions (goes to LLM)
  general: ['what', 'how', 'why', 'when', 'where', 'who', 'tell me', 'explain', 'help', 'should']
};

/**
 * Check if a message is a custom command
 * Returns { isCustom: boolean, type: string }
 */
const isCustomCommand = (message) => {
  const msgLower = message.toLowerCase();
  
  // Check for specific custom command patterns
  const customPatterns = [
    // Habit details - Show ALL habit information
    { pattern: /habit.*detail|detail.*habit|show.*habit|all.*habit/, type: 'habit_detail' },
    { pattern: /habit.*(progress|streak|doing)/i, type: 'habit_progress' },
    
    // Routine details
    { pattern: /routine.*detail|detail.*routine|show.*routine|all.*routine/, type: 'routine_detail' },
    
    // Todo details
    { pattern: /todo.*detail|task.*detail|detail.*(todo|task)|show.*(todo|task)|all.*(todo|task)|list.*(todo|task)/, type: 'todo_detail' },
    
    // Stats/Analytics
    { pattern: /statistic|analytics|completion.*rate|how.*(doing|am i)/, type: 'stats' }
  ];
  
  for (const { pattern, type } of customPatterns) {
    if (pattern.test(msgLower)) {
      return { isCustom: true, type };
    }
  }
  
  // If it references specific data request, it's custom
  if (msgLower.includes('detail') || msgLower.includes('show all') || msgLower.includes('breakdown')) {
    return { isCustom: true, type: 'data_request' };
  }
  
  // Everything else goes to LLM
  return { isCustom: false, type: 'general_question' };
};

/**
 * Get command documentation
 */
const getCommandHelp = () => {
  return `Available commands:
  
🎯 Habits:
  - "Show habit details" - See all your habits with progress
  - "Habit progress" - Check your streaks and completion rates
  
📅 Routines:
  - "Show routine details" - See all your routines
  - "Routine breakdown" - Get detailed routine information
  
✅ Todos:
  - "Show todo details" - See all your tasks
  - "Todo list breakdown" - Get detailed task information
  
📊 Stats:
  - "My analytics" - See completion rates and statistics
  
💬 General:
  For anything else, just ask! I'll use my AI brain to help you.`;
};

module.exports = {
  isCustomCommand,
  getCommandHelp,
  CUSTOM_COMMAND_KEYWORDS
};
