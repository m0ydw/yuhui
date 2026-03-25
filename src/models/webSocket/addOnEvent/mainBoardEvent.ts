//接收
//并处理
import { WebSocketClient } from '../clientType'
import { newStrokeFlow } from '@/utils'
import { addUserMessager } from '@/models/message/message'
import userDataStore from '@/stores/userDataStores'
const dataStore = userDataStore()
export function addMainBoardEvent(client: WebSocketClient, Flow: ReturnType<typeof newStrokeFlow>) {
  //进入房间（用具名 handler，便于在离开页面时卸载）
  const onWhoJoins = (data: any) => {
    const aim = data.data
    Flow.newUser(aim.user)
    addUserMessager(aim.name, '进入了房间')
    //建立对应数据
    dataStore.setUserData(aim.user, { userName: aim.name, userAvatar: aim.hisAvatar })
  }

  const onStartStroke = (data: any) => {
    const aim = data.data
    const stroke = aim.stroke
    if (!stroke) return
    if (!stroke.id && aim.tempId) {
      stroke.id = aim.tempId
    }
    stroke.ownerId = aim.user
    Flow.pushStroke(stroke, aim.user)
  }

  const onConfirmStroke = (data: any) => {
    const aim = data.data
    Flow.replaceStrokeId(aim.tempId, aim.strokeId)
    if (typeof aim.version === 'number') {
      const board = Flow.getBoard()
      const stroke = board.getStrokeById(aim.strokeId)
      if (stroke) stroke.version = aim.version
    }
  }

  const onStrokePoints = (data: any) => {
    const aim = data.data
    Flow.pushOtherPoints(aim.points, aim.user, aim.strokeId)
  }

  const onStrokeUpdate = (data: any) => {
    const aim = data.data
    if (!aim?.stroke) return
    Flow.updateRemoteStroke(aim.user, aim.strokeId, aim.stroke)
  }

  const onFinishStroke = (data: any) => {
    const aim = data.data
    if (aim.stroke) {
      aim.stroke.ownerId = aim.user
    }
    Flow.setFinish(aim.user, aim.strokeId, aim.stroke)
  }

  const onEraseStrokes = (data: any) => {
    const aim = data.data
    Flow.handleRemoteRemoval(aim.strokeIds || [])
  }

  const onUndoResult = (data: any) => {
    const aim = data.data
    Flow.handleRemoteRemoval(aim.strokeIds || [])
  }

  const onRestoreStrokes = (data: any) => {
    const aim = data.data
    Flow.handleRestoreStrokes(aim.strokes || [])
  }

  const onWhoExit = (data: any) => {
    const aim = data.data
    Flow.delUser(aim.user)
    addUserMessager(aim.name, '离开了房间')
  }

  const onUserKicked = (data: any) => {
    const aim = data.data
    Flow.delUser(aim.user)
    const userText = aim.message ? `被移除房间：${aim.message}` : '被移除房间'
    addUserMessager(aim.name, userText)
  }

  client.on('whoJoins', onWhoJoins)
  client.on('startStroke', onStartStroke)
  client.on('confirmStroke', onConfirmStroke)
  client.on('strokePoints', onStrokePoints)
  client.on('strokeUpdate', onStrokeUpdate)
  client.on('finishStroke', onFinishStroke)
  client.on('eraseStrokes', onEraseStrokes)
  client.on('undoResult', onUndoResult)
  client.on('restoreStrokes', onRestoreStrokes)
  client.on('whoExit', onWhoExit)
  client.on('userKicked', onUserKicked)

  //退出：返回清理函数
  return () => {
    client.off('whoJoins', onWhoJoins)
    client.off('startStroke', onStartStroke)
    client.off('confirmStroke', onConfirmStroke)
    client.off('strokePoints', onStrokePoints)
    client.off('strokeUpdate', onStrokeUpdate)
    client.off('finishStroke', onFinishStroke)
    client.off('eraseStrokes', onEraseStrokes)
    client.off('undoResult', onUndoResult)
    client.off('restoreStrokes', onRestoreStrokes)
    client.off('whoExit', onWhoExit)
    client.off('userKicked', onUserKicked)
  }
}
