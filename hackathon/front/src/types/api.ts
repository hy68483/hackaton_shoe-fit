export type ApiResponse<T> = {
  success: boolean
  data: T
}

export type ApiErrorResponse = {
  success: false
  error: {
    code: string
    message: string
    field: string | null
    details: Record<string, unknown>
  }
}
