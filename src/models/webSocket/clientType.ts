import { request, type ticket } from '@/api'
import { getPopFlex } from '../flexpop/flexpop'
import roomFailed from '@/components/sectionPop/roomFailed.vue'
import LoginOther from '@/components/sectionPop/LoginOther.vue'
import unknowErr from '@/components/sectionPop/unknowErr.vue'
const pop = getPopFlex()
export class WebSocketClient {
  public ws: WebSocket | null = null
  public url: string
  private userId: string | null = null

  // 核心改进：增加两个内部管理器
  private pendingPromises = new Map<
    string,
    { resolve: Function; reject: Function; timer: ReturnType<typeof setTimeout> }
  >()
  private specialHandlers = new Map<string, (data: any) => boolean>() // 返回 true 则不再分发
  private isConnecting = false //正在连接？

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
      // 如果同一个 type 已经在等待，先取消旧的等待，避免旧 timer 后续触发“幽灵超时”
      const existed = this.pendingPromises.get(type)
      if (existed) {
        clearTimeout(existed.timer)
        existed.reject(new Error('等待消息已被新的请求覆盖'))
        this.pendingPromises.delete(type)
      }

      const timer = setTimeout(() => {
        this.pendingPromises.delete(type)
        reject(new Error(`等待消息类型 "${type}" 超时`))
      }, timeout)

      this.pendingPromises.set(type, {
        resolve: (data: any) => {
          clearTimeout(timer)
          resolve(data)
        },
        reject: (err: any) => {
          clearTimeout(timer)
          reject(err)
        },
        timer,
      })
    })
  }

  /**
   * ★ 新增：注册特殊消息处理器（返回 true 拦截分发）
   */
  registerSpecialHandler(type: string, handler: (data: any) => boolean): void {
    this.specialHandlers.set(type, handler)
  }

  async connect(connType: 'draw' | 'allRoom' = 'draw'): Promise<string> {
    if (this.ws?.readyState === WebSocket.OPEN) {
      const userId = this.userId || 'unknown' // 明确为 string 类型
      return Promise.resolve(userId)
    }
    // 正在连接：直接 return
    if (this.isConnecting) {
      return Promise.reject(new Error('正在连接中，请稍候'))
    }

    // 使用新机制等待 user-assigned
    const userAssignedPromise = this.waitForMessage('user-assigned').then((data) => {
      this.userId = data.data.userId
      return this.userId || 'unknown'
    })

    //先获取ticket
    const data = await request<ticket>('api/auth/ticket', 'POST', {}, true)
    //失败
    if (data.code !== 200) {
    }
    console.log('ticket', data)
    const params = new URLSearchParams({
      ticket: data.data.ticket,
      type: connType,
    })
    this.ws = new WebSocket(`${this.url}?${params.toString()}`)
    this.ws.onopen = () => console.log('WebSocket 已连接')
    this.ws.onclose = (event) => {
      console.log(event.code, event.reason)
      // 连接断开时清理等待中的 Promise，避免后续 timer 回调再次触发
      for (const [, pending] of this.pendingPromises) {
        clearTimeout(pending.timer)
        pending.reject(new Error(event.reason || 'WebSocket disconnected'))
      }
      this.pendingPromises.clear()
      switch (event.code) {
        case 1009:
        case 1010:
        case 1008:
          pop?.value.open(roomFailed, { message: event.reason, code: event.code })
          break
        case 1013:
          pop?.value.open(LoginOther)
          break
        case 1006:
          pop?.value.open(unknowErr)
      }
    }
    this.ws.onerror = (error) => {
      console.error('WebSocket 错误:', error)
      for (const [, pending] of this.pendingPromises) {
        clearTimeout(pending.timer)
        pending.reject(new Error('WebSocket error'))
      }
      this.pendingPromises.clear()
    }
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
