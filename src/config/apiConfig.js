// API Configuration - Works for Local Development and Production Deployment
// Supports: Localhost, Netlify Frontend, Render Backend

const getAPIUrl = () => {
  // Priority 1: Environment Variable (use VITE_API_URL from .env or build config)
  if (import.meta.env.VITE_API_URL) {
    console.log('✅ Using VITE_API_URL from environment:', import.meta.env.VITE_API_URL);
    return import.meta.env.VITE_API_URL;
  }
  
  // Priority 2: Local Development
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    const localUrl = 'http://localhost:5007';
    console.log('✅ Local development - Using:', localUrl);
    return localUrl;
  }
  
  // Priority 3: Production Deployment
  // If deployed on Netlify, backend is typically on Render with a custom domain
  // or as a proxy. Default to assuming backend is on same domain with /api proxy
  if (window.location.protocol === 'https:') {
    // Try to use relative path first (requires proxy setup in Netlify)
    // This assumes you've set up a rewrite rule in netlify.toml
    if (window.location.hostname.includes('netlify.app')) {
      console.log('✅ Netlify deployment - Using relative API path');
      return '/api';
    }
    
    // If on custom domain, try to construct backend URL
    // Replace frontend domain with backend domain if available
    const apiUrl = `https://${window.location.hostname}:5007`;
    console.log('✅ HTTPS Production - Using:', apiUrl);
    return apiUrl;
  }
  
  // Fallback
  const fallbackUrl = `http://${window.location.hostname}:5007`;
  console.log('✅ Fallback - Using:', fallbackUrl);
  return fallbackUrl;
};

export const API_URL = getAPIUrl();

console.log('🔗 Frontend API Configuration:');
console.log('   - Hostname:', window.location.hostname);
console.log('   - Protocol:', window.location.protocol);
console.log('   - VITE_API_URL:', import.meta.env.VITE_API_URL || 'not set');
console.log('   - Resolved to:', API_URL);

export default API_URL;
