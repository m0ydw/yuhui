import type { Point, Stroke, Board } from '@/models/types'
import type { Ref } from 'vue'
export function newBoard(gridSize: number, vw: Ref<number>, vh: Ref<number>): Board {
  //每格大小
  const GRID_SIZE = gridSize
  //空间哈希表
  const gridMap: Map<string, Stroke[]> = new Map()
  //视窗大小
  //逻辑画布偏移量
  let panX = 0,
    panY = 0
  //缩放系数
  let zoom = 1
  //将世界坐标转化对应到表格的string(内部工具函数)
  const key = (x: number, y: number) => `${Math.floor(x / gridSize)},${Math.floor(y / gridSize)}`
  //画布坐标转化为世界坐标
  function _screenToWorld(pt: Point): Point {
    return {
      x: (pt.x - panX) / zoom,
      y: (pt.y - panY) / zoom,
      t: pt.t,
      p: pt.p,
    }
  }
  // 把世界坐标转化画布坐标
  function _worldToScreen(wx: number, wy: number): Point {
    return {
      x: wx * zoom + panX,
      y: wy * zoom + panY,
      t: Infinity,
    }
  }
  //向表格中添加笔画(第一层(seen)set去重)
  function _addStroke(st: Stroke): void {
    const stroke = {
      ...st,
      points: [...st.points],
      head: { ...st.head },
    }
    const seen = new Set<string>()
    //对head处理
    const headKey = key(stroke.head.x, stroke.head.y)
    if (!seen.has(headKey)) {
      seen.add(headKey)
      if (!gridMap.has(headKey)) {
        gridMap.set(headKey, [])
        //没有则初始化
      }
      // 然后push
      gridMap.get(headKey)!.push(stroke)
    }
    stroke.points.forEach((p) => {
      const k = key(p.x + stroke.head.x, p.y + stroke.head.y)
      if (!seen.has(k)) {
        seen.add(k)
        if (!gridMap.has(k)) {
          //没有则初始化
          gridMap.set(k, [])
        }
        // 然后push
        gridMap.get(k)!.push(stroke)
      }
    })
  }
  //根据视窗收集可见 stroke
  function _strokesInView(): Set<Stroke> {
    const topLeft = _screenToWorld({ x: 0, y: 0, t: 0 })
    const botRight = _screenToWorld({ x: vw.value, y: vh.value, t: 0 })

    const minX = Math.floor(topLeft.x / GRID_SIZE)
    const maxX = Math.floor(botRight.x / GRID_SIZE)
    const minY = Math.floor(topLeft.y / GRID_SIZE)
    const maxY = Math.floor(botRight.y / GRID_SIZE)

    const result = new Set<Stroke>()
    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        const list = gridMap.get(`${x},${y}`)
        if (list) {
          list.forEach((s) => result.add(s))
        }
      }
    }
    return result
  }
  //渲染
  function _render(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement): void {
    ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight)
    ctx.save()
    ctx.translate(panX, panY)
    ctx.scale(zoom, zoom)

    // 网格线（调试用，可删）
    ctx.strokeStyle = '#ddd'
    ctx.lineWidth = 1 / zoom // 保证 1px 屏幕像素
    const topLeft = _screenToWorld({ x: 0, y: 0, t: 0 })
    const botRight = _screenToWorld({ x: vw.value, y: vh.value, t: 0 })
    const minGX = Math.floor(topLeft.x / GRID_SIZE)
    const maxGX = Math.floor(botRight.x / GRID_SIZE)
    const minGY = Math.floor(topLeft.y / GRID_SIZE)
    const maxGY = Math.floor(botRight.y / GRID_SIZE)
    for (let gx = minGX; gx <= maxGX; gx++) {
      const x = gx * GRID_SIZE
      ctx.beginPath()
      ctx.moveTo(x, topLeft.y)
      ctx.lineTo(x, botRight.y)
      ctx.stroke()
    }
    for (let gy = minGY; gy <= maxGY; gy++) {
      const y = gy * GRID_SIZE
      ctx.beginPath()
      ctx.moveTo(topLeft.x, y)
      ctx.lineTo(botRight.x, y)
      ctx.stroke()
    }

    // 渲染 stroke
    _strokesInView().forEach((stroke) => {
      ctx.strokeStyle = stroke.color
      ctx.lineWidth = stroke.width
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      // 锯齿感？
      ctx.shadowBlur = 1
      ctx.shadowColor = stroke.color
      ctx.beginPath()
      ctx.moveTo(stroke.head.x, stroke.head.y)
      stroke.points.forEach((p) => {
        ctx.lineTo(p.x + stroke.head.x, p.y + stroke.head.y)
      })
      ctx.stroke()
    })

    ctx.restore()
  }
  return {
    //画布坐标转化为世界坐标
    screenToWorldStroke: (st: Stroke): Stroke => {
      return {
        head: _screenToWorld(st.head),
        id: st.id,
        points: st.points,
        color: st.color,
        tool: st.tool,
        now: st.now,
        width: st.width,
        finish: st.finish,
      }
    },
    // 把世界坐标转化画布坐标
    worldToScreen: (wx: number, wy: number): Point => _worldToScreen(wx, wy),
    //向表格中添加笔画
    addStroke: (stroke: Stroke): void => _addStroke(stroke),
    //渲染
    render: (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement): void =>
      _render(ctx, canvas),
    //控制视图(传入相对位置)
    setPan: (x: number, y: number, ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
      panX += x
      panY += y
      _render(ctx, canvas)
    },
    getZoom: (): number => {
      return zoom
    },
    setZoom: (
      z: number,
      ctx: CanvasRenderingContext2D,
      canvas: HTMLCanvasElement,
      thisX: number = NaN, //二者是传入的canvas的坐标
      thisY: number = NaN,
    ) => {
      // 1. 画布中心
      const cx = thisX || canvas.clientWidth / 2
      const cy = thisY || canvas.clientHeight / 2

      // 2. 旧 zoom 下中心对应的世界坐标
      const worldCX = (cx - panX) / zoom
      const worldCY = (cy - panY) / zoom
      //zoom修改
      zoom = z
      // 4. 保持该中心点在屏幕中心不动
      panX = cx - worldCX * zoom
      panY = cy - worldCY * zoom
      _render(ctx, canvas)
    },
    resize: (width: number, height: number) => {
      vw.value = width
      vh.value = height
    },
    getPanx: () => panX,
    getPany: () => panY,
    toWorldX: (x: number) => (x - panX) / zoom,
    toWorldY: (y: number) => (y - panY) / zoom,
    initBoard: (history: Stroke[], ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
      history.forEach((value) => {
        _addStroke(value)
      })
      _render(ctx, canvas)
    },
  }
}
