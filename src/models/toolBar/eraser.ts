// src/utils/toolBar/eraser.ts
import type { Board, Point, Stroke } from '../types'

let currentPath: Point[] = []

// 橡皮擦按下
export function eraser_Down(
  board: Board,
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  screenX: number,
  screenY: number,
) {
  currentPath = [{ x: screenX, y: screenY, t: Date.now() }]

  // 开始橡皮擦模式
  board.startErasing()

  // 立即触发一次渲染（防止延迟）
  board.render(ctx, canvas)
}

// 橡皮擦移动
export function eraser_Move(
  board: Board,
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  screenX: number,
  screenY: number,
) {
  // 添加当前点
  currentPath.push({ x: screenX, y: screenY, t: Date.now() })

  // 实时收集 + 渲染
  board.collectErasingStrokes(currentPath)
  board.render(ctx, canvas) // 完美传递 ctx 和 canvas
}

// 橡皮擦松开
export function eraser_Up(
  board: Board,
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
): Stroke[] {
  // 确认删除
  const deleted = board.confirmErase()

  // 最后一次渲染，确保删除生效
  board.render(ctx, canvas)

  // 清理路径
  currentPath = []

  // 返回被删的笔画，供 undo 使用
  return deleted
}
