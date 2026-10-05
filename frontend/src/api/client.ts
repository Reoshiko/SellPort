import axios from 'axios'
import type { InternalAxiosRequestConfig } from 'axios'
import type { TokenPair } from '../types/catalog'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
})

export function getProductImageUrl(productId: number) {
  return `${api.defaults.baseURL?.replace(/\/$/, '') ?? '/api'}/products/${productId}/image`
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('sellport_access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

let refreshPromise: Promise<string> | null = null

api.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (!axios.isAxiosError(error)) return Promise.reject(error)
    const originalRequest = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined
    if (
      !originalRequest ||
      error.response?.status !== 401 ||
      originalRequest._retry ||
      originalRequest.url?.includes('/auth/')
    ) {
      return Promise.reject(error)
    }
    const refreshToken = localStorage.getItem('sellport_refresh_token')
    if (!refreshToken) {
      localStorage.removeItem('sellport_access_token')
      window.dispatchEvent(new Event('sellport:logout'))
      return Promise.reject(error)
    }
    refreshPromise ??= axios
      .post<TokenPair>(`${api.defaults.baseURL}/auth/refresh`, {
        refresh_token: refreshToken,
      })
      .then(({ data }) => {
        localStorage.setItem('sellport_access_token', data.access_token)
        localStorage.setItem('sellport_refresh_token', data.refresh_token)
        return data.access_token
      })
      .finally(() => {
        refreshPromise = null
      })
    try {
      const accessToken = await refreshPromise
      originalRequest._retry = true
      originalRequest.headers.Authorization = `Bearer ${accessToken}`
      return api(originalRequest)
    } catch (refreshError) {
      localStorage.removeItem('sellport_access_token')
      localStorage.removeItem('sellport_refresh_token')
      window.dispatchEvent(new Event('sellport:logout'))
      return Promise.reject(refreshError)
    }
  },
)
