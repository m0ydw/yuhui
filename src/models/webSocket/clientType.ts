export class WebSocketClient {
  public ws: WebSocket | null = null
  public url: string
  private userId: string | null = null

  // 核心改进：增加两个内部管理器
  private pendingPromises = new Map<string, { resolve: Function; reject: Function }>()
  private specialHandlers = new Map<string, (data: any) => boolean>() // 返回 true 则不再分发

  // 原有监听器保持不变
  private listeners: Map<string, Set<(data: any) => void>> = new Map()

  constructor(url: string) {
    this.url = url
  }

  /**
   * 新增：可复用的消息等待机制
   */
  waitForMessage(type: string, timeout = 10000): Promise<any> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pendingPromises.delete(type)
        reject(new Error(`等待消息类型 "${type}" 超时`))
      }, timeout)

      this.pendingPromises.set(type, {
        resolve: (data: any) => {
          clearTimeout(timer)
          resolve(data)
        },
        reject,
      })
    })
  }

  /**
   * ★ 新增：注册特殊消息处理器（返回 true 拦截分发）
   */
  registerSpecialHandler(type: string, handler: (data: any) => boolean): void {
    this.specialHandlers.set(type, handler)
  }

  connect(): Promise<string> {
    if (this.ws?.readyState === WebSocket.OPEN) {
      const userId = this.userId || 'unknown' // 明确为 string 类型
      return Promise.resolve(userId)
    }

    // 使用新机制等待 user-assigned
    const userAssignedPromise = this.waitForMessage('user-assigned').then((data) => {
      this.userId = data.data.userId
      return this.userId || 'unknown'
    })

    this.ws = new WebSocket(this.url)
    this.ws.onopen = () => console.log('WebSocket 已连接')
    this.ws.onclose = () => console.log('WebSocket 已断开')
    this.ws.onerror = (error) => console.error('WebSocket 错误:', error)

    this.ws.onmessage = (event: MessageEvent) => {
      const data = JSON.parse(event.data)
      console.log('收到响应:', data)

      // 1. 优先处理等待中的 Promise
      const pending = this.pendingPromises.get(data.type)
      if (pending) {
        pending.resolve(data)
        this.pendingPromises.delete(data.type)
        return // 拦截，不继续分发
      }

      // 2. 处理特殊处理器
      const specialHandler = this.specialHandlers.get(data.type)
      if (specialHandler?.(data)) {
        return // 如果返回 true，拦截分发
      }

      // 3. 原有逻辑：普通消息分发到监听器
      const typeListeners = this.listeners.get(data.type)
      typeListeners?.forEach((callback) => callback(data))
    }

    return userAssignedPromise
  }

  // 以下所有方法保持不变，完全兼容！
  on(eventType: string, callback: (data: any) => void): void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set())
    }
    this.listeners.get(eventType)!.add(callback)
  }

  off(eventType: string, callback: (data: any) => void): void {
    this.listeners.get(eventType)?.delete(callback)
  }

  offAll(eventType: string): void {
    this.listeners.delete(eventType)
  }

  offAllTypes(): void {
    this.listeners.clear()
  }

  send(data: string): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(data)
    }
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }

  getUserId() {
    return this.userId
  }
}
