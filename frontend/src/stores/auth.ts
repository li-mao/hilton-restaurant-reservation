import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User } from '@/types'
import { authService } from '@/services/auth'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const token = ref<string | null>(localStorage.getItem('token'))

  const isAuthenticated = computed(() => !!token.value)
  const isEmployee = computed(() => user.value?.role === 'employee' || user.value?.role === 'admin')

  const login = async (email: string, password: string) => {
    try {
      const response = await authService.login(email, password)
      token.value = response.token
      user.value = response.data.user
      localStorage.setItem('token', response.token)
      return response
    } catch (error) {
      throw error
    }
  }

  const register = async (userData: {
    name: string
    email: string
    password: string
    phone: string
    role?: string
  }) => {
    try {
      const response = await authService.register(userData)
      token.value = response.token
      user.value = response.data.user
      localStorage.setItem('token', response.token)
      return response
    } catch (error) {
      throw error
    }
  }

  const logout = () => {
    token.value = null
    user.value = null
    localStorage.removeItem('token')
  }

  const fetchProfile = async () => {
    if (!token.value) return

    try {
      const profile = await authService.getProfile()
      user.value = profile
    } catch (error) {
      logout()
      throw error
    }
  }

  const initializeAuth = () => {
    if (token.value) {
      fetchProfile()
    }
  }

  return {
    user,
    token,
    isAuthenticated,
    isEmployee,
    login,
    register,
    logout,
    fetchProfile,
    initializeAuth
  }
})