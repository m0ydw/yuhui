import type { Board, strokeFlow, toolMode } from './types'
import toolBarData from '@/stores/toolBarStores'

import { pen_Down, pen_Move, pen_Up } from './toolBar/pen'
import { hand_Down, hand_Move, hand_Up } from './toolBar/hand'
export function canvasPointer(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  board: Board,
  userQueue: strokeFlow,
) {
  let toolData = toolBarData()
  let isDown = false
  const mouseDown = (e: PointerEvent) => {
    const { offsetX, offsetY } = e
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
    }
  }
  const mouseMove = (e: PointerEvent) => {
    if (!isDown) {
      return
    }
    const { offsetX, offsetY } = e
    let x = board.toWorldX(offsetX)
    let y = board.toWorldY(offsetY)
    switch (toolData.nowTool) {
      case 'hand':
        hand_Move(board, ctx, canvas, offsetX, offsetY)
        break
      case 'pen':
        pen_Move(userQueue, x, y)
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
    window.removeEventListener('pointermove', mouseMove)
    window.removeEventListener('pointerup', mouseUp)
  }
}
