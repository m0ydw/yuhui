export const SERVER: string = `https://localhost:5500/`
export const WSERVER: string = 'wss://localhost:5500/ws'
export const URLSERVER: string = `https://localhost:5500`
import { getToken, refresh } from './token'

interface ApiResponse<T> {
  code: number
  message: string
  data: T
}

export async function request<T>(
  url: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  params: any = {},
  needToken: boolean,
  retry = false,
  isFormData = false,
): Promise<ApiResponse<T>> {
  const firstUrl = url
  let targetUrl = `${SERVER}${url}`

  if (needToken && isFormData) {
    const token = getToken()
    if (token) {
      targetUrl += (targetUrl.includes('?') ? '&' : '?') + 'token=' + token
    }
  }

  // 处理 GET 参数
  if (method === 'GET' || method === 'DELETE') {
    const queryParams = new URLSearchParams(params as Record<string, string>).toString()
    if (queryParams) {
      targetUrl = `${targetUrl}${targetUrl.includes('?') ? '&' : '?'}${queryParams}`
    }
  }

  const headers: Record<string, string> = {}

  // ==============================================
  // ✅ 修复：上传文件时，不往 headers 加 token
  // ==============================================
  if (needToken && !isFormData) {
    const token = getToken()
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
  }

  let body: any = undefined

  if (isFormData) {
    body = params
  } else {
    if (method === 'POST' || method === 'PUT') {
      headers['Content-Type'] = 'application/json'
      body = JSON.stringify(params)
    }
  }

  const config: RequestInit = {
    method,
    headers: isFormData ? undefined : headers, // 上传文件必须 undefined
    body: body,
    credentials: 'include',
  }

  const response = await fetch(targetUrl, config)
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  const result: ApiResponse<T> = await response.json()

  if (result.code === 999 && !retry) {
    await refresh()
    return request(firstUrl, method, params, needToken, true, isFormData)
  }

  return result
}

export * from './apiType'
export * from './token'
