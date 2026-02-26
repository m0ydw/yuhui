import type { Board } from '../types'
import { renderOtherCursor, changeCursorStop } from '../webSocket/addOnEvent/cursorBoardEvent'
const Point = { x: 0, y: 0 }
export function hand_Down(offsetX: number, offsetY: number) {
  changeCursorStop(true) //停止传输move (开启stop)
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
  renderOtherCursor()
}

export function hand_Up() {
  changeCursorStop(false) //开始传输move (开启stop)
}
