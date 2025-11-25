<template>
  <div class="toolBar" :style="positionStyle" ref="main">
    <hand></hand>
    <pen></pen>
    <div class="move" ref="move"></div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue';
import { toolBarPointer } from '@/models';
import hand from './toolBar/hand.vue'
import pen from './toolBar/pen.vue';
const position = ref({ x: 0, y: 0 })
const move = ref<HTMLDivElement | null>(null)
const main = ref<HTMLDivElement | null>(null)
const container = { w: 0, h: 0 }
//清理函数
let cleanup: (() => void) | null = null
const positionStyle = computed(() => ({
  left: `${position.value.x}px`,  // 直接修改 left
  top: `${position.value.y}px`,   // 直接修改 top
}))
//改变父容器位置
const changePosition = (px: number, py: number) => {
  //限制不超出屏幕
  px = Math.max(Math.min(px, window.innerWidth - container.w), 0)
  py = Math.max(Math.min(py, window.innerHeight - container.h), 0)
  position.value.x = px
  position.value.y = py
}

onMounted(() => {
  if (move.value && main.value) {
    container.w = main.value.offsetWidth
    container.h = main.value.offsetHeight
    // 初始位置
    position.value.x = window.innerWidth * 0.5 - container.w * 0.5
    cleanup = toolBarPointer(move.value, changePosition, position)
  }
})


//结束
onUnmounted(() => {
  cleanup?.()
})
</script>

<style>
.toolBar {
  position: absolute;
  width: 200px;
  padding: 5px;
  border: 1px solid silver;
  margin: 3px;
}

.toolBar .move {
  background-color: aqua;
  width: 50px;
  height: 50px;
}

.toolBar div {
  float: left;
  margin-left: 5px;
}

.toolBar>div:first-child {
  margin-left: 0px;
}
</style>
666
