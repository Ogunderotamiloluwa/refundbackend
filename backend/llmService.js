// Advanced LLM Service with Fallback Support
// Primary: Grok (xAI)
// Fallback 1: OpenAI (GPT-4)
// Fallback 2: Google Gemini
require('dotenv').config();

// GROQ configuration (Groq's OpenAI-compatible endpoint)
const GROQ_API_KEY = process.env.GROQ_API_KEY || process.env.GROK_API_KEY;
const GROQ_BASE_URL = process.env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1';

console.log('🤖 LLM Service Initialization (Groq-only):');
console.log('   🧠 Groq:', GROQ_API_KEY ? '✅ Loaded' : '❌ Not configured');
console.log('   🌐 Groq Base URL:', GROQ_BASE_URL);
const GROQ_MODELS = [
  'allam-2-7b',
  'groq/compound',
  'groq/compound-mini',
  'llama-3.1-8b-instant',
  'llama-3.3-70b-versatile',
  'meta-llama/llama-4-scout-17b-16e-instruct',
  'meta-llama/llama-4-scout-17b-16e-instruct',
  'moonshotai/kimi-k2-instruct',
  'moonshotai/kimi-k2-instruct-0905',
  'openai/gpt-oss-120b',
  'openai/gpt-oss-20b',
  'openai/gpt-oss-safeguard-20b',
  'qwen/qwen3-32b'
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
  return `You are a personal AI assistant named "Boss Commander" designed to help users with their personal development, productivity, and wellness.

Your personality:
- Motivational and action-oriented (not passive)
- Always address the user using the titles "boss" and "sir". Do NOT use other nicknames like "chief" or "legend".
- Use "boss" and "sir" respectfully and consistently when addressing the user.
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
 * Tries Grok first, then OpenAI, then Gemini
 */
const getLLMResponse = async (userMessage, userHabits, userRoutines, userTodos, userName) => {
  try {
    const systemPrompt = buildSystemPrompt();
    const userContext = buildUserContext(userHabits, userRoutines, userTodos, userName);

    console.log('🔄 Attempting Groq models (in provided order)...');

    for (const model of GROQ_MODELS) {
      try {
        console.log(`🔁 Trying Groq model: ${model}`);
        const resp = await callGroqModel(model, userMessage, systemPrompt, userContext);
        if (resp) {
          console.log(`✅ Groq model succeeded: ${model}`);
          return { response: resp, model: `groq:${model}` };
        }
      } catch (err) {
        console.error(`❌ Error trying model ${model}:`, err.message);
      }
    }

    console.log('❌ All Groq models failed');
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
