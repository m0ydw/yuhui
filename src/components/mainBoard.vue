<template>
  <div>
    <canvas width="600" height="600" id="drawboard"></canvas>
  </div>
</template>

<script setup lang="ts">
import { ref, shallowRef, onMounted, onUnmounted, computed, watch } from 'vue'
import { canvasPointer, type Board, type Stroke, type strokeFlow, sendIAmJoin, addMainBoardEvent } from '@/models'
import {
  newStrokeFlow,
  newStroke,
  setupHighResolutionCanvas,
  resizeCanvas,
  throttle,
  newBoard,
} from '@/utils'
import { useRoute, useRouter } from 'vue-router'
import { myWebsocketClient } from '@/models/webSocket/cilentExample'
const router = useRouter()
const route = useRoute()
let hasPlayer = false
//输入队列
let userQueue: null | ReturnType<typeof newStrokeFlow> = null
let userId = '0'
// // 进入单人模式
// router.push('/draw')
// 进入多人模式，指定房间
// router.push('')
const canvas = shallowRef()
const ctx = shallowRef()
const windowVw = ref()
const windowVh = ref()
let boardData: Board | undefined = undefined
//清理函数
let cleanup: (() => void) | null = null
//初始化
onMounted(async () => {
  //确定模式
  await router.isReady()
  const roomId = route.query.roomId
  if (roomId) {
    //多人
    userId = await myWebsocketClient.connect()
    //尝试加入对应room
    myWebsocketClient.send(sendIAmJoin(roomId.toString(), userId))

    //等待服务器响应
    const joinRes = await myWebsocketClient.waitForMessage('JoinStatus')
    console.log('响应')
    switch (joinRes.data.status) {
      case true:
        console.log('连接成功')
        break

      case false:
        console.log('连接失败')
        break
    }
    //成功发送
    hasPlayer = true
  } else {
    //单人
  }
  canvas.value = document.getElementById('drawboard')
  //核心逻辑
  if (canvas.value) {
    windowVw.value = window.innerWidth
    windowVh.value = window.innerHeight
    //设置高分辨率ctx
    ctx.value = setupHighResolutionCanvas(canvas.value)
    //board实例
    boardData = newBoard(1024, windowVw, windowVh)
    //创建用户队列
    userQueue = newStrokeFlow(userId, ctx.value, boardData)
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
  //不同的逻辑
  if (hasPlayer && userQueue) {
    //挂载监听
    addMainBoardEvent(myWebsocketClient, userQueue)
  } else {

  }
})

//结束时
onUnmounted(() => {
  cleanup?.()
})


</script>

<style scoped></style>
