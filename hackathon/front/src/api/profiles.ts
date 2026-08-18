import { apiRequest } from './client'
import type { ApiResponse } from '../types/api'

export type FootProfileData = {
  foot_length_mm: number
  foot_width_mm: number
  confidence: number | null
  measurement_id: string | null
  measured_at: string | null
}

export function applyFootProfile(
  accessToken: string,
  payload: {
    measurement_id?: string | null
    foot_length_mm: number
    foot_width_mm: number
    confidence?: number | null
    measured_at?: string | null
  },
) {
  return apiRequest<ApiResponse<FootProfileData>>('/profiles/foot', {
    method: 'PUT',
    token: accessToken,
    body: JSON.stringify(payload),
  })
}
