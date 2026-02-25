import React, { createContext, useContext, useState, useEffect } from 'react'
import { API_URL } from '../config/apiConfig'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)

  // Verify token validity with backend
  const verifyToken = async (authToken) => {
    try {
      console.log('🔐 Verifying token with backend...');
      const response = await fetch(`${API_URL}/api/auth/verify`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      })

      if (!response.ok) {
        console.log('❌ Token verification failed');
        return false;
      }

      console.log('✅ Token is valid');
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
        console.log('✅ User profile loaded');
        return true;
      }
      return false;
    } catch (err) {
      console.error('❌ Token verification error:', err)
      return false;
    }
  }

  // Check for existing token on app load
  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('token')
      
      if (savedToken) {
        // Verify token is still valid
        const isValid = await verifyToken(savedToken)
        if (isValid) {
          setToken(savedToken)
        } else {
          // Token is invalid, clear it
          console.log('🗑️ Clearing invalid token');
          localStorage.removeItem('token')
          setToken(null)
          setUser(null)
        }
      }
      
      setLoading(false)
    }

    initAuth()
  }, [])

  const login = (newToken, userData) => {
    console.log('📝 Saving token to localStorage');
    localStorage.setItem('token', newToken)
    setToken(newToken)
    setUser(userData)
  }

  const logout = () => {
    console.log('👋 Logging out - clearing token');
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
  }

  const isAuthenticated = !!token && !!user

  return (
    <AuthContext.Provider value={{ user, token, loading, isAuthenticated, login, logout }}>
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
