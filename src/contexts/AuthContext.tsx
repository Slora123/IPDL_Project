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
  loading: boolean
  login: () => void
  signOut: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    const token = localStorage.getItem('token')

    if (storedUser && token) {
      setUser(JSON.parse(storedUser))
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    }
    setLoading(false)
  }, [])

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        setLoading(true)
        const res = await axios.post(`${API_URL}/api/auth/google`, {
          token: tokenResponse.access_token,
        })

        const { user: userData, token } = res.data
        setUser(userData)
        localStorage.setItem('user', JSON.stringify(userData))
        localStorage.setItem('token', token)
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      } catch (error) {
        console.error('Google login error:', error)
      } finally {
        setLoading(false)
      }
    },
    onError: (error) => console.error('Login Failed:', error),
  })

  const signOut = () => {
    setUser(null)
    localStorage.removeItem('user')
    localStorage.removeItem('token')
    delete axios.defaults.headers.common['Authorization']
  }

  const value = {
    user,
    loading,
    login: googleLogin,
    signOut
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}