import toolBarData from '@/stores/toolBarStores'
import type { Board } from './types'
const last = { x: 10000, y: 10000 }
let toolBarStores = toolBarData()
let drawCanvas: HTMLCanvasElement | null = null
let canvas: HTMLCanvasElement | null = null
let ctx: CanvasRenderingContext2D | null = null
let boardData: Board | null = null
let isHand: boolean = false
export function cursorRender(e: PointerEvent | null = null) {
  if (!canvas || !ctx || !boardData || !drawCanvas) return

  const dpr = window.devicePixelRatio || 1
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  // 清空画布
  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)
  let x, y
  if (e) {
    x = e.offsetX
    y = e.offsetY
    last.x = x
    last.y = y
  } else {
    x = last.x
    y = last.y
  }
  // 不该是手直接取消
  if (isHand && toolBarStores.getTool() !== 'hand') {
    removeHandLitsener()
  }
  switch (toolBarStores.getTool()) {
    case 'eraser':
      let zoom = boardData.getZoom()
      renderEraser(ctx, x, y, zoom)
      break
    case 'pen':
      renderPen(ctx, x, y)
      break
    case 'hand':
      if (isHand) return
      handUp()
      addHandListener()
      break
  }
}
// 传值联系
export function connectCursor(
  cav: HTMLCanvasElement,
  ct: CanvasRenderingContext2D,
  board: Board,
  draw: HTMLCanvasElement,
) {
  canvas = cav
  ctx = ct
  boardData = board
  drawCanvas = draw
}

//橡皮
interface EraserOptions {
  baseSize?: number // 橡皮擦在 zoom = 1 时的基础直径
  borderColor?: string // 圆形边框的颜色
  borderWidth?: number // 边框的线宽
}
function renderEraser(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  zoom: number,
  options: EraserOptions = {},
): void {
  // 1. 设置默认值
  const {
    baseSize = 10, // 基础半径为 20px
    borderColor = '#000000',
    borderWidth = 1,
  } = options

  // 2. 根据 zoom 计算真实的半径
  //    半径 = (基础直径 / 2) * 缩放级别
  const radius = baseSize

  // 3. 保存当前 canvas 状态
  ctx.save()

  // --- 4. 开始绘制 ---
  ctx.beginPath() // 开始一条新的路径

  // 设置描边样式
  ctx.lineWidth = borderWidth
  ctx.strokeStyle = borderColor

  // 绘制圆形路径
  // ctx.arc(x, y, radius, startAngle, endAngle)
  // startAngle = 0, endAngle = 2 * Math.PI 可以画一个完整的圆
  ctx.arc(x, y, radius, 0, Math.PI * 2)

  // 5. 执行描边操作 (而不是填充)
  ctx.stroke()

  // 6. 恢复 canvas 状态
  ctx.restore()
}

// pen
interface CrosshairOptions {
  size?: number // 十字光标的总尺寸（从一端到另一端）
  outerColor?: string // 外描边的颜色
  innerColor?: string // 内描边的颜色
  outerWidth?: number // 外描边的线宽
  innerWidth?: number // 内描边的线宽
  gap?: number // 中心留空的尺寸
}
function renderPen(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  options: CrosshairOptions = {},
): void {
  // 1. 设置默认值
  const {
    size = 20,
    outerColor = '#FFFFFF',
    innerColor = '#000000',
    outerWidth = 3,
    innerWidth = 1,
    gap = 2,
  } = options

  const halfSize = size / 2
  const halfGap = gap / 2

  // 保存当前 canvas 状态，以便后续恢复
  ctx.save()
  // --- 2. 绘制外层描边 (白色，较粗) ---
  ctx.lineWidth = outerWidth
  ctx.strokeStyle = outerColor
  ctx.lineCap = 'round' // 让线条末端变圆润，更好看

  ctx.beginPath()
  // 绘制水平线 (从左到中心留空，从中心留空到右)
  ctx.moveTo(x - halfSize, y)
  ctx.lineTo(x - halfGap, y)
  ctx.moveTo(x + halfGap, y)
  ctx.lineTo(x + halfSize, y)

  // 绘制垂直线 (从上到中心留空，从中心留空到下)
  ctx.moveTo(x, y - halfSize)
  ctx.lineTo(x, y - halfGap)
  ctx.moveTo(x, y + halfGap)
  ctx.lineTo(x, y + halfSize)

  ctx.stroke() // 执行绘制

  // --- 3. 绘制内层描边 (黑色，较细) ---
  ctx.lineWidth = innerWidth
  ctx.strokeStyle = innerColor
  // lineCap 继承自上面的 'round'

  ctx.beginPath()
  // 同样的方式绘制，但这次是在白色描边之上
  ctx.moveTo(x - halfSize, y)
  ctx.lineTo(x - halfGap, y)
  ctx.moveTo(x + halfGap, y)
  ctx.lineTo(x + halfSize, y)

  ctx.moveTo(x, y - halfSize)
  ctx.lineTo(x, y - halfGap)
  ctx.moveTo(x, y + halfGap)
  ctx.lineTo(x, y + halfSize)

  ctx.stroke() // 执行绘制

  // 恢复 canvas 状态到调用此函数之前
  ctx.restore()
}
// hand
function handUp() {
  if (!drawCanvas) return
  drawCanvas.style.cursor = 'grab'
}
function handDown() {
  if (!drawCanvas) return
  drawCanvas.style.cursor = 'grabbing'
}
function addHandListener() {
  isHand = true
  if (!drawCanvas) return
  drawCanvas.addEventListener('pointerdown', handDown)
  drawCanvas.addEventListener('pointerup', handUp)
}
function removeHandLitsener() {
  isHand = false
  if (!drawCanvas) return
  drawCanvas.removeEventListener('pointerdown', handDown)
  drawCanvas.removeEventListener('pointerup', handUp)
  drawCanvas.style.cursor = 'none'
}
