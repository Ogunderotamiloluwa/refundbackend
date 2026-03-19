// API Configuration - Smart Backend Port Detection
// Automatically determines backend URL based on environment
// Production: uses Render backend
// Development: uses localhost

const getAPIUrl = () => {
  // Production environment - use Render backend
  if (window.location.hostname === 'personal-assistan.netlify.app' || 
      window.location.hostname.includes('netlify.app')) {
    return 'https://persona-assistant-backend.onrender.com';
  }
  
  // Development environment - use localhost
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    // Backend runs on 5005 locally in this workspace
    return 'http://localhost:5005';
  }
  
  // Default fallback to Render
  return 'https://persona-assistant-backend.onrender.com';
};

export const API_URL = getAPIUrl();

// Log configuration
console.clear();
console.log('FRONTEND LOADED');
console.log('════════════════════════════════════════');
console.log('API Configuration Loaded');
console.log('Frontend URL:', window.location.href);
console.log('Hostname:', window.location.hostname);
console.log('Port:', window.location.port || '3000');
console.log('Backend API:', API_URL);
console.log('════════════════════════════════════════');

export default API_URL;
