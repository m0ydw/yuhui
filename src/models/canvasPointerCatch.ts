import type { Board, strokeFlow } from './types'
import toolBarData from '@/stores/toolBarStores'

import { pen_Down, pen_Move, pen_Up } from './toolBar/pen'
import { hand_Down, hand_Move, hand_Up } from './toolBar/hand'
import { eraser_Down, eraser_Move, eraser_Up } from './toolBar/eraser'
import { line_Down, line_Move, line_Up } from './toolBar/line'
import { rect_Down, rect_Move, rect_Up } from './toolBar/rect'
import { polyline_Down, polyline_Move, polyline_IsDrawing, polyline_Cancel } from './toolBar/polyline'
export function canvasPointer(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  board: Board,
  userQueue: strokeFlow,
) {
  let toolData = toolBarData()
  let isDown = false

  // 禁用右键菜单（尤其是折线右键结束时，避免浏览器弹出保存图片等菜单）
  const preventContextMenu = (e: MouseEvent) => {
    e.preventDefault()
  }
  canvas.addEventListener('contextmenu', preventContextMenu)

  const getCanvasOffset = (e: PointerEvent) => {
    const rect = canvas.getBoundingClientRect()
    return {
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
    }
  }

  let polylineTracking = false
  const polylineHoverMove = (e: PointerEvent) => {
    // 工具切走后取消折线预览
    if (toolData.nowTool !== 'polyline') {
      if (polylineTracking) {
        polylineTracking = false
        window.removeEventListener('pointermove', polylineHoverMove)
        polyline_Cancel()
      }
      return
    }
    if (!polyline_IsDrawing()) {
      if (polylineTracking) {
        polylineTracking = false
        window.removeEventListener('pointermove', polylineHoverMove)
      }
      return
    }
    const { offsetX, offsetY } = getCanvasOffset(e)
    const x = board.toWorldX(offsetX)
    const y = board.toWorldY(offsetY)
    polyline_Move(userQueue, board, x, y)
    board.render(ctx, canvas)
  }

  const ensurePolylineTracking = () => {
    if (polylineTracking) return
    polylineTracking = true
    window.addEventListener('pointermove', polylineHoverMove)
  }

  const mouseDown = (e: PointerEvent) => {
    const { offsetX, offsetY } = getCanvasOffset(e)
    let x = board.toWorldX(offsetX)
    let y = board.toWorldY(offsetY)
    isDown = true
    canvas.setPointerCapture(e.pointerId) //拦截
    window.addEventListener('pointermove', mouseMove)
    window.addEventListener('pointerup', mouseUp)
    switch (toolData.nowTool) {
      case 'hand':
        hand_Down(offsetX, offsetY)
        break
      case 'pen':
        pen_Down(ctx, userQueue, board, x, y)
        break
      case 'eraser': // 新增！
        eraser_Down(board, ctx, canvas, offsetX, offsetY)
        break
      case 'line':
        line_Down(userQueue, board, x, y)
        board.render(ctx, canvas)
        break
      case 'rect':
        rect_Down(userQueue, board, x, y)
        board.render(ctx, canvas)
        break
      case 'polyline':
        // 右键结束折线时屏蔽默认菜单
        e.preventDefault()
        polyline_Down(userQueue, board, x, y, e.button)
        board.render(ctx, canvas)
        ensurePolylineTracking()
        break
    }
  }
  const mouseMove = (e: PointerEvent) => {
    if (!isDown) {
      return
    }
    const { offsetX, offsetY } = getCanvasOffset(e)
    let x = board.toWorldX(offsetX)
    let y = board.toWorldY(offsetY)
    switch (toolData.nowTool) {
      case 'hand':
        hand_Move(board, ctx, canvas, offsetX, offsetY)
        break
      case 'pen':
        pen_Move(userQueue, x, y)
        break
      case 'eraser': // 新增！
        eraser_Move(board, ctx, canvas, offsetX, offsetY)
        break
      case 'line':
        line_Move(userQueue, board, x, y)
        board.render(ctx, canvas)
        break
      case 'rect':
        rect_Move(userQueue, board, x, y)
        board.render(ctx, canvas)
        break
      case 'polyline':
        polyline_Move(userQueue, board, x, y)
        board.render(ctx, canvas)
        break
    }
  }

  const mouseUp = (e: PointerEvent) => {
    isDown = false
    //清除挂载
    switch (toolData.nowTool) {
      case 'hand':
        hand_Up()
        break
      case 'pen':
        pen_Up(userQueue, board)
        break
      case 'eraser': // 新增！
        const removed = eraser_Up(board, ctx, canvas)
        if (removed?.length) {
          const ids = removed
            .map((stroke) => stroke.id)
            .filter((id): id is string => typeof id === 'string' && id.length > 0)
          if (ids.length) {
            userQueue.handleLocalErase(ids, removed)
          }
        }
        break
      case 'line':
        line_Up(userQueue, board)
        board.render(ctx, canvas)
        break
      case 'rect':
        rect_Up(userQueue, board)
        board.render(ctx, canvas)
        break
      case 'polyline':
        // 折线：左键多次点击追加节点，右键才结束，这里只做一次重绘
        board.render(ctx, canvas)
        break
    }
    canvas.releasePointerCapture(e.pointerId)
    window.removeEventListener('pointermove', mouseMove)
    window.removeEventListener('pointerup', mouseUp)
  }
  //监听mousedown
  canvas.addEventListener('pointerdown', mouseDown)
  //返回清理函数
  return () => {
    canvas.removeEventListener('pointerdown', mouseDown)
    canvas.removeEventListener('contextmenu', preventContextMenu)
    window.removeEventListener('pointermove', mouseMove)
    window.removeEventListener('pointerup', mouseUp)
  }
}
