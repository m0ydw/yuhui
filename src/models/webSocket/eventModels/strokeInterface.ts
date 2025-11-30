//发送消息类型的封装
import type { Point, Stroke } from '@/models/types'

export function sendIAmJoin(room: string, id: string): string {
  return JSON.stringify({
    type: 'JoinRoom',
    data: {
      roomId: room,
      user: id,
    },
  })
}

export function sendStartStroke(userId: string, tempId: string, stroke: Stroke): string {
  return JSON.stringify({
    type: 'startStroke',
    data: {
      user: userId,
      tempId,
      stroke,
    },
  })
}

export function sendStrokePoints(points: Point[], strokeId: string, userId: string) {
  return JSON.stringify({
    type: 'strokePoints',
    data: {
      user: userId,
      strokeId,
      points: [...points],
    },
  })
}

export function sendStrokeFinish(userId: string, strokeId: string, stroke: Stroke) {
  return JSON.stringify({
    type: 'finishStroke',
    data: {
      user: userId,
      strokeId,
      stroke,
    },
  })
}

export function sendEraseStrokes(userId: string, strokeIds: string[]) {
  return JSON.stringify({
    type: 'eraseStrokes',
    data: {
      user: userId,
      strokeIds,
    },
  })
}

export function sendUndoRequest(userId: string) {
  return JSON.stringify({
    type: 'undoRequest',
    data: {
      user: userId,
    },
  })
}

export function sendRedoRequest(userId: string) {
  return JSON.stringify({
    type: 'redoRequest',
    data: {
      user: userId,
    },
  })
}
