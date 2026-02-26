import { SERVER } from '.'
const TOKEN_KEY = 'access_token'

// 从 localStorage 初始化，解决路由切换丢失问题
let accessToken: string | null = localStorage.getItem(TOKEN_KEY)
let refreshing = false
const waitQueue: (() => void)[] = []

export const setToken = (aim: string | null) => {
  console.log(`set ${aim}`)
  accessToken = aim
  // 持久化
  if (aim) {
    localStorage.setItem(TOKEN_KEY, aim)
  } else {
    localStorage.removeItem(TOKEN_KEY)
  }
}

export const getToken = () => accessToken

// 初始化时同步 localStorage
export const initToken = () => {
  accessToken = localStorage.getItem(TOKEN_KEY)
  return accessToken
}

export const clearToken = () => {
  accessToken = null
  localStorage.removeItem(TOKEN_KEY)
}

export const refresh = async (): Promise<string> => {
  if (refreshing) {
    return new Promise((resolve) => {
      waitQueue.push(() => resolve(accessToken!))
    })
  }

  refreshing = true
  try {
    const res = await fetch(`${SERVER}api/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    })
    if (!res.ok) throw new Error('refresh failed')

    const response = await res.json()
    const newToken = response.data.accessToken

    // 同时更新内存和持久化
    setToken(newToken)

    // 唤醒等待队列
    while (waitQueue.length) {
      const callback = waitQueue.shift()!
      callback()
    }

    return newToken
  } finally {
    refreshing = false
  }
}

// 应用启动时调用，确保 Token 同步
initToken()
