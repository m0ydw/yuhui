import type { Board } from '../types'
import { newStroke, newPoint, toRelativePoints } from '@/utils'
const Point = { x: 0, y: 0 }
export function hand_Down(offsetX: number, offsetY: number) {
  Point.x = offsetX
  Point.y = offsetY
}

export function hand_Move(
  board: Board,
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  offsetX: number,
  offsetY: number,
) {
  board.setPan(offsetX - Point.x, offsetY - Point.y, ctx, canvas)
  Point.x = offsetX
  Point.y = offsetY
}

export function hand_Up() {}
