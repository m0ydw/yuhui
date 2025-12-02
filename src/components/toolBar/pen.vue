<template>
  <div class="pen" @pointerdown="pointerDown" @pointerup="pointerUp" @click.stop>
    <svg aria-hidden="true" focusable="false" role="img" viewBox="0 0 20 20" class="" fill="none" stroke="currentColor"
      stroke-linecap="round" stroke-linejoin="round">
      <g stroke-width="1.25">
        <path clip-rule="evenodd"
          d="m7.643 15.69 7.774-7.773a2.357 2.357 0 1 0-3.334-3.334L4.31 12.357a3.333 3.333 0 0 0-.977 2.357v1.953h1.953c.884 0 1.732-.352 2.357-.977Z">
        </path>
        <path d="m11.25 5.417 3.333 3.333"></path>
      </g>
    </svg>
  </div>
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
