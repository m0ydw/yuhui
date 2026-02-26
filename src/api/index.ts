export const SERVER: string = `https://localhost:5500/`
export const WSERVER: string = 'wss://localhost:5500/ws'
import { getToken, refresh } from './token'
interface ApiResponse<T> {
  code: number
  message: string
  data: T
}

export async function request<T>(
  url: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  params: any = {}, // 请求参数
  needToken: boolean,
  retry = false, //二次尝试参数
): Promise<ApiResponse<T>> {
  url = `${SERVER}${url}`

  // GET/DELETE 方法，把 params 转为查询参数
  if (method === 'GET' || method === 'DELETE') {
    const queryParams = new URLSearchParams(params as Record<string, string>).toString()
    if (queryParams) {
      url = `${url}?${queryParams}`
    }
  }

  // 设置默认请求头
  const headers: Record<string, string> = {}

  // 如果是 POST/PUT，需要设置 Content-Type
  if (method === 'POST' || method === 'PUT') {
    headers['Content-Type'] = 'application/json'
  }

  // 需要token，添加到 Authorization
  if (needToken) {
    if (!getToken()) {
      //token获取失败
    }
    headers['Authorization'] = `Bearer ${getToken()}`
  }

  const defaultConfig: RequestInit = {
    method,
    headers,
    body: method === 'POST' || method === 'PUT' ? JSON.stringify(params) : undefined,
    credentials: 'include',
  }

  const response = await fetch(url, defaultConfig)

  if (!response.ok) throw new Error(`HTTP ${response.status}`)

  //401token失效：刷新并重试
  const result: ApiResponse<T> = await response.json()

  // if (result.code !== 200) {
  //   throw new Error(result.message || '业务错误')
  // }
  //401代表token过期
  if (result.code === 401 && !retry) {
    await refresh()
    return request(url.replace(SERVER, ''), method, params, true, true)
  }

  return result
}

export * from './apiType'
export * from './token'
