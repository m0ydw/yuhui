import type { Board } from '../types'
import { newStroke, newPoint, toRelativePoints } from '@/utils'
const Point = { x: 0, y: 0 }
export function hand_Down(e: PointerEvent) {
  const { offsetX, offsetY } = e
  Point.x = offsetX
  Point.y = offsetY
}

export function hand_Move(
  e: PointerEvent,
  board: Board,
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
) {
  const { offsetX, offsetY } = e
  board.setPan(offsetX - Point.x, offsetY - Point.y, ctx, canvas)
  Point.x = offsetX
  Point.y = offsetY
}

export function hand_Up() {}
