<template>
  <div class="tool" :class="{ active: isActive }" @pointerdown="pointerDown" @pointerup="pointerUp" @click.stop>
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
      <line x1="4" y1="15" x2="16" y2="5" />
    </svg>
  </div>
</template>

<script setup lang="ts">
import toolBarData from '@/stores/toolBarStores'
import { computed } from 'vue'

const toolData = toolBarData()

const pointerDown = (e: PointerEvent) => {
  const el = e.currentTarget as HTMLElement
  el.setPointerCapture(e.pointerId)
  toolData.setTool('line')
  toolData.changeSelectBar(true)
  e.stopPropagation()
  e.preventDefault()
}

const pointerUp = (e: PointerEvent) => {
  const el = e.currentTarget as HTMLElement
  el.releasePointerCapture(e.pointerId)
}

const isActive = computed(() => toolData.nowTool === 'line')
</script>

<style scoped>
.tool {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #666;
  user-select: none;
}

.tool:hover {
  background: rgba(0, 0, 0, 0.08);
  color: #333;
}

.tool.active {
  background: #1976d2;
  color: white;
  box-shadow: 0 2px 8px rgba(25, 118, 210, 0.3);
}

svg {
  width: 20px;
  height: 20px;
}
</style>

