//发送消息类型的封装
import type { Point, Stroke } from '@/models/types'
export function sendNewStroke(id: string, aim: Stroke): string {
  return JSON.stringify({
    type: 'newStroke',
    data: {
      user: id,
      willPush: aim,
    },
  })
}
export function sendIAmJoin(room: string, id: string): string {
  return JSON.stringify({
    type: 'JoinRoom',
    data: {
      roomId: room,
      user: id,
    },
  })
}
export function sendStrokePoints(pt: Point[], id: string) {
  return JSON.stringify({
    type: 'comePoints',
    data: {
      user: id,
      points: [...pt],
    },
  })
}
export function sendStrokeFinish(id: string) {
  return JSON.stringify({
    type: 'finishStroke',
    data: {
      user: id,
    },
  })
}
