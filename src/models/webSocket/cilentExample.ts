import { WebSocketClient } from './clientType'
import { WSERVER } from '@/api'
let userId = '0'
export const myWebsocketClient = new WebSocketClient(WSERVER)

export function getUserId() {
  return userId
}
export function changeUserId(aim: string): boolean {
  userId = aim

  if (userId === aim) return true

  return false
}
