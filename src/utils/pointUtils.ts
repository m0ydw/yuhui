import type { Point } from '@/models/types'
import { ref } from 'vue'

//新建point
export function newPoint(
  x: number = NaN,
  y: number = NaN,
  t: number = NaN,
  p: number = NaN,
): Point {
  return { x, y, t, p } as Point
}

//计算俩点距离
export function distanceTwoPoints(p1: Point, p2: Point): number {
  return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2)
}

//根据基准转换相对点
export function toRelativePoints(base: Point, Pt: Point): Point {
  return { x: Pt.x - base.x, y: Pt.y - base.y, p: Pt.p, t: Pt.t }
}

//点到线段的距离
export function pointToSegmentDistance2(
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): number {
  const A = px - x1
  const B = py - y1
  const C = x2 - x1
  const D = y2 - y1

  const dot = A * C + B * D
  const lenSq = C * C + D * D

  let t = dot / lenSq
  t = Math.max(0, Math.min(1, t))

  const closestX = x1 + t * C
  const closestY = y1 + t * D

  const dx = px - closestX
  const dy = py - closestY

  return dx * dx + dy * dy
}
