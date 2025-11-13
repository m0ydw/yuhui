import {
  StrokeQueue,
  type allFlowItem,
  type Point,
  type Stroke,
  type strokeFlow,
  type Board,
} from '@/models/types'
function newUserFlow(): allFlowItem {
  return {
    strokes: new StrokeQueue(),
  }
}

export function newStrokeFlow(id: number = 0, ct: CanvasRenderingContext2D, bd: Board): strokeFlow {
  const ctx = ct
  const myId = id
  //默认是一个
  const allFlow = new Map<number, allFlowItem>([[myId, newUserFlow()]])
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
          bd.addStroke(bd.screenToWorldStroke(willAdd))
          //之后如果为空就clear（防止number溢出）
          if (value.strokes.isEmpty()) {
            // value.strokes.clear()
          }
        } else {
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
          //绘图开始
          for (let i = nowRender.now + 1; i < nowRender.points.length; i++) {
            ctx.lineTo(
              (nowRender.points[i] as Point).x + nowRender.head.x,
              (nowRender.points[i] as Point).y + nowRender.head.y,
            )
          }
          ctx.stroke()
          //更新已渲染的部分标记
          nowRender.now = nowRender.points.length - 1
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
    pushPoint(pt: Point, id: number = myId) {
      //不传id时获取自己的队列
      const myQueue = allFlow.get(id)
      if (myQueue) {
        myQueue.strokes.appendPointToTail(pt)
      }
      //开始渲染
      startRender()
    },
    pushStroke(stroke: Stroke, id: number = myId) {
      const myQueue = allFlow.get(id)
      if (myQueue) {
        myQueue.strokes.enqueueNewStroke(stroke)
      }
      //开始渲染
      startRender()
    },
    //自己的finish
    setFinish(id: number = myId) {
      const myQueue = allFlow.get(id)
      if (myQueue) {
        const last = myQueue.strokes.getTeil()
        if (last) {
          last.finish = true
        }
      }
    },
    //新建用户

    //删除用户
  }
}
