import type { Point, Stroke, Board, strokeFlow } from '@/models/types'
import type { Ref } from 'vue'
import { pointToSegmentDistance2 } from './pointUtils'
export function newBoard(gridSize: number, vw: Ref<number>, vh: Ref<number>): Board {
  //每格大小
  const GRID_SIZE = gridSize
  //全局数组维护渲染顺序
  const orderedStrokes: Stroke[] = []
  const strokeIndex: Map<string, Stroke> = new Map()
  //空间哈希表
  const gridMap: Map<string, Stroke[]> = new Map()
  // 虚拟画布（按格子缓存）
  const tileMap: Map<string, HTMLCanvasElement> = new Map()
  const tileCtxMap: Map<string, CanvasRenderingContext2D> = new Map()
  const dirtyTiles: Set<string> = new Set()
  let userQueue: null | strokeFlow = null
  //视窗大小
  //逻辑画布偏移量
  let panX = 0,
    panY = 0
  //缩放系数
  let zoom = 1
  // 网格开关
  let showGrid = false
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
    const stroke = structuredClone(st)
    if (!stroke.id) {
      stroke.id = `s_${crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36)}`
    }
    if (strokeIndex.has(stroke.id)) {
      const duplicated = strokeIndex.get(stroke.id)
      if (duplicated) {
        _removeStrokeFromGrid(duplicated)
      }
    }
    //以上为id逻辑
    addStrokeToGrid(stroke, gridMap, GRID_SIZE, key)
    //插入全局 数组
    orderedStrokes.push(stroke)
    strokeIndex.set(stroke.id, stroke)
    // 写入虚拟 tile（只在新增/变更时一次性绘制）
    renderStrokeToTiles(stroke)
  }
  function _addStrokes(strokes: Stroke[]): void {
    strokes.forEach((stroke) => _addStroke(stroke))
  }

  function parseGridKey(k: string): { gx: number; gy: number } {
    const [xs, ys] = k.split(',')
    return { gx: Number(xs), gy: Number(ys) }
  }

  let tileScale = 1 // 随 zoom 提升时提高 tile 分辨率

  function ensureTile(
    k: string,
  ): { tile: HTMLCanvasElement; tileCtx: CanvasRenderingContext2D; gx: number; gy: number } {
    const existing = tileMap.get(k)
    const { gx, gy } = parseGridKey(k)
    if (existing) {
      return { tile: existing, tileCtx: tileCtxMap.get(k)!, gx, gy }
    }
    const canvas = document.createElement('canvas')
    const size = Math.max(GRID_SIZE, Math.floor(GRID_SIZE * tileScale))
    canvas.width = size
    canvas.height = size
    const tileCtx = canvas.getContext('2d')
    if (!tileCtx) {
      throw new Error('无法创建 tile CanvasRenderingContext2D')
    }
    tileMap.set(k, canvas)
    tileCtxMap.set(k, tileCtx)
    return { tile: canvas, tileCtx, gx, gy }
  }

  function drawStrokeOnCtx(ctx: CanvasRenderingContext2D, stroke: Stroke) {
    ctx.save()
    ctx.globalAlpha = 1
    ctx.strokeStyle = stroke.color
    ctx.lineWidth = stroke.width
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.beginPath()
    ctx.moveTo(stroke.head.x, stroke.head.y)
    for (const p of stroke.points) {
      ctx.lineTo(p.x + stroke.head.x, p.y + stroke.head.y)
    }
    ctx.stroke()
    ctx.restore()
  }

  function getStrokeCoveredCells(stroke: Stroke): Set<string> {
    const cells = new Set<string>()
    const hx = stroke.head.x
    const hy = stroke.head.y
    cells.add(key(hx, hy))
    const pts = stroke.points
    for (let i = 0; i < pts.length; i++) {
      const x1 = i === 0 ? hx : pts[i - 1]!.x + hx
      const y1 = i === 0 ? hy : pts[i - 1]!.y + hy
      const x2 = pts[i]!.x + hx
      const y2 = pts[i]!.y + hy
      addLineCoveredCells(x1, y1, x2, y2, GRID_SIZE, (x, y) => cells.add(key(x, y)))
    }
    return cells
  }

  function renderStrokeToTiles(stroke: Stroke) {
    const cells = getStrokeCoveredCells(stroke)
    for (const k of cells) {
      const { tileCtx, gx, gy } = ensureTile(k)
      const ox = gx * GRID_SIZE
      const oy = gy * GRID_SIZE
      tileCtx.save()
      tileCtx.translate(-ox, -oy)
      drawStrokeOnCtx(tileCtx, stroke)
      tileCtx.restore()
    }
  }

  function rebuildTile(k: string) {
    const cell = gridMap.get(k)
    if (!cell || cell.length === 0) {
      // cell 已空，直接清掉对应 tile（释放内存）
      tileMap.delete(k)
      tileCtxMap.delete(k)
      return
    }
    const { tileCtx, gx, gy } = ensureTile(k)
    const size = Math.max(GRID_SIZE, Math.floor(GRID_SIZE * tileScale))
    tileCtx.clearRect(0, 0, size, size)
    const ox = gx * GRID_SIZE
    const oy = gy * GRID_SIZE
    // 去重，避免同一 stroke 在 cell 里重复出现时重复绘制
    const uniq = new Map<string, Stroke>()
    for (const s of cell) {
      if (s?.id) uniq.set(s.id, s)
    }
    tileCtx.save()
    tileCtx.translate(-ox, -oy)
    for (const [, stroke] of uniq) {
      drawStrokeOnCtx(tileCtx, stroke)
    }
    tileCtx.restore()
  }
  //根据视窗收集可见 stroke
  function _strokesInView(): Stroke[] {
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
    return orderedStrokes.filter((stroke) => result.has(stroke))
  }
  //渲染
  function _render(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement): void {
    ctx.clearRect(0, 0, vw.value, vh.value)
    ctx.save()
    ctx.translate(panX, panY)
    ctx.scale(zoom, zoom)

    const topLeft = _screenToWorld({ x: 0, y: 0, t: 0 })
    const botRight = _screenToWorld({ x: vw.value, y: vh.value, t: 0 })
    const minGX = Math.floor(topLeft.x / GRID_SIZE)
    const maxGX = Math.floor(botRight.x / GRID_SIZE)
    const minGY = Math.floor(topLeft.y / GRID_SIZE)
    const maxGY = Math.floor(botRight.y / GRID_SIZE)

    // 根据当前缩放动态调整 tile 分辨率（放大时更高清）
    const targetScale = Math.max(1, Math.min(4, Math.floor(zoom)))
    if (targetScale !== tileScale) {
      tileScale = targetScale
      // 全量标脏，下一帧重建为新的高分辨率
      gridMap.forEach((_, k) => dirtyTiles.add(k))
    }

    // 网格线（可选）
    if (showGrid) {
      ctx.save()
      ctx.strokeStyle = '#e0e0e0'
      ctx.lineWidth = 1 / zoom
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
      ctx.restore()
    }

    // 先把脏 tile 重建掉，避免 drawImage 出现旧内容
    if (dirtyTiles.size) {
      for (const k of Array.from(dirtyTiles)) {
        rebuildTile(k)
        dirtyTiles.delete(k)
      }
    }

    // 将“世界层”按 tile 截图绘制到屏幕（平移/缩放时只做 drawImage）
    for (let gx = minGX; gx <= maxGX; gx++) {
      for (let gy = minGY; gy <= maxGY; gy++) {
        const k = `${gx},${gy}`
        const tile = tileMap.get(k)
        if (!tile) continue
        ctx.drawImage(tile, gx * GRID_SIZE, gy * GRID_SIZE)
      }
    }

    // 橡皮擦预览（只做高亮覆盖，不重画主体）
    if (erasingStrokes.size) {
      ctx.save()
      ctx.globalAlpha = 0.18
      ctx.strokeStyle = '#ffffff'
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      for (const stroke of erasingStrokes) {
        ctx.lineWidth = Math.max(1, stroke.width + 2)
        ctx.beginPath()
        ctx.moveTo(stroke.head.x, stroke.head.y)
        for (const p of stroke.points) {
          ctx.lineTo(p.x + stroke.head.x, p.y + stroke.head.y)
        }
        ctx.stroke()
      }
      ctx.restore()
    }

    ctx.restore()

    userQueue?.resetStroke()
  }
  let rafId = 0
  let lastCallTime = 0
  const rafRender = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    lastCallTime = performance.now() // 外部调用时间刷新

    // RAF 正在运行，直接更新 lastCallTime 即可
    if (rafId !== 0) return

    // 启动 RAF 循环
    const loop = (now: number) => {
      //50ms未调用 自动停止
      if (now - lastCallTime > 50) {
        cancelAnimationFrame(rafId)
        rafId = 0 // 必须重置，这样才能下次重新启动
        return
      }
      _render(ctx, canvas)
      // 保持 RAF 运行
      rafId = requestAnimationFrame(loop)
    }
    // 启动
    rafId = requestAnimationFrame(loop)
  }

  //新加入
  //橡皮擦实现
  // 在 newBoard 内部加一个 Set
  const erasingStrokes = new Set<Stroke>() // 正在被擦除（变透明）的笔画
  let lastErasedStrokes: Stroke[] = [] // 松开后真正删除的（用于 undo）
  let eraserPathProcessed = 0
  let lastEraserPoint: { x: number; y: number } | null = null
  function _removeStrokeFromGrid(stroke: Stroke) {
    // 删除前先记录覆盖的 tile，用于脏重建
    const willDirty = getStrokeCoveredCells(stroke)
    const seen = new Set<string>()
    const headKey = key(stroke.head.x, stroke.head.y)
    if (!seen.has(headKey)) {
      seen.add(headKey)
      const cell = gridMap.get(headKey)
      if (cell) {
        const idx = cell.indexOf(stroke)
        if (idx > -1) cell.splice(idx, 1)
        if (cell?.length === 0) gridMap.delete(headKey)
      }
    }
    stroke.points.forEach((p) => {
      const k = key(p.x + stroke.head.x, p.y + stroke.head.y)
      if (!seen.has(k)) {
        seen.add(k)
        const cell = gridMap.get(k)
        if (cell) {
          const idx = cell.indexOf(stroke)
          if (idx > -1) cell.splice(idx, 1)
          if (cell?.length === 0) gridMap.delete(k)
        }
      }
    })
    const idx = orderedStrokes.indexOf(stroke)
    if (idx > -1) {
      orderedStrokes.splice(idx, 1)
    }
    strokeIndex.delete(stroke.id)

    // 标记 tile 脏（下次 render 自动重建）
    willDirty.forEach((k) => dirtyTiles.add(k))
  }
  function _removeStrokeById(id: string): Stroke | undefined {
    const aim = strokeIndex.get(id)
    if (!aim) {
      return undefined
    }
    _removeStrokeFromGrid(aim)
    return aim
  }
  function _replaceStrokeId(oldId: string, newId: string) {
    if (!oldId || !newId || oldId === newId) {
      return
    }
    const aim = strokeIndex.get(oldId)
    if (!aim) {
      return
    }
    aim.id = newId
    strokeIndex.delete(oldId)
    strokeIndex.set(newId, aim)
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
    addStrokes: (strokes: Stroke[]): void => _addStrokes(strokes),
    renderStrokeToWorld: (stroke: Stroke): void => {
      // 该方法用于“需要重算某条笔画影响的区域”时触发刷新。
      // 常规 addStroke 已经会直接写入 tile，因此这里选择标记脏并等待下一次 render 重建。
      const stored = stroke.id ? strokeIndex.get(stroke.id) || stroke : stroke
      const cells = getStrokeCoveredCells(stored)
      for (const k of cells) dirtyTiles.add(k)
    },
    //渲染
    render: (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement): void =>
      rafRender(ctx, canvas),
    //控制视图(传入相对位置)
    setPan: (x: number, y: number, ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
      panX += x
      panY += y
      rafRender(ctx, canvas)
    },
    setPanAbsolute: (
      nextPanX: number,
      nextPanY: number,
      ctx: CanvasRenderingContext2D,
      canvas: HTMLCanvasElement,
    ) => {
      panX = nextPanX
      panY = nextPanY
      rafRender(ctx, canvas)
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
      rafRender(ctx, canvas)
    },
    setZoomAbsolute: (z: number, ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
      zoom = z
      rafRender(ctx, canvas)
    },
    resize: (width: number, height: number) => {
      vw.value = width
      vh.value = height
    },
    getPanx: () => panX,
    getPany: () => panY,
    getState: () => ({ panX, panY, zoom }),
    setState: (
      state: { panX: number; panY: number; zoom: number },
      ctx: CanvasRenderingContext2D,
      canvas: HTMLCanvasElement,
    ) => {
      panX = state.panX
      panY = state.panY
      zoom = state.zoom
      rafRender(ctx, canvas)
    },
    toWorldX: (x: number) => (x - panX) / zoom,
    toWorldY: (y: number) => (y - panY) / zoom,
    initBoard: (history: Stroke[], ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
      history.forEach((value) => {
        _addStroke(value)
      })
      rafRender(ctx, canvas)
    },
    replaceStrokeId: (oldId: string, newId: string) => _replaceStrokeId(oldId, newId),
    removeStrokesById: (ids: string[]): Stroke[] => {
      const removed: Stroke[] = []
      ids.forEach((id) => {
        const stroke = _removeStrokeById(id)
        if (stroke) {
          removed.push(stroke)
        }
      })
      return removed
    },
    getStrokeById: (id: string): Stroke | undefined => strokeIndex.get(id),
    clearAll: (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
      orderedStrokes.length = 0
      strokeIndex.clear()
      gridMap.clear()
      erasingStrokes.clear()
      lastErasedStrokes = []
      tileMap.clear()
      tileCtxMap.clear()
      dirtyTiles.clear()
      rafRender(ctx, canvas)
    },
    // 1. 开始橡皮擦（鼠标按下）
    startErasing: () => {
      erasingStrokes.clear()
      eraserPathProcessed = 0
      lastEraserPoint = null
    },

    // 2. 收集橡皮路径上的笔画（鼠标移动时频繁调用）
    // 橡皮大小设置
    collectErasingStrokes: (screenPoints: Point[], eraserRadius: number = 10) => {
      // 除去缩放保证相对屏幕大小不变
      eraserRadius /= zoom
      if (screenPoints.length === 0) return

      const worldPoints = screenPoints.map((p) => ({
        x: (p.x - panX) / zoom,
        y: (p.y - panY) / zoom,
      }))

      const processPoint = (point: { x: number; y: number }) => {
        const candidateKeys = new Set<string>()
        const span = Math.max(1, Math.ceil((eraserRadius * 2) / GRID_SIZE))
        for (let dx = -span; dx <= span; dx++) {
          for (let dy = -span; dy <= span; dy++) {
            candidateKeys.add(key(point.x + dx * GRID_SIZE, point.y + dy * GRID_SIZE))
          }
        }

        const candidates = new Set<Stroke>()
        candidateKeys.forEach((k) => {
          const list = gridMap.get(k)
          if (list) list.forEach((s) => candidates.add(s))
        })

        for (const stroke of candidates) {
          if (erasingStrokes.has(stroke)) continue

          const hitRadius = stroke.width / 2 + eraserRadius
          const hitRadius2 = hitRadius * hitRadius

          const headDist2 = (stroke.head.x - point.x) ** 2 + (stroke.head.y - point.y) ** 2
          if (headDist2 < hitRadius2) {
            erasingStrokes.add(stroke)
            continue
          }

          let hit = false
          const pts = stroke.points
          const hx = stroke.head.x
          const hy = stroke.head.y

          for (let i = 0; i < pts.length - 1; i++) {
            const p1 = pts[i]
            const p2 = pts[i + 1]

            const x1 = p1!.x + hx
            const y1 = p1!.y + hy
            const x2 = p2!.x + hx
            const y2 = p2!.y + hy

            const d2 = pointToSegmentDistance2(point.x, point.y, x1, y1, x2, y2)

            if (d2 <= hitRadius2) {
              hit = true
              break
            }
          }

          if (hit) {
            erasingStrokes.add(stroke)
          }
        }
      }

      for (let i = eraserPathProcessed; i < worldPoints.length; i++) {
        const current = worldPoints[i]
        if (!current) continue
        if (lastEraserPoint) {
          const dx = current.x - lastEraserPoint.x
          const dy = current.y - lastEraserPoint.y
          const distance = Math.hypot(dx, dy)
          const step = Math.max(1, eraserRadius * 0.5)
          const steps = Math.max(1, Math.floor(distance / step))
          for (let s = 1; s <= steps; s++) {
            const ratio = s / steps
            processPoint({
              x: lastEraserPoint.x + dx * ratio,
              y: lastEraserPoint.y + dy * ratio,
            })
          }
        }
        processPoint(current)
        lastEraserPoint = current
      }

      eraserPathProcessed = worldPoints.length
    },
    // 3. 确认擦除（鼠标松开）
    confirmErase: (): Stroke[] => {
      const deleted: Stroke[] = []
      erasingStrokes.forEach((stroke) => {
        _removeStrokeFromGrid(stroke)
        deleted.push(stroke)
      })
      lastErasedStrokes = deleted
      erasingStrokes.clear()
      eraserPathProcessed = 0
      lastEraserPoint = null
      return deleted // 返回被删除的笔画，用于 undo
    },

    // 4. 渲染时判断是否变透明（关键！）
    isStrokeBeingErased: (stroke: Stroke): boolean => {
      return erasingStrokes.has(stroke)
    },

    // 5. （可选）获取最近一次删除的笔画，用于 undo
    getLastErasedStrokes: (): Stroke[] => lastErasedStrokes,
    // 橡皮调用的渲染
    containQueue: (aim: strokeFlow) => {
      if (userQueue === null) {
        userQueue = aim
      }
    },
    getAllStrokes() {
      return [...orderedStrokes]
    },
    setShowGrid: (show: boolean) => {
      showGrid = show
    },
    toggleGrid: () => {
      showGrid = !showGrid
    },
    getShowGrid: () => showGrid,
  }
}

// 用于修改笔画加入表格的逻辑
// 工具：将线段 (x1,y1) → (x2,y2) 覆盖的网格全部加入
export function addLineCoveredCells(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  gridSize: number,
  put: (x: number, y: number) => void,
) {
  const dx = x2 - x1
  const dy = y2 - y1

  // 使用 DDA 网格穿越
  const steps = Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) / gridSize)
  if (steps <= 0) return

  const stepx = dx / steps
  const stepy = dy / steps

  for (let i = 0; i <= steps; i++) {
    const x = x1 + stepx * i
    const y = y1 + stepy * i
    put(x, y)
  }
}

/**
 * 工具：将整条笔画加入 gridMap（按线段覆盖）
 * 不依赖 newBoard，只要求你传入 stroke + gridMap + key方法
 */
export function addStrokeToGrid(
  stroke: {
    head: { x: number; y: number }
    points: { x: number; y: number }[]
    // 其他字段无所谓
  },
  gridMap: Map<string, any[]>,
  gridSize: number,
  key: (x: number, y: number) => string,
) {
  // 工具：向 gridMap 插入 stroke
  const seenKeys = new Set<string>()
  const put = (x: number, y: number) => {
    const k = key(x, y)
    if (seenKeys.has(k)) return
    seenKeys.add(k)
    if (!gridMap.has(k)) gridMap.set(k, [])
    gridMap.get(k)!.push(stroke)
  }

  const hx = stroke.head.x
  const hy = stroke.head.y

  // 1. 先加入 head 点
  put(hx, hy)

  // 2. 遍历所有线段
  const pts = stroke.points
  for (let i = 0; i < pts.length; i++) {
    const x1 = i === 0 ? hx : pts[i - 1]!.x + hx
    const y1 = i === 0 ? hy : pts[i - 1]!.y + hy
    const x2 = pts[i]!.x + hx
    const y2 = pts[i]!.y + hy

    addLineCoveredCells(x1, y1, x2, y2, gridSize, put)
  }
}
