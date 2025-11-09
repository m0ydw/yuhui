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

//对于points数组
