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
    isDown = true
    canvas.setPointerCapture(e.pointerId) //拦截
    window.addEventListener('pointermove', mouseMove)
    window.addEventListener('pointerup', mouseUp)
    switch (toolData.nowTool) {
      case 'hand':
        hand_Down(e)
        break
      case 'pen':
        pen_Down(e, ctx, userQueue)
        break
    }
  }
  const mouseMove = (e: PointerEvent) => {
    if (!isDown) {
      return
    }
    switch (toolData.nowTool) {
      case 'hand':
        hand_Move(e, board, ctx, canvas)
        break
      case 'pen':
        pen_Move(e, userQueue)
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
