import type { Stroke, Point } from '@/models/types'
import { newPoint } from './pointUtils'

export function newStroke(
  head: Point = newPoint(),
  id: string = '',
  points: Point[] = [],
  color: string = '',
  tool: string = '',
  now: number = -1,
  width: number = 0,
): Stroke {
  return {
    head,
    id,
    points,
    color,
    tool,
    now,
    width,
  } as Stroke
}
