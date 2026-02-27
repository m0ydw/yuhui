//接收
//并处理
import { WebSocketClient } from '../clientType'
import { newStrokeFlow } from '@/utils'
export function addMainBoardEvent(client: WebSocketClient, Flow: ReturnType<typeof newStrokeFlow>) {
  //进入房间
  ;(client.on('whoJoins', (data) => {
    const aim = data.data
    Flow.newUser(aim.user)
  }),
    client.on('startStroke', (data) => {
      const aim = data.data
      const stroke = aim.stroke
      if (!stroke) {
        return
      }
      if (!stroke.id && aim.tempId) {
        stroke.id = aim.tempId
      }
      stroke.ownerId = aim.user
      Flow.pushStroke(stroke, aim.user)
    }),
    client.on('confirmStroke', (data) => {
      const aim = data.data
      Flow.replaceStrokeId(aim.tempId, aim.strokeId)
      if (typeof aim.version === 'number') {
        const board = Flow.getBoard()
        const stroke = board.getStrokeById(aim.strokeId)
        if (stroke) {
          stroke.version = aim.version
        }
      }
    }),
    client.on('strokePoints', (data) => {
      const aim = data.data
      Flow.pushOtherPoints(aim.points, aim.user, aim.strokeId)
    }),
    client.on('strokeUpdate', (data) => {
      const aim = data.data
      if (!aim?.stroke) return
      Flow.updateRemoteStroke(aim.user, aim.strokeId, aim.stroke)
    }),
    client.on('finishStroke', (data) => {
      const aim = data.data
      if (aim.stroke) {
        aim.stroke.ownerId = aim.user
      }
      Flow.setFinish(aim.user, aim.strokeId, aim.stroke)
    }),
    client.on('eraseStrokes', (data) => {
      const aim = data.data
      Flow.handleRemoteRemoval(aim.strokeIds || [])
    }),
    client.on('undoResult', (data) => {
      const aim = data.data
      Flow.handleRemoteRemoval(aim.strokeIds || [])
    }),
    client.on('restoreStrokes', (data) => {
      const aim = data.data
      Flow.handleRestoreStrokes(aim.strokes || [])
    }),
    client.on('whoExit', (data) => {
      const aim = data.data
      Flow.delUser(aim.user)
    }))
  //退出
}
