export class WebSocketClient {
  public ws: WebSocket | null = null
  public url: string
  private userId: string | null = null // 存储分配的用户ID
  private userIdResolve: ((id: string) => void) | null = null // Promise resolve
  // 核心：用 Map 存储回调，key 是 type 字符串
  private listeners: Map<string, Set<(data: any) => void>> = new Map()

  constructor(url: string) {
    this.url = url
  }

  // 连接
  connect(): Promise<string> {
    // 如果已连接，直接返回存储的 userId
    if (this.ws?.readyState === WebSocket.OPEN) {
      return Promise.resolve(this.userId || 'unknown')
    }

    return new Promise((resolve) => {
      this.userIdResolve = resolve // 暂存 resolve 函数

      this.ws = new WebSocket(this.url)

      this.ws.onopen = () => console.log('WebSocket 已连接')
      this.ws.onclose = () => console.log('WebSocket 已断开')
      this.ws.onerror = (error) => console.error('WebSocket 错误:', error)

      this.ws.onmessage = (event: MessageEvent) => {
        const data = JSON.parse(event.data)
        console.log('收到响应:', data)

        // 如果是 user-assigned 消息，提取 userId 并 resolve
        if (data.type === 'user-assigned') {
          this.userId = data.data.userId
          this.userIdResolve?.(this.userId!) //
          this.userIdResolve = null // 清理，避免内存泄漏
          return // 不执行后续监听器
        }

        // 其他消息正常分发到监听器
        const typeListeners = this.listeners.get(data.type)
        typeListeners?.forEach((callback) => callback(data))
      }
    })
  }

  // 添加监听：监听某个 type，如 'chat'、'drawing'
  on(eventType: string, callback: (data: any) => void): void {
    if (!this.listeners.has(eventType)) {
      //没有事件则新建表
      this.listeners.set(eventType, new Set()) // 用 Set 防止重复添加
    } //有直接添加
    this.listeners.get(eventType)!.add(callback)
  }

  // 移除单个监听
  off(eventType: string, callback: (data: any) => void): void {
    this.listeners.get(eventType)?.delete(callback)
  }

  // 移除某个 type 的所有监听（组件卸载时调用）
  offAll(eventType: string): void {
    this.listeners.delete(eventType)
  }

  // 移除所有监听（应用退出时调用）
  offAllTypes(): void {
    this.listeners.clear()
  }

  // 发送消息
  send(data: string): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(data)
    }
  }

  // 断开连接
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
