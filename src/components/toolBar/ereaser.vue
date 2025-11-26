<template>
  <div class="tool-btn eraser" :class="{ active: isActive }" @pointerdown="onPointerDown" @pointerup="onPointerUp"
    @click.stop>
    <svg viewBox="0 0 24 24" width="28" height="28">
      <path d="M16.5 3L21 7.5L10.5 18L4 18L4 14.5L14.5 4L16.5 3Z" fill="none" stroke="currentColor" stroke-width="2" />
      <path d="M4 18L3 21L6 20L16.5 9.5L14.5 7.5L4 18Z" fill="currentColor" />
    </svg>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import toolBarData from '@/stores/toolBarStores'

const toolData = toolBarData()
const isActive = computed(() => toolData.nowTool === 'eraser')

const onPointerDown = (e: PointerEvent) => {
  const el = e.currentTarget as HTMLElement
  el.setPointerCapture(e.pointerId)
  toolData.setTool('eraser')
  toolData.changeSelectBar(true)
  e.stopPropagation()
  e.preventDefault()
}

const onPointerUp = (e: PointerEvent) => {
  const el = e.currentTarget as HTMLElement
  el.releasePointerCapture(e.pointerId)
}
</script>