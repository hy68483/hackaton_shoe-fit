import { apiRequest } from './client'
import type { ApiResponse } from '../types/api'

export type AuthUser = {
  id: string
  login_id: string
  name: string
  email: string | null
  role: string
}

export type AuthTokens = {
  access_token: string
  refresh_token: string
}

export type LoginData = AuthTokens & {
  token_type: string
  expires_in: number
}

export function signup(payload: {
  login_id: string
  password: string
  name: string
  email?: string | null
}) {
  return apiRequest<ApiResponse<{ user: AuthUser } & AuthTokens>>('/auth/signup', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function login(payload: { login_id: string; password: string }) {
  return apiRequest<ApiResponse<LoginData>>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function getCurrentUser(accessToken: string) {
  return apiRequest<ApiResponse<{ user: AuthUser }>>('/auth/me', {
    token: accessToken,
  })
}
