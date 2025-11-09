import type { Ref } from 'vue'
export interface Point {
  x: number
  y: number
  t: number
  p?: number
}
export interface Stroke {
  head: Point
  id: string
  points: Point[]
  color: string
  tool: string
  now: number
  width: number
}
export type gridMap = Map<string, Stroke[]>
export interface Board {
  screenToWorldStroke: (st: Stroke) => Stroke
  worldToScreen: (wx: number, wy: number) => Point
  addStroke: (stroke: Stroke) => void
  render: (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => void
  setPan: (x: number, y: number) => void
  setZoom: (z: number) => void
  resize: (width: number, height: number) => void
}
export interface boardStatus {
  isDrawing: boolean
  isRender: boolean
  nowColor: string
  penSize: number
  windowVw: Ref<number>
  windowVh: Ref<number>
}
