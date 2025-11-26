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
import { sendNewStroke, sendStrokePoints, sendStrokeFinish, sendHistoryToserver } from '@/models'
function newUserFlow(): allFlowItem {
  return {
    strokes: new StrokeQueue(),
  }
}
import { myWebsocketClient } from '@/models/webSocket/cilentExample'
//点的组队发送，节流
function sendThrottler() {
  let willSend: Point[] = []
  let lastPoint: Point | null = null
  let lastTime = 0

  function send(id: string) {
    myWebsocketClient.send(sendStrokePoints(willSend, id))
    willSend = []
    lastTime = Date.now()
  }

  return {
    //确保第一次不会直接发送
    newStroke() {
      lastTime = Date.now()
    },
    addPoint(pt: Point, id: string) {
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
      //绘画结束(置空)发送
      send(id)
      willSend = []
      lastPoint = null
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
  const myId = id
  //默认是一个
  const allFlow = new Map<string, allFlowItem>([[myId, newUserFlow()]])
  let isRender: boolean = false
  function startRender() {
    if (!isRender) {
      requestAnimationFrame(render)
      isRender = true
    }
  }
  function render() {
    let once = false
    //有一次渲染就不停
    for (const [key, value] of allFlow) {
      if (value.strokes.queueShouleRender()) {
        once = true
        //没渲染完成 每次只执行一部分   不全部完成
        //得到首个队列元素
        const nowRender = value.strokes.getHead()
        if (!nowRender) {
          continue
        }
        //第一个笔画若已经完成
        if (nowRender.finish && nowRender.now === nowRender.points.length - 1) {
          //去除第一个笔画同时加入board中
          const willAdd = value.strokes.finishRender()
          console.log(willAdd)
          bd.addStroke(willAdd)
          //之后如果为空就clear（防止number溢出）
          if (value.strokes.isEmpty()) {
            // value.strokes.clear()
          }
        } else {
          ctx.save()
          ctx.translate(bd.getPanx(), bd.getPany())
          ctx.scale(bd.getZoom(), bd.getZoom())
          //否则渲染
          //先移动到上个点的位置
          ctx.beginPath()
          const last = nowRender.points[nowRender.now]
          if (last) {
            ctx.moveTo(nowRender.head.x + last.x, nowRender.head.y + last.y)
          }
          //准备样式
          ctx.lineCap = 'round'
          ctx.lineJoin = 'round'
          ctx.lineWidth = nowRender.width
          ctx.strokeStyle = nowRender.color
          // 锯齿感？
          ctx.shadowBlur = 10
          ctx.shadowColor = nowRender.color

          //绘图开始
          for (let i = nowRender.now + 1; i < nowRender.points.length; i++) {
            let x = (nowRender.points[i] as Point).x + nowRender.head.x
            let y = (nowRender.points[i] as Point).y + nowRender.head.y
            ctx.lineTo(x, y)
          }
          ctx.stroke()
          //更新已渲染的部分标记
          nowRender.now = nowRender.points.length - 1
          ctx.restore()
        }
      } else {
        //渲染完成
        continue
      }
    }
    if (once) {
      //有一次渲染就继续
      requestAnimationFrame(render)
    } else {
      // 否则结束
      isRender = false
    }
  }
  return {
    pushPoint(pt: Point, id: string = myId) {
      //不传id时获取自己的队列
      const myQueue = allFlow.get(id)
      if (myQueue) {
        myQueue.strokes.appendPointToTail(pt)
      }
      //开始渲染
      startRender()
      //多人时加入点
      if (id !== '0' && id === myId) {
        myThrotter.addPoint(pt, id)
      }
    },
    pushStroke(stroke: Stroke, id: string = myId) {
      const myQueue = allFlow.get(id)
      if (myQueue) {
        myQueue.strokes.enqueueNewStroke(stroke)
      }
      //开始渲染
      startRender()
      //发送
      if (id !== '0' && id === myId) {
        myThrotter.newStroke()
        myWebsocketClient.send(sendNewStroke(myId, stroke))
      }
    },
    //自己的finish
    setFinish(id: string = myId) {
      const myQueue = allFlow.get(id)
      if (myQueue) {
        //守卫
        const last = myQueue.strokes.getTeil()
        if (last) {
          //守卫
          last.finish = true
          if (id !== '0' && id === myId) {
            //多人条件判断
            // 发送并置空
            myThrotter.oneFinish(id)
            // 发送完成的消息
            myWebsocketClient.send(sendStrokeFinish(id))
            //发送历史记录
            myWebsocketClient.send(sendHistoryToserver(last))
          }
        }
      }
    },
    //新建用户
    newUser(id: string) {
      allFlow.set(id, newUserFlow())
    },
    //删除用户
    delUser(id: string) {
      allFlow.delete(id)
    },
    pushOtherPoints(pts: Point[], id: string) {
      const Queue = allFlow.get(id)
      if (Queue) {
        Queue.strokes.appendPoints(pts)
      }
    },
    newOthers(others: string[]) {
      others.forEach((value, index) => {
        if (!allFlow.has(value)) {
          //没有就新建
          allFlow.set(value, newUserFlow())
        }
      })
    },
    getBoard() {
      return bd
    },
  }
}
