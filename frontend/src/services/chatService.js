// Frontend Chat Service
// Handles communication with backend LLM service

import { API_URL } from '../config/apiConfig'

/**
 * Send message to chat API
 * Returns { response, model, context }
 */
export const sendChatMessage = async (message, token) => {
  if (!message || !message.trim()) {
    throw new Error('Message cannot be empty')
  }

  if (!token) {
    throw new Error('Authentication required')
  }

  try {
    const response = await fetch(`${API_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message: message.trim() }),
      timeout: 30000 // 30 second timeout
    })

    if (!response.ok) {
      // Handle specific HTTP errors
      if (response.status === 401) {
        throw new Error('Session expired - please log in again')
      }
      if (response.status === 403) {
        throw new Error('Permission denied')
      }
      if (response.status === 500) {
        throw new Error('Backend error - please try again')
      }
      
      const contentType = response.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        try {
          const errorData = await response.json()
          throw new Error(errorData.error || `Server error (${response.status})`)
        } catch (e) {
          throw new Error(`Server error (${response.status})`)
        }
      } else {
        throw new Error('Backend service unavailable - is it running?')
      }
    }

    const data = await response.json()
    
    if (!data.response) {
      throw new Error('No response from AI')
    }

    return {
      response: data.response,
      model: data.model || 'Unknown',
      context: data.context || {},
      timestamp: new Date()
    }

  } catch (err) {
    console.error('Chat service error:', err)
    
    // Provide helpful error messages
    if (err.message.includes('fetch')) {
      throw new Error('Network error - check your connection')
    }
    
    throw err
  }
};

/**
 * Detect if message will trigger custom command or LLM
 */
export const predictMessageType = (message) => {
  const msgLower = message.toLowerCase()
  
  const customPatterns = [
    /habit.*detail|detail.*habit|show.*habit|all.*habit/,
    /habit.*(progress|streak|doing)/i,
    /routine.*detail|detail.*routine|show.*routine|all.*routine/,
    /todo.*detail|task.*detail|detail.*(todo|task)|show.*(todo|task)|all.*(todo|task)/,
    /statistic|analytics|completion.*rate|how.*(doing|am i)/,
    /breakdown|detail|show all/
  ]
  
  for (const pattern of customPatterns) {
    if (pattern.test(msgLower)) {
      return 'custom_command'
    }
  }
  
  return 'llm_general'
};

/**
 * Format bot response for display
 * Handles markdown and special formatting
 */
export const formatBotResponse = (text) => {
  if (!text) return ''
  
  // Convert markdown bold to emphasized text (already supports markdown)
  // Keep as-is since frontend markdown rendering handles it
  return text;
};

/**
 * Get helpful hints based on message
 */
export const getMessageHint = (message) => {
  const msgType = predictMessageType(message)
  
  if (msgType === 'custom_command') {
    return '📋 This will fetch your data'
  }
  
  return '🤖 This will use AI to answer'
};

/**
 * Validate message before sending
 */
export const validateMessage = (message) => {
  if (!message) {
    return { valid: false, error: 'Message cannot be empty' }
  }
  
  if (message.trim().length === 0) {
    return { valid: false, error: 'Message cannot be empty' }
  }
  
  if (message.length > 2000) {
    return { valid: false, error: 'Message too long (max 2000 characters)' }
  }
  
  return { valid: true }
};
