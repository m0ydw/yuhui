<template>
  <div>
    <canvas width="600" height="600" id="drawboard"></canvas>
  </div>
</template>

<script setup lang="ts">
import { ref, shallowRef, onMounted, onUnmounted } from 'vue'
import { canvasPointer, type Board, type Stroke } from '@/models'
import {
  newStrokeFlow,
  newStroke,
  setupHighResolutionCanvas,
  resizeCanvas,
  throttle,
  newBoard,
} from '@/utils'
const canvas = shallowRef()
const ctx = shallowRef()
const windowVw = ref()
const windowVh = ref()
let boardData: Board | undefined = undefined
//清理函数
let cleanup: (() => void) | null = null
//初始化
onMounted(() => {
  canvas.value = document.getElementById('drawboard')
  if (canvas.value) {
    windowVw.value = window.innerWidth
    windowVh.value = window.innerHeight
    //设置高分辨率ctx
    ctx.value = setupHighResolutionCanvas(canvas.value)
    //board实例
    boardData = newBoard(1024, windowVw, windowVh)
    //创建用户队列
    const userQueue = newStrokeFlow(0, ctx.value, boardData)
    //注册监听
    cleanup = canvasPointer(canvas.value, ctx.value, boardData, userQueue)
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

//结束时
onUnmounted(() => {
  cleanup?.()
})

//props
interface Props {
  catch?: Stroke
}
const props = withDefaults(defineProps<Props>(), {
  catch: () => newStroke(),
})
</script>

<style scoped></style>
