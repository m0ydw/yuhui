export const SERVER: string = `http://localhost:5500/`
interface ApiResponse<T> {
  code: number
  message: string
  data: T
}

export async function request<T>(url: string, config: RequestInit = {}): Promise<T> {
  url = `${SERVER}${url}`
  const response = await fetch(url, config)
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  //处理错误
  const result: ApiResponse<T> = await response.json()

  if (result.code !== 200) {
    throw new Error(result.message || '业务错误')
  }
  return result.data
}
export * from './apiType'
