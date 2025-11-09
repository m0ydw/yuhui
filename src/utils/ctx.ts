import type { Ref } from 'vue'
import type { Board } from '@/models/types'
export function setupHighResolutionCanvas(canvas: HTMLCanvasElement) {
  //高分辨率设置函数
  const width: number = window.innerWidth
  const height: number = window.innerHeight
  // 获取设备像素比
  const dpr: number = window.devicePixelRatio || 1
  // 设置 Canvas 的实际分辨率
  canvas.width = width * dpr
  canvas.height = height * dpr
  // 设置 Canvas 的显示分辨率
  canvas.style.width = `${width}px`
  canvas.style.height = `${height}px`
  // 获取 Canvas 的上下文并进行缩放
  const ctx: CanvasRenderingContext2D = canvas.getContext('2d')!
  ctx.scale(dpr, dpr)
  return ctx
}
export function resizeCanvas(
  canvas: HTMLCanvasElement,
  vw: Ref<number>,
  vh: Ref<number>,
  board: Board,
  ctx: CanvasRenderingContext2D,
) {
  vw.value = window.innerWidth
  vh.value = window.innerHeight
  const dpr = window.devicePixelRatio || 1

  // 1. 更新 canvas 尺寸
  canvas.width = vw.value * dpr
  canvas.height = vh.value * dpr
  canvas.style.width = `${vw.value}px`
  canvas.style.height = `${vh.value}px`

  // 3.重置变换矩阵
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

  // 4. 渲染
  board.render(ctx, canvas)
}
