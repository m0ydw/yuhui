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
  version?: number
  ownerId?: string
}
//数据表格
export type gridMap = Map<string, Stroke[]>
//画板
export interface Board {
  screenToWorldStroke: (st: Stroke) => Stroke
  worldToScreen: (wx: number, wy: number) => Point
  addStroke: (stroke: Stroke) => void
  addStrokes: (strokes: Stroke[]) => void
  /**
   * 将“已完成笔画”写入虚拟画布/缓存层（用于后续平移缩放时截图渲染）
   * 注意：通常在 addStroke 之后调用
   */
  renderStrokeToWorld: (stroke: Stroke) => void
  render: (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => void
  setPan: (x: number, y: number, ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => void
  setPanAbsolute: (
    panX: number,
    panY: number,
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
  ) => void
  setZoom: (
    z: number,
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    thisX?: number,
    thisY?: number,
  ) => void
  setZoomAbsolute: (z: number, ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => void
  getZoom: () => number
  resize: (width: number, height: number) => void
  toWorldX: (x: number) => number
  toWorldY: (y: number) => number
  getPanx: () => number
  getPany: () => number
  getState: () => { panX: number; panY: number; zoom: number }
  setState: (
    state: { panX: number; panY: number; zoom: number },
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
  ) => void
  initBoard: (history: Stroke[], ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => void
  replaceStrokeId: (oldId: string, newId: string) => void
  removeStrokesById: (ids: string[]) => Stroke[]
  getStrokeById: (id: string) => Stroke | undefined
  clearAll: (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => void
  // 新增橡皮擦相关函数（全部加上！）
  /** 开始橡皮擦模式（鼠标按下） */
  startErasing: () => void

  /** 收集橡皮擦路径上的笔画（鼠标移动时频繁调用） */
  collectErasingStrokes: (screenPoints: Point[], eraserRadius?: number) => void

  /** 确认删除（鼠标松开），返回被删除的笔画用于 undo */
  confirmErase: () => Stroke[]

  /** 渲染时判断某笔画是否正在被擦除（用于变透明效果） */
  isStrokeBeingErased: (stroke: Stroke) => boolean

  /** （可选）获取最近一次橡皮擦删除的笔画，用于精细 undo */
  getLastErasedStrokes: () => Stroke[]
  // 橡皮渲染
  containQueue: (aim: strokeFlow) => void
  //获取所有strokes
  getAllStrokes: () => Stroke[]
}
//工具类型
export type toolMode = 'hand' | 'pen' | 'eraser'
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
  getAllStroke(): Stroke[] {
    return [...this.items.values()]
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
  appendPoints(pts: Point[]): void {
    const tailStroke = this.getTeil() as Stroke
    if (!tailStroke) {
      throw new Error('队列空，无法追加点')
    }
    tailStroke.points.push(...pts)
  }

  getStrokeById(id: string): Stroke | undefined {
    for (const [, stroke] of this.items) {
      if (stroke.id === id) {
        return stroke
      }
    }
    return undefined
  }

  appendPointsToStroke(strokeId: string | undefined, pts: Point[]): void {
    if (!pts.length) {
      return
    }
    if (!strokeId) {
      this.appendPoints(pts)
      return
    }
    const target = this.getStrokeById(strokeId) || this.getTeil()
    if (!target) {
      throw new Error('未找到目标笔画，无法追加点')
    }
    target.points.push(...pts)
  }

  replaceStrokeId(oldId: string, newId: string): void {
    if (!oldId || !newId || oldId === newId) {
      return
    }
    const target = this.getStrokeById(oldId)
    if (target) {
      target.id = newId
    }
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
  resetStroke() {
    for (const [, value] of this.items) {
      if (!value.finish) value.now = 0
    }
    this.queueNeedRender = true
  }
}
//单人的
export interface allFlowItem {
  strokes: StrokeQueue
}
//
export interface strokeFlow {
  pushPoint: (pt: Point, id?: string) => void
  pushStroke: (stroke: Stroke, id?: string) => void
  setFinish: (userId?: string, strokeId?: string, finishedStroke?: Stroke) => void
  newUser: (id: string) => void
  delUser: (id: string) => void
  pushOtherPoints: (pts: Point[], id: string, strokeId?: string) => void
  getBoard: () => Board
  newOthers: (others: string[]) => void
  replaceStrokeId: (tempId: string, realId: string) => void
  handleRemoteRemoval: (ids: string[]) => void
  handleLocalErase: (ids: string[], removedStrokes?: Stroke[]) => void
  requestUndo: () => void
  requestRedo: () => void
  handleRestoreStrokes: (strokes: Stroke[]) => void
  resetStroke: () => void
  clearAll: () => void
}

export interface roomState {
  roomId: string //room索引
  num: number //总人数
  roomName: string
}
