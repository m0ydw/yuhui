<!-- HandTool.vue -->
<template>
  <div class="handBtn hand" :class="{ active: isActive }" @pointerdown="onPointerDown" @pointerup="onPointerUp"
    @click.stop>
    <svg aria-hidden="true" focusable="false" role="img" viewBox="0 0 24 24" class="" fill="none" stroke-width="2"
      stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
      <g stroke-width="1.25">
        <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
        <path d="M8 13v-7.5a1.5 1.5 0 0 1 3 0v6.5"></path>
        <path d="M11 5.5v-2a1.5 1.5 0 1 1 3 0v8.5"></path>
        <path d="M14 5.5a1.5 1.5 0 0 1 3 0v6.5"></path>
        <path
          d="M17 7.5a1.5 1.5 0 0 1 3 0v8.5a6 6 0 0 1 -6 6h-2h.208a6 6 0 0 1 -5.012 -2.7a69.74 69.74 0 0 1 -.196 -.3c-.312 -.479 -1.407 -2.388 -3.286 -5.728a1.5 1.5 0 0 1 .536 -2.022a1.867 1.867 0 0 1 2.28 .28l1.47 1.47">
        </path>
      </g>
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
.handBtn {
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

.handBtn:hover {
  background: rgba(0, 0, 0, 0.08);
  color: #333;
}

.handBtn.active {
  background: #1976d2;
  color: white;
  box-shadow: 0 2px 8px rgba(25, 118, 210, 0.3);
}
</style>