import type { Ref } from 'vue'
//点
export interface Point {
  x: number
  y: number
  t: number
  p?: number
}
//笔画
export interface Stroke {
  head: Point
  id: string
  points: Point[]
  color: string
  tool: string
  now: number
  width: number
  finish: boolean
}
//数据表格
export type gridMap = Map<string, Stroke[]>
//画板
export interface Board {
  screenToWorldStroke: (st: Stroke) => Stroke
  worldToScreen: (wx: number, wy: number) => Point
  addStroke: (stroke: Stroke) => void
  render: (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => void
  setPan: (x: number, y: number) => void
  setZoom: (z: number) => void
  resize: (width: number, height: number) => void
}
//工具类型
export type toolMode = 'hand' | 'pen'
export interface myTool {
  toolName: toolMode
  penSize: number
  penColor: number
}
//画板状态
export interface boardStatus {
  isDrawing: boolean
  isRender: boolean
  nowColor: string
  penSize: number
  windowVw: Ref<number>
  windowVh: Ref<number>
}

//绘画工作流
//一个绘画队列
export class StrokeQueue {
  private items = new Map<number, Stroke>()
  private head: number = 0
  private tail: number = -1
  private queueNeedRender: boolean = false
  //methods
  isEmpty(): boolean {
    return this.tail < this.head
  }
  getHead(): Stroke | undefined {
    return this.items.get(this.head)
  }
  getTeil(): Stroke | undefined {
    return this.items.get(this.tail)
  }
  // 创建并添加新笔画到队尾
  enqueueNewStroke(stroke: Stroke): void {
    if (!this.queueNeedRender) {
      this.queueNeedRender = true
    }
    //不为空时 前一个笔画标记为完成
    if (!this.isEmpty()) {
      let temp = this.items.get(this.tail)
      if (temp) {
        temp.finish = true
      }
    }
    //
    this.tail++
    this.items.set(this.tail, {
      ...stroke,
      points: stroke.points.map((p) => ({ ...p })), // 深拷贝 points 数组
    })
    //如果push的是整个笔画（已经完成）？
  }
  // 向队尾笔画追加点（不创建新笔画）
  appendPointToTail(point: Point): void {
    const tailStroke = this.getTeil() as Stroke
    if (!tailStroke) {
      throw new Error('队列空，无法追加点')
    }
    tailStroke.points.push(point)
  }
  finishRender(): Stroke {
    //移除首元素
    if (this.isEmpty()) {
      throw new Error('队列空，无法移除')
    }
    const aim = this.getHead()
    this.items.delete(this.head)
    this.head++
    if (this.isEmpty()) {
      //为空时不需要渲染
      this.queueNeedRender = false
    }
    if (!aim) {
      throw new Error('获取首节点失败  2')
    }
    return aim
  }
  clear(): void {
    this.items.clear()
    this.head = 0
    this.tail = -1
    this.queueNeedRender = false
  }
  queueShouleRender(): boolean {
    return this.queueNeedRender
  }
}
//单人的
export interface allFlowItem {
  strokes: StrokeQueue
}
//总体的
export interface strokeFlow {
  pushPoint: (pt: Point, id?: number) => void
  pushStroke: (stroke: Stroke, id?: number) => void
  setFinish: (id?: number) => void
}
