import React, { createContext, useContext, useEffect, useState } from 'react'
import { useGoogleLogin } from '@react-oauth/google'
import axios from 'axios'

interface User {
  id: string
  email: string
  name?: string
  picture?: string
  language?: string
  persona?: string
  onboarded: boolean
}

interface AuthContextType {
  user: User | null
  token: string | null
  loading: boolean
  login: (credential: string) => Promise<void>
  testLogin: () => Promise<boolean>
  signOut: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const API_URL = import.meta.env.VITE_API_URL || ''

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    const token = localStorage.getItem('token')

    if (storedUser && token) {
      setUser(JSON.parse(storedUser))
      setToken(token)
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    }
    setLoading(false)
  }, [])

  // No change to the state, but we will use the standard GoogleLogin component in LoginPage for ID tokens.
  // We can keep useGoogleLogin if we want, but for simplicity with existing backend logic:

  const handleLoginSuccess = async (credential: string) => {
    try {
      setLoading(true)
      const res = await axios.post(`${API_URL}/api/auth/google`, {
        token: credential, // This will be the ID Token (JWT)
      })

      const { user: userData, token: newToken } = res.data
      setUser(userData)
      setToken(newToken)
      localStorage.setItem('user', JSON.stringify(userData))
      localStorage.setItem('token', newToken)
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`
    } catch (error: any) {
      console.error('Google login error stack:', error)
      const errorMessage = error.response?.data?.error || error.message || 'Unknown login error';
      alert(`Login Failed! backend said: ${errorMessage}\n\nDetails: ` + JSON.stringify(error.response?.data || {}, null, 2));
      throw error;
    } finally {
      setLoading(false)
    }
  }

  const googleLogin = () => {
    // This will be triggered by the GoogleLogin component or similar
  }

  const testLogin = async () => {
    try {
      setLoading(true)
      const res = await axios.post(`${API_URL}/api/auth/test`)
      const { user: userData, token: newToken } = res.data
      setUser(userData)
      setToken(newToken)
      localStorage.setItem('user', JSON.stringify(userData))
      localStorage.setItem('token', newToken)
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`
      return true
    } catch (error) {
      console.error('Test login error:', error)
      return false
    } finally {
      setLoading(false)
    }
  }

  const signOut = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('user')
    localStorage.removeItem('token')
    delete axios.defaults.headers.common['Authorization']
  }

  const value = {
    user,
    token,
    loading,
    login: handleLoginSuccess,
    testLogin,
    signOut
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}