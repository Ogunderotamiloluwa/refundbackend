// Advanced LLM Service with Fallback Support
// Primary: Groq (Fast inference)
// Fallback 1: OpenAI (GPT-4)
// Fallback 2: Google Gemini
require('dotenv').config();

// GROQ configuration - High-speed inference API
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_BASE_URL = 'https://api.groq.com/openai/v1';

// OpenAI configuration
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const GROK_API_KEY = process.env.GROK_API_KEY || process.env.XAI_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

console.log('🤖 LLM Service Initialization:');
console.log('   🚀 Groq:', GROQ_API_KEY ? '✅ Loaded' : '❌ Not configured');
console.log('   📱 OpenAI:', OPENAI_API_KEY ? '✅ Loaded' : '❌ Not configured');
console.log('   ☄️ Gemini:', GEMINI_API_KEY ? '✅ Loaded' : '❌ Not configured');

// Real Groq models (as of 2026) - UPDATED: mixtral-8x7b-32768 is decommissioned
const GROQ_MODELS = [
  'llama-3.3-70b-versatile', // Most capable and fast
  'llama-3.1-70b-versatile', // Good balance
  'llama-3.1-8b-instant',    // Fast and lightweight
  'gemma-7b-it'              // Efficient
];

const callGroqModel = async (model, userMessage, systemPrompt, userContext) => {
  try {
    if (!GROQ_API_KEY) {
      console.log('⚠️ GROQ API key not configured');
      return null;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    const fullPrompt = `${systemPrompt}\n\n${userContext}\n\nUser: ${userMessage}`;

    const url = `${GROQ_BASE_URL}/chat/completions`;
    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: fullPrompt }
        ],
        temperature: 0.7,
        max_tokens: 500
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!resp.ok) {
      const body = await resp.text().catch(() => '');
      console.error(`❌ GROQ (${model}) error:`, resp.status, body || resp.statusText);
      return null;
    }

    const data = await resp.json().catch(() => null);
    if (!data) return null;

    // OpenAI-compatible response parsing
    if (data.choices && data.choices[0] && data.choices[0].message) {
      return data.choices[0].message.content;
    }
    if (data.choices && data.choices[0] && data.choices[0].text) {
      return data.choices[0].text;
    }
    // Fallback: try top-level text
    if (data.text) return data.text;
    return null;
  } catch (err) {
    console.error(`❌ GROQ (${model}) call failed:`, err.message);
    return null;
  }
};

/**
 * Build system prompt for LLM
 */
const buildSystemPrompt = () => {
  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  const timeStr = today.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit' 
  });

  return `You are "Boss Commander", an elite AI assistant for the Personal Assistant app - a comprehensive productivity and wellness platform.

=== PROJECT CONTEXT ===
APP NAME: Personal Assistant
PURPOSE: Help users build habits, create routines, manage todos, get AI insights, and stay productive
PRIMARY FEATURES:
- 📊 HABITS: Track daily/weekly/monthly habits with progress tracking, streaks, and weather preferences
- 📅 ROUTINES: Create recurring schedules with multiple tasks, time-based triggers, and repeat patterns  
- ✅ TODOS: Manage tasks with priority levels, locations, scheduled times, and completion tracking
- 💬 CHAT: You (Boss Commander) - the AI assistant who understands their goals and provides smart advice
- 🌤️ WEATHER: Real-time weather data integrated with habit and routine recommendations
- 🔔 NOTIFICATIONS: Push notifications for habits, routines, and todos (both in-app and browser)

CURRENT ENVIRONMENT:
- Current date: ${dateStr}
- Current time: ${timeStr}
- Your name: Boss Commander (not ChatGPT, not an assistant - YOU are Boss Commander)
- User address: "boss" and "sir"

YOUR CORE MISSION:
1. Understand the user's habits, routines, and todos from their actual data
2. Provide hyper-personalized productivity advice based on THEIR SPECIFIC GOALS
3. Answer questions about the app, their data, and general knowledge accurately
4. Be motivational, direct, and action-oriented - no vague platitudes
5. Help them optimize their workflow, build streaks, and accomplish their goals

COMMUNICATION STYLE:
- Direct and concise - get straight to the point ("Keep it real, boss")
- Professional but warm - like a motivational coach who knows them personally
- Address as "boss" or "sir" (NEVER "chief", "legend", "friend", or other generic terms)
- Minimal emoji/exclamation marks - let substance speak
- Confident and honest - admit if you don't know something
- ALWAYS reference their actual habits, routines, and todos when relevant

RESPONSE GUIDELINES:
- Limit to 300 tokens unless they ask for detailed info
- Use markdown formatting (bold, bullet points) for readability
- When referencing their data, be SPECIFIC with numbers and names
- Provide 2-3 actionable next steps when giving advice
- For data queries: use their actual stored information
- For general questions: answer accurately based on your training knowledge
- For motivation: be specific to their situation, not generic

CAPABILITIES YOU CAN DISCUSS:
- How to create/edit/delete habits, routines, and todos
- Best practices for habit building and streak maintenance
- Routine optimization and time management
- Todo prioritization and scheduling
- Weather impact on outdoor activities
- How notifications work in the app
- Data sync across devices
- Performance tips and productivity hacks

IMPORTANT BEHAVIORAL RULES:
- When user asks about TODAY's date: Always say "${dateStr}"
- When discussing habits: Reference their current streak, progress %, and frequency
- When discussing routines: Reference their scheduled time and repeat pattern  
- When discussing todos: Reference priority level and scheduled time
- If they ask "what can you do": Explain you help with habits, routines, todos, motivation, and general questions
- If they mention creating something: Acknowledge their action and provide next steps
- If they ask for project info: Explain they're using Personal Assistant - a full productivity platform

BE THEIR PRODUCTIVITY PARTNER:
- Know their goals through their habits/routines/todos
- Anticipate what they might need next based on their data
- Challenge them respectfully when they're underperforming
- Celebrate wins when they hit streaks or complete todos
- Give context-specific advice (morning routine tips, evening wind-down advice, etc.)

TODAY'S DATE FOR REFERENCE: ${dateStr}`;
};

/**
 * Build user context for better LLM responses
 */
const buildUserContext = (userHabits, userRoutines, userTodos, userName) => {
  let context = `User: ${userName || 'Boss'}\n\n`;
  
  if (userHabits.length > 0) {
    context += `📊 HABITS (${userHabits.length}):\n`;
    userHabits.forEach((h) => {
      context += `  • ${h.name}: ${h.progress}% complete, ${h.streak} day streak, ${h.frequency}\n`;
    });
    context += '\n';
  }
  
  if (userRoutines.length > 0) {
    context += `📅 ROUTINES (${userRoutines.length}):\n`;
    userRoutines.forEach((r) => {
      context += `  • ${r.name} at ${r.time || 'flexible'}\n`;
    });
    context += '\n';
  }
  
  if (userTodos.length > 0) {
    context += `✅ ACTIVE TODOS (${userTodos.length} total):\n`;
    userTodos.slice(0, 3).forEach((t) => {
      context += `  • ${t.title} (${t.priority || 'normal'} priority)\n`;
    });
    if (userTodos.length > 3) {
      context += `  ... and ${userTodos.length - 3} more\n`;
    }
    context += '\n';
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
        model: 'grok-vision-beta',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: fullPrompt }
        ],
        temperature: 0.7,
        max_tokens: 500
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ Grok API error:', response.status, JSON.stringify(errorData, null, 2) || response.statusText);
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
        model: 'gpt-4o-mini',
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
      const body = await response.text().catch(() => '');
      console.error('❌ OpenAI API error:', response.status, body || response.statusText);
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

    // First try listing available models to select a supported endpoint
    try {
      const listResp = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${GEMINI_API_KEY}`);
      if (listResp.ok) {
        const listData = await listResp.json().catch(() => null);
        const models = listData?.models || [];
        // Prefer models that contain 'text' or 'bison' or 'gemini'
        const preferred = models.find(m => /text|bison|gemini/i.test(m.name)) || models[0];
        if (preferred && preferred.name) {
          const modelName = preferred.name; // e.g. "models/text-bison-001"
          console.log('🔎 Gemini selected model:', modelName);

          const genUrl = `https://generativelanguage.googleapis.com/v1/${modelName}:generateText?key=${GEMINI_API_KEY}`;
          const response = await fetch(genUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prompt: fullPrompt,
              temperature: 0.7,
              maxOutputTokens: 500,
              topP: 0.9
            }),
            signal: controller.signal
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            const errBody = await response.text().catch(() => '');
            console.error('❌ Gemini API error (generate):', response.status, errBody || response.statusText);
            return null;
          }

          const data = await response.json().catch(() => null);
          // Newer Gemini responses may have 'candidates' or 'text'
          if (data?.candidates && data.candidates[0]) {
            console.log('✅ Gemini response received (candidates)');
            return data.candidates[0].content?.parts?.[0]?.text || data.candidates[0].text || null;
          }
          if (data?.output?.[0]?.content?.[0]?.text) {
            console.log('✅ Gemini response received (output)');
            return data.output[0].content[0].text;
          }
          if (data?.text) {
            console.log('✅ Gemini response received (text)');
            return data.text;
          }
          return null;
        }
      } else {
        const err = await listResp.text().catch(() => '');
        console.error('❌ Gemini ListModels failed:', listResp.status, err || listResp.statusText);
      }
    } catch (err) {
      console.error('❌ Gemini model discovery failed:', err.message);
    }

    // Fallback: try the older v1beta generateContent endpoint if available
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 500, topP: 0.9 }
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Gemini API error (fallback):', response.status, JSON.stringify(errorData, null, 2) || response.statusText);
        return null;
      }

      const data = await response.json();
      if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0]) {
        console.log('✅ Gemini response received (fallback)');
        return data.candidates[0].content.parts[0].text;
      }
      return null;
    } catch (err) {
      console.error('❌ Gemini API call failed (both attempts):', err.message);
      return null;
    }
  } catch (err) {
    console.error('❌ Gemini API call failed:', err.message);
    return null;
  }
};

/**
 * Get LLM response with fallback logic
 * Tries Groq first, then OpenAI, then Gemini
 */
const getLLMResponse = async (userMessage, userHabits, userRoutines, userTodos, userName) => {
  try {
    const systemPrompt = buildSystemPrompt();
    const userContext = buildUserContext(userHabits, userRoutines, userTodos, userName);

    // ATTEMPT 1: GROQ (Fastest, highest quality)
    console.log('🚀 Attempting Groq models...');
    for (const model of GROQ_MODELS) {
      try {
        console.log(`   ↳ Trying: ${model}`);
        const resp = await callGroqModel(model, userMessage, systemPrompt, userContext);
        if (resp) {
          console.log(`✅ Groq succeeded with: ${model}`);
          return { response: resp, model: `groq:${model}` };
        }
      } catch (err) {
        console.error(`   ⚠️ ${model} failed:`, err.message);
      }
    }

    // ATTEMPT 2: OpenAI (Reliable fallback)
    console.log('📱 Groq failed, trying OpenAI...');
    if (OPENAI_API_KEY) {
      try {
        const openaiResp = await callOpenAIAPI(userMessage, systemPrompt, userContext);
        if (openaiResp) {
          console.log('✅ OpenAI succeeded');
          return { response: openaiResp, model: 'openai:gpt-4o-mini' };
        }
      } catch (err) {
        console.error('⚠️ OpenAI failed:', err.message);
      }
    } else {
      console.log('⚠️ OpenAI API key not configured');
    }

    // ATTEMPT 3: Gemini (Final fallback)
    console.log('🌐 OpenAI failed, trying Gemini...');
    if (GEMINI_API_KEY) {
      try {
        const geminiResp = await callGeminiAPI(userMessage, systemPrompt, userContext);
        if (geminiResp) {
          console.log('✅ Gemini succeeded');
          return { response: geminiResp, model: 'gemini' };
        }
      } catch (err) {
        console.error('⚠️ Gemini failed:', err.message);
      }
    } else {
      console.log('⚠️ Gemini API key not configured');
    }

    console.log('❌ All LLM services failed - returning null for fallback handling');
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
