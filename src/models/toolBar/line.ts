import { newStroke, toRelativePoints } from '@/utils'
import type { Board, Point, Stroke, strokeFlow } from '../types'
import toolBarData from '@/stores/toolBarStores'

let currentStroke: Stroke | null = null
const toolStore = toolBarData()

export function line_Down(userQueue: strokeFlow, board: Board, wx: number, wy: number) {
  const head: Point = { x: wx, y: wy, t: Date.now() }
  const s = newStroke()
  s.head = head
  s.points = [{ x: 0, y: 0, t: head.t }]
  s.color = toolStore.getNowColor()
  s.width = toolStore.getPenSize()
  s.shape = 'line'
  currentStroke = s
  userQueue.pushStroke(s)
}

export function line_Move(userQueue: strokeFlow, board: Board, wx: number, wy: number) {
  if (!currentStroke) return
  const p = toRelativePoints(currentStroke.head, { x: wx, y: wy, t: Date.now() })
  // 始终保持 [起点, 终点] 两个点
  if (currentStroke.points.length === 0) {
    currentStroke.points.push({ x: 0, y: 0, t: p.t })
  }
  if (currentStroke.points.length === 1) {
    currentStroke.points.push(p)
  } else {
    currentStroke.points[1] = p
  }
}

export function line_Up(userQueue: strokeFlow, board: Board) {
  if (!currentStroke) return
  userQueue.setFinish()
  currentStroke = null
}

