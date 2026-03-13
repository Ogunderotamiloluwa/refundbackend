import React, { createContext, useContext, useState, useEffect } from 'react'
import { API_URL } from '../config/apiConfig'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)
  const [theme, setTheme] = useState(() => {
    // Initialize from localStorage
    return localStorage.getItem('app-theme') || 'light'
  })

  // Apply theme whenever it changes
  useEffect(() => {
    localStorage.setItem('app-theme', theme)
    
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
      document.documentElement.classList.remove('light')
    } else {
      document.documentElement.classList.add('light')
      document.documentElement.classList.remove('dark')
    }
    
    console.log('✅ Theme applied:', theme)
  }, [theme])

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
  }

  // Verify token validity with backend
  const verifyToken = async (authToken) => {
    try {
      console.log('Verifying token with backend...');
      const response = await fetch(`${API_URL}/api/auth/verify`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      })

      if (!response.ok) {
        console.log('Token verification failed');
        return false;
      }

      console.log('Token is valid');
      // Now fetch user profile
      const profileResponse = await fetch(`${API_URL}/api/users/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      })

      if (profileResponse.ok) {
        const data = await profileResponse.json()
        setUser(data.user)
        console.log('User profile loaded');
        return true;
      }
      return false;
    } catch (err) {
      console.error('Token verification error:', err)
      return false;
    }
  }

  // Check for existing token on app load
  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('token')
      
      if (savedToken) {
        // Try to verify token with 1.5 second timeout (Netlify is usually fast if API is available)
        const verifyPromise = verifyToken(savedToken)
        const timeoutPromise = new Promise(resolve => 
          setTimeout(() => {
            console.log('Token verification timeout - API may be down');
            resolve(false)
          }, 1500)
        )
        
        const isValid = await Promise.race([verifyPromise, timeoutPromise])
        
        if (isValid) {
          setToken(savedToken)
          console.log('Token verified successfully')
        } else {
          console.log('Clearing invalid or unverifiable token');
          localStorage.removeItem('token')
          setToken(null)
          setUser(null)
        }
      }
      
      // Always finish loading immediately after token check
      setLoading(false)
    }

    initAuth()
  }, [])

  const login = (newToken, userData) => {
    console.log('Saving token to localStorage');
    localStorage.setItem('token', newToken)
    setToken(newToken)
    setUser(userData)
  }

  const logout = () => {
    console.log('Logging out - clearing token');
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
  }

  const isAuthenticated = !!token && !!user

  return (
    <AuthContext.Provider value={{ user, token, loading, isAuthenticated, login, logout, theme, toggleTheme }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
