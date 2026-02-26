import { type Stroke } from '@/models'

interface ExportOptions {
  /** 边缘物理留白 (px)，默认 50 */
  padding?: number

  /** 背景色，传 undefined 为透明 */
  bgColor?: string

  /**
   * 目标最大边长 (px)，默认 4096。
   * 无论原图多大，都会缩放到这个范围内，保证高清且不崩溃。
   */
  targetSide?: number

  /** 图片格式 */
  type?: 'image/png' | 'image/jpeg'

  /** 图片质量 0~1 (仅 jpeg) */
  quality?: number

  /**
   * [可选] 强制纵横比 (宽/高)。
   * 例如: 16/9 (约 1.77) 或 4/3 (1.33)。
   * 如果不传，则图片尺寸跟随内容形状 (可能是细长条)。
   */
  aspectRatio?: number

  /** [可选] 外部传入的包围盒，传了可以省去遍历计算 */
  bounds?: { minX: number; maxX: number; minY: number; maxY: number }
}

/**
 * 将笔画数据导出为图片 (支持无限画布、自动缩放、强制比例)
 */
export async function boardDataToImage(
  strokes: Stroke[],
  options: ExportOptions = {},
): Promise<string> {
  const {
    padding = 50,
    bgColor = '#ffffff',
    targetSide = 4096,
    type = 'image/png',
    quality = 0.92,
    aspectRatio, // ✨ 新增：纵横比
    bounds,
  } = options

  if (!strokes || strokes.length === 0) {
    throw new Error('画布空白，无法导出')
  }

  // ─────────────────────────────────────────────────────────────
  // 1. 计算内容包围盒 (Content Bounding Box)
  // ─────────────────────────────────────────────────────────────
  let minX: number, maxX: number, minY: number, maxY: number

  if (bounds) {
    ;({ minX, maxX, minY, maxY } = bounds)
  } else {
    minX = Infinity
    minY = Infinity
    maxX = -Infinity
    maxY = -Infinity
    for (const stroke of strokes) {
      const hx = stroke.head.x,
        hy = stroke.head.y
      if (hx < minX) minX = hx
      if (hx > maxX) maxX = hx
      if (hy < minY) minY = hy
      if (hy > maxY) maxY = hy

      // 注意：points 是相对坐标
      for (const p of stroke.points) {
        const ax = hx + p.x,
          ay = hy + p.y
        if (ax < minX) minX = ax
        if (ax > maxX) maxX = ax
        if (ay < minY) minY = ay
        if (ay > maxY) maxY = ay
      }
    }
  }

  // 兜底检查
  if (!Number.isFinite(minX)) return ''

  const contentW = maxX - minX
  const contentH = maxY - minY
  const maxContentSide = Math.max(contentW, contentH)

  // ─────────────────────────────────────────────────────────────
  // 2. 计算智能留白 & 缩放比例
  // ─────────────────────────────────────────────────────────────

  // A. 智能 Padding：取 (用户设定值) 和 (目标尺寸的 5%) 中的较大者
  // 避免大图缩放后留白看起来太窄
  const safePadding = Math.max(padding, targetSide * 0.05)

  // B. 计算缩放比例
  // 逻辑：(目标尺寸 - 双倍留白) / 内容最大边
  const availableSide = targetSide - safePadding * 2
  if (availableSide <= 0) throw new Error('Padding 设置过大')

  const scale = availableSide / maxContentSide

  // ─────────────────────────────────────────────────────────────
  // 3. 计算画布尺寸 & 居中偏移
  // ─────────────────────────────────────────────────────────────

  // 这里的宽高是“内容+留白”的自然宽高
  let finalW = Math.floor(contentW * scale + safePadding * 2)
  let finalH = Math.floor(contentH * scale + safePadding * 2)

  // 居中偏移量 (默认 0)
  let offsetX = 0
  let offsetY = 0

  // ✨ 处理强制纵横比 (Aspect Ratio)
  if (aspectRatio) {
    const currentRatio = finalW / finalH

    if (currentRatio > aspectRatio) {
      // 情况 A: 当前太宽了 (比如长横幅)，需要增加高度来补齐比例
      // 保持宽度不变，算出目标高度
      const targetH = Math.floor(finalW / aspectRatio)
      // 计算垂直居中需要的偏移量
      offsetY = (targetH - finalH) / 2
      finalH = targetH
    } else {
      // 情况 B: 当前太高了 (比如竖长条)，需要增加宽度来补齐比例
      // 保持高度不变，算出目标宽度
      const targetW = Math.floor(finalH * aspectRatio)
      // 计算水平居中需要的偏移量
      offsetX = (targetW - finalW) / 2
      finalW = targetW
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 4. 绘图上下文准备
  // ─────────────────────────────────────────────────────────────
  const canvas = document.createElement('canvas')
  canvas.width = finalW
  canvas.height = finalH
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('无法创建 Canvas (OOM)')

  // 填充背景
  if (bgColor) {
    ctx.fillStyle = bgColor
    ctx.fillRect(0, 0, finalW, finalH)
  }

  // ─────────────────────────────────────────────────────────────
  // 5. 坐标变换 (矩阵魔法)
  // ─────────────────────────────────────────────────────────────
  // 顺序非常关键：

  // 1. 先把原点移到 (留白 + 居中偏移) 的位置
  ctx.translate(safePadding + offsetX, safePadding + offsetY)

  // 2. 执行缩放 (将内容缩放到适合的大小)
  ctx.scale(scale, scale)

  // 3. 将内容的左上角 (minX, minY) 移回原点
  ctx.translate(-minX, -minY)

  // ─────────────────────────────────────────────────────────────
  // 6. 绘制所有笔画
  // ─────────────────────────────────────────────────────────────
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  for (const stroke of strokes) {
    // 性能优化：剔除缩放后肉眼不可见的噪点
    if (stroke.width * scale < 0.05) continue

    ctx.beginPath()
    ctx.lineWidth = stroke.width // 线宽会自动被 scale 影响，保持比例
    ctx.strokeStyle = stroke.color

    ctx.moveTo(stroke.head.x, stroke.head.y)

    // 缓存变量减少属性访问
    const hx = stroke.head.x
    const hy = stroke.head.y
    const pts = stroke.points

    for (let i = 0; i < pts.length; i++) {
      const p = pts[i]
      ctx.lineTo(hx + p!.x, hy + p!.y)
    }
    ctx.stroke()
  }

  return canvas.toDataURL(type, quality)
}
