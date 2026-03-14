// Advanced LLM Service with Fallback Support
// Primary: Grok (xAI)
// Fallback 1: OpenAI (GPT-4)
// Fallback 2: Google Gemini
require('dotenv').config();

const GROK_API_KEY = process.env.GROK_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

console.log('🤖 LLM Service Initialization:');
console.log('   🧠 Grok:', GROK_API_KEY ? '✅ Loaded' : '❌ Not configured');
console.log('   🧠 OpenAI:', OPENAI_API_KEY ? '✅ Loaded' : '❌ Not configured');
console.log('   🧠 Gemini:', GEMINI_API_KEY ? '✅ Loaded' : '❌ Not configured');

/**
 * Build system prompt for LLM
 */
const buildSystemPrompt = () => {
  return `You are a personal AI assistant named "Boss Commander" designed to help users with their personal development, productivity, and wellness.

Your personality:
- Motivational and action-oriented (not passive)
- Use "boss", "chief", "legend" when addressing the user
- Concise, direct, and practical
- Encouraging but honest
- Focus on actionable advice

Your responsibilities:
- Help users stay motivated and on track with their habits, routines, and todos
- Provide personalized advice based on their data
- Ask clarifying questions when needed
- Keep responses focused and to the point
- Suggest tasks, habits, or routines when appropriate

Response Guidelines:
- Keep responses under 300 tokens
- Be encouraging and energetic
- Use markdown formatting for clarity
- Reference user's specific habits/todos when relevant
- Provide actionable steps, not just theory`;
};

/**
 * Build user context for better LLM responses
 */
const buildUserContext = (userHabits, userRoutines, userTodos, userName) => {
  let context = `User Profile:\n`;
  context += `- Name: ${userName || 'Chief'}\n`;
  
  if (userHabits.length > 0) {
    context += `\nActive Habits (${userHabits.length}):\n`;
    userHabits.forEach((h, idx) => {
      context += `${idx + 1}. ${h.name} (${h.frequency}, ${h.progress}% complete, ${h.streak}-day streak)\n`;
    });
  }
  
  if (userRoutines.length > 0) {
    context += `\nRoutines (${userRoutines.length}):\n`;
    userRoutines.forEach((r, idx) => {
      context += `${idx + 1}. ${r.name} at ${r.time || 'flexible'}\n`;
    });
  }
  
  if (userTodos.length > 0) {
    context += `\nActive Todos (${userTodos.length}):\n`;
    userTodos.slice(0, 5).forEach((t, idx) => { // Show top 5
      context += `${idx + 1}. ${t.title} (${t.priority || 'normal'} priority)\n`;
    });
    if (userTodos.length > 5) {
      context += `... and ${userTodos.length - 5} more\n`;
    }
  }
  
  return context;
};

/**
 * Call Grok API (xAI)
 */
const callGrokAPI = async (userMessage, systemPrompt, userContext) => {
  try {
    if (!GROK_API_KEY) {
      console.log('⚠️ Grok API key not configured');
      return null;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const fullPrompt = `${userContext}\n\nUser: ${userMessage}`;

    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROK_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'grok-beta',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: fullPrompt }
        ],
        temperature: 0.7,
        max_tokens: 500,
        top_p: 0.9
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error('❌ Grok API error:', response.status, response.statusText);
      return null;
    }

    const data = await response.json();
    
    if (data.choices && data.choices[0] && data.choices[0].message) {
      console.log('✅ Grok response received');
      return data.choices[0].message.content;
    }

    return null;
  } catch (err) {
    console.error('❌ Grok API call failed:', err.message);
    return null;
  }
};

/**
 * Call OpenAI API
 */
const callOpenAIAPI = async (userMessage, systemPrompt, userContext) => {
  try {
    if (!OPENAI_API_KEY) {
      console.log('⚠️ OpenAI API key not configured');
      return null;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const fullPrompt = `${userContext}\n\nUser: ${userMessage}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: fullPrompt }
        ],
        temperature: 0.7,
        max_tokens: 500,
        top_p: 0.9
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error('❌ OpenAI API error:', response.status, response.statusText);
      return null;
    }

    const data = await response.json();
    
    if (data.choices && data.choices[0] && data.choices[0].message) {
      console.log('✅ OpenAI response received');
      return data.choices[0].message.content;
    }

    return null;
  } catch (err) {
    console.error('❌ OpenAI API call failed:', err.message);
    return null;
  }
};

/**
 * Call Google Gemini API
 */
const callGeminiAPI = async (userMessage, systemPrompt, userContext) => {
  try {
    if (!GEMINI_API_KEY) {
      console.log('⚠️ Gemini API key not configured');
      return null;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const fullPrompt = `${systemPrompt}\n\n${userContext}\n\nUser: ${userMessage}`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: fullPrompt }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 500,
          topP: 0.9
        }
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error('❌ Gemini API error:', response.status, response.statusText);
      return null;
    }

    const data = await response.json();
    
    if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0]) {
      console.log('✅ Gemini response received');
      return data.candidates[0].content.parts[0].text;
    }

    return null;
  } catch (err) {
    console.error('❌ Gemini API call failed:', err.message);
    return null;
  }
};

/**
 * Get LLM response with fallback logic
 * Tries Grok first, falls back to OpenAI, then Gemini
 */
const getLLMResponse = async (userMessage, userHabits, userRoutines, userTodos, userName) => {
  try {
    const systemPrompt = buildSystemPrompt();
    const userContext = buildUserContext(userHabits, userRoutines, userTodos, userName);

    console.log('🔄 Attempting LLM chain: Grok → OpenAI → Gemini');

    // Try Grok first
    console.log('1️⃣ Trying Grok...');
    let response = await callGrokAPI(userMessage, systemPrompt, userContext);
    if (response) {
      console.log('✅ Grok succeeded');
      return { response, model: 'Grok' };
    }

    // Fallback to OpenAI
    console.log('2️⃣ Grok failed, trying OpenAI...');
    response = await callOpenAIAPI(userMessage, systemPrompt, userContext);
    if (response) {
      console.log('✅ OpenAI succeeded');
      return { response, model: 'OpenAI GPT-4' };
    }

    // Final fallback to Gemini
    console.log('3️⃣ OpenAI failed, trying Gemini...');
    response = await callGeminiAPI(userMessage, systemPrompt, userContext);
    if (response) {
      console.log('✅ Gemini succeeded');
      return { response, model: 'Google Gemini' };
    }

    // All failed
    console.log('❌ All LLM services failed');
    return null;

  } catch (err) {
    console.error('❌ LLM service error:', err.message);
    return null;
  }
};

module.exports = {
  getLLMResponse,
  buildSystemPrompt,
  buildUserContext
};
