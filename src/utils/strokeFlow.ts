// 发送
//节流配置
const SEND_INTERVAL = 16 // 60fps，约16ms发送一次
const BATCH_SIZE = 15 // 累积15个点或距离超过阈值也发送
const DISTANCE_THRESHOLD = 20 // 点之间像素距离超过20立即发送

import {
  StrokeQueue,
  type allFlowItem,
  type Point,
  type Stroke,
  type strokeFlow,
  type Board,
} from '@/models/types'
import { distanceTwoPoints } from './pointUtils'
import {
  sendStartStroke,
  sendStrokePoints,
  sendStrokeFinish,
  sendEraseStrokes,
  sendUndoRequest,
  sendRedoRequest,
} from '@/models'
function newUserFlow(): allFlowItem {
  return {
    strokes: new StrokeQueue(),
  }
}
import { myWebsocketClient } from '@/models/webSocket/cilentExample'
// 临时的strokeid
function generateTempStrokeId(): string {
  const randomPart =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`
  return `temp_${randomPart}`
}

//点的组队发送，节流
function sendThrottler() {
  let willSend: Point[] = []
  let lastPoint: Point | null = null
  let lastTime = 0
  let currentStrokeId: string | null = null

  function send(userId: string) {
    if (!currentStrokeId || willSend.length === 0) {
      return
    }
    myWebsocketClient.send(sendStrokePoints(willSend, currentStrokeId, userId))
    willSend = []
    lastTime = Date.now()
  }

  return {
    //确保第一次不会直接发送
    newStroke(strokeId: string) {
      currentStrokeId = strokeId
      lastTime = Date.now()
      willSend = []
      lastPoint = null
    },
    addPoint(pt: Point, id: string) {
      if (!currentStrokeId) {
        return
      }
      willSend.push(pt)
      const now = Date.now()
      const lastToNow = now - lastTime
      let distance = 0
      if (lastPoint) {
        distance = distanceTwoPoints(lastPoint, pt)
      }
      //条件
      const shouldSend =
        lastToNow >= SEND_INTERVAL || // 时间到了
        willSend.length >= BATCH_SIZE || // 点攒够了
        distance >= DISTANCE_THRESHOLD
      if (shouldSend) {
        send(id)
      }
      //状态更新
      lastPoint = pt
    },
    oneFinish(id: string) {
      if (!currentStrokeId) {
        return
      }
      //绘画结束(置空)发送
      send(id)
      willSend = []
      lastPoint = null
      currentStrokeId = null
    },
  }
}
const myThrotter = sendThrottler()
export function newStrokeFlow(
  id: string = '0',
  ct: CanvasRenderingContext2D,
  bd: Board,
): strokeFlow {
  const ctx = ct
  const canvasEl = ctx.canvas as HTMLCanvasElement
  const myId = id
  const allFlow = new Map<string, allFlowItem>([[myId, newUserFlow()]])
  const userActiveStroke = new Map<string, string>()
  const idAlias = new Map<string, string>()
  let isRender: boolean = false
  const isOffline = myId === '0'

  type LocalOperation = { type: 'draw' | 'erase'; strokes: Stroke[] }
  const LOCAL_HISTORY_LIMIT = 50
  const localUndoStack: LocalOperation[] = []
  const localRedoStack: LocalOperation[] = []
  // 获取id对应人的队列
  function ensureUserFlow(userId: string): allFlowItem {
    if (!allFlow.has(userId)) {
      allFlow.set(userId, newUserFlow())
    }
    return allFlow.get(userId)!
  }
  // 开始渲染
  function startRender() {
    if (!isRender) {
      requestAnimationFrame(render)
      isRender = true
    }
  }
  // 获取真实的id
  function resolveStrokeId(strokeId: string): string {
    let current = strokeId
    const guard = new Set<string>()
    while (current && idAlias.has(current) && !guard.has(current)) {
      guard.add(current)
      current = idAlias.get(current) as string
    }
    return current
  }

  function ensureStrokeIdentity(stroke: Stroke, owner: string) {
    if (!stroke.id) {
      stroke.id = generateTempStrokeId()
    }
    stroke.ownerId = stroke.ownerId || owner
    if (typeof stroke.version !== 'number') {
      stroke.version = 0
    }
  }

  function clonePoint(pt: Point): Point {
    return { x: pt.x, y: pt.y, t: pt.t, p: pt.p }
  }

  function cloneStrokeData(stroke: Stroke): Stroke {
    return {
      head: clonePoint(stroke.head),
      id: stroke.id,
      points: stroke.points.map((p) => clonePoint(p)),
      color: stroke.color,
      tool: stroke.tool,
      now: stroke.now,
      width: stroke.width,
      finish: stroke.finish,
      ownerId: stroke.ownerId,
      version: stroke.version,
    }
  }

  function pushLocalOperation(op: LocalOperation) {
    if (!isOffline) return
    localUndoStack.push({
      type: op.type,
      strokes: op.strokes.map((stroke) => cloneStrokeData(stroke)),
    })
    if (localUndoStack.length > LOCAL_HISTORY_LIMIT) {
      localUndoStack.shift()
    }
    localRedoStack.length = 0
  }

  function recordLocalDraw(stroke: Stroke) {
    if (!isOffline) return
    pushLocalOperation({ type: 'draw', strokes: [stroke] })
  }

  function recordLocalErase(strokes: Stroke[]) {
    if (!isOffline || !strokes.length) return
    pushLocalOperation({ type: 'erase', strokes })
  }

  function performLocalUndo(): boolean {
    if (!isOffline) return false
    const op = localUndoStack.pop()
    if (!op) {
      return false
    }
    if (op.type === 'draw') {
      const ids = op.strokes.map((stroke) => resolveStrokeId(stroke.id)).filter(Boolean)
      if (ids.length) {
        bd.removeStrokesById(ids)
        bd.render(ctx, canvasEl)
      }
    } else {
      bd.addStrokes(op.strokes.map((stroke) => cloneStrokeData(stroke)))
      bd.render(ctx, canvasEl)
    }
    localRedoStack.push(op)
    if (localRedoStack.length > LOCAL_HISTORY_LIMIT) {
      localRedoStack.shift()
    }
    return true
  }

  function performLocalRedo(): boolean {
    if (!isOffline) return false
    const op = localRedoStack.pop()
    if (!op) {
      return false
    }
    if (op.type === 'draw') {
      bd.addStrokes(op.strokes.map((stroke) => cloneStrokeData(stroke)))
      bd.render(ctx, canvasEl)
    } else {
      const ids = op.strokes.map((stroke) => resolveStrokeId(stroke.id)).filter(Boolean)
      if (ids.length) {
        bd.removeStrokesById(ids)
        bd.render(ctx, canvasEl)
      }
    }
    localUndoStack.push(op)
    if (localUndoStack.length > LOCAL_HISTORY_LIMIT) {
      localUndoStack.shift()
    }
    return true
  }

  function render() {
    let once = false
    for (const [, value] of allFlow) {
      if (value.strokes.queueShouleRender()) {
        once = true
        const nowRender = value.strokes.getHead()
        if (!nowRender) {
          continue
        }
        if (nowRender.finish && nowRender.now === nowRender.points.length - 1) {
          const willAdd = value.strokes.finishRender()
          bd.addStroke(willAdd)
        } else {
          ctx.save()
          ctx.translate(bd.getPanx(), bd.getPany())
          ctx.scale(bd.getZoom(), bd.getZoom())
          ctx.beginPath()
          const last = nowRender.points[nowRender.now]
          if (last) {
            ctx.moveTo(nowRender.head.x + last.x, nowRender.head.y + last.y)
          }
          ctx.lineCap = 'round'
          ctx.lineJoin = 'round'
          ctx.lineWidth = nowRender.width
          ctx.strokeStyle = nowRender.color
          for (let i = nowRender.now + 1; i < nowRender.points.length; i++) {
            let x = (nowRender.points[i] as Point).x + nowRender.head.x
            let y = (nowRender.points[i] as Point).y + nowRender.head.y
            ctx.lineTo(x, y)
          }
          ctx.stroke()
          nowRender.now = nowRender.points.length - 1
          ctx.restore()
        }
      }
    }
    if (once) {
      requestAnimationFrame(render)
    } else {
      isRender = false
    }
  }

  function broadcastStrokeStart(stroke: Stroke) {
    if (myId === '0') return
    myThrotter.newStroke(stroke.id)
    myWebsocketClient.send(sendStartStroke(myId, stroke.id, stroke))
  }

  function broadcastFinish(stroke: Stroke) {
    if (myId === '0') return
    myThrotter.oneFinish(myId)
    const resolvedId = resolveStrokeId(stroke.id)
    stroke.id = resolvedId
    myWebsocketClient.send(sendStrokeFinish(myId, resolvedId, stroke))
  }

  function markActive(userId: string, strokeId: string) {
    userActiveStroke.set(userId, strokeId)
  }

  function clearActive(userId: string, strokeId?: string) {
    if (!strokeId) {
      userActiveStroke.delete(userId)
      return
    }
    const resolved = resolveStrokeId(strokeId)
    const active = userActiveStroke.get(userId)
    if (active === strokeId || active === resolved) {
      userActiveStroke.delete(userId)
    }
  }

  return {
    pushPoint(pt: Point, id: string = myId) {
      const myQueue = ensureUserFlow(id)
      myQueue.strokes.appendPointToTail(pt)
      startRender()
      if (id !== '0' && id === myId) {
        myThrotter.addPoint(pt, id)
      }
    },
    pushStroke(stroke: Stroke, userId: string = myId) {
      ensureStrokeIdentity(stroke, userId)
      stroke.finish = Boolean(stroke.finish)
      const myQueue = ensureUserFlow(userId)
      myQueue.strokes.enqueueNewStroke(stroke)
      markActive(userId, stroke.id)
      startRender()
      if (userId !== '0' && userId === myId) {
        broadcastStrokeStart(stroke)
      }
    },
    setFinish(userId: string = myId, strokeId?: string, finishedStroke?: Stroke) {
      const myQueue = allFlow.get(userId)
      if (myQueue) {
        const targetId = strokeId ? resolveStrokeId(strokeId) : undefined
        let last = targetId ? myQueue.strokes.getStrokeById(targetId) : undefined
        if (!last) {
          last = myQueue.strokes.getTeil()
        }
        if (last) {
          last.finish = true
          if (finishedStroke && userId !== myId) {
            Object.assign(last, finishedStroke)
          }
          if (userId !== '0' && userId === myId) {
            broadcastFinish(last)
          }
          if (isOffline && userId === myId) {
            recordLocalDraw(cloneStrokeData(last))
          }
        }
      }
      clearActive(userId, strokeId)
    },
    newUser(userId: string) {
      ensureUserFlow(userId)
    },
    delUser(userId: string) {
      allFlow.delete(userId)
      userActiveStroke.delete(userId)
    },
    pushOtherPoints(pts: Point[], userId: string, strokeId?: string) {
      const resolvedId = strokeId ? resolveStrokeId(strokeId) : undefined
      if (resolvedId) {
        markActive(userId, resolvedId)
      }
      const queue = ensureUserFlow(userId)
      queue.strokes.appendPointsToStroke(resolvedId, pts)
      startRender()
    },
    newOthers(others: string[]) {
      others.forEach((value) => {
        ensureUserFlow(value)
      })
    },
    getBoard() {
      return bd
    },
    replaceStrokeId(tempId: string, realId: string) {
      if (!tempId || !realId || tempId === realId) {
        return
      }
      const resolved = resolveStrokeId(tempId)
      idAlias.set(resolved, realId)
      bd.replaceStrokeId(resolved, realId)
      allFlow.forEach((value) => {
        value.strokes.replaceStrokeId(resolved, realId)
      })
      for (const [user, stroke] of userActiveStroke.entries()) {
        if (stroke === tempId || stroke === resolved) {
          userActiveStroke.set(user, realId)
        }
      }
    },
    handleRemoteRemoval(ids: string[]) {
      if (!ids.length) {
        return
      }
      const resolved = Array.from(new Set(ids.map((id) => resolveStrokeId(id)).filter(Boolean)))
      if (!resolved.length) {
        return
      }
      bd.removeStrokesById(resolved)
      resolved.forEach((id) => {
        for (const [user, active] of userActiveStroke.entries()) {
          const activeResolved = resolveStrokeId(active)
          if (active === id || activeResolved === id) {
            userActiveStroke.delete(user)
          }
        }
      })
      bd.render(ctx, canvasEl)
    },
    handleLocalErase(ids: string[], removedStrokes: Stroke[] = []) {
      if (!ids.length) {
        return
      }
      const resolved = Array.from(new Set(ids.map((id) => resolveStrokeId(id)).filter(Boolean)))
      if (!resolved.length) {
        return
      }
      if (isOffline) {
        if (removedStrokes.length) {
          recordLocalErase(removedStrokes.map((stroke) => cloneStrokeData(stroke)))
        }
        return
      }
      if (myId === '0') {
        return
      }
      myWebsocketClient.send(sendEraseStrokes(myId, resolved))
    },
    requestUndo() {
      if (performLocalUndo()) {
        return
      }
      if (myId === '0') {
        return
      }
      myWebsocketClient.send(sendUndoRequest(myId))
    },
    requestRedo() {
      if (performLocalRedo()) {
        return
      }
      if (myId === '0') {
        return
      }
      myWebsocketClient.send(sendRedoRequest(myId))
    },
    handleRestoreStrokes(strokes: Stroke[]) {
      if (!strokes?.length) {
        return
      }
      bd.addStrokes(strokes.map((stroke) => ({ ...stroke })))
      bd.render(ctx, canvasEl)
    },
    resetStroke() {
      // 重绘所有未完成的笔画

      for (const [, value] of allFlow) {
        let arr = value.strokes.getAllStroke()
        for (let i = 0; i < arr.length; i++) {
          let st = arr[i]
          if (!st) continue
          ctx.save()
          ctx.translate(bd.getPanx(), bd.getPany())
          ctx.scale(bd.getZoom(), bd.getZoom())
          ctx.beginPath()
          ctx.lineCap = 'round'
          ctx.lineJoin = 'round'
          ctx.lineWidth = st.width
          ctx.strokeStyle = st.color
          ctx.moveTo(st.head.x, st.head.y)
          for (const pt of st.points) {
            let x = pt.x + st.head.x
            let y = pt.y + st.head.y
            ctx.lineTo(x, y)
          }
          st.now = st.points.length - 1

          ctx.stroke()
          ctx.restore()
        }
      }
    },
    clearAll() {
      // 仅清理本地队列与撤销栈，不发任何联机消息
      for (const [, value] of allFlow) {
        value.strokes.clear()
      }
      userActiveStroke.clear()
      idAlias.clear()
      localUndoStack.length = 0
      localRedoStack.length = 0
    },
  }
}
