import { API_BASE_URL, apiRequest } from './client'
import type { ApiResponse } from '../types/api'

export type ConsentData = {
  id: string
  measurement_data: boolean
  image_storage: boolean
  policy_version: string
  agreed_at: string
  revoked_at: string | null
}

export type MeasurementSessionData = {
  session_id: string
  status: string
}

export type MeasurementImageData = {
  image_id: string
  session_id: string
  original_key: string
  content_type: string
  file_size_bytes: number
  client_width: number
  client_height: number
  device_orientation: string
  status: string
}

export type ImageValidationData = {
  valid: boolean
  checks: {
    measurement_sheet: boolean
    foot_complete: boolean
    blur: boolean
    brightness: boolean
    marker: boolean
    perspective: boolean
  }
  next_status: string
  reason?: string | null
  message?: string | null
}

export type MeasurementResultData = {
  result_id: string
  session_id: string
  foot_length_mm: number
  foot_width_mm: number
  foot_side?: string | null
  segmentation_confidence: number | null
  status: string
  measured_at: string
}

function authHeaders(accessToken: string) {
  return {
    Authorization: `Bearer ${accessToken}`,
  }
}

async function parseApiResponse<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => null)

  if (!response.ok) {
    const message =
      payload?.error?.message ??
      payload?.detail ??
      `API request failed: ${response.status}`
    throw new Error(message)
  }

  return payload as T
}

export function createMeasurementConsent(accessToken: string) {
  return apiRequest<ApiResponse<ConsentData>>('/consents', {
    method: 'POST',
    token: accessToken,
    body: JSON.stringify({
      measurement_data: true,
      image_storage: true,
      policy_version: '2026-08-18',
    }),
  })
}

export function createMeasurementSession(accessToken: string, consentId: string) {
  return apiRequest<ApiResponse<MeasurementSessionData>>('/measurements/sessions', {
    method: 'POST',
    token: accessToken,
    body: JSON.stringify({
      consent_id: consentId,
    }),
  })
}

export async function uploadMeasurementImage({
  accessToken,
  sessionId,
  image,
  clientWidth,
  clientHeight,
  deviceOrientation,
}: {
  accessToken: string
  sessionId: string
  image: File
  clientWidth: number
  clientHeight: number
  deviceOrientation: string
}) {
  const formData = new FormData()
  formData.append('image', image)
  formData.append('client_width', String(clientWidth))
  formData.append('client_height', String(clientHeight))
  formData.append('device_orientation', deviceOrientation)

  const response = await fetch(`${API_BASE_URL}/measurements/sessions/${sessionId}/image`, {
    method: 'POST',
    headers: authHeaders(accessToken),
    body: formData,
  })

  return parseApiResponse<ApiResponse<MeasurementImageData>>(response)
}

export function validateMeasurementImage(accessToken: string, sessionId: string) {
  return apiRequest<ApiResponse<ImageValidationData>>(
    `/measurements/sessions/${sessionId}/validate`,
    {
      method: 'POST',
      token: accessToken,
    },
  )
}

export function analyzeMeasurementImage({
  accessToken,
  sessionId,
  pointX,
  pointY,
  footSide = 'RIGHT',
}: {
  accessToken: string
  sessionId: string
  pointX: number
  pointY: number
  footSide?: string
}) {
  return apiRequest<ApiResponse<MeasurementResultData>>(
    `/measurements/sessions/${sessionId}/analyze`,
    {
      method: 'POST',
      token: accessToken,
      body: JSON.stringify({
        point_x: pointX,
        point_y: pointY,
        foot_side: footSide,
      }),
    },
  )
}
