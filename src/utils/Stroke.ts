import type { Stroke, Point } from '@/models/types'
import { newPoint } from './pointUtils'

export function newStroke(
  head: Point = newPoint(),
  id: string = '',
  points: Point[] = [],
  color: string = '#000000', //‘’
  tool: string = '',
  now: number = -1,
  width: number = 5, //0
  finish: boolean = false,
): Stroke {
  return {
    head,
    id,
    points,
    color,
    tool,
    now,
    width,
    finish,
  } as Stroke
}
