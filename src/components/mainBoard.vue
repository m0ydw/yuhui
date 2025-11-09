<template>
  <div>
    <canvas
      width="600"
      height="600"
      id="drawboard"
      @mousedown="startDraw"
      @mousemove="drawing"
      @mouseup="stopDraw"
      @mouseleave="stopDraw"
    ></canvas>
  </div>
</template>

<script setup lang="ts">
import { ref, shallowRef, onMounted } from 'vue'
import type { Point, Stroke, Board } from '@/models/types'

import {
  newPoint,
  toRelativePoints,
  newStroke,
  setupHighResolutionCanvas,
  resizeCanvas,
  throttle,
  newBoard,
} from '@/utils'
const isDrawing = ref(false)
const nowColor = ref('#000000')
const penSize = ref(5)
const canvas = shallowRef()
const ctx = shallowRef()
const lastPoint = ref<Point>(newPoint())
const keyPoints = ref<Stroke>(newStroke())
const renderBoolean = ref(false)
const windowVw = ref()
const windowVh = ref()
let boardData: Board | undefined = undefined
//初始化
onMounted(() => {
  canvas.value = document.getElementById('drawboard')
  if (canvas.value) {
    windowVw.value = window.innerWidth
    windowVh.value = window.innerHeight
    //设置高分辨率
    ctx.value = setupHighResolutionCanvas(canvas.value)

    boardData = newBoard(1024, windowVw, windowVh)
    // 初次渲染
    boardData.render(ctx.value, canvas.value)
    //挂载实时改变分辨率的函数
    if (boardData)
      window.addEventListener(
        'resize',
        throttle(() => resizeCanvas(canvas.value, windowVw, windowVh, boardData!, ctx.value), 10),
      )
    //初始绘图样式？
  }
})
//methods
//绘画
const startDraw = (e: MouseEvent): void => {
  //初始化失败直接退出
  if (!ctx.value || !canvas.value) return
  //获取鼠标
  isDrawing.value = true
  const { offsetX, offsetY } = e

  lastPoint.value = { x: offsetX, y: offsetY, t: Date.now() }
  //开始新路径并移动到起点
  ctx.value.beginPath()
  ctx.value.moveTo(offsetX, offsetY)

  //笔画初始化
  keyPoints.value.head = lastPoint.value
  //id
  //points
  keyPoints.value.points = []
  keyPoints.value.color = nowColor.value
  keyPoints.value.tool = nowColor.value
  //now
  keyPoints.value.width = penSize.value
  //size??
  //设置样式
  ctx.value.strokeStyle = nowColor.value
  ctx.value.lineWidth = penSize.value

  //挂载开始渲染
  //启动渲染
  renderBoolean.value = true
  requestAnimationFrame(render)
}

const drawing = (e: MouseEvent): void => {
  // const now = Date.now()

  if (!isDrawing.value || !ctx.value || !canvas.value) return
  //初始化失败退出
  const { offsetX, offsetY } = e

  //与上个点重复不记录
  if (lastPoint.value.x === offsetX && lastPoint.value.y === offsetY) {
    return
  }
  //更新数组
  keyPoints.value.points.push(
    toRelativePoints(keyPoints.value.head, { x: offsetX, y: offsetY, t: Date.now() }),
  )
  //绘制线条已转入render中
}

const stopDraw = (e: MouseEvent): void => {
  if (!ctx.value || !isDrawing.value) return
  isDrawing.value = false
  //结束渲染
  // ctx.value.closePath()
  renderBoolean.value = false
  if (boardData) {
    boardData.addStroke(boardData.screenToWorldStroke(keyPoints.value))
    console.log('添加')
  }
}
//渲染
const render = (): void => {
  for (let i = keyPoints.value.now + 1; i < keyPoints.value.points.length; i++) {
    ctx.value.lineTo(
      (keyPoints.value.points[i] as Point).x + keyPoints.value.head.x,
      (keyPoints.value.points[i] as Point).y + keyPoints.value.head.y,
    )
    ctx.value.stroke()
  }
  //更新now
  keyPoints.value.now = keyPoints.value.points.length - 1
  if (renderBoolean.value) {
    requestAnimationFrame(render)
  }
}

//props
interface Props {
  catch?: Stroke
}
const props = withDefaults(defineProps<Props>(), {
  catch: () => newStroke(),
})
</script>

<style scoped></style>
