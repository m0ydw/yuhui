<template>
  <div class="pen" @pointerdown=""></div>
</template>

<script setup lang="ts">
import toolBarData from '@/stores/toolBarStores';
let toolData = toolBarData()
const pointerDown = (e: PointerEvent) => {
  const el = e.currentTarget as HTMLElement
  el.setPointerCapture(e.pointerId)
  toolData.setTool('pen')
}
</script>

<style>
.toolBar .pen {
  width: 50px;
  height: 50px;
  background-color: brown;
}
</style>
