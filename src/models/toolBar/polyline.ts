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
    s.points = [{ x: 0, y: 0, t: now }]
    s.color = toolStore.getNowColor()
    s.width = toolStore.getPenSize()
    s.shape = 'polyline'
    currentStroke = s
    isDrawing = true
    userQueue.pushStroke(s)
  } else {
    // 继续追加节点
    const p = toRelativePoints(currentStroke.head, { x: wx, y: wy, t: now })
    currentStroke.points.push(p)
  }
}

export function polyline_Move(userQueue: strokeFlow, board: Board, wx: number, wy: number) {
  if (!isDrawing || !currentStroke) return
  const p = toRelativePoints(currentStroke.head, { x: wx, y: wy, t: Date.now() })
  // 使用最后一个点作为“预览点”
  if (currentStroke.points.length === 0) {
    currentStroke.points.push(p)
  } else {
    currentStroke.points[currentStroke.points.length - 1] = p
  }
}

export function polyline_Finish(userQueue: strokeFlow, board: Board) {
  if (!isDrawing || !currentStroke) return
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

