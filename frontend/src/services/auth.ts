import api from './api'
import type { User } from '@/types'

export interface LoginResponse {
  success: boolean
  token: string
  data: {
    user: User
  }
}

export interface RegisterResponse {
  success: boolean
  token: string
  data: {
    user: User
  }
}

export interface ProfileResponse {
  success: boolean
  data: {
    user: User
  }
}

export const authService = {
  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await api.post('/auth/login', { email, password })
    return response.data
  },

  async register(userData: {
    name: string
    email: string
    password: string
    phone: string
    role?: string
  }): Promise<RegisterResponse> {
    const response = await api.post('/auth/register', userData)
    return response.data
  },

  async getProfile(): Promise<User> {
    const response = await api.get('/auth/me')
    return response.data.data.user
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<LoginResponse> {
    const response = await api.post('/auth/change-password', { currentPassword, newPassword })
    return response.data
  }
}