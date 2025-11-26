<template>
  <div class="pen" @pointerdown="pointerDown" @pointerup="pointerUp" @click.stop></div>
</template>

<script setup lang="ts">
import toolBarData from '@/stores/toolBarStores';
let toolData = toolBarData()
const pointerDown = (e: PointerEvent) => {
  const el = e.currentTarget as HTMLElement
  el.setPointerCapture(e.pointerId)
  toolData.setTool('pen')
  // 锁定
  toolData.changeSelectBar(true)
  e.stopPropagation()
  e.preventDefault()


}
function pointerUp(e: PointerEvent) {
  const el = e.currentTarget as HTMLElement;
  el.releasePointerCapture(e.pointerId); // ③ 释放
}
</script>

<style>
.toolBar .pen {
  width: 50px;
  height: 50px;
  background-color: brown;
}
</style>
