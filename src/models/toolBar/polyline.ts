import { newStroke, toRelativePoints } from '@/utils'
import type { Board, Point, Stroke, strokeFlow } from '../types'
import toolBarData from '@/stores/toolBarStores'

let currentStroke: Stroke | null = null
let isDrawing = false
const toolStore = toolBarData()

export function polyline_Down(userQueue: strokeFlow, board: Board, wx: number, wy: number, button: number) {
  // 右键结束
  if (button === 2) {
    polyline_Finish(userQueue, board)
    return
  }

  const now = Date.now()
  if (!isDrawing || !currentStroke) {
    // 开始新的折线
    const head: Point = { x: wx, y: wy, t: now }
    const s = newStroke()
    s.head = head
    // points 最后一个点永远是“预览点”，用于鼠标移动时实时更新
    const p0 = { x: 0, y: 0, t: now }
    s.points = [p0, { ...p0 }]
    s.color = toolStore.getNowColor()
    s.width = toolStore.getPenSize()
    s.tool = 'polyline'
    s.shape = 'polyline'
    currentStroke = s
    isDrawing = true
    userQueue.pushStroke(s)
  } else {
    // 左键确认当前预览点，开始下一段预览
    const p = toRelativePoints(currentStroke.head, { x: wx, y: wy, t: now })
    currentStroke.points[currentStroke.points.length - 1] = p
    currentStroke.points.push({ ...p })
    userQueue.updateLocalStrokePreview(currentStroke)
  }
}

export function polyline_Move(userQueue: strokeFlow, board: Board, wx: number, wy: number) {
  if (!isDrawing || !currentStroke) return
  const p = toRelativePoints(currentStroke.head, { x: wx, y: wy, t: Date.now() })
  // 使用最后一个点作为“预览点”
  if (currentStroke.points.length === 0) {
    currentStroke.points.push({ x: 0, y: 0, t: p.t }, p)
    return
  }
  if (currentStroke.points.length === 1) {
    currentStroke.points.push(p)
    return
  }
  currentStroke.points[currentStroke.points.length - 1] = p
  userQueue.updateLocalStrokePreview(currentStroke)
}

export function polyline_Finish(userQueue: strokeFlow, board: Board) {
  if (!isDrawing || !currentStroke) return
  // 去掉最后一个“预览点”（若与前一点重合）
  if (currentStroke.points.length >= 2) {
    const last = currentStroke.points[currentStroke.points.length - 1]!
    const prev = currentStroke.points[currentStroke.points.length - 2]!
    if (last.x === prev.x && last.y === prev.y) {
      currentStroke.points.pop()
    }
  }
  if (currentStroke.points.length <= 1) {
    // 只有一个点就丢弃
    currentStroke = null
    isDrawing = false
    return
  }
  userQueue.setFinish()
  currentStroke = null
  isDrawing = false
}

export function polyline_IsDrawing() {
  return isDrawing
}

export function polyline_Cancel() {
  currentStroke = null
  isDrawing = false
}

