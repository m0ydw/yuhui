import { newStroke, toRelativePoints } from '@/utils'
import type { Board, Point, Stroke, strokeFlow } from '../types'
import toolBarData from '@/stores/toolBarStores'

let currentStroke: Stroke | null = null
const toolStore = toolBarData()

export function rect_Down(userQueue: strokeFlow, board: Board, wx: number, wy: number) {
  const head: Point = { x: wx, y: wy, t: Date.now() }
  const s = newStroke()
  s.head = head
  s.points = [{ x: 0, y: 0, t: head.t }]
  s.color = toolStore.getNowColor()
  s.width = toolStore.getPenSize()
  s.tool = 'rect'
  s.shape = 'rect'
  currentStroke = s
  userQueue.pushStroke(s)
}

export function rect_Move(userQueue: strokeFlow, board: Board, wx: number, wy: number) {
  if (!currentStroke) return
  const x1 = currentStroke.head.x
  const y1 = currentStroke.head.y
  const x2 = wx
  const y2 = wy

  // 以按下点为起点，画轴对齐矩形
  const p1 = { x: 0, y: 0, t: Date.now() }
  const p2 = toRelativePoints(currentStroke.head, { x: x2, y: y1, t: Date.now() })
  const p3 = toRelativePoints(currentStroke.head, { x: x2, y: y2, t: Date.now() })
  const p4 = toRelativePoints(currentStroke.head, { x: x1, y: y2, t: Date.now() })

  currentStroke.points = [p1, p2, p3, p4]
  userQueue.updateLocalStrokePreview(currentStroke)
}

export function rect_Up(userQueue: strokeFlow, board: Board) {
  if (!currentStroke) return
  userQueue.setFinish()
  currentStroke = null
}

