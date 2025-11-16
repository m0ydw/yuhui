// 添加使用boardData.addStroke(boardData.screenToWorldStroke(keyPoints))

import { newStroke, newPoint } from '@/utils'
import type { Point, Board, strokeFlow, Stroke } from './types'
import { toRelativePoints } from '@/utils'
export function canvasPointer(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  board: Board,
  userQueue: strokeFlow,
) {
  let lastPoint: Point = newPoint()
  let keyPoints: Stroke
  let isDrawing = false
  const mouseDown = (e: PointerEvent) => {
    keyPoints = newStroke()
    const { offsetX, offsetY } = e
    isDrawing = true
    canvas.setPointerCapture(e.pointerId) //拦截
    window.addEventListener('pointermove', mouseMove)
    window.addEventListener('pointerup', mouseUp)
    lastPoint = { x: offsetX, y: offsetY, t: Date.now() }
    //笔画初始化
    keyPoints.head = { ...lastPoint }
    keyPoints.points.push({ x: 0, y: 0, t: lastPoint.t, p: lastPoint.p })
    //id
    //points
    // keyPoints.color
    // keyPoints.tool
    // keyPoints.width
    //size??
    //设置样式
    ctx.strokeStyle = '#000000'
    ctx.lineWidth = 5
    //队列新建笔画
    userQueue.pushStroke(keyPoints)
  }
  const mouseMove = (e: PointerEvent) => {
    if (!isDrawing) {
      return
    }
    //pushPoint
    const { offsetX, offsetY } = e
    //与上个点重复不记录    多余：触发move必定不重复
    // if (lastPoint.x === offsetX && lastPoint.y === offsetY) {
    //   return
    // }
    //加点
    const willPush: Point = toRelativePoints(keyPoints.head, {
      x: offsetX,
      y: offsetY,
      t: Date.now(),
    })
    userQueue.pushPoint({ ...willPush })
  }

  const mouseUp = (e: PointerEvent) => {
    userQueue.setFinish()
    isDrawing = false
    //清除挂载
    canvas.releasePointerCapture(e.pointerId)
    window.removeEventListener('pointermove', mouseMove)
    window.removeEventListener('pointerup', mouseUp)

    //笔画加入表格
    board.addStroke(board.screenToWorldStroke(keyPoints))
  }
  //监听mousedown
  canvas.addEventListener('pointerdown', mouseDown)
  //返回清理函数
  return () => {
    canvas.removeEventListener('pointerdown', mouseDown)
    window.removeEventListener('pointermove', mouseMove)
    window.removeEventListener('pointerup', mouseUp)
  }
}
