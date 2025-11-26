<!-- HandTool.vue -->
<template>
  <div class="tool-btn hand" :class="{ active: isActive }" @pointerdown="onPointerDown" @pointerup="onPointerUp"
    @click.stop>
    <svg viewBox="0 0 24 24" width="28" height="28">
      <path d="M9 3V7H7V3H9ZM11 3V11H13V3H11ZM15 3V9H17V3H15ZM19 3V11H21V3H19Z" fill="currentColor" />
      <path d="M3 21L7 17H21L17 21H3Z" fill="currentColor" />
    </svg>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import toolBarData from '@/stores/toolBarStores'

const toolData = toolBarData()

const isActive = computed(() => toolData.nowTool === 'hand')

const onPointerDown = (e: PointerEvent) => {
  const el = e.currentTarget as HTMLElement
  el.setPointerCapture(e.pointerId)

  // 切换工具 + 锁定工具栏
  toolData.setTool('hand')
  toolData.changeSelectBar(true)

  e.stopPropagation()
  e.preventDefault()
}

const onPointerUp = (e: PointerEvent) => {
  const el = e.currentTarget as HTMLElement
  el.releasePointerCapture(e.pointerId)
}
</script>

<style scoped>
.tool-btn {
  width: 50px;
  height: 50px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #666;
  user-select: none;
}

.tool-btn:hover {
  background: rgba(0, 0, 0, 0.08);
  color: #333;
}

.tool-btn.active {
  background: #1976d2;
  color: white;
  box-shadow: 0 2px 8px rgba(25, 118, 210, 0.3);
}
</style>