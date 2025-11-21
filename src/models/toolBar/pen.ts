import { newStroke, newPoint, toRelativePoints } from '@/utils'
import type { Point, Board, strokeFlow, Stroke } from '../types'
let lastPoint: Point = newPoint()
let keyPoints: Stroke

export function pen_Down(
  ctx: CanvasRenderingContext2D,
  userQueue: strokeFlow,
  board: Board,
  offsetX: number,
  offsetY: number,
) {
  keyPoints = newStroke()

  lastPoint = { x: offsetX, y: offsetY, t: Date.now() }
  //笔画初始化
  keyPoints.head = lastPoint
  keyPoints.points.push({ x: 0, y: 0, t: lastPoint.t, p: lastPoint.p })
  //设置样式
  ctx.strokeStyle = '#000000'
  ctx.lineWidth = 5
  userQueue.pushStroke(keyPoints)
}

export function pen_Move(userQueue: strokeFlow, offsetX: number, offsetY: number) {
  const willPush: Point = toRelativePoints(keyPoints.head, {
    x: offsetX,
    y: offsetY,
    t: Date.now(),
  })
  userQueue.pushPoint({ ...willPush })
}

export function pen_Up(userQueue: strokeFlow, board: Board) {
  userQueue.setFinish()
  //笔画加入表格
  // board.addStroke(keyPoints)
}
